const fs = require('fs');

const path = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx';
let code = fs.readFileSync(path, 'utf8');

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
        )}`;

// replace block
const startIndex = code.indexOf("{active === 'TREATMENT NOTE' && (");
const endIndex = code.indexOf("</div>\n        )}\n\n        {active === 'ANNEXURES'");
if (startIndex !== -1 && endIndex !== -1) {
    code = code.substring(0, startIndex) + treatmentNoteJSX + "\n\n" + code.substring(endIndex + 16);
    fs.writeFileSync(path, code);
    console.log("Treatment Note patched!");
} else {
    console.log("Could not find block boundaries!");
}
