
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSync() {
  console.log('Checking Sync Logs...');
  const logs = await prisma.dailySyncLog.findMany({
    orderBy: { syncedAt: 'desc' },
    take: 5
  });
  console.table(logs.map(l => ({ sport: l.sport, status: l.status, syncedAt: l.syncedAt, error: l.errorMessage })));

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  console.log(`Searching for matches between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`);

  const tennisCount = await prisma.tennisMatch.count({
    where: { date: { gte: startOfDay, lt: endOfDay } }
  });
  console.log(`Tennis matches for today: ${tennisCount}`);

  const footballCount = await prisma.footballMatch.count({
    where: { date: { gte: startOfDay, lt: endOfDay } }
  });
  console.log(`Football matches for today: ${footballCount}`);

  const latestTennis = await prisma.tennisMatch.findFirst({
    orderBy: { date: 'desc' }
  });
  if (latestTennis) {
    console.log(`Latest tennis match in DB: ${latestTennis.player1Name} vs ${latestTennis.player2Name} on ${latestTennis.date}`);
  }

  const latestSync = await prisma.dailySyncLog.findFirst({
    orderBy: { syncedAt: 'desc' }
  });
  if (latestSync) {
    console.log(`Latest sync finished at: ${latestSync.syncedAt} with status ${latestSync.status}`);
  }

  await prisma.$disconnect();
}

checkSync().catch(console.error);
