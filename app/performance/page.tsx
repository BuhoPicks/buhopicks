import prisma from '@/lib/prisma';
import styles from './page.module.css';

export const revalidate = 0;

export default async function PerformancePage() {
  const allPicks = await prisma.tennisPick.findMany({
    include: { match: { select: { surface: true, circuit: true, tournament: true, tournamentLevel: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const settled = allPicks.filter(p => ['WON', 'LOST', 'VOID'].includes(p.status));
  const won  = settled.filter(p => p.status === 'WON');
  const lost = settled.filter(p => p.status === 'LOST');

  // Overall stats
  const totalSettled = won.length + lost.length;
  const hitRate  = totalSettled > 0 ? won.length / totalSettled : 0;
  const totalROI = totalSettled > 0 
    ? (won.reduce((s, p) => s + (p.odds - 1), 0) - lost.length) / totalSettled : 0;
  const avgConf = allPicks.length > 0
    ? allPicks.reduce((s, p) => s + p.confidenceScore, 0) / allPicks.length : 0;
  const avgEV = allPicks.length > 0
    ? allPicks.reduce((s, p) => s + p.expectedValue, 0) / allPicks.length : 0;
  const avgOdds = allPicks.length > 0
    ? allPicks.reduce((s, p) => s + p.odds, 0) / allPicks.length : 0;

  // By market
  const markets = ['MATCH_WINNER', 'GAMES_OVER_UNDER', 'GAMES_HANDICAP', 'FIRST_SET_WINNER', 'TOTAL_SETS'];
  const marketLabels: Record<string, string> = {
    MATCH_WINNER: 'Ganador',
    GAMES_OVER_UNDER: 'Total Games',
    GAMES_HANDICAP: 'Handicap',
    FIRST_SET_WINNER: 'Primer Set',
    TOTAL_SETS: 'Total Sets',
  };

  const byMarket = markets.map(m => {
    const mp = settled.filter(p => p.market === m);
    const mw = mp.filter(p => p.status === 'WON').length;
    const ml = mp.filter(p => p.status !== 'WON').length;
    const hr = mp.length > 0 ? mw / mp.length : 0;
    return { market: m, label: marketLabels[m], total: mp.length, won: mw, hitRate: hr };
  }).filter(m => m.total > 0);

  // By surface
  const surfaces = ['Hard', 'Clay', 'Grass'];
  const bySurface = surfaces.map(s => {
    const sp = settled.filter(p => p.match.surface === s);
    const sw = sp.filter(p => p.status === 'WON').length;
    const hr = sp.length > 0 ? sw / sp.length : 0;
    return { surface: s, total: sp.length, won: sw, hitRate: hr };
  }).filter(s => s.total > 0);

  // Cumulative P&L (for chart)
  let cumulative = 0;
  const cumulativeData = settled.map(p => {
    cumulative += p.status === 'WON' ? p.odds - 1 : -1;
    return Math.round(cumulative * 100) / 100;
  });

  // Simulate P&L if no data
  const chartData = cumulativeData.length > 0 ? cumulativeData :
    Array.from({ length: 12 }, (_, i) => parseFloat(((Math.sin(i * 0.5) * 2 + i * 0.3)).toFixed(2)));

  const minVal = Math.min(...chartData, -1);
  const maxVal = Math.max(...chartData, 1);
  const range = maxVal - minVal || 1;

  // SVG path
  const chartWidth = 600;
  const chartHeight = 180;
  const points = chartData.map((v, i) => {
    const x = (i / (chartData.length - 1 || 1)) * chartWidth;
    const y = chartHeight - ((v - minVal) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const areaPath = `M0,${chartHeight} L${chartData.map((v, i) => {
    const x = (i / (chartData.length - 1 || 1)) * chartWidth;
    const y = chartHeight - ((v - minVal) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' L')} L${chartWidth},${chartHeight} Z`;

  const lastVal = chartData[chartData.length - 1] ?? 0;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}><span className="text-gradient">Rendimiento</span></h1>
        <p className={styles.pageSubtitle}>Métricas históricas del sistema de picks</p>
      </header>

      {/* KPI Grid */}
      <div className={`${styles.kpiGrid} animate-in`}>
        {[
          { label: 'Hit Rate', value: totalSettled > 0 ? `${(hitRate * 100).toFixed(1)}%` : '—', sub: `${won.length}W / ${lost.length}L`, color: hitRate > 0.55 ? 'var(--high)' : hitRate > 0.45 ? '#FBBF24' : 'var(--low)' },
          { label: 'ROI Total', value: totalSettled > 0 ? `${totalROI >= 0 ? '+' : ''}${(totalROI * 100).toFixed(1)}%` : '—', sub: 'por unidad', color: totalROI >= 0 ? 'var(--high)' : 'var(--low)' },
          { label: 'Confianza Media', value: `${avgConf.toFixed(0)}%`, sub: 'score 0-100', color: 'var(--brand)' },
          { label: 'EV Medio', value: `+${(avgEV * 100).toFixed(1)}%`, sub: 'valor esperado', color: 'var(--premium)' },
          { label: 'Cuota Media', value: avgOdds > 0 ? avgOdds.toFixed(2) : '—', sub: 'odds promedio', color: 'var(--text-primary)' },
          { label: 'Total Picks', value: String(allPicks.length), sub: `${settled.length} liquidados`, color: 'var(--text-primary)' },
        ].map((kpi, i) => (
          <div key={kpi.label} className={`glass ${styles.kpiCard} animate-in delay-${i + 1}`}>
            <span className={styles.kpiLabel}>{kpi.label}</span>
            <span className={styles.kpiValue} style={{ color: kpi.color }}>{kpi.value}</span>
            <span className={styles.kpiSub}>{kpi.sub}</span>
          </div>
        ))}
      </div>

      {/* P&L Chart */}
      <div className={`glass ${styles.chartCard} animate-in delay-2`}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>P&L Acumulado</h2>
          <span className={styles.chartBadge} style={{ color: lastVal >= 0 ? 'var(--high)' : 'var(--low)' }}>
            {lastVal >= 0 ? '+' : ''}{lastVal.toFixed(2)}u
          </span>
        </div>
        <div className={styles.chartWrap}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`} className={styles.chart} preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lastVal >= 0 ? '#22C55E' : '#EF4444'} stopOpacity="0.4" />
                <stop offset="100%" stopColor={lastVal >= 0 ? '#22C55E' : '#EF4444'} stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Zero line */}
            <line
              x1="0" y1={chartHeight - ((0 - minVal) / range) * chartHeight}
              x2={chartWidth} y2={chartHeight - ((0 - minVal) / range) * chartHeight}
              stroke="rgba(255,255,255,0.10)" strokeWidth="1" strokeDasharray="4 4"
            />
            {/* Area */}
            <path d={areaPath} fill="url(#chartGrad)" />
            {/* Line */}
            <polyline
              points={points}
              fill="none"
              stroke={lastVal >= 0 ? '#22C55E' : '#EF4444'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {settled.length === 0 && (
            <div className={styles.chartOverlay}>
              <span>Gráfica disponible tras liquidar picks</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.tables2col}>
        {/* By Market */}
        {byMarket.length > 0 && (
          <div className={`glass ${styles.tableCard} animate-in delay-3`}>
            <h3 className={styles.tableTitle}>Por Tipo de Pick</h3>
            <table className={styles.table}>
              <thead><tr><th>Mercado</th><th>Picks</th><th>Ganados</th><th>Hit Rate</th></tr></thead>
              <tbody>
                {byMarket.map(m => (
                  <tr key={m.market} className={styles.tableRow}>
                    <td className={styles.marketCell}>{m.label}</td>
                    <td>{m.total}</td>
                    <td style={{ color: 'var(--high)', fontWeight: '700' }}>{m.won}</td>
                    <td>
                      <span style={{ color: m.hitRate > 0.55 ? 'var(--high)' : '#FBBF24', fontWeight: '700', fontFamily: 'monospace' }}>
                        {(m.hitRate * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* By Surface */}
        {bySurface.length > 0 && (
          <div className={`glass ${styles.tableCard} animate-in delay-4`}>
            <h3 className={styles.tableTitle}>Por Superficie</h3>
            <table className={styles.table}>
              <thead><tr><th>Superficie</th><th>Picks</th><th>Ganados</th><th>Hit Rate</th></tr></thead>
              <tbody>
                {bySurface.map(s => (
                  <tr key={s.surface} className={styles.tableRow}>
                    <td>
                      <span className={`badge badge-${s.surface.toLowerCase()}`}>{s.surface}</span>
                    </td>
                    <td>{s.total}</td>
                    <td style={{ color: 'var(--high)', fontWeight: '700' }}>{s.won}</td>
                    <td>
                      <span style={{ color: s.hitRate > 0.55 ? 'var(--high)' : '#FBBF24', fontWeight: '700', fontFamily: 'monospace' }}>
                        {(s.hitRate * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {byMarket.length === 0 && bySurface.length === 0 && (
          <div className={`glass ${styles.emptyTables}`}>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
              Las métricas detalladas aparecerán tras liquidar picks.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
