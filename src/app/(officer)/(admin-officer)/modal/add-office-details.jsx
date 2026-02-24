'use client';

import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import axiosInstance from '@/utils/apiClient';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { handleStateDistrictChange } from '@/utils/mapping'; // Adjust the import path as needed

export function ModalAddOfficeDetails({
  open = false,
  setOpen,
  office = null,
  onSave,
  masterData = { district: [], state: [] },
}) {
  if (typeof open !== 'boolean') {
    console.error('The `open` prop for `ModalAddOfficeDetails` must be a boolean.');
    return null;
  }

  const [formData, setFormData] = useState({
    office_name: '',
    office_address: '',
    office_mobile: '',
    district_id: '',
    state_id: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredDistricts, setFilteredDistricts] = useState([]);

  useEffect(() => {
    setErrors({});

    if (office) {
      // Initialize form data for editing
      const initialFormData = {
        office_name: office.office_name || '',
        office_address: office.office_address || '',
        office_mobile: office.office_mobile || '',
        district_id: office.district_id ? String(office.district_id) : '',
        state_id: office.state_id ? String(office.state_id) : '',
      };
      setFormData(initialFormData);

      // Filter districts based on the office's state_id
      const selectedStateId = office.state_id ? parseInt(office.state_id, 10) : null;
      setFilteredDistricts(
        selectedStateId
          ? masterData.district.filter((district) => district.state_id === selectedStateId)
          : []
      );
    } else {
      // Reset form for adding new office
      setFormData({
        office_name: '',
        office_address: '',
        office_mobile: '',
        district_id: '',
        state_id: '',
      });
      setFilteredDistricts([]);
    }
  }, [office, open, masterData.district]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.office_name.trim()) {
      newErrors.office_name = 'Office Name is required';
    } else if (formData.office_name.length > 100) {
      newErrors.office_name = 'Office Name must be at most 100 characters';
    }

    if (!formData.office_address.trim()) {
      newErrors.office_address = 'Office Address is required';
    } else if (formData.office_address.length > 300) {
      newErrors.office_address = 'Office Address must be at most 300 characters';
    }

    if (!formData.office_mobile.trim()) {
      newErrors.office_mobile = 'Office Mobile is required';
    } else if (!/^\d{10}$/.test(formData.office_mobile)) {
      newErrors.office_mobile = 'Office Mobile must be exactly 10 digits and contain only numbers';
    }

    if (!formData.state_id) {
      newErrors.state_id = 'Please select a State';
    }

    if (formData.state_id && !formData.district_id) {
      newErrors.district_id = 'Please select a District';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle state and district changes
    if (name === 'state_id' || name === 'district_id') {
      const newFilteredDistricts = handleStateDistrictChange(
        e,
        formData,
        setFormData,
        'state_id',
        'district_id',
        masterData.district
      );
      setFilteredDistricts(newFilteredDistricts);
    } else {
      // Handle other fields
      setFormData((prevData) => {
        let newValue = value;

        if (name === 'office_mobile') {
          newValue = value.replace(/\D/g, '');
          if (newValue.length > 10) return prevData;
        }

        return {
          ...prevData,
          [name]: newValue,
        };
      });
    }

    // Clear errors for the field being edited
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: undefined,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        district_id: formData.district_id ? parseInt(formData.district_id, 10) : null,
        state_id: formData.state_id ? parseInt(formData.state_id, 10) : null,
      };

      if (office) {
        await axiosInstance.put(`/masters/office/${office.office_id}`, payload);
        toast.success('Office updated successfully');
      } else {
        await axiosInstance.post('/masters/office', payload);
        toast.success('Office added successfully');
      }
      onSave();
      setIsSubmitting(false);
      setOpen(false);
    } catch (error) {
      toast.error('Failed to save Office details');
      console.error('Error saving office data:', error.response?.data || error.message);
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
            <form onSubmit={handleSubmit}>
              <div className="space-y-12">
                <div className="border-b border-gray-900/10 pb-12">
                  <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    {/* Text Fields */}
                    {[
                      { label: 'Office Name', id: 'office_name', type: 'text', placeholder: 'Enter Office Name' },
                      { label: 'Office Address', id: 'office_address', type: 'text', placeholder: 'Office Address' },
                      { label: 'Office Mobile', id: 'office_mobile', type: 'text', placeholder: 'Enter Office Mobile' },
                    ].map((field) => (
                      <div className="sm:col-span-3" key={field.id}>
                        <label htmlFor={field.id} className="block text-sm font-medium text-gray-900">
                          {field.label}
                          <span className="text-red-600">*</span>
                        </label>
                        <div className="mt-2">
                          <input
                            id={field.id}
                            name={field.id}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={formData[field.id] || ''}
                            onChange={handleChange}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                          />
                        </div>
                        {errors[field.id] && <p className="text-red-600 text-sm">{errors[field.id]}</p>}
                      </div>
                    ))}

                    {/* State Select */}
                    <div className="sm:col-span-3">
                      <label htmlFor="state_id" className="block text-sm font-medium text-gray-900">
                        State
                        <span className="text-red-600">*</span>
                      </label>
                      <div className="mt-2">
                        <select
                          id="state_id"
                          name="state_id"
                          value={formData.state_id || ''}
                          onChange={handleChange}
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                        >
                          <option value="">Select State</option>
                          {masterData.state.map((state) => (
                            <option key={state.state_id} value={state.state_id}>
                              {state.state}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.state_id && <p className="text-red-600 text-sm">{errors.state_id}</p>}
                    </div>

                    {/* District Select */}
                    <div className="sm:col-span-3">
                      <label htmlFor="district_id" className="block text-sm font-medium text-gray-900">
                        District
                        <span className="text-red-600">*</span>
                      </label>
                      <div className="mt-2">
                        <select
                          id="district_id"
                          name="district_id"
                          value={formData.district_id || ''}
                          onChange={handleChange}
                          disabled={!formData.state_id} // Disable if no state is selected
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm disabled:opacity-50"
                        >
                          <option value="">Select District</option>
                          {filteredDistricts.map((district) => (
                            <option key={district.district_id} value={district.district_id}>
                              {district.district}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.district_id && <p className="text-red-600 text-sm">{errors.district_id}</p>}
                    </div>
                  </div>
                </div>

                {/* Buttons */}
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
                    disabled={isSubmitting}
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}