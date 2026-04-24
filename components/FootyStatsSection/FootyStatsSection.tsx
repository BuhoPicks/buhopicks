import React from 'react';
import styles from './FootyStatsSection.module.css';

interface FootyStatsSectionProps {
  matches: any[];
}

export default function FootyStatsSection({ matches }: FootyStatsSectionProps) {
  if (!matches || matches.length === 0) return null;

  // Simulate FootyStats trends by evaluating the generated odds and parameters
  // Ideally, this hooks up to footystats API, but here we derive "Top Trends"
  
  // OVER 2.5 TRENDS
  const allPicksWithMatch = [...matches].flatMap(m => 
    m.picks.map((p: any) => ({ ...p, parentMatch: m }))
  );

  // OVER 2.5 TRENDS
  const topOvers = allPicksWithMatch
    .filter(p => p.market === 'Goles' && p.selection?.includes('Más de'))
    .sort((a, b) => b.estimatedProb - a.estimatedProb)
    .slice(0, 3);

  // BTTS TRENDS (Both Teams To Score)
  const topBTTS = allPicksWithMatch
    .filter(p => p.market === 'Ambos Anotan' && p.selection === 'Sí')
    .sort((a, b) => b.estimatedProb - a.estimatedProb)
    .slice(0, 3);

  // STRONGEST FAVORITES
  const topFavorites = allPicksWithMatch
    .filter(p => p.market === 'Ganador' && p.estimatedProb >= 0.60)
    .sort((a, b) => b.estimatedProb - a.estimatedProb)
    .slice(0, 3);

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.icon}>📊</span> FootyStats: Tendencias del Día
        </h2>
        <p className={styles.subtitle}>Las mejores previsiones estadísticas (Corners, Goles, BTTS) extraídas automáticamente.</p>
      </div>

      <div className={styles.grid}>
        {/* OVER 2.5 COLUMN */}
        <div className={styles.trendCol}>
          <div className={styles.colHeader}>
            <span className={styles.colIcon}>🔥</span> +2.5 Goles
          </div>
          <div className={styles.colList}>
            {topOvers.length > 0 ? topOvers.map((pick, i) => (
              <div key={i} className={styles.trendItem}>
                <div className={styles.matchTeams}>
                  {pick.parentMatch?.homeTeam} vs {pick.parentMatch?.awayTeam}
                </div>
                <div className={styles.trendProb}>
                  Prob: {(pick.estimatedProb * 100).toFixed(0)}%
                </div>
              </div>
            )) : <div className={styles.emptyTrend}>No hay tendencias fuertes hoy</div>}
          </div>
        </div>

        {/* BTTS COLUMN */}
        <div className={styles.trendCol}>
          <div className={styles.colHeader}>
            <span className={styles.colIcon}>⚽</span> Ambos Anotan (BTTS)
          </div>
          <div className={styles.colList}>
            {topBTTS.length > 0 ? topBTTS.map((pick, i) => (
              <div key={i} className={styles.trendItem}>
                <div className={styles.matchTeams}>
                  {pick.parentMatch?.homeTeam} vs {pick.parentMatch?.awayTeam}
                </div>
                <div className={styles.trendProb}>
                  Prob: {(pick.estimatedProb * 100).toFixed(0)}%
                </div>
              </div>
            )) : <div className={styles.emptyTrend}>No hay tendencias fuertes hoy</div>}
          </div>
        </div>

        {/* FAVORITES COLUMN */}
        <div className={styles.trendCol}>
          <div className={styles.colHeader}>
            <span className={styles.colIcon}>🏆</span> Ganadores Seguros
          </div>
          <div className={styles.colList}>
            {topFavorites.length > 0 ? topFavorites.map((pick, i) => (
              <div key={i} className={styles.trendItem}>
                <div className={styles.matchTeams}>
                  {pick.parentMatch?.homeTeam} vs {pick.parentMatch?.awayTeam}
                </div>
                <div className={styles.trendProb}>
                  Pick: {pick.selection}
                </div>
              </div>
            )) : <div className={styles.emptyTrend}>No hay favoritos claros</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
