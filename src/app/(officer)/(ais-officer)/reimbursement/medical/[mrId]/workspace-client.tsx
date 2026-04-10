'use client';

import React, { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, Briefcase, ClipboardCheck, UserCircle2, Stethoscope, FileText, IndianRupee, Pill, ChevronRight, CheckCircle } from 'lucide-react';
import styles from '@/modules/medical-reimbursement/mr.module.css';
import { loadCases, saveCases } from '@/modules/medical-reimbursement/mockStore';
import type { Bill, DocType } from '@/modules/medical-reimbursement/types';
import { advancePaid, billsTotal, missingItems, rupee, statusColor } from '@/modules/medical-reimbursement/utils';
import { STATIC_ADV_ROUTE_PARAM, STATIC_MR_ROUTE_PARAM, getActiveMrId, setActiveAdvanceId, setActiveMrId } from '@/modules/medical-reimbursement/session';

const tabs = ['SUMMARY', 'TREATMENT NOTE', 'ANNEXURES', 'ADVANCE NOTES', 'CERTIFICATE', 'FINAL NOTE', 'MOVEMENT REGISTER'];
const docTypes: { label: string; value: DocType }[] = [
  { label: 'Estimate', value: 'ESTIMATE' },
  { label: 'Discharge Summary', value: 'DISCHARGE' },
  { label: 'Essentiality Certificate (Signed)', value: 'EC_SIGNED' },
  { label: 'Prescription', value: 'PRESCRIPTION' },
  { label: 'Lab', value: 'LAB' },
  { label: 'GO', value: 'GO' },
  { label: 'Other', value: 'OTHER' },
];


const getTabIcon = (t: string) => {
  if (t === 'SUMMARY') return Activity;
  if (t === 'TREATMENT NOTE') return Stethoscope;
  if (t === 'ANNEXURES') return FileText;
  if (t === 'ADVANCE NOTES') return IndianRupee;
  if (t === 'CERTIFICATE') return ClipboardCheck;
  if (t === 'FINAL NOTE') return Pill;
  if (t === 'MOVEMENT REGISTER') return Briefcase;
  return Activity;
};

