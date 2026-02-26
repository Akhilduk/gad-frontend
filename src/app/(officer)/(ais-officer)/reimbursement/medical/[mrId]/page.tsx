import MedicalCaseWorkspaceClient from './medical-case-workspace-client';

const staticMrIds = ['[mrId]', ...Array.from({ length: 8 }, (_, index) => `mr-${index + 1}`)];

export function generateStaticParams() {
  return staticMrIds.map((mrId) => ({ mrId }));
}

export default async function MedicalCaseWorkspacePage({ params }: { params: Promise<{ mrId: string }> }) {
  const { mrId } = await params;
  return <MedicalCaseWorkspaceClient mrId={mrId} />;
}
