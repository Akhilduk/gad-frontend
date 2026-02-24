export type CaseStatus =
  | 'Draft'
  | 'Advance Pending'
  | 'Advance Paid'
  | 'Ready to Submit'
  | 'Final Submitted'
  | 'Approved'
  | 'Paid & Closed';

export type MedicalCase = {
  mrNo: string;
  createdOn: string;
  claimFor: string;
  hospital: string;
  financial: string[];
  status: CaseStatus;
  primaryAction: string;
};

export const medicalCases: MedicalCase[] = [
  { mrNo: 'MR-2026-00123', createdOn: '12 Feb 2026', claimFor: 'Self', hospital: '-', financial: ['Bills: ₹0'], status: 'Draft', primaryAction: 'Continue' },
  { mrNo: 'MR-2026-00124', createdOn: '13 Feb 2026', claimFor: 'Self', hospital: 'City Hospital', financial: ['Bills: ₹8,200'], status: 'Draft', primaryAction: 'Continue' },
  { mrNo: 'MR-2026-00125', createdOn: '14 Feb 2026', claimFor: 'Dependent (Father)', hospital: 'AIIMS', financial: ['Advance Req: ₹25,000'], status: 'Advance Pending', primaryAction: 'View' },
  { mrNo: 'MR-2026-00126', createdOn: '15 Feb 2026', claimFor: 'Self', hospital: 'Apollo', financial: ['Advance Paid: ₹15,000', 'Bills: ₹22,000', 'Net Claim: ₹7,000'], status: 'Advance Paid', primaryAction: 'Add Bill' },
  { mrNo: 'MR-2026-00127', createdOn: '16 Feb 2026', claimFor: 'Dependent (Spouse)', hospital: '-', financial: ['Advance Paid: ₹10,000', 'EC Uploaded', 'Net Claim: ₹12,500'], status: 'Ready to Submit', primaryAction: 'Submit Final' },
  { mrNo: 'MR-2026-00128', createdOn: '17 Feb 2026', claimFor: 'Self', hospital: 'Govt Hospital', financial: ['Bills: ₹5,000'], status: 'Final Submitted', primaryAction: 'Track' },
  { mrNo: 'MR-2026-00129', createdOn: '18 Feb 2026', claimFor: 'Dependent (Child)', hospital: "Children's Hosp.", financial: ['Final Amt: ₹18,000'], status: 'Approved', primaryAction: 'View' },
  { mrNo: 'MR-2026-00130', createdOn: '19 Feb 2026', claimFor: 'Self', hospital: 'Global Health', financial: ['Final Amt: ₹45,000'], status: 'Paid & Closed', primaryAction: 'View Bundle' },
];

export const statusClasses: Record<CaseStatus, string> = {
  Draft: 'bg-slate-100 text-slate-700',
  'Advance Pending': 'bg-amber-100 text-amber-700',
  'Advance Paid': 'bg-purple-100 text-purple-700',
  'Ready to Submit': 'bg-teal-100 text-teal-700',
  'Final Submitted': 'bg-sky-100 text-sky-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  'Paid & Closed': 'bg-emerald-600 text-white',
};
