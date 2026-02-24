'use client'

import PropTypes from 'prop-types'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import axiosInstance from '@/utils/apiClient'
import { toast } from 'react-toastify'
import ConfirmModal from '@/app/components/confirmModal' // Import your ConfirmModal component

// Service type mapping for modal and backend
const serviceTypeMap = {
  IAS: 1,
  IPS: 2,
  IFS: 3,
}

export function ModalOfficialDetails({
  open = false,
  setOpen,
  officer = null,
  onSave,
}) {
  const [formData, setFormData] = useState({
    pen_number: '',
    dob: '',
    service_type: '',
    email: '',
    mobile_no: '',
  })

  const [error, setError] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Add state for confirmation modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)

  // Date validation setup
  const currentDate = new Date()
  const maxDate = new Date()
  maxDate.setFullYear(currentDate.getFullYear() - 18)
  const maxDateString = maxDate.toISOString().split('T')[0]

  useEffect(() => {
    if (officer) {
      const serviceType = Object.keys(serviceTypeMap).find(
        (key) => serviceTypeMap[key] === officer.service_type_id
      ) || ''
      setFormData({
        pen_number: officer.pen_number || '',
        dob: officer.dob || '',
        service_type: officer.service_type || serviceType,
        email: officer.email || '',
        mobile_no: officer.mobile_no || '',
      })
    } else {
      setFormData({
        pen_number: '',
        dob: '',
        service_type: '',
        email: '',
        mobile_no: '',
      })
    }
    setError({})
    setConfirmModalOpen(false)
    setPendingSubmit(false)
  }, [open, officer])

  const validateForm = () => {
    const errors = {}
    const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

    if (!formData.pen_number.trim()) {
      errors.pen_number = 'PEN is required'
    } else if (!/^\d{6,7}$/.test(formData.pen_number)) {
      errors.pen_number = 'PEN must be 6 to 7 digits'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Invalid email format'
    }

    if (!formData.mobile_no.trim()) {
      errors.mobile_no = 'Mobile number is required'
    } else if (!/^[6-9]\d{9}$/.test(formData.mobile_no)) {
      errors.mobile_no =
        'Mobile number must be 10 digits and start with 6, 7, 8, or 9'
    }

    if (!formData.dob) {
      errors.dob = 'Date of birth is required'
    } else {
      const dobDate = new Date(formData.dob)
      if (dobDate > maxDate ) {
        errors.dob = 'Officer must be at least 21 years old'
      }
    }

    if (!formData.service_type) {
      errors.service_type = 'Service Type is required'
    }

    setError(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    // For new officer onboarding, show confirmation modal first
    if (!officer?.user_id) {
      setPendingSubmit(true)
      setConfirmModalOpen(true)
    } else {
      // For editing existing officer, save directly
      await performSave()
    }
  }

  // Actual save function that calls the API
  const performSave = async () => {
    setIsSubmitting(true)
    try {
      const payload = {
        ...formData,
        service_type_id: serviceTypeMap[formData.service_type] || null,
      }
      delete payload.service_type

      if (officer?.user_id) {
        await axiosInstance.put(`/clerk/officers/${officer.user_id}`, payload)
        toast.success('Officer details updated successfully!')
      } else {
        await axiosInstance.post('/as-II/officers', payload)
        toast.success('Officer onboarded successfully!')
      }

      onSave()
      setOpen(false)
    } catch (error) {
      console.error('Error saving officer:', error)
      toast.error(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to save officer data'
      )
    } finally {
      setIsSubmitting(false)
      setPendingSubmit(false)
    }
  }

  // Handle confirmation for new officer onboarding
const handleConfirmOnboarding = () => {
  setConfirmModalOpen(false);
  setPendingSubmit(false); // Reset here as well for consistency
  performSave();
}

  return (
    <>
      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" />
        <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel className="relative w-full max-w-md transform rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 ease-in-out sm:max-w-lg">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 focus:outline-none"
                disabled={isSubmitting}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon aria-hidden="true" className="h-6 w-6" />
              </button>

              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {officer ? 'Edit Officer Details' : 'Add New Officer'}
                </h2>

                {/* PEN Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    PEN 
                  </label>
                  <input
                    type="text"
                    name="pen_number"
                    value={formData.pen_number}
                    onChange={handleChange}
                    maxLength={7}
                    disabled={isSubmitting || (officer?.user_id && officer?.pen_number)}
                    className={`mt-1 block w-full rounded-lg border-2 py-2 px-3 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      error.pen_number ? 'border-red-400' : 'border-gray-200'
                    } ${(officer?.user_id && officer?.pen_number) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="Enter 6-7 digit PEN"
                  />
                  {error.pen_number && (
                    <p className="mt-1 text-sm text-red-500">{error.pen_number}</p>
                  )}
                  {(officer?.user_id && officer?.pen_number) && (
                    <p className="mt-1 text-xs text-gray-500">PEN number cannot be changed after onboarding</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={`mt-1 block w-full rounded-lg border-2 py-2 px-3 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      error.email ? 'border-red-400' : 'border-gray-200'
                    }`}
                    placeholder="Enter email address"
                  />
                  {error.email && (
                    <p className="mt-1 text-sm text-red-500">{error.email}</p>
                  )}
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobile_no"
                    value={formData.mobile_no}
                    onChange={handleChange}
                    maxLength={10}
                    disabled={isSubmitting}
                    className={`mt-1 block w-full rounded-lg border-2 py-2 px-3 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      error.mobile_no ? 'border-red-400' : 'border-gray-200'
                    }`}
                    placeholder="Enter 10-digit mobile number"
                  />
                  {error.mobile_no && (
                    <p className="mt-1 text-sm text-red-500">{error.mobile_no}</p>
                  )}
                </div>

                {/* DOB */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    // max={maxDateString}
                    disabled={isSubmitting || (officer?.user_id && officer?.dob)}
                    className={`mt-1 block w-full rounded-lg border-2 py-2 px-3 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      error.dob ? 'border-red-400' : 'border-gray-200'
                    } ${(officer?.user_id && officer?.dob) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                  {error.dob && (
                    <p className="mt-1 text-sm text-red-500">{error.dob}</p>
                  )}
                  {(officer?.user_id && officer?.dob) && (
                    <p className="mt-1 text-xs text-gray-500">Date of birth cannot be changed after onboarding</p>
                  )}
                </div>

                {/* Service Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Service Type
                  </label>
                  <select
                    name="service_type"
                    value={formData.service_type}
                    onChange={handleChange}
                    disabled={isSubmitting || (officer?.user_id && officer?.service_type_id)}
                    className={`mt-1 block w-full rounded-lg border-2 py-2 px-3 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      error.service_type ? 'border-red-400' : 'border-gray-200'
                    } ${(officer?.user_id && officer?.service_type_id) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Select Service Type</option>
                    {Object.keys(serviceTypeMap).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {error.service_type && (
                    <p className="mt-1 text-sm text-red-500">{error.service_type}</p>
                  )}
                  {(officer?.user_id && officer?.service_type_id) && (
                    <p className="mt-1 text-xs text-gray-500">Service type cannot be changed after onboarding</p>
                  )}
                </div>

                {/* Buttons */}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={isSubmitting}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || pendingSubmit}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : officer ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* Confirmation Modal for New Officer Onboarding */}
     <ConfirmModal
  isOpen={confirmModalOpen}
  setIsOpen={(open) => {
    setConfirmModalOpen(open);
    if (!open) {
      setPendingSubmit(false); // Reset when modal is closed via backdrop, escape, or cancel button
    }
  }}
  onConfirm={handleConfirmOnboarding}
  title="Confirm Officer Onboarding"
  message="You are about to onboard a new officer. Please note that ALL fields including PEN number, email, mobile number, date of birth, and service type are permanent and cannot be edited after onboarding. Please ensure all information is correct before proceeding."
  iconType="warning"
  confirmText="Yes, Continue with Onboarding"
  confirmButtonDisabled={isSubmitting}
/>
    </>
  )
}

ModalOfficialDetails.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func.isRequired,
  officer: PropTypes.object,
  onSave: PropTypes.func.isRequired,
}