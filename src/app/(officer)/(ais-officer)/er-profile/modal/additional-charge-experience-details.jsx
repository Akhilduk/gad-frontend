'use client'

import PropTypes from 'prop-types' // Import for prop validation
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'

export function ModalAdditionalChargeExperienceDetails({ open = false, setOpen }) {
  if (typeof open !== 'boolean') {
    console.error('The `open` prop for `ModalPersonalDetails` must be a boolean.')
    return null // Prevent rendering if `open` is invalid
  }

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
              <form>
                <div className="space-y-12">
                  <div className="border-b border-gray-900/10 pb-12">
                    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                      {/* Additional Fields */}
                      {[
                        { label: "Designation", id: "designation", type: "text" },
                        { label: "Level", id: "level", type: "text" },
                        { label: "Ministry", id: "ministry", type: "text" },
                        { label: "Department", id: "department", type: "text" },
                        { label: "Office", id: "office", type: "text" },
                        { label: "Location", id: "location", type: "text" },
                        { label: "Organisation", id: "organisation", type: "text" },
                        { label: "Experience (Major/Minor)", id: "experience", type: "text" },
                        { label: "Period From", id: "period-from", type: "date" },
                        { label: "Period To", id: "period-to", type: "date" },
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
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-x-6">
                    <button type="button" className="text-sm font-semibold text-gray-900">
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
  )
}

// Prop validation to ensure `open` is a boolean and `setOpen` is a function
ModalAdditionalChargeExperienceDetails.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
}
