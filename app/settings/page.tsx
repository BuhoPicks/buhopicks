'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function SettingsPage() {
  const [prefs, setPrefs] = useState({
    showATP: true,
    showWTA: true,
    showChallenger: true,
    riskProfile: 'BALANCED',
    notifications: {
      email: false,
      telegram: false,
      push: true
    }
  });

  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}><span className="text-gradient">Personalización</span></h1>
        <p className={styles.pageSubtitle}>Configura tus preferencias y niveles de riesgo</p>
      </header>

      <div className={styles.grid}>
        {/* Risk Profile */}
        <section className={`glass ${styles.section}`}>
          <h2 className={styles.sectionTitle}>Perfil de Riesgo</h2>
          <p className={styles.sectionDesc}>Define qué tan agresivas deben ser las recomendaciones de picks.</p>
          
          <div className={styles.riskGrid}>
            {['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'].map(profile => (
              <button
                key={profile}
                className={`${styles.riskBtn} ${prefs.riskProfile === profile ? styles.riskBtnActive : ''}`}
                onClick={() => setPrefs({...prefs, riskProfile: profile})}
              >
                <div className={styles.riskIcon}>
                  {profile === 'CONSERVATIVE' ? '🛡️' : profile === 'BALANCED' ? '⚖️' : '🔥'}
                </div>
                <div className={styles.riskName}>
                  {profile === 'CONSERVATIVE' ? 'Conservador' : profile === 'BALANCED' ? 'Balanceado' : 'Agresivo'}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Circuits */}
        <section className={`glass ${styles.section}`}>
          <h2 className={styles.sectionTitle}>Circuitos Preferidos</h2>
          <div className={styles.toggleList}>
            {[
              { id: 'showATP', label: 'ATP Tour', icon: '🎾' },
              { id: 'showWTA', label: 'WTA Tour', icon: '🎾' },
              { id: 'showChallenger', label: 'ATP Challenger', icon: '🏆' },
            ].map(item => (
              <div key={item.id} className={styles.toggleItem}>
                <span className={styles.itemIcon}>{item.icon}</span>
                <span className={styles.itemLabel}>{item.label}</span>
                <input
                  type="checkbox"
                  checked={(prefs as any)[item.id]}
                  onChange={(e) => setPrefs({...prefs, [item.id]: e.target.checked})}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section className={`glass ${styles.section}`}>
          <h2 className={styles.sectionTitle}>Notificaciones</h2>
          <div className={styles.toggleList}>
            {[
              { id: 'push', label: 'Alertas Navegador', sub: 'Picks detectados al instante' },
              { id: 'email', label: 'Email Diario', sub: 'Resumen de picks cada mañana' },
              { id: 'telegram', label: 'Telegram Bot', sub: 'Alertas en tu móvil' },
            ].map(item => (
              <div key={item.id} className={styles.toggleItem}>
                <div className={styles.itemText}>
                  <div className={styles.itemLabel}>{item.label}</div>
                  <div className={styles.itemSub}>{item.sub}</div>
                </div>
                <input
                  type="checkbox"
                  checked={(prefs.notifications as any)[item.id]}
                  onChange={(e) => setPrefs({
                    ...prefs,
                    notifications: {...prefs.notifications, [item.id]: e.target.checked}
                  })}
                />
              </div>
            ))}
          </div>
        </section>

        <div className={styles.footer}>
          <button onClick={save} className="btn btn-primary" style={{ minWidth: '200px' }}>
            {saved ? '✅ Guardado' : 'Guardar Preferencias'}
          </button>
        </div>
      </div>
    </div>
  );
}
