import { createClient } from '@libsql/client';

async function checkTurso() {
  const url = process.env.TURSO_DATABASE_URL || '';
  const authToken = process.env.TURSO_AUTH_TOKEN || '';
  
  if (!url) return console.log("No TURSO URL");
  
  const client = createClient({ url, authToken });
  
  const res = await client.execute("SELECT * FROM FootballMatch WHERE homeTeam LIKE '%Dodgers%' OR awayTeam LIKE '%Dodgers%' OR homeTeam LIKE '%Mets%' OR awayTeam LIKE '%Mets%'");
  
  console.log("Dodgers/Mets in Turso FootballMatch count:", res.rows.length);
  if (res.rows.length > 0) {
    console.log("Found:", res.rows[0]);
  }
}

checkTurso().catch(console.error);
