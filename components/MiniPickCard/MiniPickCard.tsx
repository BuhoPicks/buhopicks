'use client';

import PickDetailModal from '@/components/PickDetailModal/PickDetailModal';
import Link from 'next/link';
import styles from '@/app/page.module.css';

interface MiniPickCardProps {
  pick: any;
  sport: string;
  animClass: string;
  localTime?: string;
}

export default function MiniPickCard({ pick, sport, animClass, localTime }: MiniPickCardProps) {
  const matchup = sport === 'tennis'
    ? { player1: pick.parentMatch.player1Name, player2: pick.parentMatch.player2Name }
    : sport === 'football'
    ? { player1: pick.parentMatch.homeTeam, player2: pick.parentMatch.awayTeam }
    : { player1: pick.match?.player1Name || '', player2: pick.match?.player2Name || '' };

  const tournament = sport === 'tennis' ? pick.parentMatch?.tournament 
    : sport === 'football' ? pick.parentMatch?.league 
    : '';

  return (
    <PickDetailModal
      pick={{
        description: pick.description,
        odds: pick.odds,
        expectedValue: pick.expectedValue,
        confidenceScore: pick.confidenceScore || 65,
        valueLabel: pick.valueLabel || 'MEDIUM',
        explanation: pick.explanation || null,
        statsBreakdown: pick.statsBreakdown || null,
        market: pick.market || '',
        selection: pick.selection || '',
      }}
      matchInfo={{
        player1: matchup.player1,
        player2: matchup.player2,
        tournament,
        time: localTime,
        sport,
      }}
    >
      <div className={`${styles.miniPickCard} ${animClass}`}>
        <div className={styles.miniPickMeta}>
          <span className={styles.miniTourn}>{tournament}</span>
          <span className={styles.miniCircuit}>
            {localTime ? `${localTime} hrs` : ''}
          </span>
        </div>
        <div className={styles.miniMatchup}>
          {matchup.player1} vs {matchup.player2}
        </div>
        <div className={styles.miniPickInfo}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {pick.market && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{pick.market}</span>}
            <span className={styles.miniPickDesc} style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}>{pick.description}</span>
          </div>
          <span className={styles.miniOdds}>{pick.odds.toFixed(2)}</span>
        </div>
        <div className={styles.miniEV}>
          EV: <span style={{ color: 'var(--premium)' }}>+{(pick.expectedValue * 100).toFixed(1)}%</span>
        </div>
        <div className={styles.clickHint}>Toca para ver análisis 🦉</div>
      </div>
    </PickDetailModal>
  );
}
