
import { runDailyTennisSync } from '../lib/tennisEngine';

async function forceSync() {
  console.log('🚀 Triggering Emergency Tennis Sync...');
  const result = await runDailyTennisSync();
  console.log('Sync Result:', result);
  process.exit(0);
}

forceSync();
