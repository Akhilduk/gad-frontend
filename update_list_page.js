const fs = require('fs');
const path = 'src/app/(officer)/(ais-officer)/reimbursement/medical/page.tsx';

let code = fs.readFileSync(path, 'utf8');

const listPageModernJSX = `  return <div className="min-h-screen p-6 transition-colors duration-300 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800"><div className="max-w-7xl mx-auto space-y-6">
    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-blue-50 dark:border-slate-700 p-8 transition-all duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">Medical Reimbursement</div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Medical reimbursement requests</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Create, find, and continue a case from one clean workspace.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <button className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95" onClick={() => setOpen(true)}>Create New Request</button>
          <div className="text-sm text-slate-500 dark:text-slate-400">{activeCases} active case(s) and {recentCases} recently updated</div>
        </div>
      </div>
    </section>

    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-blue-50 dark:border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-900/20 dark:to-cyan-900/20">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2"><Briefcase className="text-indigo-500" /> Request Explorer</h2>
        </div>
        <div className="w-full md:w-96">
          <input className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="Search by MR No, requester, hospital, status" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="flex space-x-2 p-4 bg-gray-50 dark:bg-slate-800/50 overflow-x-auto border-b border-gray-100 dark:border-slate-700">
        {tabs.map((t) => <button key={t.key} className={\`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all \${tab === t.key ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-slate-600' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50'}\`} onClick={() => setTab(t.key)}><t.icon size={16} /><span>{t.label}</span><b className="ml-1.5 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs">{tabCount(t.key)}</b></button>)}
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">No cases found matching your criteria.</div>
        ) : (
          filtered.map((c, idx) => {
            const tone = statusStyles(c.status);
            const recent = isRecent(c.lastUpdated);
            const actions = availableActions(c);
            const updatedAt = new Date(c.lastUpdated);
            const createdAt = new Date(c.createdAt);
            const startDate = new Date(c.treatment.fromDate);

            return (
            <article key={c.mrId} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-300 relative group overflow-hidden" style={{ animationDelay: \`\${idx * 50}ms\` }}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="flex justify-between items-start mb-4">
                <div className={\`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold \${
                  c.status === 'Draft' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                  c.status.includes('Approved') || c.status.includes('Paid') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' :
                  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300'
                }\`}>{statusLabel(c.status)}</div>
                <div className="text-xs text-gray-500 dark:text-slate-400">{recent ? 'Recently updated' : 'Updated'} {formatShort(updatedAt)}</div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-lg font-bold text-gray-900 dark:text-slate-100">{c.mrNo}</div>
                  {recent && <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>Live</span>}
                </div>
                <div className="text-sm text-gray-600 dark:text-slate-300 font-medium">{c.patient.name} <span className="text-gray-400 font-normal">({c.patient.claimFor === 'SELF' ? 'Self' : c.patient.relation})</span></div>
              </div>

              <div className="space-y-3 mb-6 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700/50">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400">Hospital</span>
                  <strong className="text-gray-900 dark:text-slate-200 text-right w-1/2 truncate" title={c.treatment.hospitalName || 'Not entered'}>{c.treatment.hospitalName || 'Not entered'}</strong>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400">Treatment Date</span>
                  <strong className="text-gray-900 dark:text-slate-200">{formatShort(startDate)}</strong>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400">Created</span>
                  <strong className="text-gray-900 dark:text-slate-200">{formatShort(createdAt)}</strong>
                </div>
              </div>

              <div className="mt-auto">
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mb-1.5">
                    <span>Progress</span>
                    <span>{workflowSteps.indexOf(c.status) + 1} of {workflowSteps.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-1.5 rounded-full transition-all duration-500" style={{ width: \`\${Math.max(10, ((workflowSteps.indexOf(c.status) + 1) / workflowSteps.length) * 100)}%\` }}></div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
                  {actions.map((a) => <button key={\`\${c.mrId}-\${a.label}\`} className="flex-1 min-w-[100px] text-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-2 text-sm font-semibold transition-all" onClick={a.onClick}>{a.label}</button>)}
                </div>
              </div>
            </article>
            );
          })
        )}
      </div>
      <div className="p-4 border-t border-gray-100 dark:border-slate-700 text-center text-sm text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50">Page 1 of 1</div>
    </section>

    {open && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-indigo-100 dark:border-slate-700">
        <div className="p-6 bg-gradient-to-r from-indigo-900 via-indigo-600 to-indigo-900 text-white flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-1">Create Medical Reimbursement Case</h2>
            <p className="text-indigo-100 opacity-90 text-sm">Start a new case by filling out the initial details.</p>
          </div>
          <button onClick={() => { setOpen(false); setHospitalOptions([]); }} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50 dark:bg-slate-900">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Applicant Type</label>
              <div className="flex p-1 bg-gray-100 dark:bg-slate-900 rounded-lg">
                <button className={\`flex-1 py-2 text-sm font-semibold rounded-md transition-all \${claimFor === 'SELF' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}\`} onClick={() => setClaimFor('SELF')}>Self</button>
                <button className={\`flex-1 py-2 text-sm font-semibold rounded-md transition-all \${claimFor === 'DEPENDENT' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}\`} onClick={() => setClaimFor('DEPENDENT')}>Dependent</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Care Journey</label>
              <div className="flex p-1 bg-gray-100 dark:bg-slate-900 rounded-lg">
                <button className={\`flex-1 py-2 text-sm font-semibold rounded-md transition-all \${form.hospitalised ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}\`} onClick={() => setForm((prev) => ({ ...prev, hospitalised: true }))}>Hospitalised</button>
                <button
                  className={\`flex-1 py-2 text-sm font-semibold rounded-md transition-all \${!form.hospitalised ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}\`}
                  onClick={() => {
                    setForm((prev) => ({ ...prev, hospitalised: false, hospitalName: '', hospitalAddress: '' }));
                    setHospitalQuery('');
                    setHospitalOptions([]);
                  }}
                >
                  Not Hospitalised
                </button>
              </div>
            </div>
            {form.hospitalised && (
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Institution Type</label>
                <div className="flex p-1 bg-gray-100 dark:bg-slate-900 rounded-lg max-w-sm">
                  <button className={\`flex-1 py-2 text-sm font-semibold rounded-md transition-all \${form.hospitalType === 'Government' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}\`} onClick={() => setForm((prev) => ({ ...prev, hospitalType: 'Government' }))}>Government</button>
                  <button className={\`flex-1 py-2 text-sm font-semibold rounded-md transition-all \${form.hospitalType === 'Private' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}\`} onClick={() => setForm((prev) => ({ ...prev, hospitalType: 'Private' }))}>Private</button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="font-bold text-lg border-b border-gray-100 dark:border-slate-700 pb-2 text-indigo-900 dark:text-indigo-300">Claim Snapshot</h3>

              {claimFor === 'DEPENDENT' && (
                <div>
                  <select className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 px-4 py-2.5 text-sm outline-none" value={dep} onChange={(e) => setDep(e.target.value)}>
                    <option value="">Select dependent</option>
                    {officer.dependents.map((d) => <option key={d.personId} value={d.personId}>{d.relationType}: {d.fullName}</option>)}
                  </select>
                </div>
              )}

              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                <div className="font-bold text-indigo-900 dark:text-indigo-300 mb-1">Applicant Name: {applicantName || 'Select dependent to continue'}</div>
                <div className="text-sm text-indigo-700/80 dark:text-indigo-400/80">{applicantMeta || 'Dependent basic details will appear here.'}</div>
                {claimFor === 'SELF' && (
                  <div className="text-sm text-indigo-700/80 dark:text-indigo-400/80 mt-2 pt-2 border-t border-indigo-200 dark:border-indigo-800">
                    Designation: {officer.designation} | Grade {officer.grade} | {officer.level}
                  </div>
                )}
              </div>

              <div className="space-y-2 mt-4 text-sm">
                <div className="flex justify-between border-b border-gray-100 dark:border-slate-700 pb-1">
                  <span className="text-gray-500 dark:text-slate-400">Start date</span>
                  <strong className="text-gray-900 dark:text-slate-200">{form.fromDate || 'Pending'}</strong>
                </div>
                <div className="flex justify-between border-b border-gray-100 dark:border-slate-700 pb-1">
                  <span className="text-gray-500 dark:text-slate-400">End date</span>
                  <strong className="text-gray-900 dark:text-slate-200">{form.toDate || 'Optional'}</strong>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-gray-500 dark:text-slate-400">System</span>
                  <strong className="text-gray-900 dark:text-slate-200">{form.medicalType}</strong>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {form.hospitalised && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
                  <h3 className="font-bold text-lg border-b border-gray-100 dark:border-slate-700 pb-2 text-indigo-900 dark:text-indigo-300">Hospital Details</h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Hospital Name</label>
                      <input
                        className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="Type hospital name"
                        value={hospitalQuery}
                        onChange={(e) => {
                          const value = e.target.value;
                          setHospitalQuery(value);
                          setForm((prev) => ({ ...prev, hospitalName: value }));
                        }}
                        onFocus={() => setHospitalFocused(true)}
                        onBlur={() => window.setTimeout(() => setHospitalFocused(false), 140)}
                      />
                      {hospitalFocused && (hospitalLoading || hospitalOptions.length > 0) && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                          {hospitalLoading && <div className="p-3 text-sm text-gray-500">Searching hospitals...</div>}
                          {!hospitalLoading && hospitalOptions.map((opt) => (
                            <button
                              key={\`\${opt.name}-\${opt.address}\`}
                              type="button"
                              className="w-full text-left p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border-b border-gray-100 dark:border-slate-700 last:border-0"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                skipAutocompleteRef.current = true;
                                setHospitalQuery(opt.name);
                                setHospitalOptions([]);
                                setHospitalFocused(false);
                                setForm((prev) => ({ ...prev, hospitalName: opt.name, hospitalAddress: opt.address }));
                              }}
                            >
                              <div className="font-medium text-sm text-gray-900 dark:text-slate-200">{opt.name}</div>
                              <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{opt.address}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Hospital Address</label>
                      <input
                        className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="Hospital full address"
                        value={form.hospitalAddress}
                        onChange={(e) => setForm((prev) => ({ ...prev, hospitalAddress: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
                <h3 className="font-bold text-lg border-b border-gray-100 dark:border-slate-700 pb-2 text-indigo-900 dark:text-indigo-300">Treatment Details</h3>

                {form.hospitalised && (
                  <div className="flex p-1 bg-gray-100 dark:bg-slate-900 rounded-lg">
                    <button className={\`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all \${form.medicalType === 'Allopathy' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400'}\`} onClick={() => setForm((prev) => ({ ...prev, medicalType: 'Allopathy' }))}>Allopathy</button>
                    <button className={\`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all \${form.medicalType === 'Ayurveda' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400'}\`} onClick={() => setForm((prev) => ({ ...prev, medicalType: 'Ayurveda' }))}>Ayurveda</button>
                    <button className={\`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all \${form.medicalType === 'Homeopathy' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400'}\`} onClick={() => setForm((prev) => ({ ...prev, medicalType: 'Homeopathy' }))}>Homeo</button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Start Date</label>
                    <input type="date" className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 px-4 py-2 text-sm focus:border-indigo-500 outline-none" onChange={(e) => setForm((prev) => ({ ...prev, fromDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">End Date <span className="font-normal text-gray-400">(Optional)</span></label>
                    <input type="date" className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 px-4 py-2 text-sm focus:border-indigo-500 outline-none" onChange={(e) => setForm((prev) => ({ ...prev, toDate: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" onChange={(e) => setForm((prev) => ({ ...prev, declaration: e.target.checked }))} />
            I declare that the details provided are true and accurate.
          </label>
          <div className="flex gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 font-semibold hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors" onClick={() => { setOpen(false); setHospitalOptions([]); }}>Cancel</button>
            <button className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold hover:from-indigo-700 hover:to-blue-700 shadow-md transition-all disabled:opacity-50" onClick={onCreate}>Create MR Case</button>
          </div>
        </div>
      </div>
    </div>}
  </div></div>;`;

const targetStartString = "return <div className={styles.mrShell}><div className={styles.container}>";
const targetEndString = "  </div></div>;\n}";

const startIndex = code.indexOf(targetStartString);
const endIndex = code.lastIndexOf(targetEndString) + targetEndString.length;

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + listPageModernJSX + "\n}\n";
  fs.writeFileSync(path, code);
  console.log("page.tsx updated with gradient modern ui.");
} else {
  console.log("Could not find replacement block in page.tsx");
}
