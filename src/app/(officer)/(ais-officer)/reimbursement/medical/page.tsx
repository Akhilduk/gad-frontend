'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Bell, Briefcase, CheckCircle, Clock, FileText, Shield } from 'lucide-react';
import { UserCircle2, Stethoscope, Activity, CalendarDays } from 'lucide-react';
import axiosInstance from '@/utils/apiClient';
import { mapOfficerProfile } from '@/modules/medical-reimbursement/mapper';
import { createCase, initCases, loadCases } from '@/modules/medical-reimbursement/mockStore';
import type { MRCase, OfficerProfileVM } from '@/modules/medical-reimbursement/types';
import styles from '@/modules/medical-reimbursement/mr.module.css';
import { STATIC_MR_ROUTE_PARAM, setActiveMrId } from '@/modules/medical-reimbursement/session';

const emptyOfficer: OfficerProfileVM = mapOfficerProfile({});

const tabs = [
  { key: 'ALL', label: 'All', icon: Briefcase },
  { key: 'Draft', label: 'Draft', icon: FileText },
  { key: 'Advance Submitted', label: 'Advance Requested', icon: Clock },
  { key: 'Advance Paid', label: 'Advance Approved', icon: Award },
  { key: 'Final Submitted', label: 'Submitted', icon: Bell },
  { key: 'Approved', label: 'Approved', icon: CheckCircle },
  { key: 'Paid & Closed', label: 'Paid', icon: Shield },
];

const workflowSteps = ['Draft', 'Advance Submitted', 'Advance Paid', 'Final Submitted', 'Approved', 'Paid & Closed'] as const;

const statusStyles = (status: MRCase['status']) => {
  if (status === 'Draft') return { tone: styles.toneDraft, text: styles.statusDraft };
  if (status === 'Advance Submitted') return { tone: styles.toneAdvanceRequested, text: styles.statusAdvanceRequested };
  if (status === 'Advance Paid') return { tone: styles.toneAdvanceApproved, text: styles.statusAdvanceApproved };
  if (status === 'Final Submitted' || status === 'Active') return { tone: styles.toneSubmitted, text: styles.statusSubmitted };
  if (status === 'Approved') return { tone: styles.toneApproved, text: styles.statusApproved };
  return { tone: styles.tonePaid, text: styles.statusPaid };
};

const statusLabel = (status: MRCase['status']) => {
  if (status === 'Advance Submitted') return 'ADVANCE REQUESTED';
  if (status === 'Advance Paid') return 'ADVANCE APPROVED';
  if (status === 'Final Submitted') return 'FINAL SUBMITTED';
  if (status === 'Active') return 'ACTIVE';
  if (status === 'Paid & Closed') return 'PAID';
  return status.toUpperCase();
};

const withOffsetDate = (dateIso: string, dayOffset: number) => {
  const d = new Date(dateIso);
  d.setDate(d.getDate() + dayOffset);
  return d;
};

const isRecent = (createdAt: Date, updatedAt: Date) => {
  const latest = Math.max(createdAt.getTime(), updatedAt.getTime());
  return Date.now() - latest <= 1000 * 60 * 60 * 48;
};

type CardAction = { label: string; onClick: () => void };
type HospitalOption = { name: string; address: string };

