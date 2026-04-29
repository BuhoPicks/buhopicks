'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './register.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al crear la cuenta');
        return;
      }

      // Auto-login after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push('/pricing');
        router.refresh();
      }
    } catch {
      setError('Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.registerPage}>
      <div className={styles.bgOverlay} />
      <div className={styles.formContainer}>
        <div className={styles.formCard}>
          <div className={styles.logoSection}>
            <div className={styles.logoWrap}>
              <img src="/logo.png" alt="Búho Picks" className={styles.logoImg} />
            </div>
            <h1 className={styles.title}>
              <span className={styles.titleGradient}>Crear Cuenta</span>
            </h1>
            <p className={styles.description}>Únete al grupo VIP de picks deportivos</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.errorBox}>
                <span>⚠️</span> {error}
              </div>
            )}

            <div className={styles.inputGroup}>
              <label htmlFor="name" className={styles.label}>Nombre completo</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="reg-email" className={styles.label}>Email</label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="reg-password" className={styles.label}>Contraseña</label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={styles.input}
                required
                minLength={6}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="reg-confirm" className={styles.label}>Confirmar contraseña</label>
              <input
                id="reg-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className={styles.input}
                required
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : 'Crear Cuenta'}
            </button>
          </form>

          <div className={styles.footer}>
            <p>¿Ya tienes cuenta?{' '}
              <Link href="/login" className={styles.link}>Inicia sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
