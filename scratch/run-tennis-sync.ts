import fs from 'fs';
import { runDailyTennisSync } from '../lib/tennisEngine';

const envFile = fs.readFileSync('.env', 'utf-8');
for (const line of envFile.split('\n')) {
  if (line.includes('TURSO_DATABASE_URL=')) process.env.TURSO_DATABASE_URL = line.split('=')[1].replace(/"/g, '').trim();
  if (line.includes('TURSO_AUTH_TOKEN=')) process.env.TURSO_AUTH_TOKEN = line.split('=')[1].replace(/"/g, '').trim();
}

console.log("Using TURSO_DATABASE_URL:", process.env.TURSO_DATABASE_URL ? "YES" : "NO");

runDailyTennisSync().then(res => {
   console.log("Tennis Sync done:", res);
   process.exit(0);
}).catch(e => {
   console.error("Tennis Sync error:", e);
   process.exit(1);
});
