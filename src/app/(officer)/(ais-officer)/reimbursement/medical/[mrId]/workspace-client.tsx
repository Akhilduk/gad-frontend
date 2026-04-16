'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, LayoutDashboard, FileText, IndianRupee, Pill, Stethoscope, ClipboardCheck, History, Edit, Save, Activity, HeartPulse, Hospital, CheckCircle } from 'lucide-react';
import { loadCases, upsertCase } from '@/modules/medical-reimbursement/mockStore';
import type { MRCase } from '@/modules/medical-reimbursement/types';
import { STATIC_MR_ROUTE_PARAM } from '@/modules/medical-reimbursement/session';

export default function WorkspaceClient({ params }: { params: { mrId: string } }) {
  const router = useRouter();
  const [c, setC] = useState<MRCase | null>(null);
  const [active, setActive] = useState('DASHBOARD');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const list = loadCases();
    let current = list.find(x => x.mrId === params.mrId);
    if (!current) current = list[0];
    setC(current || null);
  }, [params.mrId]);

  if (!c) return <div className="h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">Loading Case Workspace...</div>;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const rupee = (amt: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amt);


  const handleAdvRequest = () => {
    const newAdv = {
      advId: 'adv-' + Math.random().toString(36).substr(2, 9),
      advNo: 'REQ-' + Math.floor(Math.random() * 10000),
      amount: 10000,
      status: 'Advance Submitted'
    };
    const updatedCase = { ...c, advances: [...c.advances, newAdv], status: 'Advance Submitted' };
    setC(updatedCase as any);
    upsertCase(updatedCase as any);
    showToast('Advance requested successfully.');
  };



  const handleBillUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Dummy logic to simulate extraction
      const newBill = {
        id: 'bill-' + Math.random().toString(36).substr(2, 9),
        hospitalName: c.treatment.hospitalName || 'Unknown Hospital',
        billDate: new Date().toISOString(),
        invoiceNo: 'INV-' + Math.floor(Math.random() * 10000),
        items: [{ description: 'General Charges', amount: 5000 }],
        totalAmount: 5000
      };
      const updatedCase = { ...c, bills: [...c.bills, newBill] };
      setC(updatedCase as any);
      upsertCase(updatedCase as any);
      showToast('Bill uploaded successfully.');
    }
  };


  const tabs = [
    { id: 'DASHBOARD', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Overview Dashboard' },
    { id: 'TREATMENT NOTE', icon: <Stethoscope className="w-5 h-5" />, label: 'Treatment Details' },
    { id: 'ANNEXURES', icon: <FileText className="w-5 h-5" />, label: 'Bills & Annexures' },
    { id: 'ADVANCE NOTES', icon: <IndianRupee className="w-5 h-5" />, label: 'Advance Requisition' },
    { id: 'CERTIFICATE', icon: <ClipboardCheck className="w-5 h-5" />, label: 'Essential Certificates' },
    { id: 'FINAL NOTE', icon: <Pill className="w-5 h-5" />, label: 'Final Settlement Note' },
    { id: 'MOVEMENT REGISTER', icon: <History className="w-5 h-5" />, label: 'Movement History' },
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans flex flex-col">

      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => router.push('/reimbursement/medical')} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-indigo-600 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
             <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
               <HeartPulse className="w-6 h-6 text-indigo-600" />
               Workspace <span className="text-slate-300 mx-2">|</span> {c.mrNo}
             </h1>
             <p className="text-sm font-semibold text-slate-500 mt-0.5 flex items-center gap-2">
               Status: <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold uppercase">{c.status}</span>
             </p>
          </div>
        </div>

        <div className="flex gap-3">
          {c.status === 'Draft' && (
            <button className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors" onClick={() => showToast('Workflow submission invoked')}>
              Submit for Verification
            </button>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar Navigation */}
        <div className="w-72 bg-white border-r border-slate-200 flex flex-col overflow-y-auto z-10 shadow-sm relative">
           <div className="p-6 space-y-2">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Navigation Menu</div>
             {tabs.map(t => (
               <button
                 key={t.id}
                 onClick={() => setActive(t.id)}
                 className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${active === t.id ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
               >
                 {t.icon} {t.label}
               </button>
             ))}
           </div>

           <div className="mt-auto p-6 border-t border-slate-100">
             <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
               <div className="text-xs font-bold text-slate-500 mb-2 uppercase">Quick Info</div>
               <div className="text-sm font-bold text-slate-800">
                 {c.patient.claimFor === 'SELF' ? 'Self' : c.patient.name}
               </div>
               <div className="text-xs text-slate-500 mt-1">{c.treatment.hospitalName || 'Pending Setup'}</div>
             </div>
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 relative">

          {/* Background Decorative Element */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-white via-transparent to-transparent rounded-full -mr-40 -mt-40 pointer-events-none opacity-50 z-0"></div>

          <div className="relative z-10 max-w-5xl mx-auto space-y-8">

            {active === 'DASHBOARD' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Case Dashboard Overview</h2>

                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full flex items-start justify-end p-4"><IndianRupee className="w-6 h-6 text-blue-300" /></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 relative z-10">Claim Amount</p>
                    <p className="text-3xl font-black text-slate-900 relative z-10">{rupee(c.bills.reduce((sum, b) => sum + b.totalAmount, 0))}</p>
                  </div>
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full flex items-start justify-end p-4"><Activity className="w-6 h-6 text-amber-300" /></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 relative z-10">Advance Drawn</p>
                    <p className="text-3xl font-black text-slate-900 relative z-10">{rupee(c.advances.filter(a => a.status === "Paid").reduce((sum, a) => sum + a.amount, 0))}</p>
                  </div>
                  <div className="bg-indigo-600 rounded-3xl p-6 shadow-lg shadow-indigo-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl -mr-10 -mt-10"></div>
                    <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-2 relative z-10">Net Payable</p>
                    <p className="text-3xl font-black text-white relative z-10">{rupee((c.bills.reduce((sum, b) => sum + b.totalAmount, 0) - c.advances.filter(a => a.status === "Paid").reduce((sum, a) => sum + a.amount, 0)))}</p>
                  </div>
                </div>

                {/* Patient & Treatment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Hospital className="w-4 h-4" /></div>
                      Patient Information
                    </h3>
                    <div className="space-y-5">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Beneficiary</p>
                        <p className="text-base font-bold text-slate-800">{c.patient.claimFor === 'SELF' ? 'Self' : c.patient.name}</p>
                        {c.patient.relation && <p className="text-sm font-semibold text-slate-500 mt-1">Relation: {c.patient.relation}</p>}
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Medical System</p>
                        <p className="text-base font-bold text-slate-800">{(c.treatment as any).medicalType || 'Allopathy' || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Stethoscope className="w-4 h-4" /></div>
                      Treatment Summary
                    </h3>
                    <div className="space-y-5">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Facility / Hospital</p>
                        <p className="text-base font-bold text-slate-800">{c.treatment.hospitalName || 'Not Specified'}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Condition / Diagnosis</p>
                        <p className="text-base font-bold text-slate-800 line-clamp-2">{c.treatment.diagnosis || 'Pending'}</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {active === 'TREATMENT NOTE' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end border-b border-slate-200 pb-6">
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Treatment Details</h2>
                    <p className="text-slate-500 text-lg">Update hospital and medical diagnosis information.</p>
                  </div>
                  <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors" onClick={() => { upsertCase({ ...c, treatment: c.treatment } as any); showToast('Treatment details saved successfully.'); }}>
                    <Save className="w-4 h-4" /> Save Record
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Facility Information</h3>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Hospital Name</label>
                      <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" value={c.treatment.hospitalName || ''} onChange={e => setC({...c, treatment: {...c.treatment, hospitalName: e.target.value}})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Address</label>
                      <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors min-h-[100px]" value={c.treatment.hospitalAddress || ''} onChange={e => setC({...c, treatment: {...c.treatment, hospitalAddress: e.target.value}})} />
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Medical Assessment</h3>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Diagnosis / Procedures</label>
                      <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors min-h-[100px]" value={c.treatment.diagnosis || ''} onChange={e => setC({...c, treatment: {...c.treatment, diagnosis: e.target.value}})} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {active === 'ANNEXURES' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end border-b border-slate-200 pb-6">
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Financial Annexures</h2>
                    <p className="text-slate-500 text-lg">Manage medical bills, invoices, and payment receipts.</p>
                  </div>
                  <div className="flex gap-3">
                     <button className="px-6 py-3 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors">Upload Document</button>

  <label className="cursor-pointer px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors inline-block">
    Add New Invoice
    <input type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={handleBillUpload} />
  </label>

                  </div>
                </div>

                {c.bills.length === 0 ? (
                  <div className="bg-white border-2 border-slate-200 border-dashed rounded-3xl p-16 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400"><FileText className="w-10 h-10" /></div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Bills Added Yet</h3>
                    <p className="text-slate-500">Click the button above to add your first medical invoice to this case.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {c.bills.map((b, i) => (
                      <div key={b.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-lg">
                             {i+1}
                           </div>
                           <div>
                             <p className="text-lg font-bold text-slate-900 mb-1">{b.hospitalName}</p>
                             <div className="flex items-center gap-4 text-sm font-semibold text-slate-500">
                               <span className="bg-slate-100 px-2 py-1 rounded">INV: {b.invoiceNo}</span>
                               <span>{new Date(b.billDate).toLocaleDateString()}</span>
                             </div>
                           </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Amount</p>
                          <p className="text-2xl font-black text-slate-900">{rupee(b.totalAmount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {active === 'ADVANCE NOTES' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end border-b border-slate-200 pb-6">
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Advance Requisitions</h2>
                    <p className="text-slate-500 text-lg">Request and track advance payments for ongoing medical care.</p>
                  </div>
                  <button className="px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors" onClick={handleAdvRequest}>Request Advance</button>
                </div>

                {c.advances.length === 0 ? (
                  <div className="bg-white border-2 border-slate-200 border-dashed rounded-3xl p-16 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400"><IndianRupee className="w-10 h-10" /></div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Advances Requested</h3>
                    <p className="text-slate-500">You have not requested any advances for this case file.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {c.advances.map(a => (
                      <div key={a.advId} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-full h-2 ${a.status === 'Paid' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>

                        <div className="flex justify-between items-start mb-6">
                           <div>
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Request No.</p>
                             <p className="font-mono font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">{a.advNo}</p>
                           </div>
                           <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${a.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                             {a.status.toUpperCase()}
                           </span>
                        </div>

                        <div className="mb-8">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Requested Amount</p>
                          <p className="text-4xl font-black text-slate-900">{rupee(a.amount)}</p>
                        </div>

                        <button className="w-full py-3.5 bg-slate-50 text-slate-700 font-bold text-sm rounded-xl border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors" onClick={() => router.push(`/reimbursement/medical/${STATIC_MR_ROUTE_PARAM}/advance/${a.advId}/preview`)}>
                          View Requisition Document
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(active === 'CERTIFICATE' || active === 'FINAL NOTE') && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-3xl p-16 border border-slate-200 shadow-sm text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                    {active === 'CERTIFICATE' ? <ClipboardCheck className="w-12 h-12" /> : <Pill className="w-12 h-12" />}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Section Available Soon</h3>
                  <p className="text-slate-500 text-lg max-w-md mx-auto">This section is dynamically generated based on standard operating procedures. Content will appear here when applicable to your case status.</p>
                </div>
              </div>
            )}

            {active === 'MOVEMENT REGISTER' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="border-b border-slate-200 pb-6 mb-8">
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Movement History</h2>
                  <p className="text-slate-500 text-lg">Audit trail of actions taken on this case file.</p>
                </div>

                <div className="relative border-l-2 border-indigo-100 ml-6 pb-4">
                  {c.movement.map((m, i) => (
                    <div key={m.id} className="relative pl-10 pb-10 last:pb-0">
                      <div className="absolute -left-[11px] top-1 w-5 h-5 bg-white border-4 border-indigo-500 rounded-full shadow-sm"></div>
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-base font-bold text-slate-900 mb-2">{m.action}</p>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <History className="w-3.5 h-3.5" />
                          {new Date(m.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 right-10 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 font-bold flex items-center gap-3 z-50">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}
