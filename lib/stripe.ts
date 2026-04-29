import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

export const PLANS = {
  MONTHLY: {
    name: 'Mensual',
    price: 400,
    priceId: process.env.STRIPE_PRICE_MONTHLY!,
    interval: 'month' as const,
    intervalCount: 1,
    badge: '',
    savings: '',
  },
  QUARTERLY: {
    name: 'Trimestral',
    price: 1000,
    priceId: process.env.STRIPE_PRICE_QUARTERLY!,
    interval: 'month' as const,
    intervalCount: 3,
    badge: '🔥 Popular',
    savings: 'Ahorra $200',
  },
  SEMIANNUAL: {
    name: 'Semestral',
    price: 1800,
    priceId: process.env.STRIPE_PRICE_SEMIANNUAL!,
    interval: 'month' as const,
    intervalCount: 6,
    badge: '💎 Mejor valor',
    savings: 'Ahorra $600',
  },
  ANNUAL: {
    name: 'Anual',
    price: 3400,
    priceId: process.env.STRIPE_PRICE_ANNUAL!,
    interval: 'year' as const,
    intervalCount: 1,
    badge: '👑 VIP',
    savings: 'Ahorra $1,400',
  },
} as const;

export type PlanKey = keyof typeof PLANS;
