import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  console.log('--- Turso Database Check ---');
  const tMatches = await prisma.tennisMatch.count();
  const fMatches = await prisma.footballMatch.count();
  const tPicks = await prisma.tennisPick.count();
  const fPicks = await prisma.footballPick.count();
  
  console.log('Total Tennis Matches:', tMatches);
  console.log('Total Football Matches:', fMatches);
  console.log('Total Tennis Picks:', tPicks);
  console.log('Total Football Picks:', fPicks);
  
  const lastFootball = await prisma.footballPick.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { match: true }
  });
  
  if (lastFootball) {
    console.log('Last Football Pick Match:', lastFootball.match.homeTeam, 'vs', lastFootball.match.awayTeam);
    console.log('Created At:', lastFootball.createdAt);
  }

  const logs = await prisma.dailySyncLog.findMany({
    orderBy: { syncedAt: 'desc' },
    take: 5
  });
  console.log('--- Last 5 Sync Logs ---');
  logs.forEach(l => console.log(`[${l.sport}] ${l.status} - ${l.syncedAt.toISOString()} - Picks: ${l.picksGenerated}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
