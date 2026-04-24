const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPicks() {
  const matches = await prisma.footballMatch.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { picks: true }
  });

  for (const m of matches) {
     console.log(`Match: ${m.homeTeam} vs ${m.awayTeam}`);
     for (const p of m.picks) {
         console.log(`  - ${p.market} / ${p.selection} (${p.estimatedProb})`);
     }
  }
}

checkPicks().finally(() => prisma.$disconnect());
