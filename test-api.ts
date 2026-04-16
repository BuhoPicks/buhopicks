async function run() {
  try {
    const res = await fetch('http://localhost:3333/api/automation/daily-sync?sport=nba');
    const text = await res.text();
    console.log('STATUS:', res.status);
    console.log('TEXT:', text);
  } catch(e) {
    console.error(e);
  }
}
run();
