import React from 'react';
import styles from './FootballMatchCard.module.css';

interface FootballMatchCardProps {
  match: any;
  picks: any[];
  className?: string;
  featured?: boolean;
}

export default function FootballMatchCard({ match, picks, className = '', featured = false }: FootballMatchCardProps) {
  const dateStr = new Date(match.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`${styles.card} ${featured ? styles.featured : ''} ${className}`}>
      <div className={styles.header}>
        <div className={styles.leagueInfo}>
          {match.leagueLogo && <img src={match.leagueLogo} alt={match.league} className={styles.leagueLogo} />}
          <span className={styles.leagueName}>{match.league}</span>
        </div>
        <span className={styles.matchTime}>{dateStr}</span>
      </div>

      <div className={styles.matchup}>
        <div className={styles.team}>
          {match.homeLogo && <img src={match.homeLogo} alt={match.homeTeam} className={styles.teamLogo} />}
          <span className={styles.teamName}>{match.homeTeam}</span>
        </div>
        <div className={styles.vs}>VS</div>
        <div className={styles.team}>
          {match.awayLogo && <img src={match.awayLogo} alt={match.awayTeam} className={styles.teamLogo} />}
          <span className={styles.teamName}>{match.awayTeam}</span>
        </div>
      </div>

      <div className={styles.picksList}>
        {picks.map((pick) => (
          <div key={pick.id} className={styles.pickItem}>
            <div className={styles.pickMain}>
              <span className={styles.pickMarket}>{pick.market}:</span>
              <span className={styles.pickSelection}>{pick.selection}</span>
            </div>
            <div className={styles.pickOdds}>
              <span className={styles.oddsValue}>{pick.odds.toFixed(2)}</span>
              <div className={styles.evBadge}>
                EV: +{(pick.expectedValue * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {featured && picks[0] && (
        <div className={styles.explanation}>
          <strong>Análisis:</strong> {picks[0].explanation}
        </div>
      )}
    </div>
  );
}
