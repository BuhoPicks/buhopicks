/**
 * BH Analysis — eSports Engine
 *
 * Generates picks for top eSports leagues (LoL, CS2, Valorant, Dota 2)
 * using PandaScore API for real match data.
 *
 * Returns max 3 high-confidence picks per day + 1 premium pick.
 */

const PANDASCORE_BASE = 'https://api.pandascore.co';

async function fetchPandaScore(endpoint: string): Promise<any[]> {
  // PandaScore free tier: 1000 requests/hour
  const token = process.env.PANDASCORE_API_KEY || '';
  try {
    const url = `${PANDASCORE_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      'User-Agent': 'BuhoPicks/1.0',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
      headers,
    });
    if (!res.ok) {
      console.warn(`PandaScore API returned ${res.status} for ${endpoint}`);
      return [];
    }
    return res.json();
  } catch (err) {
    console.error('PandaScore fetch error:', err);
    return [];
  }
}

interface EsportsPick {
  sport: 'esports';
  icon: string;
  gameId: string;
  game: string;
  match: { player1Name: string; player2Name: string };
  description: string;
  odds: number;
  estimatedProb: number;
  confidenceScore: number;
  expectedValue: number;
  explanation: string;
  isPremiumPick: boolean;
  statsBreakdown: string;
}

function getGameIcon(game: string): string {
  switch (game.toLowerCase()) {
    case 'lol': case 'league-of-legends': return '🎮';
    case 'cs2': case 'csgo': case 'cs-go': return '🔫';
    case 'valorant': return '🎯';
    case 'dota2': case 'dota-2': return '⚔️';
    default: return '🕹️';
  }
}

function getGameLabel(slug: string): string {
  switch (slug.toLowerCase()) {
    case 'lol': case 'league-of-legends': return 'League of Legends';
    case 'cs2': case 'csgo': case 'cs-go': return 'Counter-Strike 2';
    case 'valorant': return 'Valorant';
    case 'dota2': case 'dota-2': return 'Dota 2';
    default: return slug;
  }
}

/**
 * Generates eSports picks based on PandaScore upcoming matches.
 * Falls back to ESPN/simulation data if PandaScore key is not set.
 */
export async function getEsportsPicks(): Promise<EsportsPick[]> {
  const todayISO = new Date().toISOString().split('T')[0];
  const tomorrowISO = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const games = ['lol', 'cs2', 'valorant', 'dota2'];
  const allPicks: EsportsPick[] = [];

  if (process.env.PANDASCORE_API_KEY) {
    // Fetch from PandaScore API
    for (const game of games) {
      try {
        const matches = await fetchPandaScore(
          `/${game === 'cs2' ? 'csgo' : game}/matches/upcoming?per_page=10&filter[begin_at]=${todayISO},${tomorrowISO}`
        );

        for (const match of matches) {
          if (!match.opponents || match.opponents.length < 2) continue;

          const t1 = match.opponents[0]?.opponent;
          const t2 = match.opponents[1]?.opponent;
          if (!t1 || !t2) continue;

          // Use PandaScore's ranking/seed info for probability
          const t1Rank = t1.ranking?.ranking || 999;
          const t2Rank = t2.ranking?.ranking || 999;

          const rankDiff = t2Rank - t1Rank;
          const baseProb = 0.50 + Math.max(-0.30, Math.min(0.30, rankDiff * 0.005));
          const prob = Math.max(0.35, Math.min(0.80, baseProb));

          const fav = prob >= 0.50 ? t1 : t2;
          const dog = prob >= 0.50 ? t2 : t1;
          const favProb = Math.max(prob, 1 - prob);

          if (favProb < 0.60) continue; // Only high-confidence picks

          const odds = parseFloat((1 / (favProb - 0.04) * 0.95).toFixed(2));
          const ev = favProb * odds - 1;

          allPicks.push({
            sport: 'esports',
            icon: getGameIcon(game),
            gameId: match.id?.toString() || `${game}-${Date.now()}`,
            game: getGameLabel(game),
            match: { player1Name: fav.name || fav.acronym || 'Team 1', player2Name: dog.name || dog.acronym || 'Team 2' },
            description: `${fav.name || fav.acronym} gana vs ${dog.name || dog.acronym}`,
            odds,
            estimatedProb: parseFloat(favProb.toFixed(3)),
            confidenceScore: Math.round(favProb * 100),
            expectedValue: parseFloat(ev.toFixed(4)),
            explanation: `${fav.name} (Ranking #${t1Rank < t2Rank ? t1Rank : t2Rank}) tiene una ventaja clara sobre ${dog.name} (Ranking #${t1Rank < t2Rank ? t2Rank : t1Rank}) en ${getGameLabel(game)}. Probabilidad estimada: ${(favProb * 100).toFixed(0)}%.`,
            isPremiumPick: false,
            statsBreakdown: JSON.stringify({ game: getGameLabel(game), league: match.league?.name, t1Rank, t2Rank }),
          });
        }
      } catch (err) {
        console.error(`Error fetching ${game} matches:`, err);
      }
    }
  }

  // Fallback: if no PandaScore key or no results, generate simulated top picks
  if (allPicks.length === 0) {
    // Use ESPN eSports or generate from known upcoming major tournaments
    const fallbackPicks = await generateFallbackEsportsPicks();
    allPicks.push(...fallbackPicks);
  }

  // Sort by confidence, take top 3
  allPicks.sort((a, b) => b.confidenceScore - a.confidenceScore);
  const topPicks = allPicks.slice(0, 3);

  // Mark top as premium
  if (topPicks.length > 0) topPicks[0].isPremiumPick = true;

  return topPicks;
}

