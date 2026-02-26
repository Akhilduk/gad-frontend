import type { DependentVM, OfficerProfileVM } from './types';

const fallback = {
  fullName: 'Mr. Arulselvan K',
  penNumber: '983628',
  serviceType: 'IFS',
  cadre: 'Chhattisgarh',
  designation: 'Deputy Conservator Of Forests (Snr Scale)',
  basicPay: 59500,
  officeAddress: 'Aranyabhavan Forest complex, SH Mount, Kottayam, Kerala - 686006',
  residentialAddress: 'Aranyabhavan Forest complex, SH Mount, Kottayam, Kerala - 686006',
  email: 'akhil.ss+73@duk.ac.in',
  mobile: '6282749871',
};

const val = (x: unknown, d = '—') => (x === null || x === undefined || x === '' ? d : String(x));

const joinAddr = (...parts: (unknown)[]) => parts.map((p) => val(p, '')).filter(Boolean).join(', ').replace(/,\s*-\s*/, ' - ');

const normalizeRelationType = (relationType: string): DependentVM['relationType'] | null => {
  if (!relationType) return null;
  const key = relationType.toLowerCase();
  if (key.includes('parent')) return 'Parent';
  if (key.includes('spouse')) return 'Spouse';
  if (key.includes('child')) return 'Child';
  return null;
};

export const mapOfficerProfile = (response: any): OfficerProfileVM => {
  const officerData = response?.data?.officer_data || response?.officer_data || {};
  const info = officerData?.ais_officer_info || {};
  const serviceHistory = officerData?.ais_service_history || [];
  const family = officerData?.family || [];

  const currentService = serviceHistory.find((item: any) => item?.is_active === true)
    || [...serviceHistory].sort((a: any, b: any) => new Date(b?.start_date || 0).getTime() - new Date(a?.start_date || 0).getTime())[0]
    || {};

  const dependents: DependentVM[] = family
    .map((member: any) => ({
      personId: val(member?.person_id, crypto.randomUUID()),
      relation: val(member?.relation, 'Dependent'),
      relationType: normalizeRelationType(val(member?.relation_type, '')),
      fullName: `${val(member?.first_name, '')} ${val(member?.last_name, '')}`.trim() || 'Dependent Member',
      gender: val(member?.gender_name, '—'),
      dob: val(member?.dob, '—'),
      isAlive: Boolean(member?.is_alive),
    }))
    .filter((d: any) => d.isAlive && d.relationType) as DependentVM[];

  return {
    fullName: `${val(info?.honorifics, '')} ${val(info?.first_name, '')} ${val(info?.last_name, '')}`.trim() || fallback.fullName,
    penNumber: val(info?.pen_number, fallback.penNumber),
    serviceType: val(info?.service_type_name, fallback.serviceType),
    cadre: val(info?.cadre, fallback.cadre),
    email: val(info?.email, fallback.email),
    mobile: val(info?.mobile_no, fallback.mobile),
    aisNumber: val(info?.ais_number, 'AIS-10293'),
    dob: val(info?.dob, '1989-07-20'),
    bloodGroup: val(info?.blood_group, 'B+'),
    officeAddress: joinAddr(info?.address_line1_com, info?.address_line2_com, info?.district_com, info?.state_com, `- ${val(info?.pin_code_com, '')}`) || fallback.officeAddress,
    residentialAddress: joinAddr(info?.address_line1_per, info?.address_line2_per, info?.district_per, info?.state_per, `- ${val(info?.pin_code_per, '')}`) || fallback.residentialAddress,
    designation: val(currentService?.designation, fallback.designation),
    postingTypes: val(currentService?.posting_types, 'Field Posting'),
    administrativeDepartment: val(currentService?.administrative_department, 'Forest Department'),
    agency: val(currentService?.agency, 'Kerala Forest Force'),
    district: val(currentService?.district, 'Kottayam'),
    state: val(currentService?.state, 'Kerala'),
    basicPay: Number(currentService?.basic_pay || fallback.basicPay),
    orderNo: val(currentService?.order_no, 'GO-1288/2025'),
    startDate: val(currentService?.start_date, '2024-06-05'),
    officePostingAddress: val(currentService?.address, fallback.officeAddress),
    dependents,
  };
};
