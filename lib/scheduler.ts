import { runDailyTennisSync } from './tennisEngine';
import { runDailyFootballSync } from './footballEngine';

/**
 * BH Analysis — Background Scheduler
 * 
 * Simple interval-based scheduler that runs inside the Next.js process.
 * In a production environment, this would be replaced by a real Cron Job (e.g., GitHub Actions, Vercel Cron).
 */

const SYNC_INTERVAL = 1000 * 60 * 60 * 4; // Every 4 hours

let isRunning = false;

export function initScheduler() {
  if (process.env.NODE_ENV === 'development') {
    // Only run one instance in dev HMR
    if ((global as any)._schedulerStarted) return;
    (global as any)._schedulerStarted = true;
  }

  console.log('⏰ BH Analysis Scheduler initialized.');

  const runSync = async () => {
    if (isRunning) return;
    isRunning = true;
    
    try {
      console.log('🕒 Scheduled sync starting...');
      await Promise.all([
        runDailyTennisSync(),
        runDailyFootballSync()
      ]);
      console.log('✅ Scheduled sync finished successfully.');
    } catch (error) {
      console.error('❌ Scheduled sync failed:', error);
    } finally {
      isRunning = false;
    }
  };

  // Run on startup
  runSync();

  // Schedule interval
  setInterval(runSync, SYNC_INTERVAL);
}
