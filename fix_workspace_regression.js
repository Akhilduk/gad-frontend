const fs = require('fs');

const path = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Treatment Note: restore missing fields (Place of Illness, Within State toggle, Hospital Type, Start Date, End Date, hospital autocomplete)
const treatmentNoteJSX = `
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

              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>Place of Illness</label>
                <input
                  className={styles.modernInput}
                  value={treatmentDraft.placeOfIllness}
                  onChange={(e) => setTreatmentDraft({ ...treatmentDraft, placeOfIllness: e.target.value })}
                  placeholder="Place of Illness"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className={styles.modernLabel}>Hospitalised?</label>
                  <select
                    className={styles.modernSelect}
                    value={treatmentDraft.hospitalised ? 'Yes' : 'No'}
                    onChange={(e) => setTreatmentDraft({ ...treatmentDraft, hospitalised: e.target.value === 'Yes' })}
                  >
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className={styles.modernLabel}>Within State?</label>
                  <select
                    className={styles.modernSelect}
                    value={treatmentDraft.withinState ? 'Yes' : 'No'}
                    onChange={(e) => setTreatmentDraft({ ...treatmentDraft, withinState: e.target.value === 'Yes' })}
                  >
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>
              </div>

              {treatmentDraft.hospitalised && (
                <>
                  <div className={styles.modernFormGroup}>
                    <label className={styles.modernLabel}>Hospital Type</label>
                    <select
                      className={styles.modernSelect}
                      value={treatmentDraft.hospitalType}
                      onChange={(e) => setTreatmentDraft({ ...treatmentDraft, hospitalType: e.target.value })}
                    >
                      <option>Government</option>
                      <option>Private</option>
                    </select>
                  </div>

                  <div className={styles.modernFormGroup}>
                    <label className={styles.modernLabel}>Hospital Name</label>
                    <input
                      className={styles.modernInput}
                      value={treatmentDraft.hospitalName}
                      onChange={(e) => setTreatmentDraft({ ...treatmentDraft, hospitalName: e.target.value })}
                      placeholder="Enter Hospital Name"
                    />
                  </div>

                  <div className={styles.modernFormGroup}>
                    <label className={styles.modernLabel}>Hospital Address</label>
                    <input
                      className={styles.modernInput}
                      value={treatmentDraft.hospitalAddress}
                      onChange={(e) => setTreatmentDraft({ ...treatmentDraft, hospitalAddress: e.target.value })}
                      placeholder="Enter Hospital Address"
                    />
                  </div>
                </>
              )}

              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>Treatment Start Date</label>
                <input
                  type="date"
                  className={styles.modernInput}
                  value={treatmentDraft.fromDate}
                  onChange={(e) => setTreatmentDraft({ ...treatmentDraft, fromDate: e.target.value })}
                />
              </div>
              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>Treatment End Date</label>
                <input
                  type="date"
                  className={styles.modernInput}
                  value={treatmentDraft.toDate}
                  onChange={(e) => setTreatmentDraft({ ...treatmentDraft, toDate: e.target.value })}
                />
              </div>

            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button className={styles.modernBtnPrimary} onClick={() => {
                updateCase({
                  ...c,
                  treatment: { ...c.treatment, diagnosis: \`\${treatmentDraft.diagnosis} | \${treatmentDraft.medicalType}\` },
                  hospitalised: treatmentDraft.hospitalised,
                  hospitalName: treatmentDraft.hospitalName,
                  hospitalAddress: treatmentDraft.hospitalAddress,
                  hospitalType: treatmentDraft.hospitalType,
                  fromDate: treatmentDraft.fromDate,
                  toDate: treatmentDraft.toDate,
                  placeOfIllness: treatmentDraft.placeOfIllness,
                  withinState: treatmentDraft.withinState,
                }, 'Treatment details saved');
              }}>
                <Save size={18} className="mr-2" />
                Save Treatment Details
              </button>
            </div>
          </div>
        )}
`;

code = code.replace(/\{active === 'TREATMENT NOTE' && \([\s\S]*?Save Treatment Details[\s\S]*?<\/button>\s*<\/div>\s*<\/div>\s*\)\}/, treatmentNoteJSX.trim());

