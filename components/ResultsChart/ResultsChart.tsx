import React from 'react';
import styles from './ResultsChart.module.css';

interface ResultsChartProps {
  totalWins: number;
  totalLosses: number;
}

export default function ResultsChart({ totalWins, totalLosses }: ResultsChartProps) {
  const total = totalWins + totalLosses;
  if (total === 0) return null;

  const winRate = (totalWins / total) * 100;
  const isProfitable = winRate > 52.38; // General breakeven point

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.icon}>📈</span> Balance del Día
        </h2>
        <span className={isProfitable ? styles.badgeSuccess : styles.badgeWarning}>
          {isProfitable ? '✨ Día Rentable' : 'Pérdida/Breakeven'}
        </span>
      </div>

      <div className={styles.chartArea}>
        <div className={styles.labels}>
          <div className={styles.label}>
            <span className={styles.dotWon} />
            Acertados ({totalWins})
          </div>
          <div className={styles.label}>
            <span className={styles.dotLost} />
            Fallados ({totalLosses})
          </div>
        </div>

        <div className={styles.barContainer}>
          {totalWins > 0 && (
            <div 
              className={styles.barWon} 
              style={{ width: `${winRate}%` }}
            >
              {winRate >= 10 ? `${winRate.toFixed(1)}%` : ''}
            </div>
          )}
          {totalLosses > 0 && (
            <div 
              className={styles.barLost} 
              style={{ width: `${100 - winRate}%` }}
            >
            </div>
          )}
        </div>
        
        <div className={styles.footer}>
          <span>0%</span>
          <span className={styles.breakevenLine}>
            52.4% (Breakeven)
            <div className={styles.lineMarker}></div>
          </span>
          <span>100%</span>
        </div>
      </div>
    </section>
  );
}
