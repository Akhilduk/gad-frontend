const fs = require('fs');
const path = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx';

let code = fs.readFileSync(path, 'utf8');

const oldSummaryRegex = /\{active === 'SUMMARY' && \([\s\S]*?<\/div>\s*<\/div>\s*\)\}/;

const newSummary = `{active === 'SUMMARY' && (
          <div className="space-y-6 animateFadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-indigo-100 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900 text-white p-5 flex items-center gap-3">
                <UserCircle2 size={24} className="text-indigo-200" />
                <h3 className="text-xl font-bold">Applicant Details</h3>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50 dark:bg-slate-900/50">
                <div className="col-span-1 md:col-span-2 lg:col-span-4 flex items-center justify-between border-b border-gray-200 dark:border-slate-700 pb-4 mb-2">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-cyan-100 dark:from-indigo-900 dark:to-cyan-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xl shadow-inner border border-indigo-200 dark:border-indigo-700">
                      {c.officer.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900 dark:text-slate-100">{c.officer.fullName}</div>
                      <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{c.officer.designation}</div>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-1">PEN Number</div>
                    <div className="inline-flex items-center px-3 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 font-mono font-bold tracking-wider">{c.officer.penNumber}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Service Type</span>
                  <div className="text-sm font-semibold text-gray-900 dark:text-slate-200">{c.officer.serviceType}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Cadre</span>
                  <div className="text-sm font-semibold text-gray-900 dark:text-slate-200">{c.officer.cadre}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Basic Pay</span>
                  <div className="text-sm font-semibold text-gray-900 dark:text-slate-200">₹{c.officer.basicPay?.toLocaleString() || 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Grade & Level</span>
                  <div className="text-sm font-semibold text-gray-900 dark:text-slate-200">{c.officer.grade} | Level {c.officer.level}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Department</span>
                  <div className="text-sm font-semibold text-gray-900 dark:text-slate-200 truncate" title={c.officer.administrativeDepartment}>{c.officer.administrativeDepartment}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Phone</span>
                  <div className="text-sm font-semibold text-gray-900 dark:text-slate-200">{c.officer.mobile}</div>
                </div>
                <div className="space-y-1 col-span-1 md:col-span-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Office Address</span>
                  <div className="text-sm font-semibold text-gray-900 dark:text-slate-200 line-clamp-2" title={c.officer.officeAddress}>{c.officer.officeAddress}</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-cyan-100 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-800 via-cyan-600 to-cyan-800 text-white p-5 flex items-center gap-3">
                <Activity size={24} className="text-cyan-200" />
                <h3 className="text-xl font-bold">Case Information</h3>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50 dark:bg-slate-900/50">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                  <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">MR Number</div>
                  <div className="text-lg font-bold text-cyan-700 dark:text-cyan-400">{c.mrNo}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                  <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Created On</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-slate-200">{new Date(c.createdAt).toLocaleDateString('en-GB')}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/30">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase mb-1">Total Claim Amount</div>
                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">₹{(c.bills.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0) || 0).toLocaleString()}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-rose-100 dark:border-rose-900/30">
                  <div className="text-xs font-bold text-rose-600 dark:text-rose-500 uppercase mb-1">Total Advance Requested</div>
                  <div className="text-lg font-bold text-rose-700 dark:text-rose-400">₹{(c.advances.reduce((acc, a) => acc + (Number(a.amount) || 0), 0) || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}`;

code = code.replace(oldSummaryRegex, newSummary);

fs.writeFileSync(path, code);
