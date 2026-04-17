import { Parlay } from './parlayEngine';


async function fetchAndProcessExp(url: string, sportName: string, icon: string): Promise<any[]> {
  const res = await fetch(url, { 
    cache: 'no-store',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  }).catch(() => null);
  const data = res && res.ok ? await res.json() : { events: [] };
  const picks: any[] = [];
  
  for (const ev of (data.events || [])) {
    if (!ev.competitions || ev.competitions.length === 0) continue;
    
    // Allow games in any state, but tag them correctly
    const state = ev.status?.type?.state; 
    // If it's for Tomorrow and it's already finished (unlikely), skip
    if (url.includes('dates=') && !url.includes(new Date().toISOString().split('T')[0].replace(/-/g,'')) && state === 'post') continue;

    const comp = ev.competitions[0];
    const c1 = comp.competitors[0];
    const c2 = comp.competitors[1];
    
    const c1WinStr = c1.records?.find((r: any) => r.type === 'total')?.summary || "0-0";
    const c2WinStr = c2.records?.find((r: any) => r.type === 'total')?.summary || "0-0";
    const c1HomeStr = c1.records?.find((r: any) => r.type === 'home')?.summary || "";
    const c1AwayStr = c1.records?.find((r: any) => r.type === 'road')?.summary || "";
    const c2HomeStr = c2.records?.find((r: any) => r.type === 'home')?.summary || "";
    const c2AwayStr = c2.records?.find((r: any) => r.type === 'road')?.summary || "";
    
    const c1W = parseInt(c1WinStr.split('-')[0]) || 0;
    const c1L = parseInt(c1WinStr.split('-')[1]) || 0;
    const c2W = parseInt(c2WinStr.split('-')[0]) || 0;
    const c2L = parseInt(c2WinStr.split('-')[1]) || 0;

    const c1Pct = c1W / ((c1W + c1L) || 1);
    const c2Pct = c2W / ((c2W + c2L) || 1);

    const edge = Math.abs(c1Pct - c2Pct);
    const fav = c1Pct >= c2Pct ? c1 : c2;
    const dog = c1Pct >= c2Pct ? c2 : c1;
    const favRecord = c1Pct >= c2Pct ? c1WinStr : c2WinStr;
    const dogRecord = c1Pct >= c2Pct ? c2WinStr : c1WinStr;
    const favPct = Math.max(c1Pct, c2Pct);
    const dogPct = Math.min(c1Pct, c2Pct);
    const isHome = fav.homeAway === 'home';
    
    const prob = Math.min(0.85, 0.5 + edge * 0.5 + 0.05);
    
    // Generate narrative explanation
    const sportLabel = sportName === 'basketball' ? 'NBA' : 'MLB';
    let explanation = `${fav.team.displayName} (${favRecord}) llega como favorito frente a ${dog.team.displayName} (${dogRecord}). `;
    
    if (favPct > 0.6) {
      explanation += `Con un ${(favPct * 100).toFixed(0)}% de efectividad en la temporada, se posiciona como uno de los equipos más sólidos de la ${sportLabel}. `;
    } else if (favPct > 0.5) {
      explanation += `Mantiene un récord positivo del ${(favPct * 100).toFixed(0)}% de victorias, lo cual lo hace consistente. `;
    }
    
    if (isHome) {
      explanation += `Juega como local, donde históricamente los equipos de ${sportLabel} tienen mayor rendimiento. `;
    } else if (favPct - dogPct > 0.15) {
      explanation += `A pesar de jugar como visitante, la diferencia de calidad es marcada (${(edge * 100).toFixed(0)} puntos porcentuales de ventaja). `;
    }
    
    if (dogPct < 0.4) {
      explanation += `${dog.team.displayName} atraviesa una temporada difícil (${dogRecord}), lo que favorece aún más al favorito.`;
    } else {
      explanation += `Ambos equipos tienen un nivel competitivo, pero los números favorecen a ${fav.team.displayName}.`;
    }
    
    picks.push({
      sport: sportName,
      icon,
      match: {
        player1Name: c2.team.displayName,
        player2Name: c1.team.displayName,
      },
      description: `Gana ${fav.team.displayName} (Moneyline)`,
      odds: 1 / prob * 1.05,
      confidenceScore: Math.round(prob * 100),
      expectedValue: 0.05,
      explanation,
      statsBreakdown: JSON.stringify({
        favRecord: favRecord,
        dogRecord: dogRecord,
        favWinPct: `${(favPct * 100).toFixed(1)}%`,
        dogWinPct: `${(dogPct * 100).toFixed(1)}%`,
        edge: `${(edge * 100).toFixed(1)}%`,
        venue: isHome ? 'Local' : 'Visitante',
      }),
    });
  }
  return picks;
}

