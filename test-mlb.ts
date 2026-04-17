
async function testMLB() {
  const dateStr = '20260416';
  const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${dateStr}`;
  console.log('Fetching MLB:', url);
  const res = await fetch(url);
  const data = await res.json();
  console.log('MLB Events found:', data.events?.length || 0);
}
testMLB();
