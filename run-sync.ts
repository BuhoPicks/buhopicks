import 'dotenv/config';
import { runDailyTennisSync } from './lib/tennisEngine';
import { runDailyFootballSync } from './lib/footballEngine';

async function main() {
  console.log('🚀 Starting Turso Sync...');
  console.log('Database URL:', process.env.TURSO_DATABASE_URL ? 'Turso Detected' : 'Local Detected');
  
  try {
    console.log('🎾 Syncing Tennis...');
    const t = await runDailyTennisSync();
    console.log('Tennis:', t);
    
    console.log('⚽ Syncing Football...');
    const f = await runDailyFootballSync();
    console.log('Football:', f);
  } catch (err) {
    console.error('❌ Sync Failed:', err);
  }
}

main();
