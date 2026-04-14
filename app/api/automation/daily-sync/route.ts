import { runDailyTennisSync } from '@/lib/tennisEngine';
import { runDailyFootballSync } from '@/lib/footballEngine';
import { NextResponse, NextRequest } from 'next/server';

export const maxDuration = 60; // 60s timeout

export async function GET(req: NextRequest) {
  const sport = req.nextUrl.searchParams.get('sport') || 'tennis';

  try {
    if (sport === 'football') {
      console.log('📡 Soccer sync triggered via API...');
      const result = await runDailyFootballSync();
      return NextResponse.json({ message: 'Football sync completed', result });
    } else if (sport === 'nba') {
      console.log('📡 NBA Basketball sync triggered via API...');
      const { getBasketballParlay } = await import('@/lib/usSportsEngine');
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const data = await getBasketballParlay(dateStr);
      const result = {
        matchesFound: data ? data.picks.length : 0,
        picksGenerated: data ? data.picks.length : 0,
        premiumPicks: 0,
        message: 'NBA sync verified'
      };
      return NextResponse.json({ message: 'NBA sync completed', result });
    } else if (sport === 'mlb') {
      console.log('📡 MLB Baseball sync triggered via API...');
      const { getBaseballParlay } = await import('@/lib/usSportsEngine');
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const data = await getBaseballParlay(dateStr);
      const result = {
        matchesFound: data ? data.picks.length : 0,
        picksGenerated: data ? data.picks.length : 0,
        premiumPicks: 0,
        message: 'MLB sync verified'
      };
      return NextResponse.json({ message: 'MLB sync completed', result });
    } else {
      console.log('📡 Tennis sync triggered via API...');
      const result = await runDailyTennisSync();
      return NextResponse.json({ message: 'Tennis sync completed', result });
    }
  } catch (error: any) {
    console.error(`Error in daily ${sport} sync:`, error);
    return NextResponse.json(
      { error: error.message || 'Unknown error during sync' },
      { status: 500 }
    );
  }
}
