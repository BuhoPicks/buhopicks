import Link from 'next/link';
import styles from '@/app/page.module.css';
import MiniPickCard from '@/components/MiniPickCard/MiniPickCard';
import { getEsportsPicks } from '@/lib/esportsEngine';
import OptimizeButton from '@/components/OptimizeButton/OptimizeButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EsportsPage() {
  const picks = await getEsportsPicks();
  const premiumPick = picks.find(p => p.isPremiumPick) || picks[0] || null;

  return (
    <div className={styles.page}>
      <div className={styles.sportBg} style={{ backgroundImage: "url('/bg_esports.png')" }} />
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
                <Link key={s.key} href={s.href} className={`${styles.sportTab} ${s.key === 'esports' ? styles.activeEsports : ''}`}>
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
          <p className={styles.pageSubtitle}>Los 3 mejores picks de eSports del día — LoL, CS2, Valorant, Dota 2</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <OptimizeButton label="Optimizar Modelo eSports" sport="esports" />
          </div>
        </div>
      </header>

      {premiumPick && (
        <section className="animate-in delay-1" style={{ marginBottom: '3rem' }}>
          <div className={styles.premiumLabel}><span>⭐</span> PICK PREMIUM ESPORTS DEL DÍA</div>
          <div className={styles.miniPickCard} style={{ 
            border: '1px solid rgba(139, 92, 246, 0.4)',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(0,0,0,0.6))',
            padding: '2rem',
          }}>
            <div className={styles.miniPickMeta}>
              <span className={styles.miniCircuit}>{premiumPick.game}</span>
              <span style={{ color: 'var(--premium)', fontWeight: 900 }}>🏆 PREMIUM</span>
            </div>
            <div className={styles.miniMatchup}>{premiumPick.match.player1Name} vs {premiumPick.match.player2Name}</div>
            <div className={styles.miniPickInfo}>
              <span className={styles.miniPickDesc}>{premiumPick.description}</span>
              <span className={styles.miniOdds}>@{premiumPick.odds.toFixed(2)}</span>
            </div>
            <div className={styles.miniEV}>
              <span>Confianza: {premiumPick.confidenceScore}%</span>
              <span>EV: {premiumPick.expectedValue >= 0 ? '+' : ''}{(premiumPick.expectedValue * 100).toFixed(1)}%</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.6 }}>{premiumPick.explanation}</p>
          </div>
        </section>
      )}

      {picks.length > 0 ? (
        <section className={styles.matchesSection} style={{ marginTop: '2rem' }}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><span className={styles.sectionIcon}>🎮</span> Picks más sólidos de eSports</h2>
          </div>
          <div className={styles.top12Grid}>
            {picks.map((pick: any, i: number) => (
              <MiniPickCard key={`esports-${i}`} pick={pick} sport="esports" animClass={`animate-in delay-${Math.min(i, 8)}`} />
            ))}
          </div>
        </section>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎮</div>
          <h3 className={styles.emptyTitle}>No hay picks de eSports disponibles hoy</h3>
          <p className={styles.emptyText}>No encontramos partidas programadas con suficiente confianza para recomendar. Vuelve mañana.</p>
        </div>
      )}
    </div>
  );
}
