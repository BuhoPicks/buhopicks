
import prisma from './lib/prisma';

async function checkTurso() {
  console.log('Checking TURSO Database...');
  
  const logs = await prisma.dailySyncLog.findMany({
    orderBy: { syncedAt: 'desc' },
    take: 5
  });
  console.log('--- Sync Logs ---');
  console.table(logs.map(l => ({ 
    sport: l.sport, 
    status: l.status, 
    syncedAt: l.syncedAt,
    matches: l.matchesFound 
  })));

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const tennisCount = await prisma.tennisMatch.count({
    where: { date: { gte: startOfDay, lt: endOfDay } }
  });
  const tennisPicks = await prisma.tennisPick.count({
    where: { match: { date: { gte: startOfDay, lt: endOfDay } } }
  });
  
  const footballCount = await prisma.footballMatch.count({
    where: { date: { gte: startOfDay, lt: endOfDay } }
  });
  const footballPicks = await prisma.footballPick.count({
    where: { match: { date: { gte: startOfDay, lt: endOfDay } } }
  });

  console.log(`Tennis today: ${tennisCount} matches, ${tennisPicks} picks`);
  console.log(`Football today: ${footballCount} matches, ${footballPicks} picks`);

  if (tennisPicks === 0 && tennisCount > 0) {
      console.log('⚠️ Matches exist but NO picks generated for tennis yet.');
  }

  process.exit(0);
}

checkTurso().catch(console.error);
