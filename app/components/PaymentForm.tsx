'use client';

import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Stripe, StripeElements } from '@stripe/stripe-js';

interface PaymentFormProps {
  serviceName: string;
  onSuccess: (service: string) => void;
}

export default function PaymentForm({ serviceName, onSuccess }: PaymentFormProps): JSX.Element {
  const stripe: Stripe | null = useStripe();
  const elements: StripeElements | null = useElements();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'An unexpected error occurred.');
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // حفظ الجلسة في sessionStorage
      sessionStorage.setItem('unlockedService', serviceName);
      sessionStorage.setItem('usageCount', '0');
      onSuccess(serviceName);
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-md shadow-sm bg-white">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || isLoading}
        className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : 'Pay Now'}
      </button>
      {errorMessage && <div className="mt-2 text-red-600 text-sm">{errorMessage}</div>}
    </form>
  );
}
