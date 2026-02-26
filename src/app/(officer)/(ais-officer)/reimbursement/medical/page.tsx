'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import styles from './mr-book.module.css';
import { fetchProfilePreview2 } from './profile-mapper';
import { loadCases, makeMrNo, upsertCase } from './mock-store';
import type { MRCase, MRStatus, OfficerProfileVM, DependentVM } from './mr-types';

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

  const filtered = useMemo(() => cases.filter((c) => {
    const okStatus = status === 'all' || c.status === status;
    const okSearch = !search || c.mrNo.toLowerCase().includes(search.toLowerCase()) || c.patient.name.toLowerCase().includes(search.toLowerCase());
    const okYear = year === 'all' || c.mrNo.includes(year);
    return okStatus && okSearch && okYear;
  }), [cases, search, status, year]);

  const selected = dependents.find((d) => d.personId === depId);

  if (!profile) return <div className={styles.shellBg}><div className={styles.container}>Loading...</div></div>;

  const createCase = () => {
    if (!declared || !periodFrom || !hospitalName || !placeOfIllness) return;
    const mrNo = makeMrNo();
    const next: MRCase = {
      mrId: crypto.randomUUID(), mrNo, createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString(), status: 'Draft', officer: profile,
      patient: { claimFor, dependentPersonId: claimFor === 'DEPENDENT' ? depId : undefined, name: claimFor === 'SELF' ? profile.fullName : selected?.fullName || 'Dependent', relation: claimFor === 'SELF' ? 'Self' : selected?.relation || 'Dependent' },
      treatment: { placeOfIllness, hospitalised, withinState: true, hospitalType, hospitalName, hospitalAddress: profile.officeAddress, fromDate: periodFrom, toDate: periodTo || undefined, diagnosis, treatmentAbroad: 'NA' },
      bills: [], docs: [], advances: [], finalClaim: { amaId: 'AMA-1' }, movement: [{ id: crypto.randomUUID(), action: 'Case created', at: new Date().toISOString() }],
    };
    const updated = upsertCase(next, cases);
    setCases(updated);
    setOpen(false);
    window.location.href = `/reimbursement/medical/${next.mrId}`;
  };

  return <div className={styles.shellBg}><div className={styles.container}>
    <section className={styles.cover}><div className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold">Medical Reimbursement Control Center</h1><p className="text-sm text-indigo-100">Case-book view with complete annexure and preview flows.</p></div><button className="rounded-lg bg-white/10 px-3 py-2" onClick={() => setOpen(true)}><PlusIcon className="inline h-4"/> New MR Case</button></div></section>

    <div className="mt-4 grid gap-2 md:grid-cols-6">{statusOrder.slice(1).map((s)=><button key={s} onClick={()=>setStatus(s as MRStatus)} className={styles.tab}>{s} ({cases.filter(c=>c.status===s).length})</button>)}</div>

    <section className={`${styles.page} mt-4`}><h3 className="font-semibold">Recently Updated</h3><div className="mt-2 grid gap-3 md:grid-cols-3 xl:grid-cols-4">{[...cases].sort((a,b)=>b.lastUpdated.localeCompare(a.lastUpdated)).slice(0,7).map(c=><Link href={`/reimbursement/medical/${c.mrId}`} key={c.mrId} className={styles.bookCard}><div className="text-sm font-semibold">{c.mrNo}</div><div className="text-xs">{c.patient.name}</div><div className="text-xs">{c.treatment.hospitalName}</div><div className="text-xs mt-1">{c.status}</div></Link>)}</div></section>

    <section className={`${styles.page} mt-4`}><h3 className="font-semibold">All Requests</h3><div className="mt-2 flex flex-wrap gap-2"><input className="rounded border px-3 py-2" placeholder="Search" value={search} onChange={(e)=>setSearch(e.target.value)} /><select className="rounded border px-3 py-2" value={year} onChange={(e)=>setYear(e.target.value)}><option value="all">All Years</option><option value="2026">2026</option></select></div><div className="mt-3 grid gap-3">{filtered.map(c=>{const total=c.bills.reduce((s,b)=>s+b.totalAmount,0); const adv=c.advances.filter(a=>a.status==='Paid').reduce((s,a)=>s+a.amount,0); const missing=['DISCHARGE','EC_SIGNED'].filter(t=>!c.docs.some(d=>d.type===t as any)); return <article key={c.mrId} className={styles.bookCard}><div className="flex justify-between"><Link href={`/reimbursement/medical/${c.mrId}`} className="font-semibold">{c.mrNo}</Link><span className={styles.stamp}>{c.status}</span></div><div className="text-sm">{c.patient.name} ({c.patient.relation})</div><div className="text-xs">{c.treatment.hospitalName} | {c.treatment.fromDate}</div><div className="text-xs mt-1">Bills ₹{total} | Advance Paid ₹{adv} | Balance ₹{Math.max(total-adv,0)}</div><div className="mt-2 flex flex-wrap gap-2 text-xs"><Link className="rounded border px-2 py-1" href={`/reimbursement/medical/${c.mrId}`}>Continue</Link><Link className="rounded border px-2 py-1" href={`/reimbursement/medical/${c.mrId}#annexures`}>Add Bill/Doc</Link><Link className="rounded border px-2 py-1" href={`/reimbursement/medical/${c.mrId}#advance`}>Add Advance</Link><button disabled={missing.length>0} title={missing.length?`Missing: ${missing.join(', ')}`:''} className="rounded border px-2 py-1 disabled:opacity-40">Submit Final</button></div></article>;})}</div></section>

    {open && <div className="fixed inset-0 z-50 bg-black/40 p-4"><div className="mx-auto mt-16 max-w-4xl rounded-xl bg-[#FFF9F0] p-4"><div className="grid gap-4 md:grid-cols-2"><div className={styles.page}><h4 className="font-semibold">Officer Identity</h4><p>{profile.fullName}</p><p>PEN {profile.penNumber} | {profile.serviceType}</p><p>{profile.designation}</p><p>{profile.officeAddress}</p></div><div className={styles.page}><h4 className="font-semibold">Create Case</h4><div className="mt-2 flex gap-2"><button onClick={()=>setClaimFor('SELF')} className="rounded border px-3 py-2">Self</button><button onClick={()=>setClaimFor('DEPENDENT')} className="rounded border px-3 py-2">Dependent</button></div>{claimFor==='DEPENDENT' && <div className="mt-2 flex flex-wrap gap-2">{dependents.map(d=><button key={d.personId} onClick={()=>setDepId(d.personId)} className="rounded-full border px-2 py-1 text-xs">{d.relationType}: {d.fullName}</button>)}</div>}{selected && <div className="mt-2 rounded border p-2 text-xs">{selected.fullName} | {selected.relation} | {selected.gender} | {selected.dob}</div>}<div className="mt-2 grid gap-2"><input className="rounded border px-3 py-2" value={hospitalName} onChange={(e)=>setHospitalName(e.target.value)} placeholder="Hospital Name"/><input className="rounded border px-3 py-2" value={placeOfIllness} onChange={(e)=>setPlaceOfIllness(e.target.value)} placeholder="Place of illness occurred"/><label className="text-sm"><input type="checkbox" checked={hospitalised} onChange={(e)=>setHospitalised(e.target.checked)}/> Hospitalised</label>{hospitalised && <><select className="rounded border px-3 py-2" value={hospitalType} onChange={(e)=>setHospitalType(e.target.value as any)}><option>Government</option><option>Empanelled Private</option></select><input className="rounded border px-3 py-2" value={profile.officeAddress} readOnly/></>}<input type="date" className="rounded border px-3 py-2" value={periodFrom} onChange={(e)=>setPeriodFrom(e.target.value)}/><input type="date" className="rounded border px-3 py-2" value={periodTo} onChange={(e)=>setPeriodTo(e.target.value)}/><input className="rounded border px-3 py-2" value={diagnosis} onChange={(e)=>setDiagnosis(e.target.value)} placeholder="Diagnosis (optional)"/><label className="text-sm"><input type="checkbox" checked={declared} onChange={(e)=>setDeclared(e.target.checked)}/> Declaration</label></div></div></div><div className="mt-3 flex justify-end gap-2"><button className="rounded border px-3 py-2" onClick={()=>setOpen(false)}>Cancel</button><button className="rounded bg-indigo-700 px-3 py-2 text-white" onClick={createCase}>Create MR Case</button></div></div></div>}
  </div></div>;
}
