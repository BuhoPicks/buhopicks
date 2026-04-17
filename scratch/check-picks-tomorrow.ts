
import prisma from '../lib/prisma';

async function checkPicks() {
  const checkStart = new Date('2026-04-17T06:00:00Z');
  const checkEnd = new Date('2026-04-18T06:00:00Z');
  
  const tomorrowMatches = await prisma.footballMatch.findMany({
    where: { date: { gte: checkStart, lt: checkEnd } },
    include: { picks: true }
  });
  
  console.log(`Matches for tomorrow: ${tomorrowMatches.length}`);
  tomorrowMatches.forEach(m => {
    console.log(`- ${m.homeTeam} vs ${m.awayTeam}: ${m.picks.length} picks`);
  });
}

checkPicks().finally(() => prisma.$disconnect());
