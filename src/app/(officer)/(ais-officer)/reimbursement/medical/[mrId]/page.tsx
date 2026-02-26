import LegacyMrRedirectClient from './legacy-redirect-client';

const staticMrIds = ['mr-1', 'mr-2', 'mr-3', 'mr-4', 'mr-5', 'mr-6', 'mr-7', 'mr-8', '[mrId]', '%5BmrId%5D'];

export function generateStaticParams() {
  return staticMrIds.map((mrId) => ({ mrId }));
}

export default async function LegacyMedicalCaseWorkspacePage({ params }: { params: Promise<{ mrId: string }> }) {
  const { mrId } = await params;
  return <LegacyMrRedirectClient mrId={mrId} />;
}
