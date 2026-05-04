import { getBasketballPicks, getBaseballPicks } from '../lib/usSportsEngine';

async function test() {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  console.log('Testing for date:', today);
  
  const nba = await getBasketballPicks(today);
  console.log('NBA Picks found:', nba.length);
  nba.forEach(p => console.log(`- ${p.description} (${p.confidenceScore}%)`));
  
  const mlb = await getBaseballPicks(today);
  console.log('MLB Picks found:', mlb.length);
  mlb.forEach(p => console.log(`- ${p.description} (${p.confidenceScore}%)`));
}

test();
