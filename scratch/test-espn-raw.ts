async function test() {
  const dateStr = '20260501';
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`;
  console.log('Fetching:', url);
  const res = await fetch(url);
  const data = await res.json();
  console.log('Events found:', data.events?.length || 0);
  if (data.events?.length > 0) {
    console.log('First event:', data.events[0].name);
  }
}
test();
