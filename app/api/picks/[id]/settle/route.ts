import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { result } = await request.json(); // 'WON', 'LOST', 'VOID'
    
    if (!['WON', 'LOST', 'VOID'].includes(result)) {
      return NextResponse.json({ error: 'Invalid result' }, { status: 400 });
    }

    const pick = await prisma.tennisPick.update({
      where: { id },
      data: { 
        status: result,
        settledAt: new Date()
      },
      include: { match: true }
    });

    // Handle history entry
    const profit = result === 'WON' ? (pick.odds - 1) : result === 'LOST' ? -1 : 0;

    await prisma.pickHistory.upsert({
      where: { pickId: pick.id },
      update: {
        result,
        profit,
        settledAt: new Date()
      },
      create: {
        pickId: pick.id,
        result,
        odds: pick.odds,
        profit,
      }
    });

    return NextResponse.json({ success: true, pick });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