export async function getBasketballPicks(dateStr: string): Promise<any[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`;
    const ml = await fetchAndProcessExp(url, 'basketball', '🏀');
    const props = await generateNBAPlayerProps(dateStr);
    return [...ml, ...props].sort((a,b) => b.expectedValue - a.expectedValue);
  } catch { return []; }
}

export async function getBaseballPicks(dateStr: string): Promise<any[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${dateStr}`;
    return await fetchAndProcessExp(url, 'baseball', '⚾');
  } catch { return []; }
}

export async function getBasketballParlay(dateStr: string): Promise<Parlay | null> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`;
    const moneylinePicks = await fetchAndProcessExp(url, 'basketball', '🏀');
    
    // Also generate player props from the same data
    const propPicks = await generateNBAPlayerProps(dateStr);
    
    const allPicks = [...moneylinePicks, ...propPicks];
    if (allPicks.length < 1) return null;

    // Compose parlay: moneyline picks + player props mixed
    const bestML = moneylinePicks.sort((a, b) => b.confidenceScore - a.confidenceScore);
    const bestProps = propPicks.sort((a, b) => b.confidenceScore - a.confidenceScore).slice(0, 3);
    
    // Combine and sort by HIGHEST confidence to ensure "solid" picks
    const combined = [...bestML, ...bestProps].sort((a, b) => b.confidenceScore - a.confidenceScore);
    
    // Take only the top 3 most solid picks for a "solid" parlay
    const selected = combined.slice(0, 3);
    if (selected.length < 2) return null; // Need at least 2 for a parlay
    
    const totalOdds = selected.reduce((acc, p) => acc * p.odds, 1);
    const combinedProb = selected.reduce((acc, p) => acc * (p.estimatedProb || (p.confidenceScore / 100)), 1);
    
    return { type: 'solid', picks: selected, totalOdds, combinedProb };
  } catch (err) {
    return null;
  }
}

async function generateNBAPlayerProps(dateStr: string): Promise<any[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`;
    const res = await fetch(url, { 
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }).catch(() => null);
    if (!res || !res.ok) return [];
    const data = await res.json();
    const props: any[] = [];

    for (const ev of (data.events || [])) {
      if (!ev.competitions || ev.competitions.length === 0) continue;
      const comp = ev.competitions[0];

      for (const team of comp.competitors || []) {
        // Get team leaders if available
        const leaders = team.leaders || [];
        for (const leader of leaders) {
          if (leader.name === 'pointsPerGame' && leader.leaders?.[0]) {
            const player = leader.leaders[0];
            const avg = parseFloat(player.value) || 20;
            const playerName = player.athlete?.displayName || 'Unknown';
            
            // If strong avg, suggest Over
            if (avg >= 18) {
              const line = Math.floor(avg - 2.5); // slightly under avg
              props.push({
                sport: 'basketball',
                icon: '🏀',
                match: {
                  player1Name: `${playerName}`,
                  player2Name: `${team.team.displayName}`,
                },
                description: `${playerName} Over ${line}.5 Pts`,
                odds: 1.87,
                confidenceScore: Math.round(Math.min(75, 50 + (avg - line) * 3)),
                expectedValue: 0.06,
                explanation: `${playerName} promedia ${avg.toFixed(1)} puntos por partido esta temporada con ${team.team.displayName}. La línea de ${line}.5 está ${(avg - line).toFixed(1)} puntos por debajo de su promedio, lo que sugiere una alta probabilidad de que la supere. Su consistencia anotadora y rol ofensivo dentro del equipo respaldan esta apuesta.`,
                statsBreakdown: JSON.stringify({
                  promedio: `${avg.toFixed(1)} PPG`,
                  linea: `${line}.5`,
                  margen: `+${(avg - line).toFixed(1)}`,
                  equipo: team.team.displayName,
                }),
              });
            }
          }
          
          if (leader.name === 'reboundsPerGame' && leader.leaders?.[0]) {
            const player = leader.leaders[0];
            const avg = parseFloat(player.value) || 8;
            const playerName = player.athlete?.displayName || 'Unknown';
            
            if (avg >= 7) {
              const line = Math.floor(avg - 1.5);
              props.push({
                sport: 'basketball',
                icon: '🏀',
                match: {
                  player1Name: `${playerName}`,
                  player2Name: `${team.team.displayName}`,
                },
                description: `${playerName} Over ${line}.5 Reb`,
                odds: 1.83,
                confidenceScore: Math.round(Math.min(72, 50 + (avg - line) * 4)),
                expectedValue: 0.05,
                explanation: `${playerName} es el líder en rebotes de ${team.team.displayName} con un promedio de ${avg.toFixed(1)} por partido. Con la línea en ${line}.5, tiene un margen de +${(avg - line).toFixed(1)} rebotes sobre lo requerido. Su presencia física y posicionamiento defensivo consistente hacen de este Over una apuesta sólida.`,
                statsBreakdown: JSON.stringify({
                  promedio: `${avg.toFixed(1)} RPG`,
                  linea: `${line}.5`,
                  margen: `+${(avg - line).toFixed(1)}`,
                  equipo: team.team.displayName,
                }),
              });
            }
          }

          if (leader.name === 'assistsPerGame' && leader.leaders?.[0]) {
            const player = leader.leaders[0];
            const avg = parseFloat(player.value) || 5;
            const playerName = player.athlete?.displayName || 'Unknown';
            
            if (avg >= 5) {
              const line = Math.floor(avg - 1.5);
              props.push({
                sport: 'basketball',
                icon: '🏀',
                match: {
                  player1Name: `${playerName}`,
                  player2Name: `${team.team.displayName}`,
                },
                description: `${playerName} Over ${line}.5 Ast`,
                odds: 1.90,
                confidenceScore: Math.round(Math.min(70, 50 + (avg - line) * 3)),
                expectedValue: 0.04,
                explanation: `${playerName} lidera las asistencias de ${team.team.displayName} con ${avg.toFixed(1)} por partido. La línea de ${line}.5 está por debajo de su promedio por un margen de +${(avg - line).toFixed(1)}, lo que da confianza en que generará suficientes jugadas. Su visión de juego y rol de facilitador lo convierten en candidato para superar esta marca.`,
                statsBreakdown: JSON.stringify({
                  promedio: `${avg.toFixed(1)} APG`,
                  linea: `${line}.5`,
                  margen: `+${(avg - line).toFixed(1)}`,
                  equipo: team.team.displayName,
                }),
              });
            }
          }
        }
      }
    }
    return props;
  } catch {
    return [];
  }
}

export async function getBaseballParlay(dateStr: string): Promise<Parlay | null> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${dateStr}`;
    const picks = await fetchAndProcessExp(url, 'baseball', '⚾');
    if (picks.length < 1) return null;

    // Sort by confidence to get the most solid ones
    picks.sort((a, b) => b.confidenceScore - a.confidenceScore);
    
    // Take top 3 for a solid parlay
    const selected = picks.slice(0, 3);
    if (selected.length < 2) return null;

    const totalOdds = selected.reduce((acc, p) => acc * p.odds, 1);
    const combinedProb = selected.reduce((acc, p) => acc * (p.estimatedProb || (p.confidenceScore / 100)), 1);

    return { type: 'solid', picks: selected, totalOdds, combinedProb };
  } catch (err) {
    return null;
  }
}
