'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  "pk_test_51Tai3cGfyR1SSFQSyOTAwdMJBLBgdqjcSPC52S9qZeA4pKrISEo0KzHDTwwufLDVMy6k3ZLDOW3ypQfF3EK5lIZw007fqc8zq1"
);

function CheckoutForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsLoading(true);
    setErrorMessage('');
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });
    if (error) {
      setErrorMessage(error.message || 'Payment failed.');
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
      <PaymentElement options={{ layout: 'tabs' }} />
      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button
          type="submit"
          disabled={!stripe || isLoading}
          style={{
            padding: '12px 24px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: 14,
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? '⏳ Processing...' : 'Pay Now'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '12px 24px',
            cursor: 'pointer',
            background: '#f1f5f9',
            color: '#334155',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          Cancel
        </button>
      </div>
      {errorMessage && (
        <p style={{ color: '#dc2626', marginTop: 10, fontWeight: 700 }}>
          {errorMessage}
        </p>
      )}
    </form>
  );
}

interface StripeWrapperProps {
  service: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StripeWrapper({
  service,
  onSuccess,
  onCancel,
}: StripeWrapperProps) {
  const [clientSecret, setClientSecret] = useState('');
  const [loadError, setLoadError] = useState('');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setLoadError(data.error || 'Failed to load payment.');
          hasFetched.current = false;
        }
      })
      .catch(() => {
        setLoadError('Failed to connect to payment service.');
        hasFetched.current = false;
      });
  }, [service]);

  if (loadError) return <p style={{ color: '#dc2626', fontWeight: 700 }}>{loadError}</p>;
  if (!clientSecret)
    return (
      <p style={{ color: '#94a3b8', marginTop: 12 }}>
        ⏳ Loading payment form...
      </p>
    );

  return (
    <div style={{
      width: '100%',
      padding: '24px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
    }}>
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#2563eb',
              colorBackground: '#ffffff',
              colorText: '#0f172a',
              colorDanger: '#dc2626',
              fontFamily: 'Inter, Arial, sans-serif',
              borderRadius: '8px',
              spacingUnit: '4px',
            },
            rules: {
              '.Input': {
                border: '1px solid #94a3b8',
                boxShadow: 'none',
                color: '#0f172a',
                backgroundColor: '#ffffff',
                fontSize: '16px',
                padding: '12px',
              },
              '.Input::placeholder': {
                color: '#475569',
              },
              '.Input:focus': {
                border: '1px solid #2563eb',
                boxShadow: '0 0 0 2px rgba(37,99,235,0.15)',
              },
              '.Label': {
                color: '#0f172a',
                fontWeight: '600',
                fontSize: '14px',
                marginBottom: '6px',
              },
            },
          },
        }}
      >
        <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} />
      </Elements>
    </div>
  );
}
