import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const todayStart = new Date(now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
  todayStart.setHours(0,0,0,0);
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23,59,59,999);

  console.log('Range:', todayStart.toISOString(), 'to', todayEnd.toISOString());

  const tennis = await prisma.tennisPick.count({
    where: { match: { date: { gte: todayStart, lte: todayEnd } } }
  });

  const football = await prisma.footballPick.count({
    where: { match: { date: { gte: todayStart, lte: todayEnd } } }
  });

  console.log('Tennis picks for today:', tennis);
  console.log('Football picks for today:', football);

  const bestTennis = await prisma.tennisPick.findFirst({
    where: { match: { date: { gte: todayStart, lte: todayEnd } } },
    orderBy: { confidenceScore: 'desc' },
    include: { match: true }
  });

  console.log('Best Tennis pick:', bestTennis?.match.player1Name, 'vs', bestTennis?.match.player2Name, 'Conf:', bestPick?.confidenceScore);
}

main().catch(console.error).finally(() => prisma.$disconnect());
