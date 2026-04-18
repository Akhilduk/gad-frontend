const fs = require('fs');

const path = 'src/app/(officer)/(ais-officer)/reimbursement/medical/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// The user wants colorful tabs with specific gradients, distinguished borders for cards, and less "grey".

// 1. Update the tabs wrapper and mapping
const oldTabsRegex = /<div className="flex space-x-2 p-4 bg-gray-50 dark:bg-slate-800\/50 overflow-x-auto border-b border-gray-100 dark:border-slate-700">[\s\S]*?<\/div>/;
const newTabs = `<div className="flex space-x-3 p-5 bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-900 dark:to-slate-800/80 overflow-x-auto border-b-2 border-indigo-100 dark:border-indigo-900/50">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={\`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 transform \${
              tab === t.key
              ? 'bg-gradient-to-r from-indigo-900 via-indigo-600 to-indigo-900 text-white shadow-lg shadow-indigo-500/30 scale-105 border-0'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-300 border border-indigo-100 dark:border-slate-600 shadow-sm'
            }\`}
            onClick={() => setTab(t.key)}
          >
            <t.icon size={18} className={tab === t.key ? 'text-indigo-200' : 'text-indigo-500 dark:text-indigo-400'} />
            <span>{t.label}</span>
            <b className={\`ml-1 px-2.5 py-0.5 rounded-full text-xs \${
              tab === t.key
              ? 'bg-white/20 text-white border border-white/30'
              : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
            }\`}>
              {tabCount(t.key)}
            </b>
          </button>
        ))}
      </div>`;

code = code.replace(oldTabsRegex, newTabs);


// 2. Update the card design
const oldCardRegex = /<article key=\{c\.mrId\} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-300 relative group overflow-hidden" style=\{\{ animationDelay: `\$\{idx \* 50\}ms` \}\}>[\s\S]*?<\/article>/g;

const newCardStr = `<article key={c.mrId} className={\`bg-white dark:bg-slate-800 rounded-2xl border-2 p-6 flex flex-col justify-between shadow-md hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 relative group overflow-hidden \${
              c.status === 'Draft' ? 'border-gray-200 hover:border-gray-400 dark:border-slate-700 dark:hover:border-slate-500' :
              c.status.includes('Approved') || c.status.includes('Paid') ? 'border-emerald-200 hover:border-emerald-500 dark:border-emerald-900/50 dark:hover:border-emerald-500/80' :
              'border-indigo-200 hover:border-indigo-500 dark:border-indigo-800/50 dark:hover:border-indigo-500/80'
            }\`} style={{ animationDelay: \`\${idx * 50}ms\` }}>

              <div className={\`absolute top-0 left-0 w-full h-2 \${
                c.status === 'Draft' ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                c.status.includes('Approved') || c.status.includes('Paid') ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                'bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900'
              }\`}></div>

              <div className="flex justify-between items-start mb-5 pt-2">
                <div className={\`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm border \${
                  c.status === 'Draft' ? 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' :
                  c.status.includes('Approved') || c.status.includes('Paid') ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
                  'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800'
                }\`}>{statusLabel(c.status)}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-2.5 py-1 rounded-md border border-slate-100 dark:border-slate-700">{recent ? 'Recent:' : 'Updated:'} {formatShort(updatedAt)}</div>
              </div>

              <div className="mb-6 border-b border-indigo-50 dark:border-slate-700 pb-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xl font-extrabold text-indigo-900 dark:text-indigo-300">{c.mrNo}</div>
                  {recent && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/20 animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-white"></span>Live</span>}
                </div>
                <div className="text-base text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/50 dark:to-blue-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                    <UserCircle2 size={18} />
                  </div>
                  <div>
                    {c.patient.name}
                    <span className="block text-xs text-indigo-500 dark:text-indigo-400 font-medium">Claim for: {c.patient.claimFor === 'SELF' ? 'Self' : c.patient.relation}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6 bg-gradient-to-br from-slate-50 to-indigo-50/20 dark:from-slate-900/50 dark:to-indigo-900/10 p-5 rounded-xl border border-indigo-50 dark:border-slate-700/50 shadow-inner">
                <div className="flex items-start gap-3 text-sm">
                  <div className="p-1.5 bg-white dark:bg-slate-800 rounded-md shadow-sm text-indigo-500"><Stethoscope size={16} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">Hospital</div>
                    <div className="text-slate-900 dark:text-slate-200 font-bold truncate" title={c.treatment.hospitalName || 'Not entered'}>{c.treatment.hospitalName || 'Not entered'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="p-1.5 bg-white dark:bg-slate-800 rounded-md shadow-sm text-cyan-500"><CalendarDays size={16} /></div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">Treatment Date</div>
                    <div className="text-slate-900 dark:text-slate-200 font-bold">{formatShort(startDate)}</div>
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <div className="mb-5 bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                  <div className="flex justify-between text-xs font-bold text-indigo-900 dark:text-indigo-400 mb-2">
                    <span className="flex items-center gap-1.5"><Activity size={14} /> Journey Progress</span>
                    <span>{workflowSteps.indexOf(c.status) + 1} / {workflowSteps.length} Steps</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 shadow-inner overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-900 via-indigo-500 to-cyan-500 h-full rounded-full transition-all duration-1000 relative" style={{ width: \`\${Math.max(15, ((workflowSteps.indexOf(c.status) + 1) / workflowSteps.length) * 100)}%\` }}>
                      <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress_1s_linear_infinite]"></div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2.5 pt-4 border-t border-indigo-100 dark:border-slate-700">
                  {actions.map((a, i) => (
                    <button
                      key={\`\${c.mrId}-\${a.label}\`}
                      className={\`flex-1 min-w-[100px] flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all shadow-sm \${
                        i === 0
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-800 text-white hover:shadow-md hover:shadow-indigo-500/30 border border-transparent'
                        : 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300'
                      }\`}
                      onClick={a.onClick}
                    >
                      {i === 0 ? <Shield size={16} /> : <FileText size={16} />}
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </article>`;

// replace all instances of the old card
let prevCode = code;
code = code.replace(oldCardRegex, newCardStr);
if(code === prevCode) {
    console.log("Regex for card failed to replace!");
} else {
    // Add missing imports to the top of the file
    code = code.replace("from 'lucide-react';", "from 'lucide-react';\nimport { UserCircle2, Stethoscope, Activity, CalendarDays } from 'lucide-react';");
    fs.writeFileSync(path, code);
    console.log("List page visually enhanced.");
}
