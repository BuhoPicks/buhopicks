'use client';

import { useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './pricing.module.css';

const plans = [
  {
    key: 'MONTHLY',
    name: 'Mensual',
    price: 400,
    period: '/mes',
    features: ['Picks de Tenis (ATP, WTA, ITF)', 'Picks de Fútbol', 'Picks NBA & MLB', 'eSports & Carreras de Caballos', 'La Fija del Día', 'Parlays diarios'],
    badge: '',
    savings: '',
  },
  {
    key: 'QUARTERLY',
    name: 'Trimestral',
    price: 1000,
    period: '/3 meses',
    features: ['Todo lo del plan mensual', 'Ahorra $200 vs mensual', 'Historial de rendimiento', 'Soporte prioritario'],
    badge: '🔥 Popular',
    savings: 'Ahorra $200',
  },
  {
    key: 'SEMIANNUAL',
    name: 'Semestral',
    price: 1800,
    period: '/6 meses',
    features: ['Todo lo del plan trimestral', 'Ahorra $600 vs mensual', 'Acceso anticipado a nuevos deportes', 'Análisis exclusivos'],
    badge: '💎 Mejor valor',
    savings: 'Ahorra $600',
  },
  {
    key: 'ANNUAL',
    name: 'Anual',
    price: 3400,
    period: '/año',
    features: ['Todo incluido', 'Ahorra $1,400 vs mensual', 'Máximo ahorro', 'Soporte VIP dedicado', 'Contenido premium exclusivo'],
    badge: '👑 VIP',
    savings: 'Ahorra $1,400',
  },
];

function PricingContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const cancelled = searchParams.get('cancelled');

  const handleSelectPlan = async (planKey: string) => {
    if (!session) {
      router.push('/register');
      return;
    }

    setLoadingPlan(planKey);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Error al procesar el pago');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className={styles.pricingPage}>
      <div className={styles.bgOverlay} />

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.logoWrap}>
            <img src="/logo.png" alt="Búho Picks" className={styles.logoImg} />
          </div>
          <h1 className={styles.title}>
            <span className={styles.titleGradient}>Elige tu Plan</span>
          </h1>
          <p className={styles.subtitle}>
            Accede a todos los picks deportivos premium con IA
          </p>
          {cancelled && (
            <div className={styles.cancelledBanner}>
              El pago fue cancelado. Selecciona un plan para intentar de nuevo.
            </div>
          )}
        </div>

        <div className={styles.plansGrid}>
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`${styles.planCard} ${plan.key === 'QUARTERLY' ? styles.planPopular : ''}`}
            >
              {plan.badge && (
                <div className={styles.planBadge}>{plan.badge}</div>
              )}

              <h2 className={styles.planName}>{plan.name}</h2>

              <div className={styles.planPrice}>
                <span className={styles.currency}>$</span>
                <span className={styles.amount}>{plan.price.toLocaleString('es-MX')}</span>
                <span className={styles.period}>{plan.period}</span>
              </div>

              {plan.savings && (
                <div className={styles.savingsBadge}>{plan.savings}</div>
              )}

              <ul className={styles.features}>
                {plan.features.map((feature, i) => (
                  <li key={i}>
                    <span className={styles.checkIcon}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`${styles.selectBtn} ${plan.key === 'QUARTERLY' ? styles.selectBtnPopular : ''}`}
                onClick={() => handleSelectPlan(plan.key)}
                disabled={loadingPlan !== null}
              >
                {loadingPlan === plan.key ? (
                  <span className={styles.spinner} />
                ) : (
                  'Suscribirme'
                )}
              </button>
            </div>
          ))}
        </div>

        <p className={styles.guarantee}>
          🔒 Pago seguro procesado por Stripe · Cancela cuando quieras
        </p>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}

