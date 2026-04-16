import { redirect } from 'next/navigation';
import { STATIC_MR_ROUTE_PARAM } from '@/modules/medical-reimbursement/session';

export function generateStaticParams() {
  return [{ mrId: STATIC_MR_ROUTE_PARAM }];
}

export default function FinalReceiptPage() {
  redirect(`/reimbursement/medical/${STATIC_MR_ROUTE_PARAM}/final/preview`);
}
