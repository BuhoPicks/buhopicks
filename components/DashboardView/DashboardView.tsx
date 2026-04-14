import prisma from '@/lib/prisma';
import Link from 'next/link';
import TennisMatchCard from '@/components/TennisMatchCard/TennisMatchCard';
import FootballMatchCard from '@/components/FootballMatchCard/FootballMatchCard';
import ParlaySection from '@/components/ParlaySection/ParlaySection';
import FootyStatsSection from '@/components/FootyStatsSection/FootyStatsSection';
import ResultsChart from '@/components/ResultsChart/ResultsChart';
import { generateParlays } from '@/lib/parlayEngine';
import { getBasketballParlay, getBaseballParlay } from '@/lib/usSportsEngine';
import MiniPickCard from '@/components/MiniPickCard/MiniPickCard';
import styles from '@/app/page.module.css';

type DayFilter = 'today' | 'tomorrow';
type SportFilter = 'tennis' | 'football' | 'basketball' | 'baseball';
type SortFilter = 'relevance' | 'time';

async function getTennisMatches(day: DayFilter, sortBy: SortFilter) {
  const now   = new Date();
  const base  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = day === 'tomorrow' ? new Date(base.getTime() + 86400000) : base;
  const end   = new Date(start.getTime() + 86400000);

  const matches = await prisma.tennisMatch.findMany({
    where: { date: { gte: start, lt: end } },
    include: { picks: { orderBy: { expectedValue: 'desc' } } },
    orderBy: sortBy === 'time' ? [{ date: 'asc' }] : undefined,
  });

  if (sortBy === 'relevance') {
    // Sort by max pick EV in each match
    return matches.sort((a, b) => {
      const maxA = Math.max(...a.picks.map(p => p.expectedValue), -1);
      const maxB = Math.max(...b.picks.map(p => p.expectedValue), -1);
      return maxB - maxA;
    });
  }

  return matches;
}

