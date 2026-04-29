'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import styles from './account.module.css';

const planLabels: Record<string, string> = {
  MONTHLY: 'Mensual — $400/mes',
  QUARTERLY: 'Trimestral — $1,000/3 meses',
  SEMIANNUAL: 'Semestral — $1,800/6 meses',
  ANNUAL: 'Anual — $3,400/año',
  FREE: 'Sin suscripción',
};

const statusLabels: Record<string, string> = {
  ACTIVE: '✅ Activa',
  INACTIVE: '⏳ Inactiva',
  PAST_DUE: '⚠️ Pago pendiente',
  CANCELLED: '❌ Cancelada',
  NONE: '⏳ Sin suscripción',
};

export default function AccountPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const user = session?.user as any;

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert('Error al abrir el portal de facturación');
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div className={styles.accountPage}>
      <h1 className={styles.title}>Mi Cuenta</h1>

      <div className={styles.cardsGrid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>👤 Información</h2>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Nombre</span>
            <span className={styles.infoValue}>{user?.name || '—'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Email</span>
            <span className={styles.infoValue}>{user?.email || '—'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Tipo</span>
            <span className={styles.infoValue}>{user?.role === 'ADMIN' ? '🛡️ Administrador' : '👤 Usuario'}</span>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>💳 Suscripción</h2>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Plan</span>
            <span className={styles.infoValue}>{planLabels[user?.subscriptionPlan] || 'Sin plan'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Estado</span>
            <span className={styles.infoValue}>{statusLabels[user?.subscriptionStatus] || '—'}</span>
          </div>

          {user?.subscriptionStatus === 'ACTIVE' && (
            <button onClick={handleManageSubscription} className={styles.manageBtn} disabled={loading}>
              {loading ? 'Cargando...' : '⚙️ Gestionar suscripción'}
            </button>
          )}

          {user?.subscriptionStatus !== 'ACTIVE' && user?.role !== 'ADMIN' && (
            <a href="/pricing" className={styles.upgradeBtn}>
              🚀 Suscribirme ahora
            </a>
          )}
        </div>
      </div>

      <button onClick={() => signOut({ callbackUrl: '/login' })} className={styles.logoutBtn}>
        🚪 Cerrar sesión
      </button>
    </div>
  );
}
