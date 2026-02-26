'use client';

import type { Advance, Bill, Doc, MRCase, MRCaseStatus, OfficerProfileVM } from './types';

const KEY = 'mr_cases_v2';

const now = () => new Date().toISOString();

const statuses: MRCaseStatus[] = ['Draft', 'Draft', 'Advance Submitted', 'Advance Paid', 'Active', 'Final Submitted', 'Approved', 'Paid & Closed'];

const mkBills = (idx: number): Bill[] => idx < 2 ? [] : [{
  id: crypto.randomUUID(), fileName: `bill-${idx + 1}.pdf`, invoiceNo: `INV-${100 + idx}`, gstNo: `GSTAA00${idx}`, billDate: '2026-01-12', hospitalName: 'City Medical Centre', totalAmount: 13500 + idx * 2500, taxAmount: 430 + idx * 30, status: 'Extracted', duplicateFlag: false,
}];

const mkDocs = (idx: number): Doc[] => {
  const docs: Doc[] = [];
  if (idx >= 2) docs.push({ id: crypto.randomUUID(), type: 'ESTIMATE', fileName: 'estimate.pdf', uploadedAt: now() });
  if (idx >= 4) docs.push({ id: crypto.randomUUID(), type: 'EC_SIGNED', fileName: 'signed-ec.pdf', uploadedAt: now() });
  if (idx >= 5) docs.push({ id: crypto.randomUUID(), type: 'DISCHARGE', fileName: 'discharge-summary.pdf', uploadedAt: now() });
  if (idx >= 7) docs.push({ id: crypto.randomUUID(), type: 'GO', fileName: 'go-order.pdf', uploadedAt: now() });
  return docs;
};

const mkAdv = (idx: number): Advance[] => {
  if (idx < 2) return [];
  const statuses = ['Submitted', 'Paid', 'Approved', 'Submitted'] as const;
  return [{ advId: crypto.randomUUID(), advNo: `ADV-MR-2026-${String(40 + idx).padStart(6, '0')}`, amount: 12000 + idx * 2000, estimateDocId: 'x', status: statuses[Math.min(idx - 2, 3)], submittedAt: now(), signed: true }];
};

export const seedCases = (officer: OfficerProfileVM): MRCase[] => statuses.map((status, idx) => {
  const mrId = crypto.randomUUID();
  const dependent = officer.dependents[idx % Math.max(1, officer.dependents.length)];
  const claimFor = idx % 2 === 0 ? 'SELF' : 'DEPENDENT';
  return {
    mrId,
    mrNo: `MR-2026-${String(120 + idx).padStart(6, '0')}`,
    createdAt: now(),
    lastUpdated: now(),
    status,
    officer,
    patient: {
      claimFor,
      dependentPersonId: claimFor === 'DEPENDENT' ? dependent?.personId : undefined,
      name: claimFor === 'SELF' ? officer.fullName : dependent?.fullName || 'Ms. Neha Arul',
      relation: claimFor === 'SELF' ? 'Self' : dependent?.relation || 'Current Spouse',
    },
    treatment: {
      placeOfIllness: idx % 2 === 0 ? 'Thiruvananthapuram' : 'Kottayam',
      hospitalised: true,
      withinState: true,
      hospitalType: idx % 3 === 0 ? 'Govt' : 'Empanelled Private',
      hospitalName: idx % 2 === 0 ? 'Medical College Hospital' : 'City Medical Centre',
      hospitalAddress: 'SH Mount, Kottayam',
      fromDate: '2026-01-10',
      toDate: '2026-01-14',
      diagnosis: 'Acute respiratory infection',
    },
    bills: mkBills(idx),
    docs: mkDocs(idx),
    advances: mkAdv(idx),
    movement: [{ id: crypto.randomUUID(), action: 'Case created', at: now() }],
    finalClaim: { amaId: 'AMA-01' },
  };
});

export const loadCases = () => {
  if (typeof window === 'undefined') return [] as MRCase[];
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
};

export const saveCases = (cases: MRCase[]) => {
  localStorage.setItem(KEY, JSON.stringify(cases));
};

export const initCases = (officer: OfficerProfileVM) => {
  const existing = loadCases();
  if (existing.length) return existing;
  const seeded = seedCases(officer);
  saveCases(seeded);
  return seeded;
};

export const upsertCase = (updated: MRCase) => {
  const next = loadCases().map((c) => c.mrId === updated.mrId ? updated : c);
  saveCases(next);
  return next;
};

export const createCase = (officer: OfficerProfileVM, payload: Partial<MRCase>): MRCase => {
  const id = crypto.randomUUID();
  const caseData: MRCase = {
    mrId: id,
    mrNo: `MR-2026-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
    createdAt: now(),
    lastUpdated: now(),
    status: 'Draft',
    officer,
    patient: payload.patient as any,
    treatment: payload.treatment as any,
    bills: [],
    docs: [],
    advances: [],
    movement: [{ id: crypto.randomUUID(), action: 'Case created', at: now() }],
    finalClaim: { amaId: 'AMA-01' },
  };
  const next = [caseData, ...loadCases()];
  saveCases(next);
  return caseData;
};