async function getFootballMatches(day: DayFilter, sortBy: SortFilter) {
  const now   = new Date();
  const base  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = day === 'tomorrow' ? new Date(base.getTime() + 86400000) : base;
  const end   = new Date(start.getTime() + 86400000);

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
  // Only fetch full DB metadata for tennis/football
  const isMainSport = sport === 'tennis' || sport === 'football';
  const matches = sport === 'tennis' ? await getTennisMatches(day, sortBy) 
                : sport === 'football' ? await getFootballMatches(day, sortBy) : [];
    
  const lastSync = isMainSport ? await getLastSyncLog(sport) : null;

  // Generate parlays — sport-specific ONLY
  const parlays = [];
  
  if (sport === 'tennis') {
    const tennisOnly = generateParlays(matches, []);
    // Filter to only tennis picks
    parlays.push(...tennisOnly.filter(p => p.picks.every((pk: any) => pk.sport === 'tennis' || !pk.sport)));
  } else if (sport === 'football') {
    const footballOnly = generateParlays([], matches);
    parlays.push(...footballOnly.filter(p => p.picks.every((pk: any) => pk.sport === 'football' || !pk.sport)));
  }
  
  const dateStr = day === 'today' ? new Date().toISOString().split('T')[0].replace(/-/g, '') : new Date(new Date().getTime() + 86400000).toISOString().split('T')[0].replace(/-/g, '');
  
  if (sport === 'basketball') {
    const nbaParlay = await getBasketballParlay(dateStr);
    if (nbaParlay) parlays.push(nbaParlay);
  } else if (sport === 'baseball') {
    const mlbParlay = await getBaseballParlay(dateStr);
    if (mlbParlay) parlays.push(mlbParlay);
  }

  // Find premium pick (only for main sports)
  const premiumPick = isMainSport ? (matches as any[])
    .flatMap(m => m.picks.filter((p: any) => p.isPremiumPick))
    .sort((a, b) => b.expectedValue - a.expectedValue)[0] ?? null : null;

  const premiumMatch = premiumPick
    ? (matches as any[]).find(m => m.id === premiumPick.matchId)
    : null;

  // Stats
  const totalPicks = matches.reduce((s, m) => s + m.picks.length, 0);
  const highValuePicks = matches.reduce(
    (s, m) => s + m.picks.filter(p => p.valueLabel === 'HIGH' || p.valueLabel === 'PREMIUM').length,
    0
  );
  const avgEV = totalPicks > 0
    ? matches.flatMap(m => m.picks).reduce((s, p) => s + p.expectedValue, 0) / totalPicks
    : 0;

  // Effectiveness tracking (settled picks)
  const settledPicks = matches.flatMap(m => m.picks).filter((p: any) => p.status === 'WON' || p.status === 'LOST');
  const wonPicks = settledPicks.filter((p: any) => p.status === 'WON').length;
  const winRate = settledPicks.length > 0 ? (wonPicks / settledPicks.length) * 100 : 0;

  const syncTimeStr = lastSync
    ? new Date(lastSync.syncedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : null;

  // Group matches (only if NOT sorting by relevance, as grouping breaks relevance order)
  // Actually, user wants to SEE the picks. If sorted by relevance, maybe we don't group by tournament?
  // Let's keep grouping but sort groups by relevance, or just show a flat list if relevance is selected?
  // The user wants "observar los picks por relevancia", usually that's a flat list of all matches.
  
  const groups: Record<string, typeof matches> = {};
  if (sortBy === 'time') {
    for (const match of (matches as any[])) {
      const key = sport === 'tennis' ? match.tournament : match.league;
      if (!groups[key]) groups[key] = [];
      groups[key].push(match);
    }
  }

  // Time-slot grouping for relevance view
  const timeSlots = [
    { label: '🌙 Madrugada (00:01 - 06:00)', from: 0, to: 6 },
    { label: '☀️ Mañana (06:01 - 12:00)', from: 6, to: 12 },
    { label: '🌤️ Tarde (12:01 - 18:00)', from: 12, to: 18 },
    { label: '🌙 Noche (18:01 - 00:00)', from: 18, to: 24 },
  ];

  // Helper: get local hour in Mexico City timezone
  const getLocalHour = (date: Date) => {
    const localStr = date.toLocaleString('en-US', { timeZone: 'America/Mexico_City', hour: 'numeric', hour12: false });
    return parseInt(localStr) || 0;
  };

  const getLocalTime = (date: Date) => {
    return date.toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const picksBySlot = isMainSport && sortBy === 'relevance' ? timeSlots.map(slot => {
    const slotMatches = (matches as any[]).filter(m => {
      const hour = getLocalHour(new Date(m.date));
      return hour >= slot.from && hour < slot.to;
    });
    const allPicks = slotMatches.flatMap(m => m.picks.map((p: any) => ({ ...p, parentMatch: m })));
    const uniqueMatchPicks: any[] = [];
    const seenMatches = new Set();
    const sortedPicks = [...allPicks].sort((a, b) => b.expectedValue - a.expectedValue);
    for (const pick of sortedPicks) {
      if (!seenMatches.has(pick.parentMatch.id)) {
        uniqueMatchPicks.push(pick);
        seenMatches.add(pick.parentMatch.id);
      }
      if (uniqueMatchPicks.length >= 5) break;
    }
    return { ...slot, picks: uniqueMatchPicks };
  }) : [];

  // Sport-specific background
  const bgMap: Record<string, string> = {
    tennis: '/bg_tennis.png',
    football: '/bg_football.png',
    basketball: '/bg_basketball.png',
    baseball: '/bg_baseball.png',
  };
  const sportBg = bgMap[sport] || '/sports_background_v2.png';

  return (
    <div className={styles.page}>
      {/* Sport-specific background */}
      <div className={styles.sportBg} style={{ backgroundImage: `url('${sportBg}')` }} />
      {/* ── Page Header ── */}
      <header className={styles.pageHeader}>
        <div className={styles.headerTop}>
          <div className={styles.brandGroup}>
            <h1 className={styles.pageTitle}>
              <span className="text-gradient">Búho Picks</span>
            </h1>
            <div className={styles.sportNav}>
              <Link href={`/tennis?day=${day}&sort=${sortBy}`} className={`${styles.sportTab} ${sport === 'tennis' ? styles.activeTennis : ''}`}>
                <span className={styles.sportEmoji}>🎾</span> Tenis
              </Link>
              <Link href={`/football?day=${day}&sort=${sortBy}`} className={`${styles.sportTab} ${sport === 'football' ? styles.activeFootball : ''}`}>
                <span className={styles.sportEmoji}>⚽</span> Fútbol
              </Link>
              <Link href={`/basketball?day=${day}&sort=${sortBy}`} className={`${styles.sportTab} ${sport === 'basketball' ? styles.activeBasketball : ''}`}>
                <span className={styles.sportEmoji}>🏀</span> NBA
              </Link>
              <Link href={`/baseball?day=${day}&sort=${sortBy}`} className={`${styles.sportTab} ${sport === 'baseball' ? styles.activeBaseball : ''}`}>
                <span className={styles.sportEmoji}>⚾</span> MLB
              </Link>
            </div>
          </div>
          
          <div className={styles.headerRight}>
            {syncTimeStr && (
              <div className={styles.syncBadge}>
                <span className={styles.syncDot} />
                Sync: {syncTimeStr}
              </div>
            )}
            <Link href="/admin" className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>
              ⚙️ Admin
            </Link>
          </div>
        </div>

        <div className={styles.headerBottom}>
          <p className={styles.pageSubtitle}>
            {day === 'today' ? 'Análisis estadístico en tiempo real' : 'Picks anticipados para mañana'} — {sport === 'tennis' ? 'ATP & WTA' : 'Ligas Principales'}
          </p>
        </div>
      </header>

      {/* ── Filters Row (Day & Sort) ── */}
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

      {/* ── Parlay Section ── */}
      {day === 'today' && <ParlaySection parlays={parlays} />}

      {/* ── FootyStats Section ── */}
      {sport === 'football' && matches.length > 0 && (
        <FootyStatsSection matches={matches} />
      )}

      {/* ── Stats Bar ── */}
      {matches.length > 0 && (
        <div className={`${styles.statsBar} animate-in`}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{matches.length}</span>
            <span className={styles.statLabel}>Partidos</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{totalPicks}</span>
            <span className={styles.statLabel}>Picks</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue} style={{ color: 'var(--high)' }}>{highValuePicks}</span>
            <span className={styles.statLabel}>Alto Valor</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue} style={{ color: 'var(--premium)' }}>
              +{(avgEV * 100).toFixed(1)}%
            </span>
            <span className={styles.statLabel}>EV Medio</span>
          </div>
          {settledPicks.length > 0 && (
            <>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statValue} style={{ color: winRate >= 52.4 ? '#4ADE80' : 'white' }}>
                  {winRate.toFixed(1)}%
                </span>
                <span className={styles.statLabel}>Efectividad ({wonPicks}/{settledPicks.length})</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Results Chart ── */}
      {settledPicks.length > 0 && sport !== 'basketball' && sport !== 'baseball' && (
        <ResultsChart totalWins={wonPicks} totalLosses={settledPicks.length - wonPicks} />
      )}

      {/* ── Empty State ── */}
      {isMainSport && matches.length === 0 && (
        <div className={`glass ${styles.emptyState}`}>
          <div className={styles.emptyIcon}>{sport === 'tennis' ? '🎾' : '⚽'}</div>
          <h2 className={styles.emptyTitle}>Sin picks de {sport === 'tennis' ? 'tenis' : 'fútbol'}</h2>
          <p className={styles.emptyText}>
            No hay partidos analizados para esta fecha.
          </p>
          <Link href="/admin" className="btn btn-primary">
            Ir a Panel Admin
          </Link>
        </div>
      )}

      {/* ── US Sports Info ── */}
      {!isMainSport && parlays.length === 0 && (
        <div className={`glass ${styles.emptyState}`}>
          <div className={styles.emptyIcon}>{sport === 'basketball' ? '🏀' : '⚾'}</div>
          <h2 className={styles.emptyTitle}>Sin parlay disponible de {sport === 'basketball' ? 'NBA' : 'MLB'}</h2>
          <p className={styles.emptyText}>
            No hay partidos programados en este momento. Vuelve más tarde.
          </p>
        </div>
      )}

      {!isMainSport && parlays.length > 0 && (
        <div className={`glass ${styles.emptyState}`} style={{ borderColor: 'rgba(59, 130, 246, 0.3)', background: 'rgba(59, 130, 246, 0.05)' }}>
          <div className={styles.emptyIcon}>{sport === 'basketball' ? '🏀' : '⚾'}</div>
          <h2 className={styles.emptyTitle}>Parlay del Día — {sport === 'basketball' ? 'NBA' : 'MLB'}</h2>
          <p className={styles.emptyText}>
            Arriba encontrarás la combinación seleccionada por nuestro algoritmo para hoy. ¡Buena suerte!
          </p>
        </div>
      )}

      {/* ── Premium Pick ── */}
      {isMainSport && premiumMatch && premiumPick && (
        <section className={`${styles.premiumSection} animate-in delay-1`}>
          <div className={styles.premiumLabel}>
            <span>🏆</span> MEJOR PICK DE {sport === 'tennis' ? 'TENIS' : 'FÚTBOL'}
          </div>
          {sport === 'tennis' ? (
            <TennisMatchCard match={premiumMatch as any} picks={[premiumPick as any]} featured />
          ) : (
            <FootballMatchCard match={premiumMatch as any} picks={[premiumPick as any]} featured />
          )}
        </section>
      )}

      {/* ── Picks por Horario (Time Slots) ── */}
      {isMainSport && matches.length > 0 && sortBy === 'relevance' && (
        <section className={`${styles.top12Section} animate-in delay-2`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>⏰</span> Mejores Picks por Horario — {sport === 'tennis' ? 'Tenis' : 'Fútbol'} ({day === 'today' ? 'Hoy' : 'Mañana'})
            </h2>
            <p className={styles.sectionDesc}>Los 4-5 mejores picks de cada franja horaria, seleccionados por valor esperado.</p>
          </div>
          
          {picksBySlot.map((slot, si) => (
            slot.picks.length > 0 && (
              <div key={si} className={styles.timeSlotGroup}>
                <h3 className={styles.timeSlotLabel}>{slot.label}</h3>
                <div className={styles.top12Grid}>
                  {slot.picks.map((pick: any, i: number) => (
                    <MiniPickCard 
                      key={pick.id} 
                      pick={pick} 
                      sport={sport} 
                      animClass={`animate-in delay-${Math.min(i + 3, 10)}`}
                      localTime={getLocalTime(new Date(pick.parentMatch.date))}
                    />
                  ))}
                </div>
              </div>
            )
          ))}
        </section>
      )}

      {/* ── All Matches ── */}
      {isMainSport && matches.length > 0 && (
        <section className={styles.matchesSection}>
          <h2 className={styles.sectionTitle}>
            {sortBy === 'relevance' ? `Picks por Relevancia` : `Picks por Horario`} ({day === 'today' ? 'Hoy' : 'Mañana'})
          </h2>

          {sortBy === 'time' ? (
            Object.entries(groups).map(([groupName, groupMatches], gi) => (
              <div key={groupName} className={styles.tournamentGroup}>
                <div className={styles.tournamentHeader}>
                  <span className={styles.tournamentName}>{groupName}</span>
                  {sport === 'tennis' && (
                    <>
                      <span className={`badge badge-${(groupMatches[0] as any).circuit.toLowerCase()}`}>
                        {(groupMatches[0] as any).circuit}
                      </span>
                      <span className={`badge badge-${(groupMatches[0] as any).surface.toLowerCase()}`}>
                        {(groupMatches[0] as any).surface}
                      </span>
                    </>
                  )}
                </div>

                <div className={styles.matchesGrid}>
                  {groupMatches
                    .filter((m: any) => m.id !== premiumMatch?.id)
                    .map((match: any, mi) => (
                      match.picks.length > 0 && (
                        sport === 'tennis' ? (
                          <TennisMatchCard
                            key={match.id}
                            match={match as any}
                            picks={match.picks as any}
                            className={`animate-in delay-${Math.min(mi + 2, 6)}`}
                          />
                        ) : (
                          <FootballMatchCard
                            key={match.id}
                            match={match as any}
                            picks={match.picks as any}
                            className={`animate-in delay-${Math.min(mi + 2, 6)}`}
                          />
                        )
                      )
                    ))}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.matchesGrid}>
              {matches
                .filter((m: any) => m.id !== premiumMatch?.id)
                .map((match: any, mi) => (
                  match.picks.length > 0 && (
                    sport === 'tennis' ? (
                      <TennisMatchCard
                        key={match.id}
                        match={match as any}
                        picks={match.picks as any}
                        className={`animate-in delay-${Math.min(mi + 2, 6)}`}
                      />
                    ) : (
                      <FootballMatchCard
                        key={match.id}
                        match={match as any}
                        picks={match.picks as any}
                        className={`animate-in delay-${Math.min(mi + 2, 6)}`}
                      />
                    )
                  )
                ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

