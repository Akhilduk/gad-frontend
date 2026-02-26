import MedicalCaseWorkspaceClient from './medical-case-workspace-client';

export default async function MedicalCaseWorkspacePage({ params }: { params: Promise<{ mrId: string }> }) {
  const { mrId } = await params;
  return <MedicalCaseWorkspaceClient mrId={mrId} />;
}
