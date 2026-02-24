'use client'

import PropTypes from 'prop-types'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import axiosInstance from '@/utils/apiClient'
import { toast } from 'react-toastify';
export function ModalAddOfficerDetails({ open = false, setOpen, officer = null, onSave }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    dob: '',
    email: '',
    mobile_no: '',
    pen_number: '',
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open && !officer) {
      setFormData({
        first_name: '',
        last_name: '',
        dob: '',
        email: '',
        mobile_no: '',
        pen_number: '',
      })
      setErrors({})
    } else if (open && officer) {
      setFormData({
        first_name: officer.first_name || '',
        last_name: officer.last_name || '',
        dob: officer.dob || '',
        email: officer.email || '',
        mobile_no: officer.mobile_no || '',
        pen_number: officer.pen_number || '',
      })
      setErrors({})
    }
  }, [open, officer])

  const validate = () => {
    const newErrors = {}

    const isEmpty = (value) => !value || value.trim() === ''
  
    // Required fields
    Object.entries(formData).forEach(([key, value]) => {
      if (isEmpty(value)) newErrors[key] = 'This field is required'
    })
   
    // Date of Birth: Age between 18 and 60
    if (formData.dob) {
      const dob = new Date(formData.dob)
      const today = new Date()
      const age = today.getFullYear() - dob.getFullYear()
      const monthDiff = today.getMonth() - dob.getMonth()
      const isBirthdayPassed = monthDiff > 0 || (monthDiff === 0 && today.getDate() >= dob.getDate())
      const calculatedAge = isBirthdayPassed ? age : age - 1
      if (calculatedAge < 18 || calculatedAge > 60) {
        newErrors.dob = 'Age must be between 18 and 60'
      }
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email'
    }

    // Mobile No validation
    if (formData.mobile_no && !/^\d{10}$/.test(formData.mobile_no)) {
      newErrors.mobile_no = 'Mobile number must be exactly 10 digits'
    }

    // PEN validation
    if (formData.pen_number) {
      if (!/^\d{10}$/.test(formData.pen_number)) {
  newErrors.pen_number = 'PEN must be exactly 10 digits'
}

    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
    setErrors((prev) => ({ ...prev, [name]: '' })) // clear field error on change
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  if (!validate()) {
    toast.error('Failed to save officer details')
    return
  }

  setIsSubmitting(true)
  try {
    if (officer) {
      await axiosInstance.put(`/admin/admin-officer/${officer.user_id}`, formData)
      toast.success('Officer details updated successfully')
    } else {
      await axiosInstance.post('/admin/admin-officer', formData)
      toast.success('Officer added successfully')
    }

    onSave()
    setOpen(false)
  } catch (error) {
    console.error('Error saving officer data:', error.response?.data || error.message)
    const msg =
      error.response?.data?.detail ||
      'An error occurred while saving the officer'
    toast.error(msg)
  } finally {
    setIsSubmitting(false)
  }
}

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
                    {[
                      { label: 'First Name', id: 'first_name', type: 'text', placeholder: 'Enter First Name' },
                      { label: 'Last Name', id: 'last_name', type: 'text', placeholder: 'Enter Last Name' },
                      { label: 'Date of Birth', id: 'dob', type: 'date' },
                      { label: 'Email', id: 'email', type: 'email', placeholder: 'Enter Email' },
                      { label: 'Mobile No', id: 'mobile_no', type: 'text', placeholder: 'Enter Mobile No' },
                      { label: 'PEN', id: 'pen_number', type: 'text', placeholder: 'Enter PEN' },

                    ].map((field) => (
                      <div className="sm:col-span-3" key={field.id}>
                        <label htmlFor={field.id} className="block text-sm font-medium text-gray-900">
                          {field.label}
                        </label>
                        <div className="mt-2">
                         <input
                            id={field.id}
                            name={field.id}
                            type="text"
                            placeholder={field.placeholder || ''}
                            value={formData[field.id]}
                            onChange={(e) => {
                              const { name, value } = e.target
                              if (field.id === 'pen_number') {
                                const numeric = value.replace(/\D/g, '') // allow only digits
                                if (numeric.length <= 10) {
                                  setFormData((prev) => ({ ...prev, [name]: numeric }))
                                }
                              } else {
                                handleChange(e)
                              }
                            }}
                            inputMode="numeric"
                            className={`block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset placeholder:text-gray-400 sm:text-sm
                              ${errors[field.id] ? 'ring-red-500 focus:ring-red-500' : 'ring-gray-300 focus:ring-indigo-600'}
                            `}
                          />

                          {errors[field.id] && (
                            <p className="mt-1 text-sm text-red-600">{errors[field.id]}</p>
                          )}
                        </div>
                      </div>
                    ))}
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
                    disabled={isSubmitting}
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
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
  )
}

ModalAddOfficerDetails.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  officer: PropTypes.object,
  onSave: PropTypes.func.isRequired,
}
