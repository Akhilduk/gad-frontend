'use client'

import PropTypes from 'prop-types'
import { useEffect, useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export function ModalCadreDetails({ 
  open = false,
  setOpen,
  save,
  cadre,
}) {
  if (typeof open !== 'boolean') {
    console.error('The `open` prop for `ModalCadreDetails` must be a boolean.')
    return null 
  }

  const [formData, setFormData] = useState({ cadre: '', cadre_abbr: '' });
  const [errors, setErrors] = useState({ cadre: '', cadre_abbr: '' });

  useEffect(() => {
    if (open) { // Reset formData when modal opens
      if (cadre) {
        setFormData({cadre_id: cadre.cadre_id,cadre: cadre.cadre.toUpperCase(),cadre_abbr: cadre.cadre_abbr.toUpperCase()
        });
      } else {
        setFormData({ cadre: '', cadre_abbr: '' }); // Reset when adding a new cadre
      }
      setErrors({ cadre: '', cadre_abbr: '' }); // Reset errors
    }
  }, [cadre, open]); // Added `open` dependency
  

  const validate = () => {
    let newErrors = {};
    
    if (!formData.cadre.trim()) {
      newErrors.cadre = "Cadre name is required.";
    } else if (!/^[A-Za-z\s]+$/.test(formData.cadre)) {
      newErrors.cadre = "Cadre name must contain only alphabetic characters and spaces.";
    }

   if (!formData.cadre_abbr.trim()) {
      newErrors.cadre_abbr = "Cadre abbreviation is required.";
    } else if (!/^[A-Za-z]+$/.test(formData.cadre_abbr)) {
      newErrors.cadre_abbr = "Cadre abbreviation must contain only letters.";
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e) => {
    let { name, value } = e.target; // ✅ get both name and value
    value = value.trimStart(); // remove leading spaces only

      if (name === "cadre") {
        if (value === "" || /^[A-Za-z\s]*$/.test(value)) {
          setFormData({ ...formData, [name]: value });
          setErrors({ ...errors, [name]: "" }); // Clear error
        } else {
          setErrors({ ...errors, [name]: "Cadre name must contain only alphabetic characters and spaces. It must start with a letter." });
        }
      } else if (name === "cadre_abbr") {
        if (value === "" || /^[A-Za-z]*$/.test(value)) {
          setFormData({ ...formData, [name]: value });
          setErrors({ ...errors, [name]: "" }); // Clear error
        } else {
          setErrors({ ...errors, [name]: "Cadre abbreviation must contain only letters." });
        }
      }

    };

  const handleClose = () => {
    setOpen(false);
    setFormData({ cadre: '', cadre_abbr: '' });
    setErrors({ cadre: '', cadre_abbr: '' }); // Reset errors on close
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return; // Prevent submission if validation fails
    
    await save(formData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-10">
      <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button type="button" onClick={handleClose} className="rounded-md bg-white text-gray-400 hover:text-gray-500">
                <XMarkIcon aria-hidden="true" className="size-6" />
              </button>
            </div>
            <div className="w-full">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div className="border-b border-gray-900/10 pb-6">
                    <div className="grid grid-cols-12 gap-x-6 gap-y-4">
                      <div className="lg:col-span-6 sm:col-span-12">
                        <label htmlFor="cadre" className="block text-sm font-medium text-gray-900">Cadre</label>
                        <input
                          id="cadre"
                          name="cadre"
                          value={formData.cadre}
                          onChange={handleChange}
                          type="text"
                          placeholder="Enter Cadre"
                          required
                          className={`block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm mt-2 ${
                            errors.cadre ? "ring-red-500" : "focus:ring-indigo-600"
                          }`}
                        />
                        {errors.cadre && <p className="mt-1 text-sm text-red-600">{errors.cadre}</p>}
                      </div>
                      <div className="lg:col-span-6 sm:col-span-12">
                        <label htmlFor="cadre_abbr" className="block text-sm font-medium text-gray-900">Abbreviation</label>
                        <input
                          id="cadre_abbr"
                          name="cadre_abbr"
                          value={formData.cadre_abbr}
                          onChange={handleChange}
                          type="text"
                          placeholder="Enter Abbreviation"
                          required
                          className={`block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm mt-2 ${
                            errors.cadre_abbr ? "ring-red-500" : "focus:ring-indigo-600"
                          }`}
                        />
                        {errors.cadre_abbr && <p className="mt-1 text-sm text-red-600">{errors.cadre_abbr}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-end gap-x-6">
                    <button type="button" onClick={handleClose} className="text-sm font-semibold text-gray-900">Cancel</button>
                    <button
                      type="submit"
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-600"
                    >
                      {cadre ? "Update Cadre" : "Add Cadre"}
                    </button>
                  </div>
                </div>
              </form>  
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}

ModalCadreDetails.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  save: PropTypes.func.isRequired,
  cadre: PropTypes.object,
};