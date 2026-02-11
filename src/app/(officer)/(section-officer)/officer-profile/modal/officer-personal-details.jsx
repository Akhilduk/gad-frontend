'use client';

import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import axiosInstance from '@/utils/apiClient';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { getServiceTypeName } from '@/utils/serviceTypeUtils';
import { handleStateDistrictChange } from '@/utils/mapping'; // Adjust the import path as needed

const fields = [
  { label: 'Honorifics', key: 'honorifics', isSelect: true },
  { label: 'First Name', key: 'first_name' },
  { label: 'Last Name', key: 'last_name' },
  { label: 'Identity Number', key: 'identity_number' },
  { label: 'AIS Number', key: 'ais_number' },
  { label: 'PEN', key: 'pen_number' },
  { label: 'Allotment Year', key: 'allotment_year' },
  { label: 'Source of Recruitment', key: 'source_of_recruitment_id', isSelect: true, idForSelect: 'recruitment_id' },
  { label: 'Service Type', key: 'service_type_id' },
  { label: 'Cadre', key: 'cadre_id', isSelect: true, idForSelect: 'cadre_id' },
  { label: 'Retirement', key: 'retirement_id', isSelect: true, idForSelect: 'retirement_id' },
  { label: 'Date of Birth', key: 'dob' },
  { label: 'Gender', key: 'gender_id', isSelect: true, idForSelect: 'gender_id' },
  { label: 'Email', key: 'email' },
  { label: 'Alternate Email', key: 'alternative_email' },
  { label: 'Mobile Number', key: 'mobile_no' },
  { label: 'Alternative Mobile Number', key: 'alternative_mobile_no' },
  { label: 'PAN Number', key: 'PAN_no' },
  { label: 'Aadhaar Number', key: 'aadhaar_number' },
  { label: 'Category', key: 'category_id', isSelect: true, idForSelect: 'category_id' },
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

const disabledFields = ['identity_number', 'service_type_id', 'PAN_no', 'aadhaar_number'];
const requiredFields = [
  'first_name',
  'last_name',
  'ais_number',
  'email',
  'allotment_year',
  'pen_number',
  'source_of_recruitment_id',
  'cadre_id',
  'dob',
  "identity_number",
  'gender_id',
  'service_type_id',
  'mobile_no',
  'honorifics',
];

export function OfficerModalPersonalDetails({ open, setOpen, personalDetails, onSave, masterData }) {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState({});
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [filteredDistrictsCom, setFilteredDistrictsCom] = useState([]);
  const [filteredDistrictsPer, setFilteredDistrictsPer] = useState([]);

  const dropdownRef = useRef(null);

  useEffect(() => {
    if (open && personalDetails) {
      const initialFormData = {
        ...personalDetails,
        state_id_com: personalDetails.state_id_com ? String(personalDetails.state_id_com) : '',
        district_id_com: personalDetails.district_id_com ? String(personalDetails.district_id_com) : '',
        state_id_per: personalDetails.state_id_per ? String(personalDetails.state_id_per) : '',
        district_id_per: personalDetails.district_id_per ? String(personalDetails.district_id_per) : '',
      };
      setFormData(initialFormData);

      if (personalDetails.allotment_year) {
        setSelectedYear(new Date(personalDetails.allotment_year, 0, 1));
      }

      if (personalDetails.languages_known) {
        setSelectedOptions(personalDetails.languages_known);
      } else {
        setSelectedOptions([]);
      }

      // Initialize filtered districts for current and permanent addresses
      const stateIdCom = personalDetails.state_id_com ? parseInt(personalDetails.state_id_com, 10) : null;
      const stateIdPer = personalDetails.state_id_per ? parseInt(personalDetails.state_id_per, 10) : null;
      setFilteredDistrictsCom(
        stateIdCom ? masterData.district.filter((district) => district.state_id === stateIdCom) : []
      );
      setFilteredDistrictsPer(
        stateIdPer ? masterData.district.filter((district) => district.state_id === stateIdPer) : []
      );
    } else {
      setFormData({
        honorifics: '',
        first_name: '',
        last_name: '',
        identity_number: '',
        ais_number: '',
        pen_number: '',
        allotment_year: '',
        source_of_recruitment_id: '',
        service_type_id: '',
        cadre_id: '',
        retirement_id: '',
        dob: '',
        gender_id: '',
        email: '',
        alternative_email: '',
        mobile_no: '',
        alternative_mobile_no: '',
        PAN_no: '',
        aadhaar_number: '',
        category_id: '',
        mother_tongue_id: '',
        address_line1_com: '',
        address_line2_com: '', 
        district_id_com: '',
        state_id_com: '',
        pin_code_com: '',
        address_line1_per: '',
        address_line2_per: '',
        district_id_per: '',
        state_id_per: '',
        pin_code_per: '',
      });
      setSelectedYear(null);
      setSelectedOptions([]);
      setFilteredDistrictsCom([]);
      setFilteredDistrictsPer([]);
    }
  }, [open, personalDetails, masterData.district]);

  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const minDate = new Date(today.getFullYear() - 60, today.getMonth(), today.getDate());

  const renderSelectOptions = (field) => {
    const keyMap = {
      source_of_recruitment_id: 'recruitment',
      cadre_id: 'cadre',
      gender_id: 'gender',
      state_id_com: 'state',
      state_id_per: 'state',
      district_id_com: 'district',
      district_id_per: 'district',
      category_id: 'category',
      mother_tongue_id: 'motherTongue',
      retirement_id: 'retirement',
      languages_known: 'languageKnown',
    };

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

    if (field.key === 'district_id_com') {
      return filteredDistrictsCom.map((option) => (
        <option key={option.district_id} value={option.district_id}>
          {option.district}
        </option>
      ));
    }

    if (field.key === 'district_id_per') {
      return filteredDistrictsPer.map((option) => (
        <option key={option.district_id} value={option.district_id}>
          {option.district}
        </option>
      ));
    }

    const masterKey = keyMap[field.key];
    const options = masterData[masterKey] || [];
    return options.map((option) => (
      <option key={option[field.idForSelect]} value={option[field.idForSelect]}>
        {option.recruitment ||
          option.cadre ||
          option.state ||
          option.gender ||
          option.district ||
          option.tenures ||
          option.language ||
          option.retirement ||
          option.category}
      </option>
    ));
  };

    const renderInputField = (field) => {
      const commonProps = {
        name: field.key,
        value: formData[field.key] || '',
        onChange: handleChange,
        className: `mt-1 block w-full rounded-md border-gray-300 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm  disabled:bg-gray-200 disabled:cursor-not-allowed dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600 `,
        disabled: disabledFields.includes(field.key),
      };

      if (field.key === 'service_type_id') {
        return (
          <input
            {...commonProps}
            value={getServiceTypeName(formData[field.key])}
            className={`mt-1 block w-full rounded-md border-gray-300 text-gray-900 shadow-sm sm:text-sm disabled:bg-gray-200 disabled:cursor-not-allowed dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600`}
          />
        );
      } else if (field.key === 'dob') {
        return <input type="date" {...commonProps} />;
      } else if (field.key === 'allotment_year') {
        return (
          <DatePicker
            selected={selectedYear}
            onChange={(date) => {
              setSelectedYear(date);
              setFormData((prev) => ({
                ...prev,
                allotment_year: date ? date.getFullYear().toString() : '',
              }));
              setError((prev) => ({ ...prev, allotment_year: undefined }));
            }}
            showYearPicker
            dateFormat="yyyy"
            yearItemNumber={9}
            placeholderText="Select Year"
            maxDate={new Date()}
            minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 60))}
            className={`block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm`}
          />
        );
      } else if (field.isSelect) {
        return (
          <select
            {...commonProps}
            disabled={
              (field.key === 'district_id_com' && !formData.state_id_com) ||
              (field.key === 'district_id_per' && !formData.state_id_per) ||
              disabledFields.includes(field.key)
            }
          >
            <option value="">Select</option>
            {renderSelectOptions(field)}
          </select>
        );
      } else {
        return <input type="text" {...commonProps} />;
      }
    };

  const validateForm = () => {
    let errors = {};
    const currentYear = new Date().getFullYear();
    const minAllotmentYear = currentYear - 60;

    const nameRegex = /^[A-Za-z.\s]+$/;
    const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const mobileRegex = /^\d{10}$/;
    const aisRegex = /^[a-zA-Z0-9]+$/;
    const penRegex = /^\d{10}$/;

    // Honorifics
    if (!formData.honorifics) {
      errors.honorifics = 'Honorific is required';
    }

    // First Name
    if (!formData.first_name?.trim()) {
      errors.first_name = 'First name is required';
    } else if (!nameRegex.test(formData.first_name)) {
      errors.first_name = 'Only alphabets, spaces, and dots allowed';
    }

    // Last Name
    if (!formData.last_name?.trim()) {
      errors.last_name = 'Last name is required';
    } else if (!nameRegex.test(formData.last_name)) {
      errors.last_name = 'Only alphabets, spaces, and dots allowed';
    }

    // Email
    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    // Mobile No
    if (!formData.mobile_no?.trim()) {
      errors.mobile_no = 'Mobile number is required';
    } else if (!mobileRegex.test(formData.mobile_no)) {
      errors.mobile_no = 'Mobile number must be exactly 10 digits';
    }

    // AIS Number
    if (!formData.ais_number?.trim()) {
      errors.ais_number = 'AIS Number is required';
    } else if (!aisRegex.test(formData.ais_number)) {
      errors.ais_number = 'AIS Number can only contain letters and numbers';
    }

    // PEN 
    if (!formData.pen_number?.trim()) {
      errors.pen_number = 'PEN is required';
    }
    
    // else if (!penRegex.test(formData.pen_number)) {
    //   errors.pen_number = 'PEN must be exactly 10 digits';
    // }

    // DOB
    if (!formData.dob) {
      errors.dob = 'Date of birth is required';
    } else {
      const dobDate = new Date(formData.dob);
      if (dobDate > maxDate || dobDate < minDate) {
        errors.dob = 'Date of birth must be between 18 and 60 years ago';
      }
    }

    // Allotment Year
    if (!formData.allotment_year) {
      errors.allotment_year = 'Allotment year is required';
    } else if (
      !/^\d{4}$/.test(formData.allotment_year) ||
      formData.allotment_year < minAllotmentYear ||
      formData.allotment_year > currentYear
    ) {
      errors.allotment_year = `Year must be between ${minAllotmentYear} and ${currentYear}`;
    }

    // Dropdowns
    if (!formData.gender_id) errors.gender_id = 'Gender is required';
    if (!formData.source_of_recruitment_id) errors.source_of_recruitment_id = 'Source of Recruitment is required';
    if (!formData.cadre_id) errors.cadre_id = 'Cadre is required';

    // State and District Validation
    if (formData.state_id_com && !formData.district_id_com) {
      errors.district_id_com = 'District (Current Address) is required when State is selected';
    }
    if (formData.state_id_per && !formData.district_id_per) {
      errors.district_id_per = 'District (Permanent Address) is required when State is selected';
    }

    setError(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    let updatedValue = value;
    let newErrors = { ...error };

    const nameRegex = /^[A-Za-z.\s]+$/;
    const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const mobileRegex = /^\d{10}$/;
    const aisRegex = /^[A-Z0-9]+$/;
    const penRegex = /^\d{10}$/;

    // Handle state and district fields for current address
    if (name === 'state_id_com' || name === 'district_id_com') {
      const newFilteredDistricts = handleStateDistrictChange(
        e,
        formData,
        setFormData,
        'state_id_com',
        'district_id_com',
        masterData.district
      );
      setFilteredDistrictsCom(newFilteredDistricts);
      setError((prev) => ({ ...prev, [name]: undefined }));
      return;
    }

    // Handle state and district fields for permanent address
    if (name === 'state_id_per' || name === 'district_id_per') {
      const newFilteredDistricts = handleStateDistrictChange(
        e,
        formData,
        setFormData,
        'state_id_per',
        'district_id_per',
        masterData.district
      );
      setFilteredDistrictsPer(newFilteredDistricts);
      setError((prev) => ({ ...prev, [name]: undefined }));
      return;
    }

    // Handle other fields
    if (requiredFields.includes(name) && value.trim() === '') {
      newErrors[name] = `${name.replace('_', ' ')} is required`;
    } else {
      delete newErrors[name];
    }

    if (name === 'mobile_no') {
      updatedValue = value.replace(/\D/g, '').slice(0, 10);
      if (!mobileRegex.test(updatedValue) && updatedValue) {
        newErrors.mobile_no = 'Mobile number must be exactly 10 digits';
      } else {
        delete newErrors.mobile_no;
      }
    } else if (name === 'ais_number') {
      updatedValue = value.replace(/[^A-Z0-9]/g, '');
      if (!aisRegex.test(updatedValue) && updatedValue) {
        newErrors.ais_number = 'AIS Number can only contain letters and numbers';
      } else {
        delete newErrors.ais_number;
      }
    } else if (name === 'pen_number') {
      updatedValue = value.replace(/[^0-9]/g, '');
      // if (!penRegex.test(updatedValue) && updatedValue) {
      //   newErrors.pen_number = 'PEN must be exactly 10 digits';
      // } else {
      //   delete newErrors.pen_number;
      // }
    } else if (name === 'first_name' || name === 'last_name') {
      if (!value.trim()) {
        newErrors[name] = `${name.replace('_', ' ')} is required`;
      } else if (/^\s/.test(value)) {
        newErrors[name] = 'No leading spaces allowed';
      } else if (!nameRegex.test(value)) {
        newErrors[name] = 'Only alphabets, spaces, and dots are allowed';
      } else {
        delete newErrors[name];
      }
    } else if (name === 'email') {
      if (!value.trim()) {
        newErrors.email = 'Email is required';
      } else if (!emailRegex.test(value)) {
        newErrors.email = 'Invalid email format';
      } else {
        delete newErrors.email;
      }
    } else if (name === 'allotment_year') {
      if (!value.trim()) {
        newErrors.allotment_year = 'Allotment year is required';
      } else if (!/^\d{4}$/.test(value)) {
        newErrors.allotment_year = 'Year must be in YYYY format';
      } else {
        delete newErrors.allotment_year;
      }
    } else if (name === 'gender_id' || name === 'source_of_recruitment_id' || name === 'cadre_id') {
      if (!value) {
        newErrors[name] = `${name.replace('_', ' ')} is required`;
      } else {
        delete newErrors[name];
      }
    } else if (name === 'dob') {
      const dobDate = new Date(value);
      if (dobDate > new Date()) {
        newErrors.dob = 'Date of birth cannot be in the future';
      } else if (dobDate > maxDate || dobDate < minDate) {
        newErrors.dob = 'Date of birth must be between 18 and 60 years ago';
      } else {
        delete newErrors.dob;
      }
    } else if (name === 'honorifics' && value) {
      delete newErrors.honorifics;
    }

    setFormData((prevData) => ({ ...prevData, [name]: updatedValue }));
    setError(newErrors);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const payload = {
        ...formData,
        state_id_com: formData.state_id_com ? parseInt(formData.state_id_com, 10) : null,
        district_id_com: formData.district_id_com ? parseInt(formData.district_id_com, 10) : null,
        state_id_per: formData.state_id_per ? parseInt(formData.state_id_per, 10) : null,
        district_id_per: formData.district_id_per ? parseInt(formData.district_id_per, 10) : null,
      };

      const response = await axiosInstance.put(`/clerk/officer/${personalDetails.id}`, payload);

      if (response.data.success) {
        onSave(payload);
        toast.success('Officer Details updated successfully.');
        setOpen(false);
      } else {
        console.error('Failed to update details', response.data.message);
        toast.error('Failed to save Personal Details. Please try again.');
      }
    } catch (error) {
      console.error('Error updating details', error);
      toast.error('An error occurred while saving details. Please try again.');
    }
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
      return updatedSelection;
    });
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
        />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-4xl sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
            >
              <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon aria-hidden="true" className="size-6" />
                </button>
              </div>
              <div className="w-full">
                <form onSubmit={handleSave}>
                  <div className="space-y-12">
                    <div>
                      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-5">Personal Details</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {fields
                          .filter(({ key }) => ![
                            'address_line1_com',
                            'address_line2_com',
                            'district_id_com',
                            'state_id_com',
                            'pin_code_com',
                            'address_line1_per',
                            'address_line2_per',
                            'district_id_per',
                            'state_id_per',
                            'pin_code_per',
                          ].includes(key))
                          .map((field) => (
                            <div key={field.key}>
                              <label className="block text-sm font-medium text-gray-700">
                                {field.label}
                                {requiredFields.includes(field.key) && (
                                  <span className="text-red-500 font-semibold"> *</span>
                                )}
                              </label>
                              {renderInputField(field)}
                              {error[field.key] && <p className="mt-1 text-sm text-red-500">{error[field.key]}</p>}
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative" ref={dropdownRef}>
                        <label className="block text-sm font-medium text-gray-700">Languages Known</label>
                        <div
                          className="flex items-center justify-between cursor-pointer rounded-md border border-gray-300 bg-white p-2 text-gray-900 mt-1"
                          onClick={() => setIsOpen(!isOpen)}
                        >
                          <span className="text-sm">
                            {selectedOptions.length > 0
                              ? selectedOptions
                                  .map((id) => masterData.languageKnown.find((lang) => lang.language_id === id)?.language)
                                  .filter(Boolean)
                                  .join(', ')
                              : 'Select options'}
                          </span>
                          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                        </div>
                        {isOpen && (
                          <div className="absolute left-0 mt-1 min-w-full rounded-md border border-gray-300 bg-white shadow-md">
                            <ul className="max-h-40 overflow-y-auto p-2">
                              {masterData.languageKnown.map((option) => (
                                <li key={option.language_id} className="flex items-center space-x-2 p-1">
                                  <input
                                    name="languages_known"
                                    type="checkbox"
                                    checked={selectedOptions.includes(option.language_id)}
                                    onChange={() => handleSelect(option.language_id)}
                                    className="h-4 w-4"
                                  />
                                  <label className="text-gray-900">{option.language}</label>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                   <div>
                    <h3 className="text-lg font-medium leading-6 text-gray-900 my-5">Current Address</h3>
                    <div className="grid md:grid-cols-2 gap-4 sm:grid-cols-1">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address Line 1 (Current Address)</label>
                        <input
                          type="text"
                          name="address_line1_com"
                          value={formData.address_line1_com || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 sm:text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {error.address_line1_com && (
                          <p className="mt-1 text-sm text-red-500">{error.address_line1_com}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">State (Current Address)</label>
                        <select
                          name="state_id_com"
                          value={formData.state_id_com || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 sm:text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="">Select State</option>
                          {masterData.state?.map((state) => (
                            <option key={state.state_id} value={state.state_id}>
                              {state.state}
                            </option>
                          ))}
                        </select>
                        {error.state_id_com && (
                          <p className="mt-1 text-sm text-red-500">{error.state_id_com}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">District (Current Address)</label>
                        <select
                          name="district_id_com"
                          value={formData.district_id_com || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 sm:text-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          <option value="">Select District</option>
                          {filteredDistrictsCom.map((district) => (
                            <option key={district.district_id} value={district.district_id}>
                              {district.district}
                            </option>
                          ))}
                        </select>
                        {error.district_id_com && (
                          <p className="mt-1 text-sm text-red-500">{error.district_id_com}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Pincode (Current Address)</label>
                        <input
                          type="text"
                          name="pin_code_com"
                          value={formData.pin_code_com || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 sm:text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {error.pin_code_com && (
                          <p className="mt-1 text-sm text-red-500">{error.pin_code_com}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="border-b border-gray-900/10 pb-12">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 my-5">Permanent Residential Address</h3>
                    <div className="grid md:grid-cols-2 gap-4 sm:grid-cols-1">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address Line 1 (Permanent Address)</label>
                        <input
                          type="text"
                          name="address_line1_per"
                          value={formData.address_line1_per || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 sm:text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {error.address_line1_per && (
                          <p className="mt-1 text-sm text-red-500">{error.address_line1_per}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">State (Permanent Address)</label>
                        <select
                          name="state_id_per"
                          value={formData.state_id_per || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 sm:text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="">Select State</option>
                          {masterData.state?.map((state) => (
                            <option key={state.state_id} value={state.state_id}>
                              {state.state}
                            </option>
                          ))}
                        </select>
                        {error.state_id_per && (
                          <p className="mt-1 text-sm text-red-500">{error.state_id_per}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">District (Permanent Address)</label>
                        <select
                          name="district_id_per"
                          value={formData.district_id_per || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 sm:text-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          <option value="">Select District</option>
                          {filteredDistrictsPer.map((district) => (
                            <option key={district.district_id} value={district.district_id}>
                              {district.district}
                            </option>
                          ))}
                        </select>
                        {error.district_id_per && (
                          <p className="mt-1 text-sm text-red-500">{error.district_id_per}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Pincode (Permanent Address)</label>
                        <input
                          type="text"
                          name="pin_code_per"
                          value={formData.pin_code_per || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 sm:text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {error.pin_code_per && (
                          <p className="mt-1 text-sm text-red-500">{error.pin_code_per}</p>
                        )}
                      </div>
                    </div>
                  </div>
                    <div className="mt-6 flex items-center justify-end gap-x-6">
                      <button
                        type="button"
                        className="text-sm font-semibold text-gray-900"
                        onClick={() => setOpen(false)}
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
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
 
    </>
  );
}