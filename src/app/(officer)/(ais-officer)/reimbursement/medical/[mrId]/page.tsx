import MRCaseWorkspaceClient from './workspace-client';
import { STATIC_MR_ROUTE_PARAM } from '@/modules/medical-reimbursement/session';

export function generateStaticParams() {
  return [{ mrId: STATIC_MR_ROUTE_PARAM }];
}

export default function MRCaseWorkspacePage() {
  return <MRCaseWorkspaceClient />;
}
