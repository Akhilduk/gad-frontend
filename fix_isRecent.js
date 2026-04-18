const fs = require('fs');
const path = 'src/app/(officer)/(ais-officer)/reimbursement/medical/page.tsx';

let code = fs.readFileSync(path, 'utf8');

code = code.replace("const recent = isRecent(c.lastUpdated);", "const recent = isRecent(new Date(c.createdAt), new Date(c.lastUpdated));");

fs.writeFileSync(path, code);
