import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  console.log('--- Football Match Dates ---');
  const matches = await prisma.footballMatch.findMany({
    orderBy: { date: 'desc' },
    take: 10
  });
  
  matches.forEach(m => {
    console.log(`${m.homeTeam} vs ${m.awayTeam} - Date: ${m.date.toISOString()}`);
  });
  
  const picksCount = await prisma.footballPick.count();
  console.log('Total Football Picks:', picksCount);
}

main().catch(console.error).finally(() => prisma.$disconnect());
