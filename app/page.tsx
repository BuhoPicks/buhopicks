import Link from 'next/link';
import prisma from '@/lib/prisma';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

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

  return (
    <div className={styles.landingContainer}>
      <header className={styles.landingHeader}>
        <h1 className={styles.landingTitle}>
          <span className="text-gradient">Búho Picks</span>
        </h1>
        <p className={styles.landingSubtitle}>Análisis deportivo automático 24/7</p>
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
            <p className={styles.cardDesc}>Parlay Diario</p>
            <div className={styles.cardPreview}>
              1 parlay optimizado por día
            </div>
            <span className={styles.cardAction}>Entrar →</span>
          </div>
        </Link>

        <Link href="/baseball" className={`${styles.landingCard} ${styles.cardBaseball}`}>
          <div className={styles.cardEmoji}>⚾</div>
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Panel MLB</h2>
            <p className={styles.cardDesc}>Parlay Diario</p>
            <div className={styles.cardPreview}>
              1 parlay optimizado por día
            </div>
            <span className={styles.cardAction}>Entrar →</span>
          </div>
        </Link>
      </div>

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
