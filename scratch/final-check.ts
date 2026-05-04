import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  
  // Dashboard Window for Today (MX)
  const start = new Date(Date.UTC(y, m, d, 6, 0, 0, 0));
  const end   = new Date(start.getTime() + 86400000);
  
  const tPicks = await prisma.tennisPick.count({
    where: { match: { date: { gte: start, lt: end } } }
  });
  const fPicks = await prisma.footballPick.count({
    where: { match: { date: { gte: start, lt: end } } }
  });
  
  console.log(`Cloud Stats for Dashboard Today (MX):`);
  console.log(`Tennis Picks: ${tPicks}`);
  console.log(`Football Picks: ${fPicks}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
