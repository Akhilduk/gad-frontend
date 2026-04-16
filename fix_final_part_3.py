import re

with open('src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx', 'r') as f:
    content = f.read()

# Certificate Tab Modernization
content = content.replace(
    '''{active === 'CERTIFICATE' && (
          <div className={styles.page}>
            <div className={styles.sectionHeadRow}>
              <div className={styles.sectionActions}>
                <button className={styles.btnPrimary} onClick={downloadEssentialityCertificate}>Download Essentiality Certificate</button>
                <input ref={ecSignedUploadRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={onSignedEcUpload} />
                <button className={styles.btnSecondary} onClick={() => ecSignedUploadRef.current?.click()}>Upload Signed EC</button>
              </div>
            </div>
            <div className={styles.sectionGrid2}>
              <div className={styles.sectionCard}>
                <div className={styles.summaryHead}>Certificate Details</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className={styles.formLabel}>Authorized Medical Attendant</label>
                    <input className={styles.field} value={ecMeta.amaName} onChange={(e) => setEcMeta((p) => ({ ...p, amaName: e.target.value }))} />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Designation</label>
                    <input className={styles.field} value={ecMeta.amaDesignation} onChange={(e) => setEcMeta((p) => ({ ...p, amaDesignation: e.target.value }))} />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Medical Registration No.</label>
                    <input className={styles.field} value={ecMeta.regNo} onChange={(e) => setEcMeta((p) => ({ ...p, regNo: e.target.value }))} />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Date of Certificate</label>
                    <input type="date" className={styles.field} value={ecMeta.certificateDate} onChange={(e) => setEcMeta((p) => ({ ...p, certificateDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Hospital / Institution</label>
                    <input className={styles.field} value={ecMeta.institutionName} onChange={(e) => setEcMeta((p) => ({ ...p, institutionName: e.target.value }))} />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Signature Name</label>
                    <input className={styles.field} value={ecMeta.signatureName} onChange={(e) => setEcMeta((p) => ({ ...p, signatureName: e.target.value }))} />
                  </div>
                  <div className={styles.sectionFormSpan}>
                    <label className={styles.formLabel}>Institution Address</label>
                    <input className={styles.field} value={ecMeta.institutionAddress} onChange={(e) => setEcMeta((p) => ({ ...p, institutionAddress: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className={styles.sectionCard}>
                <div className={styles.summaryHead}>Auto-fill Summary</div>
                <div className={styles.summaryKVs}>
                  <div className={styles.summaryLabel}>Officer</div><div className={styles.summaryValue}>{c.officer.fullName} ({c.officer.serviceType})</div>
                  <div className={styles.summaryLabel}>Designation</div><div className={styles.summaryValue}>{c.officer.designation}</div>
                  <div className={styles.summaryLabel}>Treatment Period</div><div className={styles.summaryValue}>{c.treatment.fromDate} - {c.treatment.toDate || '-'}</div>
                  <div className={styles.summaryLabel}>Condition</div><div className={styles.summaryValue}>{c.treatment.diagnosis || '-'}</div>
                  <div className={styles.summaryLabel}>Hospitalisation</div><div className={styles.summaryValue}>{c.treatment.hospitalised ? 'Required hospitalization' : 'Did not require hospitalization'}</div>
                  <div className={styles.summaryLabel}>Total Bills</div><div className={styles.summaryValue}>{rupee(billsTotal(c))}</div>
                </div>
              </div>
            </div>
            <div className="border p-3 bg-white rounded mt-2">
              <h4 className={styles.labelText}>Statement of Medicines / Investigations</h4>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>SlNo</th>
                      <th>Bill No & Date</th>
                      <th>Medicine</th>
                      <th>Chemical</th>
                      <th>Qty</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.bills.map((b, i) => (
                      <tr key={b.id}>
                        <td>{i + 1}</td>
                        <td>{b.invoiceNo} {b.billDate}</td>
                        <td>{b.fileName}</td>
                        <td>-</td>
                        <td>-</td>
                        <td>{b.totalAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={`${styles.bodyText} mt-2`}>Total Amount {rupee(billsTotal(c))} | Signed EC uploaded: {c.docs.some((d) => d.type === 'EC_SIGNED') ? 'Yes' : 'No'}</div>
            </div>
          </div>
        )}''',
    '''{active === 'CERTIFICATE' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b border-slate-100 gap-4">
              <div className="flex items-center gap-3"><Pill className="w-6 h-6 text-indigo-600" aria-hidden="true" /><h3 className="text-xl font-bold text-slate-800">Essentiality Certificate</h3></div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button className={`${styles.btnSecondary} flex items-center justify-center gap-2 flex-1 md:flex-none`} onClick={downloadEssentialityCertificate}><FileText className="w-4 h-4" /> Download EC Template</button>
                <input ref={ecSignedUploadRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={onSignedEcUpload} />
                <button className={`${styles.btnPrimary} flex items-center justify-center gap-2 flex-1 md:flex-none`} onClick={() => ecSignedUploadRef.current?.click()}><Activity className="w-4 h-4" /> Upload Signed EC</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5">Certificate Metadata</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Authorized Medical Attendant</label><input className={styles.field} value={ecMeta.amaName} onChange={(e) => setEcMeta((p) => ({ ...p, amaName: e.target.value }))} /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Designation</label><input className={styles.field} value={ecMeta.amaDesignation} onChange={(e) => setEcMeta((p) => ({ ...p, amaDesignation: e.target.value }))} /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Medical Registration No.</label><input className={styles.field} value={ecMeta.regNo} onChange={(e) => setEcMeta((p) => ({ ...p, regNo: e.target.value }))} /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Date of Certificate</label><input type="date" className={styles.field} value={ecMeta.certificateDate} onChange={(e) => setEcMeta((p) => ({ ...p, certificateDate: e.target.value }))} /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-bold text-slate-700 mb-2">Hospital / Institution</label><input className={styles.field} value={ecMeta.institutionName} onChange={(e) => setEcMeta((p) => ({ ...p, institutionName: e.target.value }))} /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-bold text-slate-700 mb-2">Institution Address</label><input className={styles.field} value={ecMeta.institutionAddress} onChange={(e) => setEcMeta((p) => ({ ...p, institutionAddress: e.target.value }))} /></div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                  <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-4 border-b border-indigo-100 pb-2">Document Pre-fill Data</h4>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-3 gap-2"><div className="text-slate-500 font-medium">Officer</div><div className="col-span-2 font-semibold text-slate-900">{c.officer.fullName}</div></div>
                    <div className="grid grid-cols-3 gap-2"><div className="text-slate-500 font-medium">Designation</div><div className="col-span-2 font-semibold text-slate-900">{c.officer.designation}</div></div>
                    <div className="grid grid-cols-3 gap-2"><div className="text-slate-500 font-medium">Treatment</div><div className="col-span-2 font-medium text-slate-800">{c.treatment.fromDate} - {c.treatment.toDate || 'Present'}</div></div>
                    <div className="grid grid-cols-3 gap-2"><div className="text-slate-500 font-medium">Condition</div><div className="col-span-2 font-medium text-slate-800">{c.treatment.diagnosis || 'Not specified'}</div></div>
                    <div className="grid grid-cols-3 gap-2"><div className="text-slate-500 font-medium">Admitted</div><div className="col-span-2 font-medium text-slate-800">{c.treatment.hospitalised ? 'Yes' : 'No'}</div></div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-indigo-200">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-bold text-slate-700">Signed EC Uploaded</div>
                      {c.docs.some((d) => d.type === 'EC_SIGNED') ? (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md">Verified</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-md">Missing</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200">
              <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-500" /> Statement of Medicines & Investigations</h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3 border-b border-slate-200 w-16">SlNo</th>
                      <th className="px-4 py-3 border-b border-slate-200">Bill No & Date</th>
                      <th className="px-4 py-3 border-b border-slate-200">Medicine / Details</th>
                      <th className="px-4 py-3 border-b border-slate-200 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {c.bills.map((b, i) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-700">{b.invoiceNo} <span className="text-slate-400 font-normal">({formatDMY(b.billDate)})</span></td>
                        <td className="px-4 py-3 text-slate-600">{b.fileName}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">{rupee(b.totalAmount)}</td>
                      </tr>
                    ))}
                    {c.bills.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No bills added yet.</td></tr>}
                  </tbody>
                  <tfoot className="bg-slate-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-bold text-slate-700 uppercase text-xs tracking-wider">Total Certified Amount</td>
                      <td className="px-4 py-3 text-right font-black text-indigo-700 text-base">{rupee(billsTotal(c))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}'''
)


