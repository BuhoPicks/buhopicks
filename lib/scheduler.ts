import { runDailyTennisSync } from './tennisEngine';
import { runDailyFootballSync } from './footballEngine';

/**
 * BH Analysis — Background Scheduler
 * 
 * Simple interval-based scheduler that runs inside the Next.js process.
 * In a production environment, this would be replaced by a real Cron Job (e.g., GitHub Actions, Vercel Cron).
 */

const SYNC_HOURS = [0, 8, 16]; // Run at 00:01, 08:01, 16:01

let isRunning = false;

function getNextSyncTime() {
  const now = new Date();
  // We want to run at hour:01 to be safe
  
  const possibleTargets = SYNC_HOURS.map(h => {
    const d = new Date(now);
    d.setHours(h, 1, 0, 0);
    return d;
  });

  // Find the next target that is in the future
  let next = possibleTargets.find(t => t > now);

  // If none found for today, take the first one of tomorrow
  if (!next) {
    next = new Date(now);
    next.setDate(now.getDate() + 1);
    next.setHours(SYNC_HOURS[0], 1, 0, 0);
  }

  return next;
}

export function initScheduler() {
  if (process.env.NODE_ENV === 'development') {
    if ((global as any)._schedulerStarted) return;
    (global as any)._schedulerStarted = true;
  }

  console.log('⏰ BH Analysis Scheduler initialized (8h cycle).');

  const runSync = async () => {
    if (isRunning) return;
    isRunning = true;
    
    try {
      console.log(`🕒 Scheduled sync starting at ${new Date().toLocaleTimeString()}...`);
      await Promise.all([
        runDailyTennisSync(),
        runDailyFootballSync()
      ]);
      console.log('✅ Scheduled sync finished successfully.');
    } catch (error) {
      console.error('❌ Scheduled sync failed:', error);
    } finally {
      isRunning = false;
      scheduleNext();
    }
  };

  const scheduleNext = () => {
    const next = getNextSyncTime();
    const delay = next.getTime() - Date.now();
    
    console.log(`📡 Next synchronization scheduled for: ${next.toLocaleString()} (in ${Math.round(delay / 1000 / 60)} minutes)`);
    
    setTimeout(runSync, delay);
  };

  // Skip startup run if we are within 10 mins of a target? 
  // No, user probably wants one NOW if they just started, then follow the schedule.
  runSync();
}
