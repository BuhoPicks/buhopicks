const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPicks() {
  const matches = await prisma.footballMatch.findMany({
    include: { picks: true }
  });

  console.log(`Total football matches in DB: ${matches.length}`);
  
  if (matches.length > 0) {
    const dates = {};
    matches.forEach(m => {
        const d = m.date.toISOString().split('T')[0];
        dates[d] = (dates[d] || 0) + 1;
    });
    console.log("Matches by date:", dates);

    const allPicks = matches.flatMap(m => m.picks);
    console.log(`Total picks: ${allPicks.length}`);
    const summary = {};
    allPicks.forEach(p => {
        if (!summary[p.market]) summary[p.market] = new Set();
        summary[p.market].add(p.selection);
    });
    console.log("Unique Markets and selections:");
    for (const [m, s] of Object.entries(summary)) {
        console.log(`- ${m}: ${Array.from(s).join(', ')}`);
    }
  }
}

process.env.DATABASE_URL = "libsql://buho-picks-buhopicks.aws-us-east-2.turso.io";
process.env.TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzYxNDY2MDIsImlkIjoiMDE5ZDhhOTUtODYwMS03MDAzLTgzNjYtZDg3Njk5Mjk2MWE0IiwicmlkIjoiYTAzZDE0OTEtNDAzZi00MGFhLTg4MDMtYmQ0ZGRlOTNmN2NiIn0.-hb9GFVs18_Eml9xJYUi8gDRAdAFg0lvED5fbHj4wwtoN0p5XvHnn8t72VN_2BQhtuFNLG6sl0ehiVo0AGSUAg";

checkPicks().finally(() => prisma.$disconnect());
