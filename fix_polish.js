const fs = require('fs');
const path = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx';

let code = fs.readFileSync(path, 'utf8');

// The rest of the tabs (Treatment Note, Advance Notes, Certificate, Movement Register) still need some polish to match the new vibrant/colorful look of Summary/List/Annexures/Final Note.

const modernCardRegex = /className=\{`\$\{styles\.modernCard\} \$\{styles\.animateFadeIn\}`\}/g;
code = code.replace(modernCardRegex, 'className={`bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-indigo-100 dark:border-slate-700 overflow-hidden ${styles.animateFadeIn}`}');

const modernCardHeaderRegex = /className=\{styles\.modernCardHeader\}/g;
code = code.replace(modernCardHeaderRegex, 'className="bg-gradient-to-r from-slate-50 to-indigo-50/50 dark:from-slate-900 dark:to-indigo-900/20 px-6 py-4 border-b border-indigo-100 dark:border-slate-700 flex items-center gap-3"');

// Fix text-blue-500 class in the headers
code = code.replace(/className="text-blue-500"/g, 'className="text-indigo-600 dark:text-indigo-400"');

// Fix modernCardTitle
code = code.replace(/className=\{styles\.modernCardTitle\}/g, 'className="text-xl font-bold text-indigo-900 dark:text-indigo-300"');


fs.writeFileSync(path, code);
