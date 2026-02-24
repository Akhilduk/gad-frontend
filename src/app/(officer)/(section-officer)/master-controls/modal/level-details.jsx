'use client'

import PropTypes from 'prop-types' // Import for prop validation
import { useState, useEffect } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'

export function ModalLevelDetails({ 
  open = false,
  setOpen,
  save,
  level, 
}) {
  if (typeof open !== 'boolean') {
    console.error('The `open` prop for `ModalPersonalDetails` must be a boolean.')
    return null // Prevent rendering if `open` is invalid
  }

  const [formData, setFormData] = useState({level: ''});
  const [error, setError] = useState({ level: "" }); //track validation error

  useEffect(() => {
    if (open) { // Reset formData when modal opens
      if (level) {
        setFormData({
          level_id: level.level_id,
          level: level.level.toUpperCase()
        });
      } else {
        setFormData({ level: '' }); // Reset for a new entry
      }
      setError(""); //reset error when modal opens
    }
  }, [level, open]); // Added `open` dependency
  


  const handleChange = (e) => {
    let { value } = e.target;
    value = value.trimStart(); // remove leading spaces only (keeps middle spaces)

    // Allow letters, numbers, spaces, /, and parentheses
    if (value === "" || /^[a-zA-Z0-9][\sa-zA-Z0-9/()]*$/.test(value)) {
      setFormData({ ...formData, level: value });
      setError(""); // Clear error if valid
    } else {
      setError("Level field may only contain letters, numbers, spaces, /, &, (, and ). It must start with a letter.");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({level: ''});
    setError(""); //reset error on close
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (error || !formData.level.trim()) {
      setError("Please enter a valid level name.");
      return;
    }
    
    // Call save function with FormData
    await save(formData);

    // Close modal after saving
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
              <form onSubmit={handleSubmit}>
                <div className="space-y-12">
                  <div className="border-b border-gray-900/10 pb-12">
                    <div className="grid grid-cols-12 gap-x-6 gap-y-8">
                      {[
                        {
                          label: "Level",
                          id: "officer-name",
                          type: "text",
                          placeholder: "Enter Level",
                        },
                        
                      ].map((field) => (
                        <div
                          className="lg:col-span-6 sm:col-span-12"
                          key={field.id}
                        >
                          <label htmlFor={field.id} className="block text-sm font-medium text-gray-900">
                            {field.label}
                          </label>
                          <div className="mt-2">
                            {field.type === "select" ? (
                              <select
                                id={field.id}
                                name={field.id}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                              >
                                {field.options.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div>
                              <input
                                id={field.id}
                                name={'level'}
                                value={formData.level}
                                onChange={handleChange}
                                type={field.type}
                                placeholder={field.placeholder || ""}
                                required
                                // className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ${
                                  error ? "ring-red-500" : "ring-gray-300"
                                } placeholder:text-gray-400 focus:ring-2 focus:ring-inset ${
                                  error
                                    ? "focus:ring-red-500"
                                    : "focus:ring-indigo-600"
                                } sm:text-sm`}
                              />
                              {error && (
                                <p className="mt-1 text-sm text-red-600">
                                  {error}
                                </p>
                            )}
                          </div>
                            )}
                            </div>
                        </div>
                      ))}
                    </div>


                  </div>

                  <div className="mt-6 flex items-center justify-end gap-x-6">
                    <button type="button" 
                    onClick={handleClose}
                    className="text-sm font-semibold text-gray-900">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      
                      {level ? "Update level" : "Add Level"}
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

// Prop validation to ensure `open` is a boolean and `setOpen` is a function
ModalLevelDetails.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  save: PropTypes.func.isRequired,
  level: PropTypes.object,
}