// 2. Fix Annexures Popup missing fields
const popupBlockRegex = /(<div className=\{styles\.modernPopupContent\}>[\s\S]*?<h3 className=\{styles\.modernCardTitle\}>Upload Bill<\/h3>[\s\S]*?<div className=\{styles\.modernGrid2\}>)[\s\S]*?(<button onClick=\{handleSaveBill\} className=\{styles\.modernBtnPrimary\}>)/;
const popupNewJSX = `$1
              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>Bill Number</label>
                <input className={styles.modernInput} value={billDraft?.billNo || ''} onChange={(e) => setBillDraft(prev => prev ? { ...prev, billNo: e.target.value } : null)} />
              </div>
              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>Bill Date</label>
                <input type="date" className={styles.modernInput} value={billDraft?.billDate || ''} onChange={(e) => setBillDraft(prev => prev ? { ...prev, billDate: e.target.value } : null)} />
              </div>
              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>Hospital / Vendor</label>
                <input className={styles.modernInput} value={billDraft?.hospitalVendor || ''} onChange={(e) => setBillDraft(prev => prev ? { ...prev, hospitalVendor: e.target.value } : null)} />
              </div>
              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>GST No.</label>
                <input className={styles.modernInput} value={billDraft?.gstNo || ''} onChange={(e) => setBillDraft(prev => prev ? { ...prev, gstNo: e.target.value } : null)} />
              </div>
              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>Total Amount</label>
                <input type="number" className={styles.modernInput} value={billDraft?.totalAmount || ''} onChange={(e) => setBillDraft(prev => prev ? { ...prev, totalAmount: e.target.value } : null)} />
              </div>
              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>Tax</label>
                <input type="number" className={styles.modernInput} value={billDraft?.tax || ''} onChange={(e) => setBillDraft(prev => prev ? { ...prev, tax: e.target.value } : null)} />
              </div>
              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>Status</label>
                <select className={styles.modernSelect} value={billDraft?.status || 'Pending'} onChange={(e) => setBillDraft(prev => prev ? { ...prev, status: e.target.value as any } : null)}>
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 p-6 border-t border-gray-100">
              <button onClick={() => { setBillEditId(''); setBillDraft(null); }} className={styles.modernBtnSecondary}>Cancel</button>
              $2`;

code = code.replace(popupBlockRegex, popupNewJSX);

// 3. Fix Certificate missing fields
const certificateJSXRegex = /(\{active === 'CERTIFICATE' && \([\s\S]*?<h3 className=\{styles\.modernCardTitle\}>Essentiality Certificate<\/h3>[\s\S]*?<\/div>)\s*<div className="mt-6 flex justify-end gap-3">/;
const certNewJSX = `$1
            <div className={styles.modernGrid2 + " mt-6"}>
              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>AMA Name</label>
                <input className={styles.modernInput} value={c.essentialityCertificate?.amaName || ''} onChange={(e) => updateCase({ ...c, essentialityCertificate: { ...c.essentialityCertificate, amaName: e.target.value } as any })} />
              </div>
              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>Designation</label>
                <input className={styles.modernInput} value={c.essentialityCertificate?.amaDesignation || ''} onChange={(e) => updateCase({ ...c, essentialityCertificate: { ...c.essentialityCertificate, amaDesignation: e.target.value } as any })} />
              </div>
              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>Registration No.</label>
                <input className={styles.modernInput} value={c.essentialityCertificate?.amaRegNo || ''} onChange={(e) => updateCase({ ...c, essentialityCertificate: { ...c.essentialityCertificate, amaRegNo: e.target.value } as any })} />
              </div>
              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>Institution</label>
                <input className={styles.modernInput} value={c.essentialityCertificate?.institution || ''} onChange={(e) => updateCase({ ...c, essentialityCertificate: { ...c.essentialityCertificate, institution: e.target.value } as any })} />
              </div>
              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>Address</label>
                <input className={styles.modernInput} value={c.essentialityCertificate?.address || ''} onChange={(e) => updateCase({ ...c, essentialityCertificate: { ...c.essentialityCertificate, address: e.target.value } as any })} />
              </div>
              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>Date</label>
                <input type="date" className={styles.modernInput} value={c.essentialityCertificate?.date || ''} onChange={(e) => updateCase({ ...c, essentialityCertificate: { ...c.essentialityCertificate, date: e.target.value } as any })} />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">`;

code = code.replace(certificateJSXRegex, certNewJSX);

fs.writeFileSync(path, code);
console.log("File patched.");
