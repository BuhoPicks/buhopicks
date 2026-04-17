
import prisma from '../lib/prisma';

async function checkConfidence() {
  const checkStart = new Date('2026-04-17T06:00:00Z');
  const checkEnd = new Date('2026-04-18T06:00:00Z');
  
  const picks = await prisma.footballPick.findMany({
    where: { match: { date: { gte: checkStart, lt: checkEnd } } },
    orderBy: { confidenceScore: 'desc' },
    take: 20
  });
  
  console.log(`Top 20 Football Picks Confidence:`);
  picks.forEach(p => console.log(`- ${p.description}: Conf ${p.confidenceScore}, EV ${p.expectedValue}`));
}

checkConfidence().finally(() => prisma.$disconnect());
