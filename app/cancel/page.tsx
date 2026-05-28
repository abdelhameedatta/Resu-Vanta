'use client';

import { useEffect, useState } from 'react';

export default function CancelPage() {
  const [service, setService] = useState('optimization');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selectedService = params.get('service') || 'optimization';
    setService(selectedService);
  }, []);

  return (
    <main style={{ padding: '40px' }}>
      <h1>Payment Cancelled</h1>
      <p>Your payment was not completed. Your entered details are still saved in this browser session.</p>
      <a href={`/?page=${service}`}>Back to your service</a>
    </main>
  );
}
