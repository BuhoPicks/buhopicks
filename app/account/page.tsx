'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './account.module.css';

const planLabels: Record<string, string> = {
  MONTHLY:    'Mensual — $400/mes',
  QUARTERLY:  'Trimestral — $1,000/3 meses',
  SEMIANNUAL: 'Semestral — $1,800/6 meses',
  ANNUAL:     'Anual — $3,400/año',
  FREE:       'Sin suscripción',
};

const statusLabels: Record<string, string> = {
  ACTIVE:    '✅ Activa',
  INACTIVE:  '⏳ Inactiva',
  PAST_DUE:  '⚠️ Pago pendiente',
  CANCELLED: '❌ Cancelada',
  NONE:      '⏳ Sin suscripción',
};

export default function AccountPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [portalLoading, setPortalLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const user = session?.user as any;

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNew, setConfirmNew] = useState('');

  const openEdit = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNew('');
    setSaveMsg(null);
    setEditMode(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMsg(null);

    if (newPassword && newPassword !== confirmNew) {
      setSaveMsg({ type: 'err', text: 'Las contraseñas nuevas no coinciden' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, currentPassword: currentPassword || undefined, newPassword: newPassword || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveMsg({ type: 'err', text: data.error || 'Error al guardar' });
      } else {
        setSaveMsg({ type: 'ok', text: data.message });
        // Refresh session to reflect new name/email in the UI
        await updateSession();
        router.refresh();
        setEditMode(false);
      }
    } catch {
      setSaveMsg({ type: 'err', text: 'Error de conexión' });
    } finally {
      setSaving(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert('Error al abrir el portal de facturación');
    } finally {
      setPortalLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div className={styles.accountPage}>
      <h1 className={styles.title}>Mi Cuenta</h1>

      <div className={styles.cardsGrid}>
        {/* Profile Card */}
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 className={styles.cardTitle}>👤 Información</h2>
            {!editMode && (
              <button onClick={openEdit} className={styles.editBtn}>
                ✏️ Editar
              </button>
            )}
          </div>

          {!editMode ? (
            <>
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
            </>
          ) : (
            <form onSubmit={handleSave} className={styles.editForm}>
              {saveMsg && (
                <div className={saveMsg.type === 'ok' ? styles.successBox : styles.errorBox}>
                  {saveMsg.type === 'ok' ? '✅' : '⚠️'} {saveMsg.text}
                </div>
              )}

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={styles.editInput}
                  placeholder="Tu nombre completo"
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={styles.editInput}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div className={styles.divider}>
                <span>Cambiar contraseña (opcional)</span>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Contraseña actual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className={styles.editInput}
                  placeholder="Solo si deseas cambiar contraseña"
                  autoComplete="current-password"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Nueva contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className={styles.editInput}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={confirmNew}
                  onChange={e => setConfirmNew(e.target.value)}
                  className={styles.editInput}
                  placeholder="Repite la nueva contraseña"
                  autoComplete="new-password"
                />
              </div>

              <div className={styles.editActions}>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? 'Guardando...' : '💾 Guardar cambios'}
                </button>
                <button type="button" onClick={() => setEditMode(false)} className={styles.cancelBtn}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Subscription Card */}
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
            <button onClick={handleManageSubscription} className={styles.manageBtn} disabled={portalLoading}>
              {portalLoading ? 'Cargando...' : '⚙️ Gestionar suscripción'}
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
