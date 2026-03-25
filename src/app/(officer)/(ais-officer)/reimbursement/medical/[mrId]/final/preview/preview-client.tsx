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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none print:m-0">

          {/* Formal Header */}
          <div className="border-b border-slate-200 p-8 text-center bg-slate-50 print:bg-white">
            <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">Medical Reimbursement Claim</h2>
            <p className="text-slate-600 mt-2 font-medium">Government of Kerala</p>
            <div className="mt-4 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm text-sm font-semibold text-slate-700">
              Reference No: {c.mrNo}
            </div>
          </div>

          <div className="p-8 space-y-8">

            {/* 1. Officer Details */}
            <section>
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                <UserCircle2 className="w-5 h-5 text-indigo-600" /> 1. Officer Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div><span className="text-slate-500 block text-xs uppercase tracking-wider">Name of Officer</span><span className="font-medium text-slate-900">{c.officer.fullName}</span></div>
                <div><span className="text-slate-500 block text-xs uppercase tracking-wider">Designation</span><span className="font-medium text-slate-900">{c.officer.designation}</span></div>
                <div><span className="text-slate-500 block text-xs uppercase tracking-wider">Service / Cadre</span><span className="font-medium text-slate-900">{c.officer.serviceType} / {c.officer.cadre}</span></div>
                <div><span className="text-slate-500 block text-xs uppercase tracking-wider">PEN Number</span><span className="font-medium text-slate-900">{c.officer.penNumber}</span></div>
                <div><span className="text-slate-500 block text-xs uppercase tracking-wider">Basic Pay</span><span className="font-medium text-slate-900">{rupee(c.officer.basicPay)}</span></div>
                <div><span className="text-slate-500 block text-xs uppercase tracking-wider">Department</span><span className="font-medium text-slate-900">{c.officer.administrativeDepartment}</span></div>
              </div>
            </section>

            {/* 2. Patient & Treatment Details */}
            <section>
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                <Building2 className="w-5 h-5 text-indigo-600" /> 2. Patient & Treatment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div><span className="text-slate-500 block text-xs uppercase tracking-wider">Claimed For</span><span className="font-medium text-slate-900">{c.patient.claimFor === 'SELF' ? 'Self' : 'Dependent'}</span></div>
                <div><span className="text-slate-500 block text-xs uppercase tracking-wider">Patient Name</span><span className="font-medium text-slate-900">{c.patient.name} ({c.patient.relation})</span></div>
                <div className="md:col-span-2"><span className="text-slate-500 block text-xs uppercase tracking-wider">Diagnosis & System</span><span className="font-medium text-slate-900">{c.treatment.diagnosis || 'Not specified'}</span></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm pl-4 border-l-2 border-slate-200">
                <div><span className="text-slate-500 block text-xs uppercase tracking-wider">Hospital Name</span><span className="font-medium text-slate-900">{c.treatment.hospitalName || '-'}</span></div>
                <div><span className="text-slate-500 block text-xs uppercase tracking-wider">Hospital Type</span><span className="font-medium text-slate-900">{c.treatment.hospitalType} ({c.treatment.withinState ? 'Within State' : 'Outside State'})</span></div>
                <div><span className="text-slate-500 block text-xs uppercase tracking-wider">Treatment Period</span><span className="font-medium text-slate-900">{formatDMY(c.treatment.fromDate)} to {formatDMY(c.treatment.toDate)}</span></div>
                <div><span className="text-slate-500 block text-xs uppercase tracking-wider">Hospitalisation</span><span className="font-medium text-slate-900">{c.treatment.hospitalised ? 'Required Hospitalisation' : 'Outpatient / Not Hospitalised'}</span></div>
              </div>
            </section>

            {/* 3. Expenditure & Bills */}
            <section>
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" /> 3. Expenditure & Bills
              </h3>

              <div className="overflow-x-auto rounded-lg border border-slate-200 mb-6">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 uppercase tracking-wider">Sl.No</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 uppercase tracking-wider">Bill Ref & Date</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 uppercase tracking-wider">Hospital/Vendor</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-500 uppercase tracking-wider">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {c.bills.length > 0 ? (
                      c.bills.map((b, i) => (
                        <tr key={b.id}>
                          <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                          <td className="px-4 py-3 text-slate-900 font-medium">{b.invoiceNo} <span className="text-slate-500 text-xs ml-1 block">{formatDMY(b.billDate)}</span></td>
                          <td className="px-4 py-3 text-slate-700">{b.hospitalName}</td>
                          <td className="px-4 py-3 text-slate-900 font-medium text-right">{b.totalAmount}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No bills recorded.</td></tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-semibold text-slate-700">Gross Total Claim:</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">{rupee(billsTotal(c))}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-medium text-slate-500">Less: Advance Received:</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">- {rupee(advancePaid(c))}</td>
                    </tr>
                    <tr className="bg-indigo-50/50">
                      <td colSpan={3} className="px-4 py-4 text-right font-bold text-indigo-900 text-base border-t border-indigo-100">Net Payable Claim Amount:</td>
                      <td className="px-4 py-4 text-right font-bold text-indigo-700 text-lg border-t border-indigo-100">{rupee(netClaim)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            {/* 4. Document Check & Declarations */}
            <section>
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" /> 4. Annexures & Declarations
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Attached Documents</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600"/> Original Bills / Receipts ({c.bills.length} items)</li>
                    <li className="flex items-center gap-2">
                      {c.docs.some((d) => d.type === 'EC_SIGNED') ? <CheckCircle2 className="w-4 h-4 text-green-600"/> : <div className="w-4 h-4 rounded-full border-2 border-slate-300"/>}
                      Essentiality Certificate (Signed)
                    </li>
                    <li className="flex items-center gap-2">
                      {c.docs.some((d) => d.type === 'DISCHARGE') ? <CheckCircle2 className="w-4 h-4 text-green-600"/> : <div className="w-4 h-4 rounded-full border-2 border-slate-300"/>}
                      Discharge Summary
                    </li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600"/> Additional Documents ({c.docs.filter((d) => !['EC_SIGNED','DISCHARGE'].includes(d.type)).length})</li>
                  </ul>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
                  <h4 className="font-semibold mb-2 uppercase tracking-wide">Declaration</h4>
                  <p className="mb-2">I hereby declare that the statements made in the application are true to the best of my knowledge and belief.</p>
                  <p>I further declare that the amount claimed herein has not been claimed elsewhere or from any other insurance scheme.</p>
                </div>
              </div>
            </section>

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
