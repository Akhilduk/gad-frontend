import FinalPreviewClient from './preview-client';
import { STATIC_MR_ROUTE_PARAM } from '@/modules/medical-reimbursement/session';

export function generateStaticParams() {
  return [{ mrId: STATIC_MR_ROUTE_PARAM }];
}

export default function FinalPreviewPage() {
  return <FinalPreviewClient />;
}