export default function MRControlCenter() {
  const router = useRouter();
  const [cases, setCases] = useState<MRCase[]>([]);
  const [officer, setOfficer] = useState<OfficerProfileVM>(emptyOfficer);
  const [tab, setTab] = useState('ALL');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [claimFor, setClaimFor] = useState<'SELF' | 'DEPENDENT'>('SELF');
  const [dep, setDep] = useState('');
  const [form, setForm] = useState({
    hospitalised: true,
    hospitalType: 'Government',
    medicalType: 'Allopathy',
    hospitalName: '',
    hospitalAddress: '',
    fromDate: '',
    toDate: '',
    declaration: false,
  });
  const [hospitalQuery, setHospitalQuery] = useState('');
  const [hospitalOptions, setHospitalOptions] = useState<HospitalOption[]>([]);
  const [hospitalLoading, setHospitalLoading] = useState(false);
  const [hospitalFocused, setHospitalFocused] = useState(false);
  const skipAutocompleteRef = useRef(false);

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

  const selectedDependent = officer.dependents.find((d) => d.personId === dep);
  const applicantName = claimFor === 'SELF' ? officer.fullName : selectedDependent?.fullName || '';
  const applicantMeta = claimFor === 'SELF'
    ? `${officer.serviceType} | PEN ${officer.penNumber}`
    : selectedDependent
      ? `${selectedDependent.relation} | ${selectedDependent.gender} | DOB: ${selectedDependent.dob}`
      : '';

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !form.hospitalised) return;
    if (skipAutocompleteRef.current) {
      skipAutocompleteRef.current = false;
      return;
    }
    const q = hospitalQuery.trim();
    if (!hospitalFocused || q.length < 3) {
      setHospitalOptions([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = window.setTimeout(async () => {
      setHospitalLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=in&limit=6&q=${encodeURIComponent(`${q} hospital`)}`;
        const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
        const data = await res.json();
        const opts: HospitalOption[] = Array.isArray(data)
          ? data.map((item: any) => ({
              name: String(item?.name || item?.display_name?.split(',')[0] || 'Hospital'),
              address: String(item?.display_name || ''),
            }))
          : [];
        setHospitalOptions(opts.filter((o) => o.address));
      } catch {
        if (!ctrl.signal.aborted) setHospitalOptions([]);
      } finally {
        if (!ctrl.signal.aborted) setHospitalLoading(false);
      }
    }, 320);
    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [hospitalQuery, form.hospitalised, hospitalFocused, open]);

  const openCase = (mrId: string, tabName?: string) => {
    setActiveMrId(mrId);
    const suffix = tabName ? `?tab=${encodeURIComponent(tabName)}` : '';
    router.push(`/reimbursement/medical/${STATIC_MR_ROUTE_PARAM}${suffix}`);
  };

  const list = useMemo(() => {
    const byTab = tab === 'ALL' ? cases : cases.filter((c) => c.status === tab);
    const q = query.trim().toLowerCase();
    if (!q) return byTab;
    return byTab.filter((c) => `${c.mrNo} ${c.patient.name} ${c.treatment.hospitalName} ${c.status}`.toLowerCase().includes(q));
  }, [tab, cases, query]);

  const tabCount = (key: string) => key === 'ALL' ? cases.length : cases.filter((c) => c.status === key).length;

  const onCreate = () => {
    if (!form.fromDate || !form.declaration) return;
    if (claimFor === 'DEPENDENT' && !dep) return;
    if (form.hospitalised && !form.hospitalName) return;

    const created = createCase(officer, {
      patient: {
        claimFor,
        dependentPersonId: claimFor === 'DEPENDENT' ? selectedDependent?.personId : undefined,
        name: claimFor === 'SELF' ? officer.fullName : selectedDependent?.fullName || 'Dependent',
        relation: claimFor === 'SELF' ? 'Self' : selectedDependent?.relation || 'Dependent',
      },
      treatment: {
        placeOfIllness: '',
        hospitalised: form.hospitalised,
        withinState: true,
        hospitalType: form.hospitalType,
        hospitalName: form.hospitalised ? form.hospitalName : 'Not hospitalised',
        hospitalAddress: form.hospitalised ? (form.hospitalAddress || form.hospitalName) : '',
        fromDate: form.fromDate,
        toDate: form.toDate,
        diagnosis: form.medicalType,
      },
    });
    setCases(loadCases());
    setOpen(false);
    openCase(created.mrId);
  };

  const actionsFor = (c: MRCase): CardAction[] => {
    const view = { label: 'View', onClick: () => openCase(c.mrId) };
    const cont = { label: 'Continue', onClick: () => openCase(c.mrId) };
    if (c.status === 'Draft') return [view, cont, { label: 'Add Bills', onClick: () => openCase(c.mrId, 'ANNEXURES') }];
    if (c.status === 'Active') return [view, cont, { label: 'Add Bills', onClick: () => openCase(c.mrId, 'ANNEXURES') }, { label: 'Add Advance', onClick: () => openCase(c.mrId, 'ADVANCE NOTES') }];
    if (c.status === 'Advance Submitted') return [view, cont, { label: 'Track Advance', onClick: () => openCase(c.mrId, 'ADVANCE NOTES') }];
    if (c.status === 'Advance Paid') return [view, cont, { label: 'Final Note', onClick: () => openCase(c.mrId, 'FINAL NOTE') }];
    if (c.status === 'Final Submitted') return [view, { label: 'Track', onClick: () => openCase(c.mrId, 'MOVEMENT REGISTER') }];
    if (c.status === 'Approved') return [view, { label: 'Track Payment', onClick: () => openCase(c.mrId, 'MOVEMENT REGISTER') }];
    return [view];
  };

  const formatShort = (date: Date) => date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const statusIndex = (status: MRCase['status']) => {
    if (status === 'Active') return 2;
    return Math.max(0, workflowSteps.indexOf(status as (typeof workflowSteps)[number]));
  };
  const activeCases = cases.filter((c) => ['Advance Submitted', 'Advance Paid', 'Active', 'Final Submitted', 'Approved'].includes(c.status)).length;
  const recentCases = cases.filter((c) => isRecent(new Date(c.createdAt), new Date(c.lastUpdated))).length;

    return <div className="min-h-screen p-6 transition-colors duration-300 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800"><div className="max-w-7xl mx-auto space-y-6">
    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-blue-50 dark:border-slate-700 p-8 transition-all duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">Medical Reimbursement</div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Medical reimbursement requests</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Create, find, and continue a case from one clean workspace.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <button className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95" onClick={() => setOpen(true)}>Create New Request</button>
          <div className="text-sm text-slate-500 dark:text-slate-400">{activeCases} active case(s) and {recentCases} recently updated</div>
        </div>
      </div>
    </section>

    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-blue-50 dark:border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-900/20 dark:to-cyan-900/20">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2"><Briefcase className="text-indigo-500" /> Request Explorer</h2>
        </div>
        <div className="w-full md:w-96">
          <input className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="Search by MR No, requester, hospital, status" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="flex space-x-3 p-5 bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-900 dark:to-slate-800/80 overflow-x-auto border-b-2 border-indigo-100 dark:border-indigo-900/50">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 transform ${
              tab === t.key
              ? 'bg-gradient-to-r from-indigo-900 via-indigo-600 to-indigo-900 text-white shadow-lg shadow-indigo-500/30 scale-105 border-0'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-300 border border-indigo-100 dark:border-slate-600 shadow-sm'
            }`}
            onClick={() => setTab(t.key)}
          >
            <t.icon size={18} className={tab === t.key ? 'text-indigo-200' : 'text-indigo-500 dark:text-indigo-400'} />
            <span>{t.label}</span>
            <b className={`ml-1 px-2.5 py-0.5 rounded-full text-xs ${
              tab === t.key
              ? 'bg-white/20 text-white border border-white/30'
              : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
            }`}>
              {tabCount(t.key)}
            </b>
          </button>
        ))}
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">No cases found matching your criteria.</div>
        ) : (
          list.map((c, idx) => {
            const tone = statusStyles(c.status);
            const recent = isRecent(new Date(c.createdAt), new Date(c.lastUpdated));
            const actions = actionsFor(c);
            const updatedAt = new Date(c.lastUpdated);
            const createdAt = new Date(c.createdAt);
            const startDate = new Date(c.treatment.fromDate);

            return (
            <article key={c.mrId} className={`bg-white dark:bg-slate-800 rounded-2xl border-2 p-6 flex flex-col justify-between shadow-md hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 relative group overflow-hidden ${
              c.status === 'Draft' ? 'border-gray-200 hover:border-gray-400 dark:border-slate-700 dark:hover:border-slate-500' :
              c.status.includes('Approved') || c.status.includes('Paid') ? 'border-emerald-200 hover:border-emerald-500 dark:border-emerald-900/50 dark:hover:border-emerald-500/80' :
              'border-indigo-200 hover:border-indigo-500 dark:border-indigo-800/50 dark:hover:border-indigo-500/80'
            }`} style={{ animationDelay: `${idx * 50}ms` }}>

              <div className={`absolute top-0 left-0 w-full h-2 ${
                c.status === 'Draft' ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                c.status.includes('Approved') || c.status.includes('Paid') ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                'bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900'
              }`}></div>

              <div className="flex justify-between items-start mb-5 pt-2">
                <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm border ${
                  c.status === 'Draft' ? 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' :
                  c.status.includes('Approved') || c.status.includes('Paid') ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
                  'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800'
                }`}>{statusLabel(c.status)}</div>
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
                    <span>{statusIndex(c.status) + 1} / {workflowSteps.length} Steps</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 shadow-inner overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-900 via-indigo-500 to-cyan-500 h-full rounded-full transition-all duration-1000 relative" style={{ width: `${Math.max(15, ((statusIndex(c.status) + 1) / workflowSteps.length) * 100)}%` }}>
                      <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress_1s_linear_infinite]"></div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2.5 pt-4 border-t border-indigo-100 dark:border-slate-700">
                  {actions.map((a, i) => (
                    <button
                      key={`${c.mrId}-${a.label}`}
                      className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all shadow-sm ${
                        i === 0
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-800 text-white hover:shadow-md hover:shadow-indigo-500/30 border border-transparent'
                        : 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300'
                      }`}
                      onClick={a.onClick}
                    >
                      {i === 0 ? <Shield size={16} /> : <FileText size={16} />}
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </article>
            );
          })
        )}
      </div>
      <div className="p-4 border-t border-gray-100 dark:border-slate-700 text-center text-sm text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50">Page 1 of 1</div>
    </section>

    {open && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-indigo-100 dark:border-slate-700">
        <div className="p-6 bg-gradient-to-r from-indigo-900 via-indigo-600 to-indigo-900 text-white flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-1">Create Medical Reimbursement Case</h2>
            <p className="text-indigo-100 opacity-90 text-sm">Start a new case by filling out the initial details.</p>
          </div>
          <button onClick={() => { setOpen(false); setHospitalOptions([]); }} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50 dark:bg-slate-900">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Applicant Type</label>
              <div className="flex p-1 bg-gray-100 dark:bg-slate-900 rounded-lg">
                <button className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${claimFor === 'SELF' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`} onClick={() => setClaimFor('SELF')}>Self</button>
                <button className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${claimFor === 'DEPENDENT' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`} onClick={() => setClaimFor('DEPENDENT')}>Dependent</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Care Journey</label>
              <div className="flex p-1 bg-gray-100 dark:bg-slate-900 rounded-lg">
                <button className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${form.hospitalised ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`} onClick={() => setForm((prev) => ({ ...prev, hospitalised: true }))}>Hospitalised</button>
                <button
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${!form.hospitalised ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                  onClick={() => {
                    setForm((prev) => ({ ...prev, hospitalised: false, hospitalName: '', hospitalAddress: '' }));
                    setHospitalQuery('');
                    setHospitalOptions([]);
                  }}
                >
                  Not Hospitalised
                </button>
              </div>
            </div>
            {form.hospitalised && (
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Institution Type</label>
                <div className="flex p-1 bg-gray-100 dark:bg-slate-900 rounded-lg max-w-sm">
                  <button className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${form.hospitalType === 'Government' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`} onClick={() => setForm((prev) => ({ ...prev, hospitalType: 'Government' }))}>Government</button>
                  <button className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${form.hospitalType === 'Private' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`} onClick={() => setForm((prev) => ({ ...prev, hospitalType: 'Private' }))}>Private</button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="font-bold text-lg border-b border-gray-100 dark:border-slate-700 pb-2 text-indigo-900 dark:text-indigo-300">Claim Snapshot</h3>

              {claimFor === 'DEPENDENT' && (
                <div>
                  <select className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 px-4 py-2.5 text-sm outline-none" value={dep} onChange={(e) => setDep(e.target.value)}>
                    <option value="">Select dependent</option>
                    {officer.dependents.map((d) => <option key={d.personId} value={d.personId}>{d.relationType}: {d.fullName}</option>)}
                  </select>
                </div>
              )}

              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                <div className="font-bold text-indigo-900 dark:text-indigo-300 mb-1">Applicant Name: {applicantName || 'Select dependent to continue'}</div>
                <div className="text-sm text-indigo-700/80 dark:text-indigo-400/80">{applicantMeta || 'Dependent basic details will appear here.'}</div>
                {claimFor === 'SELF' && (
                  <div className="text-sm text-indigo-700/80 dark:text-indigo-400/80 mt-2 pt-2 border-t border-indigo-200 dark:border-indigo-800">
                    Designation: {officer.designation} | Grade {officer.grade} | {officer.level}
                  </div>
                )}
              </div>

              <div className="space-y-2 mt-4 text-sm">
                <div className="flex justify-between border-b border-gray-100 dark:border-slate-700 pb-1">
                  <span className="text-gray-500 dark:text-slate-400">Start date</span>
                  <strong className="text-gray-900 dark:text-slate-200">{form.fromDate || 'Pending'}</strong>
                </div>
                <div className="flex justify-between border-b border-gray-100 dark:border-slate-700 pb-1">
                  <span className="text-gray-500 dark:text-slate-400">End date</span>
                  <strong className="text-gray-900 dark:text-slate-200">{form.toDate || 'Optional'}</strong>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-gray-500 dark:text-slate-400">System</span>
                  <strong className="text-gray-900 dark:text-slate-200">{form.medicalType}</strong>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {form.hospitalised && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
                  <h3 className="font-bold text-lg border-b border-gray-100 dark:border-slate-700 pb-2 text-indigo-900 dark:text-indigo-300">Hospital Details</h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Hospital Name</label>
                      <input
                        className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="Type hospital name"
                        value={hospitalQuery}
                        onChange={(e) => {
                          const value = e.target.value;
                          setHospitalQuery(value);
                          setForm((prev) => ({ ...prev, hospitalName: value }));
                        }}
                        onFocus={() => setHospitalFocused(true)}
                        onBlur={() => window.setTimeout(() => setHospitalFocused(false), 140)}
                      />
                      {hospitalFocused && (hospitalLoading || hospitalOptions.length > 0) && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                          {hospitalLoading && <div className="p-3 text-sm text-gray-500">Searching hospitals...</div>}
                          {!hospitalLoading && hospitalOptions.map((opt) => (
                            <button
                              key={`${opt.name}-${opt.address}`}
                              type="button"
                              className="w-full text-left p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border-b border-gray-100 dark:border-slate-700 last:border-0"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                skipAutocompleteRef.current = true;
                                setHospitalQuery(opt.name);
                                setHospitalOptions([]);
                                setHospitalFocused(false);
                                setForm((prev) => ({ ...prev, hospitalName: opt.name, hospitalAddress: opt.address }));
                              }}
                            >
                              <div className="font-medium text-sm text-gray-900 dark:text-slate-200">{opt.name}</div>
                              <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{opt.address}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Hospital Address</label>
                      <input
                        className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="Hospital full address"
                        value={form.hospitalAddress}
                        onChange={(e) => setForm((prev) => ({ ...prev, hospitalAddress: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
                <h3 className="font-bold text-lg border-b border-gray-100 dark:border-slate-700 pb-2 text-indigo-900 dark:text-indigo-300">Treatment Details</h3>

                {form.hospitalised && (
                  <div className="flex p-1 bg-gray-100 dark:bg-slate-900 rounded-lg">
                    <button className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${form.medicalType === 'Allopathy' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400'}`} onClick={() => setForm((prev) => ({ ...prev, medicalType: 'Allopathy' }))}>Allopathy</button>
                    <button className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${form.medicalType === 'Ayurveda' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400'}`} onClick={() => setForm((prev) => ({ ...prev, medicalType: 'Ayurveda' }))}>Ayurveda</button>
                    <button className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${form.medicalType === 'Homeopathy' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400'}`} onClick={() => setForm((prev) => ({ ...prev, medicalType: 'Homeopathy' }))}>Homeo</button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Start Date</label>
                    <input type="date" className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 px-4 py-2 text-sm focus:border-indigo-500 outline-none" onChange={(e) => setForm((prev) => ({ ...prev, fromDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">End Date <span className="font-normal text-gray-400">(Optional)</span></label>
                    <input type="date" className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 px-4 py-2 text-sm focus:border-indigo-500 outline-none" onChange={(e) => setForm((prev) => ({ ...prev, toDate: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" onChange={(e) => setForm((prev) => ({ ...prev, declaration: e.target.checked }))} />
            I declare that the details provided are true and accurate.
          </label>
          <div className="flex gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 font-semibold hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors" onClick={() => { setOpen(false); setHospitalOptions([]); }}>Cancel</button>
            <button className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold hover:from-indigo-700 hover:to-blue-700 shadow-md transition-all disabled:opacity-50" onClick={onCreate}>Create MR Case</button>
          </div>
        </div>
      </div>
    </div>}
  </div></div>;
}
