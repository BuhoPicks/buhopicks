'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navigation.module.css';

const navItems = [
  { href: '/',            icon: '🏠', label: 'Home', title: 'Inicio' },
  { href: '/tennis',      icon: '🎾', label: 'Tenis', title: 'Picks de Tenis' },
  { href: '/football',    icon: '⚽', label: 'Fútbol', title: 'Fútbol' },
  { href: '/basketball',  icon: '🏀', label: 'NBA', title: 'Básquetbol' },
  { href: '/baseball',    icon: '⚾', label: 'MLB', title: 'Béisbol' },
  { href: '/history',     icon: '📋', label: 'Historial',  title: 'Historial de Picks' },
  { href: '/performance', icon: '📈', label: 'Rendimiento', title: 'Estadísticas' },
  { href: '/admin',       icon: '⚙️',  label: 'Admin',      title: 'Panel de Control' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <nav className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoImageWrap}>
            <img src="/logo.png" alt="Betting Man Logo" className={styles.logoImg} />
          </div>
          <div>
            <span className={`text-gradient ${styles.logoName}`}>Búho Picks</span>
            <span className={styles.logoSub} style={{ letterSpacing: '0.2em', color: 'var(--premium)', fontWeight: 800 }}>GRUPO VIP</span>
          </div>
        </div>

        <div className={styles.divider} />

        <ul className={styles.navList}>
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                  title={item.title}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                  {active && <span className={styles.activeIndicator} />}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className={styles.sidebarFooter}>
          <div className={styles.footerCard}>
            <span className={styles.footerDot} />
            <span className={styles.footerText}>Datos ATP/WTA en vivo</span>
          </div>
          <p className={styles.footerCopy}>© 2026 Búho Picks</p>
        </div>
      </nav>

      {/* ── Mobile Bottom Bar ── */}
      <nav className={styles.mobileBar}>
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.mobileItem} ${active ? styles.mobileItemActive : ''}`}
            >
              <span className={styles.mobileIcon}>{item.icon}</span>
              <span className={styles.mobileLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
