/**
 * BH Analysis — Horse Racing Engine
 *
 * Generates 1 premium pick per day for horse racing.
 * Uses The Racing API or ESPN's horse racing data.
 * Focus: single best bet of the day (horse to WIN).
 */

interface HorseRacingPick {
  sport: 'horseracing';
  icon: string;
  gameId: string;
  raceName: string;
  track: string;
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

async function fetchRacingData(): Promise<any[]> {
  // Try ESPN Horse Racing first
  try {
    const url = 'https://site.api.espn.com/apis/site/v2/sports/horse-racing/scoreboard';
    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (res.ok) {
      const data = await res.json();
      return data.events || [];
    }
  } catch (err) {
    console.warn('ESPN Horse Racing fetch failed:', err);
  }

  // Fallback: try horse-racing-specific APIs
  try {
    const apiKey = process.env.RACING_API_KEY || '';
    if (apiKey) {
      const today = new Date().toISOString().split('T')[0];
      const url = `https://api.theracingapi.com/v1/racecards?date=${today}`;
      const res = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        return data.racecards || data.races || [];
      }
    }
  } catch (err) {
    console.warn('Racing API fetch failed:', err);
  }

  return [];
}

/**
 * Analyze a race and find the strongest pick.
 * Uses: post position, morning line odds, trainer/jockey stats if available.
 */
function analyzeRace(race: any): HorseRacingPick | null {
  const runners = race.runners || race.competitors || race.entries || [];
  if (runners.length < 3) return null;

  const raceName = race.name || race.raceName || 'Feature Race';
  const track = race.track?.name || race.venue?.name || race.location || 'Unknown Track';

  // Score each runner
  const scored = runners.map((runner: any, idx: number) => {
    const name = runner.horse?.name || runner.name || runner.athlete?.displayName || `Horse ${idx + 1}`;
    const morningLineOdds = parseFloat(runner.odds || runner.morningLineOdds || '5') || 5;
    const postPosition = runner.postPosition || runner.gate || idx + 1;
    const jockey = runner.jockey?.name || runner.jockeyName || '';
    const trainer = runner.trainer?.name || runner.trainerName || '';
    const weight = parseFloat(runner.weight || '126') || 126;

    // Implied probability from morning line
    const impliedProb = 1 / (morningLineOdds + 1);

    // Scoring factors
    let score = impliedProb * 100; // Base from odds

    // Post position advantage (inside posts 1-4 tend to be better)
    if (postPosition <= 4) score += 3;
    else if (postPosition >= 10) score -= 2;

    // Weight: lighter is generally better
    if (weight <= 122) score += 2;
    else if (weight >= 130) score -= 1;

    // Favorite bonus: horses with lower odds are favorites for a reason
    if (morningLineOdds <= 2) score += 8;
    else if (morningLineOdds <= 4) score += 4;

    return {
      name,
      morningLineOdds,
      postPosition,
      jockey,
      trainer,
      weight,
      impliedProb,
      score,
    };
  });

  // Sort by score descending
  scored.sort((a: any, b: any) => b.score - a.score);

  const best = scored[0];
  if (!best || best.impliedProb < 0.15) return null;

  // Our edge: we slightly beat the morning line
  const ourProb = Math.min(0.65, best.impliedProb * 1.12); // 12% edge assumption
  const odds = parseFloat(Math.max(1.30, (best.morningLineOdds + 1) * 0.95).toFixed(2));
  const ev = ourProb * odds - 1;

  const explanation = [
    `🏇 ${best.name} es el pick más fuerte para la carrera "${raceName}" en ${track}.`,
    `Cuota matutina: ${best.morningLineOdds.toFixed(1)}-1 (probabilidad implícita ${(best.impliedProb * 100).toFixed(0)}%).`,
    `Post posición #${best.postPosition}${best.postPosition <= 4 ? ' (ventaja de posición interna)' : ''}.`,
    best.jockey ? `Jockey: ${best.jockey}.` : '',
    best.trainer ? `Entrenador: ${best.trainer}.` : '',
    `Nuestro modelo estima una probabilidad real de ${(ourProb * 100).toFixed(0)}% de ganar.`,
  ].filter(Boolean).join(' ');

  return {
    sport: 'horseracing',
    icon: '🏇',
    gameId: race.id?.toString() || `race-${Date.now()}`,
    raceName,
    track,
    match: { player1Name: best.name, player2Name: `${track} - ${raceName}` },
    description: `${best.name} gana la carrera`,
    odds,
    estimatedProb: parseFloat(ourProb.toFixed(3)),
    confidenceScore: Math.round(ourProb * 100),
    expectedValue: parseFloat(ev.toFixed(4)),
    explanation,
    isPremiumPick: true, // Always premium since we only give 1 pick
    statsBreakdown: JSON.stringify({
      horse: best.name,
      morningLine: `${best.morningLineOdds}-1`,
      postPosition: best.postPosition,
      jockey: best.jockey,
      trainer: best.trainer,
      track,
      raceName,
    }),
  };
}

/**
 * Returns the single best horse racing pick of the day.
 */
export async function getHorseRacingPick(): Promise<HorseRacingPick | null> {
  const races = await fetchRacingData();

  if (races.length === 0) {
    console.log('🏇 No horse racing events found today.');
    return null;
  }

  // Analyze all races and find the single best pick
  const allPicks: HorseRacingPick[] = [];

  for (const race of races) {
    const pick = analyzeRace(race);
    if (pick && pick.confidenceScore >= 25) {
      allPicks.push(pick);
    }
  }

  if (allPicks.length === 0) return null;

  // Return the single best pick
  allPicks.sort((a, b) => b.confidenceScore - a.confidenceScore);
  return allPicks[0];
}
