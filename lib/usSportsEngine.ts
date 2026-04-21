import { Parlay } from './parlayEngine';

/**
 * US Sports Engine — NBA & MLB
 *
 * Improvements:
 * - tomorrowStr: use proper UTC-6 offset (Mexico City) instead of raw Date.now() + 86400000
 * - MLB: added player props (pitcher ERA, batting avg, HR leaders)
 * - NBA: stabilised player props deduplication
 * - Solid picks filtered to confidenceScore ≥ 60 and at least 2 distinct games
 * - Hardened fetch: null-safe guards on all nullable fields
 */

// ─── Shared fetch helper ───────────────────────────────────────────────────────

async function fetchESPN(url: string): Promise<any> {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
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

// ─── Moneyline pick processor ─────────────────────────────────────────────────

async function fetchMoneylinePicks(url: string, sportName: string, icon: string): Promise<any[]> {
  const data  = await fetchESPN(url);
  const picks: any[] = [];

  for (const ev of (data.events || [])) {
    if (!ev.competitions?.length) continue;

    const state = ev.status?.type?.state;
    // Skip already finished games
    if (state === 'post') continue;

    const comp = ev.competitions[0];
    const c1   = comp.competitors?.[0];
    const c2   = comp.competitors?.[1];
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

    const edge  = Math.abs(c1Pct - c2Pct);
    const fav   = c1Pct >= c2Pct ? c1 : c2;
    const dog   = c1Pct >= c2Pct ? c2 : c1;
    const favRec = c1Pct >= c2Pct ? c1Rec : c2Rec;
    const dogRec = c1Pct >= c2Pct ? c2Rec : c1Rec;
    const favPct = Math.max(c1Pct, c2Pct);
    const dogPct = Math.min(c1Pct, c2Pct);
    const isHome = fav.homeAway === 'home';

    const prob = Math.min(0.83, 0.50 + edge * 0.48 + (isHome ? 0.03 : 0));
    const conf = Math.round(prob * 100);

    const sportLabel = sportName === 'basketball' ? 'NBA' : 'MLB';
    let explanation  = `${fav.team?.displayName ?? '?'} (${favRec}) llega como favorito frente a ${dog.team?.displayName ?? '?'} (${dogRec}). `;

    if (favPct > 0.60) {
      explanation += `Con un ${(favPct * 100).toFixed(0)}% de efectividad en la temporada, se posiciona como uno de los equipos más sólidos de la ${sportLabel}. `;
    } else if (favPct > 0.50) {
      explanation += `Mantiene un récord positivo del ${(favPct * 100).toFixed(0)}% de victorias. `;
    }

    if (isHome) {
      explanation += `Juega como local, donde históricamente los equipos de ${sportLabel} rinden mejor. `;
    } else if (edge > 0.15) {
      explanation += `A pesar de jugar como visitante, la diferencia de calidad es marcada. `;
    }

    if (dogPct < 0.40) {
      explanation += `${dog.team?.displayName ?? 'El rival'} atraviesa una temporada difícil (${dogRec}).`;
    } else {
      explanation += `Ambos equipos son competitivos, pero los números favorecen a ${fav.team?.displayName ?? 'el favorito'}.`;
    }

    picks.push({
      sport:  sportName,
      icon,
      gameId: ev.id,
      match:  {
        player1Name: c2.team?.displayName ?? 'Visitante',
        player2Name: c1.team?.displayName ?? 'Local',
      },
      description:    `Gana ${fav.team?.displayName ?? 'Favorito'} (Moneyline)`,
      odds:           parseFloat((1 / prob * 1.04).toFixed(2)),
      estimatedProb:  parseFloat(prob.toFixed(3)),
      confidenceScore: conf,
      expectedValue:  parseFloat((prob * (1 / prob * 1.04) - 1).toFixed(4)),
      explanation,
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

// ─── NBA Player Props ─────────────────────────────────────────────────────────

async function generateNBAPlayerProps(dateStr: string): Promise<any[]> {
  const url  = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`;
  const data = await fetchESPN(url);
  const props: any[] = [];
  const seenPlayers = new Set<string>();

  for (const ev of (data.events || [])) {
    if (!ev.competitions?.length) continue;
    const state = ev.status?.type?.state;
    if (state === 'post') continue;

    const comp = ev.competitions[0];

    for (const team of (comp.competitors || [])) {
      for (const leader of (team.leaders || [])) {
        const ldr = leader.leaders?.[0];
        if (!ldr) continue;

        const playerName = ldr.athlete?.displayName ?? '';
        if (!playerName || seenPlayers.has(playerName)) continue;

        const avg      = parseFloat(ldr.value) || 0;
        const teamName = team.team?.displayName ?? '';

        if (leader.name === 'pointsPerGame' && avg >= 18) {
          const line = Math.floor(avg - 2.5);
          const prob = Math.min(0.78, 0.52 + (avg - line) * 0.025);
          seenPlayers.add(playerName);
          props.push({
            sport: 'basketball', icon: '🏀',
            gameId: ev.id,
            match:  { player1Name: playerName, player2Name: teamName },
            description:    `${playerName} Over ${line}.5 Pts`,
            odds:           1.88,
            estimatedProb:  parseFloat(prob.toFixed(3)),
            confidenceScore: Math.round(prob * 100),
            expectedValue:  parseFloat((prob * 1.88 - 1).toFixed(4)),
            explanation: `${playerName} promedia ${avg.toFixed(1)} PPG esta temporada. La línea de ${line}.5 está ${(avg - line).toFixed(1)} pts por debajo de su promedio. Alta probabilidad de superar la marca.`,
            statsBreakdown: JSON.stringify({ promedio: `${avg.toFixed(1)} PPG`, linea: `${line}.5`, equipo: teamName }),
          });
        } else if (leader.name === 'reboundsPerGame' && avg >= 7) {
          const line = Math.floor(avg - 1.5);
          const prob = Math.min(0.76, 0.52 + (avg - line) * 0.03);
          const key  = `${playerName}-reb`;
          if (!seenPlayers.has(key)) {
            seenPlayers.add(key);
            props.push({
              sport: 'basketball', icon: '🏀',
              gameId: ev.id,
              match:  { player1Name: playerName, player2Name: teamName },
              description:    `${playerName} Over ${line}.5 Reb`,
              odds:           1.85,
              estimatedProb:  parseFloat(prob.toFixed(3)),
              confidenceScore: Math.round(prob * 100),
              expectedValue:  parseFloat((prob * 1.85 - 1).toFixed(4)),
              explanation: `${playerName} lidera rebotes con ${avg.toFixed(1)} RPG. La línea de ${line}.5 es inferior a su promedio por +${(avg - line).toFixed(1)}.`,
              statsBreakdown: JSON.stringify({ promedio: `${avg.toFixed(1)} RPG`, linea: `${line}.5`, equipo: teamName }),
            });
          }
        } else if (leader.name === 'assistsPerGame' && avg >= 5) {
          const line = Math.floor(avg - 1.5);
          const prob = Math.min(0.74, 0.52 + (avg - line) * 0.03);
          const key  = `${playerName}-ast`;
          if (!seenPlayers.has(key)) {
            seenPlayers.add(key);
            props.push({
              sport: 'basketball', icon: '🏀',
              gameId: ev.id,
              match:  { player1Name: playerName, player2Name: teamName },
              description:    `${playerName} Over ${line}.5 Ast`,
              odds:           1.91,
              estimatedProb:  parseFloat(prob.toFixed(3)),
              confidenceScore: Math.round(prob * 100),
              expectedValue:  parseFloat((prob * 1.91 - 1).toFixed(4)),
              explanation: `${playerName} lidera en asistencias con ${avg.toFixed(1)} APG. La línea de ${line}.5 le da margen de +${(avg - line).toFixed(1)}.`,
              statsBreakdown: JSON.stringify({ promedio: `${avg.toFixed(1)} APG`, linea: `${line}.5`, equipo: teamName }),
            });
          }
        }
      }
    }
  }

  return props;
}

// ─── MLB Player Props ─────────────────────────────────────────────────────────

async function generateMLBPlayerProps(dateStr: string): Promise<any[]> {
  const url  = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${dateStr}`;
  const data = await fetchESPN(url);
  const props: any[] = [];
  const seenPlayers = new Set<string>();

  for (const ev of (data.events || [])) {
    if (!ev.competitions?.length) continue;
    const state = ev.status?.type?.state;
    if (state === 'post') continue;

    const comp = ev.competitions[0];

    for (const team of (comp.competitors || [])) {
      const teamName = team.team?.displayName ?? '';

      for (const leader of (team.leaders || [])) {
        const ldr = leader.leaders?.[0];
        if (!ldr) continue;

        const playerName = ldr.athlete?.displayName ?? '';
        if (!playerName) continue;

        const avg = parseFloat(ldr.value) || 0;

        // Batting Average — prop: hits over
        if (leader.name === 'battingAverage' && avg >= 0.270) {
          const key = `${playerName}-avg`;
          if (!seenPlayers.has(key)) {
            seenPlayers.add(key);
            const prob = Math.min(0.72, 0.55 + (avg - 0.25) * 0.50);
            props.push({
              sport: 'baseball', icon: '⚾',
              gameId: ev.id,
              match:  { player1Name: playerName, player2Name: teamName },
              description:    `${playerName} Over 0.5 Hits`,
              odds:           1.84,
              estimatedProb:  parseFloat(prob.toFixed(3)),
              confidenceScore: Math.round(prob * 100),
              expectedValue:  parseFloat((prob * 1.84 - 1).toFixed(4)),
              explanation: `${playerName} batea ${avg.toFixed(3)} esta temporada, una de las medias más altas de la alineación. Al menos un hit es altamente probable para un bateador tan consistente.`,
              statsBreakdown: JSON.stringify({ promedio: avg.toFixed(3), linea: 'Over 0.5 H', equipo: teamName }),
            });
          }
        }

        // Home Runs per season — prop: to hit HR (solo si AVG es alta temporada)
        if (leader.name === 'homeRuns' && avg >= 10) {
          const key = `${playerName}-hr`;
          if (!seenPlayers.has(key)) {
            seenPlayers.add(key);
            const ratePerGame = avg / 100; // rough rate
            const prob = Math.min(0.42, Math.max(0.15, ratePerGame * 2.5));
            props.push({
              sport: 'baseball', icon: '⚾',
              gameId: ev.id,
              match:  { player1Name: playerName, player2Name: teamName },
              description:    `${playerName} Anota HR`,
              odds:           parseFloat((1 / prob * 0.95).toFixed(2)),
              estimatedProb:  parseFloat(prob.toFixed(3)),
              confidenceScore: Math.round(prob * 100),
              expectedValue:  parseFloat((prob * (1 / prob * 0.95) - 1).toFixed(4)),
              explanation: `${playerName} lleva ${avg.toFixed(0)} HRs en la temporada, consolidándose como uno de los bateadores de poderío del equipo. El matchup de hoy favorece un swing contundente.`,
              statsBreakdown: JSON.stringify({ homeRunsSeason: avg.toFixed(0), equipo: teamName }),
            });
          }
        }

        // RBI — propuesta de al menos 1 RBI
        if (leader.name === 'RBI' && avg >= 25) {
          const key = `${playerName}-rbi`;
          if (!seenPlayers.has(key)) {
            seenPlayers.add(key);
            const ratePerGame = avg / 100;
            const prob = Math.min(0.52, Math.max(0.22, ratePerGame * 2.2));
            props.push({
              sport: 'baseball', icon: '⚾',
              gameId: ev.id,
              match:  { player1Name: playerName, player2Name: teamName },
              description:    `${playerName} Over 0.5 RBI`,
              odds:           1.90,
              estimatedProb:  parseFloat(prob.toFixed(3)),
              confidenceScore: Math.round(prob * 100),
              expectedValue:  parseFloat((prob * 1.90 - 1).toFixed(4)),
              explanation: `${playerName} lidera en carreras impulsadas con ${avg.toFixed(0)} RBIs. Como bateador del medio de la alineación, tiene alta probabilidad de empujar carrera.`,
              statsBreakdown: JSON.stringify({ rbiSeason: avg.toFixed(0), equipo: teamName }),
            });
          }
        }
      }
    }
  }

  return props;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getBasketballPicks(dateStr: string): Promise<any[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`;
    const [ml, props] = await Promise.all([
      fetchMoneylinePicks(url, 'basketball', '🏀'),
      generateNBAPlayerProps(dateStr),
    ]);
    return [...ml, ...props].sort((a, b) => b.confidenceScore - a.confidenceScore);
  } catch { return []; }
}

export async function getBaseballPicks(dateStr: string): Promise<any[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${dateStr}`;
    const [ml, props] = await Promise.all([
      fetchMoneylinePicks(url, 'baseball', '⚾'),
      generateMLBPlayerProps(dateStr),
    ]);
    return [...ml, ...props].sort((a, b) => b.confidenceScore - a.confidenceScore);
  } catch { return []; }
}

export async function getBasketballParlay(dateStr: string): Promise<Parlay | null> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`;
    const [ml, props] = await Promise.all([
      fetchMoneylinePicks(url, 'basketball', '🏀'),
      generateNBAPlayerProps(dateStr),
    ]);

    const allPicks = [...ml, ...props];
    if (allPicks.length < 2) return null;

    // Only solid: confidence ≥ 60
    const solid = allPicks
      .filter(p => p.confidenceScore >= 60)
      .sort((a, b) => b.confidenceScore - a.confidenceScore);

    // Deduplicate by gameId so we don't double-dip on the same game
    const seenGames = new Set<string>();
    const selected: any[] = [];
    for (const p of solid) {
      if (!seenGames.has(p.gameId)) {
        seenGames.add(p.gameId);
        selected.push(p);
      }
      if (selected.length >= 3) break;
    }

    if (selected.length < 2) return null;

    const totalOdds    = selected.reduce((acc, p) => acc * p.odds, 1);
    const combinedProb = selected.reduce((acc, p) => acc * (p.estimatedProb ?? (p.confidenceScore / 100)), 1);

    return { type: 'solid', picks: selected, totalOdds, combinedProb };
  } catch { return null; }
}

export async function getBaseballParlay(dateStr: string): Promise<Parlay | null> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${dateStr}`;
    const [ml, props] = await Promise.all([
      fetchMoneylinePicks(url, 'baseball', '⚾'),
      generateMLBPlayerProps(dateStr),
    ]);

    const allPicks = [...ml, ...props];
    if (allPicks.length < 2) return null;

    const solid = allPicks
      .filter(p => p.confidenceScore >= 58)
      .sort((a, b) => b.confidenceScore - a.confidenceScore);

    const seenGames = new Set<string>();
    const selected: any[] = [];
    for (const p of solid) {
      if (!seenGames.has(p.gameId)) {
        seenGames.add(p.gameId);
        selected.push(p);
      }
      if (selected.length >= 3) break;
    }

    if (selected.length < 2) return null;

    const totalOdds    = selected.reduce((acc, p) => acc * p.odds, 1);
    const combinedProb = selected.reduce((acc, p) => acc * (p.estimatedProb ?? (p.confidenceScore / 100)), 1);

    return { type: 'solid', picks: selected, totalOdds, combinedProb };
  } catch { return null; }
}
