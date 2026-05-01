const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tennis = await prisma.tennisPick.count({ where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } });
  const football = await prisma.footballPick.count({ where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } });
  const logs = await prisma.dailySyncLog.findMany({ orderBy: { syncedAt: 'desc' }, take: 5 });
  
  console.log('--- Picks Count (Today) ---');
  console.log('Tennis:', tennis);
  console.log('Football:', football);
  console.log('--- Last Sync Logs ---');
  logs.forEach(l => {
    console.log(`[${l.sport}] ${l.status} at ${l.syncedAt.toISOString()} - Found: ${l.matchesFound}, Picks: ${l.picksGenerated}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
