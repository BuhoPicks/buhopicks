import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, PLANS, PlanKey } from '@/lib/stripe';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { plan } = await request.json();
    const planKey = plan as PlanKey;

    if (!PLANS[planKey]) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const selectedPlan = PLANS[planKey];

    // Get or create Stripe customer
    let subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name || undefined,
        metadata: { userId },
      });
      customerId = customer.id;

      if (subscription) {
        await prisma.subscription.update({
          where: { userId },
          data: { stripeCustomerId: customerId },
        });
      }
    }

    // Create Stripe Checkout Session
    const baseUrl = process.env.NEXTAUTH_URL || 'https://buhopicks.vercel.app';
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
      success_url: `${baseUrl}/?subscription=success`,
      cancel_url: `${baseUrl}/pricing?cancelled=true`,
      metadata: { userId, plan: planKey },
      subscription_data: {
        metadata: { userId, plan: planKey },
      },
      locale: 'es',
      currency: 'mxn',
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Error al crear la sesión de pago' },
      { status: 500 }
    );
  }
}
