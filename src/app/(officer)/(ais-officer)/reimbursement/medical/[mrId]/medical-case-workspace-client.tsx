'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from '../mr-book.module.css';
import { loadCases, makeAdvNo, upsertCase } from '../mock-store';
import { fetchProfilePreview2 } from '../profile-mapper';
import type { MRCase, OfficerProfileVM } from '../mr-types';

const tabs = ['SUMMARY', 'TREATMENT NOTE', 'ANNEXURES', 'ADVANCE NOTES', 'CERTIFICATE', 'FINAL NOTE', 'MOVEMENT REGISTER'] as const;

export default function MedicalCaseWorkspaceClient({ mrId }: { mrId: string }) {
  const [profile, setProfile] = useState<OfficerProfileVM | null>(null);
  const [cases, setCases] = useState<MRCase[]>([]);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('SUMMARY');
  const [toast, setToast] = useState('');

  useEffect(() => { fetchProfilePreview2().then(({ profile: p }) => { setProfile(p); setCases(loadCases(p)); }); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2000); return () => clearTimeout(t); }, [toast]);
  const item = useMemo(() => cases.find((c) => c.mrId === mrId || c.mrNo === mrId), [cases, mrId]);
  if (!item || !profile) return <div className={styles.shellBg}><div className={styles.container}>Case not found</div></div>;

  const save = (next: MRCase, msg = 'Saved') => { const updated = upsertCase({ ...next, movement: [...next.movement, { id: crypto.randomUUID(), action: msg, at: new Date().toISOString() }] }, cases); setCases(updated); setToast(msg); };
  const billTotal = item.bills.reduce((s, b) => s + b.totalAmount, 0);
  const advPaid = item.advances.filter((a) => a.status === 'Paid').reduce((s, a) => s + a.amount, 0);
  const missing = {
    bills: item.bills.length < 1,
    ec: !item.docs.some((d) => d.type === 'EC_SIGNED'),
    discharge: !item.docs.some((d) => d.type === 'DISCHARGE'),
    treatment: !item.treatment.placeOfIllness || !item.treatment.hospitalName || !item.treatment.fromDate,
  };

  const addBill = () => {
    const b = { id: crypto.randomUUID(), fileName: `bill-${item.bills.length + 1}.pdf`, invoiceNo: `INV-${Math.floor(Math.random() * 5000)}`, gstNo: 'GST-001', billDate: '2026-02-25', hospitalName: item.treatment.hospitalName, totalAmount: 3500, taxAmount: 120, status: 'Extracted' as const, duplicateFlag: item.bills.some((x) => x.invoiceNo === 'INV-1' && x.gstNo === 'GST-001' && x.totalAmount === 3500) };
    save({ ...item, bills: [...item.bills, b], status: 'Active' }, 'Bill extracted');
  };

  const uploadDoc = (type: MRCase['docs'][number]['type']) => save({ ...item, docs: [...item.docs, { id: crypto.randomUUID(), type, fileName: `${type.toLowerCase()}.pdf`, uploadedAt: new Date().toISOString() }] }, `${type === 'EC_SIGNED' ? 'EC uploaded' : 'Saved'}`);
  const addAdvance = () => save({ ...item, advances: [...item.advances, { advId: crypto.randomUUID(), advNo: makeAdvNo(), amount: 12000, status: 'Submitted', estimateDocId: 'est', submittedAt: new Date().toISOString(), signed: true }], status: 'Advance Submitted' }, 'Advance submitted');

  return <div className={styles.shellBg}><div className={styles.container}>
    <section className={styles.cover}><div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-semibold">Medical Reimbursement Case File</h1><p>{item.mrNo} | {item.officer.fullName} | PEN {item.officer.penNumber}</p><p>{item.patient.claimFor === 'SELF' ? 'Self' : 'Dependent'}: {item.patient.name}</p></div><div><span className={styles.stamp}>{item.status}</span><p className="text-xs mt-2">Bills ₹{billTotal} | Advance paid ₹{advPaid} | Balance ₹{Math.max(billTotal-advPaid,0)}</p>{item.docs.some(d=>d.type==='GO') && <span className="text-xs">GO attached</span>}</div></div></section>
    <div className={`mt-3 ${styles.command}`}><button className="rounded border px-3 py-2 text-sm" onClick={addBill}>Add Bill/Doc</button><button className="rounded border px-3 py-2 text-sm" onClick={addAdvance}>Request Advance</button><button className="rounded border px-3 py-2 text-sm" disabled={Object.values(missing).some(Boolean)} title={Object.entries(missing).filter(([,v])=>v).map(([k])=>k).join(', ')}>Submit Final Claim</button><button className="rounded border px-3 py-2 text-sm" onClick={()=>window.print()}>Download Preview</button></div>
    <div className={`mt-4 ${styles.tabs}`}>{tabs.map(t=><button key={t} id={t.toLowerCase().replace(' ','-')} className={`${styles.tab} ${activeTab===t?styles.tabActive:''}`} onClick={()=>setActiveTab(t)}>{t}</button>)}</div>
    <section className={`${styles.page} ${styles.slide} mt-2`}>
      {activeTab === 'SUMMARY' && <div className="space-y-2 text-sm"><p><b>Officer:</b> {item.officer.fullName}, {item.officer.designation}</p><p><b>Posting:</b> {item.officer.administrativeDepartment}, {item.officer.district}</p><p><b>Patient:</b> {item.patient.name} ({item.patient.relation})</p><div className="flex gap-2">{missing.discharge && <span className="rounded bg-rose-100 px-2 py-1 text-xs">Discharge Missing</span>}{missing.ec && <span className="rounded bg-rose-100 px-2 py-1 text-xs">EC Missing</span>}</div></div>}
      {activeTab === 'TREATMENT NOTE' && <div className="grid gap-2 md:grid-cols-2 text-sm"><input className="rounded border px-2 py-1" value={item.treatment.placeOfIllness} onChange={(e)=>save({...item,treatment:{...item.treatment,placeOfIllness:e.target.value}},'Saved')}/><input className="rounded border px-2 py-1" value={item.treatment.hospitalName} onChange={(e)=>save({...item,treatment:{...item.treatment,hospitalName:e.target.value}},'Saved')}/><input type="date" className="rounded border px-2 py-1" value={item.treatment.fromDate} onChange={(e)=>save({...item,treatment:{...item.treatment,fromDate:e.target.value}},'Saved')}/><textarea className="rounded border px-2 py-1 md:col-span-2" value={item.treatment.diagnosis} onChange={(e)=>save({...item,treatment:{...item.treatment,diagnosis:e.target.value}},'Saved')}/></div>}
      {activeTab === 'ANNEXURES' && <div className="space-y-3"><div className="flex flex-wrap gap-2"><button className="rounded border px-2 py-1" onClick={addBill}>Upload Bill</button><button className="rounded border px-2 py-1">Scan from Camera</button><button className="rounded border px-2 py-1" onClick={addBill}>Bulk Upload</button></div><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr><th>File</th><th>Invoice No</th><th>GST No</th><th>Bill Date</th><th>Hospital</th><th>Total Amount</th><th>Tax</th><th>Status</th><th>Actions</th></tr></thead><tbody>{item.bills.map(b=><tr key={b.id}><td>{b.fileName}</td><td>{b.invoiceNo}</td><td>{b.gstNo}</td><td>{b.billDate}</td><td>{b.hospitalName}</td><td>{b.totalAmount}</td><td>{b.taxAmount}</td><td>{b.status}{b.duplicateFlag && <span className="ml-1 rounded bg-rose-100 px-1">Possible duplicate</span>}</td><td>Edit | View | Remove</td></tr>)}</tbody></table></div><div className="flex flex-wrap gap-2 text-xs">{['ESTIMATE','DISCHARGE','EC_SIGNED','PRESCRIPTION','LAB','GO','OTHER'].map(t=><button key={t} className="rounded-full border px-2 py-1" onClick={()=>uploadDoc(t as any)}>{t}</button>)}{missing.discharge && <span className="rounded bg-rose-100 px-2 py-1">REQUIRED: Discharge Summary</span>}</div></div>}
      {activeTab === 'ADVANCE NOTES' && <div className="space-y-2">{item.advances.map(a=><div key={a.advId} className="rounded border p-2 text-sm"><p>{a.advNo} | ₹{a.amount} | {a.status}</p><div className="text-xs">eSign: {a.signed?'Yes':'No'}</div><Link href={`/reimbursement/medical/${item.mrId}/advance/${a.advId}/preview`} className="text-xs underline">View Preview</Link> <button className="text-xs underline" onClick={()=>save({...item,advances:item.advances.map(x=>x.advId===a.advId?{...x,status:'Paid'}:x),status:'Advance Paid'},'Saved')}>Mark Paid</button></div>)}<button className="rounded border px-3 py-1 text-sm" onClick={addAdvance}>New Advance Request</button></div>}
      {activeTab === 'CERTIFICATE' && <div className="space-y-2 text-sm"><div className="flex gap-2"><button className="rounded border px-2 py-1" onClick={()=>save(item,'Saved')}>Download EC Template</button><button className="rounded border px-2 py-1" onClick={()=>uploadDoc('EC_SIGNED')}>Upload Signed EC</button></div><p>Template downloaded ✓ | Signed EC uploaded {missing.ec?'—':'✓'}</p><div className="max-h-48 overflow-auto rounded border p-2 text-xs"><p>Essentiality Certificate Template Preview</p><table className="w-full"><thead><tr><th>SlNo</th><th>Bill No & Date</th><th>Medicine</th><th>Chemical</th><th>Qty</th><th>Price</th></tr></thead><tbody>{item.bills.map((b,i)=><tr key={b.id}><td>{i+1}</td><td>{b.invoiceNo} {b.billDate}</td><td>—</td><td>—</td><td>—</td><td>{b.totalAmount}</td></tr>)}</tbody></table></div></div>}
      {activeTab === 'FINAL NOTE' && <div className="space-y-2 text-sm"><ul className="list-disc pl-4"><li>Bills &gt;=1: {missing.bills?'✗':'✓'}</li><li>Signed EC uploaded: {missing.ec?'✗':'✓'}</li><li>Discharge summary uploaded: {missing.discharge?'✗':'✓'}</li><li>Treatment minimum complete: {missing.treatment?'✗':'✓'}</li></ul><p>Total bills ₹{billTotal} | Advance Paid ₹{advPaid} | Net claim ₹{Math.max(billTotal-advPaid,0)}</p><Link className="rounded border px-3 py-2 inline-block" href={`/reimbursement/medical/${item.mrId}/final/preview`}>Open Final Preview</Link></div>}
      {activeTab === 'MOVEMENT REGISTER' && <div className="space-y-1 text-sm">{item.movement.map(m=><div key={m.id} className="border-b border-dashed py-1">{new Date(m.at).toLocaleString()} — {m.action}</div>)}</div>}
    </section>
    <div className="mt-3"><Link href="/reimbursement/medical" className="underline text-sm">Back to control center</Link></div>
    {toast && <div className="fixed bottom-4 right-4 rounded bg-slate-900 px-3 py-2 text-xs text-white">{toast}</div>}
  </div></div>;
}
