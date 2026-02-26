'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setActiveAdvanceId, setActiveMrCaseId } from '../../../../../session-routing';

export default function LegacyAdvancePreviewRedirectPage({ params }: { params: { mrId: string; advId: string } }) {
  const router = useRouter();

  useEffect(() => {
    setActiveMrCaseId(params.mrId);
    setActiveAdvanceId(params.advId);
    router.replace('/reimbursement/medical/advance-preview');
  }, [params.advId, params.mrId, router]);

  return null;
}
