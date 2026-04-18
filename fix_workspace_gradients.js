const fs = require('fs');

const path = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx';
let code = fs.readFileSync(path, 'utf8');

// The user wants:
// 1. A gradient container matching spark-preview
// 2. Specific ER profile UI colors (from-indigo-900 via-indigo-500 to-indigo-900)
// 3. A beautiful and organized A4 styled layout for the final note portion.

// First, replace the modernContainer styles. We'll leave the local stylesheet active for children but override the parent.
const containerStart = "className={styles.modernContainer}";
const containerNew = "className={`min-h-screen p-6 transition-colors duration-300 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 dark:text-gray-100`}";
code = code.replace(containerStart, containerNew);

// Replace header
const modernHeaderStart = "className={styles.modernHeader}";
const modernHeaderNew = "className={`mb-8 flex items-center justify-between p-6 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-100 via-white to-cyan-100 shadow-md sm:px-6 sm:py-4 dark:border-gray-700 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800`}";
code = code.replace(modernHeaderStart, modernHeaderNew);

// Final note styling needs to look like a PDF document / A4 layout.
const finalNoteBlockStart = "{active === 'FINAL NOTE' && (";
const finalNoteBlockEnd = "</div>\n        )}";

const finalNoteNew = `{active === 'FINAL NOTE' && (
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
              <div className="bg-white dark:bg-slate-800 w-full max-w-[210mm] min-h-[297mm] shadow-2xl border border-gray-200 dark:border-slate-600 rounded-sm" style={{ padding: '2cm' }}>

                {/* Header */}
                <div className="text-center mb-10 border-b-2 border-indigo-900 pb-6">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wide mb-2">Government of Kerala</h1>
                  <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-widest">Medical Reimbursement Claim</h2>
                </div>

                {/* Meta */}
                <div className="flex justify-between items-start mb-8 text-sm font-medium text-gray-700 dark:text-slate-300">
                  <div className="bg-gray-50 dark:bg-slate-900 px-4 py-2 rounded-lg border border-gray-100 dark:border-slate-700">
                    <span className="text-gray-500 block text-xs uppercase mb-1">MR Number</span>
                    <strong className="text-lg text-indigo-900 dark:text-indigo-400">{c.mrNo}</strong>
                  </div>
                  <div className="text-right">
                    <div className="mb-1"><span className="text-gray-500">Date:</span> {new Date().toLocaleDateString('en-GB')}</div>
                    <div><span className="text-gray-500">Status:</span> {c.status}</div>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-6 text-gray-800 dark:text-slate-200 leading-relaxed text-[15px]">

                  <div className="flex gap-4">
                    <div className="font-bold w-48 text-indigo-900 dark:text-indigo-400">1. Applicant Details</div>
                    <div className="flex-1 border-b border-gray-100 dark:border-slate-700 pb-2">
                      <span className="font-semibold">{c.officer.fullName}</span>, {c.officer.designation}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="font-bold w-48 text-indigo-900 dark:text-indigo-400">2. Treatment Details</div>
                    <div className="flex-1 border-b border-gray-100 dark:border-slate-700 pb-2">
                      Patient was <strong>{treatmentDraft.hospitalised ? 'hospitalised' : 'treated as outpatient'}</strong> for <strong>{treatmentDraft.diagnosis.split(' | ')[0] || 'Medical treatment'}</strong> at <strong>{treatmentDraft.hospitalName || 'the facility'}</strong>.
                    </div>
                  </div>

                  <div className="mt-12 mb-6 font-bold text-lg text-indigo-900 dark:text-indigo-400 uppercase tracking-wide border-b border-gray-200 dark:border-slate-700 pb-2">Financial Summary</div>

                  <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-700 space-y-4">
                    <div className="flex justify-between items-center text-gray-700 dark:text-slate-300">
                      <span>3. Total Claim Amount Evaluated</span>
                      <strong className="text-lg">₹{(c.bills.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0) || 0).toLocaleString()}</strong>
                    </div>

                    <div className="flex justify-between items-center text-gray-700 dark:text-slate-300">
                      <span>4. Advance Paid / Deducted</span>
                      <strong className="text-lg text-rose-600 dark:text-rose-400">- ₹{(c.advances.reduce((acc, a) => acc + (Number(a.amount) || 0), 0) || 0).toLocaleString()}</strong>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-slate-600 text-indigo-900 dark:text-indigo-400">
                      <span className="font-bold text-lg">5. Net Amount Payable</span>
                      <strong className="text-2xl font-bold">₹{((c.bills.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0) || 0) - (c.advances.reduce((acc, a) => acc + (Number(a.amount) || 0), 0) || 0)).toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="mt-20 pt-8 border-t border-gray-200 dark:border-slate-700 flex justify-between items-end">
                    <div className="text-sm text-gray-500">Generated by KARMASRI</div>
                    <div className="text-center">
                      <div className="w-48 border-b border-gray-400 dark:border-slate-500 mb-2"></div>
                      <div className="text-sm font-semibold text-gray-700 dark:text-slate-300">Signature of Authorized Officer</div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}`;

const finalNoteRegex = /\{active === 'FINAL NOTE' && \([\s\S]*?<p><strong.*?>5\. Net Payable.*?<\/p>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;
code = code.replace(finalNoteRegex, finalNoteNew);

fs.writeFileSync(path, code);
