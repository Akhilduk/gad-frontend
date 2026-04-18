const fs = require('fs');
const path = 'src/app/(officer)/(ais-officer)/reimbursement/medical/page.tsx';
let data = fs.readFileSync(path, 'utf8');

const regex = /<div className=\{styles\.pageContainer\}>([\s\S]*?)<\/div><\/div>;/;
const replaced = data.replace(regex, `
  <div className={styles.modernContainer}>
    <div className="max-w-7xl mx-auto">
      <div className={styles.modernHeader}>
        <div>
          <h1 className={styles.modernTitle}>Medical Reimbursement</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Track and manage your medical claims and advances.</p>
        </div>
        <button className={styles.modernBtnPrimary} onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Case
        </button>
      </div>

      <div className={styles.modernGrid3}>
        <div className={styles.modernCard}>
          <div className="flex items-center gap-4">
            <div className={styles.modernIconWrapper}><Activity className="w-6 h-6" /></div>
            <div>
              <p className={styles.modernLabel}>Total Cases</p>
              <h3 className={styles.modernValue}>{activeCases.length}</h3>
            </div>
          </div>
        </div>
        <div className={styles.modernCard}>
          <div className="flex items-center gap-4">
            <div className={styles.modernIconWrapper}><CheckCircle className="w-6 h-6 text-green-600" /></div>
            <div>
              <p className={styles.modernLabel}>Approved</p>
              <h3 className={styles.modernValue}>{activeCases.filter(c => c.status === 'APPROVED').length}</h3>
            </div>
          </div>
        </div>
        <div className={styles.modernCard}>
          <div className="flex items-center gap-4">
            <div className={styles.modernIconWrapper}><Clock className="w-6 h-6 text-yellow-600" /></div>
            <div>
              <p className={styles.modernLabel}>In Progress</p>
              <h3 className={styles.modernValue}>{activeCases.filter(c => c.status !== 'APPROVED').length}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className={styles.modernTabs}>
          <button className={\`\${styles.modernTab} \${viewMode === 'cases' ? styles.modernTabActive : ''}\`} onClick={() => setViewMode('cases')}>Active Cases</button>
          <button className={\`\${styles.modernTab} \${viewMode === 'advances' ? styles.modernTabActive : ''}\`} onClick={() => setViewMode('advances')}>Advances</button>
        </div>

        <div className={styles.modernCard}>
          <div className={styles.modernCardHeader}>
            <h2 className={styles.modernCardTitle}>
              {viewMode === 'cases' ? 'Your Medical Claims' : 'Your Advances'}
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search..." className={\`\${styles.modernInput} pl-9 w-64\`} />
            </div>
          </div>

          <div className="overflow-x-auto">
            {viewMode === 'cases' ? (
              <table className={styles.modernTable}>
                <thead>
                  <tr>
                    <th>Case ID</th>
                    <th>Patient</th>
                    <th>Treatment Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCases.map((c) => (
                    <tr key={c.id} className={styles.modernTableRow}>
                      <td className="font-medium">#{c.id.substring(0,8).toUpperCase()}</td>
                      <td>
                        <div className="font-medium text-gray-900 dark:text-slate-200">
                          {c.claimFor === 'SELF' ? 'Self' : (c.dependentName || 'Dependent')}
                        </div>
                        <div className="text-xs text-gray-500">{c.hospitalised ? 'Inpatient' : 'Outpatient'}</div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {c.fromDate} {c.toDate ? \`to \${c.toDate}\` : ''}
                        </div>
                      </td>
                      <td>
                        <span className={\`\${styles.modernBadge} \${c.status === 'APPROVED' ? styles.modernBadgeSuccess : c.status === 'DRAFT' ? styles.modernBadgeWarning : ''}\`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm flex items-center gap-1 transition-colors" onClick={() => router.push(\`/reimbursement/medical/\${c.id}\`)}>
                          View Details <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {activeCases.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                        No active cases found. Click "New Case" to start.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className={styles.modernTable}>
                 <thead>
                  <tr>
                    <th>Advance ID</th>
                    <th>Case ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myAdvances.map((adv) => {
                     const c = activeCases.find((x) => x.id === adv.caseId);
                     return (
                      <tr key={adv.id} className={styles.modernTableRow}>
                        <td className="font-medium">#{adv.id.substring(0,8).toUpperCase()}</td>
                        <td className="text-gray-500">#{adv.caseId.substring(0,8).toUpperCase()}</td>
                        <td className="font-semibold text-gray-900 dark:text-slate-200">₹{adv.requestedAmount.toLocaleString()}</td>
                        <td>
                           <span className={\`\${styles.modernBadge} \${adv.status === 'APPROVED' ? styles.modernBadgeSuccess : adv.status === 'DRAFT' ? styles.modernBadgeWarning : ''}\`}>
                            {adv.status}
                          </span>
                        </td>
                        <td>
                          <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium text-sm flex items-center gap-1" onClick={() => router.push(\`/reimbursement/medical/\${adv.caseId}\`)}>
                            View Case <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                     );
                  })}
                  {myAdvances.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                        No advances found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
`);

fs.writeFileSync(path, replaced);
