'use client';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { BriefcaseIcon, ChartBarIcon, BuildingOffice2Icon, GlobeAltIcon, MapPinIcon, HomeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { BoltIcon, UserIcon } from '@heroicons/react/24/solid';
import { useMemo } from 'react';
import moment from 'moment';

// Helper function to safely format dates using moment.js
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = moment(dateString);
  // Check if date is valid
  if (!date.isValid()) return 'N/A';
  
  return date.format('DD/MM/YYYY');
};

export function ModalServiceDetailsView({
  open,
  setOpen,
  service,
  getDesignationName,
  getLevelName,
  getMinistryName,
  getAgencyName,
  getDepartmentName,
  getGradeName,
  getDistrictName,
  getPostingTypeName,
  getStateName,
  officerFields,
}) {
  // Get basic pay label based on additional charge selection
  const getBasicPayLabel = () => {
    return service?.is_additional_charge === true ? 'Scale of Pay' : 'Basic Pay';
  };

  const allFields = useMemo(
    () => [
      {
        label: 'From Date',
        key: 'start_date',
        icon: HomeIcon,
        getValue: (service) => formatDate(service?.start_date),
      },
      {
        label: 'To Date',
        key: 'end_date',
        icon: HomeIcon,
        getValue: (service) => {
          if (!service?.end_date) return 'Ongoing';
          return formatDate(service.end_date);
        },
      },
      { label: 'Designation', key: 'designation_id', icon: BriefcaseIcon, getValue: (service) => (service ? getDesignationName(service.designation_id) : 'N/A') },
      { label: 'Department', key: 'administrative_department_id', icon: GlobeAltIcon, getValue: (service) => (service ? getDepartmentName(service.administrative_department_id) : 'N/A') },
      { label: 'Ministry', key: 'ministry_id', icon: BuildingOffice2Icon, getValue: (service) => (service ? getMinistryName(service.ministry_id) : 'N/A') },
      { label: 'Office', key: 'agency_id', icon: BuildingOffice2Icon, getValue: (service) => (service ? getAgencyName(service.agency_id) : 'N/A') },
      { label: 'State', key: 'state_id', icon: MapPinIcon, getValue: (service) => (service ? getStateName(service.state_id) : 'N/A') },
      { label: 'District', key: 'district_id', icon: HomeIcon, getValue: (service) => (service ? getDistrictName(service.district_id) : 'N/A') },
      { label: 'Grade', key: 'grade_id', icon: ChartBarIcon, getValue: (service) => (service ? getGradeName(service.grade_id) : 'N/A') },
      { label: 'Level', key: 'level_id', icon: ChartBarIcon, getValue: (service) => (service ? getLevelName(service.level_id) : 'N/A') },
      { label: 'Posting Type', key: 'posting_type_id', icon: BriefcaseIcon, getValue: (service) => (service ? getPostingTypeName(service.posting_type_id) : 'N/A') },
      { label: 'Address', key: 'address', icon: HomeIcon, getValue: (service) => (service ? service.address || 'N/A' : 'N/A') },
      { label: 'Phone Number', key: 'phone_no', icon: HomeIcon, getValue: (service) => (service ? service.phone_no || 'N/A' : 'N/A') },
      { label: 'Additional Charge', key: 'is_additional_charge', icon: HomeIcon, getValue: (service) => (service ? (service.is_additional_charge ? 'Yes' : 'No') : 'N/A') },
      { label: 'Other Details', key: 'other_details', icon: HomeIcon, getValue: (service) => (service ? service.other_details || 'N/A' : 'N/A') },
      { 
        label: getBasicPayLabel(), // Dynamic label based on additional charge
        key: 'basic_pay', 
        icon: ChartBarIcon, 
        getValue: (service) => (service ? (service.basic_pay ? `₹${service.basic_pay}` : 'N/A') : 'N/A') 
      },
      { label: 'Order Number', key: 'order_no', icon: HomeIcon, getValue: (service) => (service ? service.order_no || 'N/A' : 'N/A') },
      { 
        label: 'Order Date', 
        key: 'order_date', 
        icon: HomeIcon, 
        getValue: (service) => formatDate(service?.order_date)
      },
    ],
    [getDesignationName, getLevelName, getMinistryName, getAgencyName, getDepartmentName, getGradeName, getDistrictName, getPostingTypeName, getStateName, getBasicPayLabel]
  );
  
  const renderIndicator = (fieldKey, fieldSource, type, label, bgColor, textColor, icon, position = 'right-2') => {
    if (fieldSource !== type) return null;
    return (
      <div key={`${fieldKey}_${type}`} className={`absolute top-2 ${position} group`}>
        <span
          className={`inline-flex items-center p-0.5 rounded-full ${bgColor} ${textColor} text-xs`}
          aria-label={label}
        >
          {icon}
        </span>
        <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10">
          <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
            {label}
          </div>
        </div>
      </div>
    );
  };

  const renderIndicators = (field, service) => {
    const indicators = [];
    let positionIndex = 0;
    const positions = ['right-2', 'right-2', 'right-8', 'right-8'];

    const spark = renderIndicator(`${field.key}_${service.ais_ser_id}`, service.fieldSources[field.key], 'SPARK', 'Synced from SPARK', 'bg-orange-100', 'text-orange-600', <BoltIcon className="w-2 h-2" />, positions[positionIndex++]);
    const user = renderIndicator(`${field.key}_${service.ais_ser_id}`, service.fieldSources[field.key], 'USER', 'User Entered', 'bg-indigo-100', 'text-indigo-600', <UserIcon className="w-2 h-2" />, positions[positionIndex++]);
    const gad = officerFields?.GAD_OFFICER?.includes(field.key) && renderIndicator(`${field.key}_gad`, 'GAD_OFFICER', 'GAD_OFFICER', 'Updated by AS-II', 'bg-indigo-100', 'text-indigo-600', <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>, positions[positionIndex++]);

    if (spark) indicators.push(spark);
    if (user) indicators.push(user);
    if (gad) indicators.push(gad);

    return indicators.length > 0 ? (
      <div className="absolute top-2 right-2 flex flex-row-reverse space-x-reverse space-x-1 z-10">
        {indicators}
      </div>
    ) : null;
  };

  return (
    <Dialog open={open} onClose={setOpen} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
          <DialogPanel className="relative w-full max-w-2xl transform rounded-xl bg-white dark:bg-gray-900 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden max-h-[90vh] flex flex-col">
            {/* Fixed Header */}
            <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between shrink-0">
              <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
                Service Details
              </DialogTitle>
              <button
                type="button"
                className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                onClick={() => setOpen(false)}
                aria-label="Close modal"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {service ? (
                <div className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Column: Posting Information */}
                    <div className="space-y-3">
                      <div className="border-b border-gray-200 dark:border-gray-700 pb-1">
                        <h4 className="text-xs font-medium text-gray-600 dark:text-gray-300">Posting Information</h4>
                      </div>
                      {allFields.slice(0, 9).map((field) => (
                        <div key={field.key} className="relative bg-gray-100 dark:bg-gray-800 rounded-md pl-2 pr-5 py-2 border border-gray-100 overflow-hidden">
                          {renderIndicators(field, service)}
                          <div className="flex items-start gap-2">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center mt-0.5">
                              <field.icon className="w-3 h-3 text-indigo-600 dark:text-indigo-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">{field.label}</p>
                              <p className="text-xs font-semibold text-gray-900 dark:text-white break-words" title={field.getValue(service)}>
                                {field.getValue(service)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Right Column: Additional Details */}
                    <div className="space-y-3">
                      <div className="border-b border-gray-200 dark:border-gray-700 pb-1">
                        <h4 className="text-xs font-medium text-gray-600 dark:text-gray-300">Additional Details</h4>
                      </div>
                      {allFields.slice(9).map((field) => (
                        <div key={field.key} className="relative bg-gray-100 dark:bg-gray-800 rounded-md pl-2 pr-5 py-2 border border-gray-100 overflow-hidden">
                          {renderIndicators(field, service)}
                          <div className="flex items-start gap-2">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center mt-0.5">
                              <field.icon className="w-3 h-3 text-indigo-600 dark:text-indigo-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">{field.label}</p>
                              <p className="text-xs font-semibold text-gray-900 dark:text-white break-words" title={field.getValue(service)}>
                                {field.getValue(service)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="col-span-2 text-center py-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">No service data available.</p>
                </div>
              )}
            </div>
            
            {/* Fixed Footer */}
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex justify-end shrink-0 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                className="inline-flex items-center px-3 py-1.5 rounded-md bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors duration-200"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}