# Final Note Tab Modernization (Merge PDF UI replica)
content = content.replace(
    '''{active === 'FINAL NOTE' && (
          <div className={styles.page}>
            <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-2xl">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-indigo-600" /> Final Claim Submission
              </h3>

              <div className="mb-6 p-4 rounded-md bg-slate-50 border border-slate-100">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Claim Overview</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Total Bills</div>
                    <div className="text-base font-semibold text-slate-900">{rupee(billsTotal(c))}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Advance Received</div>
                    <div className="text-base font-medium text-slate-700">{rupee(advancePaid(c))}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Net Payable Claim</div>
                    <div className="text-lg font-bold text-green-700">{rupee(billsTotal(c) - advancePaid(c))}</div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Pre-submission Checklist</h4>
                {checks.length > 0 ? (
                  <ul className="space-y-2 mb-4">
                    {checks.map((m) => (
                      <li key={m} className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
                        <span className="shrink-0 mt-0.5">•</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded border border-green-200 mb-4">
                    <ClipboardCheck className="w-4 h-4" />
                    <span>All required documents and details are complete. Ready for final review.</span>
                  </div>
                )}
              </div>

              <div className="mb-6">
                 <label className="block text-sm font-medium text-slate-700 mb-1">Select Approving Medical Authority (AMA)</label>
                 <select className={styles.field}>
                   <option value="">-- Select Authority --</option>
                   <option value="AMA-01">Director of Health Services</option>
                   <option value="AMA-02">District Medical Officer</option>
                 </select>
                 <p className="mt-1 text-xs text-slate-500">Required for routing the claim for final administrative approval.</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button className={`${styles.btnPrimary} w-full justify-center`} disabled={checks.length > 0} onClick={openFinalPreview}>
                  {checks.length > 0 ? 'Fix missing items to Preview' : 'Preview Final Claim Document'}
                </button>
              </div>
            </div>
          </div>
        )}''',
    '''{active === 'FINAL NOTE' && (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-inner p-6 lg:p-10 flex justify-center">
            <div className="bg-white border border-slate-200 shadow-xl max-w-4xl w-full" style={{ minHeight: '800px', padding: '48px 64px' }}>
              <div className="text-center mb-10 border-b-2 border-slate-800 pb-6">
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-widest mb-1">Government of Kerala</h1>
                <h2 className="text-lg font-bold text-slate-700 uppercase tracking-wider mb-4">Medical Reimbursement Claim Form</h2>
                <div className="flex justify-between items-end text-sm font-semibold text-slate-600">
                  <div>Claim ID: {c.mrNo}</div>
                  <div>Date: {new Date().toLocaleDateString('en-GB')}</div>
                </div>
              </div>

              <div className="space-y-8 text-sm text-slate-800">
                <section>
                  <h3 className="font-bold text-base uppercase bg-slate-100 px-3 py-1.5 border-l-4 border-slate-800 mb-4">1. Officer Particulars</h3>
                  <div className="grid grid-cols-2 gap-y-4 px-3">
                    <div className="flex gap-2"><span className="font-semibold w-32">Name:</span> <span>{c.officer.fullName}</span></div>
                    <div className="flex gap-2"><span className="font-semibold w-32">Designation:</span> <span>{c.officer.designation}</span></div>
                    <div className="flex gap-2"><span className="font-semibold w-32">PEN No:</span> <span>{c.officer.penNumber}</span></div>
                    <div className="flex gap-2"><span className="font-semibold w-32">Basic Pay:</span> <span>{rupee(c.officer.basicPay)}</span></div>
                    <div className="flex gap-2 col-span-2"><span className="font-semibold w-32">Department:</span> <span>{c.officer.administrativeDepartment}</span></div>
                  </div>
                </section>

                <section>
                  <h3 className="font-bold text-base uppercase bg-slate-100 px-3 py-1.5 border-l-4 border-slate-800 mb-4">2. Patient & Treatment</h3>
                  <div className="grid grid-cols-2 gap-y-4 px-3">
                    <div className="flex gap-2"><span className="font-semibold w-32">Patient Name:</span> <span>{c.patient.name}</span></div>
                    <div className="flex gap-2"><span className="font-semibold w-32">Relation:</span> <span>{c.patient.relation}</span></div>
                    <div className="flex gap-2 col-span-2"><span className="font-semibold w-32">Hospital:</span> <span>{c.treatment.hospitalName} ({c.treatment.hospitalType})</span></div>
                    <div className="flex gap-2 col-span-2"><span className="font-semibold w-32">Diagnosis:</span> <span>{c.treatment.diagnosis || 'Not specified'}</span></div>
                    <div className="flex gap-2"><span className="font-semibold w-32">Period:</span> <span>{formatDMY(c.treatment.fromDate)} to {formatDMY(c.treatment.toDate)}</span></div>
                    <div className="flex gap-2"><span className="font-semibold w-32">System:</span> <span>{c.treatment.medicalType}</span></div>
                  </div>
                </section>

                <section>
                  <h3 className="font-bold text-base uppercase bg-slate-100 px-3 py-1.5 border-l-4 border-slate-800 mb-4">3. Claim Settlement Abstract</h3>
                  <div className="border border-slate-800 rounded-md overflow-hidden mb-6">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-800">
                          <th className="px-4 py-2 font-bold border-r border-slate-800">Description</th>
                          <th className="px-4 py-2 font-bold text-right w-40">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-300">
                          <td className="px-4 py-2 border-r border-slate-800">Gross Value of Verified Bills ({c.bills.length} Nos)</td>
                          <td className="px-4 py-2 text-right font-medium">{billsTotal(c).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr className="border-b border-slate-300">
                          <td className="px-4 py-2 border-r border-slate-800">Less: Medical Advance Received</td>
                          <td className="px-4 py-2 text-right font-medium">{advancePaid(c).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr className="bg-slate-50 font-bold text-base">
                          <td className="px-4 py-3 border-r border-slate-800 text-right uppercase">Net Amount Claimed</td>
                          <td className="px-4 py-3 text-right">{(billsTotal(c) - advancePaid(c)).toLocaleString('en-IN')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {checks.length > 0 ? (
                  <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-8">
                    <h4 className="font-bold text-red-800 uppercase text-xs mb-2">Claim Validation Failed</h4>
                    <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                      {checks.map((m) => <li key={m}>{m}</li>)}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 mb-8 flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                    <div>
                      <h4 className="font-bold text-emerald-800 uppercase text-xs mb-0.5">Validation Passed</h4>
                      <p className="text-sm text-emerald-700">All mandatory documents and fields have been verified for e-submission.</p>
                    </div>
                  </div>
                )}

                <div className="pt-8 flex justify-end gap-4 border-t-2 border-dashed border-slate-300 print:hidden">
                  <select className={`${styles.field} !w-72 !py-2 !text-sm bg-slate-50 border-slate-300`} defaultValue="">
                   <option value="" disabled>-- Routing Authority --</option>
                   <option value="AMA-01">Director of Health Services</option>
                   <option value="AMA-02">District Medical Officer</option>
                  </select>
                  <button className={`${styles.btnPrimary} !px-8 !py-2`} disabled={checks.length > 0} onClick={openFinalPreview}>
                    {checks.length > 0 ? 'Resolve Issues' : 'Proceed to e-Sign'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}'''
)

