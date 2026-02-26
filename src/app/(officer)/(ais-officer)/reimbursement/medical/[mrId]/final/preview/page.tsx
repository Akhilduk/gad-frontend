'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setActiveMrCaseId } from '../../../../session-routing';

export default function LegacyFinalPreviewRedirectPage({ params }: { params: { mrId: string } }) {
  const router = useRouter();

  useEffect(() => {
    setActiveMrCaseId(params.mrId);
    router.replace('/reimbursement/medical/final-preview');
  }, [params.mrId, router]);

  return null;
}
