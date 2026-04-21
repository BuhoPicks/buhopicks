import { runDailyTennisSync } from './lib/tennisEngine';
import { runDailyFootballSync } from './lib/footballEngine';

async function main() {
  console.log('Starting manual sync...');
  await runDailyTennisSync();
  await runDailyFootballSync();
  console.log('Sync complete.');
}

main().catch(console.error);
