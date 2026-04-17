
import prisma from '../lib/prisma';

async function diagnose() {
  const total = await prisma.footballMatch.count();
  console.log(`Total Football Matches in DB: ${total}`);
  
  const all = await prisma.footballMatch.findMany({
    orderBy: { date: 'asc' },
    take: 10
  });
  
  if (all.length > 0) {
    console.log('Earliest 10 matches dates:');
    all.forEach(m => console.log(`- ${m.homeTeam} vs ${m.awayTeam} at ${m.date.toISOString()}`));
  }

  const latest = await prisma.footballMatch.findMany({
    orderBy: { date: 'desc' },
    take: 10
  });
  
  if (latest.length > 0) {
    console.log('Latest 10 matches dates:');
    latest.forEach(m => console.log(`- ${m.homeTeam} vs ${m.awayTeam} at ${m.date.toISOString()}`));
  }

  // Check specifically for April 17th (Mexico Time)
  // Mexico is UTC-6. So April 17 00:00 MX is April 17 06:00 UTC.
  const checkStart = new Date('2026-04-17T06:00:00Z');
  const checkEnd = new Date('2026-04-18T06:00:00Z');
  
  const tomorrowMatches = await prisma.footballMatch.findMany({
    where: { date: { gte: checkStart, lt: checkEnd } }
  });
  
  console.log(`Matches found for tomorrow (April 17 MX Window): ${tomorrowMatches.length}`);
}

diagnose().finally(() => prisma.$disconnect());
