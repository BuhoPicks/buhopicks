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
