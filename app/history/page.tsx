import prisma from '@/lib/prisma';
import styles from './history.module.css';
import Link from 'next/link';

export const revalidate = 0;

export default async function HistoryPage() {
  const tennisHistory = await prisma.tennisPick.findMany({
    where: { status: { not: 'PENDING' } },
    include: { match: true },
    orderBy: { settledAt: 'desc' },
    take: 50
  });

  const footballHistory = await prisma.footballPick.findMany({
    where: { status: { not: 'PENDING' } },
    include: { match: true },
    orderBy: { updatedAt: 'desc' }, // Football doesn't have settledAt yet in the schema, I'll use updatedAt
    take: 50
  });

  // Calculate stats
  const total = tennisHistory.length + footballHistory.length;
  const wins = [...tennisHistory, ...footballHistory].filter(p => p.status === 'WON').length;
  const losses = [...tennisHistory, ...footballHistory].filter(p => p.status === 'LOST').length;
  const accuracy = total > 0 ? (wins / (wins + losses)) * 100 : 0;
  
  const profit = tennisHistory.reduce((sum, p) => sum + (p.status === 'WON' ? p.odds - 1 : -1), 0) +
                 footballHistory.reduce((sum, p) => sum + (p.status === 'WON' ? p.odds - 1 : -1), 0);
  
  const yield_perc = total > 0 ? (profit / total) * 100 : 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/" className="btn btn-ghost">← Volver</Link>
          <h1 className={styles.title}>Historial de Picks</h1>
        </div>
        <div className={styles.statsSummary}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Acierto</span>
            <span className={styles.statValue}>{accuracy.toFixed(1)}%</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Profit</span>
            <span className={styles.statValue} style={{ color: profit >= 0 ? 'var(--premium)' : 'var(--low)' }}>
              {profit >= 0 ? '+' : ''}{profit.toFixed(2)}u
            </span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Yield</span>
            <span className={styles.statValue}>{yield_perc.toFixed(1)}%</span>
          </div>
        </div>
      </header>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Deporte</th>
              <th>Partido</th>
              <th>Pick</th>
              <th>Cuota</th>
              <th>Resultado</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            {[...tennisHistory.map(p => ({ ...p, sport: 'TENNIS' })), 
              ...footballHistory.map(p => ({ ...p, sport: 'FOOTBALL' }))]
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((pick, i) => {
                const isWin = pick.status === 'WON';
                const p = isWin ? pick.odds - 1 : -1;
                return (
                  <tr key={pick.id} className={styles.row}>
                    <td>{new Date(pick.updatedAt).toLocaleDateString('es-ES')}</td>
                    <td>{pick.sport === 'TENNIS' ? '🎾' : '⚽'}</td>
                    <td className={styles.matchCell}>
                      {pick.sport === 'TENNIS' 
                        ? `${(pick as any).match.player1Name} vs ${(pick as any).match.player2Name}`
                        : `${(pick as any).match.homeTeam} vs ${(pick as any).match.awayTeam}`}
                    </td>
                    <td>{pick.description}</td>
                    <td className={styles.odds}>{pick.odds.toFixed(2)}</td>
                    <td>
                      <span className={`badge badge-${pick.status.toLowerCase()}`}>
                        {pick.status}
                      </span>
                    </td>
                    <td style={{ color: p >= 0 ? 'var(--premium)' : 'var(--low)', fontWeight: 'bold' }}>
                      {p >= 0 ? '+' : ''}{p.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            {total === 0 && (
              <tr>
                <td colSpan={7} className={styles.empty}>No hay picks finalizados en el historial.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
