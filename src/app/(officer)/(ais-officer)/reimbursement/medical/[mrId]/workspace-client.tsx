'use client';

import React, { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, Briefcase, ClipboardCheck, UserCircle2, Stethoscope, FileText, IndianRupee, Pill, ChevronRight } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[1600px] mx-auto">

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium text-indigo-600">Medical Reimbursement Case File</div>
              <div className="text-xl font-bold text-slate-900">{c.mrNo}</div>
              <div className="text-sm font-medium text-slate-700">{c.officer.fullName}</div>
              <div className="text-xs text-slate-500">PEN {c.officer.penNumber} | {c.officer.serviceType} | {c.officer.cadre}</div>
            </div>
            <div className="flex flex-col md:items-end gap-2">
              <div className="text-sm font-medium text-slate-700">Patient: {c.patient.relation} - {c.patient.name}</div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-sm font-semibold border rounded-full" style={{ color: statusColor(c.status), borderColor: statusColor(c.status) }}>{c.status}</span>
                {hasGo && <span className="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded">GO attached</span>}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                Bills <span className="font-semibold text-slate-900">{rupee(billsTotal(c))}</span>
                <span className="ml-3">Advance paid: <span className="font-semibold text-slate-900">{rupee(advancePaid(c))}</span></span>
              </div>
            </div>
          </div>
        </div>
