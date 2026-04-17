import React from 'react';
import Link from 'next/link';
import styles from './TennisMatchCard.module.css';

interface Pick {
  id: string;
  market: string;
  selection: string;
  description: string;
  odds: number;
  estimatedProb: number;
  expectedValue: number;
  confidenceScore: number;
  valueLabel: string;
  isPremiumPick: boolean;
  explanation: string;
}

interface Match {
  id: string;
  player1Name: string;
  player2Name: string;
  player1Ranking?: number | null;
  player2Ranking?: number | null;
  player1Country?: string | null;
  player2Country?: string | null;
  tournament: string;
  circuit: string;
  round?: string | null;
  surface: string;
  tournamentLevel: string;
  indoor: boolean;
  date: Date;
  status: string;
}

interface TennisMatchCardProps {
  match: Match;
  picks: Pick[];
  featured?: boolean;
  className?: string;
}

const MARKET_LABELS: Record<string, string> = {
  MATCH_WINNER:     '🏆 Ganador del Partido',
  GAMES_OVER_UNDER: '📊 Total de Games',
  GAMES_HANDICAP:   '➕ Handicap Games',
  FIRST_SET_WINNER: '1️⃣ Primer Set',
  TOTAL_SETS:       '🔢 Total de Sets',
};

const SURFACE_EMOJIS: Record<string, string> = {
  Hard:   '🔵',
  Clay:   '🟠',
  Grass:  '🟢',
  Carpet: '🟣',
};

const LEVEL_LABELS: Record<string, string> = {
  GS:         'Grand Slam',
  Masters:    'Masters 1000',
  '500':      'ATP/WTA 500',
  '250':      'ATP/WTA 250',
  Challenger: 'Challenger',
  ITF:        'ITF',
};

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'America/Mexico_City'
  });
}

export default function TennisMatchCard({ match, picks, featured, className }: TennisMatchCardProps) {
  const bestPick = picks[0];
  if (!bestPick) return null;

  const surfaceClass = match.surface.toLowerCase();
  const circuitClass = match.circuit.toLowerCase();
  const levelClass = match.tournamentLevel === 'GS' ? 'gs' :
    match.tournamentLevel === 'Masters' ? 'm1000' :
    match.tournamentLevel === '500' ? '500' : '250';

  const confidenceClass =
    bestPick.confidenceScore >= 75 ? 'premium' :
    bestPick.confidenceScore >= 65 ? 'high' :
    bestPick.confidenceScore >= 55 ? 'medium' : 'low';

  const valueBadgeClass =
    bestPick.valueLabel === 'PREMIUM' ? 'premium' :
    bestPick.valueLabel === 'HIGH'    ? 'high' :
    bestPick.valueLabel === 'MEDIUM'  ? 'medium' : 'low';

  const evDisplay = bestPick.expectedValue >= 0
    ? `+${(bestPick.expectedValue * 100).toFixed(1)}%`
    : `${(bestPick.expectedValue * 100).toFixed(1)}%`;

  const evPositive = bestPick.expectedValue > 0;

  return (
    <Link href={`/match/${match.id}`} className={`${styles.card} ${featured ? styles.featured : ''} ${className || ''}`}>
      {featured && <div className={styles.featuredGlow} />}

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={`badge badge-${circuitClass}`}>{match.circuit}</span>
          <span className={`badge badge-${levelClass}`}>{LEVEL_LABELS[match.tournamentLevel] || match.tournamentLevel}</span>
          {match.indoor && <span className="badge badge-indoor">Indoor</span>}
        </div>
        <div className={styles.headerRight}>
          <span className={`badge badge-${surfaceClass}`}>
            {SURFACE_EMOJIS[match.surface]} {match.surface}
          </span>
          <div className={styles.timeInfo}>
            <span className={styles.date}>{new Date(match.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', timeZone: 'America/Mexico_City' })}</span>
            <span className={styles.time}>{formatTime(match.date)}</span>
          </div>
        </div>
      </div>

      {/* ── Tournament ── */}
      <div className={styles.tournament}>
        {match.tournament}
        {match.round && <span className={styles.round}>{match.round}</span>}
      </div>

      {/* ── Players ── */}
      <div className={styles.players}>
        <div className={styles.player}>
          <div className={styles.playerName}>{match.player1Name}</div>
          {match.player1Ranking && (
            <div className={styles.ranking}>#{match.player1Ranking}</div>
          )}
          {match.player1Country && (
            <div className={styles.country}>{match.player1Country}</div>
          )}
        </div>

        <div className={styles.vsBlock}>
          <span className={styles.vs}>VS</span>
        </div>

        <div className={`${styles.player} ${styles.playerRight}`}>
          <div className={styles.playerName}>{match.player2Name}</div>
          {match.player2Ranking && (
            <div className={styles.ranking}>#{match.player2Ranking}</div>
          )}
          {match.player2Country && (
            <div className={styles.country}>{match.player2Country}</div>
          )}
        </div>
      </div>

      {/* ── Pick Section ── */}
      <div className={styles.pickSection}>
        <div className={styles.pickHeader}>
          <span className={styles.pickMarket}>{MARKET_LABELS[bestPick.market] || bestPick.market}</span>
          <span className={`badge badge-${valueBadgeClass}`}>
            {bestPick.valueLabel === 'PREMIUM' ? '⭐ PREMIUM' : bestPick.valueLabel + ' VALUE'}
          </span>
        </div>

        <div className={styles.pickMain}>
          <div className={styles.selectionBlock}>
            <span className={styles.selection}>{bestPick.description}</span>
          </div>
          <div className={styles.oddsBlock}>
            <span className={styles.odds}>{bestPick.odds.toFixed(2)}</span>
            <span className={styles.oddsLabel}>cuota</span>
          </div>
        </div>

        {/* Confidence bar */}
        <div className={styles.confidenceRow}>
          <span className={styles.confidenceLabel}>Confianza</span>
          <div className={styles.barWrap}>
            <div
              className={`${styles.bar} ${styles[`bar-${confidenceClass}`]}`}
              style={{ '--target-width': `${bestPick.confidenceScore}%` } as React.CSSProperties}
            />
          </div>
          <span className={`${styles.confidenceValue} ${styles[`conf-${confidenceClass}`]}`}>
            {bestPick.confidenceScore}%
          </span>
        </div>

        {/* EV */}
        <div className={styles.evRow}>
          <span className={styles.evLabel}>Valor Esperado</span>
          <span className={`${styles.evValue} ${evPositive ? styles.evPositive : styles.evNegative}`}>
            {evDisplay}
          </span>
          <span className={styles.probLabel}>Prob. {(bestPick.estimatedProb * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* ── Explanation snippet ── */}
      <div className={styles.explanation}>
        <span className={styles.explainIcon}>💡</span>
        <p className={styles.explainText}>{bestPick.explanation.slice(0, 140)}…</p>
      </div>

      {/* Additional picks badge */}
      {picks.length > 1 && (
        <div className={styles.morePicks}>
          +{picks.length - 1} pick{picks.length > 2 ? 's' : ''} más →
        </div>
      )}
    </Link>
  );
}
