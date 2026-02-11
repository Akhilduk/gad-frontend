'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { BoltIcon } from '@heroicons/react/24/solid';
import { handleStateDistrictChange } from '@/utils/mapping';
import { parseDateFromDDMMYYYY, isValidDDMMYYYY } from '@/utils/dateFormat';

export function ModalServiceDetails({
  open = false,
  setOpen,
  save,
  service,
  stateRes,
  implementingAgencyRes,
  postingTypeRes,
  districtRes,
  gradeRes,
  departmentRes,
  ministryRes,
  levelRes,
  designationRes,
}) {
  const [formData, setFormData] = useState({
    designation_id: '',
    level_id: '',
    ministry_id: '',
    administrative_department_id: '',
    agency_id: '',
    state_id: null,
    district_id: null,
    grade_id: '',
    posting_type_id: '',
    address: '',
    phone_no: '',
    is_additional_charge: '',
    start_date: '',
    end_date: '',
    other_details: '',
    basic_pay: '',
    order_no: '',
    order_date: null,
  });
  const [designations, setDesignations] = useState([]);
  const [levels, setLevels] = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [postingTypes, setPostingTypes] = useState([]);
  const [implementingAgencies, setImplementingAgencies] = useState([]);
  const [states, setStates] = useState([]);
  const [errors, setErrors] = useState({});
  const [userDates, setUserDates] = useState({ doj: null, retirementDate: null });
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD, e.g., "2025-12-16"

  const allowedCharsRegex = /^[a-zA-Z0-9 ().,&/_\n-]+$/;
  const orderNoRegex = /^[a-zA-Z0-9.,&()-/ ]+$/;
  const showDojWarning = userDates.doj === null;

  // Define required fields
  const requiredFields = [
    'designation_id',
    'level_id',
    'ministry_id',
    'administrative_department_id',
    'agency_id',
    'state_id',
    'district_id',
    'grade_id',
    'posting_type_id',
    'start_date',
    'end_date',
    'address',
    'is_additional_charge',
  ];

  // Add helper function to check if service is from 2020 onwards
  const isServiceFrom2020Onwards = (startDate) => {
    if (!startDate) return false;
    
    try {
      const start = new Date(startDate);
      const year2020 = new Date('2020-01-01T00:00:00');
      return start >= year2020;
    } catch (error) {
      console.error('Error parsing date:', error);
      return false;
    }
  };

  // Load master data
  useEffect(() => {
    setDesignations(designationRes);
    setLevels(levelRes);
    setMinistries(ministryRes);
    setDepartments(departmentRes);
    setGrades(gradeRes);
    setDistricts(districtRes);
    setPostingTypes(postingTypeRes);
    setImplementingAgencies(implementingAgencyRes);
    setStates(stateRes);
  }, [designationRes, levelRes, ministryRes, departmentRes, gradeRes, districtRes, postingTypeRes, implementingAgencyRes, stateRes]);
  
  // Load and normalize DOJ / retirement date every time modal opens
  useEffect(() => {
    const rawDoj = sessionStorage.getItem('date_of_joining');
    const rawRetirement = sessionStorage.getItem('retirement_date');
    console.log("date of joining++++++++++++++++++++++++++++++++++++++++++++:", rawDoj);

    // Normalize DOJ: treat null, "null", empty string as real null
    const effectiveDoj = rawDoj && rawDoj !== 'null' && rawDoj.trim() !== '' ? rawDoj.trim() : null;

    let parsedRetirement = null;
    if (rawRetirement && rawRetirement !== 'null' && rawRetirement.trim() !== '') {
      const datePart = rawRetirement.split(' ')[0];
      if (isValidDDMMYYYY(datePart)) {
        parsedRetirement = parseDateFromDDMMYYYY(datePart);
      }
    }

    setUserDates({
      doj: effectiveDoj,
      retirementDate: parsedRetirement,
    });
  }, [open]);

  // Initialize form data when modal opens
  useEffect(() => {
    if (open && service !== null) {
      setFormData({
        designation_id: service.designation_id || '',
        level_id: service.level_id || '',
        ministry_id: service.ministry_id || '',
        administrative_department_id: service.administrative_department_id || '',
        agency_id: service.agency_id || '',
        state_id: service.state_id || null,
        district_id: service.district_id || null,
        grade_id: service.grade_id || '',
        posting_type_id: service.posting_type_id || '',
        address: service.address || '',
        phone_no: service.phone_no || '',
        is_additional_charge:
          service.is_additional_charge === true || service.is_additional_charge === 'yes' ? 'yes' :
          service.is_additional_charge === false || service.is_additional_charge === 'no' ? 'no' : '',
        start_date: service.start_date || '',
        end_date: service.end_date || '',
        other_details: service.other_details ? service.other_details.trim() : '',
        basic_pay: service.basic_pay || null,
        order_no: service.order_no ? service.order_no.trim() : '',
        order_date: service.order_date || null,
      });
      setFilteredDistricts(
        service.state_id
          ? districtRes.filter((district) => district.state_id === parseInt(service.state_id, 10))
          : []
      );
      setErrors({});
    } else if (!open) {
      setFormData({
        designation_id: '',
        level_id: '',
        ministry_id: '',
        administrative_department_id: '',
        agency_id: '',
        state_id: null,
        district_id: null,
        grade_id: '',
        posting_type_id: '',
        address: '',
        phone_no: '',
        is_additional_charge: '',
        start_date: '',
        end_date: '',
        other_details: '',
        basic_pay: null,
        order_no: '',
        order_date: null,
      });
      setFilteredDistricts([]);
      setErrors({});
    }
  }, [service, open, districtRes]);

  const isDisabled = (key) => {
    return (
      (service?.fieldSources?.[key] === 'SPARK' || service?.fieldSources?.[key] === 'GAD_OFFICER') &&
      formData[key] !== null &&
      formData[key] !== '' &&
      formData[key] !== 'N/A'
    );
  };

  const getFieldClassName = (fieldKey) => {
    const baseClasses = 'mt-1 block w-full rounded-md sm:text-sm p-2 border';
    if (service?.fieldSources?.[fieldKey] === 'GAD_OFFICER') {
      return `${baseClasses} bg-indigo-50 text-gray-900 border-indigo-200 cursor-not-allowed pointer-events-none dark:bg-gray-800 dark:text-white dark:border-indigo-500`;
    }
    if (service?.fieldSources?.[fieldKey] === 'SPARK') {
      return `${baseClasses} bg-orange-50 text-gray-900 border-orange-200 cursor-not-allowed pointer-events-none dark:bg-indigo-900 dark:text-gray-200 dark:border-gray-600`;
    }
    return `${baseClasses} border-gray-300 text-gray-900 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-300`;
  };

  const renderSparkIndicator = (fieldKey) => {
    if (service?.fieldSources?.[fieldKey] !== 'SPARK') return null;
    return (
      <div className="absolute top-3 right-3 group z-10">
        <span className="inline-flex items-center p-0.5 rounded-full bg-orange-100 text-orange-600 text-xs" aria-label="Synced from SPARK">
          <BoltIcon className="w-2 h-2" />
        </span>
        <div className="absolute right-0 top-full mt-1 hidden group-hover:block">
          <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md whitespace-nowrap">
            Synced from SPARK
          </div>
        </div>
      </div>
    );
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, address: value }));

    const trimmedValue = value.trim();
    let error = null;

    if (trimmedValue) {
      if (!allowedCharsRegex.test(trimmedValue)) {
        error = 'Address contains invalid characters';
      } else if (trimmedValue.length > 100) {
        error = 'Address must not exceed 100 characters';
      }
    }

    setErrors((prev) => ({
      ...prev,
      address: error,
    }));
  };

  const handleOrderNoChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, order_no: value }));

    const trimmedValue = value.trim();
    let error = null;

    // Only validate if there's actually content (not just whitespace)
    if (trimmedValue !== '') {
      if (!orderNoRegex.test(trimmedValue)) {
        error = 'Order number contains invalid characters';
      } else if (trimmedValue.length > 50) {
        error = 'Order number must not exceed 50 characters';
      }
    }

    setErrors((prev) => ({
      ...prev,
      order_no: error,
    }));
  };

  const handleOtherDetailsChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, other_details: value }));

    const trimmedValue = value.trim();
    let error = null;

    if (trimmedValue && !allowedCharsRegex.test(trimmedValue)) {
      error = 'Other details contain invalid characters';
    } else if (trimmedValue && trimmedValue.length > 250) {
      error = 'Other details must not exceed 250 characters';
    }

    setErrors((prev) => ({
      ...prev,
      other_details: error,
    }));
  };

  const renderGadOfficerIndicator = (fieldKey) => {
    if (service?.fieldSources?.[fieldKey] !== 'GAD_OFFICER') return null;
    return (
      <div className="absolute top-3 right-3 group z-10">
        <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-xs" aria-label="Sourced from GAD Officer">
          <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3" />
          </svg>
        </span>
        <div className="absolute right-0 top-full mt-1 hidden group-hover:block">
          <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md whitespace-nowrap">
            Updated by AS-II
          </div>
        </div>
      </div>
    );
  };

  // Get basic pay label based on additional charge selection
  const getBasicPayLabel = () => {
    return formData.is_additional_charge === 'yes' ? 'Scale of Pay' : 'Basic Pay';
  };

  // Handle state and district changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for basic_pay
    if (name === 'basic_pay') {
      const val = value === '' ? null : parseFloat(value);
      setFormData((prev) => ({ ...prev, [name]: val }));
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
      return;
    }
    
    // State → District cascading
    if (name === 'state_id' || name === 'district_id') {
      const updatedDistricts = handleStateDistrictChange(e, formData, setFormData, 'state_id', 'district_id', districts);
      setFilteredDistricts(updatedDistricts);
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        if (name === 'state_id') delete newErrors.district_id;
        return newErrors;
      });
    }
    
    // Update the form data
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for the changed field
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      
      // Special handling for start_date changes
      if (name === 'start_date') {
        const newStartDt = value ? new Date(value) : null;
        const is2020OrLater = newStartDt && !isNaN(newStartDt.getTime()) && newStartDt >= new Date('2020-01-01');
        
        if (!is2020OrLater) {
          // If service is now pre-2020, clear mandatory errors for order_no and order_date
          if (newErrors.order_no === 'Order number is required for service periods from 2020 onwards') {
            delete newErrors.order_no;
          }
          if (newErrors.order_date === 'Order date is required for service periods from 2020 onwards') {
            delete newErrors.order_date;
          }
        }
      }
      
      return newErrors;
    });

    // Real-time cross-validation for date fields
    if (name === 'start_date' || name === 'end_date' || name === 'order_date') {
      // Get the current values after this change
      const currentStart = name === 'start_date' ? value : formData.start_date;
      const currentEnd = name === 'end_date' ? value : formData.end_date;
      const currentOrder = name === 'order_date' ? value : formData.order_date;

      // Parse to Date objects (only if value exists)
      const dojDt = userDates.doj ? new Date(userDates.doj) : null;
      const retirementDt = userDates.retirementDate ? new Date(userDates.retirementDate) : null;
      const startDt = currentStart ? new Date(currentStart) : null;
      const endDt = currentEnd ? new Date(currentEnd) : null;
      const orderDt = currentOrder ? new Date(currentOrder) : null;

      const todayDt = new Date();
      todayDt.setHours(0, 0, 0, 0);

      const hasValidBounds = dojDt && !isNaN(dojDt.getTime()) && retirementDt && !isNaN(retirementDt.getTime());

      // Bounds checks (DOJ ≤ date ≤ retirement) - only if dates are valid
      if (hasValidBounds) {
        if (startDt && !isNaN(startDt.getTime())) {
          if (startDt < dojDt || startDt > retirementDt) {
            setErrors(prev => ({ ...prev, start_date: 'Start date must be between Date of Joining and retirement date' }));
          }
        }
        if (endDt && !isNaN(endDt.getTime())) {
          if (endDt < dojDt || endDt > retirementDt) {
            setErrors(prev => ({ ...prev, end_date: 'End date must be between Date of Joining and retirement date' }));
          }
        }
        if (orderDt && !isNaN(orderDt.getTime())) {
          if (orderDt < dojDt || orderDt > retirementDt) {
            setErrors(prev => ({ ...prev, order_date: 'Order date must be between Date of Joining and retirement date' }));
          }
        }
      }

      // End date must be ≥ start date (only if both exist and are valid)
      if (startDt && endDt && !isNaN(startDt.getTime()) && !isNaN(endDt.getTime()) && endDt < startDt) {
        setErrors(prev => ({ ...prev, end_date: 'End date must be after start date' }));
      }

      // Order date specific rules (SKIP if from SPARK or if empty)
      if (
        orderDt &&
        !isNaN(orderDt.getTime()) &&
        service?.fieldSources?.order_date !== 'SPARK'
      ) {
        if (orderDt > todayDt) {
          setErrors(prev => ({ ...prev, order_date: 'Order date cannot be in the future' }));
        }
        if (startDt && !isNaN(startDt.getTime()) && orderDt > startDt) {
          setErrors(prev => ({ ...prev, order_date: 'Order date must be on or before Start Date' }));
        }
      }
    }
  };

  const validate = () => {
    const newErrors = {};

    // Block everything if DOJ is missing
    if (showDojWarning) {
      newErrors.general = 'Please save Personal Details first (Date of Joining is required)';
      if (formData.start_date || formData.end_date || formData.order_date) {
        newErrors.start_date = 'Cannot set dates without Date of Joining';
        newErrors.end_date = 'Cannot set dates without Date of Joining';
        newErrors.order_date = 'Cannot set dates without Date of Joining';
      }
      setErrors(newErrors);
      return false;
    }

    const dojDt = userDates.doj ? new Date(userDates.doj) : null;
    const retirementDt = userDates.retirementDate ? new Date(userDates.retirementDate) : null;
    const todayDt = new Date();
    todayDt.setHours(0, 0, 0, 0);

    // Check standard required fields
    requiredFields.forEach((field) => {
      const value = typeof formData[field] === 'string' ? formData[field].trim() : formData[field];
      if (!value && value !== 0) {
        newErrors[field] = 'This field is required';
      }
    });

    if (formData.state_id && !formData.district_id) {
      newErrors.district_id = 'This field is required';
    }
    if (!formData.state_id && formData.district_id) {
      newErrors.district_id = 'District cannot be selected without a state';
    }

    if (formData.address) {
      const trimmed = formData.address.trim();
      if (!allowedCharsRegex.test(trimmed)) {
        newErrors.address = 'Address contains invalid characters';
      } else if (trimmed.length > 100) {
        newErrors.address = 'Address must not exceed 100 characters';
      }
    }

    if (formData.is_additional_charge === '') {
      newErrors.is_additional_charge = 'This field is required';
    }

    if (formData.other_details) {
      const trimmed = formData.other_details.trim();
      if (!allowedCharsRegex.test(trimmed)) {
        newErrors.other_details = 'Other details contain invalid characters';
      } else if (trimmed.length > 250) {
        newErrors.other_details = 'Other details must not exceed 250 characters';
      }
    }

    if (formData.basic_pay !== null && (isNaN(formData.basic_pay) || formData.basic_pay <= 0)) {
      newErrors.basic_pay = 'Basic pay must be a positive number';
    }

    if (formData.phone_no?.trim()) {
      const digits = formData.phone_no.replace(/\D/g, '');
      if (digits.length !== 10) {
        newErrors.phone_no = 'Phone number must be exactly 10 digits';
      } else if (!['6', '7', '8', '9'].includes(digits[0])) {
        newErrors.phone_no = 'Phone number must start with 6, 7, 8, or 9';
      }
    }

    // Check if service is from 2020 onwards
    const startDt = formData.start_date ? new Date(formData.start_date) : null;
    const is2020OrLater = startDt && !isNaN(startDt.getTime()) && startDt >= new Date('2020-01-01');

    // CONDITIONAL VALIDATION FOR ORDER_NO AND ORDER_DATE
    if (is2020OrLater) {
      // For service periods from 2020 onwards, order_no and order_date are mandatory
      const trimmedOrderNo = formData.order_no ? formData.order_no.trim() : '';
      if (!trimmedOrderNo) {
        newErrors.order_no = 'Order number is required for service periods from 2020 onwards';
      } else {
        // Only validate format if there's content
        if (!orderNoRegex.test(trimmedOrderNo)) {
          newErrors.order_no = 'Order number contains invalid characters';
        } else if (trimmedOrderNo.length > 50) {
          newErrors.order_no = 'Order number must not exceed 50 characters';
        }
      }

      // Check order_date - FIXED: Should check if it's empty or falsy
      if (!formData.order_date || formData.order_date.trim() === '') {
        newErrors.order_date = 'Order date is required for service periods from 2020 onwards';
      }
    } else {
      // For service periods before 2020, order_no and order_date are optional
      // but if provided, they must be valid
      if (formData.order_no && formData.order_no.trim() !== '') {
        const trimmedOrderNo = formData.order_no.trim();
        if (!orderNoRegex.test(trimmedOrderNo)) {
          newErrors.order_no = 'Order number contains invalid characters';
        } else if (trimmedOrderNo.length > 50) {
          newErrors.order_no = 'Order number must not exceed 50 characters';
        }
      }
    }

    // Date validations
    if (startDt && !isNaN(startDt.getTime())) {
      if (dojDt && startDt < dojDt) {
        newErrors.start_date = 'Start date cannot be before Date of Joining';
      }
      if (retirementDt && startDt > retirementDt) {
        newErrors.start_date = 'Start date cannot be after retirement date';
      }
    }

    const endDt = formData.end_date ? new Date(formData.end_date) : null;
    if (endDt && !isNaN(endDt.getTime())) {
      if (dojDt && endDt < dojDt) {
        newErrors.end_date = 'End date cannot be before Date of Joining';
      }
      if (retirementDt && endDt > retirementDt) {
        newErrors.end_date = 'End date cannot be after retirement date';
      }
      if (startDt && endDt < startDt) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    // Order date validation (SKIP if from SPARK)
    const orderDt = formData.order_date ? new Date(formData.order_date) : null;
    if (
      formData.order_date &&
      formData.order_date.trim() !== '' &&
      orderDt &&
      !isNaN(orderDt.getTime()) &&
      service?.fieldSources?.order_date !== 'SPARK'
    ) {
      if (orderDt > todayDt) {
        newErrors.order_date = 'Order date cannot be in the future';
      }
      if (dojDt && orderDt < dojDt) {
        newErrors.order_date = 'Order date cannot be before Date of Joining';
      }
      if (retirementDt && orderDt > retirementDt) {
        newErrors.order_date = 'Order date cannot be after retirement date';
      }
      if (startDt && orderDt > startDt) {
        newErrors.order_date = 'Order date must be on or before Start Date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const submitData = {
      ...formData,
      address: formData.address ? formData.address.trim() : '',
      order_no: formData.order_no ? formData.order_no.trim() : '', // Keep as empty string if cleared
      order_date: formData.order_date || null, // Keep as empty string if cleared
      other_details: formData.other_details ? formData.other_details.trim() : '',
      is_additional_charge: formData.is_additional_charge === 'yes',
    };
    
    const spark_data = {};
    const user_data = {};

    Object.keys(submitData).forEach((key) => {
      if (
        service?.fieldSources?.[key] === 'SPARK' &&
        submitData[key] === service[key] &&
        submitData[key] !== null &&
        submitData[key] !== '' &&
        submitData[key] !== 'N/A'
      ) {
        spark_data[key] = submitData[key];
      } else {
        user_data[key] = submitData[key];
      }
    });

    save({ spark_data, user_data });
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-700 dark:text-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-4xl sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
          >
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </button>
            </div>
            <div className="w-full">
              <form onSubmit={handleSubmit}>
                <div className="space-y-12">
                  {/* Service Details Section */}
                  <div>
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-2">Service Details</h3>
                    {/* Red warning banner when DOJ is missing */}
                    {showDojWarning && (
                      <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-300">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Personal Details Required</h3>
                            <div className="mt-2 text-sm text-red-700">
                              <p>Service Details cannot be added or edited until your Personal Details, including Date of Joining, are saved.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* General validation error */}
                    {errors.general && (
                      <p className="text-red-600 text-sm text-center mb-4 font-medium">{errors.general}</p>
                    )}
                    <div className="mb-5 flex justify-end">
                      <div className="flex items-center space-x-4 border rounded-md px-3 py-2 bg-white dark:bg-gray-800">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center p-0.5 rounded-full bg-orange-100 text-orange-600 text-xs">
                            <BoltIcon className="w-2 h-2" />
                          </span>
                          <span className="text-sm text-gray-700 dark:text-white">Synced from SPARK</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-xs">
                            <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                              <circle cx="4" cy="4" r="3" />
                            </svg>
                          </span>
                          <span className="text-sm text-gray-700 dark:text-white">Updated by AS-II</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 sm:grid-cols-1">
                      {/* Dropdown Fields */}
                      {[
                        { label: 'Designation', id: 'designation_id', options: designations, nameKey: 'designation' },
                        { label: 'Ministry', id: 'ministry_id', options: ministries, nameKey: 'ministry' },
                        {
                          label: 'Department',
                          id: 'administrative_department_id',
                          options: departments,
                          nameKey: 'administrative_department',
                        },
                        { label: 'Office', id: 'agency_id', options: implementingAgencies, nameKey: 'agency' },
                        { label: 'State', id: 'state_id', options: states, nameKey: 'state' },
                        {
                          label: 'District',
                          id: 'district_id',
                          options: filteredDistricts,
                          nameKey: 'district',
                        },
                        { label: 'Grade', id: 'grade_id', options: grades, nameKey: 'grade' },
                        { label: 'Level', id: 'level_id', options: levels, nameKey: 'level' },
                        { label: 'Posting Type', id: 'posting_type_id', options: postingTypes, nameKey: 'posting_types' },
                      ].map((field) => (
                        <div key={field.id} className="mb-4 relative">
                          <label className="block text-sm font-medium text-gray-700 dark:text-white">
                            {field.label}
                            {requiredFields.includes(field.id) && (
                              <span className="text-red-500 font-semibold"> *</span>
                            )}
                          </label>
                          {renderSparkIndicator(field.id)}
                          {renderGadOfficerIndicator(field.id)}
                          <select
                            id={field.id}
                            name={field.id}
                            value={formData[field.id] || ''}
                            onChange={handleChange}
                            disabled={isDisabled(field.id)}
                            className={getFieldClassName(field.id)}
                          >
                            <option value="">Select {field.label}</option>
                            {field.options.map((item) => (
                              <option key={item[field.id]} value={item[field.id]}>
                                {item[field.nameKey] || 'Unnamed'}
                              </option>
                            ))}
                          </select>
                          {errors[field.id] && <p className="text-red-500 text-sm mt-1">{errors[field.id]}</p>}
                        </div>
                      ))}
                      {/* Is Additional Charge */}
                      <div className="mb-4 relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-white">
                          Is Additional Charge?
                          <span className="text-red-500 font-semibold"> *</span>
                        </label>
                        {renderSparkIndicator('is_additional_charge')}
                        {renderGadOfficerIndicator('is_additional_charge')}
                        <div className="flex items-center space-x-4 mt-1">
                          {[
                            { id: 'yes', name: 'Yes' },
                            { id: 'no', name: 'No' },
                          ].map((item) => (
                            <label key={item.id} className="inline-flex items-center">
                              <input
                                type="radio"
                                id={`is_additional_charge_${item.id}`}
                                name="is_additional_charge"
                                value={item.id}
                                checked={formData.is_additional_charge === item.id}
                                onChange={handleChange}
                                disabled={isDisabled('is_additional_charge')}
                                className="form-radio text-indigo-600"
                              />
                              <span className="ml-2 text-gray-900 dark:text-white">{item.name}</span>
                            </label>
                          ))}
                        </div>
                        {errors.is_additional_charge && (
                          <p className="text-red-500 text-sm mt-1">{errors.is_additional_charge}</p>
                        )}
                      </div>
                      {/* Address Textarea */}
                      <div className="mb-4 relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-white">
                          Address
                          <span className="text-red-500 font-semibold"> *</span>
                        </label>
                        {renderSparkIndicator('address')}
                        {renderGadOfficerIndicator('address')}
                        <textarea
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleAddressChange}
                          disabled={isDisabled('address')}
                          className={getFieldClassName('address')}
                          maxLength={100}
                        />
                        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                      </div>
                      {/* Phone Number */}
                      <div className="mb-4 relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-white">
                          Phone Number
                          {/* <span className="text-red-500 font-semibold"> *</span> */}
                        </label>
                        {renderSparkIndicator('phone_no')}
                        {renderGadOfficerIndicator('phone_no')}
                        <input
                          id="phone_no"
                          name="phone_no"
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="Enter 10-digit phone number"
                          value={formData.phone_no}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const onlyDigits = inputValue.replace(/\D/g, '').slice(0, 10);
                            let phoneError = null;
                            if (onlyDigits.length > 0) {
                              if (onlyDigits.length !== 10) {
                                phoneError = 'Phone number must be exactly 10 digits';
                              } else if (!['6', '7', '8', '9'].includes(onlyDigits[0])) {
                                phoneError = 'Phone number must start with 6, 7, 8, or 9';
                              }
                            }
                            setFormData((prev) => ({ ...prev, phone_no: onlyDigits }));
                            setErrors((prev) => ({
                              ...prev,
                              phone_no: phoneError
                            }));
                          }}
                          disabled={isDisabled('phone_no')}
                          className={getFieldClassName('phone_no')}
                        />
                        {errors.phone_no && <p className="text-red-500 text-sm mt-1">{errors.phone_no}</p>}
                      </div>
                      {/* Start Date */}
                      <div className="mb-4 relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-white">
                          Start Date
                          <span className="text-red-500 font-semibold"> *</span>
                        </label>
                        {renderSparkIndicator('start_date')}
                        {renderGadOfficerIndicator('start_date')}
                        <input
                          type="date"
                          id="start_date"
                          name="start_date"
                          value={formData.start_date}
                          min={userDates.doj || ''}
                          max={userDates.retirementDate || ''}
                          onChange={handleChange}
                          disabled={showDojWarning || isDisabled('start_date')}
                          className={getFieldClassName('start_date')}
                        />
                        {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
                      </div>
                      {/* End Date */}
                      <div className="mb-4 relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-white">
                          End Date <span className="text-red-500 font-semibold"> *</span>
                        </label>
                        {renderSparkIndicator('end_date')}
                        {renderGadOfficerIndicator('end_date')}
                        <input
                          type="date"
                          id="end_date"
                          name="end_date"
                          value={formData.end_date}
                          onChange={handleChange}
                          disabled={showDojWarning || isDisabled('end_date')}
                          className={getFieldClassName('end_date')}
                          min={formData.start_date || userDates.doj || ''}
                          max={userDates.retirementDate || ''}
                        />
                        {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
                      </div>
                      {/* Order No */}
                      <div className="mb-4 relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-white">
                          Order No
                          {isServiceFrom2020Onwards(formData.start_date) && (
                            <span className="text-red-500 font-semibold"> *</span>
                          )}
                        </label>
                        {renderSparkIndicator('order_no')}
                        {renderGadOfficerIndicator('order_no')}
                        <input
                          id="order_no"
                          name="order_no"
                          type="text"
                          value={formData.order_no}
                          onChange={handleOrderNoChange}
                          disabled={isDisabled('order_no')}
                          className={getFieldClassName('order_no')}
                          maxLength={50}
                        />
                        {errors.order_no && <p className="text-red-500 text-sm mt-1">{errors.order_no}</p>}
                      </div>
                      {/* Order Date */}
                      <div className="mb-4 relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-white">
                          Order Date
                          {isServiceFrom2020Onwards(formData.start_date) && (
                            <span className="text-red-500 font-semibold"> *</span>
                          )}
                        </label>
                        {renderSparkIndicator('order_date')}
                        {renderGadOfficerIndicator('order_date')}
                        <input
                          type="date"
                          id="order_date"
                          name="order_date"
                          value={formData.order_date || ''}
                          onChange={handleChange}
                          disabled={showDojWarning || isDisabled('order_date')}
                          className={getFieldClassName('order_date')}
                          min={userDates.doj || ''}
                          max={todayStr}
                        />
                        {errors.order_date && <p className="text-red-500 text-sm mt-1">{errors.order_date}</p>}
                      </div>
                      {/* Basic Pay / Scale of Pay */}
                      <div className="mb-4 relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-white">
                          {getBasicPayLabel()}
                        </label>
                        {renderSparkIndicator('basic_pay')}
                        {renderGadOfficerIndicator('basic_pay')}
                        <input
                          id="basic_pay"
                          name="basic_pay"
                          type="number"
                          value={formData.basic_pay ?? ''}
                          onChange={handleChange}
                          disabled={isDisabled('basic_pay')}
                          className={getFieldClassName('basic_pay')}
                        />
                        {errors.basic_pay && <p className="text-red-500 text-sm mt-1">{errors.basic_pay}</p>}
                      </div>
                      {/* Other Details Textarea */}
                      <div className="mb-4 relative col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-white">
                          Other Details
                        </label>
                        {renderSparkIndicator('other_details')}
                        {renderGadOfficerIndicator('other_details')}
                        <textarea
                          id="other_details"
                          name="other_details"
                          value={formData.other_details}
                          onChange={handleOtherDetailsChange}
                          disabled={isDisabled('other_details')}
                          className={getFieldClassName('other_details')}
                          maxLength={250}
                        />
                        {errors.other_details && <p className="text-red-500 text-sm mt-1">{errors.other_details}</p>}
                      </div>
                    </div>
                  </div>
                  {/* Save & Cancel Buttons */}
                  <div className="mt-6 flex items-center justify-end gap-x-6">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={showDojWarning}
                      className={`rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                        showDojWarning
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600'
                      }`}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}