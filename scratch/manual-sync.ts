import { runDailyTennisSync } from '../lib/tennisEngine';
import { runDailyFootballSync } from '../lib/footballEngine';

async function main() {
  console.log('🚀 Starting Manual Sync for all sports...');
  
  console.log('🎾 Syncing Tennis...');
  const t = await runDailyTennisSync();
  console.log('Tennis Result:', t);
  
  console.log('⚽ Syncing Football...');
  const f = await runDailyFootballSync();
  console.log('Football Result:', f);
  
  console.log('✅ Manual Sync Finished.');
}

main().catch(console.error);
