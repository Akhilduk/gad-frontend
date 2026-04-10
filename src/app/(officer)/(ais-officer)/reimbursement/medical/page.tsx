'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Bell, Briefcase, CheckCircle, Clock, FileText, Shield, Search, Plus, X, ChevronRight, UserCircle2, Stethoscope } from 'lucide-react';
import axiosInstance from '@/utils/apiClient';
import { mapOfficerProfile } from '@/modules/medical-reimbursement/mapper';
import { createCase, initCases, loadCases } from '@/modules/medical-reimbursement/mockStore';
import type { MRCase, OfficerProfileVM } from '@/modules/medical-reimbursement/types';
import { STATIC_MR_ROUTE_PARAM, setActiveMrId } from '@/modules/medical-reimbursement/session';

const emptyOfficer: OfficerProfileVM = mapOfficerProfile({});

const statusColor = (status: MRCase['status']) => {
  if (status === 'Draft') return 'text-slate-600 bg-slate-100 border-slate-200';
  if (status === 'Advance Submitted') return 'text-amber-700 bg-amber-50 border-amber-200';
  if (status === 'Advance Paid') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (status === 'Final Submitted' || status === 'Active') return 'text-indigo-700 bg-indigo-50 border-indigo-200';
  if (status === 'Approved') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  return 'text-blue-700 bg-blue-50 border-blue-200';
};

