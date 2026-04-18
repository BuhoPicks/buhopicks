import Link from 'next/link';
import prisma from '@/lib/prisma';
import styles from './page.module.css';
import ParlaySection from '@/components/ParlaySection/ParlaySection';
import { 
  getBasketballPicks, 
  getBaseballPicks, 
  getBasketballParlay, 
  getBaseballParlay 
} from '@/lib/usSportsEngine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getLaFija(todayStr: string) {
  // Fix: Use Mexico City timezone for database queries to match todayStr
  const now = new Date();
  const todayStart = new Date(now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
  todayStart.setHours(0,0,0,0);
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23,59,59,999);

  const [tennisPicks, footballPicks] = await Promise.all([
    prisma.tennisPick.findMany({
      where: { 
        status: 'PENDING',
        match: { date: { gte: todayStart, lte: todayEnd } } 
      },
      orderBy: { confidenceScore: 'desc' },
      take: 5,
      include: { match: true }
    }),
    prisma.footballPick.findMany({
      where: { 
        status: 'PENDING',
        match: { date: { gte: todayStart, lte: todayEnd } } 
      },
      orderBy: { confidenceScore: 'desc' },
      take: 5,
      include: { match: true }
    })
  ]);

  const basketballPicks = await getBasketballPicks(todayStr);
  const baseballPicks = await getBaseballPicks(todayStr);

  const allPicks: any[] = [
    ...tennisPicks.map(p => ({ 
      ...p, 
      sport: 'tennis', 
      sportIcon: '🎾', 
      matchName: `${p.match.player1Name} vs ${p.match.player2Name}` 
    })),
    ...footballPicks.map(p => ({ 
      ...p, 
      sport: 'football', 
      sportIcon: '⚽', 
      matchName: `${p.match.homeTeam} vs ${p.match.awayTeam}` 
    })),
    ...basketballPicks.map(p => ({ 
      ...p, 
      matchName: `${p.match.player1Name} vs ${p.match.player2Name}`,
      sportIcon: p.icon || '🏀'
    })),
    ...baseballPicks.map(p => ({ 
      ...p, 
      matchName: `${p.match.player1Name} vs ${p.match.player2Name}`,
      sportIcon: p.icon || '⚾'
    }))
  ];

  if (allPicks.length === 0) return null;

  // Find the single most solid pick based on confidenceScore
  return allPicks.sort((a, b) => b.confidenceScore - a.confidenceScore)[0];
}

async function getStats() {
  const tennisCount = await prisma.tennisPick.count();
  const footballCount = await prisma.footballPick.count();
  return { tennisCount, footballCount };
}

export default async function LandingPage() {
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date()).replace(/-/g, '');

  const [{ tennisCount, footballCount }, laFija] = await Promise.all([
    getStats(),
    getLaFija(todayStr)
  ]);
  
  // Parlays for the middle section
  const [nbaParlay, mlbParlay] = await Promise.all([
    getBasketballParlay(todayStr),
    getBaseballParlay(todayStr)
  ]);
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
              {tennisCount} picks analizados hoy
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
              {footballCount} picks analizados hoy
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

      {/* La Fija del Día */}
      {laFija && (
        <section className={styles.laFijaSection}>
          <div className={styles.laFijaBadge}>🌟 LA FIJA DEL DÍA</div>
          <div className={styles.laFijaCard}>
            <div className={styles.laFijaMain}>
              <div className={styles.laFijaSport}>
                <span className={styles.laFijaIcon}>{laFija.sportIcon}</span>
                <span className={styles.laFijaSportName}>{laFija.sport?.toUpperCase() || 'TOP PICK'}</span>
              </div>
              <h2 className={styles.laFijaMatch}>{laFija.matchName}</h2>
              <div className={styles.laFijaPickBox}>
                <span className={styles.laFijaPick}>{laFija.description}</span>
                <span className={styles.laFijaOdds}>@{laFija.odds.toFixed(2)}</span>
              </div>
            </div>
            
            <div className={styles.laFijaStats}>
              <div className={styles.laFijaConf}>
                <div className={styles.confCircle}>
                  <svg viewBox="0 0 36 36" className={styles.circularChart}>
                    <path className={styles.circleBg} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className={styles.circle} style={{ strokeDasharray: `${laFija.confidenceScore}, 100` }} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className={styles.confText}>
                    <span>{laFija.confidenceScore}%</span>
                    <small>Solidez</small>
                  </div>
                </div>
              </div>
              <div className={styles.laFijaExpl}>
                <p>{laFija.explanation.length > 200 ? laFija.explanation.substring(0, 200) + '...' : laFija.explanation}</p>
                <Link href={laFija.sport === 'tennis' ? '/tennis' : laFija.sport === 'football' ? '/football' : laFija.sport === 'basketball' ? '/basketball' : '/baseball'} className={styles.laFijaLink}>
                  Ver análisis completo →
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className={styles.landingFooter}>
        <Link href="/admin" className="btn btn-ghost">⚙️ Configuración y Sincronización Manual</Link>
      </footer>
    </div>
  );
}
