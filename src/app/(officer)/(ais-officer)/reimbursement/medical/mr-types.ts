export type OfficerProfileVM = {
  fullName: string;
  penNumber: string;
  serviceType: string;
  cadre: string;
  email: string;
  mobile: string;
  aisNumber: string;
  dob: string;
  bloodGroup: string;
  officeAddress: string;
  residentialAddress: string;
  designation: string;
  postingTypes: string;
  administrativeDepartment: string;
  agency: string;
  district: string;
  state: string;
  basicPay: string;
  orderNo: string;
  startDate: string;
  officePostingAddress: string;
};

export type DependentVM = {
  personId: string;
  relation: string;
  relationType: 'Parent' | 'Spouse' | 'Child';
  fullName: string;
  gender: string;
  dob: string;
  isAlive: boolean;
};

export type Bill = {
  id: string;
  fileName: string;
  invoiceNo: string;
  gstNo: string;
  billDate: string;
  hospitalName: string;
  totalAmount: number;
  taxAmount: number;
  status: 'Extracted' | 'Reviewed';
  duplicateFlag: boolean;
};

export type DocType = 'DISCHARGE' | 'ESTIMATE' | 'EC_SIGNED' | 'GO' | 'PRESCRIPTION' | 'LAB' | 'OTHER';

export type Doc = {
  id: string;
  type: DocType;
  fileName: string;
  uploadedAt: string;
  notes?: string;
};

export type Advance = {
  advId: string;
  advNo: string;
  amount: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Paid' | 'Rejected';
  estimateDocId: string;
  submittedAt?: string;
  signed: boolean;
};

export type MRStatus = 'Draft' | 'Active' | 'Advance Submitted' | 'Advance Paid' | 'Ready' | 'Final Submitted' | 'Approved' | 'Paid & Closed';

export type MRCase = {
  mrId: string;
  mrNo: string;
  createdAt: string;
  lastUpdated: string;
  status: MRStatus;
  officer: OfficerProfileVM;
  patient: { claimFor: 'SELF' | 'DEPENDENT'; dependentPersonId?: string; name: string; relation: string };
  treatment: {
    placeOfIllness: string;
    hospitalised: boolean;
    withinState: boolean;
    hospitalType: 'Government' | 'Empanelled Private';
    hospitalName: string;
    hospitalAddress: string;
    fromDate: string;
    toDate?: string;
    diagnosis: string;
    treatmentAbroad?: string;
  };
  bills: Bill[];
  docs: Doc[];
  advances: Advance[];
  finalClaim: { amaId: string; submittedAt?: string; claimNo?: string };
  movement: { id: string; action: string; at: string }[];
};
