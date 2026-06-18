'use client';

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useState, useEffect } from 'react';

const FULL_PRICES: Record<string, number> = {
  optimization: 7.99,
  builder: 11.99,
  linkedin: 6.99,
};

const DISCOUNT_EXPIRY = new Date('2026-07-19T23:59:59Z');

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

  const full = FULL_PRICES[service];
  const discounted = Math.round(full * 0.7 * 100) / 100;
  const finalPrice = offerActive ? discounted : full;

  return (
    <PayPalScriptProvider options={{ clientId, currency: 'USD' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>

        {offerActive && (
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: '#888', textDecoration: 'line-through', marginRight: 8 }}>
              ${full.toFixed(2)}
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#2DB34A' }}>
              ${discounted.toFixed(2)}
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
          createOrder={(_, actions) => {
            setError('');
            if (onBeforePayment) {
              try { onBeforePayment(); } catch (err: any) {
                setError(err.message || 'Please fill in all required fields.');
                return Promise.reject(err);
              }
            }
            return actions.order.create({
              purchase_units: [{ amount: { currency_code: 'USD', value: finalPrice.toFixed(2) } }],
            } as any);
          }}
          onApprove={async (_, actions) => {
            setLoading(true);
            setError('');
            try {
              const order = await actions.order!.capture();
              if (order.status === 'COMPLETED') {
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
