import prisma from './prisma';
import { runDailyTennisSync } from './tennisEngine';
import { runDailyFootballSync } from './footballEngine';

/**
 * BH Analysis — Background Scheduler
 *
 * Strategy:
 * - Syncs ONCE per day at 00:01 Mexico City time (midnight rollover)
 * - Fetches picks for the full 24 hours ahead so they are visible all day
 * - On server restart, skips sync if one was already done in the last 20 hours
 * - Guards against concurrent execution with isRunning flag
 */

const SYNC_HOUR     = 0;                          // Run at 00:01 MX time (midnight)
const MIN_SYNC_GAP  = 20 * 60 * 60 * 1000;       // 20h guard — don't re-sync if already done today

let isRunning = false;

function getNextSyncTime(): Date {
  const now = new Date();
  const mxNow = new Date(now.getTime() - 6 * 60 * 60 * 1000); // UTC-6

  // Target: midnight+1min of MX time → SYNC_HOUR:01 MX = (SYNC_HOUR+6):01 UTC
  const todayTarget = new Date(mxNow);
  todayTarget.setUTCHours(SYNC_HOUR + 6, 1, 0, 0); // today at 00:01 MX in UTC

  // If today's window already passed (with 60s buffer), schedule for tomorrow
  if (todayTarget.getTime() <= Date.now() + 60000) {
    todayTarget.setUTCDate(todayTarget.getUTCDate() + 1);
  }

  return todayTarget;
}

/**
 * Check if a sync was already performed recently to avoid duplicate on restart.
 */
async function wasRecentlySynced(sport: string): Promise<boolean> {
  try {
    const last = await prisma.dailySyncLog.findFirst({
      where: { sport: sport.toUpperCase(), status: 'SUCCESS' },
      orderBy: { syncedAt: 'desc' },
    });
    if (!last) return false;
    return (Date.now() - new Date(last.syncedAt).getTime()) < MIN_SYNC_GAP;
  } catch {
    return false;
  }
}

export function initScheduler() {
  if (process.env.NODE_ENV === 'development') {
    if ((global as any)._schedulerStarted) return;
    (global as any)._schedulerStarted = true;
  }

  console.log('⏰ BH Analysis Scheduler initialized (once-daily at midnight MX).');

  const runSync = async (isStartup = false) => {
    if (isRunning) {
      console.log('⏸ Sync skipped — already running.');
      return;
    }
    isRunning = true;

    try {
      // On startup, skip if we already synced today (within last 20h) to avoid hammering APIs
      if (isStartup) {
        const [tennisRecent, footballRecent] = await Promise.all([
          wasRecentlySynced('TENNIS'),
          wasRecentlySynced('FOOTBALL'),
        ]);

        if (tennisRecent && footballRecent) {
          console.log('ℹ️ Startup sync skipped — daily sync already done (< 20h ago). Picks are fresh for today.');
          scheduleNext();
          isRunning = false;
          return;
        }
      }

      console.log(`🕒 Scheduled sync starting at ${new Date().toLocaleTimeString()}...`);

      const [tennisResult, footballResult] = await Promise.allSettled([
        runDailyTennisSync(),
        runDailyFootballSync(),
      ]);

      const tennisOk   = tennisResult.status === 'fulfilled' ? tennisResult.value.success : false;
      const footballOk = footballResult.status === 'fulfilled' ? footballResult.value.success : false;

      console.log(`✅ Daily sync complete — Tennis: ${tennisOk ? 'OK' : 'FAIL'}, Football: ${footballOk ? 'OK' : 'FAIL'}. Picks locked for the next 24 hours.`);
    } catch (error) {
      console.error('❌ Scheduled sync failed:', error);
    } finally {
      isRunning = false;
      scheduleNext();
    }
  };

  const scheduleNext = () => {
    const next  = getNextSyncTime();
    const delay = next.getTime() - Date.now();

    console.log(`📡 Next sync scheduled for: ${next.toLocaleString()} (in ${Math.round(delay / 1000 / 60)} min)`);
    setTimeout(() => runSync(false), delay);
  };

  // Run on startup (with recent-sync check)
  runSync(true);
}
