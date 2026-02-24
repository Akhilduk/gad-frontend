'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircleIcon,
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  PaperClipIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { statusClasses, type CaseStatus } from '../data';

const sectionNav = ['Claim Overview', 'Treatment Details', 'Bills & Docs', 'Advances', 'Final Submission'];

type MedicalCaseWorkspaceClientProps = {
  mrId: string;
};

export default function MedicalCaseWorkspaceClient({ mrId }: MedicalCaseWorkspaceClientProps) {
  const [status, setStatus] = useState<CaseStatus>('Advance Paid');
  const [hospitalised, setHospitalised] = useState<'Yes' | 'No'>('Yes');
  const [advanceModal, setAdvanceModal] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [goModal, setGoModal] = useState(false);
  const [goFile, setGoFile] = useState('');
  const [saveState, setSaveState] = useState('Save Draft');
  const [advances, setAdvances] = useState([
    { id: 1, date: 'Requested on 10 Feb', amount: '₹15,000', status: 'Submitted', doc: 'Estimate.pdf' },
    { id: 2, date: 'Requested on 12 Feb', amount: '₹10,000', status: 'Paid', doc: 'Advice.pdf' },
  ]);

  const paidAdvance = useMemo(() => (advances.some((item) => item.status === 'Paid') ? 10000 : 0), [advances]);
  const totalBills = 22500;
  const eligibleTotal = 20000;
  const balanceClaim = eligibleTotal - paidAdvance;

  const saveDraft = () => {
    setSaveState('Saved!');
    setTimeout(() => setSaveState('Save Draft'), 1200);
  };

  const onSubmitAdvance = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAdvances((prev) => [
      {
        id: Date.now(),
        date: `Requested on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
        amount: '₹20,000',
        status: 'Submitted',
        doc: 'Hospital-Estimate.pdf',
      },
      ...prev,
    ]);
    setAdvanceModal(false);
  };

  return (
    <div className="space-y-6 animate-[fadeIn_300ms_ease]">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Medical Case File</p>
            <h1 className="text-2xl font-bold text-slate-900">{mrId}</h1>
            <p className="text-xs text-slate-500">Last saved: 2 mins ago</p>
          </div>
          <button onClick={saveDraft} className="rounded-lg border border-[#1E4A7A] px-4 py-2 text-sm font-semibold text-[#1E4A7A] transition hover:bg-slate-50">
            {saveState}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <aside className="col-span-12 xl:col-span-2">
          <div className="sticky top-24 space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            {sectionNav.map((section, idx) => (
              <a key={section} href={`#section-${idx + 1}`} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100">
                <span>{idx + 1}. {section}</span>
                {idx < 3 && <CheckCircleIcon className="h-4 w-4 text-emerald-500" />}
              </a>
            ))}
          </div>
        </aside>

        <main className="col-span-12 space-y-4 xl:col-span-7">
          <section id="section-1" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Claim Overview</h2>
            <div className="grid gap-6 md:grid-cols-2 text-sm">
              <div className="space-y-2 text-slate-600">
                <p><strong>Name:</strong> Shri A. Raman</p><p><strong>PEN:</strong> TN-19384</p><p><strong>Designation:</strong> Principal Secretary</p><p><strong>Level:</strong> Level-14</p><p><strong>Basic Pay:</strong> ₹1,44,200</p>
                <p><strong>Email:</strong> <a href="mailto:araman@gov.in" className="text-[#1E4A7A]">araman@gov.in</a></p>
                <p><strong>Phone:</strong> <a href="tel:+919876543210" className="text-[#1E4A7A]">+91 98765 43210</a></p>
              </div>
              <div className="space-y-2 text-slate-600">
                <p><strong>Claim For:</strong> Dependent</p>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p><strong>Relation:</strong> Father</p><p><strong>Name:</strong> K. Arulselvan</p><p><strong>DOB:</strong> 15-08-1960</p>
                </div>
              </div>
            </div>
          </section>

          <section id="section-2" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Treatment Details</h2>
            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <input className="rounded-lg border border-slate-300 px-3 py-2" defaultValue="Chennai" placeholder="Place of illness" />
              <textarea className="rounded-lg border border-slate-300 px-3 py-2 md:row-span-3" rows={4} defaultValue="Cardiac treatment and follow-up diagnostics." />
              <div className="space-x-3"><span>Hospitalised?</span><button onClick={() => setHospitalised('Yes')} className={`rounded px-2 py-1 ${hospitalised === 'Yes' ? 'bg-[#1E4A7A] text-white' : 'bg-slate-100'}`}>Yes</button><button onClick={() => setHospitalised('No')} className={`rounded px-2 py-1 ${hospitalised === 'No' ? 'bg-[#1E4A7A] text-white' : 'bg-slate-100'}`}>No</button></div>
              {hospitalised === 'Yes' && (
                <>
                  <input className="rounded-lg border border-slate-300 px-3 py-2" defaultValue="AIIMS" />
                  <input type="date" className="rounded-lg border border-slate-300 px-3 py-2" defaultValue="2026-02-10" />
                  <input type="date" className="rounded-lg border border-slate-300 px-3 py-2" defaultValue="2026-02-15" />
                </>
              )}
            </div>
          </section>

          <section id="section-3" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Uploaded Bills & Documents</h2><button className="rounded-lg bg-[#1E4A7A] px-3 py-2 text-xs font-semibold text-white">+ Add Bill/Doc</button></div>
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-2"><PaperClipIcon className="h-4 w-4" />Bill_INV123.pdf</div>
                <div className="flex flex-wrap gap-2 text-xs"><span className="rounded bg-slate-100 px-2 py-1">Invoice: INV-123</span><span className="rounded bg-slate-100 px-2 py-1">Date: 12-Feb-2026</span><span className="rounded bg-slate-100 px-2 py-1">Amount: ₹5,000</span><span className="rounded bg-slate-100 px-2 py-1">Hospital: City Hospital</span></div>
                <div className="flex items-center gap-2"><span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-700">Duplicate</span><button className="text-xs text-[#1E4A7A]">Mark as Unique</button><button className="text-red-500"><TrashIcon className="h-4 w-4" /></button></div>
              </div>
              <div className="rounded-lg border-2 border-dashed border-slate-300 p-5 text-center text-xs text-slate-500">Drag & drop files here to upload</div>
            </div>
          </section>

          <section id="section-4" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Advances</h2><button onClick={() => setAdvanceModal(true)} className="rounded-lg bg-[#1E4A7A] px-3 py-2 text-xs font-semibold text-white">+ Request Advance</button></div>
            <div className="space-y-2">
              {advances.map((advance) => (
                <div key={advance.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 text-sm">
                  <div><p>{advance.date}</p><p className="font-semibold">{advance.amount}</p></div>
                  <span className={`rounded-full px-2 py-1 text-xs ${advance.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>{advance.status}</span>
                  <p className="text-[#1E4A7A]">{advance.doc}</p>
                  {advance.status === 'Submitted' && <button onClick={() => setAdvances((prev) => prev.map((x) => (x.id === advance.id ? { ...x, status: 'Paid' } : x)))} className="text-xs font-semibold text-emerald-700">Mark as Paid</button>}
                </div>
              ))}
            </div>
          </section>

          <section id="section-5" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Final Claim Submission</h2>
            <div className="space-y-2 text-sm">
              <p className="text-emerald-600">✓ Treatment Details Completed</p>
              <p className="text-emerald-600">✓ At least one Bill Uploaded</p>
              <p className="text-red-600">○ Discharge Summary Uploaded (Pending)</p>
              <p className="text-red-600">○ Signed Essentiality Certificate Uploaded (Pending)</p>
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
              <p>Total Bills (₹22,500) - Advance Paid (₹10,000) = <strong>Balance Claim (₹12,500)</strong></p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs"><DocumentArrowDownIcon className="mr-1 inline h-4 w-4" />Download EC Template</button>
                <button className="rounded-lg bg-[#1E4A7A] px-3 py-1.5 text-xs text-white"><CloudArrowUpIcon className="mr-1 inline h-4 w-4" />Upload Signed EC</button>
                <button onClick={() => setPreviewModal(true)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Preview & Submit</button>
              </div>
            </div>
          </section>
        </main>

        <aside className="col-span-12 xl:col-span-3">
          <div className="sticky top-24 space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-sm">
            <h3 className="text-base font-semibold">Case Summary</h3>
            <div className="space-y-2 text-slate-600">
              <p className="flex justify-between"><span>Total Bills</span><strong>₹ {totalBills.toLocaleString('en-IN')}</strong></p>
              <p className="flex justify-between"><span>Total Advance Requested</span><strong>₹ 10,000</strong></p>
              <p className="flex justify-between"><span>Total Advance Paid</span><strong>₹ {paidAdvance.toLocaleString('en-IN')}</strong></p>
              <p className="flex justify-between"><span>Eligible Total</span><strong>₹ {eligibleTotal.toLocaleString('en-IN')}</strong></p>
              <hr />
              <p className="flex justify-between text-base"><span>Balance Claim</span><strong>₹ {balanceClaim.toLocaleString('en-IN')}</strong></p>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <p className="mb-2 font-medium">Government Order (GO)</p>
              {goFile ? (
                <p className="text-xs">GO attached: <span className="font-semibold">{goFile}</span> <button onClick={() => setGoModal(true)} className="text-[#1E4A7A]">Replace</button></p>
              ) : (
                <button onClick={() => setGoModal(true)} className="rounded-lg bg-[#1E4A7A] px-3 py-1.5 text-xs text-white">Upload Government Order (GO)</button>
              )}
            </div>

            <div className="pt-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}>{status.toUpperCase()}</span>
            </div>
            <Link href="/reimbursement/medical" className="text-xs font-semibold text-[#1E4A7A]">← Back to all cases</Link>
          </div>
        </aside>
      </div>

      {advanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
          <form onSubmit={onSubmitAdvance} className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold">Request Advance for {mrId}</h3><button type="button" onClick={() => setAdvanceModal(false)}><XMarkIcon className="h-5 w-5" /></button></div>
            <div className="space-y-3 text-sm">
              <input required placeholder="Amount Requested (INR)" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              <input required type="file" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              <textarea placeholder="Notes (Optional)" rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div className="mt-4 flex justify-end gap-2"><button type="button" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" onClick={() => setAdvanceModal(false)}>Cancel</button><button type="submit" className="rounded-lg bg-[#1E4A7A] px-3 py-2 text-sm font-semibold text-white">Submit Request</button></div>
          </form>
        </div>
      )}

      {previewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/30 p-4">
          <div className="mx-auto mt-8 w-full max-w-4xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-semibold">Submit Final Claim: {mrId}</h3><button onClick={() => setPreviewModal(false)}><XMarkIcon className="h-5 w-5" /></button></div>
            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div className="space-y-2 rounded-lg bg-slate-50 p-3"><p className="font-semibold">Officer & Dependent</p><p>Shri A. Raman • Father: K. Arulselvan</p><p className="font-semibold">Treatment</p><p>AIIMS, 10-Feb-2026 to 15-Feb-2026</p></div>
              <div className="space-y-2 rounded-lg bg-slate-50 p-3"><p className="font-semibold">Bills Summary</p><p>Bill_INV123.pdf - ₹5,000</p><p className="font-semibold">Advance Summary</p><p>Paid: ₹10,000</p><p className="font-semibold">Final Amount</p><input defaultValue="12500" className="w-full rounded-lg border border-slate-300 px-3 py-2" /></div>
            </div>
            <div className="mt-4 flex justify-end"><button onClick={() => { setStatus('Final Submitted'); setPreviewModal(false); }} className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white">Confirm & Submit Final Claim</button></div>
          </div>
        </div>
      )}

      {goModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Upload Government Order</h3><button onClick={() => setGoModal(false)}><XMarkIcon className="h-5 w-5" /></button></div>
            <input type="file" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" onChange={(e) => setGoFile(e.target.files?.[0]?.name || '')} />
            <div className="mt-4 text-right"><button onClick={() => setGoModal(false)} className="rounded-lg bg-[#1E4A7A] px-3 py-2 text-sm text-white">Done</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
