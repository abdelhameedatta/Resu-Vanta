'use client';
// app/components/PaymentForm.tsx
import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const PRICES: Record<string, string> = {
  optimization: '$7.99',
  builder: '$11.99',
  linkedin: '$6.99',
};

export default function PaymentForm({
  service,
  clientSecret,
  onSuccess,
  onCancel,
}: {
  service: string;
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Payment failed');
      setLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess();
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a, #1d4ed8)',
      borderRadius: 18,
      padding: 24,
      marginTop: 16,
    }}>
      <h3 style={{ color: '#fff', marginBottom: 8, marginTop: 0 }}>
        Complete Payment — {PRICES[service]}
      </h3>
      <p style={{ color: '#dbeafe', fontSize: 13, marginBottom: 16 }}>
        Secure payment powered by Stripe
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}>
          <PaymentElement />
        </div>

        {error && (
          <p style={{ color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="submit"
            disabled={loading || !stripe}
            style={{
              flex: 1,
              background: loading ? '#475569' : '#22c55e',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 20px',
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Processing...' : `Pay ${PRICES[service]}`}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              background: 'transparent',
              color: '#dbeafe',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 10,
              padding: '12px 20px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
