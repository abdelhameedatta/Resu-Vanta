'use client';

import { useEffect } from 'react';

export default function SuccessPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const service = params.get('service') || 'optimization';

    const timer = setTimeout(() => {
      window.location.href = `/?page=${service}&payment=success`;
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main style={{ padding: '40px' }}>
      <h1>Payment Successful ✅</h1>
      <p>Your payment has been confirmed. Redirecting you back to your service...</p>
    </main>
  );
}
