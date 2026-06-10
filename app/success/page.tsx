'use client';

import React, { useEffect, useState } from 'react';

const VALID_SERVICES = ['optimization', 'builder', 'linkedin'] as const;
type Service = typeof VALID_SERVICES[number];

const SERVICE_LABEL: Record<Service, string> = {
  optimization: 'CV Optimization',
  builder:      'CV Builder + Optimization',
  linkedin:     'LinkedIn Optimization',
};

const SERVICE_FEATURES: Record<Service, string[]> = {
  optimization: ['Full ATS keyword report', 'Rewritten professional summary', 'Skills gap analysis', 'Downloadable PDF CV'],
  builder:      ['AI-generated CV from scratch', 'ATS-optimised structure', 'Smart skills suggestions', 'Downloadable PDF CV'],
  linkedin:     ['Professional headline', 'Full About section rewrite', 'Skills & recruiter keywords', 'Profile visibility tips'],
};

export default function SuccessPage(): JSX.Element {
  const [service, setService] = useState<Service | null>(null);
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    const raw = sessionStorage.getItem('resuvanta_service');
    const svc = VALID_SERVICES.includes(raw as Service) ? (raw as Service) : null;
    setService(svc);
    if (svc) {
      sessionStorage.setItem('resuvanta_payment_success', svc);
      sessionStorage.removeItem('resuvanta_service');
    }
  }, []);

  useEffect(() => {
    const dest = service ? `/?service=${service}` : '/';
    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.href = dest;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [service]);

  const dest = service ? `/?service=${service}` : '/';
  const features = service ? SERVICE_FEATURES[service] : [];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
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
        maxWidth: '520px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        {/* checkmark */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 38, color: '#fff', fontWeight: 800,
          margin: '0 auto 24px',
          boxShadow: '0 0 32px rgba(16,185,129,0.35)',
        }}>✓</div>

        <h1 style={{ color: '#f1f5f9', fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>
          Payment Confirmed!
        </h1>

        <p style={{ color: '#10b981', fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>
          {service ? `${SERVICE_LABEL[service]} — Unlocked` : 'Your service is now active'}
        </p>

        <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 28px', lineHeight: 1.6 }}>
          A receipt has been sent to your email by Stripe.
        </p>

        {features.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', textAlign: 'left' }}>
            {features.map(f => (
              <li key={f} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 0', borderBottom: '1px solid #1e293b',
                color: '#cbd5e1', fontSize: 14,
              }}>
                <span style={{ color: '#10b981', fontWeight: 700, flexShrink: 0 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>
        )}

        <a
          href={dest}
          style={{
            display: 'block', width: '100%', padding: '14px',
            background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
            color: '#fff', textDecoration: 'none',
            borderRadius: '10px', fontWeight: 700, fontSize: 15,
            marginBottom: 14, boxSizing: 'border-box',
          }}
        >
          {service ? `Launch ${SERVICE_LABEL[service]} →` : 'Go to Dashboard →'}
        </a>

        <p style={{ color: '#475569', fontSize: 12, margin: 0 }}>
          Redirecting automatically in {seconds} second{seconds !== 1 ? 's' : ''}…
        </p>
      </div>
    </div>
  );
}
