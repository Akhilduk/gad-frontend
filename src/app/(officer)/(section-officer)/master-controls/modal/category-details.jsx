'use client'

import PropTypes from 'prop-types'
import { useEffect, useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export function ModalCategoryDetails({ 
  open = false,
  setOpen,
  save,
  category,
}) {
  if (typeof open !== 'boolean') {
    console.error('The `open` prop for `ModalCategoryDetails` must be a boolean.')
    return null 
  }

  const [formData, setFormData] = useState({ category: '', category_abbr: '' });
  const [errors, setErrors] = useState({ category: '', category_abbr: '' });

  useEffect(() => {
    if (open) { // Reset formData when modal opens
      if (category) {
        setFormData({category_id: category.category_id,category: category.category.toUpperCase(),category_abbr: category.category_abbr.toUpperCase()
        });
      } else {
        setFormData({ category: '', category_abbr: '' }); // Reset when adding a new category
      }
      setErrors({ category: '', category_abbr: '' }); // Reset errors
    }
  }, [category, open]); // Added `open` dependency
  

  const validate = () => {
    let newErrors = {};
    
    if (!formData.category.trim()) {
      newErrors.category = "Category name is required.";
    } else if (!/^[A-Za-z\s]+$/.test(formData.category)) {
      newErrors.category = "Category name must contain only alphabetic characters and spaces.";
    }

    if (!formData.category_abbr.trim()) {
      newErrors.category_abbr = "Category abbreviation is required.";
    } else if (!/^[A-Z]+$/.test(formData.category_abbr)) {
      newErrors.category_abbr = "Category abbreviation must contain only uppercase letters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) =>{
    const { name, value } = e.target;

    if (name === "category") {
      if (value === "" || /^[A-Za-z\s]*$/.test(value)) {
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: "" }); // Clear error
      } else {
        setErrors({ ...errors, [name]: "Category name must contain only alphabetic characters and spaces." });
      }
    } else if (name === "category_abbr") {
      if (value === "" || /^[A-Z]*$/.test(value)) {
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: "" }); // Clear error
      } else {
        setErrors({ ...errors, [name]: "Category abbreviation must contain only uppercase letters." });
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({ category: '', category_abbr: '' });
    setErrors({ category: '', category_abbr: '' }); // Reset errors on close
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
                        <label htmlFor="category" className="block text-sm font-medium text-gray-900">Category</label>
                        <input
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          type="text"
                          placeholder="Enter Category"
                          required
                          className={`block w-full rounded-md border-gray-300 py-1.5 text-gray-900 ring-1 ring-inset focus:ring-2 sm:text-sm ${
                            errors.category ? "ring-red-500" : "focus:ring-indigo-600"
                          }`}
                        />
                        {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                      </div>
                      <div className="lg:col-span-6 sm:col-span-12">
                        <label htmlFor="category_abbr" className="block text-sm font-medium text-gray-900">Abbreviation</label>
                        <input
                          id="category_abbr"
                          name="category_abbr"
                          value={formData.category_abbr}
                          onChange={handleChange}
                          type="text"
                          placeholder="Enter Abbreviation"
                          required
                          className={`block w-full rounded-md border-gray-300 py-1.5 text-gray-900 ring-1 ring-inset focus:ring-2 sm:text-sm ${
                            errors.category_abbr ? "ring-red-500" : "focus:ring-indigo-600"
                          }`}
                        />
                        {errors.category_abbr && <p className="mt-1 text-sm text-red-600">{errors.category_abbr}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-end gap-x-6">
                    <button type="button" onClick={handleClose} className="text-sm font-semibold text-gray-900">Cancel</button>
                    <button
                      type="submit"
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-600"
                    >
                      {category ? "Update Category" : "Add Category"}
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

ModalCategoryDetails.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  save: PropTypes.func.isRequired,
  category: PropTypes.object,
};