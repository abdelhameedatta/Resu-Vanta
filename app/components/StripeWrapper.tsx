'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
      confirmParams: {
        payment_method_data: {
          billing_details: {
            name: 'ResuVanta Customer',
          },
        },
      },
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
      <PaymentElement
        options={{
          layout: 'tabs',
          fields: {
            billingDetails: 'never',
          },
        }}
      />
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

  const elementsOptions = useMemo(() => ({
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#2563eb',
        colorBackground: '#ffffff',
        colorText: '#0f172a',
        colorTextPlaceholder: '#334155',
        colorDanger: '#dc2626',
        fontFamily: 'Inter, Arial, sans-serif',
        borderRadius: '8px',
      },
      rules: {
        '.Input': {
          border: '1.5px solid #94a3b8',
          color: '#0f172a',
          backgroundColor: '#ffffff',
          fontSize: '15px',
          padding: '12px',
          boxShadow: 'none',
        },
        '.Input:focus': {
          border: '1.5px solid #2563eb',
          boxShadow: '0 0 0 2px rgba(37,99,235,0.15)',
        },
        '.Label': {
          color: '#0f172a',
          fontWeight: '700',
          fontSize: '14px',
        },
      },
    },
  }), [clientSecret]);

  if (loadError) return <p style={{ color: '#dc2626', fontWeight: 700 }}>{loadError}</p>;
  if (!clientSecret)
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
        ⏳ Loading payment form...
      </div>
    );

  return (
    <div style={{
      width: '100%',
      padding: '24px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
    }}>
      <Elements stripe={stripePromise} options={elementsOptions}>
        <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} />
      </Elements>
    </div>
  );
}
