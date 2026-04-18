const fs = require('fs');
const path = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx';

let code = fs.readFileSync(path, 'utf8');

const oldFinalNoteRegex = /\{active === 'FINAL NOTE' && \([\s\S]*?<\/div>\s*<\/div>\s*\)\}/;

const newFinalNote = `{active === 'FINAL NOTE' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-indigo-100 dark:border-slate-700 overflow-hidden">
            <div className="relative bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900 text-white p-6">
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400"></div>
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <ClipboardCheck size={28} />
                Final Claim Submission Note
              </h3>
            </div>

            <div className="p-8 md:p-12 bg-slate-50 dark:bg-slate-900 flex justify-center">
              {/* PDF Document Container */}
              <div className="bg-white dark:bg-slate-800 w-full max-w-[210mm] min-h-[297mm] shadow-2xl border border-gray-200 dark:border-slate-600 rounded-sm relative overflow-hidden" style={{ padding: '2cm' }}>

                {/* PDF Top Border Gradient */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900"></div>

                {/* Header */}
                <div className="text-center mb-10 border-b-2 border-indigo-900 dark:border-indigo-500 pb-6">
                  <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-400 uppercase tracking-wide mb-2">Government of Kerala</h1>
                  <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-widest">Medical Reimbursement Claim</h2>
                </div>

                {/* Meta */}
                <div className="flex justify-between items-start mb-8 text-sm font-medium text-gray-700 dark:text-slate-300">
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 px-5 py-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <span className="text-indigo-600 dark:text-indigo-400 block text-xs uppercase font-bold tracking-wider mb-1">MR Number</span>
                    <strong className="text-xl text-indigo-900 dark:text-indigo-300">{c.mrNo}</strong>
                  </div>
                  <div className="text-right">
                    <div className="mb-1"><span className="text-gray-500 font-semibold uppercase text-xs tracking-wider">Date:</span> {new Date().toLocaleDateString('en-GB')}</div>
                    <div><span className="text-gray-500 font-semibold uppercase text-xs tracking-wider">Status:</span> {c.status}</div>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-8 text-gray-800 dark:text-slate-200 leading-relaxed text-[15px]">

                  {/* Officer Details */}
                  <div className="border border-indigo-100 dark:border-slate-700 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-50 to-indigo-50/50 dark:from-slate-800 dark:to-indigo-900/30 px-5 py-3 border-b border-indigo-100 dark:border-slate-700">
                      <div className="font-bold text-indigo-900 dark:text-indigo-400 tracking-wide uppercase">1. Applicant Details</div>
                    </div>
                    <div className="p-5 grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                      <div>
                        <span className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Name & Designation</span>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{c.officer.fullName}</div>
                        <div className="text-indigo-700 dark:text-indigo-400 font-medium">{c.officer.designation}</div>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Service Profile</span>
                        <div className="font-medium text-slate-800 dark:text-slate-200">{c.officer.serviceType} | PEN: {c.officer.penNumber}</div>
                        <div className="text-slate-600 dark:text-slate-400">{c.officer.cadre} (Basic Pay: ₹{c.officer.basicPay?.toLocaleString() || 'N/A'})</div>
                      </div>
                      <div className="col-span-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                        <span className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Claim For</span>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{c.patient.name} <span className="font-medium text-indigo-600 dark:text-indigo-400">({c.patient.claimFor === 'SELF' ? 'Self' : c.patient.relation})</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Treatment Details */}
                  <div className="border border-indigo-100 dark:border-slate-700 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-50 to-indigo-50/50 dark:from-slate-800 dark:to-indigo-900/30 px-5 py-3 border-b border-indigo-100 dark:border-slate-700">
                      <div className="font-bold text-indigo-900 dark:text-indigo-400 tracking-wide uppercase">2. Treatment Details</div>
                    </div>
                    <div className="p-5 grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                      <div className="col-span-2">
                        <span className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Diagnosis & System</span>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{treatmentDraft.diagnosis.split(' | ')[0] || 'Medical treatment'}</div>
                        <div className="text-indigo-700 dark:text-indigo-400 font-medium">{treatmentDraft.medicalType || 'Allopathy'} System</div>
                      </div>
                      <div className="col-span-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                        <span className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Institution</span>
                        <div className="font-medium text-slate-900 dark:text-slate-200">
                          {treatmentDraft.hospitalised ? 'Hospitalised Treatment' : 'Outpatient Treatment'} at <strong>{treatmentDraft.hospitalName || 'Unspecified Facility'}</strong>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 mt-0.5">{treatmentDraft.hospitalType} Facility | {treatmentDraft.hospitalAddress || 'Address not provided'}</div>
                      </div>
                      <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
                        <span className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Start Date</span>
                        <div className="font-medium text-slate-900 dark:text-slate-200">{formatDMY(treatmentDraft.fromDate) || 'Not recorded'}</div>
                      </div>
                      <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
                        <span className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">End Date</span>
                        <div className="font-medium text-slate-900 dark:text-slate-200">{formatDMY(treatmentDraft.toDate) || 'Not recorded'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Financials */}
                  <div className="bg-gradient-to-b from-indigo-50/50 to-slate-50 dark:from-indigo-900/10 dark:to-slate-800/50 p-6 rounded-xl border-2 border-indigo-100 dark:border-indigo-900/50 space-y-4">
                    <div className="font-bold text-lg text-indigo-900 dark:text-indigo-400 uppercase tracking-wide mb-4">3. Financial Summary</div>

                    <div className="flex justify-between items-center text-gray-700 dark:text-slate-300">
                      <span className="font-medium">Total Claim Amount Evaluated</span>
                      <strong className="text-lg">₹{(c.bills.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0) || 0).toLocaleString()}</strong>
                    </div>

                    <div className="flex justify-between items-center text-gray-700 dark:text-slate-300">
                      <span className="font-medium">Advance Paid / Deducted</span>
                      <strong className="text-lg text-rose-600 dark:text-rose-400">- ₹{(c.advances.reduce((acc, a) => acc + (Number(a.amount) || 0), 0) || 0).toLocaleString()}</strong>
                    </div>

                    <div className="flex justify-between items-center pt-5 mt-2 border-t-2 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-400">
                      <span className="font-bold text-lg uppercase tracking-wider">Net Amount Payable</span>
                      <strong className="text-2xl font-extrabold">₹{((c.bills.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0) || 0) - (c.advances.reduce((acc, a) => acc + (Number(a.amount) || 0), 0) || 0)).toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="mt-24 pt-8 border-t border-gray-200 dark:border-slate-700 flex justify-between items-end">
                    <div className="text-sm text-gray-500 font-medium">Generated by KARMASRI System</div>
                    <div className="text-center">
                      <div className="w-64 border-b-2 border-indigo-900 dark:border-indigo-500 mb-2"></div>
                      <div className="text-sm font-bold text-indigo-900 dark:text-indigo-400 uppercase tracking-widest">Signature of Authorized Officer</div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}`;

code = code.replace(oldFinalNoteRegex, newFinalNote);
fs.writeFileSync(path, code);
