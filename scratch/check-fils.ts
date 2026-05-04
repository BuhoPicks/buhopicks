import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  const match = await prisma.tennisMatch.findFirst({
    where: { player1Name: { contains: 'Fils' } }
  });
  
  if (match) {
    console.log('Match:', match.player1Name, 'vs', match.player2Name);
    console.log('Ranking 1:', match.player1Ranking);
    console.log('Ranking 2:', match.player2Ranking);
    console.log('Circuit:', match.circuit);
  } else {
    console.log('Fils match not found.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
