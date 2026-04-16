import { createClient } from '@libsql/client';

async function verify() {
  const url = "libsql://buho-picks-buhopicks.aws-us-east-2.turso.io";
  const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzYxNDY2MDIsImlkIjoiMDE5ZDhhOTUtODYwMS03MDAzLTgzNjYtZDg3Njk5Mjk2MWE0IiwicmlkIjoiYTAzZDE0OTEtNDAzZi00MGFhLTg4MDMtYmQ0ZGRlOTNmN2NiIn0.-hb9GFVs18_Eml9xJYUi8gDRAdAFg0lvED5fbHj4wwtoN0p5XvHnn8t72VN_2BQhtuFNLG6sl0ehiVo0AGSUAg";

  const client = createClient({ url, authToken });
  
  console.log("Checking Tennis Matches for Dodgers/Mets...");
  const q1 = await client.execute("SELECT * FROM TennisMatch WHERE player1Name LIKE '%Dodger%' OR player2Name LIKE '%Dodger%' OR player1Name LIKE '%Mets%' OR player2Name LIKE '%Mets%'");
  console.log("Baseball in TennisMatch:", q1.rows.length);
  
  if (q1.rows.length > 0) {
     console.log("First match:", q1.rows[0]);
  }
}
verify().catch(console.error);
