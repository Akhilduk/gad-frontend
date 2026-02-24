'use client';

import PropTypes from 'prop-types';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import axiosInstance from '@/utils/apiClient';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-toastify';

const mapSparkToFormData = (sparkData, masters) => {
  const penKey = Object.keys(sparkData)[0];
  const details = sparkData[penKey].personal_details;

  // Split name
  const [firstName, ...lastParts] = details.name?.trim().split(" ") || ["", ""];
  const lastName = lastParts.join(" ");

  // Normalize SPARK sex codes → master gender text
  let genderText = "";
  if (details.sex === "M") genderText = "male";
  else if (details.sex === "F") genderText = "female";
  else if (details.sex === "T") genderText = "transgender";

  // Map gender text -> ID from masters
  const genderOption = masters.gender.find(
    (g) => g.gender.toLowerCase() === genderText.toLowerCase()
  );

  return {
    honorifics: "", // not in SPARK
    first_name: firstName || "",
    last_name: lastName || "",
    dob: details.date_of_birth || "",
    email: "", // not in SPARK
    ais_number: "", // not in SPARK
    pen_number: details.permanent_emp_no || "",
    mobile_no: "", // not in SPARK
    allotment_year: "", // not in SPARK
    gender_id: genderOption ? genderOption.gender_id : "",
    source_of_recruitment_id: "", // not in SPARK
    cadre_id: "", // not in SPARK
  };
};


export function ModalUserDetails({ open = false, setOpen, officer = null, onSave }) {
  if (typeof open !== 'boolean') {
    console.error('The `open` prop for `ModalUserDetails` must be a boolean.');
    return null;
  }

  const [step, setStep] = useState(1); // Step 1: PEN , Step 2: Form
  const [penNumber, setPenNumber] = useState('');
  const [penError, setPenError] = useState('');
  const [dob, setDob] = useState('');
  const [dobError, setDobError] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [formData, setFormData] = useState({
    honorifics: '',
    first_name: '',
    last_name: '',
    dob: '',
    email: '',
    ais_number: '',
    pen_number: '',
    mobile_no: '',
    allotment_year: '',
    gender_id: '',
    source_of_recruitment_id: '',
    cadre_id: '',
    spark_data: null,
  });
  const [selectedYear, setSelectedYear] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [masters, setMasters] = useState({
    gender: [],
    recruitment: [],
    cadre: [],
  });
  const [error, setError] = useState({});

  const currentDate = new Date();
  const minDate = new Date();
  minDate.setFullYear(currentDate.getFullYear() - 60);
  const minDateString = minDate.toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setFullYear(currentDate.getFullYear() - 18);
  const maxDateString = maxDate.toISOString().split('T')[0];

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [genderRes, recruitmentRes, cadreRes] = await Promise.all([
          axiosInstance.get('/masters/gender'),
          axiosInstance.get('/masters/recruitment'),
          axiosInstance.get('/masters/cadre'),
        ]);

        setMasters({
          gender: genderRes.data.data.gender || [],
          recruitment: recruitmentRes.data.data.recruitment || [],
          cadre: cadreRes.data.data.cadre || [],
        });
      } catch (error) {
        toast.error('Error fetching data: ' + (error.response?.data?.message || error.message));
      }
    };

    fetchMasters();

    if (open) {
      if (officer) {
        setStep(2);
        setFormData({
          honorifics: officer.honorifics || '',
          first_name: officer.first_name || '',
          last_name: officer.last_name || '',
          dob: officer.dob || '',
          email: officer.email || '',
          ais_number: officer.ais_number || '',
          pen_number: officer.pen_number || '',
          mobile_no: officer.mobile_no || '',
          allotment_year: officer.allotment_year || '',
          gender_id: officer.gender_id || '',
          source_of_recruitment_id: officer.source_of_recruitment_id || '',
          cadre_id: officer.cadre_id || '',
        });
        setSelectedYear(officer.allotment_year ? new Date(officer.allotment_year, 0) : null);
      } else {
        setStep(1);
        setPenNumber('');
        setPenError('');
        setDob('');
        setDobError('');
        setFormData({
          honorifics: '',
          first_name: '',
          last_name: '',
          dob: '',
          email: '',
          ais_number: '',
          pen_number: '',
          mobile_no: '',
          allotment_year: '',
          gender_id: '',
          source_of_recruitment_id: '',
          cadre_id: '',
        });
        setSelectedYear(null);
      }
      setError({});
    }
  }, [open, officer]);

  const handlePenNumberChange = (e) => {
    const value = e.target.value;
    setPenNumber(value);
    setPenError('');
  };

  const validateInputs = () => {
  let valid = true;

  if (!penNumber.trim()) {
    setPenError('PEN is required.');
    valid = false;
  }

  if (!dob) {
    setDobError('Date of Birth is required.');
    valid = false;
  }

  return valid;
};


