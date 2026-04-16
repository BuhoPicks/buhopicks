import { TennisPick, TennisMatch, FootballPick, FootballMatch } from '@prisma/client';

type PickWithMatch = (TennisPick & { match: TennisMatch }) | (FootballPick & { match: FootballMatch });

export interface Parlay {
  type: 'solid' | 'aggressive' | 'usa';
  picks: any[];
  totalOdds: number;
  dayLabel?: string;
}

export function generateParlays(tennisMatches: any[], footballMatches: any[]): Parlay[] {
  const allTennisPicks = tennisMatches.flatMap(m => m.picks.map((p: any) => ({ ...p, match: m, sport: 'tennis' })));
  const allFootballPicks = footballMatches.flatMap(m => m.picks.map((p: any) => ({ ...p, match: m, sport: 'football' })));
  const allPicks = [...allTennisPicks, ...allFootballPicks];

  if (allPicks.length < 2) return [];

  // ─── Solid Parlay (2-3 picks, high confidence, safe odds) ───
  // Filter for picks with confidence > 70 and decent odds
  const solidCandidates = allPicks
    .filter(p => p.confidenceScore >= 70 && p.odds <= 1.9)
    .sort((a, b) => b.confidenceScore - a.confidenceScore);

  const solidPicks = solidCandidates.slice(0, 3);
  const solidOdds = solidPicks.reduce((acc, p) => acc * p.odds, 1);

  // ─── Aggressive Parlay (2-3 picks, high EV, higher odds) ───
  const aggressiveCandidates = allPicks
    .filter(p => p.expectedValue > 0.05) // Positive EV
    .sort((a, b) => b.expectedValue - a.expectedValue);

  // Ensure we don't pick the exact same matches if possible, or at least different markets
  const aggressivePicks: any[] = [];
  const seenMatches = new Set();
  
  for (const pick of aggressiveCandidates) {
    const matchId = pick.match.id;
    if (!seenMatches.has(matchId)) {
      aggressivePicks.push(pick);
      seenMatches.add(matchId);
    }
    if (aggressivePicks.length >= 3) break;
  }
  
  const aggressiveOdds = aggressivePicks.reduce((acc, p) => acc * p.odds, 1);

  const parlays: Parlay[] = [];
  
  if (solidPicks.length >= 2) {
    parlays.push({
      type: 'solid',
      picks: solidPicks,
      totalOdds: solidOdds
    });
  }

  if (aggressivePicks.length >= 2) {
    parlays.push({
      type: 'aggressive',
      picks: aggressivePicks,
      totalOdds: aggressiveOdds
    });
  }

  return parlays;
}
