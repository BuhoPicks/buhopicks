
import { getBasketballParlay, getBaseballParlay, getBasketballPicks, getBaseballPicks } from './lib/usSportsEngine';

async function verifyParlays() {
  const mxOffset = -6 * 60 * 60 * 1000;
  const mxTime = new Date(new Date().getTime() + mxOffset);
  const todayStr = mxTime.toISOString().split('T')[0].replace(/-/g, '');
  
  console.log(`Checking parlays for date: ${todayStr}`);
  
  console.log('--- NBA ---');
  const nbaPicks = await getBasketballPicks(todayStr);
  console.log(`NBA Picks for today: ${nbaPicks.length}`);
  const nbaParlay = await getBasketballParlay(todayStr);
  console.log('NBA Parlay:', nbaParlay ? JSON.stringify(nbaParlay, null, 2) : 'NONE');
  
  console.log('\n--- MLB ---');
  const mlbPicks = await getBaseballPicks(todayStr);
  console.log(`MLB Picks for today: ${mlbPicks.length}`);
  const mlbParlay = await getBaseballParlay(todayStr);
  console.log('MLB Parlay:', mlbParlay ? JSON.stringify(mlbParlay, null, 2) : 'NONE');
}

verifyParlays().catch(console.error);
