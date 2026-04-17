
async function testNBA() {
  const dateStr = '20260416';
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`;
  console.log('Fetching:', url);
  const res = await fetch(url);
  const data = await res.json();
  console.log('Events found:', data.events?.length || 0);
  if (data.events?.[0]) {
    console.log('First event status:', data.events[0].status?.type?.name);
    console.log('First event state:', data.events[0].status?.type?.state);
  }
}
testNBA();
