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
      <PaymentElement />
      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button 
          type="submit" 
          disabled={!stripe || isLoading}
          style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          {isLoading ? 'Processing...' : 'Pay Now'}
        </button>
        <button 
          type="button" 
          onClick={onCancel}
          style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '5px' }}
        >
          Cancel
        </button>
      </div>
      {errorMessage && (
        <p className="error" style={{ color: 'red', marginTop: 10 }}>
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

  if (loadError) return <p style={{ color: 'red' }}>{loadError}</p>;
  if (!clientSecret)
    return (
      <p style={{ color: '#94a3b8', marginTop: 12 }}>
        Loading payment form...
      </p>
    );

  return (
    <div style={{ minHeight: '400px', width: '100%', padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px' }}>
      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
        <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} />
      </Elements>
    </div>
  );
}
