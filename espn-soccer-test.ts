async function test() {
  const resp = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard`);
  const data = await resp.json();
  if (data.events && data.events.length > 0) {
     const match = data.events[0];
     const home = match.competitions[0].competitors[0];
     console.log(JSON.stringify(home.records, null, 2));
     console.log(JSON.stringify(home.statistics, null, 2));
     console.log(Object.keys(home));
  }
}
test();
