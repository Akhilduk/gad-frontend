import type { MRCase, OfficerProfileVM } from './mr-types';

const KEY = 'mr_casebook_store_v2';

const now = () => new Date().toISOString();

const mk = (n: number) => String(n).padStart(6, '0');

export const makeMrNo = () => `MR-2026-${mk(Math.floor(Math.random() * 999999))}`;
export const makeAdvNo = () => `ADV-MR-2026-${mk(Math.floor(Math.random() * 999999))}`;

export function seedCases(profile: OfficerProfileVM): MRCase[] {
  const statuses: MRCase['status'][] = ['Draft', 'Draft', 'Advance Submitted', 'Advance Paid', 'Ready', 'Final Submitted', 'Approved', 'Paid & Closed'];
  return statuses.map((status, i) => ({
    mrId: `mr-${i + 1}`,
    mrNo: `MR-2026-${mk(123 + i)}`,
    createdAt: now(),
    lastUpdated: new Date(Date.now() - i * 36e5).toISOString(),
    status,
    officer: profile,
    patient: { claimFor: i % 2 ? 'DEPENDENT' : 'SELF', dependentPersonId: i % 2 ? `dep-${i}` : undefined, name: i % 2 ? `Dependent ${i}` : profile.fullName, relation: i % 2 ? 'Spouse' : 'Self' },
    treatment: {
      placeOfIllness: 'Thiruvananthapuram', hospitalised: true, withinState: true, hospitalType: 'Government', hospitalName: i % 2 ? 'Medical College' : 'General Hospital', hospitalAddress: 'Kerala', fromDate: '2026-02-01', toDate: '2026-02-07', diagnosis: 'Viral fever', treatmentAbroad: 'NA',
    },
    bills: i > 1 ? [{ id: `b-${i}`, fileName: `bill-${i}.pdf`, invoiceNo: `INV-${i}100`, gstNo: `GST-${i}99`, billDate: '2026-02-05', hospitalName: 'General Hospital', totalAmount: 5000 + i * 900, taxAmount: 200, status: 'Extracted', duplicateFlag: false }] : [],
    docs: [
      ...(i >= 2 ? [{ id: `d-est-${i}`, type: 'ESTIMATE' as const, fileName: 'estimate.pdf', uploadedAt: now() }] : []),
      ...(i >= 4 && i !== 4 ? [{ id: `d-dis-${i}`, type: 'DISCHARGE' as const, fileName: 'discharge.pdf', uploadedAt: now() }] : []),
      ...(i >= 4 ? [{ id: `d-ec-${i}`, type: 'EC_SIGNED' as const, fileName: 'ec-signed.pdf', uploadedAt: now() }] : []),
      ...(i >= 7 ? [{ id: `d-go-${i}`, type: 'GO' as const, fileName: 'go.pdf', uploadedAt: now() }] : []),
    ],
    advances: i >= 2 ? [{ advId: `adv-${i}`, advNo: `ADV-MR-2026-${mk(45 + i)}`, amount: 4000 + i * 500, status: i >= 3 ? 'Paid' : 'Submitted', estimateDocId: `d-est-${i}`, submittedAt: now(), signed: true }] : [],
    finalClaim: { amaId: 'AMA-1', submittedAt: i >= 5 ? now() : undefined, claimNo: i >= 5 ? `CLM-${mk(70 + i)}` : undefined },
    movement: [{ id: `m-${i}`, action: 'Case created', at: now() }],
  }));
}

export function loadCases(profile: OfficerProfileVM): MRCase[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(KEY);
  if (raw) return JSON.parse(raw) as MRCase[];
  const seeded = seedCases(profile);
  localStorage.setItem(KEY, JSON.stringify(seeded));
  return seeded;
}

export function saveCases(cases: MRCase[]) {
  localStorage.setItem(KEY, JSON.stringify(cases));
}

export function upsertCase(next: MRCase, current: MRCase[]) {
  const updated = [...current.filter((c) => c.mrId !== next.mrId), { ...next, lastUpdated: now() }].sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
  saveCases(updated);
  return updated;
}
