import { runDailyFootballSync } from './lib/footballEngine.ts';

async function main() {
    console.log("Triggering Football Sync...");
    const res = await runDailyFootballSync();
    console.log("Sync Result:", res);
}

main().catch(console.error);
