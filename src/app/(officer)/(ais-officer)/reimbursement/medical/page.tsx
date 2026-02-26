'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, PlusIcon, UserCircleIcon, UsersIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { medicalCases, statusClasses, type CaseStatus } from './data';
import { createMrId, loadMedicalCases, type LocalMedicalCase, upsertMedicalCase } from './storage';
import { getProfileWithFallback } from './_lib/profile-service';
import { demoSeedCases } from './_lib/seed-cases';
import { StatusStamp, bookPageClass } from './_components/case-book-ui';

const ACTIVE_MR_STORAGE_KEY = 'medical_reimbursement_active_mr';
const PAGE_SIZE = 6;
type ClaimFilter = 'all' | 'Self' | 'Dependent';

export default function MedicalReimbursementPage() {
  const router = useRouter();
  const [localCases, setLocalCases] = useState<LocalMedicalCase[]>([]);
  const [profile, setProfile] = useState({ officerName: 'AJI V S', pen: '123456', serviceType: 'IAS' as 'IAS' | 'IPS' | 'IFS', cadre: 'Kerala', level: '12', grade: 'Selection Grade', designation: 'Joint Director', currentPosting: 'Directorate, TVM', officeAddress: 'Directorate, TVM', residentialAddress: 'Kowdiar, TVM', email: 'aji.vs@gov.in', phone: '9XXXXXXXXX', basicPay: '₹82,000' });
  const [dependents, setDependents] = useState<Array<{ id: string; relation: string; name: string; age: string; dob?: string }>>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all');
  const [claimFilter, setClaimFilter] = useState<ClaimFilter>('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [claimFor, setClaimFor] = useState<'Self' | 'Dependent'>('Self');
  const [dependentId, setDependentId] = useState('');
  const [hospitalName, setHospitalName] = useState('General Hospital');
  const [placeOfIllness, setPlaceOfIllness] = useState('Thiruvananthapuram');
  const [hospitalized, setHospitalized] = useState<'Yes' | 'No'>('Yes');
  const [hospitalCategory, setHospitalCategory] = useState<'Government' | 'Empanelled Private'>('Government');
  const [periodFrom, setPeriodFrom] = useState(new Date().toISOString().slice(0, 10));
  const [periodTo, setPeriodTo] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [declaration, setDeclaration] = useState(false);

  useEffect(() => {
    const sync = () => {
      const existing = loadMedicalCases();
      if (!existing.length) {
        const seeded = demoSeedCases();
        seeded.forEach((seed) => upsertMedicalCase(seed));
        setLocalCases(loadMedicalCases());
      } else {
        setLocalCases(existing);
      }
    };
    sync();
    window.addEventListener('focus', sync);
    return () => window.removeEventListener('focus', sync);
  }, []);

  useEffect(() => {
    const hydrate = async () => {
      const data = await getProfileWithFallback();
      setProfile(data.profile);
      setDependents(data.dependents);
    };
    hydrate();
  }, []);

  const selectedDependent = useMemo(() => dependents.find((dep) => dep.id === dependentId) || null, [dependents, dependentId]);

  const cases = useMemo(() => {
    const mapped = localCases.map((item) => {
      const bills = item.bills.reduce((sum, bill) => sum + Number(bill.extracted.amount || 0), 0);
      const advances = item.advances.reduce((sum, adv) => sum + Number(adv.amount || 0), 0);
      return {
        mrNo: item.mrNo,
        status: item.status,
        claimFor: item.claimFor === 'Self' ? 'Self' : `Dependent (${item.dependent?.relation || '-'})`,
        patient: item.treatment.patientName || item.dependent?.name || item.claimant.name || profile.officerName,
        hospital: item.treatment.hospitalName || 'General Hospital',
        period: item.treatment.fromDate ? `${item.treatment.fromDate} - ${item.treatment.toDate || 'Ongoing'}` : 'Not set',
        updatedOn: item.updatedOn,
        year: String(new Date(item.createdOn).getFullYear()),
        bills,
        advances,
        balance: Math.max(bills - advances, 0),
        lastAction: item.finalSubmission ? 'Final submitted' : item.advances.length ? 'Advance submitted' : item.bills.length ? 'Bill added' : 'Draft edited',
      };
    });
    const byMr = new Map<string, (typeof mapped)[number]>();
    mapped.forEach((item) => byMr.set(item.mrNo, item));
    medicalCases.forEach((item) => {
      if (byMr.has(item.mrNo)) return;
      byMr.set(item.mrNo, {
        mrNo: item.mrNo,
        status: item.status,
        claimFor: item.claimFor,
        patient: item.claimFor.includes('Dependent') ? 'Dependent Member' : profile.officerName,
        hospital: item.hospital || 'General Hospital',
        period: 'Case period',
        updatedOn: item.createdOn,
        year: '2026',
        bills: 10000,
        advances: 5000,
        balance: 5000,
        lastAction: item.primaryAction,
      });
    });
    return Array.from(byMr.values());
  }, [localCases, profile.officerName]);

  const statusTiles = useMemo(
    () =>
      [
        'Draft',
        'Advance Pending',
        'Advance Paid',
        'Final Submitted',
        'Approved',
        'Paid & Closed',
      ].map((status) => ({
        label: status,
        count: cases.filter((item) => item.status === status).length,
      })),
    [cases],
  );

  const recent = useMemo(() => [...cases].sort((a, b) => new Date(b.updatedOn).getTime() - new Date(a.updatedOn).getTime()).slice(0, 7), [cases]);
  const years = useMemo(() => ['all', ...Array.from(new Set(cases.map((item) => item.year)))], [cases]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return cases.filter((item) => {
      const statusOk = statusFilter === 'all' || item.status === statusFilter;
      const claimOk = claimFilter === 'all' || (claimFilter === 'Self' ? item.claimFor.includes('Self') : item.claimFor.includes('Dependent'));
      const yearOk = yearFilter === 'all' || item.year === yearFilter;
      const searchOk = !q || item.mrNo.toLowerCase().includes(q) || item.patient.toLowerCase().includes(q) || item.hospital.toLowerCase().includes(q);
      return statusOk && claimOk && yearOk && searchOk;
    });
  }, [cases, claimFilter, search, statusFilter, yearFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCase = (mrNo: string, hash?: string) => {
    sessionStorage.setItem(ACTIVE_MR_STORAGE_KEY, mrNo);
    router.push(`/reimbursement/medical/case${hash ? `#${hash}` : ''}`);
  };

  const createCase = () => {
    if (!declaration) return;
    if (!hospitalName.trim() || !placeOfIllness.trim() || !periodFrom.trim()) return;
    if (claimFor === 'Dependent' && !selectedDependent) return;

    const now = new Date().toISOString();
    const mrNo = createMrId();
    const patientName = claimFor === 'Self' ? profile.officerName : selectedDependent?.name || '';
    const relation = claimFor === 'Self' ? 'Self' : selectedDependent?.relation || 'Dependent';

    const newCase: LocalMedicalCase = {
      mrNo,
      createdOn: now,
      updatedOn: now,
      claimFor,
      dependentId: claimFor === 'Dependent' ? selectedDependent?.id || null : null,
      claimant: {
        name: profile.officerName,
        pen: profile.pen,
        cadre: profile.cadre,
        batch: '2012',
        currentRole: profile.designation,
        grade: profile.grade,
        scale: `Level ${profile.level}`,
        office: profile.currentPosting,
        email: profile.email,
        phone: profile.phone,
      },
      dependent: claimFor === 'Dependent' && selectedDependent ? { name: selectedDependent.name, relation: selectedDependent.relation, dob: '', gender: '' } : null,
      treatment: {
        serviceType: profile.serviceType,
        presentPostingAddress: profile.officeAddress,
        residentialAddress: profile.residentialAddress,
        patientName,
        relationshipToMember: relation,
        placeOfIllness,
        hospitalized,
        hospitalAddress: '',
        hospitalCategory,
        empanelledAuthority: 'NA',
        treatmentAbroadCertificate: 'NA',
        hospitalName,
        diagnosis,
        fromDate: periodFrom,
        toDate: periodTo,
        consultationCharges: 0,
        investigationCharges: 0,
        medicineCharges: 0,
        hospitalCharges: 0,
        otherCharges: 0,
        totalAmount: 0,
        place: '',
        declarationPlace: profile.currentPosting,
        declarationDate: new Date().toISOString().slice(0, 10),
        notes: '',
      },
      essentiality: {
        attendantName: '',
        designation: '',
        registrationNo: '',
        institutionName: hospitalName,
        institutionAddress: '',
        patientCondition: diagnosis,
        hospitalizationRequired: '',
        stockAvailabilityNote: 'The medicines were not available in hospital stock (if applicable).',
        cheaperSubstituteNote: 'They do not include proprietary preparations where cheaper substitutes are available.',
        certificationDate: new Date().toISOString().slice(0, 10),
        medicines: [],
      },
      bills: [],
      otherDocuments: [],
      advances: [],
      status: 'Draft',
      primaryAction: 'Continue',
      finalSubmission: null,
    };

    upsertMedicalCase(newCase);
    setLocalCases(loadMedicalCases());
    sessionStorage.setItem(ACTIVE_MR_STORAGE_KEY, mrNo);
    setShowCreateModal(false);
    router.push('/reimbursement/medical/case');
  };

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-indigo-200/70 bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900 p-5 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-8 h-24 w-24 rounded-full border border-white/30 bg-white/10" />
        <div className="pointer-events-none absolute -left-8 bottom-2 h-20 w-20 rounded-full border border-white/25 bg-indigo-200/10" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">MR Control Center</h1>
            <p className="text-sm text-indigo-100">What is pending, what is recent, and where to continue.</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 text-sm font-semibold transition hover:-translate-y-0.5">
            <PlusIcon className="h-4 w-4" />
            New Request
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {statusTiles.map((tile) => (
          <button key={tile.label} onClick={() => setStatusFilter((prev) => (prev === tile.label ? 'all' : (tile.label as CaseStatus)))} className={`${bookPageClass} p-3 text-left`}>
            <p className="text-xs font-semibold uppercase text-slate-500">{tile.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{tile.count}</p>
          </button>
        ))}
      </section>

      <section className={bookPageClass}>
        <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">Recently Updated</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {recent.map((item) => (
            <article key={item.mrNo} className={bookPageClass}>
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => openCase(item.mrNo)} className="font-mono text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                  {item.mrNo}
                </button>
                <StatusStamp text={item.status} />
              </div>
              <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">{item.patient}</p>
              <p className="text-xs text-slate-500">{item.hospital}</p>
              <p className="text-xs text-indigo-700 dark:text-indigo-300">{item.lastAction}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={bookPageClass}>
        <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">All Requests</h2>
        <div className="grid gap-2 lg:grid-cols-12">
          <label className="relative lg:col-span-5">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by MR, patient, hospital" className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
          </label>
          <select value={claimFilter} onChange={(event) => setClaimFilter(event.target.value as ClaimFilter)} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 lg:col-span-2">
            <option value="all">All Claim Types</option>
            <option value="Self">Self</option>
            <option value="Dependent">Dependent</option>
          </select>
          <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 lg:col-span-2">
            {years.map((yearOption) => (
              <option key={yearOption} value={yearOption}>
                {yearOption === 'all' ? 'All Years' : yearOption}
              </option>
            ))}
          </select>
          <button onClick={() => { setSearch(''); setStatusFilter('all'); setClaimFilter('all'); setYearFilter('all'); setPage(1); }} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 lg:col-span-3">
            Reset Filters
          </button>
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {(['all', 'Draft', 'Advance Pending', 'Advance Paid', 'Ready to Submit', 'Final Submitted', 'Approved', 'Paid & Closed'] as Array<CaseStatus | 'all'>).map((statusOption) => (
            <button key={statusOption} onClick={() => setStatusFilter(statusOption)} className={`h-10 rounded-xl border text-sm font-semibold ${statusFilter === statusOption ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300' : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'}`}>
              {statusOption === 'all' ? 'All Status' : statusOption}
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-3">
          {pageItems.map((item) => {
            const readyForFinal = item.bills > 0 && ['Ready to Submit', 'Advance Paid'].includes(item.status);
            return (
              <article key={item.mrNo} className={bookPageClass}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <button onClick={() => openCase(item.mrNo)} className="font-mono text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                      {item.mrNo}
                    </button>
                    <p className="text-xs text-slate-500">{item.patient} | {item.claimFor}</p>
                  </div>
                  <StatusStamp text={item.status} />
                </div>
                <div className="mt-2 grid gap-2 lg:grid-cols-4">
                  <p className="text-sm text-slate-700 dark:text-slate-200">{item.hospital}<span className="block text-xs text-slate-500">{item.period}</span></p>
                  <p className="text-sm text-slate-700 dark:text-slate-200">Bills: Rs {item.bills.toLocaleString('en-IN')}<span className="block text-xs text-slate-500">Advance: Rs {item.advances.toLocaleString('en-IN')}</span></p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Balance: Rs {item.balance.toLocaleString('en-IN')}<span className="block text-xs text-indigo-700 dark:text-indigo-300">{item.lastAction}</span></p>
                  <div className="grid grid-cols-4 gap-2">
                    <button onClick={() => openCase(item.mrNo)} className="inline-flex h-10 items-center justify-center rounded-xl border border-indigo-500 bg-gradient-to-r from-indigo-700 to-indigo-500 px-2 text-xs font-semibold text-white">Continue</button>
                    <button onClick={() => openCase(item.mrNo, 'annexures')} className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">Bill/Doc</button>
                    <button onClick={() => openCase(item.mrNo, 'advance')} className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">Advance</button>
                    <button onClick={() => readyForFinal && openCase(item.mrNo, 'final-claim')} disabled={!readyForFinal} title={readyForFinal ? 'Submit final claim' : 'Missing readiness items'} className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-500 bg-gradient-to-r from-emerald-600 to-teal-600 px-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Final</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filtered.length > PAGE_SIZE && (
          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-300">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                <ChevronLeftIcon className="h-4 w-4" />
                Prev
              </button>
              <button onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page === totalPages} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4">
          <div className="my-6 w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create Case File</h3>
              <button onClick={() => setShowCreateModal(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[72vh] space-y-3 overflow-y-auto p-4">
              <article className={`${bookPageClass} border-indigo-200`}>
                <p className="text-xs uppercase tracking-wide text-slate-500">Officer Identity (Auto)</p>
                <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <p><span className="font-medium">Name:</span> {profile.officerName}</p>
                  <p><span className="font-medium">PEN:</span> {profile.pen}</p>
                  <p><span className="font-medium">Service:</span> {profile.serviceType}</p>
                  <p><span className="font-medium">Cadre:</span> {profile.cadre}</p>
                  <p><span className="font-medium">Designation:</span> {profile.designation}</p>
                  <p><span className="font-medium">Basic Pay:</span> {profile.basicPay}</p>
                </div>
              </article>

              <article className={`${bookPageClass} border-indigo-200`}>
                <p className="text-xs uppercase tracking-wide text-slate-500">Claim For</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <button onClick={() => setClaimFor('Self')} className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition ${claimFor === 'Self' ? 'border-indigo-500 bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-500/15 dark:text-indigo-300' : 'border-slate-300 text-slate-700 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-100'}`}>
                    <UserCircleIcon className="h-5 w-5" />
                    Self
                  </button>
                  <button onClick={() => setClaimFor('Dependent')} className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition ${claimFor === 'Dependent' ? 'border-indigo-500 bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-500/15 dark:text-indigo-300' : 'border-slate-300 text-slate-700 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-100'}`}>
                    <UsersIcon className="h-5 w-5" />
                    Dependent
                  </button>
                </div>
                {claimFor === 'Dependent' && (
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-wrap gap-2">
                    {dependents.map((dep) => (
                      <button key={dep.id} onClick={() => setDependentId(dep.id)} className={`rounded-full border px-3 py-1.5 text-sm font-medium ${dependentId === dep.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300' : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-100'}`}>
                        {dep.relation}: {dep.name}
                      </button>
                    ))}
                    </div>
                    {selectedDependent && (
                      <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-sm text-indigo-900 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-200">
                        <p className="font-semibold">Selected Dependent</p>
                        <p>Name: {selectedDependent.name}</p>
                        <p>Relation: {selectedDependent.relation}</p>
                        <p>Age: {selectedDependent.age || '--'}</p>
                        <p>DOB: {selectedDependent.dob || '--'}</p>
                      </div>
                    )}
                  </div>
                )}
              </article>

              <article className={`${bookPageClass} border-indigo-200`}>
                <p className="text-xs uppercase tracking-wide text-slate-500">Basic Treatment Identity</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <input value={hospitalName} onChange={(event) => setHospitalName(event.target.value)} placeholder="Hospital name" className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  <input value={placeOfIllness} onChange={(event) => setPlaceOfIllness(event.target.value)} placeholder="Place of illness" className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  <select value={hospitalized} onChange={(event) => setHospitalized(event.target.value as 'Yes' | 'No')} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    <option value="Yes">Hospitalized: Yes</option>
                    <option value="No">Hospitalized: No</option>
                  </select>
                  <select value={hospitalCategory} onChange={(event) => setHospitalCategory(event.target.value as 'Government' | 'Empanelled Private')} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    <option value="Government">Government</option>
                    <option value="Empanelled Private">Empanelled Private</option>
                  </select>
                  <input type="date" value={periodFrom} onChange={(event) => setPeriodFrom(event.target.value)} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  <input type="date" value={periodTo} onChange={(event) => setPeriodTo(event.target.value)} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  <input value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} placeholder="Diagnosis (optional)" className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 md:col-span-2" />
                </div>
              </article>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 p-4 dark:border-slate-700">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input type="checkbox" checked={declaration} onChange={(event) => setDeclaration(event.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                I confirm details are true and can be used to create MR case.
              </label>
              <button onClick={createCase} disabled={!declaration} className="inline-flex h-10 items-center gap-2 rounded-xl border border-indigo-500 bg-gradient-to-r from-indigo-700 to-indigo-500 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
                <PlusIcon className="h-4 w-4" />
                Create MR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
