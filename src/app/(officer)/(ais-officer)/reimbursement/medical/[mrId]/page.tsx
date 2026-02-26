'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import styles from '@/modules/medical-reimbursement/mr.module.css';
import { loadCases, saveCases } from '@/modules/medical-reimbursement/mockStore';
import type { Bill, DocType } from '@/modules/medical-reimbursement/types';
import { advancePaid, billsTotal, missingItems, rupee, statusColor } from '@/modules/medical-reimbursement/utils';

const tabs = ['SUMMARY', 'TREATMENT NOTE', 'ANNEXURES', 'ADVANCE NOTES', 'CERTIFICATE', 'FINAL NOTE', 'MOVEMENT REGISTER'];
const docTypes: { label: string; value: DocType }[] = [
  { label: 'Estimate', value: 'ESTIMATE' }, { label: 'Discharge Summary', value: 'DISCHARGE' }, { label: 'Essentiality Certificate (Signed)', value: 'EC_SIGNED' }, { label: 'Prescription', value: 'PRESCRIPTION' }, { label: 'Lab', value: 'LAB' }, { label: 'GO', value: 'GO' }, { label: 'Other', value: 'OTHER' },
];

export default function MRCaseWorkspace() {
  const { mrId } = useParams<{ mrId: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const [active, setActive] = useState(search.get('tab') || 'SUMMARY');
  const [sub, setSub] = useState<'Bills' | 'Other'>('Bills');
  const [toast, setToast] = useState('');
  const [editTreatment, setEditTreatment] = useState(false);
  const [docType, setDocType] = useState<DocType>('DISCHARGE');

  const cases = loadCases();
  const c = cases.find((x) => x.mrId === mrId);
  if (!c) return <div className={styles.mrShell}><div className={styles.container}>Case not found</div></div>;

  const updateCase = (nextCase: typeof c, message?: string) => {
    const next = cases.map((x) => x.mrId === c.mrId ? nextCase : x);
    saveCases(next);
    if (message) {
      setToast(message);
      setTimeout(() => setToast(''), 1800);
    }
  };

  const addBill = () => {
    const mock: Bill = { id: crypto.randomUUID(), fileName: `bill-${c.bills.length + 1}.pdf`, invoiceNo: `INV-${Math.floor(Math.random() * 999)}`, gstNo: `GST-${Math.floor(Math.random() * 999)}`, billDate: new Date().toISOString().slice(0, 10), hospitalName: c.treatment.hospitalName, totalAmount: 11000, taxAmount: 300, status: 'Extracted', duplicateFlag: c.bills.some((b) => b.invoiceNo === 'INV-111') };
    updateCase({ ...c, bills: [...c.bills, mock], lastUpdated: new Date().toISOString(), movement: [{ id: crypto.randomUUID(), action: 'Bill extracted', at: new Date().toISOString() }, ...c.movement] }, 'Bill extracted');
  };

  const addDoc = () => {
    updateCase({ ...c, docs: [{ id: crypto.randomUUID(), type: docType, fileName: `${docType.toLowerCase()}-${Date.now()}.pdf`, uploadedAt: new Date().toISOString() }, ...c.docs], lastUpdated: new Date().toISOString(), movement: [{ id: crypto.randomUUID(), action: `${docType} uploaded`, at: new Date().toISOString() }, ...c.movement] }, docType === 'EC_SIGNED' ? 'EC uploaded' : 'Saved');
  };

  const addAdvance = () => {
    const adv = { advId: crypto.randomUUID(), advNo: `ADV-MR-2026-${String(Math.floor(Math.random() * 9999)).padStart(6, '0')}`, amount: 25000, status: 'Draft' as const, estimateDocId: '', signed: false };
    updateCase({ ...c, advances: [adv, ...c.advances], status: 'Advance Submitted', movement: [{ id: crypto.randomUUID(), action: 'Advance submitted', at: new Date().toISOString() }, ...c.movement] }, 'Saved');
    router.push(`/reimbursement/medical/${c.mrId}/advance/${adv.advId}/preview`);
  };

  const checks = missingItems(c);
  const hasGo = c.docs.some((d) => d.type === 'GO');

  return <div className={styles.mrShell}><div className={styles.container}>
    <div className={`${styles.cover} mb-3`}><div className="flex justify-between flex-wrap gap-3"><div><div className="text-2xl font-semibold">Medical Reimbursement Case File</div><div>{c.mrNo}</div><div>{c.officer.fullName} • PEN {c.officer.penNumber} • {c.officer.serviceType}</div></div><div className="text-right"><div className="text-sm">Patient: {c.patient.relation} - {c.patient.name}</div><span className={styles.statusStamp} style={{ color: statusColor(c.status) }}>{c.status}</span>{hasGo && <div className="text-xs mt-1">GO attached</div>}<div className="text-sm mt-2">Bills {rupee(billsTotal(c))} | Advance paid {rupee(advancePaid(c))} | Balance {rupee(billsTotal(c)-advancePaid(c))}</div></div></div></div>

    <div className={`${styles.commandBar} flex gap-2 flex-wrap mb-3`}>
      <button className="px-3 py-2 border rounded" onClick={() => setActive('ANNEXURES')}>Add Bill/Doc</button>
      <button className="px-3 py-2 border rounded" onClick={addAdvance}>Request Advance</button>
      <button disabled={checks.length>0} className="px-3 py-2 bg-[#0b2a45] text-white rounded disabled:opacity-50" title={checks.join(', ')} onClick={() => router.push(`/reimbursement/medical/${c.mrId}/final/preview`)}>Submit Final Claim</button>
      <button className="px-3 py-2 border rounded" onClick={() => window.print()}>Download Preview</button>
    </div>

    <div className={`${styles.tabs} mb-2`}>{tabs.map((t) => <button key={t} className={`${styles.tab} ${active===t ? styles.activeTab : ''}`} onClick={() => setActive(t)}>{t}</button>)}</div>

    {active === 'SUMMARY' && <div className={styles.page}><div className={styles.grid2}><div><h4 className="font-semibold">Officer identity</h4><div className="text-sm">{c.officer.fullName}<br />{c.officer.email}<br />{c.officer.mobile}<br />{c.officer.officeAddress}</div></div><div><h4 className="font-semibold">Current posting</h4><div className="text-sm">{c.officer.designation}<br />{c.officer.postingTypes}<br />{c.officer.administrativeDepartment}<br />Basic Pay: {c.officer.basicPay}</div></div><div><h4 className="font-semibold">Patient</h4><div className="text-sm">{c.patient.name} ({c.patient.relation})</div><div className="text-xs mt-2">{checks.map((m) => <span key={m} className="mr-2 px-2 py-1 rounded bg-amber-100">{m}</span>)}</div></div><div><h4 className="font-semibold">Recent activity</h4>{c.movement.slice(0,4).map((m) => <div key={m.id} className="text-sm">{m.action} • {new Date(m.at).toLocaleString()}</div>)}</div></div></div>}

    {active === 'TREATMENT NOTE' && <div className={styles.page}><div className="flex justify-between"><h4 className="font-semibold">Treatment Note</h4><button onClick={() => setEditTreatment(!editTreatment)} className="border px-3 py-1 rounded">{editTreatment ? 'Close Edit' : 'Edit'}</button></div><div className="grid grid-cols-2 gap-2 text-sm mt-2"><div>Place: {c.treatment.placeOfIllness}</div><div>Hospitalised: {c.treatment.hospitalised ? 'Yes' : 'No'}</div><div>Type: {c.treatment.hospitalType}</div><div>Hospital: {c.treatment.hospitalName}</div><div>Period: {c.treatment.fromDate} - {c.treatment.toDate || '—'}</div><div>Diagnosis: {c.treatment.diagnosis || '—'}</div></div>{editTreatment && <div className="mt-2 p-3 border rounded bg-white"><input className="border rounded p-2 mr-2" defaultValue={c.treatment.placeOfIllness} onBlur={(e) => updateCase({ ...c, treatment: { ...c.treatment, placeOfIllness: e.target.value } }, 'Saved')} /><input className="border rounded p-2" defaultValue={c.treatment.hospitalName} onBlur={(e) => updateCase({ ...c, treatment: { ...c.treatment, hospitalName: e.target.value } }, 'Saved')} /></div>}</div>}

    {active === 'ANNEXURES' && <div className={styles.page}><div className="flex gap-2 mb-3"><button className={`px-3 py-1 border rounded ${sub==='Bills' ? 'bg-slate-900 text-white':''}`} onClick={() => setSub('Bills')}>Bills (OCR)</button><button className={`px-3 py-1 border rounded ${sub==='Other' ? 'bg-slate-900 text-white':''}`} onClick={() => setSub('Other')}>Other Documents</button></div>{sub==='Bills' ? <>
      <div className="flex gap-2 mb-2"><button className="px-3 py-1 border rounded" onClick={addBill}>Upload Bill</button><button className="px-3 py-1 border rounded">Scan from Camera</button><button className="px-3 py-1 border rounded">Bulk Upload</button></div>
      <div className="overflow-auto"><table className="w-full text-sm border"><thead><tr className="bg-slate-100"><th>File</th><th>Invoice No</th><th>GST No</th><th>Bill Date</th><th>Hospital</th><th>Total Amount</th><th>Tax</th><th>Status</th><th>Actions</th></tr></thead><tbody>{c.bills.map((b) => <tr key={b.id} className="border-t"><td>{b.fileName}</td><td>{b.invoiceNo}</td><td>{b.gstNo}</td><td>{b.billDate}</td><td>{b.hospitalName}</td><td>{b.totalAmount}</td><td>{b.taxAmount}</td><td>{b.duplicateFlag ? <span className="text-red-600">Possible duplicate</span> : b.status}</td><td><button className="text-blue-700">Edit</button> <button className="text-blue-700">View</button> <button className="text-red-700" onClick={() => updateCase({ ...c, bills: c.bills.filter((x) => x.id !== b.id) }, 'Saved')}>Remove</button></td></tr>)}</tbody></table></div>
    </> : <>
      <div className="mb-2 flex gap-2 flex-wrap">{docTypes.map((d) => <button key={d.value} className={`px-3 py-1 rounded-full border ${docType===d.value ? 'bg-[#0b2a45] text-white':''}`} onClick={() => setDocType(d.value)}>{d.label}</button>)}<button className="px-3 py-1 border rounded" onClick={addDoc}>Upload</button></div>
      {!c.docs.some((d) => d.type === 'DISCHARGE') && <div className="text-red-600 text-sm mb-2">REQUIRED: Discharge Summary missing</div>}
      <div className="grid md:grid-cols-2 gap-2">{c.docs.map((d) => <div key={d.id} className="border rounded p-2 bg-white"><div className="font-semibold text-xs">{d.type}</div><div>{d.fileName}</div><div className="text-xs">{d.uploadedAt}</div><div className="text-sm text-blue-700">View / Download</div></div>)}</div>
    </>}</div>}

    {active === 'ADVANCE NOTES' && <div className={styles.page}><button className="px-3 py-2 border rounded mb-2" onClick={addAdvance}>New Advance Request</button><div className="space-y-2">{c.advances.map((a) => <div key={a.advId} className="border rounded p-3 bg-white"><div className="flex justify-between"><div><div className="font-semibold">{a.advNo}</div><div>Amount {rupee(a.amount)} • {a.status} • eSign {a.signed ? '✓' : '—'}</div></div><div className="flex gap-2"><button className="border px-2 rounded" onClick={() => router.push(`/reimbursement/medical/${c.mrId}/advance/${a.advId}/preview`)}>View Preview</button><button className="border px-2 rounded">Download</button><button className="border px-2 rounded" onClick={() => updateCase({ ...c, advances: c.advances.map((x) => x.advId === a.advId ? { ...x, status: 'Paid' as const } : x), status: 'Advance Paid' }, 'Saved')}>Mark Paid</button></div></div></div>)}</div></div>}

    {active === 'CERTIFICATE' && <div className={styles.page}><div className="flex gap-2 mb-2"><button className="px-3 py-1 border rounded" onClick={() => setToast('Saved')}>Download EC Template</button><button className="px-3 py-1 border rounded" onClick={() => { setDocType('EC_SIGNED'); addDoc(); }}>Upload Signed EC</button></div><div className="text-sm mb-2">Template downloaded: ✓ | Signed EC uploaded: {c.docs.some((d) => d.type === 'EC_SIGNED') ? '✓' : '—'}</div><div className="max-h-72 overflow-auto border p-3 bg-white"><h4 className="font-semibold">Statement of Medicines / Investigations</h4><table className="w-full text-sm"><thead><tr><th>SlNo</th><th>Bill No & Date</th><th>Medicine</th><th>Chemical</th><th>Qty</th><th>Price</th></tr></thead><tbody>{c.bills.map((b, i) => <tr key={b.id}><td>{i+1}</td><td>{b.invoiceNo} {b.billDate}</td><td>—</td><td>—</td><td>—</td><td>{b.totalAmount}</td></tr>)}</tbody></table><div>Total Amount {rupee(billsTotal(c))}</div></div></div>}

    {active === 'FINAL NOTE' && <div className={styles.page}><div className="text-sm">Checklist: {checks.length ? checks.map((m) => <span key={m} className="mr-2 px-2 py-1 bg-red-100 rounded">{m}</span>) : <span className="text-green-700">Ready to submit</span>}</div><div className="mt-3">Total bills {rupee(billsTotal(c))} • Advance paid {rupee(advancePaid(c))} • Net claim {rupee(billsTotal(c)-advancePaid(c))}</div><div className="mt-2">AMA Selection: <select className="border rounded p-1"><option>AMA-01</option></select></div><button className="mt-3 px-3 py-2 bg-[#0b2a45] text-white rounded" disabled={checks.length>0} onClick={() => router.push(`/reimbursement/medical/${c.mrId}/final/preview`)}>Open Final Preview</button></div>}

    {active === 'MOVEMENT REGISTER' && <div className={styles.page}>{c.movement.map((m, i) => <div key={m.id} className={styles.ledgerRow}><div>{i+1}. {m.action}</div><div>{new Date(m.at).toLocaleString()}</div></div>)}</div>}
    {toast && <div className="fixed right-5 bottom-5 bg-[#0b2a45] text-white px-4 py-2 rounded">{toast}</div>}
  </div></div>;
}
