'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Activity, User, Building2, Stethoscope, Briefcase, FileText, CheckCircle2, LayoutGrid, Clock, ChevronRight, UserCircle2 } from 'lucide-react';
import axiosInstance from '@/utils/apiClient';
import { mapOfficerProfile } from '@/modules/medical-reimbursement/mapper';
import { createCase, initCases, loadCases } from '@/modules/medical-reimbursement/mockStore';
import type { MRCase, OfficerProfileVM } from '@/modules/medical-reimbursement/types';
import { STATIC_MR_ROUTE_PARAM, setActiveMrId } from '@/modules/medical-reimbursement/session';

const emptyOfficer: OfficerProfileVM = mapOfficerProfile({});

const statusVisuals = (status: string) => {
  if (status === 'Draft') return { color: 'text-slate-600 bg-slate-100 border-slate-200', icon: <FileText className="w-4 h-4" /> };
  if (status.includes('Submitted')) return { color: 'text-blue-700 bg-blue-100 border-blue-200', icon: <Activity className="w-4 h-4" /> };
  if (status.includes('Paid') || status === 'Approved') return { color: 'text-emerald-700 bg-emerald-100 border-emerald-200', icon: <CheckCircle2 className="w-4 h-4" /> };
  return { color: 'text-indigo-700 bg-indigo-100 border-indigo-200', icon: <Clock className="w-4 h-4" /> };
};

