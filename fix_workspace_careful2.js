const fs = require('fs');

const origPath = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx';
let data = fs.readFileSync(origPath, 'utf8');

data = data.replace(/totalClaimAmount/g, 'totalClaim');
data = data.replace(/totalAdvanceRequested/g, 'totalAdvance');

fs.writeFileSync(origPath, data);
