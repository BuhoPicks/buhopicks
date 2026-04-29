'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email o contraseña incorrectos');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.bgOverlay} />
      <div className={styles.formContainer}>
        <div className={styles.formCard}>
          <div className={styles.logoSection}>
            <div className={styles.logoWrap}>
              <img src="/logo.png" alt="Búho Picks" className={styles.logoImg} />
            </div>
            <h1 className={styles.title}>
              <span className={styles.titleGradient}>Búho Picks</span>
            </h1>
            <p className={styles.subtitle}>GRUPO VIP</p>
            <p className={styles.description}>Acceso exclusivo a picks deportivos premium</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.errorBox}>
                <span>⚠️</span> {error}
              </div>
            )}

            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className={styles.input}
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={styles.input}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <p>¿No tienes cuenta?{' '}
              <Link href="/register" className={styles.link}>Regístrate aquí</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