/**
 * Fallback: fetch eSports events from ESPN's public API
 */
async function generateFallbackEsportsPicks(): Promise<EsportsPick[]> {
  const picks: EsportsPick[] = [];

  // ESPN has eSports under "esports" sport category
  const esportsGames = [
    { slug: 'lol', espnSlug: 'league-of-legends', label: 'League of Legends', icon: '🎮' },
    { slug: 'csgo', espnSlug: 'csgo', label: 'Counter-Strike 2', icon: '🔫' },
  ];

  for (const game of esportsGames) {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/esports/${game.espnSlug}/scoreboard`;
      const res = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });

      if (!res.ok) continue;
      const data = await res.json();

      for (const event of (data.events || [])) {
        const comp = event.competitions?.[0];
        if (!comp) continue;

        const state = event.status?.type?.state;
        if (state === 'post') continue;

        const c1 = comp.competitors?.[0];
        const c2 = comp.competitors?.[1];
        if (!c1 || !c2) continue;

        const t1Name = c1.team?.displayName || c1.team?.name || 'Team 1';
        const t2Name = c2.team?.displayName || c2.team?.name || 'Team 2';

        // Use records for probability estimation
        const r1 = c1.records?.find((r: any) => r.type === 'total')?.summary || '0-0';
        const r2 = c2.records?.find((r: any) => r.type === 'total')?.summary || '0-0';

        const [w1, l1] = r1.split('-').map(Number);
        const [w2, l2] = r2.split('-').map(Number);
        const pct1 = (w1 || 0) / ((w1 || 0) + (l1 || 0) || 1);
        const pct2 = (w2 || 0) / ((w2 || 0) + (l2 || 0) || 1);

        const edge = Math.abs(pct1 - pct2);
        if (edge < 0.10) continue;

        const favName = pct1 >= pct2 ? t1Name : t2Name;
        const dogName = pct1 >= pct2 ? t2Name : t1Name;
        const favPct = Math.max(pct1, pct2);

        const prob = Math.min(0.78, 0.52 + edge * 0.45);
        if (prob < 0.60) continue;

        const odds = parseFloat((1 / (prob - 0.04) * 0.95).toFixed(2));
        const ev = prob * odds - 1;

        picks.push({
          sport: 'esports',
          icon: game.icon,
          gameId: event.id,
          game: game.label,
          match: { player1Name: favName, player2Name: dogName },
          description: `${favName} gana vs ${dogName}`,
          odds,
          estimatedProb: parseFloat(prob.toFixed(3)),
          confidenceScore: Math.round(prob * 100),
          expectedValue: parseFloat(ev.toFixed(4)),
          explanation: `${favName} tiene un record de ${pct1 >= pct2 ? r1 : r2} frente a ${dogName} (${pct1 >= pct2 ? r2 : r1}) en ${game.label}. Con ${(prob * 100).toFixed(0)}% de probabilidad, es el pick más seguro de esta serie.`,
          isPremiumPick: false,
          statsBreakdown: JSON.stringify({ game: game.label, favRecord: pct1 >= pct2 ? r1 : r2, dogRecord: pct1 >= pct2 ? r2 : r1, edge: `${(edge * 100).toFixed(1)}%` }),
        });
      }
    } catch (err) {
      console.error(`eSports fallback error for ${game.slug}:`, err);
    }
  }

  return picks;
}
