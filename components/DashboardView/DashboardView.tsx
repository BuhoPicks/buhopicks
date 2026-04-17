import prisma from '@/lib/prisma';
import Link from 'next/link';
import TennisMatchCard from '@/components/TennisMatchCard/TennisMatchCard';
import FootballMatchCard from '@/components/FootballMatchCard/FootballMatchCard';
import ParlaySection from '@/components/ParlaySection/ParlaySection';
import ResultsChart from '@/components/ResultsChart/ResultsChart';
import { generateParlays } from '@/lib/parlayEngine';
import { getBasketballParlay, getBaseballParlay, getBasketballPicks, getBaseballPicks } from '@/lib/usSportsEngine';
import MiniPickCard from '@/components/MiniPickCard/MiniPickCard';
import styles from '@/app/page.module.css';

type DayFilter = 'today' | 'tomorrow';
type SportFilter = 'tennis' | 'football' | 'basketball' | 'baseball';
type SortFilter = 'relevance' | 'time';

function getMEXDateWindow(day: DayFilter) {
  const mxOffset = -6 * 60 * 60 * 1000;
  const now = new Date();
  
  // Calculate the start of the current day in Mexico
  const mxNow = new Date(now.getTime() + mxOffset);
  const mxTodayStart = new Date(Date.UTC(mxNow.getUTCFullYear(), mxNow.getUTCMonth(), mxNow.getUTCDate()));
  
  // Shift back to UTC for Prisma comparison
  const start = new Date(mxTodayStart.getTime() - mxOffset + (day === 'tomorrow' ? 86400000 : 0));
  const end = new Date(start.getTime() + 86400000);
  
  return { start, end };
}

async function getTennisMatches(day: DayFilter, sortBy: SortFilter) {
  const { start, end } = getMEXDateWindow(day);

  const matches = await prisma.tennisMatch.findMany({
    where: { date: { gte: start, lt: end } },
    include: { picks: { orderBy: { expectedValue: 'desc' } } },
    orderBy: sortBy === 'time' ? [{ date: 'asc' }] : undefined,
  });

  if (sortBy === 'relevance') {
    return matches.sort((a, b) => {
      const maxA = Math.max(...a.picks.map(p => p.expectedValue), -1);
      const maxB = Math.max(...b.picks.map(p => p.expectedValue), -1);
      return maxB - maxA;
    });
  }
  return matches;
}

async function getFootballMatches(day: DayFilter, sortBy: SortFilter) {
  const { start, end } = getMEXDateWindow(day);

  const matches = await prisma.footballMatch.findMany({
    where: { date: { gte: start, lt: end } },
    include: { picks: { orderBy: { expectedValue: 'desc' } } },
    orderBy: sortBy === 'time' ? [{ date: 'asc' }] : undefined,
  });

  if (sortBy === 'relevance') {
    return matches.sort((a, b) => {
      const maxA = Math.max(...a.picks.map(p => p.expectedValue), -1);
      const maxB = Math.max(...b.picks.map(p => p.expectedValue), -1);
      return maxB - maxA;
    });
  }
  return matches;
}

async function getLastSyncLog(sport: string) {
  return prisma.dailySyncLog.findFirst({ 
    where: { sport: sport.toUpperCase() },
    orderBy: { syncedAt: 'desc' } 
  });
}

interface DashboardViewProps {
  sport: SportFilter;
  day: DayFilter;
  sortBy?: SortFilter;
}

