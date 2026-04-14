import React from 'react';
import styles from './MatchCard.module.css';

interface MatchCardProps {
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    date: Date;
    picks: PickData[];
  };
}

interface PickData {
  id: string;
  market: string;
  selection: string;
  odds: number;
  confidenceScore: number;
  isBestOfTheDay: boolean;
  valueLabel: string;
  explanation: string;
}

export default function MatchCard({ match }: MatchCardProps) {
  const bestPick = match.picks[0]; // Assuming we pass the best pick first
  
  if (!bestPick) return null;

  return (
    <div className={`glass-panel ${styles.card} ${bestPick.isBestOfTheDay ? styles.bestPick : ''}`}>
      <div className={styles.header}>
        <span className={styles.league}>{match.league}</span>
        <span style={{textAlign: 'right'}}>{new Date(match.date).toLocaleString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      
      <div className={styles.teams}>
        <span>{match.homeTeam}</span>
        <span className={styles.vs}>vs</span>
        <span>{match.awayTeam}</span>
      </div>

      <div className={styles.pickContainer}>
        <div className={styles.pickInfo}>
          <span className={styles.pickLabel}>Top Pick ({bestPick.market})</span>
          <span className={styles.pickValue}>{bestPick.selection} @ {bestPick.odds.toFixed(2)}</span>
          <div style={{marginTop: '4px'}}>
            <span className={`badge badge-${bestPick.valueLabel.toLowerCase()}`}>{bestPick.valueLabel} VALUE</span>
          </div>
        </div>
        <div className={styles.confidenceContainer}>
          <span className={styles.pickLabel}>Confianza</span>
          <span className={styles.confidenceScore}>{bestPick.confidenceScore}%</span>
        </div>
      </div>
      
      <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: '#94A3B8', lineHeight: '1.4' }}>
        <strong>🧐 ¿Por qué este pick? </strong> 
        {bestPick.explanation}
      </div>
    </div>
  );
}
