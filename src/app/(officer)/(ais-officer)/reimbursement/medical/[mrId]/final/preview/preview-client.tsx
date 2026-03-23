'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/modules/medical-reimbursement/mr.module.css';
import { loadCases, saveCases } from '@/modules/medical-reimbursement/mockStore';
import { advancePaid, billsTotal, rupee } from '@/modules/medical-reimbursement/utils';
import { STATIC_MR_ROUTE_PARAM, getActiveMrId, setActiveMrId } from '@/modules/medical-reimbursement/session';

export default function FinalPreviewClient() {
  const router = useRouter();
  const [activeMrId, setActiveMrIdState] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [otp, setOtp] = useState(false);
  const [receipt, setReceipt] = useState(false);

  useEffect(() => {
    setActiveMrIdState(getActiveMrId());
  }, []);

  const cases = loadCases();
  const c = cases.find((x) => x.mrId === activeMrId);
  if (!c) return <div className={styles.mrShell}><div className={styles.container}>Case not found. Open a case from the list first.</div></div>;

  const submit = () => {
    const claimNo = `CLM-2026-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;
    const next = cases.map((x) => x.mrId === c.mrId ? { ...x, status: 'Final Submitted' as const, finalClaim: { ...x.finalClaim, claimNo, submittedAt: new Date().toISOString() }, movement:[{id:crypto.randomUUID(), action:'Final submitted', at:new Date().toISOString()}, ...x.movement] } : x);
    saveCases(next);
    setReceipt(true);
  };

  return <div className={styles.mrShell}><div className={styles.container}><div className={styles.paper}>
    <h2 className="text-xl font-semibold">Final Claim Preview Sheet</h2>
    <div className={styles.bodyText}>MR: {c.mrNo} | Officer: {c.officer.fullName} | Cadre: {c.officer.cadre} | Basic Pay: {c.officer.basicPay}</div>
    <div className={`mt-3 ${styles.bodyText}`}>Current service: {c.officer.designation}, {c.officer.administrativeDepartment}, {c.officer.state}</div>
    <h4 className={`${styles.labelText} mt-3`}>Expenditure Details</h4>
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead><tr><th>Bill</th><th>Date</th><th>Hospital</th><th>Amount</th></tr></thead>
        <tbody>{c.bills.map((b) => <tr key={b.id}><td>{b.invoiceNo}</td><td>{b.billDate}</td><td>{b.hospitalName}</td><td>{b.totalAmount}</td></tr>)}</tbody>
      </table>
    </div>
    <div className={`mt-2 ${styles.bodyText}`}>Total bills: {rupee(billsTotal(c))} | Advance paid: {rupee(advancePaid(c))} | Net claim: {rupee(billsTotal(c)-advancePaid(c))}</div>
    <h4 className={`${styles.labelText} mt-3`}>Annexures</h4>
    <ul className="text-sm list-disc pl-5"><li>Bills ({c.bills.length})</li><li>Signed EC ({c.docs.some((d) => d.type==='EC_SIGNED') ? 'Yes':'No'})</li><li>Discharge summary ({c.docs.some((d) => d.type==='DISCHARGE') ? 'Yes':'No'})</li><li>Other docs ({c.docs.filter((d) => !['EC_SIGNED','DISCHARGE'].includes(d.type)).length})</li></ul>
    <p className={`mt-3 ${styles.bodyText}`}>Declaration: I affirm that all claims are true and not claimed elsewhere.</p>
    <div className="mt-3 flex gap-2"><button className={styles.btnSecondary} onClick={() => window.print()}>Download Preview</button><button className={styles.btnPrimary} onClick={() => setConfirm(true)}>Submit with OTP eSign</button></div>
  </div>
  {confirm && <div className="fixed inset-0 bg-black/40 grid place-items-center"><div className={styles.modalCard}><h4 className={styles.labelText}>Confirm final submission?</h4><div className={styles.bodyText}>Total {rupee(billsTotal(c)-advancePaid(c))}</div><button className={`${styles.btnSecondary} mr-2`} onClick={() => setConfirm(false)}>Cancel</button><button className={styles.btnPrimary} onClick={() => { setConfirm(false); setOtp(true); }}>Continue</button></div></div>}
  {otp && <div className="fixed inset-0 bg-black/40 grid place-items-center"><div className={styles.modalCard}><h4 className={styles.labelText}>OTP Verification</h4><input className={`${styles.field} my-2`} placeholder="123456" /><button className={styles.btnPrimary} onClick={() => { setOtp(false); submit(); }}>Verify</button></div></div>}
  {receipt && <div className="fixed inset-0 bg-black/40 grid place-items-center"><div className={styles.modalCard}><h4 className={styles.labelText}>Final Submitted</h4><p className={styles.bodyText}>Claim No: {loadCases().find((x) => x.mrId===c.mrId)?.finalClaim.claimNo}</p><p className={styles.bodyText}>{new Date().toLocaleString()}</p><button className={styles.btnSecondary} onClick={() => { setActiveMrId(c.mrId); router.push(`/reimbursement/medical/${STATIC_MR_ROUTE_PARAM}`); }}>Back to case</button></div></div>}
  </div></div>;
}
