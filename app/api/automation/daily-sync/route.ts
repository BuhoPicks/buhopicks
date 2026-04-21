import { runDailyTennisSync } from '@/lib/tennisEngine';
import { runDailyFootballSync } from '@/lib/footballEngine';
import { NextResponse, NextRequest } from 'next/server';

export const maxDuration = 60; // 60s timeout (Vercel Pro limit)

export async function GET(req: NextRequest) {
  const sport = req.nextUrl.searchParams.get('sport') || 'tennis';
  const start = Date.now();

  try {
    if (sport === 'football') {
      console.log('📡 Football sync triggered via API...');
      const result = await runDailyFootballSync();
      return NextResponse.json({
        message: 'Football sync completed',
        result,
        durationMs: Date.now() - start,
      });

    } else if (sport === 'tennis') {
      console.log('📡 Tennis sync triggered via API...');
      const result = await runDailyTennisSync();
      return NextResponse.json({
        message: 'Tennis sync completed',
        result,
        durationMs: Date.now() - start,
      });

    } else if (sport === 'all') {
      console.log('📡 Full sync (all sports) triggered via API...');
      const [tennis, football] = await Promise.allSettled([
        runDailyTennisSync(),
        runDailyFootballSync(),
      ]);
      return NextResponse.json({
        message: 'All sports sync completed',
        tennis:   tennis.status === 'fulfilled' ? tennis.value : { error: (tennis as any).reason?.message },
        football: football.status === 'fulfilled' ? football.value : { error: (football as any).reason?.message },
        durationMs: Date.now() - start,
      });

    } else if (sport === 'nba') {
      // NBA is real-time via ESPN API — no DB sync needed, just verify
      const dateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Mexico_City',
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(new Date()).replace(/-/g, '');
      const { getBasketballParlay } = await import('@/lib/usSportsEngine');
      const data = await getBasketballParlay(dateStr);
      return NextResponse.json({
        message: 'NBA data verified (real-time)',
        picksFound: data ? data.picks.length : 0,
        durationMs: Date.now() - start,
      });

    } else if (sport === 'mlb') {
      // MLB is real-time via ESPN API — no DB sync needed, just verify
      const dateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Mexico_City',
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(new Date()).replace(/-/g, '');
      const { getBaseballParlay } = await import('@/lib/usSportsEngine');
      const data = await getBaseballParlay(dateStr);
      return NextResponse.json({
        message: 'MLB data verified (real-time)',
        picksFound: data ? data.picks.length : 0,
        durationMs: Date.now() - start,
      });

    } else {
      return NextResponse.json(
        { error: `Unknown sport: "${sport}". Use football, tennis, nba, mlb, or all.` },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error(`Error in ${sport} sync:`, error);
    return NextResponse.json(
      { error: error.message || 'Unknown error during sync', durationMs: Date.now() - start },
      { status: 500 }
    );
  }
}
