import re
import sys

def main():
    filepath = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx'
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Transform the Tabs into a Sidebar Layout
    # Find the start of the layout: <div className={styles.mrShell}> ... <div className={styles.container}>
    # We will inject a flex container to hold the sidebar and the main content.

    # We need to find the <div className={styles.container}> and what follows.
    # The header and command bar should stay on top, or maybe the sidebar is below the header.
    # Let's put the sidebar below the header/command bar.

    # Replace the tabs row:
    tabs_search = r'<div className=\{`\$\{styles\.tabs\} mb-2`\}>\s*\{tabs\.map\(\(t\) => \(\s*<button key=\{t\} className=\{`\$\{styles\.tab\} \$\{active === t \? styles\.activeTab : \'\'\}`\} onClick=\{\(\) => setActive\(t\)\}>\s*\{t\}\s*</button>\s*\)\)\}\s*</div>'

    sidebar_replacement = """<div className="flex flex-col md:flex-row gap-6">
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

    content = re.sub(tabs_search, sidebar_replacement, content)

    # 2. Add missing lucide-react imports for the sidebar icons
    import_search = r"import \{ Activity, Briefcase, ClipboardCheck, UserCircle2 \} from 'lucide-react';"
    import_replace = "import { Activity, Briefcase, ClipboardCheck, UserCircle2, Stethoscope, FileText, IndianRupee, Pill } from 'lucide-react';"
    content = content.replace(import_search, import_replace)

    # 3. Close the new flex container at the very end of the component
    end_search = r'\{toast && <div className="fixed right-5 bottom-5 bg-indigo-600 text-white px-4 py-2 rounded shadow-lg">\{toast\}</div>\}\s*</div>\s*</div>\s*\);\s*\}\s*$'
    end_replace = r'{toast && <div className="fixed right-5 bottom-5 bg-indigo-600 text-white px-4 py-2 rounded shadow-lg">{toast}</div>}' + '\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}\n'
    content = re.sub(end_search, end_replace, content)

    # 4. Refine Annexures sub-tabs
    annexure_tabs_search = r'<div className="flex gap-2 mb-3">\s*<button className=\{`\$\{styles\.btnPill\} \$\{sub === \'Bills\' \? styles\.btnPillActive : \'\'\}`\} onClick=\{\(\) => setSub\(\'Bills\'\)\}>Bills \(OCR\)</button>\s*<button className=\{`\$\{styles\.btnPill\} \$\{sub === \'Other\' \? styles\.btnPillActive : \'\'\}`\} onClick=\{\(\) => setSub\(\'Other\'\)\}>Other Documents</button>\s*</div>'

    annexure_tabs_replace = """<div className="flex gap-6 mb-6 border-b border-slate-200">
              <button
                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${sub === 'Bills' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                onClick={() => setSub('Bills')}
              >
                Bills (OCR)
              </button>
              <button
                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${sub === 'Other' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                onClick={() => setSub('Other')}
              >
                Other Documents
              </button>
            </div>"""

    content = re.sub(annexure_tabs_search, annexure_tabs_replace, content)

    # 5. Refine 2-column forms: find sectionGrid2 and update it for better spacing if needed.
    # Actually, styles.sectionGrid2 might already be okay, but let's make sure sectionFormGrid is grid-cols-1 md:grid-cols-2
    # In mr.module.css we don't know the exact definitions, so we'll inject tailwind directly for better control where needed.

    grid_search = r'<div className=\{styles\.sectionFormGrid\}>'
    grid_replace = r'<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">'
    content = content.replace(grid_search, grid_replace)

    # 6. Command bar refinement
    cmd_bar_search = r'<div className=\{`\$\{styles\.commandBar\} flex gap-2 flex-wrap mb-3`\}>\s*<button className=\{styles\.btnSecondary\} onClick=\{\(\) => setActive\(\'ANNEXURES\'\)\}>Add Bill/Doc</button>\s*<button className=\{styles\.btnSecondary\} onClick=\{\(\) => setActive\(\'ADVANCE NOTES\'\)\}>Request Advance</button>\s*<button disabled=\{checks\.length > 0\} className=\{styles\.btnPrimary\} title=\{checks\.join\(\', \'\)\} onClick=\{openFinalPreview\}>Submit Final Claim</button>\s*<button className=\{styles\.btnSecondary\} onClick=\{\(\) => window\.print\(\)\}>Download Preview</button>\s*</div>'

    cmd_bar_replace = """<div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-6 bg-white border border-slate-200 rounded-lg shadow-sm sticky top-0 z-10">
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

    content = re.sub(cmd_bar_search, cmd_bar_replace, content)

    with open(filepath, 'w') as f:
        f.write(content)

if __name__ == '__main__':
    main()
