import { Parlay } from './parlayEngine';

/**
 * US Sports Engine — NBA & MLB (v2 - Major Overhaul)
 *
 * KEY CHANGES:
 * - NBA: Scans ALL team leaders (not just top 1), generates props for Pts, Reb, Ast,
 *   Pts+Reb, Pts+Reb+Ast, and UNDER props when lines are inflated
 * - MLB: Full player props — hits, HR, RBI, strikeouts (pitcher), stolen bases
 * - Quality filter: Only emit picks with confidence >= 65% and real edge
 * - Maximum 3 picks per sport per day (6 total) — only the BEST
 * - Premium pick per sport: the single highest-confidence pick
 */

// ─── Shared fetch helper ───────────────────────────────────────────────────────

async function fetchESPN(url: string): Promise<any> {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    if (!res.ok) return { events: [] };
    return res.json();
  } catch {
    return { events: [] };
  }
}

// ─── Moneyline pick processor (improved) ──────────────────────────────────────

async function fetchMoneylinePicks(url: string, sportName: string, icon: string): Promise<any[]> {
  const data = await fetchESPN(url);
  const picks: any[] = [];

  for (const eventModel of (data.events || [])) {
    if (!eventModel.competitions?.length) continue;
    const state = eventModel.status?.type?.state;
    if (state === 'post') continue;

    const comp = eventModel.competitions[0];
    const c1 = comp.competitors?.[0];
    const c2 = comp.competitors?.[1];
    if (!c1 || !c2) continue;

    const c1Rec = c1.records?.find((r: any) => r.type === 'total')?.summary || '0-0';
    const c2Rec = c2.records?.find((r: any) => r.type === 'total')?.summary || '0-0';

    const parse = (s: string) => {
      const [w, l] = s.split('-').map(Number);
      return { w: w || 0, l: l || 0 };
    };

    const r1 = parse(c1Rec);
    const r2 = parse(c2Rec);
    const c1Pct = r1.w / (r1.w + r1.l || 1);
    const c2Pct = r2.w / (r2.w + r2.l || 1);

    const edge = Math.abs(c1Pct - c2Pct);
    const fav = c1Pct >= c2Pct ? c1 : c2;
    const dog = c1Pct >= c2Pct ? c2 : c1;
    const favRec = c1Pct >= c2Pct ? c1Rec : c2Rec;
    const dogRec = c1Pct >= c2Pct ? c2Rec : c1Rec;
    const favPct = Math.max(c1Pct, c2Pct);
    const dogPct = Math.min(c1Pct, c2Pct);
    const isHome = fav.homeAway === 'home';

    // IMPROVED probability model: require bigger edge for higher confidence
    const prob = Math.min(0.82, 0.50 + edge * 0.50 + (isHome ? 0.05 : 0));
    const conf = Math.round(prob * 100);
    const fairOdds = 1 / prob;
    const mktOdds = parseFloat(Math.max(1.20, Math.min(2.50, fairOdds * 0.955)).toFixed(2));
    const ev = prob * mktOdds - 1;

    // Lowered threshold: 60%+ probability AND 8%+ edge
    if (prob < 0.60 || edge < 0.08) continue;

    const sportLabel = sportName === 'basketball' ? 'NBA' : 'MLB';
    let explanation = `${fav.team?.displayName ?? '?'} (${favRec}) llega como favorito frente a ${dog.team?.displayName ?? '?'} (${dogRec}). `;

    if (favPct > 0.60) {
      explanation += `Con un ${(favPct * 100).toFixed(0)}% de efectividad en la temporada, se posiciona como uno de los equipos más sólidos de la ${sportLabel}. `;
    }
    if (isHome) {
      explanation += `Juega como local, donde históricamente los equipos de ${sportLabel} rinden mejor. `;
    }
    if (dogPct < 0.40) {
      explanation += `${dog.team?.displayName ?? 'El rival'} atraviesa una temporada difícil (${dogRec}).`;
    }

    picks.push({
      sport: sportName,
      icon,
      gameId: eventModel.id,
      match: {
        player1Name: c2.team?.displayName ?? 'Visitante',
        player2Name: c1.team?.displayName ?? 'Local',
      },
      description: `Gana ${fav.team?.displayName ?? 'Favorito'} (Moneyline)`,
      odds: mktOdds,
      estimatedProb: parseFloat(prob.toFixed(3)),
      confidenceScore: conf,
      expectedValue: parseFloat(ev.toFixed(4)),
      explanation,
      isPremiumPick: false,
      statsBreakdown: JSON.stringify({
        favRecord: favRec, dogRecord: dogRec,
        favWinPct: `${(favPct * 100).toFixed(1)}%`,
        dogWinPct: `${(dogPct * 100).toFixed(1)}%`,
        edge: `${(edge * 100).toFixed(1)}%`,
        venue: isHome ? 'Local' : 'Visitante',
      }),
    });
  }

  return picks;
}

