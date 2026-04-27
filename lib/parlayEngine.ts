import { TennisPick, TennisMatch, FootballPick, FootballMatch } from '@prisma/client';

type PickWithMatch = (TennisPick & { match: TennisMatch }) | (FootballPick & { match: FootballMatch });

export interface Parlay {
  type: 'solid' | 'aggressive' | 'usa';
  picks: any[];
  totalOdds: number;
  combinedProb: number;
  dayLabel?: string;
}

/**
 * Quality score for a pick used to select the "Picks más sólidos".
 *
 * Design principles:
 *  1. HIGH PROBABILITY is the primary driver (we want picks that WIN, not just pays well)
 *  2. Odds must be in a sensible range — avoid extreme lockdowns (< 1.20) and longshots (> 2.50)
 *  3. Positive EV is a bonus but not mandatory; a 72% probability pick at 1.30 is solid
 *  4. Market type matters — RESULT/GOALS/BTTS/Moneyline are more reliable than CORNERS/HANDICAP
 */
function computeSolidScore(pick: any): number {
  const prob   = pick.estimatedProb ?? (pick.confidenceScore / 100);
  const odds   = pick.odds ?? 1.5;
  const ev     = pick.expectedValue ?? (prob * odds - 1);
  const market = (pick.market || pick.type || '').toUpperCase();

  // ── 1. Probability weight (0–60 pts): heavy emphasis on wins
  // sigmoid-shaped reward: above 60% grows fast, plateaus near 85%
  const probScore = Math.min(60, Math.pow(Math.max(0, prob - 0.50), 0.7) * 200);

  // ── 2. Odds range penalty / bonus (-20 to +10 pts)
  // Optimal range 1.25–2.00. Penalise extreme lows and highs.
  let oddsScore = 0;
  if (odds >= 1.25 && odds <= 2.00) {
    oddsScore = 10;                           // sweet spot
  } else if (odds >= 2.00 && odds <= 2.50) {
    oddsScore = 5;                            // acceptable
  } else if (odds > 2.50) {
    oddsScore = -15;                          // too risky / longshot
  } else if (odds < 1.20) {
    oddsScore = -20;                          // near-certainty = boring & low value
  }

  // ── 3. EV bonus (0–15 pts)
  const evScore = Math.min(15, Math.max(0, ev * 100));

  // ── 4. Market reliability (0–15 pts)
  // More reliable markets score higher
  const reliableMarkets = ['MATCH_WINNER', 'GANADOR', '1X2', 'MONEYLINE', 'GOLES', 'GOALS',
                            'BTTS', 'AMBOS_ANOTAN', 'GAMES_OVER_UNDER', 'DOUBLE_CHANCE',
                            'DOBLE_OPORTUNIDAD', 'FIRST_SET_WINNER'];
  const isReliable = reliableMarkets.some(m => market.includes(m));
  const marketScore = isReliable ? 15 : 5;

  // ── 5. Hard gate: picks below 55% probability or above 85% are penalised
  const gateMultiplier = prob < 0.55 ? 0.4 : prob > 0.85 ? 0.7 : 1.0;

  return (probScore + oddsScore + evScore + marketScore) * gateMultiplier;
}

/**
 * Select the best N picks from a flat list, ensuring:
 *  - At most 1 pick per match/game (no double-dipping)
 *  - If multiple sports are present, prefer sport diversity
 *  - Only picks with prob >= 0.55 and odds in [1.20, 2.50]
 */
function selectBestPicks(allPicks: any[], maxPicks = 4): any[] {
  // Hard filter: reasonable odds + probability threshold
  const eligible = allPicks.filter(p => {
    const prob = p.estimatedProb ?? (p.confidenceScore / 100);
    const odds = p.odds ?? 1.5;
    return prob >= 0.55 && odds >= 1.20 && odds <= 2.80;
  });

  // Score each pick
  const scored = eligible.map(p => ({ pick: p, score: computeSolidScore(p) }));
  scored.sort((a, b) => b.score - a.score);

  // Greedy selection: one pick per match, spread across sports when possible
  const selected: any[] = [];
  const usedMatchIds   = new Set<string>();
  const sportCounts    : Record<string, number> = {};

  for (const { pick } of scored) {
    if (selected.length >= maxPicks) break;

    const matchId = pick.matchId ?? pick.gameId ?? pick.match?.id ?? `${pick.sport}-${pick.description}`;
    if (usedMatchIds.has(matchId)) continue;

    const sport   = pick.sport ?? 'unknown';
    const count   = sportCounts[sport] ?? 0;

    // Allow at most 2 picks from the same sport in a 4-pick selection
    if (count >= 2 && selected.length < maxPicks - 1) continue;

    usedMatchIds.add(matchId);
    sportCounts[sport] = count + 1;
    selected.push(pick);
  }

  // Fallback: if we couldn't fill maxPicks with diversity constraints, relax sport limit
  if (selected.length < maxPicks) {
    const fallback = scored
      .map(s => s.pick)
      .filter(p => {
        const matchId = p.matchId ?? p.gameId ?? p.match?.id ?? `${p.sport}-${p.description}`;
        return !usedMatchIds.has(matchId);
      });
    for (const p of fallback) {
      if (selected.length >= maxPicks) break;
      const matchId = p.matchId ?? p.gameId ?? p.match?.id ?? `${p.sport}-${p.description}`;
      usedMatchIds.add(matchId);
      selected.push(p);
    }
  }

  return selected;
}


export function generateParlays(tennisMatches: any[], footballMatches: any[]): Parlay[] {
  const allTennisPicks   = tennisMatches.flatMap(m => m.picks.map((p: any) => ({ ...p, match: m, sport: 'tennis' })));
  const allFootballPicks = footballMatches.flatMap(m => m.picks.map((p: any) => ({ ...p, match: m, sport: 'football' })));
  const allPicks         = [...allTennisPicks, ...allFootballPicks];

  if (allPicks.length < 1) return [];

  // ─── Picks más sólidos del día ─────────────────────────────────────────────
  const solidPicks = selectBestPicks(allPicks, 4);

  if (solidPicks.length < 2) return [];

  const totalOdds    = solidPicks.reduce((acc, p) => acc * p.odds, 1);
  const combinedProb = solidPicks.reduce((acc, p) => {
    const prob = p.estimatedProb ?? (p.confidenceScore / 100);
    return acc * prob;
  }, 1);

  return [{
    type: 'solid',
    picks: solidPicks,
    totalOdds,
    combinedProb,
  }];
}
