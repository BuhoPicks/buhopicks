import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  const count = await prisma.footballMatch.count({
    where: {
      date: {
        gte: new Date('2026-05-01T00:00:00Z'),
        lt: new Date('2026-05-02T00:00:00Z')
      }
    }
  });
  console.log('Matches on May 1st (UTC):', count);
  
  const all = await prisma.footballMatch.findMany({
    where: {
      date: {
        gte: new Date('2026-05-01T00:00:00Z')
      }
    },
    orderBy: { date: 'asc' },
    take: 5
  });
  
  all.forEach(m => console.log(`${m.homeTeam} vs ${m.awayTeam} - ${m.date.toISOString()}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
