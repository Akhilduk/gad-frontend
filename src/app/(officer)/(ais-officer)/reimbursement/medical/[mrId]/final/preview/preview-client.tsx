'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, CheckCircle2, FileCheck2, UserCircle2, ClipboardList, Building2 } from 'lucide-react';
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

  if (!c) {
    return (
      <div className={styles.mrShell}>
        <div className={styles.container}>
          <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
            <h2 className="text-xl font-semibold text-slate-800">Case not found.</h2>
            <p className="text-slate-500 mt-2">Please return to the workspace and open a valid case.</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDMY = (v?: string) => {
    if (!v) return '-';
    const [y, m, d] = v.slice(0, 10).split('-');
    if (!y || !m || !d) return v;
    return `${d}-${m}-${y}`;
  };

  const submit = () => {
    const claimNo = `CLM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;
    const next = cases.map((x) =>
      x.mrId === c.mrId
        ? {
            ...x,
            status: 'Final Submitted' as const,
            finalClaim: { ...x.finalClaim, claimNo, submittedAt: new Date().toISOString() },
            movement: [
              { id: crypto.randomUUID(), action: `Final claim submitted (Ref: ${claimNo})`, at: new Date().toISOString() },
              ...x.movement,
            ],
          }
        : x
    );
    saveCases(next);
    setReceipt(true);
  };

  const netClaim = billsTotal(c) - advancePaid(c);
  const updatedCase = receipt ? loadCases().find((x) => x.mrId === c.mrId) : null;

  return (
    <div className={`${styles.mrShell} bg-slate-50 min-h-screen py-8`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6 no-print">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Final Claim Preview</h1>
            <p className="text-sm text-slate-500 mt-1">Review the details before eSign and submission.</p>
          </div>
          <div className="flex gap-3">
            <button className={`${styles.btnSecondary} bg-white shadow-sm`} onClick={() => router.back()}>
              Back to Workspace
            </button>
            <button className={`${styles.btnSecondary} bg-white shadow-sm flex items-center gap-2`} onClick={() => window.print()}>
              <FileText className="w-4 h-4" /> Print Document
            </button>
          </div>
        </div>

        {/* Formal Document Container */}
        <div className={`${styles.govFormSheet} print:shadow-none print:border-none print:m-0`}>

          <div className={styles.govFormHead}>
            <h2>Form of Application for Claiming Reimbursement of Cost of Treatment or Medical Attendance</h2>
            <p>(See Rule 7)</p>
          </div>

          <div className={styles.govFormTable}>
            <div className={styles.govFormRow}><div className={styles.govFormNo}>1.</div><div className={styles.govFormLabel}>Name and office held (in block letters)</div><div className={styles.govFormValue}><div>{c.officer.fullName}</div><div>{c.officer.designation}</div><div>{c.officer.serviceType}</div></div></div>
            <div className={styles.govFormRow}><div className={styles.govFormNo}>2.</div><div className={styles.govFormLabel}>Residential address</div><div className={styles.govFormValue}><div>{c.officer.residentialAddress || c.officer.officeAddress || '-'}</div>{c.officer.officePostingAddress ? <div>Present posting: {c.officer.officePostingAddress}</div> : null}</div></div>
            <div className={styles.govFormRow}><div className={styles.govFormNo}>3.</div><div className={styles.govFormLabel}>Name of Patient and relationship with the Member</div><div className={styles.govFormValue}>{c.patient.claimFor === 'SELF' ? <><div>SELF</div><div>Member treated directly</div></> : <><div>{c.patient.name}</div><div>{c.patient.relation}</div></>}</div></div>
            <div className={styles.govFormRow}><div className={styles.govFormNo}>4.</div><div className={styles.govFormLabel}>Place at which the the Member / Spouse / family member fell ill</div><div className={styles.govFormValue}>{c.treatment.placeOfIllness || 'N.A.'}</div></div>
            <div className={styles.govFormRow}><div className={styles.govFormNo}>5.</div><div className={styles.govFormLabel}>Whether hospitalised or not</div><div className={styles.govFormValue}><div>{c.treatment.hospitalised ? 'Hospitalised' : 'Not hospitalised'}</div><div>Period: {formatDMY(c.treatment.fromDate)} to {formatDMY(c.treatment.toDate)}</div></div></div>
            <div className={styles.govFormRow}><div className={styles.govFormNo}>6.</div><div className={styles.govFormLabel}>If hospitalised within the state, whether in Govt. hospital or Empanelled Private hospital with name of hospital and address</div><div className={styles.govFormValue}><div>{c.treatment.withinState ? 'Within state' : 'Outside state'}</div><div>{c.treatment.hospitalName || 'N.A.'}</div><div>{c.treatment.hospitalAddress || 'Address not recorded'}</div></div></div>
            <div className={styles.govFormRow}><div className={styles.govFormNo}>7.</div><div className={styles.govFormLabel}>Empanelled Authority</div><div className={styles.govFormValue}><div>{c.treatment.hospitalType || 'N.A.'}</div><div>{c.treatment.hospitalised ? 'Hospital admission details recorded' : 'Out-patient / non-admission treatment'}</div></div></div>
            <div className={styles.govFormRow}><div className={styles.govFormNo}>8.</div><div className={styles.govFormLabel}>In the case of treatment abroad, whether certificate of the authority mentioned in rule 6 of the scheme is attached</div><div className={styles.govFormValue}>{c.treatment.withinState ? 'Not applicable. Treatment recorded within India.' : 'No treatment-abroad certificate attached.'}</div></div>
            <div className={styles.govFormRow}><div className={styles.govFormNo}>9.</div><div className={styles.govFormLabel}>Cost of treatment (List of medicines, cash memos and essentiality certificate should be attached)</div><div className={styles.govFormValue}><div>{c.bills.length} bill(s), {c.docs.length} supporting document(s)</div><div>Net claim: {rupee(billsTotal(c) - advancePaid(c))}</div></div></div>
          </div>

          <div className={styles.govFormDeclaration}>
            <div className={styles.govFormDeclarationTitle}>Declaration</div>
            <div className={styles.govFormDeclarationText}>
              I hereby declare that the statements given above are true to the best of my knowledge and belief and the person for whom medical expenditure has been incurred is wholly dependent on me.
            </div>
          </div>

          <div className={styles.govFormFooter}>
            <div className={styles.govFormFooterBlock}>
              <div className={styles.govFormFooterLine}><span>Place :</span><span>{c.treatment.placeOfIllness || 'N.A.'}</span></div>
              <div className={styles.govFormFooterLine}><span>Date :</span><span>{new Date().toLocaleDateString('en-GB')}</span></div>
            </div>
            <div className={`${styles.govFormFooterBlock} ${styles.govFormSignature}`}>
              <div className={styles.govFormSignatureLine}></div>
              <div className={styles.govFormSignatureLabel}>Name of the Officer</div>
              <div className={styles.govFormValue}>{c.officer.fullName}</div>
            </div>
          </div>

          {/* Submission Action Bar */}
          {!receipt && (
            <div className="bg-slate-50 border-t border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
              <p className="text-sm text-slate-500 font-medium text-center md:text-left">
                By clicking submit, you initiate the Aadhaar eSign process.
              </p>
              <button
                className={`${styles.btnPrimary} px-8 py-3 text-base shadow-md`}
                onClick={() => setConfirm(true)}
              >
                Sign & Submit Final Claim
              </button>
            </div>
          )}
        </div>

        {/* --- Appended Document Previews (Simulating a Merged PDF) --- */}
        <div className="mt-8 space-y-12 print:mt-0 print:space-y-0">
          {c.bills.map((b, index) => (
            <div key={`bill-${b.id}`} className={`${styles.govFormSheet} print:shadow-none print:border-none print:m-0 break-before-page relative`} style={{ marginTop: '2rem' }}>
              <div className={styles.govFormHead} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText className="w-5 h-5" /> Bill Annexure {index + 1}
                </h3>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                  {b.fileName}
                </span>
              </div>
              <div className="p-8 min-h-[380px] flex flex-col items-center justify-center print:bg-white print:[background-image:none] border-2 border-dashed border-indigo-200 m-6 rounded-xl bg-white">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-50 mb-6">
                  <FileCheck2 className="w-16 h-16 text-indigo-300" />
                </div>
                <p className="text-indigo-900 font-bold text-xl mb-1">Document Scanned Preview</p>
                <p className="text-indigo-400 font-medium text-sm mb-5">This page simulates the original uploaded bill</p>
                <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm text-left bg-white p-8 rounded-xl shadow-lg border border-indigo-50 min-w-[400px]">
                  <div>
                    <div className="text-indigo-900/50 font-bold uppercase text-[10px] tracking-widest mb-1">Invoice No</div>
                    <div className="font-semibold text-slate-900 text-base">{b.invoiceNo}</div>
                  </div>
                  <div>
                    <div className="text-indigo-900/50 font-bold uppercase text-[10px] tracking-widest mb-1">Date</div>
                    <div className="font-semibold text-slate-900 text-base">{formatDMY(b.billDate)}</div>
                  </div>
                  <div>
                    <div className="text-indigo-900/50 font-bold uppercase text-[10px] tracking-widest mb-1">Hospital / Vendor</div>
                    <div className="font-semibold text-slate-900 text-base">{b.hospitalName}</div>
                  </div>
                  <div>
                    <div className="text-indigo-900/50 font-bold uppercase text-[10px] tracking-widest mb-1">Total Amount</div>
                    <div className="font-bold text-indigo-700 text-lg">{rupee(b.totalAmount)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {c.docs.map((d, index) => (
            <div key={`doc-${d.id}`} className={`${styles.govFormSheet} print:shadow-none print:border-none print:m-0 break-before-page relative`} style={{ marginTop: '2rem' }}>
              <div className={styles.govFormHead} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText className="w-5 h-5" /> Document Annexure: {d.type.replace('_', ' ')}
                </h3>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                  {d.fileName}
                </span>
              </div>
              <div className="p-8 min-h-[380px] flex flex-col items-center justify-center print:bg-white print:[background-image:none] border-2 border-dashed border-indigo-200 m-6 rounded-xl bg-white">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-50 mb-6">
                  <FileCheck2 className="w-16 h-16 text-indigo-300" />
                </div>
                <p className="text-indigo-900 font-bold text-xl mb-1">Document Scanned Preview</p>
                <p className="text-indigo-400 font-medium text-sm mb-5">{d.fileName}</p>
                <div className="flex flex-col gap-4 text-sm text-left bg-white p-8 rounded-xl shadow-lg border border-indigo-50 min-w-[400px]">
                  <div className="flex justify-between items-center border-b border-indigo-50 pb-4">
                    <span className="text-indigo-900/50 font-bold uppercase text-[10px] tracking-widest">Document Type</span>
                    <span className="font-bold text-slate-900">{d.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-indigo-900/50 font-bold uppercase text-[10px] tracking-widest">Uploaded At</span>
                    <span className="font-semibold text-slate-900">{new Date(d.uploadedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* --- Modals --- */}

      {/* Confirmation Modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm grid place-items-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Confirm Submission</h3>
              <p className="text-slate-500 text-sm mt-1">You are about to submit the final claim for <b>{rupee(netClaim)}</b>.</p>
            </div>
            <div className="p-6 bg-slate-50 flex gap-3 justify-end">
              <button className={`${styles.btnSecondary} bg-white shadow-sm`} onClick={() => setConfirm(false)}>Cancel</button>
              <button className={`${styles.btnPrimary} shadow-md`} onClick={() => { setConfirm(false); setOtp(true); }}>Proceed to eSign</button>
            </div>
          </div>
        </div>
      )}

      {/* OTP/eSign Modal */}
      {otp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm grid place-items-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="p-6 border-b border-slate-100 text-center">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Aadhaar eSign Verification</h3>
              <p className="text-slate-500 text-sm mt-2">Enter the 6-digit OTP sent to your Aadhaar linked mobile number to digitally sign the claim.</p>
            </div>
            <div className="p-6">
              <input
                type="text"
                maxLength={6}
                className="w-full text-center text-2xl tracking-[0.5em] font-mono border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 mb-6"
                placeholder="------"
                autoFocus
              />
              <button className={`${styles.btnPrimary} w-full py-3 justify-center text-base shadow-md`} onClick={() => { setOtp(false); submit(); }}>
                Verify & Submit Claim
              </button>
              <button className="w-full mt-4 text-sm text-slate-500 hover:text-slate-700 font-medium" onClick={() => setOtp(false)}>Cancel Process</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Receipt Modal */}
      {receipt && updatedCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm grid place-items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border-t-8 border-green-500">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Claim Submitted!</h3>
              <p className="text-slate-500 mb-6">Your medical reimbursement claim has been successfully signed and submitted for approval.</p>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 text-left mb-6">
                <div className="mb-2">
                  <span className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Claim Tracking ID</span>
                  <span className="block text-lg font-mono font-bold text-slate-900">{updatedCase.finalClaim.claimNo}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Submission Date</span>
                  <span className="block text-sm font-medium text-slate-700">{new Date(updatedCase.finalClaim.submittedAt || '').toLocaleString()}</span>
                </div>
              </div>

              <button
                className={`${styles.btnPrimary} w-full py-3 justify-center text-base shadow-md`}
                onClick={() => { setActiveMrId(c.mrId); router.push(`/reimbursement/medical/${STATIC_MR_ROUTE_PARAM}`); }}
              >
                Track Case in Workspace
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
