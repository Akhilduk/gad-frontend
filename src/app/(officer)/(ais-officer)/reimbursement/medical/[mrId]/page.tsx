import { medicalCases } from '../data';
import MedicalCaseWorkspaceClient from './medical-case-workspace-client';

export function generateStaticParams() {
  return medicalCases.map((item) => ({
    mrId: item.mrNo,
  }));
}

export default async function MedicalCaseWorkspacePage({
  params,
}: {
  params: Promise<{ mrId: string }>;
}) {
  const { mrId } = await params;

  return <MedicalCaseWorkspaceClient mrId={mrId} />;
}
