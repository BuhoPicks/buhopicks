import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  const count = await prisma.tennisMatch.count({
    where: {
      date: {
        gte: new Date('2026-05-01T00:00:00Z'),
        lt: new Date('2026-05-02T00:00:00Z')
      }
    }
  });
  console.log('Tennis Matches on May 1st (UTC):', count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
