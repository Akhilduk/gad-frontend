'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import styles from '../mr-book.module.css';
import { fetchProfilePreview2 } from '../profile-mapper';
import { loadCases } from '../mock-store';
import type { MRCase, OfficerProfileVM } from '../mr-types';

export default function FinalPreviewPage() {
  const searchParams = useSearchParams();
  const mrId = searchParams.get('mrId') || '';
  const [profile, setProfile] = useState<OfficerProfileVM | null>(null);
  const [cases, setCases] = useState<MRCase[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [receipt, setReceipt] = useState(false);

  useEffect(() => {
    fetchProfilePreview2().then(({ profile: p }) => {
      setProfile(p);
      setCases(loadCases(p));
    });
  }, []);

  const item = useMemo(() => cases.find((c) => c.mrId === mrId), [cases, mrId]);
  if (!item || !profile) return null;
  const total = item.bills.reduce((s, b) => s + b.totalAmount, 0);
  const adv = item.advances.filter((a) => a.status === 'Paid').reduce((s, a) => s + a.amount, 0);

  return <div className={styles.shellBg}><div className={styles.container}><section className={styles.page}><h1 className="text-xl font-semibold">Final Claim Preview Sheet</h1><p>MR No: {item.mrNo}</p><p className="text-sm">Cadre: {profile.cadre} | Basic Pay: {profile.basicPay} | Designation: {profile.designation}</p><table className="mt-3 w-full text-xs"><thead><tr><th>Invoice</th><th>Date</th><th>Hospital</th><th>Amount</th></tr></thead><tbody>{item.bills.map(b=><tr key={b.id}><td>{b.invoiceNo}</td><td>{b.billDate}</td><td>{b.hospitalName}</td><td>{b.totalAmount}</td></tr>)}</tbody></table><p className="mt-2 text-sm">Annexures: Bills, Signed EC, Discharge summary, other docs ({item.docs.length})</p><p className="mt-2 text-sm">Total bills ₹{total} | Advance paid ₹{adv} | Net ₹{Math.max(total-adv,0)}</p><p className="mt-2 text-sm">Declaration: reimbursement not claimed elsewhere.</p><div className="mt-3 flex gap-2"><button className="rounded border px-3 py-2" onClick={()=>window.print()}>Download Preview</button><button className="rounded border px-3 py-2" onClick={()=>setConfirm(true)}>Submit with OTP eSign</button></div></section>{confirm && <div className="fixed inset-0 bg-black/40 p-4"><div className="mx-auto mt-20 max-w-md rounded bg-white p-4"><p className="font-semibold">Confirm Final Submission</p><p className="text-sm">Net claim ₹{Math.max(total-adv,0)}</p><button className="mt-2 rounded border px-3 py-1" onClick={()=>{setConfirm(false);setReceipt(true);}}>Confirm OTP</button></div></div>}{receipt && <section className="mt-3 rounded border bg-emerald-50 p-3 text-sm">Receipt: Claim No CLM-{Math.floor(Math.random()*10000)} | {new Date().toLocaleString()}</section>}<Link href={`/reimbursement/medical/workspace?mrId=${item.mrId}`} className="text-sm underline">Back</Link></div></div>;
}
