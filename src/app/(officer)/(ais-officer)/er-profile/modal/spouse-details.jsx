'use client'

import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const initialFormData = {
  name: '',
  dob: '',
  gender_id: '',
  email_id: '',
  mobile_no: '',
  place_of_domicile:'',
  mother_tongue:'',
  PAN_no:'',

};

const fields = [
  { label: "Name", key: "name" },
  // { label: "Reference Number", key: "reference_number" },
  { label: "Date of Birth", key: "dob" },
  { label: "Gender", key: "gender_id" },
  { label: "Email", key: "email_id" },
  { label: "Mobile Number", key: "mobile_no" },
  { label: "Place of Domicile", key: "place_of_domicile" },
  // { label: "Mother Tongue", key: "mother_tongue" },
  // { label: "PAN Number", key: "PAN_no" },

];

// Master data for fields that require ID lookup
const masterFields = ['gender_id'];

const disabledFields = [ "mother_tongue", "PAN_no", "reference_number"];
const requiredFields = ["name", "email_id", "gender_id", "dob"];

export function ModalSpouseDetails({ open, setOpen, spouseDetails, onSave, masterData }) {
  const [formData, setFormData] = useState(initialFormData);

  
  useEffect(() => {
    if (open) {
      if (spouseDetails && spouseDetails.id) { // Only prefill for existing data
        setFormData({
          ...spouseDetails,
        });
      } else {
        setFormData(initialFormData); // Ensure it's empty for adding new spouse
      }
    }
  }, [open, spouseDetails]);
  

  // Update form data when input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prevState) => {
      const updatedData = { ...prevState, [name]: value };
  
      return updatedData;
    });
  };

  // Handle Save - Send data to backend
  const handleSave = async (e) => {
    e.preventDefault();
  
  
    const updatedData = { ...formData };

       // Remove disabled fields from the request
    disabledFields.forEach((field) => {
    delete updatedData[field];  });

   
        onSave(updatedData);
        setOpen(false);
     
  };
  

  const renderSelectOptions = (field) => {
    const keyMap = {
      gender_id: "gender",
    };
  
    const masterKey = keyMap[field.key]; 
    const options = masterData?.[masterKey] || [];  // Ensure masterData exists
  
    return options.length > 0 ? (
      options.map(option => (
        <option key={option.id} value={option.id}>
          {option.gender}
        </option>
      ))
    ) : (
      <option disabled>No options available</option>
    );
  };

  // Reset form when closing the modal
  const handleClose = () => {
    setFormData(initialFormData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-10">
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
                onClick={handleClose}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </button>
            </div>
            <div className="w-full">
              <form onSubmit={handleSave}>
                <div className="space-y-12">
                  <div className="border-b border-gray-900/10 pb-12">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-5">Spouse Details</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {fields.map((field) => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium text-gray-700">                          
                            {field.label}
                          {requiredFields.includes(field.key) && <span className="text-red-500 font-semibold"> *</span>}</label>
                          {masterFields.includes(field.key) ? (
                            // Render a select input for master fields
                            <select
                              id={field.key}
                              name={field.key}
                              value={formData[field.key] || ''}
                              onChange={handleChange}
                              disabled={disabledFields.includes(field.key)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                              <option value="">Select</option>
                              {renderSelectOptions(field)}
                            </select>
                          ) : field.key === 'dob' ? (
                            // Render date input for dob field
                            <input
                              type="date"
                              name={field.key}
                              value={formData[field.key] || ''}
                              onChange={handleChange}
                              disabled={disabledFields.includes(field.key)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          ) : (
                            <input
                              type="text"
                              name={field.key}
                              value={formData[field.key] || ''} // Ensure formData is not undefined
                              onChange={handleChange}
                              disabled={disabledFields.includes(field.key)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-x-6">
                    <button type="button" className="text-sm font-semibold text-gray-900" onClick={() => setOpen(false)}>
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
  );
}

ModalSpouseDetails.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  spouseDetails: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  masterData: PropTypes.object.isRequired, // Make sure masterData is passed as a prop
};
