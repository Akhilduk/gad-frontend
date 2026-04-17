const fs = require('fs');

const origPath = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx';
let data = fs.readFileSync(origPath, 'utf8');

// I need to add all the missing functions before `if (!c) {` (which doesn't exist anymore, it's just `return (`)
// Or actually I can just add them right after the useEffect.

const helpers = `
  const updateCase = (nextCase: typeof c, message?: string) => {
    const next = cases.map((x) => x.mrId === c?.mrId ? nextCase : x);
    saveCases(next as any);
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

  const onBillUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setBillEditId(extracted.id);
    setBillDraft(extracted);
    e.target.value = '';
  };

  const onDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const onSignedEcUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          diagnosis: \`\${treatmentDraft.diagnosis.split(' | ')[0]} | \${treatmentDraft.medicalType || 'Allopathy'}\`,
          hospitalName: treatmentDraft.hospitalised ? treatmentDraft.hospitalName : 'Not hospitalised',
          hospitalAddress: treatmentDraft.hospitalised ? treatmentDraft.hospitalAddress : '',
        },
        lastUpdated: new Date().toISOString(),
        movement: [{ id: crypto.randomUUID(), action: 'Treatment note updated', at: new Date().toISOString() }, ...c.movement],
      },
      'Treatment saved',
    );
  };

  const submitAdvanceRequest = () => {
    if (!c || !advanceAmount) return;
    updateCase(
      {
        ...c,
        advances: [
          {
            advId: crypto.randomUUID(),
            advNo: \`ADV-\${Math.floor(Math.random() * 9999)}\`,
            amount: parseFloat(advanceAmount),
            estimateDocId: estimateFileName || '',
            status: 'Draft',
            signed: false,
            submittedAt: new Date().toISOString(),
          },
          ...c.advances,
        ],
        lastUpdated: new Date().toISOString(),
        movement: [{ id: crypto.randomUUID(), action: \`Advance draft created (\${advanceAmount})\`, at: new Date().toISOString() }, ...c.movement],
      },
      'Advance Request Saved',
    );
    setAdvanceFormOpen(false);
    setAdvanceAmount('');
    setEstimateFileName('');
  };

  const downloadEssentialityCertificate = () => {
    setToast('Downloading auto-generated EC...');
    setTimeout(() => setToast(''), 2000);
  };

  const openFinalPreview = () => {
    router.push(\`/reimbursement/medical/\${STATIC_MR_ROUTE_PARAM}/final/preview\`);
  };

  const saveDraftOnly = () => {
    setToast('Draft saved successfully');
    setTimeout(() => setToast(''), 2000);
  };

  const workflowTabs = ['SUMMARY', 'TREATMENT NOTE', 'ANNEXURES', 'ADVANCE NOTES', 'CERTIFICATE', 'FINAL NOTE', 'MOVEMENT REGISTER'];
  const activeStepIndex = workflowTabs.indexOf(active);
  const previousStep = activeStepIndex > 0 ? workflowTabs[activeStepIndex - 1] : null;
  const nextStep = activeStepIndex < workflowTabs.length - 1 ? workflowTabs[activeStepIndex + 1] : null;

  const goToStep = (step: string | null) => {
    if (step) setActive(step);
  };

  const totalClaim = c?.bills.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0) || 0;
  const totalAdvanceRequested = c?.advances.reduce((acc, a) => acc + (Number(a.amount) || 0), 0) || 0;

  const checks: string[] = [];
  if (c && !c.treatment.diagnosis) checks.push('Missing Diagnosis');
  if (c && c.bills.length === 0) checks.push('No Bills');
  const unreadinessCount = checks.length;
`;

data = data.replace(/const updateCase = \([\s\S]*?\};\n/, ''); // remove existing one if there
// Remove any dup updateCase
data = data.replace(/const updateCase = \([\s\S]*?\};\n/g, '');
// Just in case it's lingering

let renderIdx = data.indexOf('return (');
data = data.substring(0, renderIdx) + helpers + '\n  ' + data.substring(renderIdx);

data = data.replace(/value=\{''\} onChange=\{\(\) => \{\}\}/, 'value={advanceRemarks} onChange={e => setAdvanceRemarks(e.target.value)}');

fs.writeFileSync(origPath, data);
