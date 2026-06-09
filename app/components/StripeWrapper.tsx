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
  onSuccessRef,
  onCancelRef,
}: {
  onSuccessRef: React.MutableRefObject<() => void>;
  onCancelRef: React.MutableRefObject<() => void>;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');

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
            name,
            email,
            address: { country },
          },
        },
      },
    });
    if (error) {
      setErrorMessage(error.message || 'Payment failed.');
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccessRef.current();
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1.5px solid #334155',
    background: '#1e293b',
    color: '#f1f5f9',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    marginTop: '4px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 700,
    color: '#94a3b8',
    marginBottom: '2px',
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 8 }}>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Full Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="John Smith"
          required
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="name@email.com"
          required
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Country (2-letter code)</label>
        <input
          type="text"
          value={country}
          onChange={e => setCountry(e.target.value.toUpperCase())}
          placeholder="US"
          required
          maxLength={2}
          style={inputStyle}
        />
      </div>

      <PaymentElement
        options={{
          layout: {
            type: 'accordion',
            defaultCollapsed: false,
            spacedAccordionItems: true,
          },
        }}
      />

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button
          type="submit"
          disabled={!stripe || isLoading}
          style={{
            flex: 1,
            padding: '13px 16px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: 15,
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? '⏳ Processing...' : 'Pay Now'}
        </button>
        <button
          type="button"
          onClick={() => onCancelRef.current()}
          style={{
            flex: 1,
            padding: '13px 16px',
            cursor: 'pointer',
            background: '#1e293b',
            color: '#cbd5e1',
            border: '1px solid #334155',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          Cancel
        </button>
      </div>

      {errorMessage && (
        <p style={{ color: '#f87171', marginTop: 10, fontWeight: 700, fontSize: 13 }}>
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

const StripeWrapper = React.memo(function StripeWrapper({
  service,
  onSuccess,
  onCancel,
}: StripeWrapperProps) {
  const [clientSecret, setClientSecret] = useState('');
  const [loadError, setLoadError] = useState('');
  const hasFetched = useRef(false);

  const onSuccessRef = useRef(onSuccess);
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onCancelRef.current = onCancel;
  }, [onSuccess, onCancel]);

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
      theme: 'night' as const,
      variables: {
        colorPrimary: '#2563eb',
        colorBackground: '#1e293b',
        colorText: '#f1f5f9',
        colorTextPlaceholder: '#64748b',
        colorDanger: '#f87171',
        fontFamily: 'Inter, Arial, sans-serif',
        borderRadius: '8px',
        spacingUnit: '4px',
      },
      rules: {
        '.Input': {
          border: '1.5px solid #334155',
          color: '#f1f5f9',
          backgroundColor: '#0f172a',
          fontSize: '15px',
          padding: '11px 12px',
        },
        '.Input:focus': {
          border: '1.5px solid #2563eb',
          boxShadow: '0 0 0 2px rgba(37,99,235,0.2)',
        },
        '.Label': {
          color: '#94a3b8',
          fontWeight: '600',
          fontSize: '13px',
        },
        '.Tab': {
          border: '1px solid #334155',
          backgroundColor: '#1e293b',
          color: '#94a3b8',
        },
        '.Tab--selected': {
          border: '1.5px solid #2563eb',
          backgroundColor: '#0f172a',
          color: '#f1f5f9',
        },
        '.AccordionItem': {
          border: '1px solid #334155',
          backgroundColor: '#1e293b',
        },
      },
    },
  }), [clientSecret]);

  if (loadError) return <p style={{ color: '#f87171', fontWeight: 700 }}>{loadError}</p>;
  if (!clientSecret)
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
        ⏳ Loading payment form...
      </div>
    );

  return (
    <div style={{
      width: '100%',
      padding: '20px 16px',
      backgroundColor: '#0f172a',
      borderRadius: '12px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      border: '1px solid #1e293b',
      boxSizing: 'border-box',
      overflow: 'visible',
    }}>
      <Elements stripe={stripePromise} options={elementsOptions}>
        <CheckoutForm onSuccessRef={onSuccessRef} onCancelRef={onCancelRef} />
      </Elements>
    </div>
  );
}, (prev, next) => prev.service === next.service);

export default StripeWrapper;
