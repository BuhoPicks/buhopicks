import { TennisPick, TennisMatch, FootballPick, FootballMatch } from '@prisma/client';

type PickWithMatch = (TennisPick & { match: TennisMatch }) | (FootballPick & { match: FootballMatch });

export interface Parlay {
  type: 'solid' | 'aggressive' | 'usa';
  picks: any[];
  totalOdds: number;
  combinedProb: number;
  dayLabel?: string;
}

export function generateParlays(tennisMatches: any[], footballMatches: any[]): Parlay[] {
  const allTennisPicks = tennisMatches.flatMap(m => m.picks.map((p: any) => ({ ...p, match: m, sport: 'tennis' })));
  const allFootballPicks = footballMatches.flatMap(m => m.picks.map((p: any) => ({ ...p, match: m, sport: 'football' })));
  const allPicks = [...allTennisPicks, ...allFootballPicks];

  if (allPicks.length < 2) return [];

  // ─── Parlay del Día (3-4 picks, top ranked) ───
  const dailyCandidates = [...allPicks].sort((a, b) => {
    // Rank by a mix of confidence and expected value
    const scoreA = (a.confidenceScore / 100) + a.expectedValue;
    const scoreB = (b.confidenceScore / 100) + b.expectedValue;
    return scoreB - scoreA;
  });

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
  const dailyProb = dailyPicks.reduce((acc, p) => acc * (p.estimatedProb || (p.confidenceScore / 100)), 1);


  // ─── Aggressive Parlay (2-3 picks, highest odds among remaining) ───
  const aggressiveCandidates = allPicks
    .filter(p => !dailyMatches.has(p.match.id)) 
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
  const aggressiveProb = aggressivePicks.reduce((acc, p) => acc * (p.estimatedProb || (p.confidenceScore / 100)), 1);


  const parlays: Parlay[] = [];
  
  if (dailyPicks.length >= 2) {
    parlays.push({
      type: 'solid',
      picks: dailyPicks,
      totalOdds: dailyOdds,
      combinedProb: dailyProb
    });
  }

  if (aggressivePicks.length >= 2) {
    parlays.push({
      type: 'aggressive',
      picks: aggressivePicks,
      totalOdds: aggressiveOdds,
      combinedProb: aggressiveProb
    });
  }

  return parlays;
}

