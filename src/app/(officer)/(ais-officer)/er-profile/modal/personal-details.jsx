'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon, BoltIcon } from '@heroicons/react/24/solid';
import { getServiceTypeName } from '@/utils/serviceTypeUtils';
import { useProfileCompletion } from '@/contexts/Profile-completion-context';
import { handleStateDistrictChange } from '@/utils/mapping';

const fields = [
  { label: 'Honorifics', key: 'honorifics', isSelect: true },
  { label: 'First Name', key: 'first_name' },
  { label: 'Last Name', key: 'last_name' },
  { label: 'Karmasri ID', key: 'identity_number' },
  { label: 'AIS Number', key: 'ais_number' },
  { label: 'PEN', key: 'pen_number' },
  { label: 'Allotment Year', key: 'allotment_year' },
  {label: 'Date of Joining', key: 'date_of_joining' },
  { label: 'Source of Recruitment', key: 'source_of_recruitment_id', isSelect: true, idForSelect: 'recruitment_id' },
  { label: 'Service Type', key: 'service_type_id' },
  { label: 'Cadre', key: 'cadre_id', isSelect: true, idForSelect: 'cadre_id' },
  { label: 'Date of Birth', key: 'dob' },
  { label: 'Age', key: 'age' },
  { label: 'Gender', key: 'gender_id', isSelect: true, idForSelect: 'gender_id' },
  { label: 'Blood Group', key: 'blood_group_id', isSelect: true, idForSelect: 'blood_group_id' },
  { label: 'Email', key: 'email' },
  { label: 'Alternate Email', key: 'alternative_email' },
  { label: 'Mobile Number', key: 'mobile_no' },
  { label: 'Alternative Mobile Number', key: 'alternative_mobile_no' },
  { label: 'PAN', key: 'pan_no' },
  { label: 'PF Account Number', key: 'pf_number' },
  { label: 'PRAN (NPS)', key: 'praan_number' },
  { label: 'Category', key: 'category_id', isSelect: true, idForSelect: 'category_id' },
  { label: 'Languages Known', key: 'languages_known' },
  { label: 'Retirement Date', key: 'retirement_date' },
  { label: 'Mode of Retirement', key: 'retirement_id', isSelect: true, idForSelect: 'retirement_id' },
  { label: 'Mother Tongue', key: 'mother_tongue_id', isSelect: true, idForSelect: 'language_id' },
  { label: 'Official Address', key: 'address_line1_com' },
  { label: 'Official Address', key: 'address_line2_com' },
  { label: 'District (Official Address)', key: 'district_id_com', isSelect: true, idForSelect: 'district_id' },
  { label: 'State (Official Address)', key: 'state_id_com', isSelect: true, idForSelect: 'state_id' },
  { label: 'Pincode (Official Address)', key: 'pin_code_com' },
  { label: 'Permanent Residential Address', key: 'address_line1_per' },
  { label: 'Permanent Residential Address', key: 'address_line2_per' },
  { label: 'District (Permanent Residential Address)', key: 'district_id_per', isSelect: true, idForSelect: 'district_id' },
  { label: 'State (Permanent Residential Address)', key: 'state_id_per', isSelect: true, idForSelect: 'state_id' },
  { label: 'Pincode (Permanent Residential Address)', key: 'pin_code_per' },
];

const disabledFields = ['service_type_id', 'age', 'identity_number', 'mobile_no', 'email', 'retirement_date', 'dob'];

const requiredFields = [
  'honorifics',
  'first_name',
  'last_name',
  'ais_number',
  'email',
  'allotment_year',
  'date_of_joining',
  'pen_number',
  'source_of_recruitment_id',
  'cadre_id',
  'dob',
  'gender_id',
  'blood_group_id',
  'mother_tongue_id',
  'service_type_id',
  'mobile_no',
  'address_line1_com',
  'district_id_com',
  'state_id_com',
  'pin_code_com',
  'address_line1_per',
  'district_id_per',
  'state_id_per',
  'pin_code_per',
];

const SPARK_FIELDS = [
  'address_line1_com',
  'address_line2_com',
  'pin_code_com',
  'district_id_com',
  'state_id_com',
  'mobile_no',
  'mother_tongue_id',
  'gender_id',
  'blood_group_id',
  'address_line1_per',
  'address_line2_per',
  'pin_code_per',
  'district_id_per',
  'state_id_per',
  'category_id',
  'first_name',
  'last_name',
  'pan_no',
  'date_of_joining',
];

const idFields = [
  'source_of_recruitment_id',
  'cadre_id',
  'gender_id',
  'blood_group_id',
  'category_id',
  'mother_tongue_id',
  'retirement_id',
  'state_id_com',
  'state_id_per',
  'district_id_com',
  'district_id_per',
  'service_type_id',
];

