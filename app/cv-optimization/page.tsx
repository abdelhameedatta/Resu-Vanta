'use client';
import { useEffect } from 'react';

export default function CvOptimizationPage() {
  useEffect(() => {
    window.location.replace('/?page=optimization');
  }, []);
  return null;
}
