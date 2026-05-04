import { getBasketballPicks, getBaseballPicks } from '../lib/usSportsEngine';

async function test() {
  const mxFmt = (offsetDays: number) => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date(Date.now() + offsetDays * 86400000)).replace(/-/g, '');

  const today = mxFmt(0);
  const tomorrow = mxFmt(1);

  console.log('Testing for TODAY:', today);
  const nbaToday = await getBasketballPicks(today);
  console.log('NBA Today Picks:', nbaToday.length);
  const mlbToday = await getBaseballPicks(today);
  console.log('MLB Today Picks:', mlbToday.length);

  console.log('\nTesting for TOMORROW:', tomorrow);
  const nbaTom = await getBasketballPicks(tomorrow);
  console.log('NBA Tomorrow Picks:', nbaTom.length);
  const mlbTom = await getBaseballPicks(tomorrow);
  console.log('MLB Tomorrow Picks:', mlbTom.length);
}

test();
