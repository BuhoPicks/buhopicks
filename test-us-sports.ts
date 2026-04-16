import { getBasketballParlay, getBaseballParlay } from './lib/usSportsEngine.ts';

async function test() {
  console.log("Testing NBA Parlay generation...");
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const nba = await getBasketballParlay(dateStr);
  console.log("NBA Parlay:", JSON.stringify(nba, null, 2));

  console.log("Testing MLB Parlay generation...");
  const mlb = await getBaseballParlay(dateStr);
  console.log("MLB Parlay:", JSON.stringify(mlb, null, 2));
}

test().catch(console.error);
