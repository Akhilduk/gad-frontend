'use client';

import { UserIcon, IdentificationIcon, EnvelopeIcon, PhoneIcon, CalendarIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import { getServiceTypeName } from '@/utils/serviceTypeUtils';

export default function PrimaryDetails({ personalDetails, masterData }) {
  const getMasterValue = (id, key) => {
    if (!id) return 'N/A';
    const keyMap = {
      source_of_recruitment_id: { key: 'recruitment', abbr: 'recruitment_abbr' },
      cadre_id: { key: 'cadre', abbr: 'cadre_abbr' }
    };
    const masterKey = keyMap[key];
    if (!masterKey || !masterData[masterKey.key]) return 'N/A';
    const idKey = Object.keys(masterData[masterKey.key][0] || {}).find((k) => k.includes('_id')) || 'id';
    const match = masterData[masterKey.key].find((item) => item[idKey] == id);
    return match ? (match[masterKey.abbr] || match[idKey] || 'N/A') : 'N/A';
  };

  const getBatchNumber = (recruitment, cadre, allotmentYear) => {
    if (!allotmentYear) return 'N/A';
    const recruitmentType = getMasterValue(recruitment, 'source_of_recruitment_id');
    const cadreAbbr = getMasterValue(cadre, 'cadre_id');
    if (recruitmentType.toUpperCase() === 'DR') {
      return `${cadreAbbr}:${allotmentYear}`;
    } else if (recruitmentType.toUpperCase() === 'SL') {
      return `${recruitmentType}:${allotmentYear}`;
    }
    return 'N/A';
  };

  const fields = [
    {
      label: 'Full Name',
      key: 'full_name',
      icon: UserIcon,
      value: `${personalDetails?.honorifics || ''} ${personalDetails?.first_name || ''} ${personalDetails?.last_name || 'N/A'}`
    },
    { 
      label: 'Email Address', 
      key: 'email', 
      icon: EnvelopeIcon, 
      value: personalDetails?.email || 'N/A',
      // Add a flag to identify email field
      isEmail: true 
    },
    { label: 'AIS Number', key: 'ais_number', icon: IdentificationIcon, value: personalDetails?.ais_number || 'N/A' },
    { label: 'Karmasri ID', key: 'identity_number', icon: IdentificationIcon, value: personalDetails?.identity_number || 'N/A' },
    { label: 'PEN', key: 'pen_number', icon: IdentificationIcon, value: personalDetails?.pen_number || 'N/A' },
    {
      label: 'Batch Number',
      key: 'batch_number',
      icon: CalendarIcon,
      value: getBatchNumber(
        personalDetails?.source_of_recruitment_id,
        personalDetails?.cadre_id,
        personalDetails?.allotment_year
      )
    },
    { label: 'Service Type', key: 'service_type_id', icon: BriefcaseIcon, value: getServiceTypeName(personalDetails?.service_type_id) || 'N/A' },
    { label: 'Mobile Number', key: 'mobile_no', icon: PhoneIcon, value: personalDetails?.mobile_no || 'N/A' }
  ];

  // Check if data is loading (i.e., personalDetails or masterData is undefined/null or empty)
  const isLoading = !personalDetails || Object.keys(personalDetails || {}).length === 0 || !masterData || Object.keys(masterData || {}).length === 0;

  return (
    <div className="mt-3 mb-6 w-full bg-gray-50 dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-600">
      {isLoading ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xxl:grid-cols-4 gap-x-6 gap-y-6">
          {fields.map((field) => (
            <div
              key={field.key}
              className="flex items-start gap-3"
            >
              {/* Icon inside circle */}
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-indigo-900 via-indigo-500 to-indigo-800 flex items-center justify-center mt-0.5">
                <field.icon
                  className="w-5 h-5 text-indigo-50 dark:text-primary-300"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400 truncate">
                  {field.label}
                </p>
               <p className="text-sm font-semibold text-gray-900 dark:text-white break-words">
                  {field.value || 'N/A'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}