const handleFetchDetails = async () => {
  if (!validateInputs()) return;

  setIsFetching(true);

  try {
    // 1️⃣ Check in DB first
    const dbResponse = await axiosInstance.get(`/clerk/officer-pen/${penNumber}`);
    const isInDb = dbResponse.data;

    if (isInDb === true) {
      toast.info("User already in our list.");
      return;
    }

    // 2️⃣ Fetch from SPARK using pen + dob
    const sparkResponse = await axiosInstance.get(`/spark/${penNumber}/${dob}`);
    const sparkData = sparkResponse.data;

    // In handleFetchDetails, after successful SPARK fetch
    if (sparkData) {
      const mappedData = mapSparkToFormData(sparkData, masters);
      setFormData({
        ...mappedData,
        spark_data: sparkData,
      });
      sessionStorage.setItem('pen_number', mappedData.pen_number);
      sessionStorage.setItem('dob', mappedData.dob); // If needed for API
      setSelectedYear(
        mappedData.allotment_year ? new Date(mappedData.allotment_year, 0) : null
      );
      setStep(2);
} else {
      setPenError("No officer found with this PEN and DOB.");
    }

  } catch (error) {
    const errorMessage = error.response?.data?.message || "No officer found with this PEN and DOB.";
    setPenError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setIsFetching(false);
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

    if (!formData.honorifics) errors.honorifics = 'Honorific is required';
    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    } else if (!nameRegex.test(formData.first_name)) {
      errors.first_name = 'Only alphabets, spaces, and dots allowed';
    }
    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    } else if (!nameRegex.test(formData.last_name)) {
      errors.last_name = 'Only alphabets, spaces, and dots allowed';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.mobile_no.trim()) {
      errors.mobile_no = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.mobile_no)) {
      errors.mobile_no = 'Mobile number must be 10 digits and start with 6, 7, 8, or 9.';
    }
    if (!formData.ais_number || !formData.ais_number.trim()) {
      errors.ais_number = 'AIS Number is required';
    } else if (!aisRegex.test(formData.ais_number)) {
      errors.ais_number = 'AIS Number can only contain letters and numbers';
    }
    if (!formData.pen_number || !formData.pen_number.trim()) {
      errors.pen_number = 'PEN is required';
    } 
    if (!formData.dob) {
      errors.dob = 'Date of birth is required';
    } else {
      const dobDate = new Date(formData.dob);
      if (dobDate > maxDate || dobDate < minDate) {
        errors.dob = 'Date of birth must be between 18 and 60 years ago';
      }
    }
    if (!formData.allotment_year) {
      errors.allotment_year = 'Allotment year is required';
    } else if (
      !/^\d{4}$/.test(formData.allotment_year) ||
      formData.allotment_year < minAllotmentYear ||
      formData.allotment_year > currentYear
    ) {
      errors.allotment_year = `Year must be between ${minAllotmentYear} and ${currentYear}`;
    }
    if (!formData.gender_id) errors.gender_id = 'Gender is required';
    if (!formData.source_of_recruitment_id) errors.source_of_recruitment_id = 'Source of Recruitment is required';
    if (!formData.cadre_id) errors.cadre_id = 'Cadre is required';

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
    const penRegex = /^\d{10}$/;

    if (name === 'mobile_no') {
      updatedValue = value.replace(/\D/g, '').slice(0, 10);
      if (!/^[6-9]\d{9}$/.test(updatedValue)) {
        newErrors.mobile_no = 'Mobile number must be 10 digits and start with 6, 7, 8, or 9.';
      } else {
        delete newErrors.mobile_no;
      }
    } else if (name === 'ais_number') {
      updatedValue = value.replace(/[^a-zA-Z0-9]/g, '');
      if (!updatedValue || !/^[a-zA-Z0-9]+$/.test(updatedValue)) {
        newErrors.ais_number = 'AIS Number can only contain letters and numbers.';
      } else {
        delete newErrors.ais_number;
      }
    } else if (name === 'pen_number') {
      //updatedValue = value.replace(/[^0-9]/g, '').slice(0, 10);
      // if (!penRegex.test(updatedValue)) {
      //   newErrors.pen_number = 'PEN must be exactly 10 digits.';
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
    } else if (name === 'honorifics' && value) {
      delete newErrors.honorifics;
    } else if (name === 'email') {
      if (!value.trim()) {
        newErrors.email = 'Email is required';
      } else if (!emailRegex.test(value)) {
        newErrors.email = 'Invalid email format';
      } else {
        delete newErrors.email;
      }
    } else if (name === 'allotment_year') {

      if (!String(value).trim()) {
        newErrors.allotment_year = 'Allotment year is required';
      } else if (!/^\d{4}$/.test(value)) {
        newErrors.allotment_year = 'Year must be in YYYY format';
      }
      else {
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
        newErrors.dob = 'Age must be between 18 and 60 years';
      } else {
        delete newErrors.dob;
      }
    }

    setFormData((prevData) => ({ ...prevData, [name]: updatedValue }));
    setError(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
    if (officer) {
        await axiosInstance.put(`/clerk/officers/${officer.id}`, formData);
        toast.success('Officer details Updated successfully!');
      } else {
        await axiosInstance.post('/clerk/officers', formData);
        toast.success('Officer added successfully!');
      }
      sessionStorage.setItem('pen_number', formData.pen_number);
      sessionStorage.setItem('dob', formData.dob); // If needed for API
      onSave();
      setOpen(false);
          } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to save officer data';
            toast.error(errorMessage);
          } finally {
            setIsSubmitting(false);
          }
        };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} className="relative z-10">
      <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:w-full sm:max-w-4xl sm:p-6">
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

            {step === 1 && !officer ? (
              <div className="space-y-6">
                 <h2 className="text-lg font-semibold text-gray-900 mb-3">Enter Detailes</h2>
               <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="pen_number" className="block text-sm font-medium text-gray-900">
                PEN 
              </label>
              <div className="mt-2">
                <input
                  id="pen_number"
                  name="pen_number"
                  type="text"
                  placeholder="Enter 6-digit PEN"
                  value={penNumber}
                  onChange={handlePenNumberChange}
                  className={`block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ${
                    penError ? 'border-red-500 ring-red-500' : 'ring-gray-300'
                  } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm`}
                />
                {penError && <p className="mt-1 text-sm text-red-500">{penError}</p>}
              </div>
            </div>

            <div>
  <label htmlFor="dob" className="block text-sm font-medium text-gray-900">
    Date of Birth
  </label>
  <div className="mt-2">
    <input
      id="dob"
      name="dob"
      type="date"
      value={dob}
      onChange={(e) => {
        setDob(e.target.value);
        setDobError('');
      }}
      className={`block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset 
        ${dobError ? 'border-red-500 ring-red-500' : 'ring-gray-300'} 
        placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm`}
    />
    {dobError && <p className="mt-1 text-sm text-red-500">{dobError}</p>}
  </div>
</div>

          </div>

                {isFetching ? (
                  <div className="text-center text-sm text-gray-600">Fetching details...</div>
                ) : (
                  <div className="mt-6 flex items-center justify-end gap-x-3">
                    <button
                      type="button"
                      className="rounded-md bg-gray-200 text-sm border border gray-300 hover:bg-gray-300 px-3 py-2 font-semibold text-gray-900"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isFetching}
                      onClick={handleFetchDetails}
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                      Fetch Details
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    {officer ? 'Edit Officer Details' : 'Add New Officer'}
                  </h2>
                  <div className="border-b border-gray-900/10 pb-12">
                    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="honorifics" className="block text-sm font-medium text-gray-900">
                          Honorifics
                        </label>
                        <div className="mt-2">
                          <select
                            id="honorifics"
                            name="honorifics"
                            value={formData.honorifics || ''}
                            onChange={handleChange}
                            className={`block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ${
                              error.honorifics ? 'border-red-500 ring-red-500' : 'ring-gray-300'
                            } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm`}
                          >
                            <option value="">Select</option>
                            <option value="Mr.">Mr.</option>
                            <option value="Ms.">Ms.</option>
                            <option value="Mrs.">Mrs.</option>
                            <option value="Dr.">Dr.</option>
                          </select>
                          {error.honorifics && (
                            <p className="mt-1 text-sm text-red-500">{error.honorifics}</p>
                          )}
                        </div>
                      </div>
                      {[
                        {
                          label: 'First Name',
                          id: 'first_name',
                          type: 'text',
                          placeholder: 'Enter First name',
                        },
                        {
                          label: 'Last Name',
                          id: 'last_name',
                          type: 'text',
                          placeholder: 'Enter Last name',
                        },
                        {
                          label: 'Email',
                          id: 'email',
                          type: 'email',
                          placeholder: 'Enter email address',
                        },
                        {
                          label: 'AIS Number',
                          id: 'ais_number',
                          type: 'text',
                          placeholder: 'Enter AIS Number',
                          maxLength: 10,
                        },
                        {
                          label: 'PEN ',
                          id: 'pen_number',
                          type: 'text',
                          placeholder: 'Enter PEN',
                          
                        },
                        {
                          label: 'Mobile Number',
                          id: 'mobile_no',
                          type: 'tel',
                          placeholder: 'Enter mobile number',
                          maxLength: 10,
                          pattern: '[0-9]{10}',
                        },
                      ].map((field) => (
                        <div className="sm:col-span-3" key={field.id}>
                          <label htmlFor={field.id} className="block text-sm font-medium text-gray-900">
                            {field.label}
                          </label>
                          <div className="mt-2">
                            <input
                              id={field.id}
                              name={field.id}
                              type={field.type}
                              placeholder={field.placeholder || ''}
                              value={formData[field.id] || ''}
                              onChange={handleChange}
                              maxLength={field.maxLength || undefined}
                              pattern={field.pattern || undefined}
                              className={`block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ${
                                error[field.id] ? 'border-red-500 ring-red-500' : 'ring-gray-300'
                              } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm`}
                            />
                          </div>
                          {error[field.id] && (
                            <p className="mt-1 text-sm text-red-500">{error[field.id]}</p>
                          )}
                        </div>
                      ))}
                      <div className="sm:col-span-3">
                        <label htmlFor="dob" className="block text-sm font-medium text-gray-900">
                          Date of Birth
                        </label>
                        <div className="mt-2">
                          <input
                            id="dob"
                            name="dob"
                            type="date"
                            value={formData.dob || ''}
                            onChange={handleChange}
                            min={minDateString}
                            max={maxDateString}
                            className={`block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ${
                              error.dob ? 'border-red-500 ring-red-500' : 'ring-gray-300'
                            } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm`}
                          />
                          {error.dob && <p className="mt-1 text-sm text-red-500">{error.dob}</p>}
                        </div>
                      </div>
                      <div className="sm:col-span-3">
                        <label htmlFor="allotment_year" className="block text-sm font-medium text-gray-900">
                          Allotment Year
                        </label>
                        <div className="mt-2">
                          <DatePicker
                            selected={selectedYear}
                            onChange={(date) => {
                              setSelectedYear(date);
                              setFormData((prev) => ({
                                ...prev,
                                allotment_year: date ? date.getFullYear().toString() : '',
                              }));
                            }}
                            showYearPicker
                            dateFormat="yyyy"
                            yearItemNumber={9}
                            placeholderText="Select Year"
                            maxDate={new Date()}
                            minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 60))}
                            className={`block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ${
                              error.allotment_year ? 'border-red-500 ring-red-500' : 'ring-gray-300'
                            } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm`}
                          />
                          {error.allotment_year && (
                            <p className="mt-1 text-sm text-red-500">{error.allotment_year}</p>
                          )}
                        </div>
                      </div>
                      {[
                        {
                          label: 'Gender',
                          id: 'gender_id',
                          options: masters.gender,
                          optionname: 'gender',
                          optionvalue: 'gender_id',
                        },
                        {
                          label: 'Source of Recruitment',
                          id: 'source_of_recruitment_id',
                          options: masters.recruitment,
                          optionname: 'recruitment',
                          optionvalue: 'recruitment_id',
                        },
                        {
                          label: 'Cadre',
                          id: 'cadre_id',
                          options: masters.cadre,
                          optionname: 'cadre',
                          optionvalue: 'cadre_id',
                        },
                      ].map((field) => (
                        <div className="sm:col-span-3" key={field.id}>
                          <label htmlFor={field.id} className="block text-sm font-medium text-gray-900">
                            {field.label}
                          </label>
                          <div className="mt-2">
                            <select
                              id={field.id}
                              name={field.id}
                              value={formData[field.id] || ''}
                              onChange={handleChange}
                              className={`block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ${
                                error[field.id] ? 'border-red-500 ring-red-500' : 'ring-gray-300'
                              } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm`}
                            >
                              <option value="">Select</option>
                              {field.options.map((option) => (
                                <option key={option[field.optionvalue]} value={option[field.optionvalue]}>
                                  {option[field.optionname]}
                                </option>
                              ))}
                            </select>
                            {error[field.id] && (
                              <p className="mt-1 text-sm text-red-500">{error[field.id]}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-end gap-x-3">
                    {!officer && (
                      <button
                        type="button"
                        className="rounded-md bg-gray-200 text-sm border border gray-300 hover:bg-gray-300 px-3 py-2 font-semibold text-gray-900"
                        onClick={() => setStep(1)}
                      >
                        Back
                      </button>
                    )}
                    {/* <button
                      type="button"
                      className="text-sm font-semibold text-gray-900"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </button> */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}

ModalUserDetails.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  officer: PropTypes.object,
  onSave: PropTypes.func.isRequired,
};



