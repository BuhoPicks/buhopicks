import prisma from './lib/prisma';

async function check() {
  console.log("--- Football Matches ---");
  const fMatches = await prisma.footballMatch.findMany({
    take: 10,
    orderBy: { date: 'desc' }
  });
  fMatches.forEach(m => console.log(`[${m.date.toISOString()}] ${m.homeTeam} vs ${m.awayTeam}`));

  console.log("\n--- Searching for Dodgers/Mets specifically ---");
  const d1 = await prisma.footballMatch.findMany({ where: { homeTeam: { contains: 'Dodgers' } } });
  const d2 = await prisma.footballMatch.findMany({ where: { awayTeam: { contains: 'Dodgers' } } });
  const m1 = await prisma.footballMatch.findMany({ where: { homeTeam: { contains: 'Mets' } } });
  const m2 = await prisma.footballMatch.findMany({ where: { awayTeam: { contains: 'Mets' } } });
  
  console.log("Dodgers in Football:", d1.length + d2.length);
  console.log("Mets in Football:", m1.length + m2.length);

  if (d1.length > 0) console.log("Sample Dodgers in Football:", d1[0]);
}

check().catch(console.error).finally(() => prisma.$disconnect());
