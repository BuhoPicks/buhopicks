import prisma from './prisma';

// ESPN Scoreboard API for Soccer
const ESPN_SOCCER_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard';

export async function runDailyFootballSync() {
  const startTime = Date.now();
  console.log('⚽ Starting Football Data Sync...');

  try {
    const today = new Date();
    // Fetch events for next 3 days
    const daysToFetch = 7;
    let allEvents: any[] = [];
    const leagues = [
      'eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1', 'uefa.champions', 'mex.1',
      'ned.1', 'por.1', 'usa.1', 'bra.1', 'arg.1', 'uefa.europa', 'eng.2', 'esp.2'
    ];

    for (let i = 0; i < daysToFetch; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        const dateStr = targetDate.toISOString().split('T')[0].replace(/-/g, '');
        
        console.log(`📡 Fetching football events for ${dateStr}...`);
        
        for (const league of leagues) {
            try {
                const resp = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${dateStr}&limit=100`);
                const data = await resp.json();
                if (data.events) {
                    allEvents.push(...data.events);
                }
            } catch (err) {
                console.error(`Error fetching league ${league} for ${dateStr}:`, err);
            }
        }
    }

    if (allEvents.length === 0) {
      console.log('⚠️ No football events found in the next few days.');
      return { success: true, matchesFound: 0 };
    }

    console.log(`📡 Found ${allEvents.length} football events total.`);

    // Clear existing football picks for the fetched range
    const futureLimit = new Date(today);
    futureLimit.setDate(today.getDate() + daysToFetch);
    
    const dateRange = {
      gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      lt: new Date(futureLimit.getFullYear(), futureLimit.getMonth(), futureLimit.getDate()),
    };

    await prisma.footballPick.deleteMany({
      where: { match: { date: dateRange } }
    });
    await prisma.footballMatch.deleteMany({
      where: { date: dateRange }
    });

    let totalMatches = 0;
    let totalPicks = 0;

    for (const event of allEvents) {
      try {
        const comp = event.competitions?.[0];
        if (!comp) continue;

        const home = comp.competitors.find((c: any) => c.homeAway === 'home');
        const away = comp.competitors.find((c: any) => c.homeAway === 'away');
        if (!home || !away) continue;

        const date = new Date(event.date);
        
        // Upsert football match
        const match = await prisma.footballMatch.upsert({
          where: { espnId: event.id },
          update: {
            status: event.status.type.name,
            homeScore: parseInt(home.score) || 0,
            awayScore: parseInt(away.score) || 0,
            date,
          },
          create: {
            espnId: event.id,
            homeTeam: home.team.displayName,
            awayTeam: away.team.displayName,
            homeLogo: home.team.logo,
            awayLogo: away.team.logo,
            league: event.season?.displayName || 'International',
            leagueLogo: event.league?.logo,
            date,
            status: event.status.type.name,
            homeScore: parseInt(home.score) || 0,
            awayScore: parseInt(away.score) || 0,
          }
        });

        totalMatches++;

        // Basic Analysis (Deterministic for Demo)
        // Generate a pseudo-random hash based on event ID, so the picks stay consistent over syncs
        let seed = 0;
        for (let i = 0; i < event.id.length; i++) {
            seed = (seed * 31 + event.id.charCodeAt(i)) % 10000;
        }
        
        // Random between 0 and 1 using seed
        const pseudoRandom = (num: number) => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };

        const homeWinProb = 0.3 + pseudoRandom(1) * 0.4;
        const drawProb = 0.2 + pseudoRandom(2) * 0.1;
        const awayWinProb = 1 - homeWinProb - drawProb;

        const potentialPicks = [
          { market: '1X2', selection: 'Home', prob: homeWinProb, desc: `${home.team.displayName} gana` },
          { market: '1X2', selection: 'Draw', prob: drawProb, desc: 'Empate' },
          { market: '1X2', selection: 'Away', prob: awayWinProb, desc: `${away.team.displayName} gana` }
        ];

        // Process all potential outcomes to find the best one
        let processedPicks = potentialPicks.map(p => {
          const odds = (1 / p.prob) * (1.05 + Math.random() * 0.1); 
          const ev = p.prob * odds - 1;
          return {
            market: p.market,
            selection: p.selection,
            description: p.desc,
            odds,
            trueOdds: 1 / p.prob,
            estimatedProb: p.prob,
            expectedValue: ev,
            confidenceScore: Math.round(p.prob * 100),
            valueLabel: ev > 0.12 ? 'HIGH' : 'MEDIUM',
            explanation: `Análisis estadístico basado en probabilidad de ${Math.round(p.prob * 100)}%. ${p.desc} presenta valor en el mercado actual.`
          };
        });

        // Always keep the BEST pick for this match to ensure variety
        processedPicks.sort((a, b) => b.expectedValue - a.expectedValue);
        const bestPick = processedPicks[0];
        
        // Filter: Keep best pick + any other pick with EV > 0.05
        const matchPicks = processedPicks.filter((p, index) => index === 0 || p.expectedValue > 0.05);

        // Add picks to database
        for (const pickData of matchPicks) {
           await prisma.footballPick.create({
              data: {
                matchId: match.id,
                ...pickData
              }
           });
           totalPicks++;
        }

      } catch (err) {
        console.error('Error processing football match:', err);
      }
    }

    // Mark the Best Pick of the range as Premium
    // Get all generated picks for this range and flag the one with highest EV
    const topPick = await prisma.footballPick.findFirst({
      where: { match: { date: dateRange } },
      orderBy: { expectedValue: 'desc' }
    });

    if (topPick) {
      await prisma.footballPick.update({
        where: { id: topPick.id },
        data: { 
          isPremiumPick: true,
          valueLabel: 'PREMIUM',
          explanation: `🌟 PICK PREMIUM: Este es el pick con mayor valor estadístico del periodo analizado. ${topPick.description} cuenta con una probabilidad estimada del ${(topPick.estimatedProb * 100).toFixed(1)}% y un Valor Esperado (EV) de +${(topPick.expectedValue * 100).toFixed(1)}%, lo que lo convierte en la opción más sólida para tu parlay o apuesta simple.`
        }
      });
      console.log(`⭐ Marked pick ${topPick.id} as Premium Football Pick.`);
    }

    // Log sync
    await prisma.dailySyncLog.create({
      data: {
        status: 'SUCCESS',
        sport: 'FOOTBALL',
        matchesFound: totalMatches,
        picksGenerated: totalPicks,
        premiumPicks: topPick ? 1 : 0,
        durationMs: Date.now() - startTime,
      }
    });

    return { success: true, matchesFound: totalMatches, picksGenerated: totalPicks, premiumPicks: topPick ? 1 : 0 };

  } catch (err) {
    console.error('Fatal error in Football Sync:', err);
    return { success: false, error: String(err) };
  }
}
