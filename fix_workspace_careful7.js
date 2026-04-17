const fs = require('fs');

const origPath = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx';
let data = fs.readFileSync(origPath, 'utf8');

data = data.replace(/title=\{checks\.map\(c => typeof c === 'string' \? c : c\.msg\)\.join\(\', \'\)\}/g, "title={checks.map((c: any) => typeof c === 'string' ? c : c.msg).join(', ')}");

fs.writeFileSync(origPath, data);
