const { runDailyTennisSync } = require('./lib/tennisEngine');
const { runDailyFootballSync } = require('./lib/footballEngine');

async function main() {
  console.log('🚀 Manual Sync starting...');
  try {
    const t = await runDailyTennisSync();
    console.log('Tennis:', t);
    const f = await runDailyFootballSync();
    console.log('Football:', f);
  } catch (e) {
    console.error(e);
  }
}
main();
