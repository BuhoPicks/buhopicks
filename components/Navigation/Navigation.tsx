'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import styles from './Navigation.module.css';

const navItems = [
  { href: '/',            icon: '🏠', label: 'Home', title: 'Inicio' },
  { href: '/tennis',      icon: '🎾', label: 'Tenis', title: 'Picks de Tenis' },
  { href: '/football',    icon: '⚽', label: 'Fútbol', title: 'Fútbol' },
  { href: '/basketball',  icon: '🏀', label: 'NBA', title: 'Básquetbol' },
  { href: '/baseball',    icon: '⚾', label: 'MLB', title: 'Béisbol' },
  { href: '/history',     icon: '📋', label: 'Historial',  title: 'Historial de Picks' },
  { href: '/performance', icon: '📈', label: 'Rendimiento', title: 'Estadísticas' },
];

const HIDDEN_PATHS = ['/login', '/register', '/pricing'];

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Hide navigation on auth/pricing pages
  if (HIDDEN_PATHS.some(p => pathname.startsWith(p))) {
    return null;
  }

  const user = session?.user as any;
  const isAdmin = user?.role === 'ADMIN';

  const allItems = isAdmin
    ? [...navItems, { href: '/admin', icon: '⚙️', label: 'Admin', title: 'Panel de Control' }]
    : navItems;

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
          {allItems.map(item => {
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
          {user && (
            <Link href="/account" className={styles.userCard}>
              <div className={styles.userAvatar}>
                {(user.name || user.email || '?')[0].toUpperCase()}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.name || 'Usuario'}</span>
                <span className={styles.userPlan}>
                  {user.subscriptionPlan === 'FREE' ? 'Sin plan' : user.subscriptionPlan}
                </span>
              </div>
            </Link>
          )}
          <div className={styles.footerCard}>
            <span className={styles.footerDot} />
            <span className={styles.footerText}>Datos ATP/WTA en vivo</span>
          </div>
          <p className={styles.footerCopy}>© 2026 Búho Picks</p>
        </div>
      </nav>

      {/* ── Mobile Bottom Bar ── */}
      <nav className={styles.mobileBar}>
        {allItems.slice(0, 5).map(item => {
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
        <Link
          href="/account"
          className={`${styles.mobileItem} ${pathname === '/account' ? styles.mobileItemActive : ''}`}
        >
          <span className={styles.mobileIcon}>👤</span>
          <span className={styles.mobileLabel}>Cuenta</span>
        </Link>
      </nav>
    </>
  );
}
