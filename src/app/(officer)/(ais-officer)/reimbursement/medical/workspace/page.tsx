import MedicalCaseWorkspaceClient from '../medical-case-workspace-client';

export default async function MedicalCaseWorkspacePage({ searchParams }: { searchParams: Promise<{ mrId?: string }> }) {
  const { mrId = '' } = await searchParams;
  return <MedicalCaseWorkspaceClient mrId={mrId} />;
}
