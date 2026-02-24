'use client'

import PropTypes from 'prop-types' // Import for prop validation
import { useState, useEffect } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export function ModalRecruitmentDetails({ 
  open = false, 
  setOpen,
  save,
  recruitment, 
}) {
  if (typeof open !== 'boolean') {
    console.error('The `open` prop for `ModalRecruitmentDetails` must be a boolean.')
    return null // Prevent rendering if `open` is invalid
  }

  const [formData, setFormData] = useState({ recruitment: '', recruitment_abbr: '' });
  const [errors, setErrors] = useState({ recruitment: '', recruitment_abbr: '' });

  useEffect(() => {
    if (open){
      if (recruitment) {
        setFormData({
          recruitment_id: recruitment.recruitment_id,
          recruitment: recruitment.recruitment.toUpperCase() || '',
          recruitment_abbr: recruitment.recruitment_abbr.toUpperCase() || '',});
      } else {
      setFormData({ recruitment: '', recruitment_abbr: '' }); // Reset when adding a new recruitment
      }
      setErrors({ recruitment: '', recruitment_abbr: '' }); // Reset errors
    }
  }, [recruitment,open]);

  const validate = () => {
    let newErrors = {};
    
    if (!formData.recruitment.trim()) {
      newErrors.recruitment = "Recruitment name is required.";
    } else if (!/^[A-Za-z\s]+$/.test(formData.recruitment)) {
      newErrors.recruitment = "Recruitment name must contain only alphabetic characters and spaces.";
    }

    if (!formData.recruitment_abbr.trim()) {
      newErrors.recruitment_abbr = "Recruitment abbreviation is required.";
    } else if (!/^[A-Za-z]+$/.test(formData.recruitment_abbr)) {
      newErrors.recruitment_abbr = "Recruitment abbreviation must contain only alphabetic characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  
  const handleChange = (e) => {
    let { name, value } = e.target; // ✅ get both name and value
    value = value.trimStart(); // remove leading spaces only

    if (name === "recruitment") {
      if (value === "" || /^[A-Za-z\s]*$/.test(value)) {
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: "" });
      } else {
        setErrors({
          ...errors,
          [name]: "Recruitment name must contain only alphabetic characters and spaces. It must start with a letter."
        });
      }
    } 
    else if (name === "recruitment_abbr") {
      if (value === "" || /^[A-Za-z]*$/.test(value)) {
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: "" });
      } else {
        setErrors({
          ...errors,
          [name]: "Recruitment abbreviation must contain only alphabetic characters."
        });
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({ recruitment: '', recruitment_abbr: '' });
    setErrors({ recruitment: '', recruitment_abbr: '' }); // Reset errors on close
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return; // Prevent submission if validation fails

    await save(formData);
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
            className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6"
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
              <form onSubmit={handleSubmit}>
                <div className="space-y-12">
                  <div className="border-b border-gray-900/10 pb-12">
                    <div className="grid grid-cols-12 gap-x-6 gap-y-8">
                      {/* Recruitment Name */}
                      <div className="lg:col-span-6 sm:col-span-12">
                        <label htmlFor="recruitment" className="block text-sm font-medium text-gray-900">
                          Recruitment Name
                        </label>
                        <div className="mt-2">
                          <input
                            id="recruitment"
                            name="recruitment"
                            value={formData.recruitment}
                            onChange={handleChange}
                            type="text"
                            placeholder="Enter Recruitment Name"
                            required
                            className={`block w-full rounded-md border-gray-300 py-1.5 text-gray-900 ring-1 ring-inset focus:ring-2 sm:text-sm ${
                            errors.recruitment ? "ring-red-500" : "focus:ring-indigo-600"
                          }`}
                        />
                        {errors.recruitment && <p className="mt-1 text-sm text-red-600">{errors.recruitment}</p>}
                        </div>
                      </div>

                      {/* Recruitment Abbreviation */}
                      <div className="lg:col-span-6 sm:col-span-12">
                        <label htmlFor="recruitment_abbr" className="block text-sm font-medium text-gray-900">
                          Abbreviation
                        </label>
                        <div className="mt-2">
                          <input
                            id="recruitment_abbr"
                            name="recruitment_abbr"
                            value={formData.recruitment_abbr}
                            onChange={handleChange}
                            type="text"
                            placeholder="Enter Abbreviation"
                            required
                            className={`block w-full rounded-md border-gray-300 py-1.5 text-gray-900 ring-1 ring-inset focus:ring-2 sm:text-sm ${
                              errors.recruitment_abbr ? "ring-red-500" : "focus:ring-indigo-600"
                            }`}
                          />
                          {errors.recruitment_abbr && <p className="mt-1 text-sm text-red-600">{errors.recruitment_abbr}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-x-6">
                    <button 
                      type="button"
                      onClick={handleClose} 
                      className="text-sm font-semibold text-gray-900">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      {recruitment ? "Update Recruitment" : "Add Recruitment"}
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

// Prop validation to ensure `open` is a boolean and `setOpen` is a function
ModalRecruitmentDetails.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  save: PropTypes.func.isRequired,
  recruitment: PropTypes.object,
};
