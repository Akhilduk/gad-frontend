import type { MRCase } from './types';

export const rupee = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;
export const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

export const billsTotal = (c: MRCase) => c.bills.reduce((s, b) => s + (b.totalAmount || 0), 0);
export const advancePaid = (c: MRCase) => c.advances.filter((a) => a.status === 'Paid').reduce((s, a) => s + a.amount, 0);
export const missingItems = (c: MRCase) => {
  const missing: string[] = [];
  if (c.bills.length < 1) missing.push('Bills missing');
  if (!c.docs.some((d) => d.type === 'EC_SIGNED')) missing.push('Signed EC missing');
  if (!c.docs.some((d) => d.type === 'DISCHARGE')) missing.push('Discharge missing');
  if (!c.treatment.placeOfIllness || !c.treatment.hospitalName || !c.treatment.fromDate) missing.push('Treatment note incomplete');
  return missing;
};

export const statusColor = (status: string) => {
  if (status.includes('Paid')) return '#1b7f4b';
  if (status.includes('Approved')) return '#0f766e';
  if (status.includes('Submitted')) return '#3730a3';
  if (status.includes('Draft')) return '#4b5563';
  return '#0b2a45';
};
