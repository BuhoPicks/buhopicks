
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTennisPicks() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  console.log(`Checking tennis picks for: ${today.toISOString()} to ${tomorrow.toISOString()}`);

  const matches = await prisma.match.findMany({
    where: {
      sport: 'TENNIS',
      startTime: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      predictions: true,
    }
  });

  console.log(`Found ${matches.length} tennis matches for today.`);
  
  const matchesWithPicks = matches.filter(m => m.predictions && m.predictions.length > 0);
  console.log(`Found ${matchesWithPicks.length} matches with predictions.`);

  if (matches.length > 0) {
    console.log('Sample match:', JSON.stringify(matches[0], null, 2));
  }

  const allTennis = await prisma.match.count({ where: { sport: 'TENNIS' } });
  console.log(`Total tennis matches in DB: ${allTennis}`);

  await prisma.$disconnect();
}

checkTennisPicks().catch(console.error);
