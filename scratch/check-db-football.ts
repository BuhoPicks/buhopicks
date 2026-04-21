import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const mxOffset = -6 * 60 * 60 * 1000;
  const now = new Date();
  const mxNow = new Date(now.getTime() + mxOffset);
  const mxTodayStart = new Date(Date.UTC(mxNow.getUTCFullYear(), mxNow.getUTCMonth(), mxNow.getUTCDate()));
  const start = new Date(mxTodayStart.getTime() - mxOffset);
  const end = new Date(start.getTime() + 86400000);

  console.log('Checking picks for range:', start.toISOString(), 'to', end.toISOString());

  const picks = await prisma.footballPick.findMany({
    where: { match: { date: { gte: start, lt: end } } },
    include: { match: true }
  });

  console.log(`Found ${picks.length} football picks.`);
  picks.slice(0, 5).forEach(p => {
    console.log(`- [${p.match.homeTeam} vs ${p.match.awayTeam}] ${p.market}: ${p.selection} (@${p.odds}) - ${p.description}`);
  });
}

check().catch(console.error);
