const fs = require('fs');
const file = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx';

let content = fs.readFileSync(file, 'utf8');
let orig = fs.readFileSync('original_workspace.tsx', 'utf8');

// The original file has all the functions defined between the state declarations and `if (!c) {`.
// Our new file also has state declarations but then we overwrote the render part.
// But earlier I mistakenly replaced from `if (!c)` when the original had those helper functions above `if (!c)`.
// Let's just inject the missing helpers before `if (!c)` since they are just functions.

// From original, we need:
// `updateCase`, `startBillEdit`, `saveBillEdit`, `extractMockBill`, `onBillUpload`, `onDocUpload`,
// `onSignedEcUpload`, `saveTreatment`, `submitAdvanceRequest`, `downloadEssentialityCertificate`, `openFinalPreview`

const origHelpers = `
  const updateCase = (nextCase: typeof c, message?: string) => {
    const next = cases.map((x) => x.mrId === c.mrId ? nextCase : x);
    saveCases(next);
    if (message) {
      setToast(message);
      setTimeout(() => setToast(''), 1800);
    }
  };

  const extractMockBill = (filename: string): Bill => ({
    id: crypto.randomUUID(),
    fileName: filename,
    invoiceNo: \`INV-\${Math.floor(Math.random() * 999)}\`,
    gstNo: 'GSTAA00' + Math.floor(Math.random() * 9),
    billDate: new Date().toISOString().slice(0, 10),
    hospitalName: c?.treatment.hospitalName || 'City Hospital',
    totalAmount: 11000,
    taxAmount: 300,
    status: 'Extracted',
    duplicateFlag: c?.bills.some((b) => b.invoiceNo === 'INV-111') || false,
  });

  const onBillUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !c) return;
    const extracted = extractMockBill(file.name);
    updateCase(
      {
        ...c,
        bills: [extracted, ...c.bills],
        lastUpdated: new Date().toISOString(),
        movement: [{ id: crypto.randomUUID(), action: \`Bill uploaded and extracted: \${file.name}\`, at: new Date().toISOString() }, ...c.movement],
      },
      'Bill extracted',
    );
  };

  const onDocUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !c) return;
    updateCase(
      {
        ...c,
        docs: [{ id: crypto.randomUUID(), type: docType, fileName: file.name, uploadedAt: new Date().toISOString() }, ...c.docs],
        lastUpdated: new Date().toISOString(),
        movement: [{ id: crypto.randomUUID(), action: \`\${docType} uploaded (\${file.name})\`, at: new Date().toISOString() }, ...c.movement],
      },
      'Document uploaded',
    );
  };

  const onSignedEcUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !c) return;
    updateCase(
      {
        ...c,
        docs: [{ id: crypto.randomUUID(), type: 'EC_SIGNED', fileName: file.name, uploadedAt: new Date().toISOString() }, ...c.docs],
        lastUpdated: new Date().toISOString(),
        movement: [{ id: crypto.randomUUID(), action: \`Signed EC uploaded (\${file.name})\`, at: new Date().toISOString() }, ...c.movement],
      },
      'Signed EC uploaded',
    );
  };

  const startBillEdit = (b: Bill) => {
    setBillEditId(b.id);
    setBillDraft({ ...b });
  };

  const saveBillEdit = () => {
    if (!billDraft || !c) return;
    updateCase(
      {
        ...c,
        bills: c.bills.map((b) => (b.id === billDraft.id ? billDraft : b)),
        lastUpdated: new Date().toISOString(),
        movement: [{ id: crypto.randomUUID(), action: \`Bill updated: \${billDraft.fileName}\`, at: new Date().toISOString() }, ...c.movement],
      },
      'Bill updated',
    );
    setBillEditId('');
    setBillDraft(null);
  };

  const saveTreatment = () => {
    if (!c) return;
    updateCase(
      {
        ...c,
        treatment: {
          ...treatmentDraft,
          diagnosis: \`\${treatmentDraft.diagnosis} | \${treatmentDraft.medicalType}\`,
          hospitalName: treatmentDraft.hospitalised ? treatmentDraft.hospitalName : 'Not hospitalised',
          hospitalAddress: treatmentDraft.hospitalised ? treatmentDraft.hospitalAddress : '',
        },
        lastUpdated: new Date().toISOString(),
        movement: [{ id: crypto.randomUUID(), action: 'Treatment note updated', at: new Date().toISOString() }, ...c.movement],
      },
      'Treatment saved',
    );
  };

  const downloadEssentialityCertificate = () => {
    setToast('Downloading auto-generated EC...');
    setTimeout(() => setToast(''), 2000);
  };

  const openFinalPreview = () => {
    router.push(\`/reimbursement/medical/\${STATIC_MR_ROUTE_PARAM}/final/preview\`);
  };
`;

// Insert the helpers just before `if (!c) {`
content = content.replace('  if (!c) {', origHelpers + '\n  if (!c) {');
fs.writeFileSync(file, content);
console.log("Helpers injected.");
