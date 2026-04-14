/**
 * Sofascore Tennis Data Service
 * 
 * Provides functions to fetch and parse tennis match data from Sofascore.
 */

export interface SofascoreMatch {
  id: string;
  homePlayer: string;
  awayPlayer: string;
  tournament: string;
  status: string;
  timestamp: number;
}

export async function fetchSofascoreTennisMatches(date: Date): Promise<SofascoreMatch[]> {
  const dateStr = date.toISOString().split('T')[0];
  const url = `https://api.sofascore.com/api/v1/sport/tennis/scheduled-events/${dateStr}`;
  
  try {
    // Note: Sofascore API often requires specific headers (User-Agent, etc.)
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://www.sofascore.com',
        'Referer': 'https://www.sofascore.com/'
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      console.error(`SofaScore API returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    const events = data.events || [];

    return events.map((ev: any) => ({
      id: ev.id.toString(),
      homePlayer: ev.homeTeam?.name || 'Unknown',
      awayPlayer: ev.awayTeam?.name || 'Unknown',
      tournament: ev.tournament?.name || 'Unknown Tournament',
      status: ev.status?.type || 'scheduled',
      timestamp: ev.startTimestamp
    }));
  } catch (error) {
    console.error('Error fetching from SofaScore:', error);
    return [];
  }
}

/**
 * Merges Sofascore data into ESPN matches.
 * Missing matches from Sofascore are added.
 */
export function mergeSofaWithEspn(espnEvents: any[], sofaEvents: SofascoreMatch[]) {
  const merged = [...espnEvents];
  
  // Find matches in Sofascore not in ESPN
  for (const sofa of sofaEvents) {
    const exists = espnEvents.some(espn => {
      const eName1 = espn.name?.toLowerCase() || '';
      const sName1 = `${sofa.homePlayer} vs ${sofa.awayPlayer}`.toLowerCase();
      const sName2 = `${sofa.awayPlayer} vs ${sofa.homePlayer}`.toLowerCase();
      return eName1.includes(sofa.homePlayer.toLowerCase()) && eName1.includes(sofa.awayPlayer.toLowerCase());
    });

    if (!exists) {
      // Create a compatible event object
      merged.push({
        id: `sofa-${sofa.id}`,
        name: `${sofa.homePlayer} vs ${sofa.awayPlayer}`,
        date: new Date(sofa.timestamp * 1000).toISOString(),
        competitions: [{
          id: sofa.id,
          date: new Date(sofa.timestamp * 1000).toISOString(),
          competitors: [
            { athlete: { displayName: sofa.homePlayer }, order: 0 },
            { athlete: { displayName: sofa.awayPlayer }, order: 1 }
          ],
          venue: { fullName: sofa.tournament },
          type: { text: 'R32' } // Default
        }],
        _source: 'sofascore'
      });
    }
  }

  return merged;
}