const formatShort = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function MRControlCenter() {
  const router = useRouter();
  const [cases, setCases] = useState<MRCase[]>([]);
  const [officer, setOfficer] = useState<OfficerProfileVM>(emptyOfficer);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('All');

  // Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [claimFor, setClaimFor] = useState<'SELF' | 'DEPENDENT'>('SELF');
  const [dep, setDep] = useState('');

  const filtered = cases.filter(c => {
    if (tab !== 'All' && !c.status.includes(tab)) return false;
    if (q) {
      const s = q.toLowerCase();
      if (!c.mrNo.toLowerCase().includes(s) && !c.patient.name?.toLowerCase().includes(s) && !c.treatment.hospitalName?.toLowerCase().includes(s)) return false;
    }
    return true;
  });
  const [form, setForm] = useState({ hospitalised: true, hospitalName: '', hospitalAddress: '', hospitalType: 'Private', medicalType: 'Allopathy', fromDate: '', toDate: '', declaration: false });

  useEffect(() => {
    initCases(emptyOfficer);
    axiosInstance.get('/api/employee/profile').then(res => {
      setOfficer(mapOfficerProfile(res.data));
      setCases(loadCases());
      setLoading(false);
    }).catch(() => {
      setCases(loadCases());
      setLoading(false);
    });
  }, []);

  const onCreate = () => {
    const claim = claimFor === 'SELF' ? { claimFor, dependentName: '', relation: '' } : { claimFor, dependentName: officer.dependents.find(d => d.personId === dep)?.fullName || '', relation: officer.dependents.find(d => d.personId === dep)?.relationType || '' };
    const id = createCase(officer, { ...claim, ...form } as any);
    setCases(loadCases());
    setDrawerOpen(false);
  };

  const openCase = (id: string) => {
    setActiveMrId(id);
    router.push(`/reimbursement/medical/${STATIC_MR_ROUTE_PARAM}/workspace`);
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans">

      {/* Top Navigation & Profile Section */}
      <div className="max-w-[1400px] mx-auto mb-10">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50 to-transparent rounded-full -mr-20 -mt-20 opacity-70 pointer-events-none"></div>

          <div className="flex items-center gap-6 z-10">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
               <Briefcase className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Medical Reimbursement Center</h1>
              <p className="text-slate-500 text-lg flex items-center gap-2">
                <UserCircle2 className="w-5 h-5" />
                Welcome, <span className="font-semibold text-slate-700">{officer.fullName || 'Officer'}</span> ({officer.designation || 'AIS'})
              </p>
            </div>
          </div>

          <button onClick={() => setDrawerOpen(true)} className="z-10 group relative inline-flex items-center justify-center gap-3 px-8 py-4 font-bold text-white bg-indigo-600 rounded-full overflow-hidden shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 hover:scale-[1.02] active:scale-95">
             <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
             Initiate New Request
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1400px] mx-auto">

        <div className="flex items-center justify-between mb-8">
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
             <LayoutGrid className="w-6 h-6 text-indigo-500" />
             Active Case Files
           </h2>
           <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm font-semibold text-slate-600">
             Total Records: <span className="text-indigo-600 ml-1">{cases.length}</span>
           </div>
        </div>


        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex bg-slate-200/50 p-1 rounded-xl w-full max-w-lg">
            {['All', 'Draft', 'Submitted', 'Approved', 'Rejected'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === t ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >{t}</button>
            ))}
          </div>
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder="Search ID, Patient, Hospital..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
            {/* Using text for icon if search not imported, but let's assume we can add it */}
            <div className="absolute left-4 top-3.5 text-slate-400">🔍</div>
          </div>
        </div>

        {cases.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 border-dashed p-20 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-50 mb-6 text-slate-400">
              <Activity className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">No Cases Initiated</h3>
            <p className="text-slate-500 text-lg max-w-md mx-auto">You have no active medical reimbursement requests. Click the button above to start a new claim process.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filtered.map((c) => {
              const visual = statusVisuals(c.status);
              return (
                <div key={c.mrId} className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative transform hover:-translate-y-1">

                  {/* Decorative Header Bar */}
                  <div className={`h-2 w-full ${visual.color.split(' ')[1]}`}></div>

                  <div className="p-6 flex-1 space-y-6">
                    {/* Header: ID & Status */}
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tracking ID</p>
                        <p className="font-mono text-base font-bold text-slate-800 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 inline-block">
                          {c.mrNo}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${visual.color}`}>
                        {visual.icon}
                        {c.status.toUpperCase()}
                      </div>
                    </div>

                    <div className="h-px w-full bg-slate-100"></div>

                    {/* Patient Section */}
                    <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl">
                      <div className="w-12 h-12 rounded-full bg-white border border-slate-200 text-indigo-500 flex items-center justify-center shadow-sm flex-shrink-0">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Patient</p>
                        <p className="text-lg font-bold text-slate-900 leading-tight">
                          {c.patient.claimFor === 'SELF' ? 'Self' : c.patient.name}
                        </p>
                        {c.patient.claimFor !== 'SELF' && (
                          <p className="text-xs font-semibold text-slate-500 mt-1">{c.patient.relation}</p>
                        )}
                      </div>
                    </div>

                    {/* Treatment Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <Building2 className="w-3 h-3" /> Facility
                        </div>
                        <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug" title={c.treatment.hospitalName}>
                          {c.treatment.hospitalName || 'Not Specified'}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <Stethoscope className="w-3 h-3" /> Diagnosis
                        </div>
                        <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug" title={c.treatment.diagnosis}>
                          {c.treatment.diagnosis || 'Pending Entry'}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Footer Action */}
                  <div className="p-4 bg-slate-50/50 mt-auto border-t border-slate-100">
                    <button onClick={() => openCase(c.mrId)} className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm group-hover:shadow-md">
                      Manage Case File
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Drawer Component */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}></div>
          <div className="relative w-full max-w-[500px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

            {/* Drawer Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">New Claim Form</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Initiate a new medical reimbursement</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">

              {/* Patient Section */}
              <section>
                <h3 className="flex items-center gap-2 text-sm font-bold text-indigo-600 uppercase tracking-wider mb-5">
                  <User className="w-4 h-4" /> 1. Patient Details
                </h3>

                <div className="bg-slate-50 p-1.5 rounded-xl flex mb-6">
                  <button className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${claimFor === 'SELF' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`} onClick={() => setClaimFor('SELF')}>Self</button>
                  <button className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${claimFor === 'DEPENDENT' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`} onClick={() => setClaimFor('DEPENDENT')}>Dependent</button>
                </div>

                {claimFor === 'DEPENDENT' && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Select Dependent</label>
                    <select
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                      value={dep}
                      onChange={(e) => setDep(e.target.value)}
                    >
                      <option value="">Choose a dependent...</option>
                      {officer.dependents.map((d) => <option key={d.personId} value={d.personId}>{d.relationType}: {d.fullName}</option>)}
                    </select>
                  </div>
                )}
              </section>

              {/* Treatment Section */}
              <section>
                <h3 className="flex items-center gap-2 text-sm font-bold text-indigo-600 uppercase tracking-wider mb-5">
                  <Activity className="w-4 h-4" /> 2. Treatment Information
                </h3>

                <div className="flex gap-6 mb-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${form.hospitalised ? 'border-indigo-600' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                      {form.hospitalised && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>}
                    </div>
                    <input type="radio" checked={form.hospitalised} onChange={() => setForm(p => ({ ...p, hospitalised: true }))} className="hidden" />
                    <span className="text-sm font-bold text-slate-700">Hospitalised</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${!form.hospitalised ? 'border-indigo-600' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                      {!form.hospitalised && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>}
                    </div>
                    <input type="radio" checked={!form.hospitalised} onChange={() => setForm(p => ({ ...p, hospitalised: false, hospitalName: '', hospitalAddress: '' }))} className="hidden" />
                    <span className="text-sm font-bold text-slate-700">Out-Patient</span>
                  </label>
                </div>

                {form.hospitalised && (
                  <div className="space-y-5 mb-6 animate-in fade-in slide-in-from-top-2">
                    <div className="bg-slate-50 p-1.5 rounded-xl flex">
                      <button className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${form.hospitalType === 'Government' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`} onClick={() => setForm(p => ({ ...p, hospitalType: 'Government' }))}>Govt. Hospital</button>
                      <button className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${form.hospitalType === 'Private' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`} onClick={() => setForm(p => ({ ...p, hospitalType: 'Private' }))}>Private Hospital</button>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Hospital Name</label>
                      <input
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                        value={form.hospitalName}
                        onChange={(e) => setForm(p => ({ ...p, hospitalName: e.target.value }))}
                        placeholder="Enter full hospital name"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Medical System</label>
                    <select
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                      value={form.medicalType}
                      onChange={(e) => setForm(p => ({ ...p, medicalType: e.target.value }))}
                    >
                      <option value="Allopathy">Allopathy</option>
                      <option value="Ayurveda">Ayurveda</option>
                      <option value="Homeopathy">Homeopathy</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Start Date</label>
                      <input type="date" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm" onChange={(e) => setForm(p => ({ ...p, fromDate: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">End Date (Optional)</label>
                      <input type="date" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm" onChange={(e) => setForm(p => ({ ...p, toDate: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </section>

              {/* Declaration */}
              <div className="pt-6">
                <label className="flex items-start gap-4 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 cursor-pointer group">
                  <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${form.declaration ? 'bg-indigo-600 border-indigo-600' : 'border-indigo-300 bg-white group-hover:border-indigo-400'}`}>
                    {form.declaration && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={form.declaration} onChange={(e) => setForm(p => ({ ...p, declaration: e.target.checked }))} />
                  <span className="text-sm font-semibold text-indigo-900 leading-relaxed">I solemnly declare that the details provided above are true, complete, and accurate to the best of my knowledge.</span>
                </label>
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-4">
              <button className="flex-1 px-6 py-3.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 transition-colors shadow-sm" onClick={() => setDrawerOpen(false)}>Cancel</button>
              <button
                className="flex-[2] px-6 py-3.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                onClick={onCreate}
                disabled={!form.declaration || !form.fromDate || (claimFor === 'DEPENDENT' && !dep) || (form.hospitalised && !form.hospitalName)}
              >
                Create Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
