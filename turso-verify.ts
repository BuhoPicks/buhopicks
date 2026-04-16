import { config } from 'dotenv';
config();
import { createClient } from '@libsql/client';

async function verify() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error('NO URL');

  const client = createClient({ url, authToken });
  
  console.log("Checking Football Matches for Dodgers/Mets...");
  const q1 = await client.execute("SELECT * FROM FootballMatch WHERE homeTeam LIKE '%Dodger%' OR awayTeam LIKE '%Dodger%' OR homeTeam LIKE '%Mets%'");
  console.log("Baseball in FootballMatch:", q1.rows.length);
  
  if (q1.rows.length > 0) {
     console.log("First match:", q1.rows[0]);
  }
}
verify().catch(console.error);
