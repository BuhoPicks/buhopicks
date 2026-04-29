import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: { subscription: true },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      totalUsers: users.length,
      activeSubscriptions: users.filter(u => u.subscription?.status === 'ACTIVE').length,
      monthlyRevenue: users.reduce((acc, u) => {
        if (u.subscription?.status !== 'ACTIVE') return acc;
        const plan = u.subscription.plan;
        if (plan === 'MONTHLY') return acc + 400;
        if (plan === 'QUARTERLY') return acc + 333;
        if (plan === 'SEMIANNUAL') return acc + 300;
        if (plan === 'ANNUAL') return acc + 283;
        return acc;
      }, 0),
    };

    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
        subscription: u.subscription ? {
          plan: u.subscription.plan,
          status: u.subscription.status,
          startDate: u.subscription.startDate,
          endDate: u.subscription.endDate,
        } : null,
      })),
      stats,
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
