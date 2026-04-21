import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function diagnose() {
  const mxOffset = -6 * 60 * 60 * 1000;
  const now = new Date();
  const mxNow = new Date(now.getTime() + mxOffset);
  const mxTodayStart = new Date(Date.UTC(mxNow.getUTCFullYear(), mxNow.getUTCMonth(), mxNow.getUTCDate()));
  const start = new Date(mxTodayStart.getTime() - mxOffset);
  const end = new Date(start.getTime() + 86400000);

  console.log('--- DB DIAGNOSTIC ---');
  console.log('Date Window:', start.toISOString(), 'to', end.toISOString());

  const matchCount = await prisma.footballMatch.count({
    where: { date: { gte: start, lt: end } }
  });
  console.log('Matches found for today:', matchCount);

  const picks = await prisma.footballPick.findMany({
    where: { match: { date: { gte: start, lt: end } } },
    orderBy: { confidenceScore: 'desc' },
    include: { match: true }
  });
  console.log('Total football picks:', picks.length);

  const markets = [...new Set(picks.map(p => p.market))];
  console.log('Markets present:', markets);

  const premiumPicks = picks.filter(p => p.isPremiumPick);
  console.log('Premium picks:', premiumPicks.length);

  if (picks.length > 0) {
    console.log('Sample Pick:', picks[0].description, '@', picks[0].odds, 'Confidence:', picks[0].confidenceScore);
  } else {
    console.log('WARNING: No football picks found for today in DB.');
  }
}

diagnose().catch(console.error);
