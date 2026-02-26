'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/utils/apiClient';
import { mapOfficerProfile } from '@/modules/medical-reimbursement/mapper';
import { createCase, initCases, loadCases } from '@/modules/medical-reimbursement/mockStore';
import type { MRCase, OfficerProfileVM } from '@/modules/medical-reimbursement/types';
import styles from '@/modules/medical-reimbursement/mr.module.css';
import { advancePaid, billsTotal, missingItems, statusColor } from '@/modules/medical-reimbursement/utils';

const tabKeys = ['Draft', 'Active', 'Advance Submitted', 'Advance Paid', 'Final Submitted', 'Paid & Closed'];

const emptyOfficer: OfficerProfileVM = mapOfficerProfile({});

export default function MRControlCenter() {
  const router = useRouter();
  const [cases, setCases] = useState<MRCase[]>([]);
  const [officer, setOfficer] = useState<OfficerProfileVM>(emptyOfficer);
  const [tab, setTab] = useState('Draft');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [claimFor, setClaimFor] = useState<'SELF' | 'DEPENDENT'>('SELF');
  const [dep, setDep] = useState('');
  const [form, setForm] = useState({ hospitalName: '', placeOfIllness: '', hospitalised: true, hospitalType: 'Govt', hospitalAddress: '', fromDate: '', toDate: '', diagnosis: '', declaration: false });

  useEffect(() => {
    const boot = async () => {
      let vm = emptyOfficer;
      try {
        const res = await axiosInstance.get('/officer/officer-preview');
        vm = mapOfficerProfile(res.data);
      } catch {
        vm = mapOfficerProfile({});
      }
      setOfficer(vm);
      setCases(initCases(vm));
    };
    boot();
  }, []);

  const filtered = useMemo(() => loadCases().filter((c) => c.status === tab || (tab === 'Paid & Closed' && c.status === 'Approved') || c.status === tab)
    .filter((c) => `${c.mrNo} ${c.patient.name} ${c.treatment.hospitalName}`.toLowerCase().includes(query.toLowerCase())), [tab, query, cases]);

  const sorted = [...cases].sort((a, b) => +new Date(b.lastUpdated) - +new Date(a.lastUpdated)).slice(0, 7);

  const onCreate = () => {
    if (!form.fromDate || !form.hospitalName || !form.declaration) return;
    const selectedDep = officer.dependents.find((d) => d.personId === dep);
    const created = createCase(officer, {
      patient: {
        claimFor,
        dependentPersonId: claimFor === 'DEPENDENT' ? selectedDep?.personId : undefined,
        name: claimFor === 'SELF' ? officer.fullName : selectedDep?.fullName || 'Dependent',
        relation: claimFor === 'SELF' ? 'Self' : selectedDep?.relation || 'Dependent',
      },
      treatment: form,
    });
    setCases(loadCases());
    setOpen(false);
    router.push(`/reimbursement/medical/${created.mrId}`);
  };

  return <div className={styles.mrShell}><div className={styles.container}>
    <div className={`${styles.commandBar} flex justify-between items-center mb-3`}>
      <h1 className="font-semibold text-lg">Medical Reimbursement • Control Center</h1>
      <button className="px-4 py-2 bg-[#0b2a45] text-white rounded" onClick={() => setOpen(true)}>New MR Case</button>
    </div>

    <div className="mb-4 flex gap-2 flex-wrap">{tabKeys.map((k) => <button key={k} onClick={() => setTab(k)} className={`${styles.tab} ${tab === k ? styles.activeTab : ''}`}>{k} ({cases.filter((c) => c.status === k).length})</button>)}</div>

    <div className={`${styles.page} mb-4`}>
      <div className="font-semibold mb-2">Recently Updated</div>
      <div className={styles.carousel}>{sorted.map((c) => <button key={c.mrId} className={`${styles.miniBook} text-left`} onClick={() => router.push(`/reimbursement/medical/${c.mrId}`)}>
        <div className="text-xs">{c.mrNo}</div><div className="font-semibold truncate">{c.patient.name}</div><div className="text-xs truncate">{c.treatment.hospitalName}</div><div className="text-[11px] mt-2">Last action: {c.movement.at(-1)?.action}</div><span className={styles.statusStamp} style={{ color: '#fff' }}>{c.status}</span>
      </button>)}</div>
    </div>

    <div className={styles.page}>
      <div className="flex justify-between mb-3"><h2 className="font-semibold">All Requests</h2><input className="border rounded px-3 py-2 w-80 max-w-full" placeholder="Search MR, patient, hospital" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      <div className="space-y-2">{filtered.map((c) => <div key={c.mrId} className={styles.bookCard} style={{ borderLeftColor: statusColor(c.status) }}>
        <div className="flex justify-between gap-4 flex-wrap"><div><div className="font-semibold">{c.mrNo}</div><div className="text-sm">{c.patient.name} ({c.patient.relation})</div><div className="text-sm text-gray-600">{c.treatment.hospitalName} • {c.treatment.fromDate} - {c.treatment.toDate || 'Ongoing'}</div></div>
          <div className="text-sm">Bills {billsTotal(c)} | Advance {advancePaid(c)} | Balance {billsTotal(c) - advancePaid(c)}</div>
          <div className="flex gap-2 flex-wrap">
            <button className="px-3 py-1 border rounded" onClick={() => router.push(`/reimbursement/medical/${c.mrId}`)}>Continue</button>
            <button className="px-3 py-1 border rounded" onClick={() => router.push(`/reimbursement/medical/${c.mrId}?tab=ANNEXURES`)}>Add Bill/Doc</button>
            <button className="px-3 py-1 border rounded" onClick={() => router.push(`/reimbursement/medical/${c.mrId}?tab=ADVANCE NOTES`)}>Add Advance</button>
            <button disabled={missingItems(c).length > 0} title={missingItems(c).join(', ')} className="px-3 py-1 rounded bg-[#0b2a45] text-white disabled:opacity-50">Submit Final</button>
          </div></div>
      </div>)}</div>
    </div>

    {open && <div className="fixed inset-0 z-50 bg-black/40 p-4 overflow-auto"><div className="max-w-5xl mx-auto bg-[#fff9f0] rounded-xl p-4 mt-20">
      <div className="flex justify-between"><h3 className="font-semibold">Create Medical Reimbursement Case</h3><button onClick={() => setOpen(false)}>✕</button></div>
      <div className={styles.grid2}>
        <div className={styles.page}><h4 className="font-semibold mb-2">Officer Identity</h4><div className="text-sm space-y-1"><div>{officer.fullName}</div><div>PEN: {officer.penNumber}</div><div>{officer.serviceType} • {officer.cadre}</div><div>{officer.email}</div><div>{officer.mobile}</div><div>{officer.officeAddress}</div></div></div>
        <div className={styles.page}><h4 className="font-semibold mb-2">Create Case</h4>
          <div className="flex gap-2 mb-2"><button className={`px-3 py-2 border rounded ${claimFor === 'SELF' ? 'bg-[#0b2a45] text-white' : ''}`} onClick={() => setClaimFor('SELF')}>Self</button><button className={`px-3 py-2 border rounded ${claimFor === 'DEPENDENT' ? 'bg-[#0b2a45] text-white' : ''}`} onClick={() => setClaimFor('DEPENDENT')}>Dependent</button></div>
          {claimFor === 'DEPENDENT' && <div className="mb-2 flex flex-wrap gap-2">{officer.dependents.map((d) => <button key={d.personId} onClick={() => setDep(d.personId)} className={`px-3 py-1 rounded-full border ${dep === d.personId ? 'bg-slate-900 text-white' : ''}`}>{d.relationType}: {d.fullName}</button>)}</div>}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <input className="border rounded p-2" placeholder="Hospital Name" onChange={(e) => setForm({ ...form, hospitalName: e.target.value })} />
            <input className="border rounded p-2" placeholder="Place of illness" onChange={(e) => setForm({ ...form, placeOfIllness: e.target.value })} />
            <input className="border rounded p-2" placeholder="Hospital address" onChange={(e) => setForm({ ...form, hospitalAddress: e.target.value })} />
            <input type="date" className="border rounded p-2" onChange={(e) => setForm({ ...form, fromDate: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm my-3"><input type="checkbox" onChange={(e) => setForm({ ...form, declaration: e.target.checked })} /> I declare details are true.</label>
          <button className="bg-[#0b2a45] text-white px-4 py-2 rounded" onClick={onCreate}>Create MR Case</button>
        </div>
      </div>
    </div></div>}
  </div></div>;
}
