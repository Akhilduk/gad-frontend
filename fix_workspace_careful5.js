const fs = require('fs');

const origPath = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx';
let data = fs.readFileSync(origPath, 'utf8');

data = data.replace(/removeBill\(b\.id\)/g, "updateCase({ ...c, bills: c.bills.filter(x => x.id !== b.id) }, 'Bill deleted')");
data = data.replace(/removeDoc\(d\.id\)/g, "updateCase({ ...c, docs: c.docs.filter(x => x.id !== d.id) }, 'Doc deleted')");

fs.writeFileSync(origPath, data);