<div className="flex flex-wrap items-center justify-between gap-3 p-3 mb-4 bg-white border border-slate-200 rounded-lg shadow-sm sticky top-0 z-10">
          <div className="flex gap-3">
            <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 shadow-sm transition-colors" onClick={() => setActive('ANNEXURES')}>Add Bill/Doc</button>
            <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 shadow-sm transition-colors" onClick={() => setActive('ADVANCE NOTES')}>Request Advance</button>
            <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 shadow-sm transition-colors" onClick={() => window.print()}>Print Preview</button>
          </div>
          <div>
            <button disabled={checks.length > 0} className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm transition-colors ${checks.length > 0 ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`} title={checks.join(', ')} onClick={openFinalPreview}>
              {checks.length > 0 ? 'Fix issues to Submit' : 'Submit Final Claim'}
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Vertical Sidebar Navigation */}

    {/* Stepper Header */}
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex justify-between items-center overflow-x-auto">
      {['Draft', 'Advance Submitted', 'Final Submitted', 'Approved', 'Paid & Closed'].map((step, i) => {
        const isActive = c.status === step || (c.status === 'Active' && step === 'Draft');
        const isPast = ['Draft', 'Advance Submitted', 'Final Submitted', 'Approved', 'Paid & Closed'].indexOf(c.status === 'Active' ? 'Draft' : c.status) > i;
        return (
          <div key={step} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold ${isActive ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : isPast ? 'border-emerald-500 text-emerald-500 bg-emerald-50' : 'border-slate-300 text-slate-400'}`}>
              {isPast ? '✓' : i + 1}
            </div>
            <div className={`ml-3 text-sm font-medium ${isActive ? 'text-indigo-900' : isPast ? 'text-emerald-700' : 'text-slate-500'}`}>{step.replace(' & Closed', '')}</div>
            {i < 4 && <div className={`w-12 h-0.5 mx-4 ${isPast ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
          </div>
        );
      })}
    </div>

    <div className="flex flex-col lg:flex-row gap-6">

      {/* Sticky Left Summary Column */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <div className="sticky top-20 flex flex-col gap-4">

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Case Snapshot</h3>
            </div>
            <div className="p-4 space-y-4 text-sm">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Applicant</div>
                <div className="font-medium text-slate-900">{c.patient.name}</div>
                <div className="text-slate-600">{c.patient.claimFor === 'SELF' ? 'Self' : c.patient.relation}</div>
              </div>
              <hr className="border-slate-100" />
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Treatment</div>
                <div className="font-medium text-slate-900">{c.treatment.hospitalName || 'Not hospitalised'}</div>
                <div className="text-slate-600">{c.treatment.diagnosis}</div>
              </div>
              <hr className="border-slate-100" />
              <div className="bg-indigo-50 p-3 rounded-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-indigo-900 font-medium">Total Bills</span>
                  <span className="text-indigo-900 font-bold">{rupee(billsTotal(c))}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-indigo-700">Advance Paid</span>
                  <span className="text-indigo-700">{rupee(advancePaid(c))}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 flex flex-col gap-1">
            {tabs.map(t => {
              const Icon = getTabIcon(t);
              return (
                <button
                  key={t}
                  onClick={() => setActive(t)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${active === t ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active === t ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {t}
                  </div>
                  <ChevronRight className={`w-4 h-4 ${active === t ? 'text-indigo-400' : 'text-slate-300 opacity-0'}`} />
                </button>
              )
            })}
          </div>

        </div>
      </div>

      <div className="flex-1 min-w-0">


        {active === 'SUMMARY' && (
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm min-h-[500px]">
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryHead}><Briefcase className={styles.summaryHeadIcon} aria-hidden="true" />Officer Snapshot</div>
                <div className={styles.summaryKVs}>
                  <div className={styles.summaryLabel}>Name</div>
                  <div className={styles.summaryValue}>{c.officer.fullName}</div>
                  <div className={styles.summaryLabel}>Service</div>
                  <div className={styles.summaryValue}>{c.officer.serviceType} | PEN {c.officer.penNumber} | {c.officer.cadre}</div>
                  <div className={styles.summaryLabel}>Role</div>
                  <div className={styles.summaryValue}>{c.officer.designation}</div>
                  <div className={styles.summaryLabel}>Current Position</div>
                  <div className={styles.summaryValue}>{c.officer.postingTypes} | {c.officer.administrativeDepartment}</div>
                  <div className={styles.summaryLabel}>Grade / Level</div>
                  <div className={styles.summaryValue}>{c.officer.grade} | {c.officer.level}</div>
                  <div className={styles.summaryLabel}>Basic Pay</div>
                  <div className={styles.summaryValue}>{rupee(c.officer.basicPay)}</div>
                  <div className={styles.summaryLabel}>Contact</div>
                  <div className={styles.summaryValue}>{c.officer.email} | {c.officer.mobile}</div>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryHead}><UserCircle2 className={styles.summaryHeadIcon} aria-hidden="true" />Claimed For</div>
                <div className={styles.summaryKVs}>
                  <div className={styles.summaryLabel}>Type</div>
                  <div className={styles.summaryValue}>{c.patient.claimFor === 'SELF' ? 'Self' : 'Dependent'}</div>
                  <div className={styles.summaryLabel}>Name</div>
                  <div className={styles.summaryValue}>{c.patient.name}</div>
                  <div className={styles.summaryLabel}>Relation</div>
                  <div className={styles.summaryValue}>{c.patient.relation}</div>
                  {c.patient.claimFor === 'DEPENDENT' && selectedDependent && (
                    <>
                      <div className={styles.summaryLabel}>Dependent Details</div>
                      <div className={styles.summaryValue}>{selectedDependent.gender} | DOB {selectedDependent.dob} | {selectedDependent.relationType}</div>
                    </>
                  )}
                  <div className={styles.summaryLabel}>Hospital</div>
                  <div className={styles.summaryValue}>{c.treatment.hospitalName || '-'}</div>
                  <div className={styles.summaryLabel}>Address</div>
                  <div className={styles.summaryValue}>{c.treatment.hospitalAddress || '-'}</div>
                  <div className={styles.summaryLabel}>Period</div>
                  <div className={styles.summaryValue}>{formatDMY(c.treatment.fromDate)} to {formatDMY(c.treatment.toDate)}</div>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryHead}><ClipboardCheck className={styles.summaryHeadIcon} aria-hidden="true" />Readiness</div>
                <div className={styles.summaryBadges}>
                  {checks.length
                    ? checks.map((m) => <span key={m} className={styles.summaryWarnBadge}>{m}</span>)
                    : <span className={styles.summaryOkBadge}>Ready to process</span>}
                </div>
                <div className={styles.summaryStats}>
                  <div className={styles.summaryStatItem}><span>Total Bills</span><b>{rupee(billsTotal(c))}</b></div>
                  <div className={styles.summaryStatItem}><span>Advance Paid</span><b>{rupee(advancePaid(c))}</b></div>
                  <div className={styles.summaryStatItem}><span>Net Claim</span><b>{rupee(billsTotal(c) - advancePaid(c))}</b></div>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryHead}><Activity className={styles.summaryHeadIcon} aria-hidden="true" />Recent Activity</div>
                <div className={styles.summaryTimeline}>
                  {c.movement.slice(0, 4).map((m) => (
                    <div key={m.id} className={styles.summaryTimelineItem}>
                      <span>{m.action}</span>
                      <small>{new Date(m.at).toLocaleString()}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {active === 'TREATMENT NOTE' && (
          <div className={styles.page}>
            <div className={styles.sectionHeadRow}>
              <h4 className={styles.labelText}>Treatment Note</h4>
              <div className={styles.sectionActions}>
                <button className={styles.btnPrimary} onClick={saveTreatment}>Save Treatment</button>
              </div>
            </div>
            <div className={styles.sectionGrid2}>
              <div className={styles.sectionCard}>
                <label className={styles.formLabel}>Hospitalisation</label>
                <div className={styles.toggleRow}>
                  <button className={`${styles.btnPill} ${treatmentDraft.hospitalised ? styles.btnPillActive : ''}`} onClick={() => setTreatmentDraft((p) => ({ ...p, hospitalised: true }))}>Hospitalised</button>
                  <button className={`${styles.btnPill} ${!treatmentDraft.hospitalised ? styles.btnPillActive : ''}`} onClick={() => setTreatmentDraft((p) => ({ ...p, hospitalised: false, hospitalName: '', hospitalAddress: '' }))}>Not Hospitalised</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className={styles.formLabel}>Place of Illness</label>
                    <input className={styles.field} value={treatmentDraft.placeOfIllness} onChange={(e) => setTreatmentDraft((p) => ({ ...p, placeOfIllness: e.target.value }))} />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Within State</label>
                    <div className={styles.toggleRow}>
                      <button className={`${styles.btnPill} ${treatmentDraft.withinState ? styles.btnPillActive : ''}`} onClick={() => setTreatmentDraft((p) => ({ ...p, withinState: true }))}>Within Kerala</button>
                      <button className={`${styles.btnPill} ${!treatmentDraft.withinState ? styles.btnPillActive : ''}`} onClick={() => setTreatmentDraft((p) => ({ ...p, withinState: false }))}>Outside Kerala</button>
                    </div>
                  </div>
                </div>
                {treatmentDraft.hospitalised && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className={styles.formLabel}>Hospital Type</label>
                      <div className={styles.toggleRow}>
                        <button className={`${styles.btnPill} ${treatmentDraft.hospitalType === 'Government' ? styles.btnPillActive : ''}`} onClick={() => setTreatmentDraft((p) => ({ ...p, hospitalType: 'Government' }))}>Government</button>
                        <button className={`${styles.btnPill} ${treatmentDraft.hospitalType === 'Private' ? styles.btnPillActive : ''}`} onClick={() => setTreatmentDraft((p) => ({ ...p, hospitalType: 'Private' }))}>Private</button>
                      </div>
                    </div>
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
                            setTreatmentDraft((p) => ({ ...p, hospitalName: value }));
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
                                  setTreatmentDraft((p) => ({ ...p, hospitalName: opt.name, hospitalAddress: opt.address }));
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
                    <div className={styles.sectionFormSpan}>
                      <label className={styles.formLabel}>Hospital Address</label>
                      <input className={styles.field} value={treatmentDraft.hospitalAddress} onChange={(e) => setTreatmentDraft((p) => ({ ...p, hospitalAddress: e.target.value }))} />
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.sectionCard}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className={styles.formLabel}>Start Date</label>
                    <input type="date" className={styles.field} value={treatmentDraft.fromDate} onChange={(e) => setTreatmentDraft((p) => ({ ...p, fromDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className={styles.formLabel}>End Date (Optional)</label>
                    <input type="date" className={styles.field} value={treatmentDraft.toDate || ''} onChange={(e) => setTreatmentDraft((p) => ({ ...p, toDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Diagnosis</label>
                    <input className={styles.field} placeholder="e.g. Viral Fever" value={treatmentDraft.diagnosis} onChange={(e) => setTreatmentDraft((p) => ({ ...p, diagnosis: e.target.value }))} />
                  </div>
                  <div>
                    <label className={styles.formLabel}>System of Medicine</label>
                    <select className={styles.field} value={treatmentDraft.medicalType} onChange={(e) => setTreatmentDraft((p) => ({ ...p, medicalType: e.target.value }))}>
                      <option value="Allopathy">Allopathy</option>
                      <option value="Ayurveda">Ayurveda</option>
                      <option value="Homeopathy">Homeopathy</option>
                      <option value="Unani">Unani</option>
                      <option value="Siddha">Siddha</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {active === 'ANNEXURES' && (
          <div className={styles.page}>
            <div className="flex gap-6 mb-6 border-b border-slate-200">
              <button
                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${sub === 'Bills' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                onClick={() => setSub('Bills')}
              >
                Bills (OCR)
              </button>
              <button
                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${sub === 'Other' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                onClick={() => setSub('Other')}
              >
                Other Documents
              </button>
            </div>
            {sub === 'Bills' ? (
              <>
                <div className={styles.sectionHeadRow}>
                  <div className={styles.sectionActions}>
                    <input ref={billUploadRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={onBillUpload} />
                    <button className={styles.btnSecondary} onClick={() => billUploadRef.current?.click()}>Upload Bill File</button>
                    <button className={styles.btnSecondary} onClick={addBill}>Add Sample Bill</button>
                  </div>
                  <div className={styles.mutedText}>Upload file, sample extraction, edit, then save.</div>
                </div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>File</th>
                        <th>Invoice No</th>
                        <th>GST No</th>
                        <th>Bill Date</th>
                        <th>Hospital</th>
                        <th>Total Amount</th>
                        <th>Tax</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.bills.length === 0 && (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-500">
                            No bills uploaded yet. Upload a bill or add a sample.
                          </td>
                        </tr>
                      )}
                      {c.bills.map((b) => (
                        <React.Fragment key={b.id}>
                          {billEditId === b.id && billDraft ? (
                            <tr>
                              <td colSpan={9} className="p-4 bg-slate-50 border-y border-slate-200">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                  <div className="md:col-span-2"><label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">File Name</label><input className={`${styles.field} !py-1.5 !text-sm`} value={billDraft.fileName} onChange={(e) => setBillDraft({ ...billDraft, fileName: e.target.value })} /></div>
                                  <div className="md:col-span-2"><label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Hospital / Vendor</label><input className={`${styles.field} !py-1.5 !text-sm`} value={billDraft.hospitalName} onChange={(e) => setBillDraft({ ...billDraft, hospitalName: e.target.value })} /></div>
                                  <div><label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Invoice No</label><input className={`${styles.field} !py-1.5 !text-sm`} value={billDraft.invoiceNo} onChange={(e) => setBillDraft({ ...billDraft, invoiceNo: e.target.value })} /></div>
                                  <div><label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">GST No</label><input className={`${styles.field} !py-1.5 !text-sm`} value={billDraft.gstNo} onChange={(e) => setBillDraft({ ...billDraft, gstNo: e.target.value })} /></div>
                                  <div><label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Bill Date</label><input type="date" className={`${styles.field} !py-1.5 !text-sm`} value={billDraft.billDate} onChange={(e) => setBillDraft({ ...billDraft, billDate: e.target.value })} /></div>
                                  <div><label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Total Amount (₹)</label><input className={`${styles.field} !py-1.5 !text-sm font-semibold`} value={String(billDraft.totalAmount)} onChange={(e) => setBillDraft({ ...billDraft, totalAmount: parseAmount(e.target.value) })} /></div>
                                </div>
                                <div className="flex gap-3 justify-end mt-4">
                                  <button className={`${styles.btnSecondary} !py-1 !px-4`} onClick={() => { setBillEditId(''); setBillDraft(null); }}>Cancel</button>
                                  <button className={`${styles.btnPrimary} !py-1 !px-4`} onClick={saveBillEdit}>Save Details</button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="font-medium text-slate-700 truncate max-w-[150px]" title={b.fileName}>{b.fileName}</td>
                              <td>{b.invoiceNo}</td>
                              <td>{b.gstNo}</td>
                              <td>{b.billDate ? formatDMY(b.billDate) : '-'}</td>
                              <td className="truncate max-w-[150px]" title={b.hospitalName}>{b.hospitalName}</td>
                              <td className="font-semibold">{rupee(b.totalAmount)}</td>
                              <td>{rupee(b.taxAmount)}</td>
                              <td>
                                {b.duplicateFlag ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full ring-1 ring-inset ring-red-600/20">Duplicate</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full ring-1 ring-inset ring-green-600/20">{b.status}</span>
                                )}
                              </td>
                              <td>
                                <div className="flex items-center gap-3">
                                  <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors" onClick={() => startBillEdit(b)}>Edit</button>
                                  <button className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors" onClick={() => updateCase({ ...c, bills: c.bills.filter((x) => x.id !== b.id) }, 'Bill removed')}>Delete</button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                <div className="mb-2 flex gap-2 flex-wrap">
                  {docTypes.map((d) => <button key={d.value} className={`${styles.btnPill} ${docType === d.value ? styles.btnPillActive : ''}`} onClick={() => setDocType(d.value)}>{d.label}</button>)}
                  <input ref={docUploadRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={onDocUpload} />
                  <button className={styles.btnSecondary} onClick={() => docUploadRef.current?.click()}>Upload File</button>
                  <button className={styles.btnSecondary} onClick={addDoc}>Add Sample</button>
                </div>
                {!c.docs.some((d) => d.type === 'DISCHARGE') && <div className="text-red-600 text-sm mb-2">Required: Discharge Summary missing</div>}
                <div className="grid md:grid-cols-2 gap-2">
                  {c.docs.map((d) => (
                    <div key={d.id} className="border rounded p-3 bg-white">
                      <div className={styles.labelText}>{d.type}</div>
                      <div className={styles.bodyText}>{d.fileName}</div>
                      <div className={styles.mutedText}>{d.uploadedAt}</div>
                      <div className="text-sm text-indigo-700">View / Download</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {active === 'ADVANCE NOTES' && (
          <div className={styles.page}>
            <div className={styles.sectionHeadRow}>
              <button className={`${styles.btnSecondary}`} onClick={() => { setAdvanceFormOpen((v) => !v); setAdvancePreview(false); }}>{advanceFormOpen ? 'Close Request Form' : 'New Advance Request'}</button>
            </div>
            {!advanceFormOpen && c.advances.length === 0 && (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-lg">
                <IndianRupee className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-slate-900 mb-1">No advance requests</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">If you need an advance payment before final claim settlement, you can request one by uploading a cost estimate.</p>
              </div>
            )}
            {advanceFormOpen && (
              <div className={styles.advanceWrap}>
                <div className={styles.advanceFormGrid}>
                  <div className={styles.sectionCard}>
                    <label className={styles.formLabel}>Estimate Document</label>
                    <input ref={estimateUploadRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setEstimateFileName(e.target.files?.[0]?.name || '')} />
                    <div className={styles.sectionActions}>
                      <button className={styles.btnSecondary} onClick={() => estimateUploadRef.current?.click()}>Upload Estimate</button>
                      <span className={styles.mutedText}>{estimateFileName || 'No file selected'}</span>
                    </div>
                    <label className={styles.formLabel}>Advance Amount</label>
                    <input className={styles.field} placeholder="Enter amount" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} />
                    <div className={styles.sectionActions}>
                      <button className={styles.btnSecondary} onClick={() => setAdvancePreview(true)} disabled={!advanceAmount || !estimateFileName}>Preview</button>
                      <button className={styles.btnPrimary} onClick={submitAdvanceRequest} disabled={!advancePreview || !advanceAmount || !estimateFileName}>Submit Request</button>
                    </div>
                  </div>
                  <div className={styles.sectionCard}>
                    <div className={styles.summaryHead}>Advance Preview</div>
                    {advancePreview ? (
                      <div className={styles.summaryKVs}>
                        <div className={styles.summaryLabel}>Case</div><div className={styles.summaryValue}>{c.mrNo}</div>
                        <div className={styles.summaryLabel}>Officer</div><div className={styles.summaryValue}>{c.officer.fullName} | PEN {c.officer.penNumber}</div>
                        <div className={styles.summaryLabel}>Patient</div><div className={styles.summaryValue}>{c.patient.name} ({c.patient.relation})</div>
                        <div className={styles.summaryLabel}>Hospital</div><div className={styles.summaryValue}>{c.treatment.hospitalName || '-'}</div>
                        <div className={styles.summaryLabel}>Estimate File</div><div className={styles.summaryValue}>{estimateFileName}</div>
                        <div className={styles.summaryLabel}>Requested Amount</div><div className={styles.summaryValue}>{rupee(parseAmount(advanceAmount))}</div>
                      </div>
                    ) : (
                      <div className={styles.mutedText}>Fill estimate + amount and click Preview.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {c.advances.map((a) => (
                <div key={a.advId} className="border rounded p-3 bg-white">
                  <div className="flex justify-between gap-2 flex-wrap">
                    <div>
                      <div className={styles.labelText}>{a.advNo}</div>
                      <div className={styles.bodyText}>Amount {rupee(a.amount)} | {a.status} | eSign {a.signed ? 'Yes' : 'No'}</div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button className={styles.btnSecondary} onClick={() => { setActiveMrId(c.mrId); setActiveAdvanceId(a.advId); router.push(`/reimbursement/medical/${STATIC_MR_ROUTE_PARAM}/advance/${STATIC_ADV_ROUTE_PARAM}/preview`); }}>View Preview</button>
                      <button className={styles.btnSecondary}>Download</button>
                      <button className={styles.btnSecondary} onClick={() => updateCase({ ...c, advances: c.advances.map((x) => x.advId === a.advId ? { ...x, status: 'Paid' as const } : x), status: 'Advance Paid' }, 'Saved')}>Mark Paid</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {active === 'CERTIFICATE' && (
          <div className={styles.page}>
            <div className={styles.sectionHeadRow}>
              <div className={styles.sectionActions}>
                <button className={styles.btnPrimary} onClick={downloadEssentialityCertificate}>Download Essentiality Certificate</button>
                <input ref={ecSignedUploadRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={onSignedEcUpload} />
                <button className={styles.btnSecondary} onClick={() => ecSignedUploadRef.current?.click()}>Upload Signed EC</button>
              </div>
            </div>
            <div className={styles.sectionGrid2}>
              <div className={styles.sectionCard}>
                <div className={styles.summaryHead}>Certificate Details</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className={styles.formLabel}>Authorized Medical Attendant</label>
                    <input className={styles.field} value={ecMeta.amaName} onChange={(e) => setEcMeta((p) => ({ ...p, amaName: e.target.value }))} />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Designation</label>
                    <input className={styles.field} value={ecMeta.amaDesignation} onChange={(e) => setEcMeta((p) => ({ ...p, amaDesignation: e.target.value }))} />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Medical Registration No.</label>
                    <input className={styles.field} value={ecMeta.regNo} onChange={(e) => setEcMeta((p) => ({ ...p, regNo: e.target.value }))} />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Date of Certificate</label>
                    <input type="date" className={styles.field} value={ecMeta.certificateDate} onChange={(e) => setEcMeta((p) => ({ ...p, certificateDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Hospital / Institution</label>
                    <input className={styles.field} value={ecMeta.institutionName} onChange={(e) => setEcMeta((p) => ({ ...p, institutionName: e.target.value }))} />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Signature Name</label>
                    <input className={styles.field} value={ecMeta.signatureName} onChange={(e) => setEcMeta((p) => ({ ...p, signatureName: e.target.value }))} />
                  </div>
                  <div className={styles.sectionFormSpan}>
                    <label className={styles.formLabel}>Institution Address</label>
                    <input className={styles.field} value={ecMeta.institutionAddress} onChange={(e) => setEcMeta((p) => ({ ...p, institutionAddress: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className={styles.sectionCard}>
                <div className={styles.summaryHead}>Auto-fill Summary</div>
                <div className={styles.summaryKVs}>
                  <div className={styles.summaryLabel}>Officer</div><div className={styles.summaryValue}>{c.officer.fullName} ({c.officer.serviceType})</div>
                  <div className={styles.summaryLabel}>Designation</div><div className={styles.summaryValue}>{c.officer.designation}</div>
                  <div className={styles.summaryLabel}>Treatment Period</div><div className={styles.summaryValue}>{c.treatment.fromDate} - {c.treatment.toDate || '-'}</div>
                  <div className={styles.summaryLabel}>Condition</div><div className={styles.summaryValue}>{c.treatment.diagnosis || '-'}</div>
                  <div className={styles.summaryLabel}>Hospitalisation</div><div className={styles.summaryValue}>{c.treatment.hospitalised ? 'Required hospitalization' : 'Did not require hospitalization'}</div>
                  <div className={styles.summaryLabel}>Total Bills</div><div className={styles.summaryValue}>{rupee(billsTotal(c))}</div>
                </div>
              </div>
            </div>
            <div className="border p-3 bg-white rounded mt-2">
              <h4 className={styles.labelText}>Statement of Medicines / Investigations</h4>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>SlNo</th>
                      <th>Bill No & Date</th>
                      <th>Medicine</th>
                      <th>Chemical</th>
                      <th>Qty</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.bills.map((b, i) => (
                      <tr key={b.id}>
                        <td>{i + 1}</td>
                        <td>{b.invoiceNo} {b.billDate}</td>
                        <td>{b.fileName}</td>
                        <td>-</td>
                        <td>-</td>
                        <td>{b.totalAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={`${styles.bodyText} mt-2`}>Total Amount {rupee(billsTotal(c))} | Signed EC uploaded: {c.docs.some((d) => d.type === 'EC_SIGNED') ? 'Yes' : 'No'}</div>
            </div>
          </div>
        )}

        {active === 'FINAL NOTE' && (
          <div className={styles.page}>
            <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-2xl">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-indigo-600" /> Final Claim Submission
              </h3>

              <div className="mb-6 p-4 rounded-md bg-slate-50 border border-slate-100">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Claim Overview</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Total Bills</div>
                    <div className="text-base font-semibold text-slate-900">{rupee(billsTotal(c))}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Advance Received</div>
                    <div className="text-base font-medium text-slate-700">{rupee(advancePaid(c))}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Net Payable Claim</div>
                    <div className="text-lg font-bold text-green-700">{rupee(billsTotal(c) - advancePaid(c))}</div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Pre-submission Checklist</h4>
                {checks.length > 0 ? (
                  <ul className="space-y-2 mb-4">
                    {checks.map((m) => (
                      <li key={m} className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
                        <span className="shrink-0 mt-0.5">•</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded border border-green-200 mb-4">
                    <ClipboardCheck className="w-4 h-4" />
                    <span>All required documents and details are complete. Ready for final review.</span>
                  </div>
                )}
              </div>

              <div className="mb-6">
                 <label className="block text-sm font-medium text-slate-700 mb-1">Select Approving Medical Authority (AMA)</label>
                 <select className={styles.field}>
                   <option value="">-- Select Authority --</option>
                   <option value="AMA-01">Director of Health Services</option>
                   <option value="AMA-02">District Medical Officer</option>
                 </select>
                 <p className="mt-1 text-xs text-slate-500">Required for routing the claim for final administrative approval.</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button className={`${styles.btnPrimary} w-full justify-center`} disabled={checks.length > 0} onClick={openFinalPreview}>
                  {checks.length > 0 ? 'Fix missing items to Preview' : 'Preview Final Claim Document'}
                </button>
              </div>
            </div>
          </div>
        )}

        {active === 'MOVEMENT REGISTER' && (
          <div className={styles.page}>
            {c.movement.map((m, i) => (
              <div key={m.id} className={styles.ledgerRow}>
                <div className={styles.bodyText}>{i + 1}. {m.action}</div>
                <div className={styles.bodyText}>{new Date(m.at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}

        {toast && <div className="fixed right-5 bottom-5 bg-indigo-600 text-white px-4 py-2 rounded shadow-lg">{toast}</div>}
      </div>
    </div>
    </div>
    </div>
    </div>
  );
}
