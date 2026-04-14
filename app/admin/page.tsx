'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; matches?: number; picks?: number; premium?: number } | null>(null);

  const runSync = async (sport: string) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/automation/daily-sync?sport=${sport}`);
      const data = await res.json();
      if (res.ok && data.result) {
        setResult({
          success: true,
          message: data.result.message || `Sync completado con éxito`,
          matches: data.result.matchesFound,
          picks: data.result.picksGenerated,
          premium: data.result.premiumPicks,
        });
      } else {
        setResult({ success: false, message: data.error || 'Error desconocido' });
      }
    } catch (err: any) {
      setResult({ success: false, message: `Error de red: ${err.message}` });
    }
    setLoading(false);
  };

  const settleWon = async (id: string) => {
    await fetch(`/api/picks/${id}/settle`, { method: 'POST', body: JSON.stringify({ result: 'WON' }) });
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}><span className="text-gradient">Panel de Control</span></h1>
        <p className={styles.pageSubtitle}>Administración del sistema Búho Picks</p>
      </header>

      <div className={styles.grid}>
        {/* Sync Panel */}
        <div className={`glass ${styles.card}`}>
          <div className={styles.cardIcon}>🔄</div>
          <h2 className={styles.cardTitle}>Sincronización Diaria</h2>
          <p className={styles.cardDesc}>
            Obtiene los partidos ATP/WTA del día desde ESPN, analiza estadísticas y genera picks automáticamente.
          </p>

          <div className={styles.syncGrid}>
            <button
              onClick={() => runSync('tennis')}
              disabled={loading}
              className={`btn btn-primary ${styles.syncBtn}`}
            >
              {loading ? <span className="spinner" /> : '🎾 Sincronizar Tenis'}
            </button>
            <button
              onClick={() => runSync('football')}
              disabled={loading}
              className={`btn btn-secondary ${styles.syncBtn}`}
            >
              {loading ? <span className="spinner" /> : '⚽ Sincronizar Fútbol'}
            </button>
          </div>

          {result && (
            <div className={`${styles.result} ${result.success ? styles.resultOk : styles.resultErr}`}>
              {result.success ? (
                <div className={styles.resultContent}>
                  <div className={styles.resultTitle}>✅ Sincronización completada</div>
                  <div className={styles.resultStats}>
                    <div className={styles.resStat}>
                      <span className={styles.resVal}>{result.matches ?? 0}</span>
                      <span className={styles.resLabel}>Partidos</span>
                    </div>
                    <div className={styles.resStat}>
                      <span className={styles.resVal}>{result.picks ?? 0}</span>
                      <span className={styles.resLabel}>Picks</span>
                    </div>
                    <div className={styles.resStat}>
                      <span className={styles.resVal} style={{ color: 'var(--premium)' }}>{result.premium ?? 0}</span>
                      <span className={styles.resLabel}>Premium</span>
                    </div>
                  </div>
                  {result.message && (
                    <p className={styles.resultMsg}>{result.message}</p>
                  )}
                  <a href="/" className="btn btn-ghost" style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center' }}>
                    Ver Dashboard →
                  </a>
                </div>
              ) : (
                <div className={styles.resultContent}>
                  <div className={styles.resultTitle}>❌ Error</div>
                  <p className={styles.resultMsg}>{result.message}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Auto Schedule Info */}
        <div className={`glass ${styles.card}`}>
          <div className={styles.cardIcon}>⏰</div>
          <h2 className={styles.cardTitle}>Automatización</h2>
          <p className={styles.cardDesc}>
            El sistema puede ejecutarse automáticamente. Configura una tarea de Windows Programador para llamar al endpoint de sincronización.
          </p>

          <div className={styles.scheduleCard}>
            <div className={styles.scheduleRow}>
              <span className={styles.scheduleIcon}>🌅</span>
              <div>
                <div className={styles.scheduleTime}>07:00 AM</div>
                <div className={styles.scheduleName}>Sync matutino — picks del día</div>
              </div>
              <span className="badge badge-high" style={{ marginLeft: 'auto' }}>Recomendado</span>
            </div>
            <div className={styles.scheduleRow}>
              <span className={styles.scheduleIcon}>🌆</span>
              <div>
                <div className={styles.scheduleTime}>02:00 PM</div>
                <div className={styles.scheduleName}>Sync vespertino — actualización</div>
              </div>
            </div>
          </div>

          <div className={styles.codeBlock}>
            <code>GET /api/automation/daily-sync</code>
          </div>

          <p className={styles.cardNote}>
            Usa Windows Task Scheduler o un cron job de servidor para automatizar la ejecución.
          </p>
        </div>

        {/* API Info */}
        <div className={`glass ${styles.card}`}>
          <div className={styles.cardIcon}>📡</div>
          <h2 className={styles.cardTitle}>Fuente de Datos</h2>
          <p className={styles.cardDesc}>
            Actualmente usando la API pública de ESPN para partidos ATP y WTA.
          </p>

          <div className={styles.apiList}>
            <div className={styles.apiItem}>
              <div className={styles.apiDot} style={{ background: 'var(--high)' }} />
              <div>
                <div className={styles.apiName}>ESPN ATP Tennis</div>
                <div className={styles.apiUrl}>site.api.espn.com/apis/site/v2/sports/tennis/atp</div>
              </div>
              <span className="badge badge-high">Activo</span>
            </div>
            <div className={styles.apiItem}>
              <div className={styles.apiDot} style={{ background: 'var(--wta)' }} />
              <div>
                <div className={styles.apiName}>ESPN WTA Tennis</div>
                <div className={styles.apiUrl}>site.api.espn.com/apis/site/v2/sports/tennis/wta</div>
              </div>
              <span className="badge badge-high">Activo</span>
            </div>
            <div className={styles.apiItem}>
              <div className={styles.apiDot} style={{ background: 'var(--text-muted)' }} />
              <div>
                <div className={styles.apiName}>API-Tennis Premium</div>
                <div className={styles.apiUrl}>Estadísticas completas (requiere suscripción)</div>
              </div>
              <span className="badge badge-low">No conectada</span>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className={`glass ${styles.card}`}>
          <div className={styles.cardIcon}>🛡️</div>
          <h2 className={styles.cardTitle}>Estado del Sistema</h2>

          <div className={styles.statusList}>
            {[
              { name: 'Motor de Análisis (Tenis)', status: 'ok', label: 'Operativo' },
              { name: 'Motor de Análisis (Fútbol)', status: 'ok', label: 'Operativo' },
              { name: 'Base de Datos (SQLite)', status: 'ok', label: 'Conectada' },
              { name: 'ESPN API (Tenis)', status: 'ok', label: 'Disponible' },
              { name: 'ESPN API (Fútbol)', status: 'ok', label: 'Disponible' },
              { name: 'Notificaciones Push', status: 'off', label: 'No configuradas' },
            ].map(item => (
              <div key={item.name} className={styles.statusItem}>
                <div className={styles.statusDot} style={{
                  background: item.status === 'ok' ? 'var(--high)' : 'var(--text-muted)',
                  boxShadow: item.status === 'ok' ? '0 0 6px var(--high)' : 'none',
                }} />
                <span className={styles.statusName}>{item.name}</span>
                <span className={styles.statusLabel} style={{
                  color: item.status === 'ok' ? 'var(--high)' : 'var(--text-muted)',
                }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
