const fs = require('fs');

const origPath = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx';
let data = fs.readFileSync(origPath, 'utf8');

data = data.replace(/const addBill = \([\s\S]*?\} \? 'hospitalised' : 'treated as outpatient'\)/g, "const p1 = treatmentDraft.hospitalised ? 'hospitalised' : 'treated as outpatient'");

// Wait, I messed up earlier and deleted the actual `addBill` block instead of `updateCase` duplicate?
// No, I did data.replace(/const updateCase = \([\s\S]*?\};\n/g, '');
// The problem is `updateCase` inside `addBill` is missing `updateCase` definition BEFORE it.

// Let's just move `helpers` injection higher.

// Find where `addBill` starts.
const addBillIdx = data.indexOf('const addBill = () => {');

// Find where the injected `updateCase` starts.
const helpersIdx = data.indexOf('const updateCase = (nextCase: typeof c, message?: string) => {');

// If helpersIdx is after addBillIdx, let's cut and paste helpers higher.
if (helpersIdx > addBillIdx) {
  let beforeAddBill = data.substring(0, addBillIdx);
  let afterAddBill = data.substring(addBillIdx);
  // Actually, I can just inject the helpers right after `if (!c) {` which is not there anymore...
  // Wait, I can inject them right after `const [billDraft, setBillDraft] = useState<Bill | null>(null);`
}