export function ModalPersonalDetails({ open, setOpen, personalDetails, onSave, masterData, sparkFields, officerFields }) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { updateSectionProgress } = useProfileCompletion();
  const [userUpdatedFields, setUserUpdatedFields] = useState(new Set());
  const [languageSearchTerm, setLanguageSearchTerm] = useState('');

  const filteredDistrictsCom = useMemo(() => {
    if (!open || !masterData.district) return [];
    const selectedStateCom = formData.state_id_com ? parseInt(formData.state_id_com, 10) : null;
    return masterData.district.filter((district) => district.state_id === selectedStateCom) || [];
  }, [open, formData.state_id_com, masterData.district]);

  const filteredDistrictsPer = useMemo(() => {
    if (!open || !masterData.district) return [];
    const selectedStatePer = formData.state_id_per ? parseInt(formData.state_id_per, 10) : null;
    return masterData.district.filter((district) => district.state_id === selectedStatePer) || [];
  }, [open, formData.state_id_per, masterData.district]);

  // Helper function to trim string values in an object
  const trimObjectStrings = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const trimmed = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        trimmed[key] = value.trim();
      } else {
        trimmed[key] = value;
      }
    }
    return trimmed;
  };

  const handleSelect = (value) => {
    setSelectedOptions((prev) => {
      let updatedSelection;
      if (prev.includes(value)) {
        updatedSelection = prev.filter((item) => item !== value);
      } else {
        updatedSelection = [...prev, value];
      }
      setFormData((prevState) => ({
        ...prevState,
        languages_known: updatedSelection,
      }));
      setUserUpdatedFields((prev) => new Set([...prev, 'languages_known']));
      return updatedSelection;
    });
  };

    const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    const sparkDateMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}:\d{2}:\d{2})$/);
    if (sparkDateMatch) {
      const [_, day, month, year] = sparkDateMatch;
      return `${year}-${month}-${day}`;
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (open) {
      // Trim all string fields in personalDetails
      const trimmedDetails = trimObjectStrings(personalDetails);
      
      const languagesKnown = Array.isArray(trimmedDetails.languages_known)
        ? trimmedDetails.languages_known
        : typeof trimmedDetails.languages_known === 'string'
          ? JSON.parse(trimmedDetails.languages_known || '[]')
          : [];
      
      setFormData({
        ...trimmedDetails,
        age: calculateAge(trimmedDetails.dob),
        retirement_date: formatDateForInput(trimmedDetails.retirement_date),
        date_of_joining: formatDateForInput(trimmedDetails.date_of_joining),
        languages_known: languagesKnown,
      });
      setSelectedOptions(languagesKnown);
      setErrors({});
      setUserUpdatedFields(new Set());
    }
  }, [open, personalDetails]);


  const calculateAge = (dob) => {
    if (!dob) return '';
    let birthDate;
    const sparkMatch = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}:\d{2}:\d{2})$/);
    if (sparkMatch) {
      const [_, day, month, year] = sparkMatch;
      birthDate = new Date(`${year}-${month}-${day}`);
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(dob)) {
      const [day, month, year] = dob.split('-');
      birthDate = new Date(`${year}-${month}-${day}`);
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) {
      const [day, month, year] = dob.split('/');
      birthDate = new Date(`${year}-${month}-${day}`);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      const [year, month, day] = dob.split('-');
      birthDate = new Date(`${year}-${month}-${day}`);
    } else {
      birthDate = new Date(dob);
    }
    if (isNaN(birthDate.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const calculateAgeAtDate = (dob, targetDate) => {
  if (!dob || !targetDate) return null;
  const birthDate = new Date(dob);
  const target = new Date(targetDate);
  if (isNaN(birthDate.getTime()) || isNaN(target.getTime())) return null;
  let age = target.getFullYear() - birthDate.getFullYear();
  const monthDiff = target.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && target.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

    useEffect(() => {
    if (!open) {
      setLanguageSearchTerm('');
    }
  }, [open]);

  const getMaxDOBFor18Years = () => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    return today.toISOString().split('T')[0];
  };


  // Define the validation pattern once
  const AIS_NUMBER_PATTERN = /^(?=.*[A-Z])(?=.*[0-9])[A-Z0-9]{10}$/;


  const validateForm = () => {
    const newErrors = {};
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
    const isValidPAN = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(String(pan || '').toUpperCase().trim());
    const isValidMobile = (num) => /^\d{10}$/.test(String(num || '').trim());
    const isValidPincode = (pin) => /^\d{6}$/.test(String(pin ?? '').trim());
    const isValidPRAN = (praan) => /^\d{12}$/.test(String(praan || '').trim());
    const isValidPFNumber = (pf) => /^\d{12}$/.test(String(pf || '').trim()); 
    const isValidAISNumber = (ais) => {
    const trimmed = String(ais || '').trim().toUpperCase();
    return AIS_NUMBER_PATTERN.test(trimmed);
    };
    const isValidDate = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  };

    const requiredFieldsSet = new Set(requiredFields);
    const requiredSelects = fields
      .filter((f) => f.isSelect && requiredFieldsSet.has(f.key))
      .map((f) => f.key);
      
    const requiredTexts = fields
      .filter((f) => !f.isSelect && requiredFieldsSet.has(f.key))
      .map((f) => f.key);

    requiredSelects.forEach((key) => {
      if (!formData[key] || formData[key] === '') {
        newErrors[key] = 'This field is required';
      }
    });

    requiredTexts.forEach((key) => {
      const value = formData[key];
      if (!value || value.toString().trim() === '') {
        newErrors[key] = 'This field is required';
      }
    });

    if (requiredFields.includes('languages_known') && (!formData.languages_known || formData.languages_known.length === 0)) {
      newErrors.languages_known = 'At least one language must be selected';
    }

    if (formData.dob) {
      if (!isValidDate(formData.dob)) {
        newErrors.dob = 'Enter a valid date';
      } else {
        const dobDate = new Date(formData.dob);
        const maxDOB = new Date(getMaxDOBFor18Years());
        if (dobDate > maxDOB) {
          newErrors.dob = 'You must be at least 18 years old';
        }
      }
    }
    if (formData.retirement_date && !isValidDate(formData.retirement_date)) {
      newErrors.retirement_date = 'Enter a valid date';
    }
    // New validation for Date of Joining age range
  if (formData.date_of_joining && formData.dob) {
    if (!isValidDate(formData.date_of_joining)) {
      newErrors.date_of_joining = 'Enter a valid date';
    } else {
      const ageAtJoining = calculateAgeAtDate(formData.dob, formData.date_of_joining);
      if (ageAtJoining !== null && (ageAtJoining < 18 || ageAtJoining > 60)) {
        newErrors.date_of_joining = 'Age at joining must be between 18 and 60 years';
      }
    }
  }

    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (formData.alternative_email && formData.alternative_email.trim() !== '' && !isValidEmail(formData.alternative_email)) {
      newErrors.alternative_email = 'Enter a valid alternate email';
    }

    if (formData.email && formData.alternative_email && formData.email.trim().toLowerCase() === formData.alternative_email.trim().toLowerCase()) {
      newErrors.alternative_email = 'Alternate email must be different from primary email';
    }

    if (formData.mobile_no && !isValidMobile(formData.mobile_no)) {
      newErrors.mobile_no = 'Mobile number must be exactly 10 digits';
    }

    const primaryMobile = String(formData.mobile_no || '').trim();
    const altMobile = String(formData.alternative_mobile_no || '').trim();

    if (altMobile !== '' && !isValidMobile(altMobile)) {
      newErrors.alternative_mobile_no = 'Alternate mobile number must be 10 digits';
    }

    if (primaryMobile && altMobile && primaryMobile === altMobile) {
      newErrors.alternative_mobile_no = 'Alternate mobile number must be different from primary mobile number';
    }

    if (formData.pan_no && !isValidPAN(formData.pan_no)) {
      newErrors.pan_no = 'Invalid PAN format';
    }

    if (formData.pin_code_com && !isValidPincode(formData.pin_code_com)) {
      newErrors.pin_code_com = 'Pincode must be 6 digits';
    }

    if (formData.pin_code_per && !isValidPincode(formData.pin_code_per)) {
      newErrors.pin_code_per = 'Pincode must be 6 digits';
    }
    if (formData.praan_number && !isValidPRAN(formData.praan_number)) {
      newErrors.praan_number = 'PRAN must be exactly 12 numeric digits (0-9 only,no letters, spaces, or special characters).';
   }

   const shouldValidatePFNumber = !isFieldDisabled('pf_number');
   if (shouldValidatePFNumber && formData.pf_number && !isValidPFNumber(formData.pf_number)) {
        newErrors.pf_number = 'PF Account Number must be exactly 12 numeric digits (0-9 only, no letters, spaces, or special characters).'; // Updated error message
    }
   if (formData.ais_number && !isValidAISNumber(formData.ais_number)) {
     newErrors.ais_number = 'AIS Number must be exactly 10 alphanumeric characters (e.g., 01KL023300 or KL09676600)';
   }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Always trim the value before processing
    const trimmedValue = typeof value === 'string' ? value.trim() : value;

    if (name === 'state_id_com' || name === 'district_id_com') {
      handleStateDistrictChange(e, formData, setFormData, 'state_id_com', 'district_id_com', masterData.district);
    } else if (name === 'state_id_per' || name === 'district_id_per') {
      handleStateDistrictChange(e, formData, setFormData, 'state_id_per', 'district_id_per', masterData.district);
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: trimmedValue,
      }));
    }

    setUserUpdatedFields((prev) => new Set([...prev, name]));

    if (name === 'dob') {
      setFormData((prev) => ({ ...prev, age: calculateAge(trimmedValue) }));
      // New: Validate DOJ if it exists after DOB change
      if (formData.date_of_joining) {
        const ageAtJoining = calculateAgeAtDate(trimmedValue, formData.date_of_joining);
        let dojError = '';
        if (ageAtJoining !== null && (ageAtJoining < 18 || ageAtJoining > 60)) {
          dojError = 'Age at joining must be between 18 and 60 years';
        }
        setErrors((prevErrors) => ({
          ...prevErrors,
          date_of_joining: dojError,
        }));
      }
    }

    let error = '';
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
    const isValidPAN = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(String(pan || '').toUpperCase().trim());
    const isValidMobile = (num) => /^\d{10}$/.test(String(num || '').trim());
    const isValidPincode = (pin) => /^\d{6}$/.test(String(pin || '').trim());
    const isValidDate = (dateStr) => {
      if (!dateStr) return true;
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    };

    switch (name) {
      case 'email':
      case 'alternative_email':
        if (trimmedValue && !isValidEmail(trimmedValue)) {
          error = 'Enter a valid email address';
        }
        break;
      case 'mobile_no':
      case 'alternative_mobile_no':
        if (trimmedValue && !isValidMobile(trimmedValue)) {
          error = 'Mobile number must be 10 digits';
        }
        break;
      case 'pan_no':
        if (trimmedValue && !isValidPAN(trimmedValue)) {
          error = 'PAN must be 10 characters: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)';
        }
        break;
      case 'pin_code_com':
      case 'pin_code_per':
        if (trimmedValue && !isValidPincode(trimmedValue)) {
          error = 'Pincode must be 6 digits';
        }
        break;
      case 'praan_number':
        if (trimmedValue && !/^\d{12}$/.test(trimmedValue)) {
          error = 'PRAN must be exactly 12 numeric digits (0-9 only—no letters, spaces, or special characters).';
        }
        break;
      case 'pf_number':
        if (!isFieldDisabled('pf_number') && trimmedValue && !/^\d{12}$/.test(trimmedValue)) {
          error = 'PF Account Number must be exactly 12 numeric digits (0-9 only, no letters, spaces, or special characters).';
        }
        break;
      case 'ais_number':
        const upperAIS = trimmedValue.toUpperCase();
        if (trimmedValue && !AIS_NUMBER_PATTERN.test(upperAIS)) {
          error = 'AIS Number must be exactly 10 alphanumeric characters and contain both letters and numbers (e.g., 01KL023300 or KL09676600)';
        }
        break;
      case 'dob':
        if (trimmedValue && !isValidDate(trimmedValue)) {
          error = 'Enter a valid date';
        } else if (trimmedValue) {
          const dobDate = new Date(trimmedValue);
          const maxDOB = new Date(getMaxDOBFor18Years());
          if (dobDate > maxDOB) {
            error = 'You must be at least 18 years old';
          }
        }
        break;
      case 'date_of_joining':
        if (trimmedValue && !isValidDate(trimmedValue)) {
          error = 'Enter a valid date';
        } else if (trimmedValue && formData.dob) {
          const ageAtJoining = calculateAgeAtDate(formData.dob, trimmedValue);
          if (ageAtJoining !== null && (ageAtJoining < 18 || ageAtJoining > 60)) {
            error = 'Age at joining must be between 18 and 60 years';
          }
        }
        break;
      case 'retirement_date':
        if (trimmedValue && !isValidDate(trimmedValue)) {
          error = 'Enter a valid date';
        }
        break;
      default:
        if (requiredFields.includes(name) && trimmedValue === '') {
          error = 'This field is required';
        }
        break;
    }

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const isValid = validateForm();
    if (!isValid) return;

    // Trim all string fields in formData before processing
    let processedData = trimObjectStrings({ ...formData, age: calculateAge(formData.dob) });

    // Parse int for id fields
    idFields.forEach((key) => {
      if (processedData[key] !== undefined && processedData[key] !== '') {
        const parsed = parseInt(processedData[key], 10);
        processedData[key] = isNaN(parsed) ? null : parsed;
      }
    });

    // Parse languages_known
    if (processedData.languages_known && Array.isArray(processedData.languages_known)) {
      processedData.languages_known = processedData.languages_known
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id));
    }

    const sparkData = {};
    const userData = {};

    // Add user changed fields to user_data
    userUpdatedFields.forEach((key) => {
      if (processedData.hasOwnProperty(key)) {
        userData[key] = processedData[key] ?? null;
      }
    });

    // Add unchanged SPARK_FIELDS to spark_data (skip if empty)
    SPARK_FIELDS.forEach((key) => {
      if (!userUpdatedFields.has(key) && processedData.hasOwnProperty(key)) {
        const value = processedData[key];
        if (value !== undefined && value !== null && value !== '') {
          sparkData[key] = value;
        }
      }
    });

    const updated_data = {
      spark_data: sparkData,
      user_data: userData,
    };

    await onSave(updated_data, userUpdatedFields);
    setOpen(false);
    setUserUpdatedFields(new Set());
  };

  const renderSelectOptions = (field) => {
    const keyMap = {
      source_of_recruitment_id: 'recruitment',
      cadre_id: 'cadre',
      gender_id: 'gender',
      state_id_com: 'state',
      state_id_per: 'state',
      district_id_com: 'district',
      district_id_per: 'district',
      mother_tongue_id: 'motherTongue',
      retirement_id: 'retirement',
      languages_known: 'languageKnown',
      category_id: 'category',
      blood_group_id: 'bloodGroup',
    };

    const masterKey = keyMap[field.key] || 'bloodGroup';
    let options = masterData[masterKey] || [];

    if (field.key === 'honorifics') {
      return (
        <>
          <option value="Mr.">Mr.</option>
          <option value="Ms.">Ms.</option>
          <option value="Mrs.">Mrs.</option>
          <option value="Dr.">Dr.</option>
        </>
      );
    }

    return options.map((option) => (
      <option key={option[field.idForSelect]} value={option[field.idForSelect]}>
        {option[masterKey] || option.recruitment || option.cadre || option.state || option.gender || option.district || option.language || option.retirement || option.category || option.motherTongue || option.blood_group || 'N/A'}
      </option>
    ));
  };

  const handleClose = () => {
    setFormData(personalDetails || {});
    setErrors({});
    setUserUpdatedFields(new Set());
    setOpen(false);
  };

    const isFieldDisabled = (fieldKey) => {
       if (disabledFields.includes(fieldKey)) return true;
       if (sparkFields.has(fieldKey) && personalDetails[fieldKey] && String(personalDetails[fieldKey]).trim() !== '') return true;
    return false;
    };

    const getFieldClassName = (fieldKey) => {
      const baseClasses = 'mt-1 block w-full rounded-md sm:text-sm p-2 border';

      if (sparkFields.has(fieldKey) && personalDetails[fieldKey] && String(personalDetails[fieldKey]).trim() !== '') {
        return `${baseClasses} bg-orange-50 text-gray-900 border-orange-200 cursor-not-allowed pointer-events-none dark:bg-indigo-900 dark:text-gray-200 dark:border-gray-600 `;
      }

      if (officerFields?.GAD_OFFICER?.includes(fieldKey)) {
        return `${baseClasses} bg-indigo-50 text-gray-900 border-indigo-200 cursor-not-allowed pointer-events-none dark:bg-gray-800 dark:text-white dark:border-indigo-500 `;
      }

      if (disabledFields.includes(fieldKey)) {
        return `${baseClasses} bg-gray-200 text-gray-900 border-gray-300 cursor-not-allowed pointer-events-none dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600 opacity-100`;
      }

      return `${baseClasses} border-gray-300 text-gray-900 bg-white dark:bg-gray-800 dark:border-gray-600`;
    };

  const renderSparkIndicator = (fieldKey) => {
    if (!sparkFields.has(fieldKey)) return null;
    
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

  const renderGadOfficerIndicator = (fieldKey) => {
    if (!officerFields.GAD_OFFICER.includes(fieldKey) || sparkFields.has(fieldKey)) return null;
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

  return (
    <>
      <Dialog open={open} onClose={setOpen} className="relative z-50">
       <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-700 dark:text-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-4xl sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95">
             <h3 className="text-lg font-bold leading-6 text-gray-900 dark:text-white mb-2">Personal Details</h3>
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button
                type="button"
                onClick={handleClose}
                className="rounded p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
               <div className="mt-3 mb-5 flex justify-end">
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

                <form onSubmit={handleSave} className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Basic Info Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 border-l-4 border-l-indigo-500 px-3 py-5 mb-5 sm:col-span-2">
                      <h3 className="text-lg font-bold leading-6 text-gray-900 dark:text-white mb-5">Basic Details</h3>
                      <div className="grid md:grid-cols-2 gap-4 sm:grid-cols-1">
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 dark:text-white">
                            Honorifics
                            {requiredFields.includes('honorifics') && <span className="text-red-500 font-semibold"> *</span>}
                          </label>
                          
                          {renderSparkIndicator('honorifics')}
                          {renderGadOfficerIndicator('honorifics')}
                          <select
                            name="honorifics"
                            value={formData.honorifics || ''}
                            onChange={handleChange}
                            // required={requiredFields.includes('honorifics')}
                            disabled={isFieldDisabled('honorifics')}
                            className={getFieldClassName('honorifics')}
                          >
                            <option value="">Select Honorifics</option>
                            {renderSelectOptions({ key: 'honorifics', idForSelect: 'honorifics' })}
                          </select>
                          {errors.honorifics && <p className="text-red-500 text-sm mt-1">{errors.honorifics}</p>}
                        </div>
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 dark:text-white">
                            First Name
                            {requiredFields.includes('first_name') && <span className="text-red-500 font-semibold"> *</span>}
                          </label>
                          {renderSparkIndicator('first_name')}
                          {renderGadOfficerIndicator('first_name')}
                          <input
                            type="text"
                            name="first_name"
                            value={formData.first_name || ''}
                            onChange={handleChange}
                            // required={requiredFields.includes('first_name')}
                            disabled={isFieldDisabled('first_name')}
                            className={getFieldClassName('first_name')}
                          />
                          {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
                        </div>
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 dark:text-white">
                            Last Name
                            {requiredFields.includes('last_name') && <span className="text-red-500 font-semibold"> *</span>}
                          </label>
                          {renderSparkIndicator('last_name')}
                          {renderGadOfficerIndicator('last_name')}
                          <input
                            type="text"
                            name="last_name"
                            value={formData.last_name || ''}
                            onChange={handleChange}
                            // required={requiredFields.includes('last_name')}
                            disabled={isFieldDisabled('last_name')}
                            className={getFieldClassName('last_name')}
                          />
                          {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
                        </div>
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 dark:text-white">
                            Date of Birth
                            {requiredFields.includes('dob') && <span className="text-red-500 font-semibold"> *</span>}
                          </label>
                          {renderSparkIndicator('dob')}
                          {renderGadOfficerIndicator('dob')}
                          <input
                            type="date"
                            name="dob"
                            value={formData.dob || ''}
                            onChange={handleChange}
                            // required={requiredFields.includes('dob')}
                            disabled={isFieldDisabled('dob')}
                            max={getMaxDOBFor18Years()}
                            className={getFieldClassName('dob')}
                          />
                          {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob}</p>}
                        </div>
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 dark:text-white">
                            Age
                          </label>
                          {renderSparkIndicator('dob')}
                          {renderGadOfficerIndicator('dob')}
                          <input
                            type="text"
                            name="age"
                            value={formData.age || ''}
                            disabled
                            className={getFieldClassName('age')}
                          />
                        </div>
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 dark:text-white">
                            Gender
                            {requiredFields.includes('gender_id') && <span className="text-red-500 font-semibold"> *</span>}
                          </label>
                          {renderSparkIndicator('gender_id')}
                          {renderGadOfficerIndicator('gender_id')}
                          <select
                            name="gender_id"
                            value={formData.gender_id || ''}
                            onChange={handleChange}
                            // required={requiredFields.includes('gender_id')}
                            disabled={isFieldDisabled('gender_id')}
                            className={getFieldClassName('gender_id')}
                          >
                            <option value="">Select Gender</option>
                            {renderSelectOptions({ key: 'gender_id', idForSelect: 'gender_id' })}
                          </select>
                          {errors.gender_id && <p className="text-red-500 text-sm mt-1">{errors.gender_id}</p>}
                        </div>
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 dark:text-white">
                            Blood Group
                            {requiredFields.includes('blood_group_id') && <span className="text-red-500 font-semibold"> *</span>}
                          </label>
                          {renderSparkIndicator('blood_group_id')}
                          {renderGadOfficerIndicator('blood_group_id')}
                          <select
                            name="blood_group_id"
                            value={formData.blood_group_id || ''}
                            onChange={handleChange}
                            // required={requiredFields.includes('blood_group_id')}
                            disabled={isFieldDisabled('blood_group_id')}
                            className={getFieldClassName('blood_group_id')}
                          >
                            <option value="">Select Blood Group</option>
                            {renderSelectOptions({ key: 'blood_group_id', idForSelect: 'blood_group_id' })}
                          </select>
                          {errors.blood_group_id && <p className="text-red-500 text-sm mt-1">{errors.blood_group_id}</p>}
                        </div>
                      
                      </div>
                    </div>

                  {/* Identification Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 border-l-4 border-l-green-500 px-3 py-5 mb-5 sm:col-span-2">
                    <h3 className="text-lg font-bold leading-6 text-gray-900 dark:text-white mb-5">Identification Details</h3>
                    <div className="grid md:grid-cols-2 gap-4 sm:grid-cols-1">
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Karmasri ID
                        </label>
                        {renderSparkIndicator('identity_number')}
                        {renderGadOfficerIndicator('identity_number')}
                        <input
                          type="text"
                          name="identity_number"
                          value={formData.identity_number || ''}
                          onChange={handleChange}
                          disabled={isFieldDisabled('identity_number')}
                          className={getFieldClassName('identity_number')}
                        />
                      </div>
                      <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-white">
                            AIS Number
                            {requiredFields.includes('ais_number') && <span className="text-red-500 font-semibold"> *</span>}
                          </label>
                          {renderSparkIndicator('ais_number')}
                          {renderGadOfficerIndicator('ais_number')}
                          <div className="relative">
                          <input
                            type="text"
                            name="ais_number"
                            value={formData.ais_number || ''}
                            onChange={handleChange}
                            // required={requiredFields.includes('ais_number')}
                            disabled={isFieldDisabled('ais_number')}
                            className={`${getFieldClassName('ais_number')} pr-12`}
                            maxLength={10}
                            />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                        {(formData.ais_number || '').length}/10
                        </div>
                      </div>
                      {errors.ais_number && <p className="text-red-500 text-sm mt-1">{errors.ais_number}</p>}
                          </div>
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-white">
                          PEN
                          {requiredFields.includes('pen_number') && <span className="text-red-500 font-semibold"> *</span>}
                        </label>
                        {renderSparkIndicator('pen_number')}
                        {renderGadOfficerIndicator('pen_number')}
                        <input
                          type="text"
                          name="pen_number"
                          value={formData.pen_number || ''}
                          onChange={handleChange}
                          // required={requiredFields.includes('pen_number')}
                          disabled={isFieldDisabled('pen_number')}
                          className={getFieldClassName('pen_number')}
                        />
                        {errors.pen_number && <p className="text-red-500 text-sm mt-1">{errors.pen_number}</p>}
                      </div>
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-white">
                          PAN
                        </label>
                        {renderSparkIndicator('pan_no')}
                        {renderGadOfficerIndicator('pan_no')}
                        <input
                          type="text"
                          name="pan_no"
                          value={formData.pan_no || ''}
                          onChange={handleChange}
                          disabled={isFieldDisabled('pan_no')}
                          className={getFieldClassName('pan_no')}
                        />
                        {errors.pan_no && <p className="text-red-500 text-sm mt-1">{errors.pan_no}</p>}


                      </div>
                        <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-white">
                          PF Account Number
                        </label>
                        {renderSparkIndicator('pf_number')}
                        {renderGadOfficerIndicator('pf_number')}
                        <div className="relative">
                          <input
                            type="text"
                            name="pf_number"
                            value={formData.pf_number || ''}
                            onChange={handleChange} 
                            disabled={isFieldDisabled('pf_number')}
                            className={`${getFieldClassName('pf_number')} pr-12`}
                            maxLength={12}
                          />
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                            {(formData.pf_number || '').length}/12
                          </div>
                        </div>
                        {errors.pf_number && <p className="text-red-500 text-sm mt-1">{errors.pf_number}</p>}
                      </div>


                      <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                                PRAAN (NPS)
                      </label>
                      {renderSparkIndicator('praan_number')}
                      {renderGadOfficerIndicator('praan_number')}
                      <div className="relative">
                      <input
                      type="text"
                      name="praan_number"
                      value={formData.praan_number || ''}
                      onChange={handleChange}
                      disabled={isFieldDisabled('praan_number')}
                      className={`${getFieldClassName('praan_number')} pr-12`}
                      maxLength={12}
                        />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                      {(formData.praan_number || '').length}/12
                    </div>
                      </div>
                      {errors.praan_number && <p className="text-red-500 text-sm mt-1">{errors.praan_number}</p>}
                    </div>                    
                  </div>
                </div>

                 {/* Contact Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 border-l-4 border-l-cyan-500 px-3 py-5 mb-5 sm:col-span-2">
                  <h3 className="text-lg font-bold leading-6 text-gray-900 dark:text-white mb-5">Service Details</h3>
                  <div className="grid md:grid-cols-2 gap-4 sm:grid-cols-1">
                      <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Allotment Year
                        {requiredFields.includes('allotment_year') && <span className="text-red-500 font-semibold"> *</span>}
                      </label>
                      {renderSparkIndicator('allotment_year')}
                      {renderGadOfficerIndicator('allotment_year')}
                      <input
                        type="text"
                        name="allotment_year"
                        value={formData.allotment_year || ''}
                        onChange={handleChange}
                        // required={requiredFields.includes('allotment_year')}
                        disabled={isFieldDisabled('allotment_year')}
                        className={getFieldClassName('allotment_year')}
                      />
                      {errors.allotment_year && <p className="text-red-500 text-sm mt-1">{errors.allotment_year}</p>}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Date of Joining 
                        {requiredFields.includes('date_of_joining') && <span className="text-red-500 font-semibold"> *</span>}
                      </label>
                      {renderSparkIndicator('date_of_joining')}
                      {renderGadOfficerIndicator('date_of_joining')}
                      <input
                        type="date"
                        name="date_of_joining"
                        value={formData.date_of_joining || ''}
                        onChange={handleChange}
                        // required={requiredFields.includes('date_of_joining')}
                        disabled={isFieldDisabled('date_of_joining')}
                        className={getFieldClassName('date_of_joining')}
                      />
                      {errors.date_of_joining && <p className="text-red-500 text-sm mt-1">{errors.date_of_joining}</p>}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Source of Recruitment
                        {requiredFields.includes('source_of_recruitment_id') && <span className="text-red-500 font-semibold"> *</span>}
                      </label>
                      {renderSparkIndicator('source_of_recruitment_id')}
                      {renderGadOfficerIndicator('source_of_recruitment_id')}
                      <select
                        name="source_of_recruitment_id"
                        value={formData.source_of_recruitment_id || ''}
                        onChange={handleChange}
                        // required={requiredFields.includes('source_of_recruitment_id')}
                        disabled={isFieldDisabled('source_of_recruitment_id')}
                        className={getFieldClassName('source_of_recruitment_id')}
                      >
                        <option value="">Select Source</option>
                        {renderSelectOptions({ key: 'source_of_recruitment_id', idForSelect: 'recruitment_id' })}
                      </select>
                      {errors.source_of_recruitment_id && <p className="text-red-500 text-sm mt-1">{errors.source_of_recruitment_id}</p>}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Cadre
                        {requiredFields.includes('cadre_id') && <span className="text-red-500 font-semibold"> *</span>}
                      </label>
                      {renderSparkIndicator('cadre_id')}
                      {renderGadOfficerIndicator('cadre_id')}
                      <select
                        name="cadre_id"
                        value={formData.cadre_id || ''}
                        onChange={handleChange}
                        // required={requiredFields.includes('cadre_id')}
                        disabled={isFieldDisabled('cadre_id')}
                        className={getFieldClassName('cadre_id')}
                      >
                        <option value="">Select Cadre</option>
                        {renderSelectOptions({ key: 'cadre_id', idForSelect: 'cadre_id' })}
                      </select>
                      {errors.cadre_id && <p className="text-red-500 text-sm mt-1">{errors.cadre_id}</p>}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Service Type
                      </label>
                       {renderSparkIndicator('service_type_id')}
                      {renderGadOfficerIndicator('service_type_id')}
                      <input
                        type="text"
                        name="service_type_id"
                        value={getServiceTypeName(formData.service_type_id) || ''}
                        disabled
                        className={getFieldClassName('service_type_id')}
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Mode of Retirement
                      </label>
                      {renderSparkIndicator('retirement_id')}
                      {renderGadOfficerIndicator('retirement_id')}
                      <select
                        name="retirement_id"
                        value={formData.retirement_id || ''}
                        onChange={handleChange}
                        disabled={isFieldDisabled('retirement_id')}
                        className={getFieldClassName('retirement_id')}
                      >
                        <option value="">Select Mode</option>
                        {renderSelectOptions({ key: 'retirement_id', idForSelect: 'retirement_id' })}
                      </select>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Retirement Date
                      </label>
                      {renderSparkIndicator('retirement_date')}
                      {renderGadOfficerIndicator('retirement_date')}
                      <input
                        type="date"
                        name="retirement_date"
                        value={formData.retirement_date || ''}
                        onChange={handleChange}
                        disabled={isFieldDisabled('retirement_date')}
                        className={getFieldClassName('retirement_date')}
                      />
                      {errors.retirement_date && <p className="text-red-500 text-sm mt-1">{errors.retirement_date}</p>}
                    </div>
                  </div>
                </div>

                {/* Contact Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 border-l-4 border-l-purple-500 px-3 py-5 mb-5 sm:col-span-2">
                  <h3 className="text-lg font-bold leading-6 text-gray-900 dark:text-white mb-5">Contact Details</h3>
                  <div className="grid md:grid-cols-2 gap-4 sm:grid-cols-1">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Email
                        {requiredFields.includes('email') && <span className="text-red-500 font-semibold"> *</span>}
                      </label>
                      {renderSparkIndicator('email')}
                      {renderGadOfficerIndicator('email')}
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleChange}
                        // required={requiredFields.includes('email')}
                        disabled={isFieldDisabled('email')}
                        className={getFieldClassName('email')}
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Alternate Email
                      </label>
                      {renderSparkIndicator('alternative_email')}
                      {renderGadOfficerIndicator('alternative_email')}
                      <input
                        type="email"
                        name="alternative_email"
                        value={formData.alternative_email || ''}
                        onChange={handleChange}
                        disabled={isFieldDisabled('alternative_email')}
                        className={getFieldClassName('alternative_email')}
                      />
                      {errors.alternative_email && <p className="text-red-500 text-sm mt-1">{errors.alternative_email}</p>}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Mobile Number
                        {requiredFields.includes('mobile_no') && <span className="text-red-500 font-semibold"> *</span>}
                      </label>
                      {renderSparkIndicator('mobile_no')}
                      {renderGadOfficerIndicator('mobile_no')}
                      <input
                        type="text"
                        name="mobile_no"
                        value={formData.mobile_no || ''}
                        onChange={handleChange}
                        // required={requiredFields.includes('mobile_no')}
                        disabled={isFieldDisabled('mobile_no')}
                        className={getFieldClassName('mobile_no')}
                      />
                      {errors.mobile_no && <p className="text-red-500 text-sm mt-1">{errors.mobile_no}</p>}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Alternative Mobile Number
                      </label>
                      {renderSparkIndicator('alternative_mobile_no')}
                      {renderGadOfficerIndicator('alternative_mobile_no')}
                      <input
                        type="text"
                        name="alternative_mobile_no"
                        value={formData.alternative_mobile_no || ''}
                        onChange={handleChange}
                        disabled={isFieldDisabled('alternative_mobile_no')}
                        className={getFieldClassName('alternative_mobile_no')}
                      />
                      {errors.alternative_mobile_no && <p className="text-red-500 text-sm mt-1">{errors.alternative_mobile_no}</p>}
                    </div>
                  </div>
                </div>

                {/* Languages Known */}
             <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 border-l-4 border-l-yellow-500 px-3 py-5 mb-5 sm:col-span-2">
                <h3 className="text-lg font-bold leading-6 text-gray-900 dark:text-white mb-5">Demographic Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Two-column grid for sm and larger */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-white">
                      Mother Tongue
                      {requiredFields.includes('mother_tongue_id') && <span className="text-red-500 font-semibold"> *</span>}
                    </label>
                    {renderSparkIndicator('mother_tongue_id')}
                    {renderGadOfficerIndicator('mother_tongue_id')}
                    <select
                      name="mother_tongue_id"
                      value={formData.mother_tongue_id || ''}
                      onChange={handleChange}
                      // required={requiredFields.includes('mother_tongue_id')}
                      disabled={isFieldDisabled('mother_tongue_id')}
                      className={getFieldClassName('mother_tongue_id')}
                    >
                      <option value="">Select Mother Tongue</option>
                      {renderSelectOptions({ key: 'mother_tongue_id', idForSelect: 'language_id' })}
                    </select>
                    {errors.mother_tongue_id && <p className="text-red-500 text-sm mt-1">{errors.mother_tongue_id}</p>}
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-white">
                      Category
                      {requiredFields.includes('category_id') && <span className="text-red-500 font-semibold"> *</span>}
                    </label>
                    {renderSparkIndicator('category_id')}
                    {renderGadOfficerIndicator('category_id')}
                    <select
                      name="category_id"
                      value={formData.category_id || ''}
                      onChange={handleChange}
                      // required={requiredFields.includes('category_id')}
                      disabled={isFieldDisabled('category_id')}
                      className={getFieldClassName('category_id')}
                    >
                      <option value="">Select Category</option>
                      {renderSelectOptions({ key: 'category_id', idForSelect: 'category_id' })}
                    </select>
                    {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
                  </div>

                  <div className="relative sm:col-span-2" ref={dropdownRef}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Languages Known
                        {requiredFields.includes('languages_known') && <span className="text-red-500 font-semibold"> *</span>}
                      </label>
                      {renderSparkIndicator('languages_known')}
                      {renderGadOfficerIndicator('languages_known')}
                      <div
                        className={`flex items-center justify-between cursor-pointer rounded-md border p-2 bg-white ${getFieldClassName('languages_known')} mt-1 w-full`}
                        onClick={() => !isFieldDisabled('languages_known') && setIsOpen(!isOpen)}
                      >
                        <span className="text-sm truncate">
                          {selectedOptions.length > 0
                            ? selectedOptions
                                .map((id) => masterData.languageKnown.find((lang) => lang.language_id === id)?.language)
                                .filter(Boolean)
                                .join(', ')
                            : 'Select options'}
                        </span>
                        <ChevronDownIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      </div>
                      
                      {isOpen && !isFieldDisabled('languages_known') && (
                        <div className="absolute w-full rounded-b-md border border-gray-300 border-t-0 bg-white shadow-md z-50 max-h-60 flex flex-col">
                          {/* Search Input */}
                          <div className="p-2 border-b border-gray-200 m-1">
                            <input
                              type="text"
                              placeholder="Search languages..."
                              value={languageSearchTerm}
                              className="w-full px-3 py-2 border border-indigo-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setLanguageSearchTerm(e.target.value.toLowerCase())}
                            />
                          </div>
                          
                          {/* Languages List with Scroll */}
                          <ul className="flex-1 overflow-y-auto max-h-48">
                            {masterData.languageKnown
                              .filter(option => 
                                option.language.toLowerCase().includes(languageSearchTerm)
                              )
                              .map((option) => (
                                <li key={option.language_id} className="flex items-center space-x-2 p-2 hover:bg-gray-100">
                                  <input
                                    name="languages_known"
                                    type="checkbox"
                                    checked={selectedOptions.includes(option.language_id)}
                                    onChange={() => handleSelect(option.language_id)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  />
                                  <label className="text-gray-900 text-sm flex-1 cursor-pointer">
                                    {option.language}
                                  </label>
                                </li>
                              ))
                            }
                          </ul>
                          
                          {/* No results message */}
                          {masterData.languageKnown.filter(option => 
                            option.language.toLowerCase().includes(languageSearchTerm)
                          ).length === 0 && (
                            <div className="p-3 text-center text-gray-500 text-sm">
                              No languages found
                            </div>
                          )}
                        </div>
                      )}
                      {errors.languages_known && <p className="text-red-500 text-sm mt-1">{errors.languages_known}</p>}
                    </div>
                </div>
              </div>

                {/* Current Address Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 border-l-4 border-l-indigo-500 px-3 py-5 mb-5 sm:col-span-2">
                  <h3 className="text-lg font-bold leading-6 text-gray-900 dark:text-white mb-5">Current Address</h3>
                  <div className="grid md:grid-cols-2 gap-4 sm:grid-cols-1">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Address Line 1 (Current Address)
                        {requiredFields.includes('address_line1_com') && <span className="text-red-500"> *</span>}
                      </label>
                      {renderSparkIndicator('address_line1_com')}
                      {renderGadOfficerIndicator('address_line1_com')}
                      <input
                        type="text"
                        name="address_line1_com"
                        autoComplete="off"
                        // required={requiredFields.includes('address_line1_com')}
                        disabled={isFieldDisabled('address_line1_com')}
                        value={formData.address_line1_com || ''}
                        onChange={handleChange}
                        className={getFieldClassName('address_line1_com')}
                      />
                      {errors.address_line1_com && <p className="text-red-500 text-sm mt-1">{errors.address_line1_com}</p>}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Address Line 2 (Current Address)
                      </label>
                      {renderSparkIndicator('address_line2_com')}
                      {renderGadOfficerIndicator('address_line2_com')}
                      <input
                        type="text"
                        name="address_line2_com"
                        autoComplete="off"
                        // required={requiredFields.includes('address_line2_com')}
                        disabled={isFieldDisabled('address_line2_com')}
                        value={formData.address_line2_com || ''}
                        onChange={handleChange}
                        className={getFieldClassName('address_line2_com')}
                      />
                      {errors.address_line2_com && <p className="text-red-500 text-sm mt-1">{errors.address_line2_com}</p>}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        State (Current Address)
                        {requiredFields.includes('state_id_com') && <span className="text-red-500"> *</span>}
                      </label>
                      {renderSparkIndicator('state_id_com')}
                      {renderGadOfficerIndicator('state_id_com')}
                      <select
                        name="state_id_com"
                        value={formData.state_id_com || ''}
                        onChange={handleChange}
                        // required={requiredFields.includes('state_id_com')}
                        disabled={isFieldDisabled('state_id_com')}
                        className={getFieldClassName('state_id_com')}
                      >
                        <option value="">Select State</option>
                        {masterData.state?.map((state) => (
                          <option key={state.state_id} value={state.state_id}>
                            {state.state}
                          </option>
                        ))}
                      </select>
                      {errors.state_id_com && <p className="text-red-500 text-sm mt-1">{errors.state_id_com}</p>}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        District (Current Address)
                        {requiredFields.includes('district_id_com') && <span className="text-red-500"> *</span>}
                      </label>
                      {renderSparkIndicator('district_id_com')}
                      {renderGadOfficerIndicator('district_id_com')}
                      <select
                        name="district_id_com"
                        value={formData.district_id_com || ''}
                        onChange={handleChange}
                        disabled={isFieldDisabled('district_id_com')}
                        className={getFieldClassName('district_id_com')}
                      >
                        <option value="">Select District</option>
                        {filteredDistrictsCom.map((district) => (
                          <option key={district.district_id} value={district.district_id}>
                            {district.district}
                          </option>
                        ))}
                      </select>
                      {errors.district_id_com && <p className="text-red-500 text-sm mt-1">{errors.district_id_com}</p>}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Pincode (Current Address)
                        {requiredFields.includes('pin_code_com') && <span className="text-red-500"> *</span>}
                      </label>
                      {renderSparkIndicator('pin_code_com')}
                      {renderGadOfficerIndicator('pin_code_com')}
                      <input
                        type="text"
                        name="pin_code_com"
                        autoComplete="off"
                        // required={requiredFields.includes('pin_code_com')}
                        disabled={isFieldDisabled('pin_code_com')}
                        value={formData.pin_code_com || ''}
                        onChange={handleChange}
                        className={getFieldClassName('pin_code_com')}
                      />
                      {errors.pin_code_com && <p className="text-red-500 text-sm mt-1">{errors.pin_code_com}</p>}
                    </div>
                  </div>
                </div>

                {/* Permanent Address Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 border-l-4 border-l-pink-500 px-3 py-5 mb-5 sm:col-span-2">
                  <h3 className="text-lg font-bold leading-6 text-gray-900 dark:text-white mb-5">Permanent Residential Address</h3>
                  <div className="grid md:grid-cols-2 gap-4 sm:grid-cols-1">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Address Line 1 (Permanent Address)
                        {requiredFields.includes('address_line1_per') && <span className="text-red-500"> *</span>}
                      </label>
                      {renderSparkIndicator('address_line1_per')}
                      {renderGadOfficerIndicator('address_line1_per')}
                      <input
                        type="text"
                        name="address_line1_per"
                        autoComplete="off"
                        // required={requiredFields.includes('address_line1_per')}
                        disabled={isFieldDisabled('address_line1_per')}
                        value={formData.address_line1_per || ''}
                        onChange={handleChange}
                        className={getFieldClassName('address_line1_per')}
                      />
                      {errors.address_line1_per && <p className="text-red-500 text-sm mt-1">{errors.address_line1_per}</p>}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Address Line 2 (Permanent Address)
                      </label>
                      {renderSparkIndicator('address_line2_per')}
                      {renderGadOfficerIndicator('address_line2_per')}
                      <input
                        type="text"
                        name="address_line2_per"
                        autoComplete="off"
                        // required={requiredFields.includes('address_line2_per')}
                        disabled={isFieldDisabled('address_line2_per')}
                        value={formData.address_line2_per || ''}
                        onChange={handleChange}
                        className={getFieldClassName('address_line2_per')}
                      />
                      {errors.address_line2_per && <p className="text-red-500 text-sm mt-1">{errors.address_line2_per}</p>}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        State (Permanent Address)
                        {requiredFields.includes('state_id_per') && <span className="text-red-500"> *</span>}
                      </label>
                      {renderSparkIndicator('state_id_per')}
                      {renderGadOfficerIndicator('state_id_per')}
                      <select
                        name="state_id_per"
                        value={formData.state_id_per || ''}
                        onChange={handleChange}
                        // required={requiredFields.includes('state_id_per')}
                        disabled={isFieldDisabled('state_id_per')}
                        className={getFieldClassName('state_id_per')}
                      >
                        <option value="">Select State</option>
                        {masterData.state?.map((state) => (
                          <option key={state.state_id} value={state.state_id}>
                            {state.state}
                          </option>
                        ))}
                      </select>
                      {errors.state_id_per && <p className="text-red-500 text-sm mt-1">{errors.state_id_per}</p>}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        District (Permanent Address)
                        {requiredFields.includes('district_id_per') && <span className="text-red-500"> *</span>}
                      </label>
                      {renderSparkIndicator('district_id_per')}
                      {renderGadOfficerIndicator('district_id_per')}
                      <select
                        name="district_id_per"
                        value={formData.district_id_per || ''}
                        onChange={handleChange}
                        disabled={isFieldDisabled('district_id_per')}
                        className={getFieldClassName('district_id_per')}
                      >
                        <option value="">Select District</option>
                        {filteredDistrictsPer.map((district) => (
                          <option key={district.district_id} value={district.district_id}>
                            {district.district}
                          </option>
                        ))}
                      </select>
                      {errors.district_id_per && <p className="text-red-500 text-sm mt-1">{errors.district_id_per}</p>}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Pincode (Permanent Address)
                        {requiredFields.includes('pin_code_per') && <span className="text-red-500"> *</span>}
                      </label>
                      {renderSparkIndicator('pin_code_per')}
                      {renderGadOfficerIndicator('pin_code_per')}
                      <input
                        type="text"
                        name="pin_code_per"
                        autoComplete="off"
                        // required={requiredFields.includes('pin_code_per')}
                        disabled={isFieldDisabled('pin_code_per')}
                        value={formData.pin_code_per || ''}
                        onChange={handleChange}
                        className={getFieldClassName('pin_code_per')}
                      />
                      {errors.pin_code_per && <p className="text-red-500 text-sm mt-1">{errors.pin_code_per}</p>}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-x-6 sm:col-span-2">
                  <button
                    type="button"
                    className="text-sm font-semibold text-gray-900 dark:text-white"
                    onClick={handleClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </DialogPanel>
        </div>
        </div>
      </Dialog>
    </>
  );
}
