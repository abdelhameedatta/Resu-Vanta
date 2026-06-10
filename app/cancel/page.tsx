import React from 'react';
import Link from 'next/link';

export default function CancelPage(): JSX.Element {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '20px',
        padding: '48px 40px',
        maxWidth: '460px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        {/* X icon */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: '#1e293b',
          border: '2px solid #334155',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 34, color: '#94a3b8',
          margin: '0 auto 24px',
        }}>✕</div>

        <h1 style={{ color: '#f1f5f9', fontSize: 26, fontWeight: 800, margin: '0 0 10px' }}>
          Payment Cancelled
        </h1>

        <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 6px', lineHeight: 1.6 }}>
          No charges were made to your account.
        </p>
        <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 32px', lineHeight: 1.6 }}>
          You can go back and try again whenever you are ready.
        </p>

        <Link
          href="/"
          style={{
            display: 'block', width: '100%', padding: '14px',
            background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
            color: '#fff', textDecoration: 'none',
            borderRadius: '10px', fontWeight: 700, fontSize: 15,
            boxSizing: 'border-box',
          }}
        >
          ← Back to ResuVanta
        </Link>
      </div>
    </div>
  );
}
