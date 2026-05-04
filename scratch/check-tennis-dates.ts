import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  console.log('--- Tennis Match Dates ---');
  const matches = await prisma.tennisMatch.findMany({
    orderBy: { date: 'desc' },
    take: 5
  });
  
  matches.forEach(m => {
    console.log(`${m.player1Name} vs ${m.player2Name} - Date: ${m.date.toISOString()}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
