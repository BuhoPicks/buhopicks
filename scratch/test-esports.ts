import { getEsportsPicks } from './lib/esportsEngine';

async function test() {
  const picks = await getEsportsPicks();
  console.log('eSports Picks:', picks.length);
  picks.forEach(p => console.log(`- ${p.description} (${p.confidenceScore}%)`));
}
test();
