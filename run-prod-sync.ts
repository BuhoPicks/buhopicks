// Ensure the variables are explicitly injected into the process
const fs = require('fs');
const dotenv = require('dotenv');

// Manual dotenv loading to ensure Turso is used
const envConfig = dotenv.parse(fs.readFileSync('.env'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

console.log("Using TURSO_DATABASE_URL:", process.env.TURSO_DATABASE_URL ? "YES" : "NO");

const { runDailyFootballSync } = require('./lib/footballEngine.ts');
const { runDailyTennisSync } = require('./lib/tennisEngine.ts');

async function syncAll() {
  console.log("🎾 Starting Tennis Sync...");
  const tRes = await runDailyTennisSync();
  console.log("Tennis Result:", tRes);

  console.log("⚽ Starting Football Sync...");
  const fRes = await runDailyFootballSync();
  console.log("Football Result:", fRes);
}

syncAll().then(() => {
   console.log("✅ All Syncs Done.");
   process.exit(0);
}).catch(e => {
   console.error("❌ Sync Error:", e);
   process.exit(1);
});
