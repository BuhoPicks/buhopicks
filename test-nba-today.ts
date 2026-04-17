
async function testNBAToday() {
  const dateStr = '20260415';
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`;
  console.log('Fetching NBA Today:', url);
  const res = await fetch(url);
  const data = await res.json();
  console.log('NBA Today Events found:', data.events?.length || 0);
}
testNBAToday();
