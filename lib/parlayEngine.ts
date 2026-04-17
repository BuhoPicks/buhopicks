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

  // ─── Parlay del Día (3-4 picks, high confidence, extremely solid) ───
  // Filter for top quality picks across both sports
  const dailyCandidates = allPicks
    .filter(p => p.confidenceScore >= 65)
    .sort((a, b) => b.expectedValue - a.expectedValue);

  const dailyPicks: any[] = [];
  const dailyMatches = new Set();
  for (const pick of dailyCandidates) {
    if (!dailyMatches.has(pick.match.id)) {
      dailyPicks.push(pick);
      dailyMatches.add(pick.match.id);
    }
    if (dailyPicks.length >= 4) break;
  }

  const dailyOdds = dailyPicks.reduce((acc, p) => acc * p.odds, 1);

  // ─── Aggressive Parlay (2-3 picks, high risk/reward) ───
  const aggressiveCandidates = allPicks
    .filter(p => !dailyMatches.has(p.match.id) && p.expectedValue > 0.03) 
    .sort((a, b) => b.odds - a.odds);

  const aggressivePicks: any[] = [];
  const aggMatches = new Set();
  for (const pick of aggressiveCandidates) {
    if (!aggMatches.has(pick.match.id)) {
      aggressivePicks.push(pick);
      aggMatches.add(pick.match.id);
    }
    if (aggressivePicks.length >= 3) break;
  }
  
  const aggressiveOdds = aggressivePicks.reduce((acc, p) => acc * p.odds, 1);

  const parlays: Parlay[] = [];
  
  if (dailyPicks.length >= 2) {
    parlays.push({
      type: 'solid',
      picks: dailyPicks,
      totalOdds: dailyOdds
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

