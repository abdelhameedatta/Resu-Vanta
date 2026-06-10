'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function SuccessPage(): JSX.Element {
  useEffect(() => {
    const saved = sessionStorage.getItem('resuvanta_service');
    if (saved && ['optimization', 'builder', 'linkedin'].includes(saved)) {
      sessionStorage.setItem('resuvanta_payment_success', saved);
      sessionStorage.removeItem('resuvanta_service');
      window.location.href = `/?service=${saved}`;
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-green-600 mb-4">Payment Successful!</h1>
      <p className="mb-6">Your service has been unlocked. Redirecting you now…</p>
      <Link href="/" className="bg-indigo-600 text-white px-6 py-2 rounded-md">
        Go to Dashboard
      </Link>
    </div>
  );
}
