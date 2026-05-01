import Link from 'next/link';
import styles from '@/app/page.module.css';
import { getHorseRacingPick } from '@/lib/horseRacingEngine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HorseRacingPage() {
  const pick = await getHorseRacingPick();

  return (
    <div className={styles.page}>
      <div className={styles.sportBg} style={{ backgroundImage: "url('/bg_baseball.png')" }} />
      <header className={styles.pageHeader}>
        <div className={styles.headerTop}>
          <div className={styles.brandGroup}>
            <h1 className={styles.pageTitle} style={{ fontSize: '2.8rem', lineHeight: 1 }}>
              <span className="text-gradient">Búho Picks</span>
              <div style={{ fontSize: '0.8rem', letterSpacing: '0.3em', color: 'var(--premium)', marginTop: '4px', textAlign: 'center', fontWeight: 900 }}>GRUPO VIP</div>
            </h1>
            <div className={styles.sportNav}>
              {[
                { key: 'tennis', emoji: '🎾', label: 'Tenis', href: '/tennis' },
                { key: 'football', emoji: '⚽', label: 'Fútbol', href: '/football' },
                { key: 'basketball', emoji: '🏀', label: 'NBA', href: '/basketball' },
                { key: 'baseball', emoji: '⚾', label: 'MLB', href: '/baseball' },
                { key: 'esports', emoji: '🎮', label: 'eSports', href: '/esports' },
                { key: 'horseracing', emoji: '🏇', label: 'Caballos', href: '/horseracing' },
              ].map(s => (
                <Link key={s.key} href={s.href} className={`${styles.sportTab} ${s.key === 'horseracing' ? styles.activeHorseracing : ''}`}>
                  <span className={styles.sportEmoji}>{s.emoji}</span> {s.label}
                </Link>
              ))}
            </div>
          </div>
          <div className={styles.headerRight}>
            <Link href="/admin" className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>⚙️ Admin</Link>
          </div>
        </div>
        <div className={styles.headerBottom}>
          <p className={styles.pageSubtitle}>El mejor pick de carreras de caballos del día — Un solo caballo ganador</p>
        </div>
      </header>

      {pick ? (
        <section className="animate-in delay-1" style={{ marginBottom: '3rem' }}>
          <div className={styles.premiumLabel}><span>🏇</span> PICK PREMIUM — CABALLO GANADOR DEL DÍA</div>
          <div style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(15, 23, 42, 0.95))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '32px',
            padding: '3rem',
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '3rem',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 40px 100px -20px rgba(0,0,0,0.5), inset 0 0 80px rgba(34, 197, 94, 0.05)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>🏇</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.2em', color: '#22C55E' }}>CARRERAS DE CABALLOS</span>
              </div>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '0.75rem', color: 'white' }}>{pick.match.player1Name}</h2>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{pick.raceName} — {pick.track}</p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1.5rem',
                background: 'rgba(255,255,255,0.05)', padding: '1rem 1.5rem',
                borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', width: 'fit-content',
              }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>{pick.description}</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#22C55E', fontFamily: "'JetBrains Mono', monospace" }}>@{pick.odds.toFixed(2)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                <svg viewBox="0 0 36 36" style={{ display: 'block', margin: '10px auto', maxWidth: '100%', maxHeight: '250px' }}>
                  <path style={{ fill: 'none', stroke: 'rgba(255,255,255,0.05)', strokeWidth: 2.8 }} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path style={{ fill: 'none', strokeWidth: 2.8, strokeLinecap: 'round', stroke: '#22C55E', strokeDasharray: `${pick.confidenceScore}, 100` }} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>{pick.confidenceScore}%</span>
                  <small style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: '#22C55E', letterSpacing: '0.1em', fontWeight: 700 }}>Solidez</small>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {pick.explanation.length > 250 ? pick.explanation.substring(0, 250) + '...' : pick.explanation}
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🏇</div>
          <h3 className={styles.emptyTitle}>No hay carreras programadas hoy</h3>
          <p className={styles.emptyText}>No encontramos carreras de caballos con datos suficientes para recomendar un pick hoy. Vuelve mañana.</p>
        </div>
      )}
    </div>
  );
}
