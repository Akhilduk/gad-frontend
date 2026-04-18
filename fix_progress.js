const fs = require('fs');
const path = 'src/app/(officer)/(ais-officer)/reimbursement/medical/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/workflowSteps\.indexOf\(c\.status\)/g, "statusIndex(c.status)");

fs.writeFileSync(path, code);