export default function MRCaseWorkspaceClient() {
  const router = useRouter();
  const search = useSearchParams();
  const [activeMrId, setActiveMrIdState] = useState('');
  const [active, setActive] = useState(search.get('tab') || 'SUMMARY');
  const [sub, setSub] = useState<'Bills' | 'Other'>('Bills');
  const [toast, setToast] = useState('');
  const [docType, setDocType] = useState<DocType>('DISCHARGE');
  const [treatmentDraft, setTreatmentDraft] = useState({
    placeOfIllness: '',
    hospitalised: true,
    withinState: true,
    hospitalType: 'Government',
    hospitalName: '',
    hospitalAddress: '',
    fromDate: '',
    toDate: '',
    diagnosis: '',
    medicalType: 'Allopathy',
  });
  const [hospitalQuery, setHospitalQuery] = useState('');
  const [hospitalOptions, setHospitalOptions] = useState<{ name: string; address: string }[]>([]);
  const [hospitalLoading, setHospitalLoading] = useState(false);
  const [hospitalFocused, setHospitalFocused] = useState(false);
  const skipAutocompleteRef = useRef(false);
  const [billEditId, setBillEditId] = useState('');
  const [billDraft, setBillDraft] = useState<Bill | null>(null);
  const billUploadRef = useRef<HTMLInputElement>(null);
  const docUploadRef = useRef<HTMLInputElement>(null);
  const estimateUploadRef = useRef<HTMLInputElement>(null);
  const ecSignedUploadRef = useRef<HTMLInputElement>(null);
  const [advanceFormOpen, setAdvanceFormOpen] = useState(false);
  const [advancePreview, setAdvancePreview] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [estimateFileName, setEstimateFileName] = useState('');
  const [ecMeta, setEcMeta] = useState({
    amaName: '',
    amaDesignation: '',
    regNo: '',
    institutionName: '',
    institutionAddress: '',
    signatureName: '',
    certificateDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    setActiveMrIdState(getActiveMrId());
  }, []);

  const cases = loadCases();
  const c = cases.find((x) => x.mrId === activeMrId);
  useEffect(() => {
    if (!c) return;
    setTreatmentDraft({
      placeOfIllness: c.treatment.placeOfIllness || '',
      hospitalised: c.treatment.hospitalised,
      withinState: c.treatment.withinState,
      hospitalType: c.treatment.hospitalType || 'Government',
      hospitalName: c.treatment.hospitalName || '',
      hospitalAddress: c.treatment.hospitalAddress || '',
      fromDate: c.treatment.fromDate || '',
      toDate: c.treatment.toDate || '',
      diagnosis: c.treatment.diagnosis?.split(' | ')[0] || '',
      medicalType: c.treatment.diagnosis?.includes(' | ') ? c.treatment.diagnosis.split(' | ')[1] : 'Allopathy',
    });
    setHospitalQuery(c.treatment.hospitalName || '');
    setEcMeta({
      amaName: c.officer.fullName,
      amaDesignation: c.officer.designation,
      regNo: '',
      institutionName: c.treatment.hospitalName || 'Government Hospital',
      institutionAddress: c.treatment.hospitalAddress || c.officer.officeAddress,
      signatureName: c.officer.fullName,
      certificateDate: new Date().toISOString().slice(0, 10),
    });
  }, [c?.mrId]);

  useEffect(() => {
    if (!c || !treatmentDraft.hospitalised || !hospitalFocused) return;
    if (skipAutocompleteRef.current) {
      skipAutocompleteRef.current = false;
      return;
    }
    const q = hospitalQuery.trim();
    if (q.length < 3) {
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
        const opts = Array.isArray(data)
          ? data.map((item: any) => ({ name: String(item?.name || item?.display_name?.split(',')[0] || 'Hospital'), address: String(item?.display_name || '') }))
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
  }, [hospitalQuery, hospitalFocused, treatmentDraft.hospitalised, c?.mrId]);

  if (!c) {
    return <div className={styles.mrShell}><div className={styles.container}>Case not found. Open a case from the Medical Reimbursement list first.</div></div>;
  }

  const updateCase = (nextCase: typeof c, message?: string) => {
    const next = cases.map((x) => x.mrId === c.mrId ? nextCase : x);
    saveCases(next);
    if (message) {
      setToast(message);
      setTimeout(() => setToast(''), 1800);
    }
  };

  const openFinalPreview = () => {
    setActiveMrId(c.mrId);
    router.push(`/reimbursement/medical/${STATIC_MR_ROUTE_PARAM}/final/preview`);
  };

  const addBill = () => {
    const mock: Bill = {
      id: crypto.randomUUID(),
      fileName: `bill-${c.bills.length + 1}.pdf`,
      invoiceNo: `INV-${Math.floor(Math.random() * 999)}`,
      gstNo: `GST-${Math.floor(Math.random() * 999)}`,
      billDate: new Date().toISOString().slice(0, 10),
      hospitalName: c.treatment.hospitalName,
      totalAmount: 11000,
      taxAmount: 300,
      status: 'Extracted',
      duplicateFlag: c.bills.some((b) => b.invoiceNo === 'INV-111'),
    };
    updateCase(
      {
        ...c,
        bills: [...c.bills, mock],
        lastUpdated: new Date().toISOString(),
        movement: [{ id: crypto.randomUUID(), action: 'Bill extracted', at: new Date().toISOString() }, ...c.movement],
      },
      'Bill extracted',
    );
  };

  const addDoc = () => {
    updateCase(
      {
        ...c,
        docs: [{ id: crypto.randomUUID(), type: docType, fileName: `${docType.toLowerCase()}-${Date.now()}.pdf`, uploadedAt: new Date().toISOString() }, ...c.docs],
        lastUpdated: new Date().toISOString(),
        movement: [{ id: crypto.randomUUID(), action: `${docType} uploaded`, at: new Date().toISOString() }, ...c.movement],
      },
      docType === 'EC_SIGNED' ? 'EC uploaded' : 'Saved',
    );
  };

  const parseAmount = (x: string) => {
    const n = Number(String(x).replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  const extractMockBill = (fileName: string): Bill => {
    const stamp = Date.now().toString().slice(-5);
    const total = 8000 + Math.floor(Math.random() * 24000);
    const tax = Math.round(total * 0.05);
    return {
      id: crypto.randomUUID(),
      fileName,
      invoiceNo: `INV-${stamp}`,
      gstNo: `32ABCDE${stamp.slice(0, 3)}Z5`,
      billDate: new Date().toISOString().slice(0, 10),
      hospitalName: c.treatment.hospitalName || treatmentDraft.hospitalName || 'Hospital',
      totalAmount: total,
      taxAmount: tax,
      status: 'Extracted',
      duplicateFlag: c.bills.some((b) => b.invoiceNo === `INV-${stamp}`),
    };
  };

  const onBillUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const extracted = extractMockBill(file.name);
    updateCase(
      {
        ...c,
        bills: [extracted, ...c.bills],
        lastUpdated: new Date().toISOString(),
        movement: [{ id: crypto.randomUUID(), action: `Bill uploaded and extracted: ${file.name}`, at: new Date().toISOString() }, ...c.movement],
      },
      'Bill extracted',
    );
    setBillEditId(extracted.id);
    setBillDraft(extracted);
    e.target.value = '';
  };

  const onDocUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateCase(
      {
        ...c,
        docs: [{ id: crypto.randomUUID(), type: docType, fileName: file.name, uploadedAt: new Date().toISOString() }, ...c.docs],
        lastUpdated: new Date().toISOString(),
        movement: [{ id: crypto.randomUUID(), action: `${docType} uploaded (${file.name})`, at: new Date().toISOString() }, ...c.movement],
      },
      'Document uploaded',
    );
    e.target.value = '';
  };

  const onSignedEcUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateCase(
      {
        ...c,
        docs: [{ id: crypto.randomUUID(), type: 'EC_SIGNED', fileName: file.name, uploadedAt: new Date().toISOString() }, ...c.docs],
        lastUpdated: new Date().toISOString(),
        movement: [{ id: crypto.randomUUID(), action: `Signed EC uploaded (${file.name})`, at: new Date().toISOString() }, ...c.movement],
      },
      'Signed EC uploaded',
    );
    e.target.value = '';
  };

  const startBillEdit = (b: Bill) => {
    setBillEditId(b.id);
    setBillDraft({ ...b });
  };

  const saveBillEdit = () => {
    if (!billDraft) return;
    updateCase(
      {
        ...c,
        bills: c.bills.map((b) => (b.id === billDraft.id ? billDraft : b)),
        lastUpdated: new Date().toISOString(),
        movement: [{ id: crypto.randomUUID(), action: `Bill updated: ${billDraft.fileName}`, at: new Date().toISOString() }, ...c.movement],
      },
      'Bill saved',
    );
    setBillEditId('');
    setBillDraft(null);
  };

  const saveTreatment = () => {
    updateCase(
      {
        ...c,
        treatment: {
          ...treatmentDraft,
          diagnosis: `${treatmentDraft.diagnosis} | ${treatmentDraft.medicalType}`,
          hospitalName: treatmentDraft.hospitalised ? treatmentDraft.hospitalName : 'Not hospitalised',
          hospitalAddress: treatmentDraft.hospitalised ? treatmentDraft.hospitalAddress : '',
        },
        lastUpdated: new Date().toISOString(),
        movement: [{ id: crypto.randomUUID(), action: 'Treatment note updated', at: new Date().toISOString() }, ...c.movement],
      },
      'Treatment saved',
    );
  };

  const submitAdvanceRequest = () => {
    const amt = parseAmount(advanceAmount);
    if (!amt || !estimateFileName) return;
    const adv = {
      advId: crypto.randomUUID(),
      advNo: `ADV-MR-2026-${String(Math.floor(Math.random() * 9999)).padStart(6, '0')}`,
      amount: amt,
      status: 'Submitted' as const,
      estimateDocId: estimateFileName,
      signed: false,
      submittedAt: new Date().toISOString(),
    };
    updateCase(
      {
        ...c,
        advances: [adv, ...c.advances],
        status: 'Advance Submitted',
        movement: [{ id: crypto.randomUUID(), action: `Advance request submitted (${rupee(amt)})`, at: new Date().toISOString() }, ...c.movement],
      },
      'Advance submitted',
    );
    setAdvanceFormOpen(false);
    setAdvancePreview(false);
    setAdvanceAmount('');
    setEstimateFileName('');
  };

  const escapeHtml = (value: string) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

  const downloadEssentialityCertificate = () => {
    const renderedRows = [...c.bills];
    while (renderedRows.length < 5) {
      renderedRows.push({
        id: crypto.randomUUID(),
        fileName: '',
        invoiceNo: '',
        gstNo: '',
        billDate: '',
        hospitalName: '',
        totalAmount: 0,
        taxAmount: 0,
        status: 'Extracted',
        duplicateFlag: false,
      });
    }

    const requiredText = c.treatment.hospitalised
      ? 'required hospitalization / ~~did not require hospitalization~~'
      : '~~required hospitalization~~ / did not require hospitalization';

    const rowsHtml = renderedRows
      .map((b, i) => {
        const billRef = b.invoiceNo ? `${b.invoiceNo}${b.billDate ? ` (${b.billDate})` : ''}` : '';
        return `<tr>
  <td>${i + 1}</td>
  <td>${escapeHtml(billRef)}</td>
  <td>${escapeHtml(b.fileName || '')}</td>
  <td>-</td>
  <td>-</td>
  <td style="text-align:right;">${b.totalAmount ? escapeHtml(String(b.totalAmount)) : ''}</td>
</tr>`;
      })
      .join('');

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Essentiality Certificate - ${escapeHtml(c.mrNo)}</title>
  <style>
    body { font-family: "Segoe UI", Arial, sans-serif; color:#111827; margin: 28px; line-height: 1.35; }
    h1 { font-size: 18px; margin: 0; text-align: center; }
    h2 { font-size: 14px; margin: 2px 0 16px; text-align: center; font-weight: 600; }
    p { margin: 7px 0; font-size: 13px; }
    .label { font-weight: 600; }
    table { width:100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border:1px solid #374151; padding:6px 8px; font-size:12px; vertical-align: top; }
    th { background:#eef2ff; text-align:left; }
    .right { text-align:right; }
    .sign { margin-top: 20px; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; margin-top: 10px; }
    .mono { border-bottom: 1px dashed #9ca3af; min-height: 20px; display: inline-block; min-width: 220px; }
  </style>
</head>
<body>
  <h1>ESSENTIALITY CERTIFICATE</h1>
  <h2>(To be issued by Authorized Medical Attendant)</h2>

  <p>I certify that Sri/Smt <span class="label">${escapeHtml(c.officer.fullName)}</span> (Service: ${escapeHtml(c.officer.serviceType)}), Designation <span class="label">${escapeHtml(c.officer.designation)}</span>, has been under my treatment at this hospital/dispensary/residence from <span class="label">${escapeHtml(c.treatment.fromDate || '-')}</span> to <span class="label">${escapeHtml(c.treatment.toDate || '-')}</span>. The undermentioned medicines were essential for recovery/prevention of serious deterioration.</p>
  <p>The medicines were not available in hospital stock (if applicable).</p>
  <p>They do not include proprietary preparations where cheaper substitutes are available.</p>
  <p>The case <span class="label">${requiredText}</span>.</p>
  <p>The patient was / has been suffering from: <span class="label">${escapeHtml(c.treatment.diagnosis || '-')}</span></p>

  <p class="label" style="margin-top:12px;">Statement of Medicines / Investigations</p>
  <table>
    <thead>
      <tr>
        <th style="width:52px;">Sl.No</th>
        <th>Bill No & Date</th>
        <th>Medicine (Brand)</th>
        <th>Chemical Name</th>
        <th style="width:80px;">Qty</th>
        <th style="width:100px;">Price (INR)</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <p class="right"><span class="label">Total Amount:</span> INR ${escapeHtml(String(billsTotal(c)))}</p>
  <p class="label" style="margin-top:14px;">Certification</p>

  <div class="grid">
    <p><span class="label">Name of Authorized Medical Attendant:</span> ${escapeHtml(ecMeta.amaName || '-')}</p>
    <p><span class="label">Designation:</span> ${escapeHtml(ecMeta.amaDesignation || '-')}</p>
    <p><span class="label">Medical Registration No:</span> ${escapeHtml(ecMeta.regNo || '-')}</p>
    <p><span class="label">Name of Hospital/Institution:</span> ${escapeHtml(ecMeta.institutionName || '-')}</p>
    <p><span class="label">Address:</span> ${escapeHtml(ecMeta.institutionAddress || '-')}</p>
    <p><span class="label">Date:</span> ${escapeHtml(ecMeta.certificateDate || '-')}</p>
  </div>

  <div class="sign">
    <p><span class="label">Signature:</span> ${escapeHtml(ecMeta.signatureName || '-')}</p>
    <p><span class="label">Official Seal:</span> ________________________</p>
  </div>
</body>
</html>`;

    const docHtml = `<!doctype html><html><head><meta charset="utf-8"></head><body>${html.replace(/^<!doctype html>[\s\S]*?<body>/i, '').replace(/<\/body>\s*<\/html>\s*$/i, '')}</body></html>`;
    const blob = new Blob([docHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${c.mrNo}-essentiality-certificate.doc`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setToast('Essentiality Certificate downloaded');
    setTimeout(() => setToast(''), 1800);
  };

  const checks = missingItems(c);
  const hasGo = c.docs.some((d) => d.type === 'GO');
  const selectedDependent = c.patient.claimFor === 'DEPENDENT'
    ? c.officer.dependents.find((d) => d.personId === c.patient.dependentPersonId)
    : undefined;
  const formatDMY = (v?: string) => {
    if (!v) return '-';
    const [y, m, d] = v.slice(0, 10).split('-');
    if (!y || !m || !d) return v;
    return `${d}-${m}-${y}`;
  };


  return (
    <div className="min-h-screen bg-slate-100 font-sans">

      {/* Hero Header & Tracker */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-800 to-blue-900 text-white pb-24 pt-8 px-6 lg:px-10">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="animate-in fade-in slide-in-from-left duration-500">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-blue-100 text-sm font-semibold mb-4 border border-white/20 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Medical Reimbursement Case
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 drop-shadow-md">{c.mrNo}</h1>
            <div className="flex items-center gap-4 text-blue-100 mt-3 text-sm">
              <span className="flex items-center gap-1.5"><UserCircle2 className="w-4 h-4" /> {c.officer.fullName}</span>
              <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
              <span>PEN {c.officer.penNumber}</span>
              <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
              <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {c.officer.designation || c.officer.serviceType}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 animate-in fade-in slide-in-from-right duration-500 delay-150">
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-medium transition-all shadow-sm backdrop-blur-sm flex items-center gap-2">
                Print Case
              </button>
              <button disabled={checks.length > 0} onClick={openFinalPreview} className={`px-5 py-2.5 rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2 ${checks.length > 0 ? 'bg-indigo-400/50 text-indigo-100 cursor-not-allowed' : 'bg-white text-indigo-900 hover:bg-indigo-50 hover:scale-105'}`}>
                <ClipboardCheck className="w-4 h-4" /> Final Submission
              </button>
            </div>
            {checks.length > 0 && <div className="text-xs text-amber-200 mt-1 max-w-xs text-right bg-black/20 p-2 rounded-lg backdrop-blur-sm border border-amber-500/30">Action blocked: {checks[0]}</div>}
          </div>
        </div>

        {/* Visual Stepper */}
        <div className="max-w-[1600px] mx-auto mt-10">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 rounded-full"></div>
            {['Draft', 'Advance Submitted', 'Final Submitted', 'Approved', 'Paid & Closed'].map((step, i) => {
              const isActive = c.status === step || (c.status === 'Active' && step === 'Draft');
              const isPast = ['Draft', 'Advance Submitted', 'Final Submitted', 'Approved', 'Paid & Closed'].indexOf(c.status === 'Active' ? 'Draft' : c.status) > i;

              return (
                <div key={step} className="relative z-10 flex flex-col items-center gap-2 group cursor-default">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg transition-all duration-300 ${isActive ? 'bg-white text-blue-900 scale-125 ring-4 ring-blue-400/30' : isPast ? 'bg-emerald-400 text-emerald-950' : 'bg-slate-800 text-slate-400 border-2 border-slate-600'}`}>
                    {isPast ? '✓' : i + 1}
                  </div>
                  <div className={`absolute top-12 whitespace-nowrap text-xs font-semibold uppercase tracking-wider transition-all ${isActive ? 'text-white scale-110 drop-shadow-md' : isPast ? 'text-emerald-300' : 'text-slate-400 opacity-70'}`}>
                    {step.replace(' & Closed', '')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Action Navigation & Main Content */}
      <div className="max-w-[1600px] mx-auto -mt-16 px-6 lg:px-10 pb-20 relative z-20">

        {/* Navigation Pills */}
        <div className="bg-white/90 backdrop-blur-xl p-2 rounded-2xl shadow-xl shadow-blue-900/10 border border-slate-200/50 mb-8 flex overflow-x-auto hide-scrollbar gap-2">
          {tabs.map((t) => {
             const Icon = getTabIcon(t);
             return (
               <button
                 key={t}
                 onClick={() => setActive(t)}
                 className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${active === t ? 'bg-blue-600 text-white shadow-md scale-100' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 scale-95'}`}
               >
                 <Icon className={`w-4 h-4 ${active === t ? 'animate-bounce' : ''}`} />
                 {t}
               </button>
             );
          })}
        </div>

        {/* Dynamic Content Container */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden min-h-[600px] animate-in slide-in-from-bottom-8 duration-700">

          {active === 'SUMMARY' && (
            <div className="p-8 lg:p-12 space-y-10">

              {/* Financial Bento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="text-sm font-semibold text-indigo-600 mb-2 uppercase tracking-wide">Total Bills</div>
                  <div className="text-4xl font-black text-indigo-950">{rupee(billsTotal(c))}</div>
                  <div className="mt-4 text-xs font-medium text-indigo-500 flex items-center gap-1"><FileText className="w-3 h-3"/> From {c.bills.length} submitted documents</div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="text-sm font-semibold text-emerald-600 mb-2 uppercase tracking-wide">Advance Processed</div>
                  <div className="text-4xl font-black text-emerald-950">{rupee(advancePaid(c))}</div>
                  <div className="mt-4 text-xs font-medium text-emerald-600 flex items-center gap-1"><IndianRupee className="w-3 h-3"/> Across {c.advances.length} advance requests</div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="text-sm font-semibold text-amber-700 mb-2 uppercase tracking-wide">Remaining Balance</div>
                  <div className="text-4xl font-black text-amber-950">{rupee(billsTotal(c) - advancePaid(c))}</div>
                  <div className="mt-4 text-xs font-medium text-amber-600 flex items-center gap-1"><Activity className="w-3 h-3"/> Pending final settlement</div>
                </div>
              </div>

              {/* Patient & Treatment Bento */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-8 rounded-3xl border border-slate-200 bg-slate-50/50 shadow-inner">
                  <h3 className="flex items-center gap-3 text-lg font-bold text-slate-800 mb-6 pb-4 border-b border-slate-200">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><UserCircle2 className="w-5 h-5"/></div>
                    Patient & Officer Profile
                  </h3>
                  <div className="space-y-5">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1 text-sm font-semibold text-slate-500">Applicant</div>
                      <div className="col-span-2 text-sm font-bold text-slate-900">{c.patient.name} <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{c.patient.claimFor === 'SELF' ? 'Self' : c.patient.relation}</span></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1 text-sm font-semibold text-slate-500">Officer Name</div>
                      <div className="col-span-2 text-sm font-bold text-slate-900">{c.officer.fullName}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1 text-sm font-semibold text-slate-500">Details</div>
                      <div className="col-span-2 text-sm text-slate-700 leading-relaxed">{c.officer.designation}<br/>Level: {c.officer.level} | Grade: {c.officer.grade}<br/>{c.officer.postingTypes}</div>
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-3xl border border-slate-200 bg-slate-50/50 shadow-inner">
                  <h3 className="flex items-center gap-3 text-lg font-bold text-slate-800 mb-6 pb-4 border-b border-slate-200">
                    <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><Stethoscope className="w-5 h-5"/></div>
                    Medical Treatment
                  </h3>
                  <div className="space-y-5">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1 text-sm font-semibold text-slate-500">Hospital</div>
                      <div className="col-span-2 text-sm font-bold text-slate-900">{c.treatment.hospitalName || 'Not recorded'}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1 text-sm font-semibold text-slate-500">Facility Type</div>
                      <div className="col-span-2 text-sm text-slate-700">{c.treatment.hospitalType} | {c.treatment.hospitalised ? 'Hospitalised' : 'Out-Patient'}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1 text-sm font-semibold text-slate-500">System</div>
                      <div className="col-span-2 text-sm text-slate-700">{c.treatment.diagnosis}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1 text-sm font-semibold text-slate-500">Duration</div>
                      <div className="col-span-2 text-sm text-slate-700 font-mono bg-white px-3 py-1.5 rounded-md border border-slate-200 inline-block w-max">
                        {formatDMY(c.treatment.fromDate)} <span className="text-slate-400 mx-2">→</span> {formatDMY(c.treatment.toDate)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {active === 'TREATMENT NOTE' && (
            <div className="p-8 lg:p-12 space-y-8">
               <h3 className="text-2xl font-bold text-slate-900 mb-2">Detailed Treatment Note</h3>
               <p className="text-slate-500 mb-8">Maintain hospital details and medical procedures below.</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Hospital Full Name</label>
                      <input className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white" defaultValue={c.treatment.hospitalName} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Hospital Address</label>
                      <textarea className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow min-h-[100px] bg-white" defaultValue={c.treatment.hospitalAddress} />
                    </div>
                 </div>
                 <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Diagnosis / Medical Condition</label>
                      <textarea className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow min-h-[100px] bg-white" defaultValue={c.treatment.diagnosis} />
                    </div>
                 </div>
               </div>
               <div className="flex justify-end pt-6">
                 <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all">Save Treatment Note</button>
               </div>
            </div>
          )}

          {active === 'ANNEXURES' && (
            <div className="p-8 lg:p-12 space-y-8">
              <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Annexures & Bills</h3>
                  <p className="text-slate-500">Upload and manage all medical bills and essential certificates.</p>
                </div>
                <div className="flex gap-3">
                   <button className="px-5 py-2.5 bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors">Upload Document</button>
                   <button className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors">Add Bill</button>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2"><IndianRupee className="w-5 h-5 text-indigo-500"/> Financial Bills</h4>
                {c.bills.length === 0 ? (
                  <div className="p-10 border-2 border-dashed border-slate-300 rounded-3xl text-center text-slate-500 bg-slate-50">No bills added yet. Click "Add Bill" to begin.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {c.bills.map((b, i) => (
                      <div key={b.id} className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">{i+1}</div>
                          <div>
                            <div className="font-bold text-slate-900 text-lg">{b.hospitalName}</div>
                            <div className="text-sm text-slate-500">INV: <span className="font-mono text-slate-700">{b.invoiceNo}</span> | Date: {formatDMY(b.billDate)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 mt-4 md:mt-0">
                           <div className="text-right">
                             <div className="text-xs text-slate-500 font-semibold uppercase">Amount</div>
                             <div className="text-xl font-black text-indigo-900">{rupee(b.totalAmount)}</div>
                           </div>
                           <button className="text-blue-600 hover:text-blue-800 font-semibold text-sm bg-blue-50 px-4 py-2 rounded-lg">Review</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {active === 'ADVANCE NOTES' && (
            <div className="p-8 lg:p-12 space-y-8">
              <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Advance Requisitions</h3>
                  <p className="text-slate-500">Manage advance payment requests for ongoing treatments.</p>
                </div>
                <button className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors">Request New Advance</button>
              </div>

              {c.advances.length === 0 ? (
                <div className="p-10 border-2 border-dashed border-slate-300 rounded-3xl text-center text-slate-500 bg-slate-50">No advance requests found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {c.advances.map(a => (
                    <div key={a.advId} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${a.status === 'Paid' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Request Number</div>
                          <div className="font-mono text-sm text-slate-800 font-semibold bg-slate-100 px-2 py-1 rounded inline-block">{a.advNo}</div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${a.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{a.status.toUpperCase()}</span>
                      </div>
                      <div className="text-3xl font-black text-slate-900 mb-4">{rupee(a.amount)}</div>
                      <button className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-semibold transition-colors" onClick={() => router.push(`/reimbursement/medical/${STATIC_MR_ROUTE_PARAM}/advance/${a.advId}/preview`)}>
                        View Request Document
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {active === 'CERTIFICATE' && (
            <div className="p-8 lg:p-12 text-center text-slate-500 font-medium pt-20">
              <ClipboardCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              Essentiality Certificate generation area. <br/> Forms will appear here based on the selected case type.
            </div>
          )}
          {active === 'FINAL NOTE' && (
            <div className="p-8 lg:p-12 text-center text-slate-500 font-medium pt-20">
              <Pill className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              Final settlement and medical notes overview.
            </div>
          )}
          {active === 'MOVEMENT REGISTER' && (
            <div className="p-8 lg:p-12">
               <h3 className="text-2xl font-bold text-slate-900 mb-8 border-b border-slate-200 pb-4">File Movement History</h3>
               <div className="space-y-0 border-l-2 border-slate-200 ml-4 relative">
                 {c.movement.map((m, i) => (
                   <div key={m.id} className="relative pl-8 pb-8 last:pb-0">
                     <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-sm"></div>
                     <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                       <div className="text-sm font-bold text-slate-900 mb-1">{m.action}</div>
                       <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{new Date(m.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short'})}</div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 font-medium flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}
