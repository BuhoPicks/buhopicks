import prisma from './lib/prisma';

async function main() {
  const mxFmt = (offsetDays: number) => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date(Date.now() + offsetDays * 86400000)).replace(/-/g, '');

  const todayStr = mxFmt(0);
  console.log(`🔍 Checking picks for TODAY (${todayStr}) in Turso DB...`);
  
  const matches = await prisma.footballMatch.findMany({
    where: { 
      date: {
        gte: new Date(new Date().setHours(0,0,0,0) - 24*3600*1000), // very broad
        lt: new Date(new Date().setHours(0,0,0,0) + 48*3600*1000)
      }
    },
    include: { picks: true },
    orderBy: { date: 'asc' }
  });

  console.log(`Found ${matches.length} matches in the next 24h window.`);
  
  matches.forEach((m, i) => {
    console.log(`Match: ${m.homeTeam} vs ${m.awayTeam} (${m.date.toISOString()})`);
    m.picks.forEach(p => {
      console.log(`  - ${p.description} (@${p.odds})`);
    });
  });

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
