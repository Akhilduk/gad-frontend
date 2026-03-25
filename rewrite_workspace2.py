import re

filepath = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Let's do string replacement directly if regex failed.
import_search = "import { Activity, Briefcase, ClipboardCheck, UserCircle2 } from 'lucide-react';"
import_replace = "import { Activity, Briefcase, ClipboardCheck, UserCircle2, Stethoscope, FileText, IndianRupee, Pill } from 'lucide-react';"
content = content.replace(import_search, import_replace)

tabs_search = """        <div className={`${styles.tabs} mb-2`}>
          {tabs.map((t) => (
            <button key={t} className={`${styles.tab} ${active === t ? styles.activeTab : ''}`} onClick={() => setActive(t)}>
              {t}
            </button>
          ))}
        </div>"""

sidebar_replace = """        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Vertical Sidebar Navigation */}
          <div className="md:w-64 flex-shrink-0">
            <div className="flex flex-col gap-1 bg-white p-3 rounded-lg border border-slate-200 shadow-sm sticky top-4">
              {tabs.map((t) => {
                let Icon = Activity;
                if (t === 'SUMMARY') Icon = UserCircle2;
                if (t === 'TREATMENT NOTE') Icon = Stethoscope;
                if (t === 'ANNEXURES') Icon = FileText;
                if (t === 'ADVANCE NOTES') Icon = IndianRupee;
                if (t === 'CERTIFICATE') Icon = Pill;
                if (t === 'FINAL NOTE') Icon = ClipboardCheck;
                if (t === 'MOVEMENT REGISTER') Icon = Activity;

                return (
                  <button
                    key={t}
                    className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                      active === t
                        ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                    }`}
                    onClick={() => setActive(t)}
                  >
                    <Icon className={`w-5 h-5 ${active === t ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">"""

if tabs_search in content:
    content = content.replace(tabs_search, sidebar_replace)
else:
    print("Could not find tabs section!")

# Fix the end closing divs
end_search = """        {toast && <div className="fixed right-5 bottom-5 bg-indigo-600 text-white px-4 py-2 rounded shadow-lg">{toast}</div>}
      </div>
    </div>
  );
}"""

end_replace = """        {toast && <div className="fixed right-5 bottom-5 bg-indigo-600 text-white px-4 py-2 rounded shadow-lg">{toast}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}"""

if end_search in content:
    content = content.replace(end_search, end_replace)

# Command Bar
cmd_search = """        <div className={`${styles.commandBar} flex gap-2 flex-wrap mb-3`}>
          <button className={styles.btnSecondary} onClick={() => setActive('ANNEXURES')}>Add Bill/Doc</button>
          <button className={styles.btnSecondary} onClick={() => setActive('ADVANCE NOTES')}>Request Advance</button>
          <button disabled={checks.length > 0} className={styles.btnPrimary} title={checks.join(', ')} onClick={openFinalPreview}>Submit Final Claim</button>
          <button className={styles.btnSecondary} onClick={() => window.print()}>Download Preview</button>
        </div>"""

cmd_replace = """        <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-6 bg-white border border-slate-200 rounded-lg shadow-sm sticky top-0 z-10">
          <div className="flex gap-3">
            <button className={`${styles.btnSecondary} !bg-white hover:!bg-slate-50`} onClick={() => setActive('ANNEXURES')}>Add Bill/Doc</button>
            <button className={`${styles.btnSecondary} !bg-white hover:!bg-slate-50`} onClick={() => setActive('ADVANCE NOTES')}>Request Advance</button>
            <button className={`${styles.btnSecondary} !bg-white hover:!bg-slate-50`} onClick={() => window.print()}>Print Preview</button>
          </div>
          <div>
            <button disabled={checks.length > 0} className={`${styles.btnPrimary} shadow-sm`} title={checks.join(', ')} onClick={openFinalPreview}>
              {checks.length > 0 ? 'Fix issues to Submit' : 'Submit Final Claim'}
            </button>
          </div>
        </div>"""

if cmd_search in content:
    content = content.replace(cmd_search, cmd_replace)

# Section grids
content = content.replace('{styles.sectionFormGrid}', '"grid grid-cols-1 md:grid-cols-2 gap-6 mt-4"')

with open(filepath, 'w') as f:
    f.write(content)

print("Replacement complete.")
