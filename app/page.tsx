import Link from 'next/link';
import prisma from '@/lib/prisma';
import styles from './page.module.css';
import ParlaySection from '@/components/ParlaySection/ParlaySection';
import { getBasketballParlay, getBaseballParlay } from '@/lib/usSportsEngine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getTopPicks() {
  const tennis = await prisma.tennisPick.findMany({
    take: 5,
    orderBy: { expectedValue: 'desc' },
    include: { match: true }
  });
  
  const football = await prisma.footballPick.findMany({
    take: 5,
    orderBy: { expectedValue: 'desc' },
    include: { match: true }
  });
  
  return { tennis, football };
}

export default async function LandingPage() {
  const { tennis, football } = await getTopPicks();
  
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date()).replace(/-/g, '');
  
  const nbaParlay = await getBasketballParlay(todayStr);
  const mlbParlay = await getBaseballParlay(todayStr);
  const parlays = [nbaParlay, mlbParlay].filter(Boolean) as any[];

  return (
    <div className={styles.landingContainer}>
      <div className={styles.sportBg} style={{ backgroundImage: "url('/hero-bg.png')" }} />
      <header className={styles.landingHeader}>
        <h1 className={styles.landingTitle} style={{ fontSize: '4.5rem', lineHeight: 0.9 }}>
          <span className="text-gradient">Búho Picks</span>
          <div style={{ fontSize: '1rem', letterSpacing: '0.4em', color: 'var(--premium)', marginTop: '0.5rem', fontWeight: 900 }}>
             GRUPO VIP
          </div>
        </h1>
        <p className={styles.landingSubtitle} style={{ marginTop: '1.5rem' }}>Análisis deportivo con Inteligencia Artificial</p>
      </header>

      <div className={styles.landingGrid}>
        <Link href="/tennis" className={`${styles.landingCard} ${styles.cardTennis}`}>
          <div className={styles.cardEmoji}>🎾</div>
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Panel Tenis</h2>
            <p className={styles.cardDesc}>ATP, WTA & ITF</p>
            <div className={styles.cardPreview}>
              {tennis.length} picks analizados hoy
            </div>
            <span className={styles.cardAction}>Entrar →</span>
          </div>
        </Link>

        <Link href="/football" className={`${styles.landingCard} ${styles.cardFootball}`}>
          <div className={styles.cardEmoji}>⚽</div>
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Panel Fútbol</h2>
            <p className={styles.cardDesc}>Ligas Europeas & Copa</p>
            <div className={styles.cardPreview}>
              {football.length} picks analizados hoy
            </div>
            <span className={styles.cardAction}>Entrar →</span>
          </div>
        </Link>

        <Link href="/basketball" className={`${styles.landingCard} ${styles.cardBasketball}`}>
          <div className={styles.cardEmoji}>🏀</div>
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Panel NBA</h2>
            <p className={styles.cardDesc}>Picks Individuales y Parlay</p>
            <div className={styles.cardPreview}>
              Análisis completo hoy y mañana
            </div>
            <span className={styles.cardAction}>Entrar →</span>
          </div>
        </Link>

        <Link href="/baseball" className={`${styles.landingCard} ${styles.cardBaseball}`}>
          <div className={styles.cardEmoji}>⚾</div>
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Panel MLB</h2>
            <p className={styles.cardDesc}>Picks Individuales y Parlay</p>
            <div className={styles.cardPreview}>
              Análisis completo hoy y mañana
            </div>
            <span className={styles.cardAction}>Entrar →</span>
          </div>
        </Link>
      </div>

      {parlays.length > 0 && (
        <div style={{ maxWidth: '1200px', margin: '0 auto 4rem auto', width: '100%' }}>
           <ParlaySection parlays={parlays} day="today" />
        </div>
      )}

      {/* Combined Quick View */}
      <section className={styles.quickView}>
        <h3 className={styles.quickTitle}>🔥 Picks Destacados del Día</h3>
        <div className={styles.quickGrid}>
          <div className={styles.quickCol}>
            <h4>Top Tenis</h4>
            {tennis.slice(0, 3).map(p => (
              <div key={p.id} className={styles.quickItem}>
                <span className={styles.quickMatch}>{p.match.player1Name} vs {p.match.player2Name}</span>
                <span className={styles.quickPick}>{p.description} (@{p.odds.toFixed(2)})</span>
              </div>
            ))}
          </div>
          <div className={styles.quickCol}>
            <h4>Top Fútbol</h4>
            {football.slice(0, 3).map(p => (
              <div key={p.id} className={styles.quickItem}>
                <span className={styles.quickMatch}>{p.match.homeTeam} vs {p.match.awayTeam}</span>
                <span className={styles.quickPick}>{p.description} (@{p.odds.toFixed(2)})</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className={styles.landingFooter}>
        <Link href="/admin" className="btn btn-ghost">⚙️ Configuración y Sincronización Manual</Link>
      </footer>
    </div>
  );
}
