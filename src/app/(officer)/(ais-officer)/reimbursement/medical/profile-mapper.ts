import axiosInstance from '@/utils/apiClient';
import type { DependentVM, OfficerProfileVM } from './mr-types';

const fallback: OfficerProfileVM = {
  fullName: 'Mr. Arulselvan K',
  penNumber: '983628',
  serviceType: 'IFS',
  cadre: 'Chhattisgarh',
  email: 'akhil.ss+73@duk.ac.in',
  mobile: '6282749871',
  aisNumber: 'AIS-0000',
  dob: '1989-01-01',
  bloodGroup: 'B+',
  officeAddress: 'Aranyabhavan Forest complex, SH Mount, Kottayam, Kerala - 686006',
  residentialAddress: 'Aranyabhavan Forest complex, SH Mount, Kottayam, Kerala - 686006',
  designation: 'Deputy Conservator Of Forests (Snr Scale)',
  postingTypes: 'Field',
  administrativeDepartment: 'Forest',
  agency: 'Forest Department',
  district: 'Kottayam',
  state: 'Kerala',
  basicPay: '59500',
  orderNo: 'NA',
  startDate: '2025-01-01',
  officePostingAddress: 'Aranyabhavan Forest complex, SH Mount, Kottayam, Kerala - 686006',
};

const text = (v?: string | null, fb?: string) => (v && String(v).trim() ? String(v).trim() : fb || '—');
const joinAddr = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(', ').replace(',  -', ' -');

export function mapOfficerProfile(response: any): { profile: OfficerProfileVM; dependents: DependentVM[] } {
  const source = response?.data?.officer_data || response?.officer_data || {};
  const info = source.ais_officer_info || {};
  const serviceHistory = source.ais_service_history || [];
  const family = source.family || [];

  const currentService = serviceHistory.find((item: any) => item?.is_active === true)
    || [...serviceHistory].sort((a: any, b: any) => new Date(b?.start_date || 0).getTime() - new Date(a?.start_date || 0).getTime())[0]
    || {};

  const profile: OfficerProfileVM = {
    fullName: text(`${text(info.honorifics, 'Mr.')} ${text(info.first_name, '')} ${text(info.last_name, '')}`.trim(), fallback.fullName),
    penNumber: text(info.pen_number, fallback.penNumber),
    serviceType: text(info.service_type_name, fallback.serviceType),
    cadre: text(info.cadre, fallback.cadre),
    email: text(info.email, fallback.email),
    mobile: text(info.mobile_no, fallback.mobile),
    aisNumber: text(info.ais_number, fallback.aisNumber),
    dob: text(info.dob, fallback.dob),
    bloodGroup: text(info.blood_group, fallback.bloodGroup),
    officeAddress: text(joinAddr(info.address_line1_com, info.address_line2_com, info.district_com, info.state_com, info.pin_code_com ? `- ${info.pin_code_com}` : ''), fallback.officeAddress),
    residentialAddress: text(joinAddr(info.address_line1_per, info.address_line2_per, info.district_per, info.state_per, info.pin_code_per ? `- ${info.pin_code_per}` : ''), fallback.residentialAddress),
    designation: text(currentService.designation, fallback.designation),
    postingTypes: text(currentService.posting_types, fallback.postingTypes),
    administrativeDepartment: text(currentService.administrative_department, fallback.administrativeDepartment),
    agency: text(currentService.agency, fallback.agency),
    district: text(currentService.district, fallback.district),
    state: text(currentService.state, fallback.state),
    basicPay: text(currentService.basic_pay, fallback.basicPay),
    orderNo: text(currentService.order_no, fallback.orderNo),
    startDate: text(currentService.start_date, fallback.startDate),
    officePostingAddress: text(currentService.address, fallback.officePostingAddress),
  };

  const dependents: DependentVM[] = family
    .map((f: any) => ({
      personId: text(f.person_id, crypto.randomUUID()),
      relation: text(f.relation, 'Dependent'),
      relationType: text(f.relation_type, 'Child') as DependentVM['relationType'],
      fullName: text(`${text(f.first_name, '')} ${text(f.last_name, '')}`.trim(), 'Family Member'),
      gender: text(f.gender_name, '—'),
      dob: text(f.dob, '—'),
      isAlive: Boolean(f.is_alive),
    }))
    .filter((d) => d.isAlive && ['Parent', 'Spouse', 'Child'].includes(d.relationType));

  return { profile, dependents };
}

export async function fetchProfilePreview2() {
  try {
    const res = await axiosInstance.get('/officer/officer-preview');
    return mapOfficerProfile(res.data?.data || res.data);
  } catch {
    return { profile: fallback, dependents: [] as DependentVM[] };
  }
}
