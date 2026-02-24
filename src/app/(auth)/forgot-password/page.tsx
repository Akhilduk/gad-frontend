// ───────────────────────────────────────────────────────────────────────────────
// app/(auth)/forgot-password/page.tsx
// ───────────────────────────────────────────────────────────────────────────────
'use client';

import { useState } from 'react';
import ForgotPassword from './ForgotPassword';
import { useRouter } from 'next/navigation';
/**
 * Note: Because Next’s “app” folder expects `page.tsx` to be a standalone component
 * that takes zero custom props, we keep this wrapper simple. User can move between
 * steps ("request" → "verify" → "reset" → "done"), and clicking "Back to Login"
 * pushes them back to /auth/login (for instance).
 */
export default function Page() {
  const [step, setStep] = useState<'request' | 'verify' | 'reset' | 'done'>('request');
  const router = useRouter(); // ✅ use client router
  const handleStepChange = (newStep: 'request' | 'verify' | 'reset' | 'done') => {
    setStep(newStep);
  };

  const handleBackToLogin = () => {
     router.push('/'); // ✅ client-side navigation
  };


  return (
    <div className="max-w-md mx-auto py-8">
      <ForgotPassword
        step={step}
        onStepChange={handleStepChange}
        onBackToLogin={handleBackToLogin}
      />
    </div>
  );
}
