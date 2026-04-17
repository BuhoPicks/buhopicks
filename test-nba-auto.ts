
async function testNBAAuto() {
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard`;
  console.log('Fetching NBA Auto:', url);
  const res = await fetch(url);
  const data = await res.json();
  console.log('NBA Auto Events found:', data.events?.length || 0);
  if (data.events?.[0]) {
    console.log('First event date:', data.events[0].date);
  }
}
testNBAAuto();
