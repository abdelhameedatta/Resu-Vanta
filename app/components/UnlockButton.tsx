'use client';

import { useState } from 'react';

interface UnlockButtonProps {
  service: 'optimization' | 'builder' | 'linkedin';
  label?: string;
  onBeforeRedirect?: () => void;
}

export default function UnlockButton({
  service,
  label = 'Unlock Now',
  onBeforeRedirect,
}: UnlockButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleClick() {
    setError('');

    if (onBeforeRedirect) {
      try {
        onBeforeRedirect();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Please fill in all required fields.');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'Failed to create checkout session.');
      }

      window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          padding: '14px 28px',
          background: loading
            ? '#334155'
            : 'linear-gradient(135deg, #2563eb, #4f46e5)',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          fontWeight: 700,
          fontSize: 15,
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%',
          opacity: loading ? 0.7 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        {loading ? '⏳ Redirecting to Stripe…' : `🔒 ${label}`}
      </button>

      {error && (
        <p style={{ color: '#f87171', fontSize: 13, margin: 0, fontWeight: 600 }}>
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
