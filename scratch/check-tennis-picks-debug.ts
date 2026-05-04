import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  const start = new Date('2026-05-01T06:00:00Z');
  const end = new Date('2026-05-02T06:00:00Z');
  
  const picks = await prisma.tennisPick.findMany({
    where: {
      match: {
        date: { gte: start, lt: end }
      }
    },
    include: { match: true }
  });
  
  console.log('Tennis Picks found in Dashboard Window:', picks.length);
  if (picks.length > 0) {
    picks.forEach(p => {
      console.log(`Pick: ${p.selection} - EV: ${p.expectedValue} - Conf: ${p.confidenceScore} - Match: ${p.match.player1Name} vs ${p.match.player2Name}`);
    });
  } else {
    // If 0 picks, check the matches to see if they exist
    const matches = await prisma.tennisMatch.findMany({
      where: { date: { gte: start, lt: end } }
    });
    console.log('Matches found:', matches.length);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
