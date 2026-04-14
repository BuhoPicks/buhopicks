'use client';

import { useState } from 'react';
import styles from './PickDetailModal.module.css';

interface PickDetailModalProps {
  children: React.ReactNode;
  pick: {
    description: string;
    odds: number;
    expectedValue: number;
    confidenceScore: number;
    valueLabel: string;
    explanation?: string | null;
    statsBreakdown?: string | null;
    market?: string;
    selection?: string;
  };
  matchInfo: {
    player1: string;
    player2: string;
    tournament?: string;
    time?: string;
    sport: string;
  };
}

export default function PickDetailModal({ children, pick, matchInfo }: PickDetailModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const confidenceColor = pick.confidenceScore >= 75 ? '#4ADE80' 
    : pick.confidenceScore >= 60 ? '#FBBF24' 
    : '#F87171';

  const valueLabelColor = pick.valueLabel === 'PREMIUM' ? '#A78BFA'
    : pick.valueLabel === 'HIGH' ? '#4ADE80'
    : pick.valueLabel === 'MEDIUM' ? '#FBBF24'
    : '#9CA3AF';

  return (
    <>
      <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); }} style={{ cursor: 'pointer' }}>
        {children}
      </div>

      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.header}>
              <div>
                <span className={styles.sport}>
                  {matchInfo.sport === 'tennis' ? '🎾' : matchInfo.sport === 'football' ? '⚽' : matchInfo.sport === 'basketball' ? '🏀' : '⚾'}
                  {' '}{matchInfo.tournament || ''}
                </span>
                {matchInfo.time && <span className={styles.time}>⏰ {matchInfo.time}</span>}
              </div>
              <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>✕</button>
            </div>

            {/* Matchup */}
            <h2 className={styles.matchup}>
              {matchInfo.player1} <span className={styles.vs}>vs</span> {matchInfo.player2}
            </h2>

            {/* Pick Card */}
            <div className={styles.pickCard}>
              <div className={styles.pickRow}>
                <span className={styles.pickLabel}>🎯 Pick Seleccionado</span>
                <span className={styles.pickOdds}>@{pick.odds.toFixed(2)}</span>
              </div>
              <p className={styles.pickDesc}>{pick.description}</p>
              
              <div className={styles.metricsRow}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Confianza</span>
                  <div className={styles.confidenceBar}>
                    <div className={styles.confidenceFill} style={{ width: `${pick.confidenceScore}%`, background: confidenceColor }} />
                  </div>
                  <span className={styles.metricValue} style={{ color: confidenceColor }}>{pick.confidenceScore}%</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Valor Esperado</span>
                  <span className={styles.metricValue} style={{ color: '#A78BFA' }}>+{(pick.expectedValue * 100).toFixed(1)}%</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Categoría</span>
                  <span className={styles.badge} style={{ background: `${valueLabelColor}22`, color: valueLabelColor, borderColor: `${valueLabelColor}44` }}>
                    {pick.valueLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>🦉 ¿Por qué este pick?</h3>
              <p className={styles.explanation}>
                {pick.explanation || generateDefaultExplanation(pick, matchInfo)}
              </p>
            </div>

            {/* Stats Breakdown */}
            {pick.statsBreakdown && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>📊 Desglose Estadístico</h3>
                <div className={styles.statsGrid}>
                  {(() => {
                    try {
                      const stats = typeof pick.statsBreakdown === 'string' 
                        ? JSON.parse(pick.statsBreakdown) 
                        : pick.statsBreakdown;
                      return Object.entries(stats).map(([key, value]) => (
                        <div key={key} className={styles.statItem}>
                          <span className={styles.statKey}>{formatStatKey(key)}</span>
                          <span className={styles.statVal}>{String(value)}</span>
                        </div>
                      ));
                    } catch {
                      return <p className={styles.explanation}>{pick.statsBreakdown}</p>;
                    }
                  })()}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <p className={styles.disclaimer}>
              ⚠️ Las apuestas deportivas implican riesgo. Apuesta responsablemente.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function generateDefaultExplanation(pick: any, matchInfo: any): string {
  const odds = pick.odds;
  const conf = pick.confidenceScore;
  
  if (matchInfo.sport === 'basketball' || matchInfo.sport === 'baseball') {
    if (pick.description.includes('Over')) {
      return `Este prop se seleccionó porque el jugador ha mantenido promedios consistentes por encima de la línea propuesta. Con un promedio sólido y tendencia al alza, nuestro algoritmo detecta una probabilidad favorable de que supere esta marca. La cuota de ${odds.toFixed(2)} ofrece valor positivo.`;
    }
    return `Este pick se basa en el análisis del récord de temporada, rachas recientes y rendimiento como local/visitante. El equipo favorecido muestra métricas superiores en los indicadores clave, con una confianza del ${conf}%.`;
  }

  if (matchInfo.sport === 'football') {
    return `Pick seleccionado tras analizar forma reciente, rendimiento local/visitante, historial de enfrentamientos y tendencias estadísticas (goles, corners, posesión). La cuota de ${odds.toFixed(2)} ofrece un valor esperado positivo según nuestros modelos.`;
  }

  return `Pick basado en análisis de ranking, forma reciente (últimos 10 partidos), rendimiento por superficie, h2h y estadísticas de servicio/devolución. La probabilidad estimada de ${conf}% genera un valor esperado positivo frente a la cuota ofrecida de ${odds.toFixed(2)}.`;
}

function formatStatKey(key: string): string {
  const map: Record<string, string> = {
    'ranking_edge': 'Ventaja Ranking',
    'form_edge': 'Forma Reciente', 
    'surface_edge': 'Afinidad Superficie',
    'h2h_edge': 'Head to Head',
    'serve_edge': 'Servicio',
    'return_edge': 'Devolución',
    'fatigue_factor': 'Factor Fatiga',
    'home_advantage': 'Ventaja Local',
  };
  return map[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
