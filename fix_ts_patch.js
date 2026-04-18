const fs = require('fs');
const path = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldSaveCall = `updateCase({
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
                }, 'Treatment details saved');`;

const newSaveCall = `updateCase({
                  ...c,
                  treatment: {
                    ...c.treatment,
                    diagnosis: \`\${treatmentDraft.diagnosis} | \${treatmentDraft.medicalType}\`,
                    hospitalised: treatmentDraft.hospitalised,
                    hospitalName: treatmentDraft.hospitalName,
                    hospitalAddress: treatmentDraft.hospitalAddress,
                    hospitalType: treatmentDraft.hospitalType,
                    fromDate: treatmentDraft.fromDate,
                    toDate: treatmentDraft.toDate,
                    placeOfIllness: treatmentDraft.placeOfIllness,
                    withinState: treatmentDraft.withinState,
                  }
                }, 'Treatment details saved');`;

code = code.replace(oldSaveCall, newSaveCall);
fs.writeFileSync(path, code);
