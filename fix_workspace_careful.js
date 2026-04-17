const fs = require('fs');

const origPath = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx';
let data = fs.readFileSync(origPath, 'utf8');

// The main return is `  return (\n    <div className={styles.mrShell}>\n      <div className={styles.container}>\n        <section className={styles.mrWorkspaceTopBar}>`
let renderStart = data.indexOf('  return (\n    <div className={styles.mrShell}>\n      <div className={styles.container}>\n        <section className={styles.mrWorkspaceTopBar}>');

let logicPart = data.substring(0, renderStart);

const newRender = `  return (
    <div className={styles.modernContainer}>
      {toast && <div className={styles.mrToast}>{toast}</div>}
      <div className={styles.modernHeader}>
        <div>
          <h1 className={styles.modernHeaderTitle}>Medical Reimbursement Application</h1>
          <div className={styles.modernHeaderSubtitle}>Workspace for {c.mrNo}</div>
        </div>
        <div>
          <span className={styles.modernBadgeInfo}>{c.status}</span>
        </div>
      </div>

      <div className={styles.modernTabs}>
        {workflowTabs.map(tab => (
          <div
            key={tab}
            className={\`\${styles.modernTab} \${active === tab ? styles.modernTabActive : ''}\`}
            onClick={() => goToStep(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '2rem' }}>

        {billEditId && billDraft && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className={styles.modernCard} style={{ width: '500px', maxWidth: '90%' }}>
              <div className={styles.modernCardHeader}><h3 className={styles.modernCardTitle}>Preview / Edit Bill Details</h3></div>
              <div className={styles.modernGrid2}>
                <div className={styles.modernFormGroup}>
                  <label className={styles.modernLabel}>Invoice No</label>
                  <input className={styles.modernInput} value={billDraft.invoiceNo} onChange={(e) => setBillDraft({ ...billDraft, invoiceNo: e.target.value })} />
                </div>
                <div className={styles.modernFormGroup}>
                  <label className={styles.modernLabel}>Amount (₹)</label>
                  <input type="number" className={styles.modernInput} value={billDraft.totalAmount} onChange={(e) => setBillDraft({ ...billDraft, totalAmount: Number(e.target.value) || 0 })} />
                </div>
              </div>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className={styles.modernBtnSecondary} onClick={() => { setBillEditId(''); setBillDraft(null); }}>Cancel</button>
                <button className={styles.modernBtnPrimary} onClick={saveBillEdit}>Save Bill</button>
              </div>
            </div>
          </div>
        )}

        {active === 'SUMMARY' && (
          <div className={\`\${styles.modernCard} \${styles.animateFadeIn}\`}>
            <div className={styles.modernCardHeader}>
              <Activity className="text-blue-500" size={24} />
              <h3 className={styles.modernCardTitle}>Application Summary</h3>
            </div>
            <div className={styles.modernGrid3}>
              <div className={styles.modernFormGroup}>
                <span className={styles.modernLabel}>Applicant Name</span>
                <span className={styles.modernValue}>{c.officer.fullName}</span>
              </div>
              <div className={styles.modernFormGroup}>
                <span className={styles.modernLabel}>Designation</span>
                <span className={styles.modernValue}>{c.officer.designation}</span>
              </div>
              <div className={styles.modernFormGroup}>
                <span className={styles.modernLabel}>MR Number</span>
                <span className={styles.modernValue}>{c.mrNo}</span>
              </div>
              <div className={styles.modernFormGroup}>
                <span className={styles.modernLabel}>Created On</span>
                <span className={styles.modernValue}>{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <div className={styles.modernFormGroup}>
                <span className={styles.modernLabel}>Total Claim</span>
                <span className={styles.modernValue}>₹{totalClaimAmount.toLocaleString()}</span>
              </div>
              <div className={styles.modernFormGroup}>
                <span className={styles.modernLabel}>Total Advance Requested</span>
                <span className={styles.modernValue}>₹{totalAdvanceRequested.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {active === 'TREATMENT NOTE' && (
          <div className={\`\${styles.modernCard} \${styles.animateFadeIn}\`}>
            <div className={styles.modernCardHeader}>
              <Stethoscope className="text-blue-500" size={24} />
              <h3 className={styles.modernCardTitle}>Treatment Details</h3>
            </div>
            <div className={styles.modernGrid2}>
              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>Diagnosis</label>
                <input
                  className={styles.modernInput}
                  value={treatmentDraft.diagnosis.split(' | ')[0] || ''}
                  onChange={(e) => setTreatmentDraft({ ...treatmentDraft, diagnosis: e.target.value })}
                  placeholder="e.g. Viral Fever"
                />
              </div>
              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>Medical Type</label>
                <select
                  className={styles.modernSelect}
                  value={treatmentDraft.medicalType || 'Allopathy'}
                  onChange={(e) => setTreatmentDraft({ ...treatmentDraft, medicalType: e.target.value })}
                >
                  <option>Allopathy</option>
                  <option>Ayurveda</option>
                  <option>Homeopathy</option>
                </select>
              </div>
              <div className={styles.modernFormGroup} style={{ gridColumn: 'span 2' }}>
                <label className={styles.modernLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={treatmentDraft.hospitalised}
                    onChange={(e) => setTreatmentDraft({ ...treatmentDraft, hospitalised: e.target.checked })}
                    style={{ width: '16px', height: '16px', borderRadius: '4px' }}
                  />
                  Patient was hospitalised
                </label>
              </div>
              {treatmentDraft.hospitalised && (
                <>
                  <div className={styles.modernFormGroup}>
                    <label className={styles.modernLabel}>Hospital Name</label>
                    <input
                      className={styles.modernInput}
                      value={treatmentDraft.hospitalName}
                      onChange={(e) => setTreatmentDraft({ ...treatmentDraft, hospitalName: e.target.value })}
                    />
                  </div>
                  <div className={styles.modernFormGroup}>
                    <label className={styles.modernLabel}>Hospital Address</label>
                    <input
                      className={styles.modernInput}
                      value={treatmentDraft.hospitalAddress}
                      onChange={(e) => setTreatmentDraft({ ...treatmentDraft, hospitalAddress: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className={styles.modernBtnPrimary} onClick={saveTreatment}>
                <Save size={18} /> Save Treatment Note
              </button>
            </div>
          </div>
        )}

        {active === 'ANNEXURES' && (
          <div className={\`\${styles.modernCard} \${styles.animateFadeIn}\`}>
             <div className={styles.modernCardHeader} style={{ justifyContent: 'space-between' }}>
               <div style={{ display: 'flex', alignItems: 'center' }}>
                 <FileText className="text-blue-500" size={24} />
                 <h3 className={styles.modernCardTitle}>Annexures & Bills</h3>
               </div>
               <div style={{ display: 'flex', gap: '12px' }}>
                 <select className={styles.modernSelect} value={docType} onChange={e => setDocType(e.target.value as DocType)} style={{ width: 'auto' }}>
                    <option value="OP Ticket">OP Ticket</option>
                    <option value="Discharge Summary">Discharge Summary</option>
                    <option value="Medical Report">Medical Report</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Other">Other</option>
                 </select>
                 <button className={styles.modernBtnSecondary} onClick={() => docUploadRef.current?.click()}>
                   <Upload size={18} /> Upload Doc
                 </button>
                 <button className={styles.modernBtnPrimary} onClick={() => billUploadRef.current?.click()}>
                   <Upload size={18} /> Upload Bill
                 </button>
               </div>
             </div>
             <input type="file" ref={billUploadRef} style={{ display: 'none' }} accept=".pdf,.jpg,.png" onChange={onBillUpload} />
             <input type="file" ref={docUploadRef} style={{ display: 'none' }} accept=".pdf,.jpg,.png" onChange={onDocUpload} />

             {c.bills.length === 0 && c.docs.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>No bills or documents uploaded yet.</div>
             ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                 {c.bills.length > 0 && (
                   <div>
                     <h4 className={styles.modernLabel} style={{ marginBottom: '12px' }}>Bills</h4>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                       {c.bills.map((b) => (
                         <div key={b.id} className={styles.modernStatCard} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div className={styles.modernValue}>{b.invoiceNo}</div>
                                <div className={styles.modernLabel}>File: {b.fileName}</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div className={styles.modernStatValue} style={{ fontSize: '1.25rem' }}>₹{b.totalAmount}</div>
                                <button className={styles.modernBtnSecondary} onClick={() => startBillEdit(b)}>Edit</button>
                                <button className={styles.modernBtnDanger} onClick={() => removeBill(b.id)}>Delete</button>
                              </div>
                            </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {c.docs.filter(d => d.type !== 'EC_SIGNED').length > 0 && (
                   <div>
                     <h4 className={styles.modernLabel} style={{ marginBottom: '12px' }}>Other Documents</h4>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                       {c.docs.filter(d => d.type !== 'EC_SIGNED').map((d) => (
                         <div key={d.id} className={styles.modernStatCard} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div className={styles.modernValue}>{d.type}</div>
                              <div className={styles.modernLabel}>File: {d.fileName}</div>
                            </div>
                            <button className={styles.modernBtnDanger} onClick={() => removeDoc(d.id)}>Delete</button>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

               </div>
             )}
          </div>
        )}

        {active === 'ADVANCE NOTES' && (
           <div className={\`\${styles.modernCard} \${styles.animateFadeIn}\`}>
             <div className={styles.modernCardHeader} style={{ justifyContent: 'space-between' }}>
               <div style={{ display: 'flex', alignItems: 'center' }}>
                 <IndianRupee className="text-blue-500" size={24} />
                 <h3 className={styles.modernCardTitle}>Advances</h3>
               </div>
               <button className={styles.modernBtnSecondary} onClick={() => setAdvanceFormOpen(!advanceFormOpen)}>
                 {advanceFormOpen ? 'Cancel Request' : 'Request Advance'}
               </button>
             </div>

             {advanceFormOpen && (
               <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                 <div className={styles.modernGrid2}>
                   <div className={styles.modernFormGroup}>
                     <label className={styles.modernLabel}>Advance Amount (₹)</label>
                     <input type="number" className={styles.modernInput} value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} />
                   </div>
                   <div className={styles.modernFormGroup}>
                     <label className={styles.modernLabel}>Estimate Document</label>
                     <div style={{ display: 'flex', gap: '8px' }}>
                       <input type="file" ref={estimateUploadRef} style={{ display: 'none' }} onChange={(e) => {
                         if (e.target.files?.[0]) {
                           setEstimateFileName(e.target.files[0].name);
                           setToast('Estimate document attached');
                           setTimeout(() => setToast(''), 2000);
                         }
                       }} />
                       <button className={styles.modernBtnSecondary} onClick={() => estimateUploadRef.current?.click()} style={{ flex: 1 }}>
                         <Upload size={16} /> {estimateFileName || 'Upload Estimate'}
                       </button>
                     </div>
                   </div>
                 </div>
                 <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                   <button className={styles.modernBtnPrimary} onClick={submitAdvanceRequest} disabled={!advanceAmount || !estimateFileName}>
                     Submit Advance Request
                   </button>
                 </div>
               </div>
             )}

             {c.advances.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>No advance requests made.</div>
             ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {c.advances.map(a => (
                   <div key={a.advId} className={styles.modernStatCard} style={{ justifyContent: 'space-between' }}>
                     <div>
                       <div className={styles.modernValue}>₹{a.amount.toLocaleString()}</div>
                       <div className={styles.modernLabel}>Status: <span className={styles.modernBadgeInfo}>{a.status}</span></div>
                     </div>
                     <div className={styles.modernLabel}>Requested on {new Date(a.submittedAt || new Date()).toLocaleDateString()}</div>
                   </div>
                 ))}
               </div>
             )}
           </div>
        )}

        {active === 'CERTIFICATE' && (
          <div className={\`\${styles.modernCard} \${styles.animateFadeIn}\`}>
             <div className={styles.modernCardHeader} style={{ justifyContent: 'space-between' }}>
               <div style={{ display: 'flex', alignItems: 'center' }}>
                 <FileCheck className="text-blue-500" size={24} />
                 <h3 className={styles.modernCardTitle}>Essentiality Certificate</h3>
               </div>
             </div>

             <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
               <button className={styles.modernBtnSecondary} onClick={downloadEssentialityCertificate}>
                 <Download size={18} /> Download Generated EC
               </button>
               <div>
                 <input type="file" ref={ecSignedUploadRef} style={{ display: 'none' }} accept=".pdf,.jpg,.png" onChange={onSignedEcUpload} />
                 <button className={styles.modernBtnPrimary} onClick={() => ecSignedUploadRef.current?.click()}>
                   <Upload size={18} /> Upload Signed EC
                 </button>
               </div>
             </div>

             {c.docs.filter(d => d.type === 'EC_SIGNED').length > 0 && (
                <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0', color: '#15803d', fontWeight: 500 }}>
                  Signed Essentiality Certificate is uploaded and verified.
                </div>
             )}
          </div>
        )}

        {active === 'FINAL NOTE' && (
          <div className={styles.mrStagePanel}>
            <div className={styles.mrStageHeader}>
              <div>
                <div className={styles.mrSectionEyebrow}>Final Documentation</div>
                <h3 className={styles.mrSectionTitle}>Final Note</h3>
              </div>
            </div>
            <div className={styles.mrA4Preview}>
              <div className={styles.mrA4Header}>
                <h2>Final Claim Submission Note</h2>
                <div className={styles.mrA4Meta}>
                  <div><strong>MR Number:</strong> {c.mrNo}</div>
                  <div><strong>Officer:</strong> {c.officer.fullName}</div>
                </div>
              </div>
              <div className={styles.mrA4Body}>
                <p><strong>1. Applicant Details:</strong> {c.officer.fullName}, {c.officer.designation}</p>
                <p><strong>2. Treatment Details:</strong> Patient was {treatmentDraft.hospitalised ? 'hospitalised' : 'treated as outpatient'} for {treatmentDraft.diagnosis.split(' | ')[0] || 'Medical treatment'} at {treatmentDraft.hospitalName || 'the facility'}.</p>
                <p><strong>3. Claim Amount:</strong> ₹{totalClaimAmount.toLocaleString()}</p>
                <p><strong>4. Advance Taken:</strong> ₹{totalAdvanceRequested.toLocaleString()}</p>
                <p><strong>5. Net Payable:</strong> ₹{(totalClaimAmount - totalAdvanceRequested).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {active === 'MOVEMENT REGISTER' && (
          <div className={\`\${styles.modernCard} \${styles.animateFadeIn}\`}>
             <div className={styles.modernCardHeader}>
               <History className="text-blue-500" size={24} />
               <h3 className={styles.modernCardTitle}>Movement Register</h3>
             </div>

             {c.movement.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>No movements recorded yet.</div>
             ) : (
               <div className={styles.modernTimeline}>
                 {c.movement.map((m, idx) => (
                   <div key={m.id} className={\`\${styles.modernTimelineItem} \${styles.animateSlideUp}\`} style={{ animationDelay: \`\${idx * 0.05}s\` }}>
                     <div className={styles.modernTimelineDot} />
                     <div className={styles.modernTimelineContent} style={{ marginLeft: '16px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                         <div style={{ fontWeight: 700, fontSize: '15px' }} className={styles.modernValue}>{m.action}</div>
                         <div style={{ fontSize: '12px', fontWeight: 600 }} className={styles.modernLabel}>{new Date(m.at).toLocaleString()}</div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

      </div>

      <div className={styles.mrStepNavigator}>
        <button className={styles.modernBtnSecondary} onClick={() => goToStep(previousStep)} disabled={!previousStep}>
          <ChevronLeft className={styles.tabIcon} size={18} />
          Previous
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontWeight: 500 }}>
          <CalendarDays size={18} />
          <span>Step {activeStepIndex + 1} of {workflowTabs.length}</span>
        </div>
        <button className={styles.modernBtnSecondary} onClick={() => goToStep(nextStep)} disabled={!nextStep}>
          Next
          <ChevronRight className={styles.tabIcon} size={18} />
        </button>
      </div>

      <div className={styles.mrStickyActionBar}>
        <div className={styles.mrStickyActionStatus}>
          <span style={{ fontWeight: 600 }}>{unreadinessCount > 0 ? \`\${unreadinessCount} issue(s) pending\` : 'Ready for submission'}</span>
          <small style={{ display: 'block', color: '#94a3b8' }}>{active}</small>
        </div>
        <div className={styles.mrStickyActionButtons} style={{ display: 'flex', gap: '12px' }}>
          <button className={styles.modernBtnSecondary} onClick={saveDraftOnly}>Save Draft</button>
          <button disabled={checks.length > 0} className={styles.modernBtnPrimary} title={checks.map((c) => c.msg).join(', ')} onClick={openFinalPreview}>
            {checks.length > 0 ? 'Resolve Issues' : 'Submit Final Claim'}
          </button>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(origPath, logicPart + newRender);
