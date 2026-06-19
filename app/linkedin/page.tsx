'use client';
import { useEffect } from 'react';

export default function LinkedInPage() {
  useEffect(() => {
    window.location.replace('/?page=linkedin');
  }, []);
  return null;
}
