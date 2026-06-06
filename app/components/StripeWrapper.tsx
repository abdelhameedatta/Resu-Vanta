'use client';
import React, { useState, useEffect } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
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
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button type="submit" disabled={!stripe || isLoading}>
          {isLoading ? '⏳ Processing...' : 'Pay Now'}
        </button>
        <button type="button" className="secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
      {errorMessage && (
        <p className="error" style={{ marginTop: 10 }}>
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

  useEffect(() => {
    fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else setLoadError(data.error || 'Failed to load payment.');
      })
      .catch(() => setLoadError('Failed to connect to payment service.'));
  }, [service]);

  if (loadError) return <p className="error">{loadError}</p>;
  if (!clientSecret)
    return (
      <p style={{ color: '#94a3b8', marginTop: 12 }}>
        ⏳ Loading payment form...
      </p>
    );

  console.log("StripeWrapper Data:", clientSecret);
  
  return (
  <div style={{ minHeight: '400px', width: '100%', border: '2px solid red' }}>
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  </div>
);
