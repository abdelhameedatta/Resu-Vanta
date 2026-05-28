'use client';
// app/components/StripeWrapper.tsx
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from './PaymentForm';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function StripeWrapper({
  service,
  onSuccess,
  onCancel,
}: {
  service: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setClientSecret(data.clientSecret);
      })
      .catch(() => setError('Failed to connect to payment server.'))
      .finally(() => setLoading(false));
  }, [service]);

  if (loading)
    return (
      <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
        ⏳ Loading payment form...
      </div>
    );

  if (error)
    return <div style={{ color: '#f87171', padding: 16 }}>Error: {error}</div>;

  if (!clientSecret) return null;

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: 'stripe' },
      }}
    >
      <PaymentForm
        service={service}
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}
