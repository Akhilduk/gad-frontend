const fs = require('fs');
const origPath = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx';
let data = fs.readFileSync(origPath, 'utf8');

// I literally replaced the WHOLE FILE because `renderStart` was -1.
// Why was `renderStart` -1?
// Let's checkout from `main` AGAIN.