export default async function DashboardView({ sport, day, sortBy = 'relevance' }: DashboardViewProps) {
  // Use the same window logic for all calculations in this render
  const { start, end } = getMEXDateWindow(day);
  
  // Only fetch full DB metadata for tennis/football
  const isMainSport = sport === 'tennis' || sport === 'football';
  const matches = sport === 'tennis' ? await getTennisMatches(day, sortBy) 
                : sport === 'football' ? await getFootballMatches(day, sortBy) : [];
    
  const lastSync = isMainSport ? await getLastSyncLog(sport) : null;
  
  // Mexican date strings for US API calls
  const mxOffset = -6 * 60 * 60 * 1000;
  const mxTime = new Date(new Date().getTime() + mxOffset);
  const mxTomTime = new Date(mxTime.getTime() + 86400000);
  
  const todayStr = mxTime.toISOString().split('T')[0].replace(/-/g, '');
  const tomorrowStr = mxTomTime.toISOString().split('T')[0].replace(/-/g, '');

  const usTodayPicks = sport === 'basketball' ? await getBasketballPicks(todayStr)
                   : sport === 'baseball' ? await getBaseballPicks(todayStr)
                   : [];
  
  const usTomPicks = sport === 'basketball' ? await getBasketballPicks(tomorrowStr)
                   : sport === 'baseball' ? await getBaseballPicks(tomorrowStr)
                   : [];

  const parlays = [];
  if (sport === 'tennis') {
    const list = generateParlays(matches, []).filter(p => !p.picks.some((pk:any) => pk.sport === 'football'));
    if (list[0]) parlays.push(list[0]);
  } else if (sport === 'football') {
    const list = generateParlays([], matches).filter(p => !p.picks.some((pk:any) => pk.sport === 'tennis'));
    if (list[0]) parlays.push(list[0]);
  }


  const premiumPick = isMainSport ? (matches as any[])
    .flatMap(m => m.picks.filter((p: any) => p.isPremiumPick))
    .sort((a, b) => b.expectedValue - a.expectedValue)[0] ?? null : null;

  const premiumMatch = premiumPick ? matches.find(m => m.id === premiumPick.matchId) : null;

  const usTotalPicksCount = usTodayPicks.length + usTomPicks.length;
  const totalPicksCalculated = isMainSport ? matches.reduce((s, m) => s + m.picks.length, 0) : usTotalPicksCount;
  
  const highValuePicks = isMainSport 
    ? matches.reduce((s, m) => s + m.picks.filter(p => p.valueLabel === 'HIGH' || p.valueLabel === 'PREMIUM').length, 0)
    : usTotalPicksCount;

  const avgEV = isMainSport && totalPicksCalculated > 0
    ? matches.flatMap(m => m.picks).reduce((s, p) => s + p.expectedValue, 0) / totalPicksCalculated
    : 0.05;

  const syncTimeStr = lastSync ? new Date(lastSync.syncedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : null;

  const groupedMatches = sortBy === 'time' ? matches.reduce((acc: any, m: any) => {
    const tournament = m.tournament || 'Otros';
    if (!acc[tournament]) acc[tournament] = [];
    acc[tournament].push(m);
    return acc;
  }, {}) : null;

  const picksBySlot = isMainSport ? [
    { label: 'Madrugada (00:00 - 06:00)', picks: [] as any[] },
    { label: 'Mañana (06:00 - 12:00)', picks: [] as any[] },
    { label: 'Tarde (12:00 - 18:00)', picks: [] as any[] },
    { label: 'Noche (18:00 - 00:00)', picks: [] as any[] }
  ] : [];

  if (isMainSport) {
    for (const match of matches) {
      const matchHour = (new Date(match.date).getUTCHours() - 6 + 24) % 24;
      let slotIdx = 0;
      if (matchHour >= 6 && matchHour < 12) slotIdx = 1;
      else if (matchHour >= 12 && matchHour < 18) slotIdx = 2;
      else if (matchHour >= 18) slotIdx = 3;
      
      const bestMatchPick = match.picks[0];
      if (bestMatchPick) {
        picksBySlot[slotIdx].picks.push({ ...bestMatchPick, parentMatch: match });
      }
    }
    picksBySlot.forEach(s => s.picks.sort((a,b) => b.expectedValue - a.expectedValue));
  }

  const getLocalTime = (date: Date) => date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false,
    timeZone: 'America/Mexico_City'
  });
  const sportBg = sport === 'tennis' ? '/bg_tennis.png' : sport === 'football' ? '/bg_football.png' : sport === 'basketball' ? '/bg_basketball.png' : sport === 'baseball' ? '/bg_baseball.png' : '/sports_background_v2.png';

  return (
    <div className={styles.page}>
      <div className={styles.sportBg} style={{ backgroundImage: `url('${sportBg}')` }} />
      <header className={styles.pageHeader}>
        <div className={styles.headerTop}>
          <div className={styles.brandGroup}>
            <h1 className={styles.pageTitle} style={{ fontSize: '2.8rem', lineHeight: 1 }}>
              <span className="text-gradient">Búho Picks</span>
              <div style={{ fontSize: '0.8rem', letterSpacing: '0.3em', color: 'var(--premium)', marginTop: '4px', textAlign: 'center', fontWeight: 900 }}>GRUPO VIP</div>
            </h1>
            <div className={styles.sportNav}>
              {['tennis', 'football', 'basketball', 'baseball'].map(s => (
                <Link key={s} href={`/${s}?day=${day}&sort=${sortBy}`} className={`${styles.sportTab} ${sport === s ? styles[`active${s.charAt(0).toUpperCase() + s.slice(1)}`] : ''}`}>
                  <span className={styles.sportEmoji}>{s==='tennis'?'🎾':s==='football'?'⚽':s==='basketball'?'🏀':'⚾'}</span> {s==='tennis'?'Tenis':s==='football'?'Fútbol':s==='basketball'?'NBA':'MLB'}
                </Link>
              ))}
            </div>
          </div>
          <div className={styles.headerRight}>
            {syncTimeStr && <div className={styles.syncBadge}><span className={styles.syncDot} /> Sync: {syncTimeStr}</div>}
            <Link href="/admin" className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>⚙️ Admin</Link>
          </div>
        </div>
        <div className={styles.headerBottom}>
          <p className={styles.pageSubtitle}>{day === 'today' ? 'Análisis estadístico en tiempo real' : 'Picks anticipados para mañana'} — {sport === 'tennis' ? 'ATP & WTA' : 'Ligas Principales'}</p>
        </div>
      </header>

      <div className={styles.filterRow}>
        <div className={styles.tabsCol}>
          <div className={styles.filterLabel}>FECHA</div>
          <div className={styles.tabsRow}>
            <Link href={`/${sport}?day=today&sort=${sortBy}`} className={`${styles.tab} ${day === 'today' ? styles.tabActive : ''}`}>Hoy</Link>
            <Link href={`/${sport}?day=tomorrow&sort=${sortBy}`} className={`${styles.tab} ${day === 'tomorrow' ? styles.tabActive : ''}`}>Mañana</Link>
          </div>
        </div>
        <div className={styles.tabsCol}>
          <div className={styles.filterLabel}>ORDENAR POR</div>
          <div className={styles.tabsRow}>
            <Link href={`/${sport}?day=${day}&sort=relevance`} className={`${styles.tab} ${sortBy === 'relevance' ? styles.tabActive : ''}`}>🔥 Relevancia</Link>
            <Link href={`/${sport}?day=${day}&sort=time`} className={`${styles.tab} ${sortBy === 'time' ? styles.tabActive : ''}`}>🕒 Horario</Link>
          </div>
        </div>
      </div>

      {parlays.length > 0 && <ParlaySection parlays={parlays} day={day} />}
      
      {(isMainSport ? matches.length > 0 : (day === 'today' ? usTodayPicks.length > 0 : usTomPicks.length > 0)) && (
        <div className={`${styles.statsBar} ${styles['statsBar' + sport.charAt(0).toUpperCase() + sport.slice(1)]} animate-in`}>

          <div className={styles.statItem}><span className={styles.statValue}>{isMainSport ? matches.length : (day === 'today' ? usTodayPicks.length : usTomPicks.length)}</span><span className={styles.statLabel}>Partidos</span></div>
          <div className={styles.statDivider} /><div className={styles.statItem}><span className={styles.statValue}>{totalPicksCalculated}</span><span className={styles.statLabel}>Picks</span></div>
          <div className={styles.statDivider} /><div className={styles.statItem}><span className={styles.statValue}>{highValuePicks}</span><span className={styles.statLabel}>Relevantes</span></div>
          <div className={styles.statDivider} /><div className={styles.statItem}><span className={styles.statValue}>+{(avgEV * 100).toFixed(1)}%</span><span className={styles.statLabel}>EV Promedio</span></div>
        </div>
      )}

      {premiumMatch && premiumPick && day === 'today' && sortBy === 'relevance' && (
        <section className="animate-in delay-1" style={{ marginBottom: '3rem' }}>
          <div className={styles.premiumLabel}><span>⭐</span> PICK PREMIUM DEL DÍA</div>
          <FootballMatchCard match={premiumMatch} picks={[premiumPick]} featured={true} />
        </section>
      )}

      {isMainSport && matches.length > 0 && sortBy === 'relevance' && (
        <section className={`${styles.top12Section} animate-in delay-2`}>
          <div className={styles.sectionHeader}><h2 className={styles.sectionTitle}><span className={styles.sectionIcon}>⏰</span> Mejores Picks por Horario — {sport === 'tennis' ? 'Tenis' : 'Fútbol'} ({day === 'today' ? 'Hoy' : 'Mañana'})</h2><p className={styles.sectionDesc}>Los mejores picks de cada franja horaria.</p></div>
          {picksBySlot.map((slot, si) => slot.picks.length > 0 && (
            <div key={si} className={styles.timeSlotGroup}><h3 className={styles.timeSlotLabel}>{slot.label}</h3><div className={styles.top12Grid}>
              {slot.picks.map((pick: any, i: number) => <MiniPickCard key={pick.id} pick={pick} sport={sport} animClass={`animate-in delay-${Math.min(i + 3, 10)}`} localTime={getLocalTime(new Date(pick.parentMatch.date))} />)}
            </div></div>
          ))}
        </section>
      )}

      {!isMainSport && day === 'today' && usTodayPicks.length > 0 && (
        <section className={styles.matchesSection} style={{ marginTop: '2rem' }}>
          <div className={styles.sectionHeader}><h2 className={styles.sectionTitle}><span className={styles.sectionIcon}>🔥</span> Picks para HOY — {sport === 'basketball' ? 'NBA' : 'MLB'}</h2></div>
          <div className={styles.top12Grid}>
            {usTodayPicks.map((pick: any, i: number) => <MiniPickCard key={`today-${i}`} pick={pick} sport={sport} animClass={`animate-in delay-${Math.min(i, 8)}`} />)}
          </div>
        </section>
      )}

      {!isMainSport && day === 'tomorrow' && usTomPicks.length > 0 && (
        <section className={styles.matchesSection} style={{ marginTop: '3rem' }}>
          <div className={styles.sectionHeader}><h2 className={styles.sectionTitle}><span className={styles.sectionIcon}>🔜</span> Picks para MAÑANA — {sport === 'basketball' ? 'NBA' : 'MLB'}</h2></div>
          <div className={styles.top12Grid}>
            {usTomPicks.map((pick: any, i: number) => <MiniPickCard key={`tom-${i}`} pick={pick} sport={sport} animClass={`animate-in delay-${Math.min(i, 8)}`} />)}
          </div>
        </section>
      )}

      {!isMainSport && ((day === 'today' && usTodayPicks.length === 0) || (day === 'tomorrow' && usTomPicks.length === 0)) && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🦉</div>
          <h3 className={styles.emptyTitle}>No hay picks programados para {day === 'today' ? 'hoy' : 'mañana'}</h3>
          <p className={styles.emptyText}>Parece que no hay eventos de {sport === 'basketball' ? 'NBA' : 'MLB'} en esta fecha según el calendario oficial.</p>
        </div>
      )}

      {isMainSport && sortBy === 'time' && groupedMatches && Object.entries(groupedMatches).map(([tourn, mList]: [string, any]) => (
        <div key={tourn} className={styles.tournamentGroup}>
          <div className={styles.tournamentHeader}><h3 className={styles.tournamentName}>{tourn}</h3></div>
          <div className={styles.matchesGrid}>{mList.map((m: any) => sport === 'tennis' ? <TennisMatchCard key={m.id} match={m} picks={m.picks} /> : <FootballMatchCard key={m.id} match={m} picks={m.picks} />)}</div>
        </div>
      ))}

      {((isMainSport && matches.length === 0)) && (
        <div className={styles.emptyState}><div className={styles.emptyIcon}>🦉</div><h3 className={styles.emptyTitle}>No hay picks disponibles</h3><p className={styles.emptyText}>Estamos analizando los próximos partidos de {sport === 'tennis' ? 'tenis' : 'fútbol'}. Vuelve pronto para las mejores recomendaciones.</p></div>
      )}
    </div>
  );
}
