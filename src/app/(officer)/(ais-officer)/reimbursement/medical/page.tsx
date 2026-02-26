'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import styles from './mr-book.module.css';
import { fetchProfilePreview2 } from './profile-mapper';
import { loadCases, makeMrNo, upsertCase } from './mock-store';
import type { DependentVM, MRCase, MRStatus, OfficerProfileVM } from './mr-types';

const statusOrder: (MRStatus | 'all')[] = ['all', 'Draft', 'Active', 'Advance Submitted', 'Advance Paid', 'Final Submitted', 'Paid & Closed'];

export default function MedicalReimbursementPage() {
  const [profile, setProfile] = useState<OfficerProfileVM | null>(null);
  const [dependents, setDependents] = useState<DependentVM[]>([]);
  const [cases, setCases] = useState<MRCase[]>([]);
  const [status, setStatus] = useState<MRStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('all');
  const [open, setOpen] = useState(false);

  const [claimFor, setClaimFor] = useState<'SELF' | 'DEPENDENT'>('SELF');
  const [depId, setDepId] = useState('');
  const [hospitalName, setHospitalName] = useState('General Hospital');
  const [placeOfIllness, setPlaceOfIllness] = useState('Thiruvananthapuram');
  const [hospitalised, setHospitalised] = useState(true);
  const [hospitalType, setHospitalType] = useState<'Government' | 'Empanelled Private'>('Government');
  const [periodFrom, setPeriodFrom] = useState('2026-02-20');
  const [periodTo, setPeriodTo] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [declared, setDeclared] = useState(false);

  useEffect(() => {
    fetchProfilePreview2().then(({ profile: p, dependents: d }) => {
      setProfile(p);
      setDependents(d);
      setCases(loadCases(p));
    });
  }, []);

  const selected = dependents.find((d) => d.personId === depId);

  const filtered = useMemo(
    () =>
      cases.filter((c) => {
        const okStatus = status === 'all' || c.status === status;
        const okSearch = !search || c.mrNo.toLowerCase().includes(search.toLowerCase()) || c.patient.name.toLowerCase().includes(search.toLowerCase());
        const okYear = year === 'all' || c.mrNo.includes(year);
        return okStatus && okSearch && okYear;
      }),
    [cases, search, status, year],
  );

  if (!profile) {
    return (
      <div className={styles.shellBg}>
        <div className={styles.container}>Loading...</div>
      </div>
    );
  }

  const createCase = () => {
    if (!declared || !periodFrom || !hospitalName || !placeOfIllness) return;
    const mrNo = makeMrNo();
    const next: MRCase = {
      mrId: crypto.randomUUID(),
      mrNo,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: 'Draft',
      officer: profile,
      patient: {
        claimFor,
        dependentPersonId: claimFor === 'DEPENDENT' ? depId : undefined,
        name: claimFor === 'SELF' ? profile.fullName : selected?.fullName || 'Dependent',
        relation: claimFor === 'SELF' ? 'Self' : selected?.relation || 'Dependent',
      },
      treatment: {
        placeOfIllness,
        hospitalised,
        withinState: true,
        hospitalType,
        hospitalName,
        hospitalAddress: profile.officeAddress,
        fromDate: periodFrom,
        toDate: periodTo || undefined,
        diagnosis,
        treatmentAbroad: 'NA',
      },
      bills: [],
      docs: [],
      advances: [],
      finalClaim: { amaId: 'AMA-1' },
      movement: [{ id: crypto.randomUUID(), action: 'Case created', at: new Date().toISOString() }],
    };

    setCases(upsertCase(next, cases));
    setOpen(false);
    window.location.href = `/reimbursement/medical/workspace?mrId=${next.mrId}`;
  };

  return (
    <div className={styles.shellBg}>
      <div className={styles.container}>
        <section className={styles.cover}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Medical Reimbursement Control Center</h1>
              <p className="text-sm text-indigo-100">Structured file-style dashboard with responsive and aligned case data.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold" onClick={() => setOpen(true)}>
              <PlusIcon className="h-4 w-4" />
              New MR Case
            </button>
          </div>
        </section>

        <section className={`${styles.page} mt-4`}>
          <h3 className="font-semibold">Recently Updated</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[...cases]
              .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
              .slice(0, 7)
              .map((c) => (
                <Link href={`/reimbursement/medical/workspace?mrId=${c.mrId}`} key={c.mrId} className={styles.bookCard}>
                  <div className="text-sm font-semibold">{c.mrNo}</div>
                  <div className="text-xs text-slate-700">{c.patient.name}</div>
                  <div className="text-xs text-slate-600">{c.treatment.hospitalName}</div>
                  <div className="mt-1 text-xs font-medium text-indigo-700">{c.status}</div>
                </Link>
              ))}
          </div>
        </section>

        <section className={`${styles.page} mt-4`}>
          <h3 className="font-semibold">Filters</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {statusOrder.slice(1).map((s) => (
              <button key={s} onClick={() => setStatus(s as MRStatus)} className={styles.tab}>
                {s} ({cases.filter((c) => c.status === s).length})
              </button>
            ))}
          </div>
        </section>

        <section className={`${styles.page} mt-4`}>
          <h3 className="font-semibold">All Requests</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <input className={styles.field} placeholder="Search by MR/patient" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className={styles.field} value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="all">All Years</option>
              <option value="2026">2026</option>
            </select>
            <button className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold" onClick={() => { setStatus('all'); setSearch(''); setYear('all'); }}>
              Reset
            </button>
          </div>

          <div className="mt-3 grid gap-3">
            {filtered.map((c) => {
              const total = c.bills.reduce((s, b) => s + b.totalAmount, 0);
              const adv = c.advances.filter((a) => a.status === 'Paid').reduce((s, a) => s + a.amount, 0);
              const missing = ['DISCHARGE', 'EC_SIGNED'].filter((t) => !c.docs.some((d) => d.type === t));

              return (
                <article key={c.mrId} className={styles.bookCard}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link href={`/reimbursement/medical/workspace?mrId=${c.mrId}`} className="font-semibold text-indigo-900">
                        {c.mrNo}
                      </Link>
                      <div className="text-sm text-slate-700">
                        {c.patient.name} ({c.patient.relation})
                      </div>
                    </div>
                    <span className={styles.stamp}>{c.status}</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600">{c.treatment.hospitalName} | {c.treatment.fromDate}</div>
                  <div className="mt-1 text-xs text-slate-700">Bills ₹{total} | Advance Paid ₹{adv} | Balance ₹{Math.max(total - adv, 0)}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Link className="rounded border border-indigo-300 px-2 py-1" href={`/reimbursement/medical/workspace?mrId=${c.mrId}`}>Continue</Link>
                    <Link className="rounded border border-slate-300 px-2 py-1" href={`/reimbursement/medical/workspace?mrId=${c.mrId}#annexures`}>Add Bill/Doc</Link>
                    <Link className="rounded border border-slate-300 px-2 py-1" href={`/reimbursement/medical/workspace?mrId=${c.mrId}#advance`}>Add Advance</Link>
                    <button disabled={missing.length > 0} title={missing.length ? `Missing: ${missing.join(', ')}` : ''} className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40">Submit Final</button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {open && (
          <div className={styles.modalBackdrop}>
            <div className={styles.modalCard}>
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                <h3 className="text-base font-semibold text-indigo-900">Create Medical Reimbursement Case</h3>
                <button onClick={() => setOpen(false)} className="rounded p-1 text-slate-700 hover:bg-slate-100">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className={styles.page}>
                    <h4 className="font-semibold">Officer Identity</h4>
                    <div className="mt-2 space-y-1 text-sm text-slate-700">
                      <p>{profile.fullName}</p>
                      <p>PEN {profile.penNumber} | {profile.serviceType}</p>
                      <p>{profile.designation}</p>
                      <p>{profile.officeAddress}</p>
                    </div>
                  </div>

                  <div className={styles.page}>
                    <h4 className="font-semibold">Create Case</h4>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => setClaimFor('SELF')} className={`rounded px-3 py-2 text-sm ${claimFor === 'SELF' ? 'bg-indigo-100 text-indigo-700' : 'border border-slate-300'}`}>Self</button>
                      <button onClick={() => setClaimFor('DEPENDENT')} className={`rounded px-3 py-2 text-sm ${claimFor === 'DEPENDENT' ? 'bg-indigo-100 text-indigo-700' : 'border border-slate-300'}`}>Dependent</button>
                    </div>

                    {claimFor === 'DEPENDENT' && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {dependents.map((d) => (
                          <button key={d.personId} onClick={() => setDepId(d.personId)} className="rounded-full border border-slate-300 px-2 py-1 text-xs">
                            {d.relationType}: {d.fullName}
                          </button>
                        ))}
                      </div>
                    )}

                    {selected && <div className="mt-2 rounded border border-indigo-200 bg-indigo-50 p-2 text-xs">{selected.fullName} | {selected.relation} | {selected.gender} | {selected.dob}</div>}

                    <div className="mt-3 grid gap-2">
                      <input className={styles.field} value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} placeholder="Hospital Name" />
                      <input className={styles.field} value={placeOfIllness} onChange={(e) => setPlaceOfIllness(e.target.value)} placeholder="Place of illness occurred" />
                      <label className="text-sm text-slate-700"><input type="checkbox" checked={hospitalised} onChange={(e) => setHospitalised(e.target.checked)} className="mr-2" />Hospitalised</label>
                      {hospitalised && (
                        <>
                          <select className={styles.field} value={hospitalType} onChange={(e) => setHospitalType(e.target.value as 'Government' | 'Empanelled Private')}>
                            <option>Government</option>
                            <option>Empanelled Private</option>
                          </select>
                          <input className={styles.field} value={profile.officeAddress} readOnly />
                        </>
                      )}
                      <input type="date" className={styles.field} value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} />
                      <input type="date" className={styles.field} value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} />
                      <input className={styles.field} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Diagnosis (optional)" />
                      <label className="text-sm text-slate-700"><input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} className="mr-2" />Declaration</label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3">
                <button className="rounded border border-slate-300 px-3 py-2 text-sm" onClick={() => setOpen(false)}>Cancel</button>
                <button className="rounded bg-indigo-700 px-3 py-2 text-sm font-semibold text-white" onClick={createCase}>Create MR Case</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
