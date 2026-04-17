import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

const MARKET_LABELS: Record<string, string> = {
  MATCH_WINNER:     '🏆 Ganador del Partido',
  GAMES_OVER_UNDER: '📊 Total de Games (O/U)',
  GAMES_HANDICAP:   '➕ Handicap de Games',
  FIRST_SET_WINNER: '1️⃣ Primer Set',
  TOTAL_SETS:       '🔢 Total de Sets',
};

const SURFACE_COLORS: Record<string, string> = {
  Hard:   'var(--hard)',
  Clay:   'var(--clay)',
  Grass:  'var(--grass)',
  Carpet: 'var(--carpet)',
};

async function getMatch(id: string) {
  return prisma.tennisMatch.findUnique({
    where: { id },
    include: { picks: { orderBy: { expectedValue: 'desc' } } },
  });
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) notFound();

  const picks = match.picks;
  const bestPick = picks.find(p => p.isPremiumPick) || picks[0];
  
  const p1Rankings = match.player1Ranking;
  const p2Rankings = match.player2Ranking;

  // Parse stats from best pick if available
  let statsData: any = null;
  if (bestPick?.statsBreakdown) {
    try { statsData = JSON.parse(bestPick.statsBreakdown); } catch { /* ignore */ }
  }

  const surfaceColor = SURFACE_COLORS[match.surface] || 'var(--brand)';

  return (
    <div className={styles.page}>
      {/* Back */}
      <Link href="/" className={styles.backLink}>← Volver al Dashboard</Link>

      {/* Match Header */}
      <div className={`glass ${styles.matchHeader}`}>
        <div className={styles.headerMeta}>
          <span className={`badge badge-${match.circuit.toLowerCase()}`}>{match.circuit}</span>
          <span className={`badge badge-${match.surface.toLowerCase()}`}>{match.surface}</span>
          {match.round && <span className="badge badge-scheduled">{match.round}</span>}
          {match.indoor && <span className="badge badge-indoor">Indoor</span>}
        </div>

        <div className={styles.tournamentName}>{match.tournament}</div>

        <div className={styles.matchup}>
          {/* Player 1 */}
          <div className={styles.player}>
            <div className={styles.playerNameLarge}>{match.player1Name}</div>
            <div className={styles.playerRank}>
              <span style={{ color: 'var(--brand)' }}>{(!p1Rankings || p1Rankings >= 999) ? 'Ranking N/A' : `#${p1Rankings}`}</span>
              {match.player1Country && <span className={styles.country}>{match.player1Country}</span>}
            </div>
            {statsData?.surfaceWR?.p1 && (
              <div className={styles.playerStat}>
                {match.surface} WR: {(statsData.surfaceWR.p1 * 100).toFixed(0)}%
              </div>
            )}
          </div>

          <div className={styles.matchupCenter}>
            <div className={styles.vsCircle}>VS</div>
            <div className={styles.matchTime}>
              {new Date(match.date).toLocaleString('es-ES', {
                weekday: 'short', day: '2-digit', month: 'short',
                hour: '2-digit', minute: '2-digit',
                timeZone: 'America/Mexico_City'
              })}
            </div>
          </div>

          {/* Player 2 */}
          <div className={`${styles.player} ${styles.playerRight}`}>
            <div className={styles.playerNameLarge}>{match.player2Name}</div>
            <div className={styles.playerRank}>
              <span style={{ color: 'var(--brand)' }}>{(!p2Rankings || p2Rankings >= 999) ? 'Ranking N/A' : `#${p2Rankings}`}</span>
              {match.player2Country && <span className={styles.country}>{match.player2Country}</span>}
            </div>
            {statsData?.surfaceWR?.p2 && (
              <div className={styles.playerStat}>
                {match.surface} WR: {(statsData.surfaceWR.p2 * 100).toFixed(0)}%
              </div>
            )}
          </div>
        </div>

        {/* Stats comparison */}
        {statsData && (
          <div className={styles.statsGrid}>
            {statsData.isSimulated && (
              <div className={styles.simulatedNotice}>
                ⚠️ <strong>Nota:</strong> Algunos de estos datos son proyectados estadísticamente debido a limitaciones en la disponibilidad de datos oficiales en tiempo real de la ATP/WTA para este encuentro.
              </div>
            )}
            
            {statsData.ranking && statsData.ranking.p1 < 999 && statsData.ranking.p2 < 999 ? (
              <StatBar label="Ranking" v1={statsData.ranking.p1} v2={statsData.ranking.p2} reversed />
            ) : null}
            
            {statsData.form5 && (
              <div className={styles.statRow}>
                <span className={styles.statVal}>{statsData.form5.p1.replace(/U/g, '—')}</span>
                <span className={styles.statLabel}>Forma (5P)</span>
                <span className={styles.statVal}>{statsData.form5.p2.replace(/U/g, '—')}</span>
              </div>
            )}
            {statsData.firstServe && (
              <StatBar
                label="Promedio 1er Servicio"
                v1={Math.round(statsData.firstServe.p1 * 100)}
                v2={Math.round(statsData.firstServe.p2 * 100)}
                unit="%"
              />
            )}
          </div>
        )}
      </div>

      {/* Picks Section */}
      <h2 className={styles.sectionTitle}>Picks Recomendados ({picks.length})</h2>

      <div className={styles.picksGrid}>
        {picks.map((pick, i) => {
          const evPositive = pick.expectedValue > 0;
          const confidenceClass =
            pick.confidenceScore >= 75 ? 'premium' :
            pick.confidenceScore >= 65 ? 'high' :
            pick.confidenceScore >= 55 ? 'medium' : 'low';

          return (
            <div
              key={pick.id}
              className={`${styles.pickCard} ${pick.isPremiumPick ? styles.pickPremium : ''} animate-in delay-${Math.min(i + 1, 5)}`}
            >
              {pick.isPremiumPick && (
                <div className={styles.premiumBanner}>⭐ PICK PREMIUM DEL DÍA</div>
              )}

              <div className={styles.pickHeader}>
                <span className={styles.pickMarket}>{MARKET_LABELS[pick.market] || pick.market}</span>
                <span className={`badge badge-${pick.valueLabel.toLowerCase()}`}>
                  {pick.valueLabel} VALUE
                </span>
              </div>

              <div className={styles.pickSelection}>{pick.description}</div>

              <div className={styles.pickNumbers}>
                <div className={styles.pickNum}>
                  <span className={styles.pickNumVal} style={{ color: 'var(--premium)' }}>{pick.odds.toFixed(2)}</span>
                  <span className={styles.pickNumLabel}>Cuota</span>
                </div>
                <div className={styles.pickNum}>
                  <span className={styles.pickNumVal} style={{ color: evPositive ? 'var(--high)' : 'var(--low)' }}>
                    {evPositive ? '+' : ''}{(pick.expectedValue * 100).toFixed(1)}%
                  </span>
                  <span className={styles.pickNumLabel}>EV</span>
                </div>
                <div className={styles.pickNum}>
                  <span className={styles.pickNumVal}>{(pick.estimatedProb * 100).toFixed(0)}%</span>
                  <span className={styles.pickNumLabel}>Probabilidad</span>
                </div>
                <div className={styles.pickNum}>
                  <span className={styles.pickNumVal} style={{
                    color: pick.confidenceScore >= 65 ? 'var(--high)' : '#FBBF24'
                  }}>{pick.confidenceScore}</span>
                  <span className={styles.pickNumLabel}>Confianza</span>
                </div>
              </div>

              {/* Confidence bar */}
              <div className={styles.confRow}>
                <div className={styles.confBarWrap}>
                  <div
                    className={`${styles.confBar} ${styles[`conf-${confidenceClass}`]}`}
                    style={{ '--target-width': `${pick.confidenceScore}%` } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* Explanation */}
              <div className={styles.explanation}>
                <div className={styles.explainTitle}>💡 Justificación estadística</div>
                <p className={styles.explainText}>{pick.explanation}</p>
              </div>

              {/* Cuota justa */}
              <div className={styles.fairOdds}>
                <span>Cuota justa estimada:</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: '700' }}>
                  {pick.trueOdds.toFixed(2)}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  ({pick.odds > pick.trueOdds ? '✅ Por encima del mercado' : '⚠️ Por debajo del mercado'})
                </span>
              </div>
            </div>
          );
        })}

        {picks.length === 0 && (
          <div className={`glass ${styles.noPicks}`}>
            <p>No hay picks generados para este partido.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBar({ label, v1, v2, unit = '', reversed = false }: {
  label: string;
  v1: number;
  v2: number;
  unit?: string;
  reversed?: boolean;
}) {
  const total = v1 + v2 || 1;
  const p1Pct = reversed ? (v2 / total) * 100 : (v1 / total) * 100; // reversed = lower is better
  return (
    <div className={styles.statRow}>
      <span className={styles.statVal}>{v1}{unit}</span>
      <div className={styles.statBarSection}>
        <span className={styles.statLabel}>{label}</span>
        <div className={styles.dualBar}>
          <div className={styles.dualBarFill} style={{ width: `${Math.min(p1Pct, 100)}%`, background: 'var(--atp)' }} />
          <div className={styles.dualBarFill2} style={{ width: `${Math.min(100 - p1Pct, 100)}%`, background: 'var(--wta)' }} />
        </div>
      </div>
      <span className={`${styles.statVal} ${styles.statValRight}`}>{v2}{unit}</span>
    </div>
  );
}
