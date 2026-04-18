const fs = require('fs');

const origPath = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx';
let data = fs.readFileSync(origPath, 'utf8');

// The reviewer mentioned missing advanceRemarks
// The state exists, we need to make sure we didn't wipe it out.
if (!data.includes('advanceRemarks')) {
  data = data.replace(/const \[advanceAmount, setAdvanceAmount\] = useState\(''\);/, "const [advanceAmount, setAdvanceAmount] = useState('');\n  const [advanceRemarks, setAdvanceRemarks] = useState('');");
}

fs.writeFileSync(origPath, data);
