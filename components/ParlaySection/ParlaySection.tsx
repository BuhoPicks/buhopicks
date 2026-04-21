import React from 'react';
import styles from './ParlaySection.module.css';
import { Parlay } from '@/lib/parlayEngine';

interface ParlaySectionProps {
  parlays: Parlay[];
  day?: 'today' | 'tomorrow';
}

export default function ParlaySection({ parlays, day = 'today' }: ParlaySectionProps) {
  if (!parlays || parlays.length === 0) return null;

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.icon}>💎</span> Picks más sólidos del día — {day === 'today' ? 'Hoy' : 'Mañana'}
        </h2>
        <p className={styles.subtitle}>Los picks con mayor probabilidad estadística de acierto, seleccionados por nuestro algoritmo.</p>
      </div>

      <div className={styles.grid}>
        {parlays.map((parlay, pi) => (
          <div key={`${parlay.type}-${pi}`} className={`${styles.card} ${parlay.type === 'solid' ? styles.cardSolid : parlay.type === 'aggressive' ? styles.cardAggressive : styles.cardUsa}`}>
            <div className={styles.cardHeader}>
              <div className={styles.typeLabel}>
                {parlay.dayLabel && <span className={styles.dayTag}>{parlay.dayLabel}</span>}
                {parlay.picks[0]?.sport === 'basketball'
                  ? '🏀 PICKS MÁS SÓLIDOS — NBA'
                  : parlay.picks[0]?.sport === 'baseball'
                  ? '⚾ PICKS MÁS SÓLIDOS — MLB'
                  : parlay.picks[0]?.sport === 'tennis'
                  ? '🎾 PICKS MÁS SÓLIDOS — TENIS'
                  : '⚽ PICKS MÁS SÓLIDOS DEL DÍA'}
              </div>
              <div className={styles.oddsTotal}>
                Cuota total: <span>{parlay.totalOdds.toFixed(2)}</span>
              </div>
            </div>

            <div className={styles.picksList}>
              {parlay.picks.map((pick, i) => (
                <div key={i} className={styles.pickItem}>
                  <div className={styles.pickMatch}>
                    <span className={styles.sportIcon}>{pick.icon || (pick.sport === 'tennis' ? '🎾' : pick.sport === 'basketball' ? '🏀' : pick.sport === 'baseball' ? '⚾' : '⚽')}</span>
                    {pick.sport === 'basketball' || pick.sport === 'baseball' || pick.sport === 'tennis' 
                      ? `${pick.match.player1Name} vs ${pick.match.player2Name}` 
                      : `${pick.match.homeTeam} vs ${pick.match.awayTeam}`
                    }
                  </div>
                  <div className={styles.pickSelection}>
                    <span className={styles.selectionName}>{pick.description}</span>
                    <span className={styles.selectionOdds}>@{pick.odds.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.confidence}>
                Confianza: <span className={styles.confHigh}>ALTA</span>
              </div>
              <div className={styles.probBadge}>
                Prob. Combinada: <span>{(parlay.combinedProb * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