const formatShort = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function MRControlCenter() {
  const router = useRouter();
  const [cases, setCases] = useState<MRCase[]>([]);
  const [officer, setOfficer] = useState<OfficerProfileVM>(emptyOfficer);
  const [tab, setTab] = useState('ALL');
  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const openCase = (mrId: string) => {
    setActiveMrId(mrId);
    router.push(`/reimbursement/medical/${STATIC_MR_ROUTE_PARAM}`);
  };

  const byTab = useMemo(() => {
    if (tab === 'ALL') return cases;
    return cases.filter((c) => c.status === tab);
  }, [tab, cases]);

  const list = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return byTab;
    return byTab.filter((c) => `${c.mrNo} ${c.patient.name} ${c.treatment.hospitalName} ${c.status}`.toLowerCase().includes(q));
  }, [tab, cases, query]);

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
    setDrawerOpen(false);
    openCase(created.mrId);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-[1600px] mx-auto">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Medical Reimbursements</h1>
            <p className="text-sm text-slate-500 mt-1">Manage and track your medical claims and advances.</p>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex space-x-1 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
              {['ALL', 'Draft', 'Active', 'Advance Submitted', 'Advance Paid', 'Final Submitted', 'Approved', 'Paid & Closed'].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                    tab === t
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {t === 'ALL' ? 'All Cases' : t}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                placeholder="Search cases..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>


          {/* Animated Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6 bg-slate-50/30">
            {list.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"><Search className="w-8 h-8 text-slate-300" /></div>
                <h3 className="text-lg font-bold text-slate-700">No Cases Found</h3>
                <p className="mt-1 text-sm">Create a new request to get started.</p>
              </div>
            ) : (
              list.map((c, idx) => {
                const colorMap: Record<string, string> = {
                  'Draft': 'from-slate-400 to-slate-500',
                  'Advance Submitted': 'from-amber-400 to-orange-500',
                  'Advance Paid': 'from-emerald-400 to-teal-500',
                  'Final Submitted': 'from-indigo-400 to-blue-500',
                  'Approved': 'from-emerald-500 to-emerald-600',
                  'Paid & Closed': 'from-blue-500 to-indigo-600',
                  'Active': 'from-indigo-400 to-blue-500'
                };
                const bgMap: Record<string, string> = {
                  'Draft': 'bg-slate-100 text-slate-700 border-slate-200',
                  'Advance Submitted': 'bg-amber-50 text-amber-700 border-amber-200',
                  'Advance Paid': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  'Final Submitted': 'bg-indigo-50 text-indigo-700 border-indigo-200',
                  'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  'Paid & Closed': 'bg-blue-50 text-blue-700 border-blue-200',
                  'Active': 'bg-indigo-50 text-indigo-700 border-indigo-200'
                };
                const gradient = colorMap[c.status] || colorMap['Draft'];
                const badge = bgMap[c.status] || bgMap['Draft'];

                return (
                  <div key={c.mrId} className="group flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    {/* Top Color Bar */}
                    <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`}></div>

                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`px-3 py-1 text-xs font-bold rounded-full border ${badge}`}>
                          {c.status.toUpperCase()}
                        </div>
                        <div className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">
                          {formatShort(c.createdAt)}
                        </div>
                      </div>

                      <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-1">{c.mrNo}</h3>

                      <div className="mt-4 space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600"><UserCircle2 className="w-4 h-4" /></div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{c.patient.name}</p>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{c.patient.claimFor === 'SELF' ? 'Self' : 'Dependent'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0 text-rose-600"><Stethoscope className="w-4 h-4" /></div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate" title={c.treatment.hospitalName}>{c.treatment.hospitalName || 'No Hospital'}</p>
                            <p className="text-xs text-slate-500 font-medium truncate">{c.treatment.diagnosis}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50/80 p-4 border-t border-slate-100 flex gap-2">
                       <button onClick={() => openCase(c.mrId)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-indigo-700 transition-colors group-hover:border-indigo-300">
                         Manage Case <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                       </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 flex justify-between">
            <span>Showing {list.length} results</span>
          </div>
        </div>
      </div>

      {/* Slide-over Drawer for Case Creation */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setDrawerOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-900">Initiate New Request</h2>
              <button onClick={() => setDrawerOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-indigo-900 uppercase tracking-wider">Patient Details</h3>

                <div className="flex p-1 bg-slate-100 rounded-lg">
                  <button className={`flex-1 py-2 text-sm font-medium rounded-md ${claimFor === 'SELF' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setClaimFor('SELF')}>Self</button>
                  <button className={`flex-1 py-2 text-sm font-medium rounded-md ${claimFor === 'DEPENDENT' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setClaimFor('DEPENDENT')}>Dependent</button>
                </div>

                {claimFor === 'DEPENDENT' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Dependent</label>
                    <select
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      value={dep}
                      onChange={(e) => setDep(e.target.value)}
                    >
                      <option value="">Select dependent...</option>
                      {officer.dependents.map((d) => <option key={d.personId} value={d.personId}>{d.relationType}: {d.fullName}</option>)}
                    </select>
                  </div>
                )}
              </section>

              <hr className="border-slate-100" />

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-indigo-900 uppercase tracking-wider">Treatment Details</h3>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <input type="radio" checked={form.hospitalised} onChange={() => setForm(p => ({ ...p, hospitalised: true }))} className="text-indigo-600 focus:ring-indigo-500" />
                    Hospitalised
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <input type="radio" checked={!form.hospitalised} onChange={() => setForm(p => ({ ...p, hospitalised: false, hospitalName: '', hospitalAddress: '' }))} className="text-indigo-600 focus:ring-indigo-500" />
                    Out-Patient
                  </label>
                </div>

                {form.hospitalised && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex p-1 bg-slate-100 rounded-lg">
                      <button className={`flex-1 py-1.5 text-sm font-medium rounded-md ${form.hospitalType === 'Government' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`} onClick={() => setForm(p => ({ ...p, hospitalType: 'Government' }))}>Government</button>
                      <button className={`flex-1 py-1.5 text-sm font-medium rounded-md ${form.hospitalType === 'Private' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`} onClick={() => setForm(p => ({ ...p, hospitalType: 'Private' }))}>Private</button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Hospital Name</label>
                      <input
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        value={form.hospitalName}
                        onChange={(e) => setForm(p => ({ ...p, hospitalName: e.target.value }))}
                        placeholder="Enter hospital name"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Medical System</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    value={form.medicalType}
                    onChange={(e) => setForm(p => ({ ...p, medicalType: e.target.value }))}
                  >
                    <option value="Allopathy">Allopathy</option>
                    <option value="Ayurveda">Ayurveda</option>
                    <option value="Homeopathy">Homeopathy</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date</label>
                    <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white" onChange={(e) => setForm(p => ({ ...p, fromDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">End Date</label>
                    <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white" onChange={(e) => setForm(p => ({ ...p, toDate: e.target.value }))} />
                  </div>
                </div>
              </section>

              <div className="mt-auto pt-6">
                <label className="flex items-start gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-100 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500" onChange={(e) => setForm(p => ({ ...p, declaration: e.target.checked }))} />
                  <span className="text-sm text-indigo-900 leading-snug">I declare that the details provided above are true and accurate to the best of my knowledge.</span>
                </label>
              </div>

            </div>

            <div className="p-5 border-t border-slate-200 bg-slate-50/50 flex gap-3">
              <button className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:ring-2 focus:ring-indigo-500 transition-colors" onClick={() => setDrawerOpen(false)}>Cancel</button>
              <button
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onCreate}
                disabled={!form.declaration || !form.fromDate || (claimFor === 'DEPENDENT' && !dep) || (form.hospitalised && !form.hospitalName)}
              >
                Create Request
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}