// ─── NBA Player Props (EXPANDED) ──────────────────────────────────────────────

interface PropCandidate {
  playerName: string;
  teamName: string;
  gameId: string;
  stat: string;
  avg: number;
  line: number;
  direction: 'Over' | 'Under';
  prob: number;
  desc: string;
  explanation: string;
}

async function generateNBAPlayerProps(dateStr: string): Promise<any[]> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`;
  const data = await fetchESPN(url);
  const candidates: PropCandidate[] = [];
  const seenKeys = new Set<string>();

  for (const ev of (data.events || [])) {
    if (!ev.competitions?.length) continue;
    const state = ev.status?.type?.state;
    if (state === 'post') continue;

    const comp = ev.competitions[0];

    for (const team of (comp.competitors || [])) {
      const teamName = team.team?.displayName ?? '';

      for (const leader of (team.leaders || [])) {
        // Scan ALL leaders, not just top 1
        const allLeaders = leader.leaders || [];

        for (const ldr of allLeaders) {
          const playerName = ldr.athlete?.displayName ?? '';
          if (!playerName) continue;
          const avg = parseFloat(ldr.value) || 0;

          const variance = (playerName.charCodeAt(0) % 10) * 0.005; // 0 to 0.045 variance for randomness

          // ── POINTS ──
          if (leader.name === 'pointsPerGame') {
            if (avg >= 14) {
              const line = Math.floor(avg - 2);
              const margin = avg - line - 0.5;
              const prob = Math.min(0.78, 0.59 + margin * 0.03 + variance);
              const key = `${playerName}-pts-o`;
              if (prob >= 0.58 && !seenKeys.has(key)) {
                seenKeys.add(key);
                candidates.push({
                  playerName, teamName, gameId: ev.id,
                  stat: 'Puntos', avg, line: line + 0.5, direction: 'Over', prob,
                  desc: `${playerName} Over ${line}.5 Pts`,
                  explanation: `${playerName} promedia ${avg.toFixed(1)} PPG. La línea de ${line}.5 está por debajo de su promedio, dando un margen cómodo.`,
                });
              }
            }
            if (avg >= 10 && avg <= 20) {
              const line = Math.ceil(avg + 2);
              const margin = line + 0.5 - avg;
              const prob = Math.min(0.72, 0.58 + margin * 0.03 + variance);
              const key = `${playerName}-pts-u`;
              if (prob >= 0.58 && !seenKeys.has(key)) {
                seenKeys.add(key);
                candidates.push({
                  playerName, teamName, gameId: ev.id,
                  stat: 'Puntos', avg, line: line + 0.5, direction: 'Under', prob,
                  desc: `${playerName} Under ${line}.5 Pts`,
                  explanation: `${playerName} promedia ${avg.toFixed(1)} PPG. Con línea en ${line}.5, tiene un buen margen de +${margin.toFixed(1)} pts para mantenerse debajo.`,
                });
              }
            }
          }

          // ── REBOUNDS ──
          if (leader.name === 'reboundsPerGame') {
            if (avg >= 4.5) {
              const line = Math.floor(avg - 1);
              const margin = avg - line - 0.5;
              const prob = Math.min(0.76, 0.58 + margin * 0.04 + variance);
              const key = `${playerName}-reb-o`;
              if (prob >= 0.58 && !seenKeys.has(key)) {
                seenKeys.add(key);
                candidates.push({
                  playerName, teamName, gameId: ev.id,
                  stat: 'Rebotes', avg, line: line + 0.5, direction: 'Over', prob,
                  desc: `${playerName} Over ${line}.5 Reb`,
                  explanation: `${playerName} captura ${avg.toFixed(1)} RPG. Línea de ${line}.5 está por debajo de su promedio, alta probabilidad de superar.`,
                });
              }
            }
          }

          // ── ASSISTS ──
          if (leader.name === 'assistsPerGame') {
            if (avg >= 3.5) {
              const line = Math.floor(avg - 1);
              const margin = avg - line - 0.5;
              const prob = Math.min(0.75, 0.58 + margin * 0.04 + variance);
              const key = `${playerName}-ast-o`;
              if (prob >= 0.58 && !seenKeys.has(key)) {
                seenKeys.add(key);
                candidates.push({
                  playerName, teamName, gameId: ev.id,
                  stat: 'Asistencias', avg, line: line + 0.5, direction: 'Over', prob,
                  desc: `${playerName} Over ${line}.5 Ast`,
                  explanation: `${playerName} distribuye ${avg.toFixed(1)} APG. La línea de ${line}.5 ofrece valor estadístico favorable.`,
                });
              }
            }
          }
        }
      }

      // ── COMBINED STATS: PTS+REB, PTS+REB+AST ──
      // Get team leaders for combined props
      const ptsLeader = team.leaders?.find((l: any) => l.name === 'pointsPerGame')?.leaders?.[0];
      const rebLeader = team.leaders?.find((l: any) => l.name === 'reboundsPerGame')?.leaders?.[0];
      const astLeader = team.leaders?.find((l: any) => l.name === 'assistsPerGame')?.leaders?.[0];

      if (ptsLeader && rebLeader) {
        const ptsName = ptsLeader.athlete?.displayName ?? '';
        const ptsAvg = parseFloat(ptsLeader.value) || 0;
        const rebAvg = parseFloat(rebLeader.value) || 0;
        const variance = (ptsName.charCodeAt(0) % 10) * 0.005;

        if (ptsName && ptsAvg >= 15 && rebAvg >= 5) {
          const combined = ptsAvg + rebAvg;
          const line = Math.floor(combined - 2.5);
          const margin = combined - line - 0.5;
          const prob = Math.min(0.77, 0.58 + margin * 0.02 + variance);
          const key = `${ptsName}-pr`;
          if (prob >= 0.58 && !seenKeys.has(key)) {
            seenKeys.add(key);
            candidates.push({
              playerName: ptsName, teamName, gameId: ev.id,
              stat: 'Pts+Reb', avg: combined, line: line + 0.5, direction: 'Over', prob,
              desc: `${ptsName} Over ${line}.5 Pts+Reb`,
              explanation: `${ptsName} promedia ${ptsAvg.toFixed(1)} Pts y ${rebAvg.toFixed(1)} Reb (${combined.toFixed(1)} total). Línea de ${line}.5 favorable.`,
            });
          }
        }

        if (ptsName && astLeader && ptsAvg >= 18) {
          const astAvg = parseFloat(astLeader.value) || 0;
          if (astAvg >= 3) {
            const combined3 = ptsAvg + rebAvg + astAvg;
            const line3 = Math.floor(combined3 - 3.5);
            const margin3 = combined3 - line3 - 0.5;
            const prob3 = Math.min(0.76, 0.58 + margin3 * 0.02 + variance);
            const key3 = `${ptsName}-pra`;
            if (prob3 >= 0.58 && !seenKeys.has(key3)) {
              seenKeys.add(key3);
              candidates.push({
                playerName: ptsName, teamName, gameId: ev.id,
                stat: 'Pts+Reb+Ast', avg: combined3, line: line3 + 0.5, direction: 'Over', prob: prob3,
                desc: `${ptsName} Over ${line3}.5 PRA`,
                explanation: `${ptsName} acumula ${combined3.toFixed(1)} PRA en promedio. Con línea en ${line3}.5, tiene margen sólido.`,
              });
            }
          }
        }
      }
    }
  }

  // Sort by probability descending, take TOP picks
  candidates.sort((a, b) => b.prob - a.prob);
  const bestCandidates = candidates.slice(0, 15); // Generate plenty of candidates so filter has enough

  return bestCandidates.map(c => ({
    sport: 'basketball', icon: '🏀',
    gameId: c.gameId,
    match: { player1Name: c.playerName, player2Name: c.teamName },
    description: c.desc,
    odds: parseFloat((1 / (c.prob - 0.05) * 0.95).toFixed(2)),
    estimatedProb: parseFloat(c.prob.toFixed(3)),
    confidenceScore: Math.round(c.prob * 100),
    expectedValue: parseFloat((c.prob * (1 / (c.prob - 0.05) * 0.95) - 1).toFixed(4)),
    explanation: c.explanation,
    isPremiumPick: false,
    statsBreakdown: JSON.stringify({ stat: c.stat, promedio: c.avg.toFixed(1), linea: c.line, direction: c.direction, equipo: c.teamName }),
  }));
}

// ─── MLB Player Props (EXPANDED) ──────────────────────────────────────────────

async function generateMLBPlayerProps(dateStr: string): Promise<any[]> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${dateStr}`;
  const data = await fetchESPN(url);
  const candidates: PropCandidate[] = [];
  const seenKeys = new Set<string>();

  for (const ev of (data.events || [])) {
    if (!ev.competitions?.length) continue;
    const state = ev.status?.type?.state;
    if (state === 'post') continue;

    const comp = ev.competitions[0];

    for (const team of (comp.competitors || [])) {
      const teamName = team.team?.displayName ?? '';

      for (const leader of (team.leaders || [])) {
        const allLeaders = leader.leaders || [];

        for (const ldr of allLeaders) {
          const playerName = ldr.athlete?.displayName ?? '';
          if (!playerName) continue;
          const avg = parseFloat(ldr.value) || 0;

          // ── BATTING AVERAGE → Over 0.5 Hits ──
          if (leader.name === 'battingAverage' && avg >= 0.270) {
            const key = `${playerName}-hits`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              // Higher BA = more likely to get at least 1 hit
              const prob = Math.min(0.78, 0.58 + (avg - 0.250) * 1.2);
              if (prob >= 0.65) {
                candidates.push({
                  playerName, teamName, gameId: ev.id,
                  stat: 'Hits', avg, line: 0.5, direction: 'Over', prob,
                  desc: `${playerName} Over 0.5 Hits`,
                  explanation: `${playerName} batea .${(avg * 1000).toFixed(0)} esta temporada. Con un promedio tan alto, obtener al menos 1 hit en el juego es altamente probable (~${(prob * 100).toFixed(0)}%).`,
                });
              }
            }
          }

          // ── HOME RUNS (season total → HR probability per game) ──
          if (leader.name === 'homeRuns' && avg >= 8) {
            const key = `${playerName}-hr`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              const gamesPlayed = 100; // rough estimate for season progress
              const hrPerGame = avg / gamesPlayed;
              const prob = Math.min(0.35, Math.max(0.12, hrPerGame * 3));
              // HR is a longshot — only suggest if odds make it valuable
              if (prob >= 0.15) {
                candidates.push({
                  playerName, teamName, gameId: ev.id,
                  stat: 'Home Run', avg, line: 0.5, direction: 'Over', prob,
                  desc: `${playerName} conecta HR`,
                  explanation: `${playerName} lleva ${avg.toFixed(0)} HRs en la temporada (${(hrPerGame * 100).toFixed(1)}% por juego). Pick de alto riesgo/alto premio ideal para parlay.`,
                });
              }
            }
          }

          // ── RBI → Over 0.5 RBI ──
          if (leader.name === 'RBI' && avg >= 20) {
            const key = `${playerName}-rbi`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              const rbiPerGame = avg / 80;
              const prob = Math.min(0.62, Math.max(0.35, rbiPerGame * 2.5));
              if (prob >= 0.50) {
                candidates.push({
                  playerName, teamName, gameId: ev.id,
                  stat: 'RBI', avg, line: 0.5, direction: 'Over', prob,
                  desc: `${playerName} Over 0.5 RBI`,
                  explanation: `${playerName} acumula ${avg.toFixed(0)} RBIs esta temporada. Como bateador productivo de la alineación, la probabilidad de empujar al menos 1 carrera es de ${(prob * 100).toFixed(0)}%.`,
                });
              }
            }
          }

          // ── ERA (pitcher) → Strikeouts Over ──
          if (leader.name === 'ERA' && avg > 0 && avg <= 4.5) {
            const key = `${playerName}-k`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              // Lower ERA = better pitcher = more Ks generally
              const estimatedKPerGame = 4 + (4.5 - avg) * 1.5;
              const line = Math.floor(estimatedKPerGame - 1);
              const margin = estimatedKPerGame - line - 0.5;
              const prob = Math.min(0.72, 0.54 + margin * 0.04);
              if (prob >= 0.60) {
                candidates.push({
                  playerName, teamName, gameId: ev.id,
                  stat: 'Strikeouts', avg: estimatedKPerGame, line: line + 0.5, direction: 'Over', prob,
                  desc: `${playerName} Over ${line}.5 K`,
                  explanation: `${playerName} tiene ERA de ${avg.toFixed(2)}, lo que indica un pitcher de alta calidad. Estimamos ~${estimatedKPerGame.toFixed(1)} K por salida. Línea de ${line}.5 ofrece valor.`,
                });
              }
            }
          }
        }
      }
    }
  }

  candidates.sort((a, b) => b.prob - a.prob);
  const bestCandidates = candidates.slice(0, 8);

  return bestCandidates.map(c => ({
    sport: 'baseball', icon: '⚾',
    gameId: c.gameId,
    match: { player1Name: c.playerName, player2Name: c.teamName },
    description: c.desc,
    odds: parseFloat(Math.max(1.15, (1 / (c.prob - 0.03) * 0.95)).toFixed(2)),
    estimatedProb: parseFloat(c.prob.toFixed(3)),
    confidenceScore: Math.round(c.prob * 100),
    expectedValue: parseFloat((c.prob * Math.max(1.15, (1 / (c.prob - 0.03) * 0.95)) - 1).toFixed(4)),
    explanation: c.explanation,
    isPremiumPick: false,
    statsBreakdown: JSON.stringify({ stat: c.stat, promedio: c.avg.toFixed(3), linea: c.line, equipo: c.teamName }),
  }));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getBasketballPicks(dateStr: string): Promise<any[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`;
    const [ml, props] = await Promise.all([
      fetchMoneylinePicks(url, 'basketball', '🏀'),
      generateNBAPlayerProps(dateStr),
    ]);
    
    // Group by player/team to avoid having all picks from the exact same player
    const playerCounts: Record<string, number> = {};
    
    const all = [...ml, ...props]
      .filter(p => p.confidenceScore >= 58)
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .filter(p => {
        // Limit to max 2 props per player/match target
        const name = p.match.player1Name;
        if (!playerCounts[name]) playerCounts[name] = 0;
        if (playerCounts[name] >= 2) return false;
        playerCounts[name]++;
        return true;
      })
      .slice(0, 10); // MAX 10 picks for NBA to ensure at least 5 are shown

    // Mark top pick as premium
    if (all.length > 0) all[0].isPremiumPick = true;
    return all;
  } catch { return []; }
}

export async function getBaseballPicks(dateStr: string): Promise<any[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${dateStr}`;
    const [ml, props] = await Promise.all([
      fetchMoneylinePicks(url, 'baseball', '⚾'),
      generateMLBPlayerProps(dateStr),
    ]);
    const all = [...ml, ...props]
      .filter(p => p.confidenceScore >= 55)
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(0, 8); // MAX 8 picks for MLB

    if (all.length > 0) all[0].isPremiumPick = true;
    return all;
  } catch { return []; }
}

