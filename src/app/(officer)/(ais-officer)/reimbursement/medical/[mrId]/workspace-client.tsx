'use client';

import React, { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, AlertTriangle, Briefcase, CalendarDays, CheckCircle, ChevronLeft, ChevronRight, ClipboardCheck, FileText, IndianRupee, Pill, Stethoscope, Upload, UserCircle2, Save, History, Download, FileCheck } from 'lucide-react';
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
  const selectedDependent = c.patient.claimFor === 'DEPENDENT'
    ? c.officer.dependents.find((d) => d.personId === c.patient.dependentPersonId)
    : undefined;
  const formatDMY = (v?: string) => {
    if (!v) return '-';
    const [y, m, d] = v.slice(0, 10).split('-');
    if (!y || !m || !d) return v;
    return `${d}-${m}-${y}`;
  };

  const tabMeta: Record<string, { icon: typeof Activity; caption: string }> = {
    SUMMARY: { icon: UserCircle2, caption: 'Case overview' },
    'TREATMENT NOTE': { icon: Stethoscope, caption: 'Treatment details' },
    ANNEXURES: { icon: FileText, caption: 'Bills and documents' },
    'ADVANCE NOTES': { icon: IndianRupee, caption: 'Advance request' },
    CERTIFICATE: { icon: Pill, caption: 'Essentiality certificate' },
    'FINAL NOTE': { icon: ClipboardCheck, caption: 'Final note' },
    'MOVEMENT REGISTER': { icon: Activity, caption: 'Case movement' },
  };
  const workflowTabs = ['SUMMARY', 'TREATMENT NOTE', 'ANNEXURES', 'ADVANCE NOTES', 'CERTIFICATE', 'FINAL NOTE', 'MOVEMENT REGISTER'];
  const activeStepIndex = workflowTabs.indexOf(active);
  const previousStep = activeStepIndex > 0 ? workflowTabs[activeStepIndex - 1] : null;
  const nextStep = activeStepIndex < workflowTabs.length - 1 ? workflowTabs[activeStepIndex + 1] : null;
  const unreadinessCount = checks.length;

  const goToStep = (step: string | null) => {
    if (!step) return;
    setActive(step);
  };

  const saveDraftOnly = () => {
    updateCase({ ...c, lastUpdated: new Date().toISOString() }, 'Draft saved');
  };

  const readinessLinks = checks.map((issue) => {
    const upper = issue.toUpperCase();
    if (upper.includes('DISCHARGE') || upper.includes('BILL') || upper.includes('GST')) return { issue, step: 'ANNEXURES' };
    if (upper.includes('ADVANCE')) return { issue, step: 'ADVANCE NOTES' };
    if (upper.includes('CERTIFICATE') || upper.includes('EC')) return { issue, step: 'CERTIFICATE' };
    if (upper.includes('TREATMENT') || upper.includes('HOSPITAL') || upper.includes('DATE')) return { issue, step: 'TREATMENT NOTE' };
    return { issue, step: 'FINAL NOTE' };
  });
  const officerInitial = c.officer.fullName.trim().charAt(0).toUpperCase() || 'O';

  return (
    <div className={styles.modernContainer}>
      {toast && <div className={styles.mrToast}>{toast}</div>}
      <div className={styles.modernHeader}>
        <div>
          <h1 className={styles.modernHeaderTitle}>Medical Reimbursement Application</h1>
          <div className={styles.modernHeaderSubtitle}>Workspace for {c.mrNo}</div>
        </div>
        <div>
          <span className={styles.modernBadgeInfo}>{c.status}</span>
        </div>
      </div>

      <div className={styles.modernTabs}>
        {workflowTabs.map(tab => (
          <div
            key={tab}
            className={`${styles.modernTab} ${active === tab ? styles.modernTabActive : ''}`}
            onClick={() => goToStep(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '2rem' }}>

        {billEditId && billDraft && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className={styles.modernCard} style={{ width: '500px', maxWidth: '90%' }}>
              <div className={styles.modernCardHeader}><h3 className={styles.modernCardTitle}>Preview / Edit Bill Details</h3></div>
              <div className={styles.modernGrid2}>
                <div className={styles.modernFormGroup}>
                  <label className={styles.modernLabel}>Invoice No</label>
                  <input className={styles.modernInput} value={billDraft.invoiceNo} onChange={(e) => setBillDraft({ ...billDraft, invoiceNo: e.target.value })} />
                </div>
                <div className={styles.modernFormGroup}>
                  <label className={styles.modernLabel}>Amount (₹)</label>
                  <input type="number" className={styles.modernInput} value={billDraft.totalAmount} onChange={(e) => setBillDraft({ ...billDraft, totalAmount: Number(e.target.value) || 0 })} />
                </div>
              </div>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className={styles.modernBtnSecondary} onClick={() => { setBillEditId(''); setBillDraft(null); }}>Cancel</button>
                <button className={styles.modernBtnPrimary} onClick={saveBillEdit}>Save Bill</button>
              </div>
            </div>
          </div>
        )}

        {active === 'SUMMARY' && (
          <div className={`${styles.modernCard} ${styles.animateFadeIn}`}>
            <div className={styles.modernCardHeader}>
              <Activity className="text-blue-500" size={24} />
              <h3 className={styles.modernCardTitle}>Application Summary</h3>
            </div>
            <div className={styles.modernGrid3}>
              <div className={styles.modernFormGroup}>
                <span className={styles.modernLabel}>Applicant Name</span>
                <span className={styles.modernValue}>{c.officer.fullName}</span>
              </div>
              <div className={styles.modernFormGroup}>
                <span className={styles.modernLabel}>Designation</span>
                <span className={styles.modernValue}>{c.officer.designation}</span>
              </div>
              <div className={styles.modernFormGroup}>
                <span className={styles.modernLabel}>MR Number</span>
                <span className={styles.modernValue}>{c.mrNo}</span>
              </div>
              <div className={styles.modernFormGroup}>
                <span className={styles.modernLabel}>Created On</span>
                <span className={styles.modernValue}>{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <div className={styles.modernFormGroup}>
                <span className={styles.modernLabel}>Total Claim</span>
                <span className={styles.modernValue}>₹{(c.bills.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0) || 0).toLocaleString()}</span>
              </div>
              <div className={styles.modernFormGroup}>
                <span className={styles.modernLabel}>Total Advance Requested</span>
                <span className={styles.modernValue}>₹{(c.advances.reduce((acc, a) => acc + (Number(a.amount) || 0), 0) || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}


        {active === 'TREATMENT NOTE' && (
          <div className={`${styles.modernCard} ${styles.animateFadeIn}`}>
            <div className={styles.modernCardHeader}>
              <Stethoscope className="text-blue-500" size={24} />
              <h3 className={styles.modernCardTitle}>Treatment Details</h3>
            </div>

            <div className={styles.modernGrid2}>
              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>Diagnosis</label>
                <input
                  className={styles.modernInput}
                  value={treatmentDraft.diagnosis.split(' | ')[0] || ''}
                  onChange={(e) => setTreatmentDraft({ ...treatmentDraft, diagnosis: e.target.value })}
                  placeholder="e.g. Viral Fever"
                />
              </div>
              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>Medical Type</label>
                <select
                  className={styles.modernSelect}
                  value={treatmentDraft.medicalType || 'Allopathy'}
                  onChange={(e) => setTreatmentDraft({ ...treatmentDraft, medicalType: e.target.value })}
                >
                  <option>Allopathy</option>
                  <option>Ayurveda</option>
                  <option>Homeopathy</option>
                </select>
              </div>

              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>Place of Illness</label>
                <input
                  className={styles.modernInput}
                  value={treatmentDraft.placeOfIllness}
                  onChange={(e) => setTreatmentDraft({ ...treatmentDraft, placeOfIllness: e.target.value })}
                  placeholder="Place of Illness"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className={styles.modernLabel}>Hospitalised?</label>
                  <select
                    className={styles.modernSelect}
                    value={treatmentDraft.hospitalised ? 'Yes' : 'No'}
                    onChange={(e) => setTreatmentDraft({ ...treatmentDraft, hospitalised: e.target.value === 'Yes' })}
                  >
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className={styles.modernLabel}>Within State?</label>
                  <select
                    className={styles.modernSelect}
                    value={treatmentDraft.withinState ? 'Yes' : 'No'}
                    onChange={(e) => setTreatmentDraft({ ...treatmentDraft, withinState: e.target.value === 'Yes' })}
                  >
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>
              </div>

              {treatmentDraft.hospitalised && (
                <>
                  <div className={styles.modernFormGroup}>
                    <label className={styles.modernLabel}>Hospital Type</label>
                    <select
                      className={styles.modernSelect}
                      value={treatmentDraft.hospitalType}
                      onChange={(e) => setTreatmentDraft({ ...treatmentDraft, hospitalType: e.target.value })}
                    >
                      <option>Government</option>
                      <option>Private</option>
                    </select>
                  </div>

                  <div className={styles.modernFormGroup}>
                    <label className={styles.modernLabel}>Hospital Name</label>
                    <input
                      className={styles.modernInput}
                      value={treatmentDraft.hospitalName}
                      onChange={(e) => setTreatmentDraft({ ...treatmentDraft, hospitalName: e.target.value })}
                      placeholder="Enter Hospital Name"
                    />
                  </div>

                  <div className={styles.modernFormGroup}>
                    <label className={styles.modernLabel}>Hospital Address</label>
                    <input
                      className={styles.modernInput}
                      value={treatmentDraft.hospitalAddress}
                      onChange={(e) => setTreatmentDraft({ ...treatmentDraft, hospitalAddress: e.target.value })}
                      placeholder="Enter Hospital Address"
                    />
                  </div>
                </>
              )}

              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>Treatment Start Date</label>
                <input
                  type="date"
                  className={styles.modernInput}
                  value={treatmentDraft.fromDate}
                  onChange={(e) => setTreatmentDraft({ ...treatmentDraft, fromDate: e.target.value })}
                />
              </div>
              <div className={styles.modernFormGroup}>
                <label className={styles.modernLabel}>Treatment End Date</label>
                <input
                  type="date"
                  className={styles.modernInput}
                  value={treatmentDraft.toDate}
                  onChange={(e) => setTreatmentDraft({ ...treatmentDraft, toDate: e.target.value })}
                />
              </div>

            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button className={styles.modernBtnPrimary} onClick={() => {
                updateCase({
                  ...c,
                  treatment: {
                    ...c.treatment,
                    diagnosis: `${treatmentDraft.diagnosis} | ${treatmentDraft.medicalType}`,
                    hospitalised: treatmentDraft.hospitalised,
                    hospitalName: treatmentDraft.hospitalName,
                    hospitalAddress: treatmentDraft.hospitalAddress,
                    hospitalType: treatmentDraft.hospitalType,
                    fromDate: treatmentDraft.fromDate,
                    toDate: treatmentDraft.toDate,
                    placeOfIllness: treatmentDraft.placeOfIllness,
                    withinState: treatmentDraft.withinState,
                  }
                }, 'Treatment details saved');
              }}>
                <Save size={18} className="mr-2" />
                Save Treatment Details
              </button>
            </div>
          </div>
        )}


        {active === 'ANNEXURES' && (
          <div className={`${styles.modernCard} ${styles.animateFadeIn}`}>
             <div className={styles.modernCardHeader} style={{ justifyContent: 'space-between' }}>
               <div style={{ display: 'flex', alignItems: 'center' }}>
                 <FileText className="text-blue-500" size={24} />
                 <h3 className={styles.modernCardTitle}>Annexures & Bills</h3>
               </div>
               <div style={{ display: 'flex', gap: '12px' }}>
                 <select className={styles.modernSelect} value={docType} onChange={e => setDocType(e.target.value as DocType)} style={{ width: 'auto' }}>
                    <option value="OP Ticket">OP Ticket</option>
                    <option value="Discharge Summary">Discharge Summary</option>
                    <option value="Medical Report">Medical Report</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Other">Other</option>
                 </select>
                 <button className={styles.modernBtnSecondary} onClick={() => docUploadRef.current?.click()}>
                   <Upload size={18} /> Upload Doc
                 </button>
                 <button className={styles.modernBtnPrimary} onClick={() => billUploadRef.current?.click()}>
                   <Upload size={18} /> Upload Bill
                 </button>
               </div>
             </div>
             <input type="file" ref={billUploadRef} style={{ display: 'none' }} accept=".pdf,.jpg,.png" onChange={onBillUpload} />
             <input type="file" ref={docUploadRef} style={{ display: 'none' }} accept=".pdf,.jpg,.png" onChange={onDocUpload} />

             {c.bills.length === 0 && c.docs.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>No bills or documents uploaded yet.</div>
             ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                 {c.bills.length > 0 && (
                   <div>
                     <h4 className={styles.modernLabel} style={{ marginBottom: '12px' }}>Bills</h4>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                       {c.bills.map((b) => (
                         <div key={b.id} className={styles.modernStatCard} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div className={styles.modernValue}>{b.invoiceNo}</div>
                                <div className={styles.modernLabel}>File: {b.fileName}</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div className={styles.modernStatValue} style={{ fontSize: '1.25rem' }}>₹{b.totalAmount}</div>
                                <button className={styles.modernBtnSecondary} onClick={() => startBillEdit(b)}>Edit</button>
                                <button className={styles.modernBtnDanger} onClick={() => updateCase({ ...c, bills: c.bills.filter(x => x.id !== b.id) }, 'Bill deleted')}>Delete</button>
                              </div>
                            </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {c.docs.filter(d => d.type !== 'EC_SIGNED').length > 0 && (
                   <div>
                     <h4 className={styles.modernLabel} style={{ marginBottom: '12px' }}>Other Documents</h4>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                       {c.docs.filter(d => d.type !== 'EC_SIGNED').map((d) => (
                         <div key={d.id} className={styles.modernStatCard} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div className={styles.modernValue}>{d.type}</div>
                              <div className={styles.modernLabel}>File: {d.fileName}</div>
                            </div>
                            <button className={styles.modernBtnDanger} onClick={() => updateCase({ ...c, docs: c.docs.filter(x => x.id !== d.id) }, 'Doc deleted')}>Delete</button>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

               </div>
             )}
          </div>
        )}

        {active === 'ADVANCE NOTES' && (
           <div className={`${styles.modernCard} ${styles.animateFadeIn}`}>
             <div className={styles.modernCardHeader} style={{ justifyContent: 'space-between' }}>
               <div style={{ display: 'flex', alignItems: 'center' }}>
                 <IndianRupee className="text-blue-500" size={24} />
                 <h3 className={styles.modernCardTitle}>Advances</h3>
               </div>
               <button className={styles.modernBtnSecondary} onClick={() => setAdvanceFormOpen(!advanceFormOpen)}>
                 {advanceFormOpen ? 'Cancel Request' : 'Request Advance'}
               </button>
             </div>

             {advanceFormOpen && (
               <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                 <div className={styles.modernGrid2}>
                   <div className={styles.modernFormGroup}>
                     <label className={styles.modernLabel}>Advance Amount (₹)</label>
                     <input type="number" className={styles.modernInput} value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} />
                   </div>
                   <div className={styles.modernFormGroup}>
                     <label className={styles.modernLabel}>Estimate Document</label>
                     <div style={{ display: 'flex', gap: '8px' }}>
                       <input type="file" ref={estimateUploadRef} style={{ display: 'none' }} onChange={(e) => {
                         if (e.target.files?.[0]) {
                           setEstimateFileName(e.target.files[0].name);
                           setToast('Estimate document attached');
                           setTimeout(() => setToast(''), 2000);
                         }
                       }} />
                       <button className={styles.modernBtnSecondary} onClick={() => estimateUploadRef.current?.click()} style={{ flex: 1 }}>
                         <Upload size={16} /> {estimateFileName || 'Upload Estimate'}
                       </button>
                     </div>
                   </div>
                 </div>
                 <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                   <button className={styles.modernBtnPrimary} onClick={submitAdvanceRequest} disabled={!advanceAmount || !estimateFileName}>
                     Submit Advance Request
                   </button>
                 </div>
               </div>
             )}

             {c.advances.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>No advance requests made.</div>
             ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {c.advances.map(a => (
                   <div key={a.advId} className={styles.modernStatCard} style={{ justifyContent: 'space-between' }}>
                     <div>
                       <div className={styles.modernValue}>₹{a.amount.toLocaleString()}</div>
                       <div className={styles.modernLabel}>Status: <span className={styles.modernBadgeInfo}>{a.status}</span></div>
                     </div>
                     <div className={styles.modernLabel}>Requested on {new Date(a.submittedAt || new Date()).toLocaleDateString()}</div>
                   </div>
                 ))}
               </div>
             )}
           </div>
        )}

        {active === 'CERTIFICATE' && (
          <div className={`${styles.modernCard} ${styles.animateFadeIn}`}>
             <div className={styles.modernCardHeader} style={{ justifyContent: 'space-between' }}>
               <div style={{ display: 'flex', alignItems: 'center' }}>
                 <FileCheck className="text-blue-500" size={24} />
                 <h3 className={styles.modernCardTitle}>Essentiality Certificate</h3>
               </div>
             </div>

             <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
               <button className={styles.modernBtnSecondary} onClick={downloadEssentialityCertificate}>
                 <Download size={18} /> Download Generated EC
               </button>
               <div>
                 <input type="file" ref={ecSignedUploadRef} style={{ display: 'none' }} accept=".pdf,.jpg,.png" onChange={onSignedEcUpload} />
                 <button className={styles.modernBtnPrimary} onClick={() => ecSignedUploadRef.current?.click()}>
                   <Upload size={18} /> Upload Signed EC
                 </button>
               </div>
             </div>

             {c.docs.filter(d => d.type === 'EC_SIGNED').length > 0 && (
                <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0', color: '#15803d', fontWeight: 500 }}>
                  Signed Essentiality Certificate is uploaded and verified.
                </div>
             )}
          </div>
        )}

        {active === 'FINAL NOTE' && (
          <div className={styles.mrStagePanel}>
            <div className={styles.mrStageHeader}>
              <div>
                <div className={styles.mrSectionEyebrow}>Final Documentation</div>
                <h3 className={styles.mrSectionTitle}>Final Note</h3>
              </div>
            </div>
            <div className={styles.mrA4Preview}>
              <div className={styles.mrA4Header}>
                <h2>Final Claim Submission Note</h2>
                <div className={styles.mrA4Meta}>
                  <div><strong>MR Number:</strong> {c.mrNo}</div>
                  <div><strong>Officer:</strong> {c.officer.fullName}</div>
                </div>
              </div>
              <div className={styles.mrA4Body}>
                <p><strong>1. Applicant Details:</strong> {c.officer.fullName}, {c.officer.designation}</p>
                <p><strong>2. Treatment Details:</strong> Patient was {treatmentDraft.hospitalised ? 'hospitalised' : 'treated as outpatient'} for {treatmentDraft.diagnosis.split(' | ')[0] || 'Medical treatment'} at {treatmentDraft.hospitalName || 'the facility'}.</p>
                <p><strong>3. Claim Amount:</strong> ₹{(c.bills.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0) || 0).toLocaleString()}</p>
                <p><strong>4. Advance Taken:</strong> ₹{(c.advances.reduce((acc, a) => acc + (Number(a.amount) || 0), 0) || 0).toLocaleString()}</p>
                <p><strong>5. Net Payable:</strong> ₹{((c.bills.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0) || 0) - (c.advances.reduce((acc, a) => acc + (Number(a.amount) || 0), 0) || 0)).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {active === 'MOVEMENT REGISTER' && (
          <div className={`${styles.modernCard} ${styles.animateFadeIn}`}>
             <div className={styles.modernCardHeader}>
               <History className="text-blue-500" size={24} />
               <h3 className={styles.modernCardTitle}>Movement Register</h3>
             </div>

             {c.movement.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>No movements recorded yet.</div>
             ) : (
               <div className={styles.modernTimeline}>
                 {c.movement.map((m, idx) => (
                   <div key={m.id} className={`${styles.modernTimelineItem} ${styles.animateSlideUp}`} style={{ animationDelay: `${idx * 0.05}s` }}>
                     <div className={styles.modernTimelineDot} />
                     <div className={styles.modernTimelineContent} style={{ marginLeft: '16px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                         <div style={{ fontWeight: 700, fontSize: '15px' }} className={styles.modernValue}>{m.action}</div>
                         <div style={{ fontSize: '12px', fontWeight: 600 }} className={styles.modernLabel}>{new Date(m.at).toLocaleString()}</div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

      </div>

      <div className={styles.mrStepNavigator}>
        <button className={styles.modernBtnSecondary} onClick={() => goToStep(previousStep)} disabled={!previousStep}>
          <ChevronLeft className={styles.tabIcon} size={18} />
          Previous
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontWeight: 500 }}>
          <CalendarDays size={18} />
          <span>Step {activeStepIndex + 1} of {workflowTabs.length}</span>
        </div>
        <button className={styles.modernBtnSecondary} onClick={() => goToStep(nextStep)} disabled={!nextStep}>
          Next
          <ChevronRight className={styles.tabIcon} size={18} />
        </button>
      </div>

      <div className={styles.mrStickyActionBar}>
        <div className={styles.mrStickyActionStatus}>
          <span style={{ fontWeight: 600 }}>{unreadinessCount > 0 ? `${unreadinessCount} issue(s) pending` : 'Ready for submission'}</span>
          <small style={{ display: 'block', color: '#94a3b8' }}>{active}</small>
        </div>
        <div className={styles.mrStickyActionButtons} style={{ display: 'flex', gap: '12px' }}>
          <button className={styles.modernBtnSecondary} onClick={saveDraftOnly}>Save Draft</button>
          <button disabled={checks.length > 0} className={styles.modernBtnPrimary} title={checks.map((c: any) => typeof c === 'string' ? c : c.msg).join(', ')} onClick={openFinalPreview}>
            {checks.length > 0 ? 'Resolve Issues' : 'Submit Final Claim'}
          </button>
        </div>
      </div>
    </div>
  );
}
