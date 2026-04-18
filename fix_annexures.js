const fs = require('fs');
const path = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx';

let code = fs.readFileSync(path, 'utf8');

// The user wants:
// 1. Redesigned Bills List (showing Bill Name/No, GST No, Hospital Name, and Amount explicitly)
// 2. Redesigned Bill Upload Popup (highly distinguishable fields, modern, colorful)

const oldBillsListRegex = /\{c\.bills\.length > 0 && \([\s\S]*?<\/div>\s*<\/div>\s*\)\}/;
const newBillsList = `{c.bills.length > 0 && (
                   <div className="mb-6">
                     <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-400 uppercase tracking-wider mb-4 border-b border-indigo-100 dark:border-slate-700 pb-2">Medical Bills</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {c.bills.map((b) => (
                         <div key={b.id} className="bg-white dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                           <div className="bg-gradient-to-r from-slate-50 to-indigo-50/50 dark:from-slate-900 dark:to-indigo-900/20 px-4 py-3 border-b border-indigo-50 dark:border-slate-700 flex justify-between items-center">
                             <div className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                               <FileText size={16} className="text-indigo-400" />
                               {b.invoiceNo || 'Untitled Bill'}
                             </div>
                             <span className={\`text-xs font-bold px-2 py-0.5 rounded-md \${b.status === 'Extracted' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'}\`}>{b.status}</span>
                           </div>

                           <div className="p-4 space-y-3">
                             <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                               <div>
                                 <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Hospital / Vendor</div>
                                 <div className="font-medium text-slate-900 dark:text-slate-200 truncate" title={b.hospitalName || '-'}>{b.hospitalName || '-'}</div>
                               </div>
                               <div>
                                 <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Bill Date</div>
                                 <div className="font-medium text-slate-900 dark:text-slate-200">{formatDMY(b.billDate) || '-'}</div>
                               </div>
                               <div>
                                 <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">GST No</div>
                                 <div className="font-medium text-slate-900 dark:text-slate-200">{b.gstNo || '-'}</div>
                               </div>
                               <div>
                                 <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Amount</div>
                                 <div className="font-bold text-lg text-emerald-600 dark:text-emerald-400">₹{b.totalAmount?.toLocaleString() || '0'}</div>
                               </div>
                             </div>
                             <div className="text-xs text-slate-400 truncate pt-2 border-t border-slate-50 dark:border-slate-700/50">File: {b.fileName}</div>
                           </div>

                           <div className="flex bg-slate-50 dark:bg-slate-900/50 border-t border-indigo-50 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button className="flex-1 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition-colors" onClick={() => startBillEdit(b)}>Edit Bill</button>
                             <div className="w-px bg-indigo-100 dark:bg-slate-700"></div>
                             <button className="flex-1 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 dark:text-rose-400 dark:hover:bg-rose-900/50 transition-colors" onClick={() => updateCase({ ...c, bills: c.bills.filter(x => x.id !== b.id) }, 'Bill deleted')}>Delete</button>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}`;
code = code.replace(oldBillsListRegex, newBillsList);


// 3. Update the Bill Popup UI
const oldPopupRegex = /\{billEditId && \([\s\S]*?<h3 className=\{styles\.modernCardTitle\}>Upload Bill<\/h3>[\s\S]*?<div className=\{styles\.modernGrid2\}>[\s\S]*?<div className="mt-6 flex justify-end gap-3 p-6 border-t border-gray-100">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;
const newPopup = `{billEditId && (
        <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animateFadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-indigo-100 dark:border-slate-700">

            <div className="bg-gradient-to-r from-indigo-900 via-indigo-600 to-indigo-900 p-6 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Edit Bill Details</h3>
                  <p className="text-indigo-200 text-xs mt-0.5">Review and update extracted bill data</p>
                </div>
              </div>
              <button onClick={() => { setBillEditId(''); setBillDraft(null); }} className="text-indigo-200 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors">✕</button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 space-y-6">

              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">Primary Information</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Bill Number</label>
                    <input className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-inner" value={billDraft?.invoiceNo || ''} onChange={(e) => setBillDraft(prev => prev ? { ...prev, invoiceNo: e.target.value } : null)} placeholder="e.g. INV-1001" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Bill Date</label>
                    <input type="date" className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-inner" value={billDraft?.billDate || ''} onChange={(e) => setBillDraft(prev => prev ? { ...prev, billDate: e.target.value } : null)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Hospital / Vendor Name</label>
                    <input className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-inner" value={billDraft?.hospitalName || ''} onChange={(e) => setBillDraft(prev => prev ? { ...prev, hospitalName: e.target.value } : null)} placeholder="Hospital Name" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">Financials & Tax</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">GST No.</label>
                    <input className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-inner uppercase" value={billDraft?.gstNo || ''} onChange={(e) => setBillDraft(prev => prev ? { ...prev, gstNo: e.target.value } : null)} placeholder="22AAAAA0000A1Z5" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                    <select className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-inner" value={billDraft?.status || 'Extracted'} onChange={(e) => setBillDraft(prev => prev ? { ...prev, status: e.target.value as any } : null)}>
                      <option value="Extracted">Extracted</option>
                      <option value="Reviewed">Reviewed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tax Amount (₹)</label>
                    <input type="number" className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-inner" value={billDraft?.taxAmount || ''} onChange={(e) => setBillDraft(prev => prev ? { ...prev, taxAmount: Number(e.target.value) } : null)} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-indigo-700 dark:text-indigo-400 mb-1.5">Total Amount (₹)</label>
                    <input type="number" className="w-full rounded-lg border border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 text-lg font-bold text-indigo-900 dark:text-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner" value={billDraft?.totalAmount || ''} onChange={(e) => setBillDraft(prev => prev ? { ...prev, totalAmount: Number(e.target.value) } : null)} />
                  </div>
                </div>
              </div>

            </div>

            <div className="bg-white dark:bg-slate-800 p-5 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3 shrink-0">
              <button onClick={() => { setBillEditId(''); setBillDraft(null); }} className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSaveBill} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                <CheckCircle size={18} /> Save Details
              </button>
            </div>
          </div>
        </div>
      )}`;
code = code.replace(oldPopupRegex, newPopup);


fs.writeFileSync(path, code);
