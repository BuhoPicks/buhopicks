import prisma from './lib/prisma';

async function check() {
  const matches = await prisma.footballMatch.findMany();
  console.log("Found matches:", matches.length);
  for (const m of matches) {
    if (m.homeTeam.includes('Dodgers') || m.homeTeam.includes('Mets') || m.awayTeam.includes('Dodgers') || m.awayTeam.includes('Mets')) {
      console.log("Found Baseball match in Football schema:", m);
    }
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
