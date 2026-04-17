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
          <span className={styles.icon}>💎</span> Sugerencias de Parlay para {day === 'today' ? 'Hoy' : 'Mañana'}
        </h2>
        <p className={styles.subtitle}>Combinaciones optimizadas por nuestro algoritmo estadístico.</p>
      </div>

      <div className={styles.grid}>
        {parlays.map((parlay, pi) => (
          <div key={`${parlay.type}-${pi}`} className={`${styles.card} ${parlay.type === 'solid' ? styles.cardSolid : parlay.type === 'aggressive' ? styles.cardAggressive : styles.cardUsa}`}>
            <div className={styles.cardHeader}>
              <div className={styles.typeLabel}>
                {parlay.dayLabel && <span className={styles.dayTag}>{parlay.dayLabel}</span>}
                {parlay.type === 'solid' ? '🦉 PARLAY DEL DÍA' 
                  : parlay.type === 'aggressive' ? '🚀 PARLAY AGRESIVO' 
                  : parlay.picks[0]?.sport === 'basketball' ? '🏀 PARLAY NBA' 
                  : parlay.picks[0]?.sport === 'baseball' ? '⚾ PARLAY MLB'
                  : '🇺🇸 PARLAY USA'}
              </div>
              <div className={styles.oddsTotal}>
                Cuota: <span>{parlay.totalOdds.toFixed(2)}</span>
              </div>
            </div>

            <div className={styles.picksList}>
              {parlay.picks.map((pick, i) => (
                <div key={i} className={styles.pickItem}>
                  <div className={styles.pickMatch}>
                    <span className={styles.sportIcon}>{pick.icon || (pick.sport === 'tennis' ? '🎾' : '⚽')}</span>
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
                Confianza: <span className={parlay.type === 'solid' ? styles.confHigh : parlay.type === 'usa' ? styles.confUsa : styles.confMed}>
                  {parlay.type === 'solid' ? 'ALTA' : parlay.type === 'usa' ? 'MEDIA/ALTA' : 'MEDIA'}
                </span>
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
