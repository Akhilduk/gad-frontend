'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './mr-book.module.css';
import { fetchProfilePreview2 } from './profile-mapper';
import { loadCases, makeAdvNo, upsertCase } from './mock-store';
import { getActiveMrCaseId, setActiveAdvanceId, setActiveMrCaseId } from './session-routing';
import type { MRCase, OfficerProfileVM } from './mr-types';

const tabs = ['SUMMARY', 'TREATMENT NOTE', 'ANNEXURES', 'ADVANCE NOTES', 'CERTIFICATE', 'FINAL NOTE', 'MOVEMENT REGISTER'] as const;

export default function MedicalCaseWorkspaceClient() {
  const [profile, setProfile] = useState<OfficerProfileVM | null>(null);
  const [cases, setCases] = useState<MRCase[]>([]);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('SUMMARY');
  const [toast, setToast] = useState('');
  const [mrId, setMrId] = useState('');

  useEffect(() => {
    setMrId(getActiveMrCaseId());
    fetchProfilePreview2().then(({ profile: p }) => {
      setProfile(p);
      setCases(loadCases(p));
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const item = useMemo(() => cases.find((c) => c.mrId === mrId || c.mrNo === mrId), [cases, mrId]);

  if (!item || !profile) {
    return (
      <div className={styles.shellBg}>
        <div className={styles.container}>Case not found</div>
      </div>
    );
  }

  const save = (next: MRCase, msg = 'Saved') => {
    const withMovement: MRCase = {
      ...next,
      movement: [...next.movement, { id: crypto.randomUUID(), action: msg, at: new Date().toISOString() }],
    };
    setCases(upsertCase(withMovement, cases));
    setToast(msg);
  };

  const billTotal = item.bills.reduce((s, b) => s + b.totalAmount, 0);
  const advPaid = item.advances.filter((a) => a.status === 'Paid').reduce((s, a) => s + a.amount, 0);
  const missing = {
    bills: item.bills.length < 1,
    ec: !item.docs.some((d) => d.type === 'EC_SIGNED'),
    discharge: !item.docs.some((d) => d.type === 'DISCHARGE'),
    treatment: !item.treatment.placeOfIllness || !item.treatment.hospitalName || !item.treatment.fromDate,
  };

  const addBill = () => {
    const duplicate = item.bills.some((x) => x.invoiceNo === 'INV-1001' && x.gstNo === 'GST-001' && x.totalAmount === 3500);
    save(
      {
        ...item,
        status: 'Active',
        bills: [
          ...item.bills,
          {
            id: crypto.randomUUID(),
            fileName: `bill-${item.bills.length + 1}.pdf`,
            invoiceNo: `INV-${1000 + item.bills.length + 1}`,
            gstNo: 'GST-001',
            billDate: '2026-02-25',
            hospitalName: item.treatment.hospitalName,
            totalAmount: 3500,
            taxAmount: 120,
            status: 'Extracted',
            duplicateFlag: duplicate,
          },
        ],
      },
      'Bill extracted',
    );
  };

  const addDoc = (type: MRCase['docs'][number]['type']) => {
    save(
      {
        ...item,
        docs: [...item.docs, { id: crypto.randomUUID(), type, fileName: `${type.toLowerCase()}.pdf`, uploadedAt: new Date().toISOString() }],
      },
      type === 'EC_SIGNED' ? 'EC uploaded' : 'Saved',
    );
  };

  const addAdvance = () => {
    save(
      {
        ...item,
        status: 'Advance Submitted',
        advances: [
          ...item.advances,
          {
            advId: crypto.randomUUID(),
            advNo: makeAdvNo(),
            amount: 12000,
            status: 'Submitted',
            estimateDocId: 'est-1',
            submittedAt: new Date().toISOString(),
            signed: true,
          },
        ],
      },
      'Advance submitted',
    );
  };

  return (
    <div className={styles.shellBg}>
      <div className={styles.container}>
        <section className={styles.cover}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Medical Reimbursement Case File</h1>
              <p className="text-sm text-indigo-100">{item.mrNo} | {item.officer.fullName} | PEN {item.officer.penNumber}</p>
              <p className="text-sm text-indigo-100">Patient: {item.patient.claimFor === 'SELF' ? 'Self' : 'Dependent'} - {item.patient.name}</p>
            </div>
            <div className="text-right">
              <span className={styles.stamp}>{item.status}</span>
              <p className="mt-2 text-xs text-indigo-100">Bills ₹{billTotal} | Advance paid ₹{advPaid} | Balance ₹{Math.max(billTotal - advPaid, 0)}</p>
              {item.docs.some((d) => d.type === 'GO') && <span className="text-xs text-emerald-200">GO attached</span>}
            </div>
          </div>
        </section>

        <div className={`mt-3 ${styles.command}`}>
          <button className="rounded border border-indigo-300 bg-white px-3 py-2 text-sm" onClick={addBill}>Add Bill/Doc</button>
          <button className="rounded border border-indigo-300 bg-white px-3 py-2 text-sm" onClick={addAdvance}>Request Advance</button>
          <button
            className="rounded border border-indigo-300 bg-white px-3 py-2 text-sm disabled:opacity-40"
            disabled={Object.values(missing).some(Boolean)}
            title={Object.entries(missing).filter(([, v]) => v).map(([k]) => k).join(', ')}
          >
            Submit Final Claim
          </button>
          <button className="rounded border border-indigo-300 bg-white px-3 py-2 text-sm" onClick={() => window.print()}>Download Preview</button>
        </div>

        <div className={`mt-4 ${styles.tabs}`}>
          {tabs.map((tab) => (
            <button key={tab} className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        <section className={`${styles.page} ${styles.slide} mt-2`}>
          {activeTab === 'SUMMARY' && (
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded border border-slate-200 bg-white p-3">
                <p><b>Officer:</b> {item.officer.fullName}</p>
                <p><b>Designation:</b> {item.officer.designation}</p>
                <p><b>Posting:</b> {item.officer.administrativeDepartment}, {item.officer.district}</p>
              </div>
              <div className="rounded border border-slate-200 bg-white p-3">
                <p><b>Patient:</b> {item.patient.name} ({item.patient.relation})</p>
                <p><b>Hospital:</b> {item.treatment.hospitalName}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {missing.discharge && <span className="rounded bg-rose-100 px-2 py-1 text-xs text-rose-700">Discharge Missing</span>}
                  {missing.ec && <span className="rounded bg-rose-100 px-2 py-1 text-xs text-rose-700">EC Missing</span>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'TREATMENT NOTE' && (
            <div className="grid gap-2 md:grid-cols-2">
              <input className={styles.field} value={item.treatment.placeOfIllness} onChange={(e) => save({ ...item, treatment: { ...item.treatment, placeOfIllness: e.target.value } }, 'Saved')} />
              <input className={styles.field} value={item.treatment.hospitalName} onChange={(e) => save({ ...item, treatment: { ...item.treatment, hospitalName: e.target.value } }, 'Saved')} />
              <input type="date" className={styles.field} value={item.treatment.fromDate} onChange={(e) => save({ ...item, treatment: { ...item.treatment, fromDate: e.target.value } }, 'Saved')} />
              <textarea className="min-h-24 rounded-lg border border-slate-300 p-2 md:col-span-2" value={item.treatment.diagnosis} onChange={(e) => save({ ...item, treatment: { ...item.treatment, diagnosis: e.target.value } }, 'Saved')} />
            </div>
          )}

          {activeTab === 'ANNEXURES' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button className="rounded border border-slate-300 px-2 py-1 text-sm" onClick={addBill}>Upload Bill</button>
                <button className="rounded border border-slate-300 px-2 py-1 text-sm">Scan from Camera</button>
                <button className="rounded border border-slate-300 px-2 py-1 text-sm" onClick={addBill}>Bulk Upload</button>
              </div>

              <div className="overflow-x-auto rounded border border-slate-200 bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-2 py-2 text-left">File</th><th className="px-2 py-2 text-left">Invoice No</th><th className="px-2 py-2 text-left">GST No</th><th className="px-2 py-2 text-left">Bill Date</th><th className="px-2 py-2 text-left">Hospital</th><th className="px-2 py-2 text-left">Total</th><th className="px-2 py-2 text-left">Tax</th><th className="px-2 py-2 text-left">Status</th><th className="px-2 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.bills.map((b) => (
                      <tr key={b.id} className="border-t border-slate-100">
                        <td className="px-2 py-2">{b.fileName}</td><td className="px-2 py-2">{b.invoiceNo}</td><td className="px-2 py-2">{b.gstNo}</td><td className="px-2 py-2">{b.billDate}</td><td className="px-2 py-2">{b.hospitalName}</td><td className="px-2 py-2">{b.totalAmount}</td><td className="px-2 py-2">{b.taxAmount}</td>
                        <td className="px-2 py-2">{b.status} {b.duplicateFlag && <span className="ml-1 rounded bg-rose-100 px-1 text-rose-700">Possible duplicate</span>}</td>
                        <td className="px-2 py-2">Edit | View | Remove</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {['ESTIMATE', 'DISCHARGE', 'EC_SIGNED', 'PRESCRIPTION', 'LAB', 'GO', 'OTHER'].map((t) => (
                  <button key={t} className="rounded-full border border-slate-300 px-2 py-1" onClick={() => addDoc(t as MRCase['docs'][number]['type'])}>{t}</button>
                ))}
                {missing.discharge && <span className="rounded bg-rose-100 px-2 py-1 text-rose-700">REQUIRED: Discharge Summary</span>}
              </div>
            </div>
          )}

          {activeTab === 'ADVANCE NOTES' && (
            <div className="space-y-2">
              {item.advances.map((a) => (
                <div key={a.advId} className="rounded border border-slate-200 bg-white p-3 text-sm">
                  <p>{a.advNo} | ₹{a.amount} | {a.status}</p>
                  <p className="text-xs text-slate-600">eSign: {a.signed ? 'Yes' : 'No'}</p>
                  <div className="mt-1 flex gap-3 text-xs">
                    <Link
                      href="/reimbursement/medical/advance-preview"
                      onClick={() => {
                        setActiveMrCaseId(item.mrId);
                        setActiveAdvanceId(a.advId);
                      }}
                      className="underline"
                    >
                      View Preview
                    </Link>
                    <button className="underline" onClick={() => save({ ...item, status: 'Advance Paid', advances: item.advances.map((x) => (x.advId === a.advId ? { ...x, status: 'Paid' } : x)) }, 'Saved')}>Mark Paid</button>
                  </div>
                </div>
              ))}
              <button className="rounded border border-slate-300 px-3 py-1 text-sm" onClick={addAdvance}>New Advance Request</button>
            </div>
          )}

          {activeTab === 'CERTIFICATE' && (
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <button className="rounded border border-slate-300 px-2 py-1" onClick={() => save(item, 'Saved')}>Download EC Template</button>
                <button className="rounded border border-slate-300 px-2 py-1" onClick={() => addDoc('EC_SIGNED')}>Upload Signed EC</button>
              </div>
              <p>Template downloaded ✓ | Signed EC uploaded {missing.ec ? '—' : '✓'}</p>
              <div className="max-h-52 overflow-auto rounded border border-slate-200 bg-white p-2 text-xs">
                <p className="mb-2 font-semibold">Essentiality Certificate Template Preview</p>
                <table className="w-full">
                  <thead><tr><th>SlNo</th><th>Bill No & Date</th><th>Medicine</th><th>Chemical</th><th>Qty</th><th>Price</th></tr></thead>
                  <tbody>{item.bills.map((b, i) => <tr key={b.id}><td>{i + 1}</td><td>{b.invoiceNo} {b.billDate}</td><td>—</td><td>—</td><td>—</td><td>{b.totalAmount}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'FINAL NOTE' && (
            <div className="space-y-2 text-sm">
              <ul className="list-disc pl-4">
                <li>Bills &gt;= 1: {missing.bills ? '✗' : '✓'}</li>
                <li>Signed EC uploaded: {missing.ec ? '✗' : '✓'}</li>
                <li>Discharge summary uploaded: {missing.discharge ? '✗' : '✓'}</li>
                <li>Treatment minimum complete: {missing.treatment ? '✗' : '✓'}</li>
              </ul>
              <p>Total bills ₹{billTotal} | Advance Paid ₹{advPaid} | Net claim ₹{Math.max(billTotal - advPaid, 0)}</p>
              <Link className="inline-block rounded border border-slate-300 px-3 py-2" href="/reimbursement/medical/final-preview" onClick={() => setActiveMrCaseId(item.mrId)}>Open Final Preview</Link>
            </div>
          )}

          {activeTab === 'MOVEMENT REGISTER' && (
            <div className="space-y-1 text-sm">
              {item.movement.map((m) => (
                <div key={m.id} className="border-b border-dashed border-slate-300 py-1">{new Date(m.at).toLocaleString()} — {m.action}</div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-3">
          <Link href="/reimbursement/medical" className="text-sm underline">Back to control center</Link>
        </div>

        {toast && <div className="fixed bottom-4 right-4 z-50 rounded bg-slate-900 px-3 py-2 text-xs text-white">{toast}</div>}
      </div>
    </div>
  );
}
