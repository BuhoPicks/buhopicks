import prisma from './lib/prisma';

async function main() {
  console.log('🔍 Inspecting production football picks in Turso DB...');
  
  const picks = await prisma.footballPick.findMany({
    take: 10,
    include: { match: true },
    orderBy: { createdAt: 'desc' }
  });

  console.log('Recent 10 picks:');
  picks.forEach((p, i) => {
    console.log(`[${i+1}] Match: ${p.match.homeTeam} vs ${p.match.awayTeam} (${p.match.date.toISOString()})`);
    console.log(`    Market: ${p.market}`);
    console.log(`    Selection: ${p.selection}`);
    console.log(`    Description: ${p.description}`);
    console.log(`    isPremium: ${p.isPremiumPick}`);
  });

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
