import AdvancePreviewClient from './preview-client';
import { STATIC_ADV_ROUTE_PARAM, STATIC_MR_ROUTE_PARAM } from '@/modules/medical-reimbursement/session';

export function generateStaticParams() {
  return [{ mrId: STATIC_MR_ROUTE_PARAM, advId: STATIC_ADV_ROUTE_PARAM }];
}

export default function AdvancePreviewPage() {
  return <AdvancePreviewClient />;
}
