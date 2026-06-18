'use client';

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useState, useEffect } from 'react';

const FULL_PRICES: Record<string, number> = {
  optimization: 7.99,
  builder: 11.99,
  linkedin: 6.99,
};

const DISCOUNT_EXPIRY = new Date('2026-07-19T23:59:59Z');
const DISCOUNT_RATE = 0.30;

function getDiscountedPrice(service: string): number {
  const full = FULL_PRICES[service];
  return Math.round(full * (1 - DISCOUNT_RATE) * 100) / 100;
}

interface PayPalWrapperProps {
  service: 'optimization' | 'builder' | 'linkedin';
  label?: string;
  onSuccess: () => void;
  onBeforePayment?: () => void;
}

export default function PayPalWrapper({ service, onSuccess, onBeforePayment }: PayPalWrapperProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [offerActive, setOfferActive] = useState(false);

  const clientId = 'AZEtwp8CBBrgUH8ugmWjrSTb-SKiBxIKvX5y0nMwecFn-4U6B0UtavngRh_apkPXtFXBPH4h0gfTUndR';

  useEffect(() => {
    setOfferActive(new Date() < DISCOUNT_EXPIRY);
  }, []);

  const fullPrice = FULL_PRICES[service];
  const discountedPrice = getDiscountedPrice(service);

  return (
    <PayPalScriptProvider options={{ clientId, currency: 'USD' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>

        {offerActive && (
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: '#888', textDecoration: 'line-through', marginRight: 8 }}>
              ${fullPrice.toFixed(2)}
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#2DB34A' }}>
              ${discountedPrice.toFixed(2)}
            </span>
            <span style={{ fontSize: 11, color: '#e53e3e', fontWeight: 600, marginLeft: 8, background: '#fff5f5', padding: '2px 7px', borderRadius: 6 }}>
              30% OFF
            </span>
          </div>
        )}

        {loading && (
          <p style={{ color: '#666', fontSize: 13, textAlign: 'center', margin: 0 }}>⏳ جاري معالجة الدفع...</p>
        )}

        <PayPalButtons
          style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay', height: 45 }}
          disabled={loading}
          createOrder={async () => {
            setError('');
            if (onBeforePayment) {
              try { onBeforePayment(); } catch (err: any) {
                setError(err.message || 'Please fill in all required fields.');
                throw err;
              }
            }
            const res = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ service }),
            });
            const data = await res.json();
            if (!res.ok || !data.orderId) throw new Error(data.error || 'Failed to create order');
            return data.orderId;
          }}
          onApprove={async (data, actions) => {
            setLoading(true);
            setError('');
            try {
              const res = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: data.orderID }),
              });
              const result = await res.json();
              if (result.success) {
                sessionStorage.setItem('resuvanta_payment_success', service);
                onSuccess();
              } else {
                throw new Error('Payment not completed');
              }
            } catch (err: any) {
              setError(err.message || 'Payment failed. Please try again.');
            } finally {
              setLoading(false);
            }
          }}
          onError={() => setError('حدث خطأ في الدفع. حاول مرة أخرى.')}
          onCancel={() => setError('')}
        />

        {error && (
          <p style={{ color: '#dc2626', fontSize: 13, margin: 0, fontWeight: 600 }}>⚠️ {error}</p>
        )}
      </div>
    </PayPalScriptProvider>
  );
}
