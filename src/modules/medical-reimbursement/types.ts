export type DependentVM = {
  personId: string;
  relation: string;
  relationType: 'Parent' | 'Spouse' | 'Child';
  fullName: string;
  gender: string;
  dob: string;
  isAlive: boolean;
};

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
  basicPay: number;
  orderNo: string;
  startDate: string;
  officePostingAddress: string;
  dependents: DependentVM[];
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
};

export type AdvanceStatus = 'Draft' | 'Submitted' | 'Approved' | 'Paid' | 'Rejected';

export type Advance = {
  advId: string;
  advNo: string;
  amount: number;
  status: AdvanceStatus;
  estimateDocId: string;
  submittedAt?: string;
  signed: boolean;
};

export type MRCaseStatus = 'Draft' | 'Active' | 'Advance Submitted' | 'Advance Paid' | 'Final Submitted' | 'Approved' | 'Paid & Closed';

export type MRCase = {
  mrId: string;
  mrNo: string;
  createdAt: string;
  lastUpdated: string;
  status: MRCaseStatus;
  officer: OfficerProfileVM;
  patient: {
    claimFor: 'SELF' | 'DEPENDENT';
    dependentPersonId?: string;
    name: string;
    relation: string;
  };
  treatment: {
    placeOfIllness: string;
    hospitalised: boolean;
    withinState: boolean;
    hospitalType: string;
    hospitalName: string;
    hospitalAddress: string;
    fromDate: string;
    toDate?: string;
    diagnosis: string;
  };
  bills: Bill[];
  docs: Doc[];
  advances: Advance[];
  movement: { id: string; action: string; at: string }[];
  finalClaim: { amaId: string; submittedAt?: string; claimNo?: string };
};
