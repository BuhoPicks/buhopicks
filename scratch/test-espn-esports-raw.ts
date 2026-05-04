async function test() {
  const url = `https://site.api.espn.com/apis/site/v2/sports/esports/league-of-legends/scoreboard`;
  console.log('Fetching:', url);
  const res = await fetch(url);
  const data = await res.json();
  console.log('Events found:', data.events?.length || 0);
}
test();
