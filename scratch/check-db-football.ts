
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const matches = await prisma.footballMatch.count();
  const picks = await prisma.footballPick.count();
  console.log(`Total Football Matches: ${matches}`);
  console.log(`Total Football Picks: ${picks}`);
  
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start.getTime() + 86400000);
  
  const todayMatches = await prisma.footballMatch.findMany({
    where: { date: { gte: start, lt: end } },
    include: { picks: true }
  });
  
  console.log(`Matches for today (${start.toISOString().split('T')[0]}): ${todayMatches.length}`);
  if (todayMatches.length > 0) {
    console.log('Match names:', todayMatches.map(m => `${m.homeTeam} vs ${m.awayTeam}`).join(', '));
  }
  
  const tomorrowStart = new Date(start.getTime() + 86400000);
  const tomorrowEnd = new Date(tomorrowStart.getTime() + 86400000);
  const tomorrowMatches = await prisma.footballMatch.findMany({
    where: { date: { gte: tomorrowStart, lt: tomorrowEnd } }
  });
  console.log(`Matches for tomorrow: ${tomorrowMatches.length}`);
}

check().finally(() => prisma.$disconnect());
