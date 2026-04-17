const fs = require('fs');

const origPath = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx';
let data = fs.readFileSync(origPath, 'utf8');

data = data.replace(/import \{ ([^}]+) \} from 'lucide-react';/, "import { $1, Save, History, Download, FileCheck } from 'lucide-react';");

fs.writeFileSync(origPath, data);
