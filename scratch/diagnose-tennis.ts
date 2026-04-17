
const fetchTennisEvents = async (circuit: string, dateStr: string) => {
  const url = `https://site.api.espn.com/apis/site/v2/sports/tennis/${circuit}/scoreboard?dates=${dateStr}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.events || [];
};

const fetchSofascoreTennisMatches = async (date: Date) => {
  const dateStr = date.toISOString().split('T')[0];
  const url = `https://api.sofascore.com/api/v1/sport/tennis/scheduled-events/${dateStr}`;
  const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://www.sofascore.com',
        'Referer': 'https://www.sofascore.com/'
      }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.events || [];
};

async function diagnoseTennis() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const formatDate = (d: Date) => {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}${m}${day}`;
  };

  const todayStr = formatDate(today);
  const tomorrowStr = formatDate(tomorrow);

  console.log(`Checking Tennis for ${todayStr} and ${tomorrowStr}...`);

  const [atp1, atp2, wta1, wta2, sofa1, sofa2] = await Promise.all([
    fetchTennisEvents('atp', todayStr),
    fetchTennisEvents('atp', tomorrowStr),
    fetchTennisEvents('wta', todayStr),
    fetchTennisEvents('wta', tomorrowStr),
    fetchSofascoreTennisMatches(today),
    fetchSofascoreTennisMatches(tomorrow),
  ]);

  console.log(`ESPN ATP Today: ${atp1.length}`);
  console.log(`ESPN ATP Tomorrow: ${atp2.length}`);
  console.log(`ESPN WTA Today: ${wta1.length}`);
  console.log(`ESPN WTA Tomorrow: ${wta2.length}`);
  console.log(`Sofascore Today: ${sofa1.length}`);
  console.log(`Sofascore Tomorrow: ${sofa2.length}`);

  const allSofa = [...sofa1, ...sofa2];
  const tournaments = Array.from(new Set(allSofa.map((s: any) => s.tournament?.name)));
  console.log('Sofascore Tournaments found:');
  tournaments.slice(0, 15).forEach(t => console.log(`- ${t}`));
}

diagnoseTennis();
