'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { BanknotesIcon, CheckBadgeIcon, ChevronLeftIcon, CloudArrowUpIcon, DocumentArrowDownIcon, PencilSquareIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import type { BillItem, LocalMedicalCase, OtherDocumentItem } from '../storage';
import { getMedicalCase, loadMedicalCases, upsertMedicalCase } from '../storage';
import { ChapterCard, DeclarationBlock, StatusStamp } from '../_components/case-book-ui';

type Props = { mrId: string };
const ACTIVE_MR_STORAGE_KEY = 'medical_reimbursement_active_mr';

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function MedicalCaseWorkspaceClient({ mrId }: Props) {
  const router = useRouter();
  const billInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const [caseData, setCaseData] = useState<LocalMedicalCase | null>(null);
  const [toast, setToast] = useState('');
  const [docTab, setDocTab] = useState<'bills' | 'docs'>('bills');
  const [editTreatment, setEditTreatment] = useState(false);
  const [declaration, setDeclaration] = useState(false);

  useEffect(() => {
    const active = typeof window !== 'undefined' ? sessionStorage.getItem(ACTIVE_MR_STORAGE_KEY) : null;
    const resolvedId = mrId === 'case' ? active || 'case' : mrId;
    const item = resolvedId === 'case' ? loadMedicalCases()[0] || null : getMedicalCase(resolvedId);
    setCaseData(item);
    if (item) sessionStorage.setItem(ACTIVE_MR_STORAGE_KEY, item.mrNo);
  }, [mrId]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!caseData) {
    return (
      <main className="space-y-4">
        <Link href="/reimbursement/medical" className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
          <ChevronLeftIcon className="h-4 w-4" />
          Back to Cases
        </Link>
      </main>
    );
  }

  const persist = (next: LocalMedicalCase, message = 'Draft saved') => {
    const merged = { ...next, updatedOn: new Date().toISOString() };
    upsertMedicalCase(merged);
    setCaseData(merged);
    setToast(message);
  };

  const totals = {
    bills: caseData.bills.reduce((sum, bill) => sum + Number(bill.extracted.amount || 0), 0),
    advances: caseData.advances.reduce((sum, adv) => sum + Number(adv.amount || 0), 0),
  };
  const net = Math.max(totals.bills - totals.advances, 0);

  const readiness = {
    bills: caseData.bills.length > 0,
    ec: caseData.otherDocuments.some((doc) => doc.title.toLowerCase().includes('essentiality')),
    discharge: caseData.otherDocuments.some((doc) => doc.title.toLowerCase().includes('discharge')),
    treatment: Boolean(caseData.treatment.hospitalName && caseData.treatment.placeOfIllness && caseData.treatment.fromDate),
  };

  const canFinal = readiness.bills && readiness.ec && readiness.discharge && readiness.treatment;

  const updateTreatment = (key: keyof LocalMedicalCase['treatment'], value: string) => {
    persist({ ...caseData, treatment: { ...caseData.treatment, [key]: value } }, 'Treatment updated');
  };

  const uploadBills = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const additions: BillItem[] = [];
    for (const file of files) {
      additions.push({
        id: `bill-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        previewUrl: await readAsDataUrl(file),
        extracted: {
          invoiceNo: `INV-${Math.floor(Math.random() * 90000 + 10000)}`,
          invoiceDate: new Date().toISOString().slice(0, 10),
          amount: 0,
          hospital: caseData.treatment.hospitalName || 'Hospital',
          description: `OCR extracted from ${file.name}`,
        },
        ocrConfidence: 0.82,
      });
    }
    persist({ ...caseData, bills: [...caseData.bills, ...additions] }, 'Bill added and totals updated');
    event.target.value = '';
  };

  const uploadDocs = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const additions: OtherDocumentItem[] = [];
    for (const file of files) {
      additions.push({
        id: `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: file.name.toLowerCase().includes('essentiality') ? 'Essentiality Certificate' : file.name.toLowerCase().includes('discharge') ? 'Discharge Summary' : 'Supporting Document',
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        previewUrl: await readAsDataUrl(file),
      });
    }
    persist({ ...caseData, otherDocuments: [...caseData.otherDocuments, ...additions] }, 'Document uploaded');
    event.target.value = '';
  };

  return (
    <main className="space-y-4">
      <section className="rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900 p-4 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-indigo-100">Case Cover</p>
            <h1 className="font-mono text-xl font-semibold">{caseData.mrNo}</h1>
            <p className="text-sm text-indigo-100">{caseData.treatment.patientName || caseData.claimant.name} | {caseData.treatment.hospitalName || 'Hospital not set'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusStamp text={caseData.status} />
            <div className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-xs">Bills Rs {totals.bills.toLocaleString('en-IN')} | Advance Rs {totals.advances.toLocaleString('en-IN')} | Balance Rs {net.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => billInputRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-3 text-sm font-semibold text-white"><CloudArrowUpIcon className="h-4 w-4" />Add Bill/Doc</button>
          <button onClick={() => router.push('/reimbursement/medical/case/advance/new')} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-3 text-sm font-semibold text-white"><BanknotesIcon className="h-4 w-4" />Request Advance</button>
          <button onClick={() => canFinal && router.push('/reimbursement/medical/case/final/review')} disabled={!canFinal} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><ShieldCheckIcon className="h-4 w-4" />Submit Final Claim</button>
          <button onClick={() => window.print()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-3 text-sm font-semibold text-white"><DocumentArrowDownIcon className="h-4 w-4" />Download Preview</button>
        </div>
      </section>

      <ChapterCard chapter="Chapter 1" title="Member & Posting">
        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <p><span className="font-medium">Name:</span> {caseData.claimant.name}</p>
          <p><span className="font-medium">PEN:</span> {caseData.claimant.pen}</p>
          <p><span className="font-medium">Service:</span> {caseData.treatment.serviceType || 'IAS'}</p>
          <p><span className="font-medium">Cadre:</span> {caseData.claimant.cadre || 'Kerala'}</p>
          <p><span className="font-medium">Role:</span> {caseData.claimant.currentRole || 'Joint Director'}</p>
          <p><span className="font-medium">Grade/Scale:</span> {caseData.claimant.grade || 'Selection Grade'} / {caseData.claimant.scale || 'Level 12'}</p>
        </div>
      </ChapterCard>

      <ChapterCard chapter="Chapter 2" title="Treatment Snapshot" actions={<button onClick={() => setEditTreatment((prev) => !prev)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-100"><PencilSquareIcon className="h-4 w-4" />{editTreatment ? 'Close Edit' : 'Edit'}</button>}>
        {editTreatment ? (
          <div className="grid gap-2 md:grid-cols-2">
            <input value={caseData.treatment.hospitalName} onChange={(event) => updateTreatment('hospitalName', event.target.value)} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="Hospital name" />
            <input value={caseData.treatment.placeOfIllness} onChange={(event) => updateTreatment('placeOfIllness', event.target.value)} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="Place of illness" />
            <input type="date" value={caseData.treatment.fromDate} onChange={(event) => updateTreatment('fromDate', event.target.value)} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
            <input type="date" value={caseData.treatment.toDate} onChange={(event) => updateTreatment('toDate', event.target.value)} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
            <textarea value={caseData.treatment.diagnosis} onChange={(event) => updateTreatment('diagnosis', event.target.value)} rows={2} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 md:col-span-2" placeholder="Diagnosis / treatment notes" />
          </div>
        ) : (
          <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <p><span className="font-medium">Hospital:</span> {caseData.treatment.hospitalName || '-'}</p>
            <p><span className="font-medium">Place:</span> {caseData.treatment.placeOfIllness || '-'}</p>
            <p><span className="font-medium">Period:</span> {caseData.treatment.fromDate || '-'} to {caseData.treatment.toDate || '-'}</p>
            <p className="sm:col-span-2 lg:col-span-3"><span className="font-medium">Diagnosis:</span> {caseData.treatment.diagnosis || '-'}</p>
          </div>
        )}
      </ChapterCard>

      <ChapterCard chapter="Chapter 3" title="Annexures Board">
        <div className="mb-2 flex gap-2">
          <button onClick={() => setDocTab('bills')} className={`h-9 rounded-lg border px-3 text-sm font-semibold ${docTab === 'bills' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300' : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-100'}`}>Bills (OCR)</button>
          <button onClick={() => setDocTab('docs')} className={`h-9 rounded-lg border px-3 text-sm font-semibold ${docTab === 'docs' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300' : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-100'}`}>Other Docs</button>
        </div>
        {docTab === 'bills' ? (
          <div className="space-y-2">
            <button onClick={() => billInputRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-indigo-400 bg-indigo-50 px-3 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"><CloudArrowUpIcon className="h-4 w-4" />Upload Bill</button>
            <input ref={billInputRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={uploadBills} />
            {caseData.bills.length ? caseData.bills.map((bill) => (
              <article key={bill.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="font-medium text-slate-900 dark:text-slate-100">{bill.fileName}</p>
                <p className="text-xs text-slate-500">Invoice: {bill.extracted.invoiceNo} | Date: {bill.extracted.invoiceDate} | Amount: Rs {Number(bill.extracted.amount || 0).toLocaleString('en-IN')}</p>
              </article>
            )) : <p className="text-sm text-slate-500">No bills uploaded.</p>}
          </div>
        ) : (
          <div className="space-y-2">
            <button onClick={() => docInputRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-indigo-400 bg-indigo-50 px-3 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"><CloudArrowUpIcon className="h-4 w-4" />Upload Document</button>
            <input ref={docInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={uploadDocs} />
            {caseData.otherDocuments.length ? caseData.otherDocuments.map((doc) => (
              <article key={doc.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="font-medium text-slate-900 dark:text-slate-100">{doc.title}</p>
                <p className="text-xs text-slate-500">{doc.fileName}</p>
              </article>
            )) : <p className="text-sm text-slate-500">No documents uploaded.</p>}
          </div>
        )}
      </ChapterCard>

      <ChapterCard chapter="Chapter 4" title="Final Claim Note">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Bills uploaded', readiness.bills],
            ['Essentiality uploaded', readiness.ec],
            ['Discharge summary uploaded', readiness.discharge],
            ['Treatment details present', readiness.treatment],
          ].map(([label, ok]) => (
            <div key={String(label)} className={`rounded-xl border p-3 text-sm ${ok ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'}`}>
              {label}
            </div>
          ))}
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <p className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900">Total bills: Rs {totals.bills.toLocaleString('en-IN')}</p>
          <p className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900">Total advance: Rs {totals.advances.toLocaleString('en-IN')}</p>
          <p className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900">Net claim: Rs {net.toLocaleString('en-IN')}</p>
        </div>
        <DeclarationBlock checked={declaration} onChange={setDeclaration} text="I hereby declare the details are true and reimbursement has not been claimed from any other source." />
      </ChapterCard>

      <section className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/reimbursement/medical" className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
          <ChevronLeftIcon className="h-4 w-4" />
          Back to Cases
        </Link>
        <div className="flex gap-2">
          <button onClick={() => persist(caseData, 'Draft saved')} className="inline-flex h-10 items-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">Save Draft</button>
          <button onClick={() => canFinal && router.push('/reimbursement/medical/case/final/review')} disabled={!canFinal} className="inline-flex h-10 items-center gap-2 rounded-xl border border-indigo-500 bg-gradient-to-r from-indigo-700 to-indigo-500 px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
            <CheckBadgeIcon className="h-4 w-4" />
            Open Final Review
          </button>
        </div>
      </section>

      {toast && <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 shadow-lg dark:bg-indigo-500/15 dark:text-indigo-300">{toast}</div>}
    </main>
  );
}
