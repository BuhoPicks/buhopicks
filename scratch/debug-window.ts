import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  const match = await prisma.footballMatch.findFirst({
    where: { homeTeam: 'Portsmouth' },
    select: { date: true, espnId: true }
  });
  
  if (match) {
    console.log('Match Date (UTC):', match.date.toISOString());
    console.log('Current Time (UTC):', new Date().toISOString());
    
    // Now simulate getMEXDateWindow('today')
    const MX_OFFSET_MS = 6 * 60 * 60 * 1000;
    const nowUTC = Date.now();
    const mxNowDate = new Date(nowUTC - MX_OFFSET_MS);
    const y = mxNowDate.getUTCFullYear();
    const m = mxNowDate.getUTCMonth();
    const d = mxNowDate.getUTCDate();

    const startLocal = new Date(Date.UTC(y, m, d));
    const start = new Date(startLocal.getTime() + MX_OFFSET_MS);
    const end = new Date(start.getTime() + 86400000);

    console.log('Dashboard Filter Window (Today MX):');
    console.log('Start (UTC):', start.toISOString());
    console.log('End (UTC):', end.toISOString());
    
    const isInside = match.date >= start && match.date < end;
    console.log('Is Match Inside Window?', isInside);
  } else {
    console.log('Match not found.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