# Movement register tab modernization
content = content.replace(
    '''{active === 'MOVEMENT REGISTER' && (
          <div className={styles.page}>
            {c.movement.map((m, i) => (
              <div key={m.id} className={styles.ledgerRow}>
                <div className={styles.bodyText}>{i + 1}. {m.action}</div>
                <div className={styles.bodyText}>{new Date(m.at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}''',
    '''{active === 'MOVEMENT REGISTER' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-10">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100"><Activity className="w-6 h-6 text-indigo-600" aria-hidden="true" /><h3 className="text-xl font-bold text-slate-800">Audit & Movement Ledger</h3></div>
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-4">
              {c.movement.map((m, i) => (
                <div key={m.id} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-indigo-500 shadow-sm"></div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <div className="font-semibold text-slate-800 text-sm leading-relaxed">{m.action}</div>
                      <div className="text-xs font-medium text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200 whitespace-nowrap">{new Date(m.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">Actor: {c.officer.fullName} (Initiator)</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}'''
)

# Add CheckCircle to imports safely
content = content.replace(
    '''ClipboardCheck, UserCircle2, Stethoscope, FileText, IndianRupee, Pill } from 'lucide-react';''',
    '''ClipboardCheck, UserCircle2, Stethoscope, FileText, IndianRupee, Pill, CheckCircle } from 'lucide-react';'''
)

with open('src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx', 'w') as f:
    f.write(content)
