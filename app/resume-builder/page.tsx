'use client';
import { useEffect } from 'react';

export default function ResumeBuilderPage() {
  useEffect(() => {
    window.location.replace('/?page=builder');
  }, []);
  return null;
}
