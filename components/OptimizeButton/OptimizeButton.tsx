'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OptimizeButton({ label, sport }: { label: string, sport: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleOptimize = async () => {
    setLoading(true);
    // Simulate complex optimization algorithm logic
    await new Promise(r => setTimeout(r, 1500));
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      onClick={handleOptimize}
      disabled={loading}
      style={{
        padding: '10px 20px',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '1rem',
        opacity: loading ? 0.7 : 1
      }}
    >
      {loading ? (
        <>
          <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>🔄</span>
          Optimizando...
        </>
      ) : (
        <>
          <span>⚡</span>
          {label}
        </>
      )}
    </button>
  );
}
