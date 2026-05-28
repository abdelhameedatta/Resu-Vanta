import React from 'react';
import Link from 'next/link';

export default function CancelPage(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-red-600 mb-4">Payment Cancelled</h1>
      <p className="mb-6">No charges were made to your account.</p>
      <Link href="/" className="bg-indigo-600 text-white px-6 py-2 rounded-md">
        Try Again
      </Link>
    </div>
  );
}
