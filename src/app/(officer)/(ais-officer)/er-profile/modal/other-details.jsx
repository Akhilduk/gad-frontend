'use client'

import PropTypes from 'prop-types' // Import for prop validation
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'

export function ModalOtherDetails({ open = false, setOpen }) {
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
                    {[
                      { label: "Number of Foreign Visits", id: "number-of-foreign-visits", type: "number" },
                      { label: "Details of Foreign Visit", id: "details-of-foreign-visit", type: "textarea", placeholder: "Enter details of foreign visits" },
                      { label: "Foreign Visit Place", id: "foreign-visit-place", type: "text" },
                      { label: "Visited Year", id: "visited-year", type: "number", min: 1900, max: new Date().getFullYear() },
                      { label: "Purpose of Visit", id: "purpose-of-visit", type: "textarea", placeholder: "Enter the purpose of the visit" },
                      { label: "Service Details", id: "service-details", type: "textarea", placeholder: "Enter service-related details" },
                      { label: "Is Serving", id: "is-serving", type: "checkbox" },
                      { label: "Retirement Reason", id: "retirement-reason", type: "textarea", placeholder: "Enter the reason for retirement" },
                      { label: "Last Working Period", id: "last-working-period", type: "text", placeholder: "Enter the last working period" },
                      { label: "Suspension Details", id: "suspension-details", type: "textarea", placeholder: "Enter suspension details" },
                      { label: "From Period", id: "from-period", type: "date" },
                      { label: "To Period", id: "to-period", type: "date" },
                      { label: "Reason for Suspension", id: "reason-for-suspension", type: "textarea", placeholder: "Enter the reason for suspension" },
                    ].map((field) => (
                      <div className={`sm:col-span-${field.type === "textarea" ? 3 : field.type === "checkbox" ? 3 : 3}`} key={field.id}>
                        <label htmlFor={field.id} className="block text-sm font-medium text-gray-900">
                          {field.label}
                        </label>
                        <div className="mt-2">
                          {field.type === "textarea" ? (
                            <textarea
                              id={field.id}
                              name={field.id}
                              placeholder={field.placeholder || ""}
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                            ></textarea>
                          ) : field.type === "checkbox" ? (
                            <input
                              id={field.id}
                              name={field.id}
                              type={field.type}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                            />
                          ) : (
                            <input
                              id={field.id}
                              name={field.id}
                              type={field.type}
                              placeholder={field.placeholder || ""}
                              min={field.min || undefined}
                              max={field.max || undefined}
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                            />
                          )}
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
ModalOtherDetails.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
}
