import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const mxOffset = -6 * 60 * 60 * 1000;
  const now = new Date();
  
  // Calculate the start of the current day in Mexico
  const mxNow = new Date(now.getTime() + mxOffset);
  const mxTodayStart = new Date(Date.UTC(mxNow.getUTCFullYear(), mxNow.getUTCMonth(), mxNow.getUTCDate()));
  
  const start = new Date(mxTodayStart.getTime() - mxOffset);
  const end = new Date(start.getTime() + 86400000);

  console.log('Today window (UTC):', start.toISOString(), 'to', end.toISOString());

  const matches = await prisma.tennisMatch.findMany({
    where: { date: { gte: start, lt: end } },
    orderBy: { date: 'asc' }
  });

  console.log('Found', matches.length, 'matches in Today window');
  if (matches.length > 0) {
    console.log('First match:', matches[0].date.toISOString(), matches[0].player1Name, 'vs', matches[0].player2Name);
    console.log('Last match:', matches[matches.length - 1].date.toISOString(), matches[matches.length - 1].player1Name, 'vs', matches[matches.length - 1].player2Name);
  }

  // Check tomorrow
  const startTom = new Date(start.getTime() + 86400000);
  const endTom = new Date(end.getTime() + 86400000);
  console.log('Tomorrow window (UTC):', startTom.toISOString(), 'to', endTom.toISOString());
  
  const matchesTom = await prisma.tennisMatch.findMany({
    where: { date: { gte: startTom, lt: endTom } },
    orderBy: { date: 'asc' }
  });
  console.log('Found', matchesTom.length, 'matches in Tomorrow window');
  if (matchesTom.length > 0) {
    console.log('First tomorrow match:', matchesTom[0].date.toISOString(), matchesTom[0].player1Name, 'vs', matchesTom[0].player2Name);
  }

  await prisma.$disconnect();
}

main();
