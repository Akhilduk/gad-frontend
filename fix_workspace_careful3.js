const fs = require('fs');

const origPath = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx';
let data = fs.readFileSync(origPath, 'utf8');

data = data.replace(/totalClaim/g, "(c.bills.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0) || 0)");
data = data.replace(/totalAdvance/g, "(c.advances.reduce((acc, a) => acc + (Number(a.amount) || 0), 0) || 0)");

fs.writeFileSync(origPath, data);
