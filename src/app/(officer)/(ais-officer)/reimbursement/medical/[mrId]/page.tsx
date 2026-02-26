import MedicalCaseWorkspaceClient from './medical-case-workspace-client';

const staticMrIds = Array.from({ length: 8 }, (_, index) => ({ mrId: `mr-${index + 1}` }));

export function generateStaticParams() {
  return staticMrIds;
}

export default async function MedicalCaseWorkspacePage({ params }: { params: Promise<{ mrId: string }> }) {
  const { mrId } = await params;
  return <MedicalCaseWorkspaceClient mrId={mrId} />;
}
