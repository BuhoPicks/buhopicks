import 'dotenv/config';
import { runDailyFootballSync } from './lib/footballEngine';
import { runDailyTennisSync } from './lib/tennisEngine';
import { runDailyEsportsSync } from './lib/esportsEngine';
import { runDailyHorseRacingSync } from './lib/horseRacingEngine';
import prisma from './lib/prisma';

async function main() {
  console.log('🚀 Starting TOTAL PRODUCTION SYNC (Vercel/Turso)...');
  
  try {
    console.log('\n--- Football ---');
    await runDailyFootballSync();
    
    console.log('\n--- Tennis ---');
    await runDailyTennisSync();

    console.log('\n--- eSports ---');
    await runDailyEsportsSync();

    console.log('\n--- Horse Racing ---');
    await runDailyHorseRacingSync();

    console.log('\n✅ Total Sync Completed successfully.');
  } catch (error) {
    console.error('\n❌ Sync Failed:', error);
    process.exit(1);
  }
}

main().finally(() => prisma.$disconnect());
