import { runDailyTennisSync } from './lib/tennisEngine.ts';

async function main() {
    console.log("Triggering Tennis Sync...");
    const res = await runDailyTennisSync();
    console.log("Sync Result:", res);
}

main().catch(console.error);