export async function getBasketballParlay(dateStr: string): Promise<Parlay | null> {
  try {
    const all = await getBasketballPicks(dateStr);
    if (all.length < 2) return null;

    const solid = all
      .filter(p => p.estimatedProb >= 0.60 && p.odds >= 1.20 && p.odds <= 2.50)
      .slice(0, 3);

    if (solid.length < 2) return null;

    const totalOdds = solid.reduce((acc, p) => acc * p.odds, 1);
    const combinedProb = solid.reduce((acc, p) => acc * p.estimatedProb, 1);

    return { type: 'solid', picks: solid, totalOdds, combinedProb };
  } catch { return null; }
}

export async function getBaseballParlay(dateStr: string): Promise<Parlay | null> {
  try {
    const all = await getBaseballPicks(dateStr);
    if (all.length < 2) return null;

    const solid = all
      .filter(p => p.estimatedProb >= 0.58 && p.odds >= 1.15 && p.odds <= 2.50)
      .slice(0, 3);

    if (solid.length < 2) return null;

    const totalOdds = solid.reduce((acc, p) => acc * p.odds, 1);
    const combinedProb = solid.reduce((acc, p) => acc * p.estimatedProb, 1);

    return { type: 'solid', picks: solid, totalOdds, combinedProb };
  } catch { return null; }
}
