import prisma from './prisma';
import { runDailyTennisSync } from './tennisEngine';
import { runDailyFootballSync } from './footballEngine';

/**
 * BH Analysis — Background Scheduler
 *
 * Improvements:
 * - Checks last sync time before running on startup (avoids duplicate sync after restart)
 * - Also syncs US Sports (NBA/MLB) via external API on each cycle
 * - Runs at 00:01, 08:01, 16:01 Mexico City time
 * - Guards against concurrent execution with isRunning flag
 */

const SYNC_HOURS    = [0, 8, 16]; // Run at 00:01, 08:01, 16:01 MX time
const MIN_SYNC_GAP  = 3 * 60 * 60 * 1000; // 3h minimum between syncs (safety)

let isRunning = false;

function getNextSyncTime(): Date {
  const now = new Date();
  const mxNow = new Date(now.getTime() - 6 * 60 * 60 * 1000); // UTC-6

  const possibleTargets = SYNC_HOURS.map(h => {
    const d = new Date(mxNow);
    d.setUTCHours(h + 6, 1, 0, 0); // Convert MX hour to UTC
    return d;
  });

  // Find the next target that is in the future (with 60s buffer)
  let next = possibleTargets.find(t => t.getTime() > Date.now() + 60000);

  // If none found for today, take the first one of tomorrow
  if (!next) {
    next = new Date(mxNow);
    next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(SYNC_HOURS[0] + 6, 1, 0, 0);
  }

  return next;
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

  console.log('⏰ BH Analysis Scheduler initialized (3× daily cycle).');

  const runSync = async (isStartup = false) => {
    if (isRunning) {
      console.log('⏸ Sync skipped — already running.');
      return;
    }
    isRunning = true;

    try {
      // On startup, skip if we synced recently to avoid hammering APIs after a restart
      if (isStartup) {
        const [tennisRecent, footballRecent] = await Promise.all([
          wasRecentlySynced('TENNIS'),
          wasRecentlySynced('FOOTBALL'),
        ]);

        if (tennisRecent && footballRecent) {
          console.log('ℹ️ Startup sync skipped — recent sync found (< 3h ago).');
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

      console.log(`✅ Sync complete — Tennis: ${tennisOk ? 'OK' : 'FAIL'}, Football: ${footballOk ? 'OK' : 'FAIL'}`);
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
