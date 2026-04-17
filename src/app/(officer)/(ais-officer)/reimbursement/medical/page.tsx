'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Bell, Briefcase, CheckCircle, Clock, FileText, Shield } from 'lucide-react';
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

  return <div className={styles.mrShell}><div className={styles.container}>
    <section className={styles.mrLandingHero}>
      <div className={styles.mrLandingHeroMain}>
        <div className={styles.mrLandingEyebrow}>Medical Reimbursement</div>
        <h1 className={styles.mrLandingTitle}>Medical reimbursement requests</h1>
        <p className={styles.mrLandingText}>Create, find, and continue a case from one clean workspace.</p>
        <div className={styles.mrLandingActions}>
          <button className={styles.btnPrimary} onClick={() => setOpen(true)}>Create New Request</button>
          <div className={styles.mrInlineMeta}>{activeCases} active case(s) and {recentCases} recently updated</div>
        </div>
      </div>
    </section>

    <section className={styles.mrExplorerShell}>
      <div className={styles.mrExplorerHeader}>
        <div>
          <div className={styles.mrSectionEyebrow}>Request Explorer</div>
          <h2 className={styles.mrSectionTitle}>Request Explorer</h2>
        </div>
        <div className={styles.mrExplorerSearch}>
          <input className={`${styles.field} ${styles.searchInput}`} placeholder="Search by MR No, requester, hospital, status" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className={styles.mrFilterRail}>
        {tabs.map((t) => <button key={t.key} className={`${styles.mrFilterChip} ${tab === t.key ? styles.mrFilterChipActive : ''}`} onClick={() => setTab(t.key)}><t.icon className={styles.tabIcon} aria-hidden="true" /><span>{t.label}</span><b>{tabCount(t.key)}</b></button>)}
      </div>

      <div className={styles.mrCaseGrid}>
        {list.map((c, idx) => {
          const tone = statusStyles(c.status);
          const createdAt = withOffsetDate(c.createdAt, -idx * 2);
          const updatedAt = withOffsetDate(c.lastUpdated, -idx);
          const startDate = withOffsetDate(c.treatment.fromDate || c.createdAt, idx % 6);
          const recent = isRecent(createdAt, updatedAt);
          const actions = actionsFor(c);
          const progress = statusIndex(c.status);

          return (
            <article key={c.mrId} className={`${styles.mrCaseCard} ${tone.tone}`} style={{ animationDelay: `${idx * 50}ms` }}>
              <div className={styles.mrCaseCardTop}>
                <div className={`${styles.statusPill} ${tone.text}`}><span className={styles.statusIcon} aria-hidden="true" />{statusLabel(c.status)}</div>
                <div className={styles.mrCaseUpdate}>{recent ? 'Recently updated' : 'Updated'} {formatShort(updatedAt)}</div>
              </div>

              <div className={styles.mrCaseIdentity}>
                <div>
                  <div className={styles.cardId}>{c.mrNo}</div>
                  <div className={styles.mrCasePatient}>{c.patient.name} <span>{c.patient.claimFor === 'SELF' ? 'Self' : c.patient.relation}</span></div>
                </div>
                {recent ? <div className={styles.mrCaseBeacon}>Live</div> : null}
              </div>

              <div className={styles.mrCaseFacts}>
                <div className={styles.mrCaseFact}><span>Hospital</span><strong>{c.treatment.hospitalName || 'Hospital not entered'}</strong></div>
                <div className={styles.mrCaseFact}><span>Treatment Window</span><strong>{formatShort(startDate)}</strong></div>
                <div className={styles.mrCaseFact}><span>Created</span><strong>{formatShort(createdAt)}</strong></div>
              </div>

              <div className={styles.mrCaseProgress}>
                <div className={styles.mrCaseProgressHead}>
                  <span>Progress</span>
                  <strong>{Math.min(progress + 1, workflowSteps.length)} / {workflowSteps.length}</strong>
                </div>
                <div className={styles.mrProgressTrackCompact}>
                  <div className={styles.mrProgressBar}>
                    <i style={{ width: `${((progress + 1) / workflowSteps.length) * 100}%` }} />
                  </div>
                </div>
              </div>

              <div className={styles.mrCaseActions}>
                {actions.map((a) => <button key={`${c.mrId}-${a.label}`} className={styles.actionBtn} onClick={a.onClick}>{a.label}</button>)}
              </div>
            </article>
          );
        })}
      </div>

      <div className={styles.mrExplorerFooter}>Page 1 of 1</div>
    </section>

    {open && <div className={styles.modalOverlay}>
      <div className={styles.modalWrap}>
        <div className={styles.modalShell}>
          <div className={styles.modalHead}>
            <div>
              <div className={styles.modalTitle}>Create Medical Reimbursement Case</div>
              <div className={styles.modalSubTitle}>Start a new case.</div>
            </div>
            <button onClick={() => { setOpen(false); setHospitalOptions([]); }} className={styles.btnSecondary}>Close</button>
          </div>

          <div className={styles.modalBody}>
            <div className={styles.mrModalHero}>
              <div className={styles.mrModalHeroBlock}>
                <span className={styles.mrModalHeroLabel}>Applicant Type</span>
                <div className={styles.modalPillGroup}>
                  <button className={`${styles.btnPill} ${claimFor === 'SELF' ? styles.btnPillActive : ''}`} onClick={() => setClaimFor('SELF')}>Self</button>
                  <button className={`${styles.btnPill} ${claimFor === 'DEPENDENT' ? styles.btnPillActive : ''}`} onClick={() => setClaimFor('DEPENDENT')}>Dependent</button>
                </div>
              </div>
              <div className={styles.mrModalHeroBlock}>
                <span className={styles.mrModalHeroLabel}>Care Journey</span>
                <div className={styles.modalPillGroup}>
                  <button className={`${styles.btnPill} ${form.hospitalised ? styles.btnPillActive : ''}`} onClick={() => setForm((prev) => ({ ...prev, hospitalised: true }))}>Hospitalised</button>
                  <button
                    className={`${styles.btnPill} ${!form.hospitalised ? styles.btnPillActive : ''}`}
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
              {form.hospitalised ? (
                <div className={styles.mrModalHeroBlock}>
                  <span className={styles.mrModalHeroLabel}>Institution Type</span>
                  <div className={styles.modalPillGroup}>
                    <button className={`${styles.btnPill} ${form.hospitalType === 'Government' ? styles.btnPillActive : ''}`} onClick={() => setForm((prev) => ({ ...prev, hospitalType: 'Government' }))}>Government</button>
                    <button className={`${styles.btnPill} ${form.hospitalType === 'Private' ? styles.btnPillActive : ''}`} onClick={() => setForm((prev) => ({ ...prev, hospitalType: 'Private' }))}>Private</button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className={styles.mrModalContentGrid}>
              <section className={styles.mrModalSpotlight}>
                <div className={styles.mrModalSectionTitle}>Claim Snapshot</div>
                {claimFor === 'DEPENDENT' ? (
                  <select className={`${styles.field} ${styles.depSelect}`} value={dep} onChange={(e) => setDep(e.target.value)}>
                    <option value="">Select dependent</option>
                    {officer.dependents.map((d) => <option key={d.personId} value={d.personId}>{d.relationType}: {d.fullName}</option>)}
                  </select>
                ) : null}
                <div className={styles.depCard}>
                  <div className={styles.depName}>Applicant Name: {applicantName || 'Select dependent to continue'}</div>
                  <div className={styles.depMeta}>{applicantMeta || 'Dependent basic details will appear here.'}</div>
                  {claimFor === 'SELF' && (
                    <div className={styles.depMeta}>Designation: {officer.designation} | Grade {officer.grade} | {officer.level}</div>
                  )}
                </div>
                <div className={styles.mrModalTimeline}>
                  <div><span>Start date</span><strong>{form.fromDate || 'Pending'}</strong></div>
                  <div><span>End date</span><strong>{form.toDate || 'Optional'}</strong></div>
                  <div><span>System</span><strong>{form.medicalType}</strong></div>
                </div>
              </section>

              <div className={styles.mrModalFormArea}>
                <div className={styles.modalCompactGrid}>
                  {form.hospitalised ? (
                    <section className={styles.modalPanel}>
                      <div className={styles.mrModalSectionTitle}>Hospital Details</div>
                      <div className={styles.modalHospitalGrid}>
                        <div>
                          <label className={styles.formLabel}>Hospital Name</label>
                          <div className={styles.autoWrap}>
                            <input
                              className={styles.field}
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
                              <div className={styles.autoList}>
                                {hospitalLoading && <div className={styles.autoItem}>Searching hospitals...</div>}
                                {!hospitalLoading && hospitalOptions.map((opt) => (
                                  <button
                                    key={`${opt.name}-${opt.address}`}
                                    type="button"
                                    className={styles.autoItem}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      skipAutocompleteRef.current = true;
                                      setHospitalQuery(opt.name);
                                      setHospitalOptions([]);
                                      setHospitalFocused(false);
                                      setForm((prev) => ({ ...prev, hospitalName: opt.name, hospitalAddress: opt.address }));
                                    }}
                                  >
                                    {opt.name}
                                    <br />
                                    <small>{opt.address}</small>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className={styles.formLabel}>Hospital Address</label>
                          <input
                            className={styles.field}
                            placeholder="Hospital full address"
                            value={form.hospitalAddress}
                            onChange={(e) => setForm((prev) => ({ ...prev, hospitalAddress: e.target.value }))}
                          />
                        </div>
                      </div>
                    </section>
                  ) : null}

                  <section className={`${styles.modalPanel} ${!form.hospitalised ? styles.modalPanelSpan : ''}`}>
                    <div className={styles.mrModalSectionTitle}>Treatment Details</div>
                    {form.hospitalised ? (
                      <div className={styles.toggleRow}>
                        <button className={`${styles.btnPill} ${form.medicalType === 'Allopathy' ? styles.btnPillActive : ''}`} onClick={() => setForm((prev) => ({ ...prev, medicalType: 'Allopathy' }))}>Allopathy</button>
                        <button className={`${styles.btnPill} ${form.medicalType === 'Ayurveda' ? styles.btnPillActive : ''}`} onClick={() => setForm((prev) => ({ ...prev, medicalType: 'Ayurveda' }))}>Ayurveda</button>
                        <button className={`${styles.btnPill} ${form.medicalType === 'Homeopathy' ? styles.btnPillActive : ''}`} onClick={() => setForm((prev) => ({ ...prev, medicalType: 'Homeopathy' }))}>Homeo</button>
                      </div>
                    ) : null}

                    <div className={styles.modalFormGrid2}>
                      <div>
                        <label className={styles.formLabel}>Start Date</label>
                        <input type="date" className={styles.field} onChange={(e) => setForm((prev) => ({ ...prev, fromDate: e.target.value }))} />
                      </div>
                      <div>
                        <label className={styles.formLabel}>End Date (Optional)</label>
                        <input type="date" className={styles.field} onChange={(e) => setForm((prev) => ({ ...prev, toDate: e.target.value }))} />
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <label className={`${styles.bodyText} flex items-center gap-2`}><input type="checkbox" onChange={(e) => setForm((prev) => ({ ...prev, declaration: e.target.checked }))} /> I declare that the details provided are true and accurate.</label>
              <div className={styles.modalActions}>
                <button className={styles.btnSecondary} onClick={() => { setOpen(false); setHospitalOptions([]); }}>Cancel</button>
                <button className={styles.btnPrimary} onClick={onCreate}>Create MR Case</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>}
  </div></div>;
}
