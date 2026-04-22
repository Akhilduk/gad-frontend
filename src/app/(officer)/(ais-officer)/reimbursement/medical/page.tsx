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
const medicalSystems = ['Allopathy', 'Ayurveda', 'Homeopathy', 'Siddha', 'Unani', 'Naturopathy', 'Yoga'] as const;

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
  const draftCases = cases.filter((c) => c.status === 'Draft').length;
  const settledCases = cases.filter((c) => c.status === 'Paid & Closed').length;

    return <div className={styles.controlShell}><div className={styles.controlContainer}>
    <section className={styles.heroPanel}>
      <div className={`${styles.heroOrb} ${styles.heroOrbOne}`}></div>
      <div className={`${styles.heroOrb} ${styles.heroOrbTwo}`}></div>
      <div className={`${styles.heroRing} ${styles.heroRingOne}`}></div>
      <div className={`${styles.heroRing} ${styles.heroRingTwo}`}></div>

      <div className={styles.heroGrid}>
        <div className={styles.heroContent}>
          <div className={styles.heroEyebrow}>Medical Reimbursement</div>
          <h1 className={styles.heroTitle}>Medical reimbursement requests</h1>
        </div>

        <div className={styles.heroAside}>
          <button className={styles.heroPrimaryButton} onClick={() => setOpen(true)}>Create New Request</button>
        </div>
      </div>
      <div className={styles.heroFooter}>
        <div className={styles.heroOfficerLine}>
          <UserCircle2 size={15} />
          <span>
            {officer.fullName || 'Officer profile'}
            {officer.designation ? ` | ${officer.designation}` : ''}
            {officer.penNumber ? ` | PEN ${officer.penNumber}` : ''}
          </span>
        </div>
        <div className={styles.heroSummaryLine}>
          <span>{cases.length} total</span>
          <span>{activeCases} active</span>
          <span>{draftCases} drafts</span>
          <span>{settledCases} closed</span>
        </div>
      </div>
    </section>

    <section className={styles.workspacePanel}>
      <div className={styles.tabRail}>
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`${styles.tabChip} ${tab === t.key ? styles.tabChipActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            <span className={styles.tabChipLabel}>
              <t.icon size={16} />
              <span>{t.label}</span>
            </span>
            <b>{tabCount(t.key)}</b>
          </button>
        ))}
      </div>

      <div className={styles.workspaceHeader}>
        <div className={styles.searchWrap}>
          <input
            className={styles.searchInput}
            placeholder="Search by MR No, requester, hospital, status"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.caseGrid}>
        {list.length === 0 ? (
          <div className={styles.emptyState}>No cases found matching your current search or filter.</div>
        ) : (
          list.map((c, idx) => {
            const tone = statusStyles(c.status);
            const recent = isRecent(new Date(c.createdAt), new Date(c.lastUpdated));
            const actions = actionsFor(c);
            const updatedAt = new Date(c.lastUpdated);
            const startDate = new Date(c.treatment.fromDate);
            const progressWidth = `${Math.max(15, ((statusIndex(c.status) + 1) / workflowSteps.length) * 100)}%`;

            return (
            <article key={c.mrId} className={styles.caseCard} style={{ animationDelay: `${idx * 60}ms` }}>
              <div className={`${styles.caseAccent} ${tone.tone}`}></div>

              <div className={styles.caseTopRow}>
                <div className={`${styles.caseBadge} ${tone.tone}`}>{statusLabel(c.status)}</div>
                <div className={styles.caseMetaTag}>{recent ? 'Recent' : 'Updated'} {formatShort(updatedAt)}</div>
              </div>

              <div className={styles.caseHeader}>
                <div>
                  <div className={styles.caseNumberRow}>
                    <h3 className={styles.caseNumber}>{c.mrNo}</h3>
                    {recent ? <span className={styles.livePill}>Live</span> : null}
                  </div>
                  <div className={styles.caseUserRow}>
                    <span className={styles.caseAvatar}><UserCircle2 size={17} /></span>
                    <div>
                      <div className={styles.casePatient}>{c.patient.name}</div>
                      <div className={styles.caseRelation}>Claim for {c.patient.claimFor === 'SELF' ? 'Self' : c.patient.relation}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.caseInfoGrid}>
                <div className={styles.caseInfoItem}>
                  <span>Hospital</span>
                  <strong title={c.treatment.hospitalName || 'Not entered'}>{c.treatment.hospitalName || 'Not entered'}</strong>
                </div>
                <div className={styles.caseInfoItem}>
                  <span>Treatment Date</span>
                  <strong>{formatShort(startDate)}</strong>
                </div>
              </div>

              <div className={styles.progressCard}>
                <div className={styles.progressHead}>
                  <span><Activity size={14} /> Progress</span>
                  <strong>{statusIndex(c.status) + 1} / {workflowSteps.length}</strong>
                </div>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: progressWidth }}></div>
                </div>
              </div>

              <div className={styles.caseActions}>
                {actions.slice(0, 2).map((a, i) => (
                  <button
                    key={`${c.mrId}-${a.label}`}
                    className={i === 0 ? styles.primaryAction : styles.secondaryAction}
                    onClick={a.onClick}
                  >
                    {i === 0 ? <Shield size={15} /> : <FileText size={15} />}
                    {a.label}
                  </button>
                ))}
              </div>
            </article>
            );
          })
        )}
      </div>

      <div className={styles.footerNote}>Showing {list.length} request{list.length === 1 ? '' : 's'} in the current view.</div>
    </section>

    {open && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border-2 border-indigo-100 dark:border-indigo-900/60">
        <div className="relative p-5 bg-gradient-to-r from-white via-indigo-50 to-sky-50 text-slate-900 flex justify-between items-start gap-4 border-b border-indigo-100 dark:border-indigo-900/40">
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400"></div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Create Request</div>
            <h2 className="text-2xl font-bold mt-1 mb-1">Medical reimbursement case</h2>
            <div className="text-sm text-slate-600">Use the same structured entry pattern as the reimbursement workspace.</div>
          </div>
          <button onClick={() => { setOpen(false); setHospitalOptions([]); }} className="text-slate-500 hover:bg-white p-2 rounded-lg transition-colors shrink-0" aria-label="Close dialog">X</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50 dark:bg-slate-900">

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/60 shadow-[0_12px_28px_rgba(79,70,229,0.08)]">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Applicant Type</label>
              <div className="flex p-1 rounded-xl border border-indigo-100 bg-indigo-50/70 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                <button className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${claimFor === 'SELF' ? 'border border-indigo-200 bg-white text-indigo-700 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:text-indigo-700 dark:hover:text-indigo-300'}`} onClick={() => setClaimFor('SELF')}>Self</button>
                <button className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${claimFor === 'DEPENDENT' ? 'border border-indigo-200 bg-white text-indigo-700 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:text-indigo-700 dark:hover:text-indigo-300'}`} onClick={() => setClaimFor('DEPENDENT')}>Dependent</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Care Journey</label>
              <div className="flex p-1 rounded-xl border border-indigo-100 bg-indigo-50/70 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                <button className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${form.hospitalised ? 'border border-indigo-200 bg-white text-indigo-700 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:text-indigo-700 dark:hover:text-indigo-300'}`} onClick={() => setForm((prev) => ({ ...prev, hospitalised: true }))}>Hospitalised</button>
                <button
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${!form.hospitalised ? 'border border-indigo-200 bg-white text-indigo-700 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:text-indigo-700 dark:hover:text-indigo-300'}`}
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
              <div className="col-span-1 xl:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Institution Type</label>
                <div className="flex p-1 rounded-xl border border-indigo-100 bg-indigo-50/70 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                  <button className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${form.hospitalType === 'Government' ? 'border border-indigo-200 bg-white text-indigo-700 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:text-indigo-700 dark:hover:text-indigo-300'}`} onClick={() => setForm((prev) => ({ ...prev, hospitalType: 'Government' }))}>Government</button>
                  <button className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${form.hospitalType === 'Private' ? 'border border-indigo-200 bg-white text-indigo-700 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:text-indigo-700 dark:hover:text-indigo-300'}`} onClick={() => setForm((prev) => ({ ...prev, hospitalType: 'Private' }))}>Private</button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-5">
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/60 shadow-[0_12px_28px_rgba(79,70,229,0.08)] space-y-4">
                <div className="pb-3 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between gap-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Claim Snapshot</h3>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Review</span>
                </div>

                {claimFor === 'DEPENDENT' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Dependent</label>
                    <select className="w-full rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" value={dep} onChange={(e) => setDep(e.target.value)}>
                      <option value="">Select dependent</option>
                      {officer.dependents.map((d) => <option key={d.personId} value={d.personId}>{d.relationType}: {d.fullName}</option>)}
                    </select>
                  </div>
                )}

                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 space-y-2">
                  <div className="font-bold text-indigo-900 dark:text-indigo-300">{applicantName || 'Select dependent to continue'}</div>
                  <div className="text-sm text-indigo-700/80 dark:text-indigo-400/80">{applicantMeta || 'Dependent basic details will appear here.'}</div>
                  {claimFor === 'SELF' && (
                    <div className="text-sm text-indigo-700/80 dark:text-indigo-400/80 pt-2 border-t border-indigo-200 dark:border-indigo-800">
                      Designation: {officer.designation} | Grade {officer.grade} | {officer.level}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-slate-50 dark:bg-slate-900/60 p-3 shadow-sm">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Start Date</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{form.fromDate || 'Pending'}</div>
                  </div>
                  <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-slate-50 dark:bg-slate-900/60 p-3 shadow-sm">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">End Date</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{form.toDate || 'Optional'}</div>
                  </div>
                  <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-slate-50 dark:bg-slate-900/60 p-3 shadow-sm">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">System</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{form.medicalType}</div>
                  </div>
                </div>
              </div>

              {form.hospitalised && (
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/60 shadow-[0_12px_28px_rgba(79,70,229,0.08)] space-y-4">
                  <div className="pb-3 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between gap-3">
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Hospital Details</h3>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Institution</span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Hospital Name</label>
                      <input
                        className="w-full rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
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
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-900/60 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                          {hospitalLoading && <div className="p-3 text-sm text-gray-500 dark:text-slate-400">Searching hospitals...</div>}
                          {!hospitalLoading && hospitalOptions.map((opt) => (
                            <button
                              key={`${opt.name}-${opt.address}`}
                              type="button"
                              className="w-full text-left p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border-b border-indigo-50 dark:border-slate-700 last:border-0"
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Hospital Address</label>
                      <input
                        className="w-full rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="Hospital full address"
                        value={form.hospitalAddress}
                        onChange={(e) => setForm((prev) => ({ ...prev, hospitalAddress: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/60 shadow-[0_12px_28px_rgba(79,70,229,0.08)] space-y-4">
                <div className="pb-3 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between gap-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Treatment Details</h3>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Medical</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Medical System</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/60 dark:bg-indigo-950/15 p-2">
                    {medicalSystems.map((system) => (
                      <button
                        key={system}
                        className={`px-3 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                          form.medicalType === system
                            ? 'border-indigo-300 bg-white text-indigo-700 dark:border-indigo-400 shadow-sm'
                            : 'border-indigo-100 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-900/50 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:bg-slate-800'
                        }`}
                        onClick={() => setForm((prev) => ({ ...prev, medicalType: system }))}
                      >
                        {system}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-slate-50 dark:bg-slate-900/50 p-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Start Date</label>
                    <input type="date" className="w-full rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" onChange={(e) => setForm((prev) => ({ ...prev, fromDate: e.target.value }))} />
                  </div>
                  <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-slate-50 dark:bg-slate-900/50 p-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">End Date <span className="font-normal text-gray-400 dark:text-slate-500">(Optional)</span></label>
                    <input type="date" className="w-full rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" onChange={(e) => setForm((prev) => ({ ...prev, toDate: e.target.value }))} />
                  </div>
                </div>
              </div>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 border-t border-indigo-100 dark:border-indigo-900/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <label className="flex items-start gap-3 text-sm text-gray-600 dark:text-slate-300 cursor-pointer max-w-2xl">
            <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5" onChange={(e) => setForm((prev) => ({ ...prev, declaration: e.target.checked }))} />
            I confirm the entered details.
          </label>
          <div className="flex gap-3 w-full lg:w-auto">
            <button className="flex-1 lg:flex-none px-6 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-semibold hover:bg-indigo-100 dark:hover:bg-slate-700 transition-colors" onClick={() => { setOpen(false); setHospitalOptions([]); }}>Cancel</button>
            <button className="flex-1 lg:flex-none px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50" onClick={onCreate}>Create MR Case</button>
          </div>
        </div>
      </div>
    </div>}
  </div></div>;
}
