'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setActiveMrCaseId } from '../session-routing';

export default function LegacyMrRedirectClient({ mrId }: { mrId: string }) {
  const router = useRouter();

  useEffect(() => {
    setActiveMrCaseId(mrId);
    router.replace('/reimbursement/medical/workspace');
  }, [mrId, router]);

  return null;
}
