'use client';

import { useParams, useRouter } from 'next/navigation';
import styles from '@/modules/medical-reimbursement/mr.module.css';
import { loadCases, saveCases } from '@/modules/medical-reimbursement/mockStore';
import { rupee } from '@/modules/medical-reimbursement/utils';
import { useState } from 'react';

export default function AdvancePreviewPage() {
  const { mrId, advId } = useParams<{ mrId: string; advId: string }>();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [otp, setOtp] = useState(false);
  const [receipt, setReceipt] = useState(false);

  const cases = loadCases();
  const c = cases.find((x) => x.mrId === mrId);
  const adv = c?.advances.find((a) => a.advId === advId);
  if (!c || !adv) return <div className={styles.mrShell}><div className={styles.container}>Advance not found.</div></div>;

  const submit = () => {
    const next = cases.map((x) => x.mrId === c.mrId ? { ...x, advances: x.advances.map((a) => a.advId===adv.advId ? { ...a, status:'Submitted' as const, submittedAt:new Date().toISOString(), signed:true } : a), movement:[{id:crypto.randomUUID(), action:'Advance submitted', at:new Date().toISOString()}, ...x.movement] } : x);
    saveCases(next);
    setReceipt(true);
  };

  return <div className={styles.mrShell}><div className={styles.container}><div className={styles.paper}>
    <h2 className="text-xl font-semibold">Advance Request Preview Sheet</h2><div>MR No: {c.mrNo} | Advance No: {adv.advNo}</div>
    <ol className="list-decimal pl-5 text-sm space-y-1 mt-3">
      <li>Name and office held: {c.officer.fullName}, {c.officer.designation}</li><li>Service: {c.officer.serviceType}</li><li>Present posting / office address: {c.officer.officePostingAddress}</li><li>Residential address: {c.officer.residentialAddress}</li><li>Patient name: {c.patient.name}</li><li>Relationship: {c.patient.relation}</li><li>Place of illness: {c.treatment.placeOfIllness}</li><li>Hospitalized: {c.treatment.hospitalised ? 'Yes' : 'No'}; {c.treatment.hospitalName}, {c.treatment.hospitalAddress}, {c.treatment.hospitalType}</li><li>Period: {c.treatment.fromDate} to {c.treatment.toDate || '—'}</li><li>Advance amount requested: {rupee(adv.amount)}</li><li>Annexures: estimate document</li>
    </ol>
    <p className="mt-3 text-sm">Declaration: I certify that the details are correct.</p>
    <div className="mt-4 flex gap-2"><button className="border rounded px-3 py-2" onClick={() => window.print()}>Download Preview</button><button className="bg-[#0b2a45] text-white rounded px-3 py-2" onClick={() => setConfirm(true)}>Submit with OTP eSign</button></div>
  </div>
  {confirm && <div className="fixed inset-0 bg-black/40 grid place-items-center"><div className="bg-white p-4 rounded"><h4 className="font-semibold">Are you sure?</h4><p className="text-sm">Amount {rupee(adv.amount)} with estimate attachment.</p><div className="flex gap-2 mt-2"><button className="border px-2 rounded" onClick={() => setConfirm(false)}>Cancel</button><button className="bg-[#0b2a45] text-white px-2 rounded" onClick={() => { setConfirm(false); setOtp(true); }}>Continue</button></div></div></div>}
  {otp && <div className="fixed inset-0 bg-black/40 grid place-items-center"><div className="bg-white p-4 rounded"><h4 className="font-semibold">Enter OTP</h4><input className="border rounded p-2 my-2" placeholder="123456" /><div><button className="bg-[#0b2a45] text-white px-3 py-1 rounded" onClick={() => { setOtp(false); submit(); }}>Verify & Submit</button></div></div></div>}
  {receipt && <div className="fixed inset-0 bg-black/40 grid place-items-center"><div className="bg-white p-4 rounded"><h4 className="font-semibold">Receipt</h4><p>{adv.advNo}</p><p>{new Date().toLocaleString()}</p><p>Signed by {c.officer.fullName}</p><button className="mt-2 border px-2 rounded" onClick={() => router.push(`/reimbursement/medical/${c.mrId}`)}>Back to case</button></div></div>}
  </div></div>;
}
