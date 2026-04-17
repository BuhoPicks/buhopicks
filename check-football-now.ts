
async function checkFootballToday() {
  const dateStr = '20260416';
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${dateStr}`;
  console.log('Fetching Football:', url);
  const res = await fetch(url);
  const data = await res.json();
  console.log('Football events found:', data.events?.length || 0);
  if (data.events?.[0]) {
    console.log('Sample match:', data.events[0].name);
  }
}
checkFootballToday();
