import { getHorseRacingPick } from './lib/horseRacingEngine';

async function test() {
  const pick = await getHorseRacingPick();
  console.log('Horse Racing Pick:', pick ? pick.match.player1Name : 'None');
  if (pick) {
    console.log(`- ${pick.description} (${pick.confidenceScore}%)`);
  }
}
test();
