import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  const start = new Date('2026-05-01T06:00:00Z');
  const end = new Date('2026-05-02T06:00:00Z');
  
  const matches = await prisma.tennisMatch.findMany({
    where: {
      date: { gte: start, lt: end }
    }
  });
  
  console.log('Matches in Dashboard Window (May 1st MX):', matches.length);
  matches.forEach(m => console.log(`${m.player1Name} vs ${m.player2Name} - ${m.date.toISOString()}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
