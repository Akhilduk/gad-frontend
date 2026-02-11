'use client'

import PropTypes from 'prop-types' // Import for prop validation
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import axiosInstance from '@/utils/apiClient'
import { SERVICE_TYPE_MAP } from '../../../../utils/serviceTypeUtils'
import { toast } from 'react-toastify' 

export function ModalAddSectionOfficerDetails({ open = false, setOpen, officer = null, onSave }) {
  if (typeof open !== 'boolean') {
    console.error('The `open` prop for `ModalAddOfficeDetails` must be a boolean.')
    return null // Prevent rendering if `open` is invalid
  }

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    dob: '',
    email: '',
    mobile_no: '',
    gad_role_id: '' 

   
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
 
  const [errors, setErrors] = useState({})
 
  useEffect(() => {
    if (open && !officer) {
      // RESET the form
      setFormData({
        first_name: '',
        last_name: '',
        dob: '',
        email: '',
        mobile_no: '',
        gad_role_id: ''
      })
      setErrors({})
    } else if (open && officer) {
      // PREFILL the form
      setFormData({
        first_name: officer.first_name || '',
        last_name: officer.last_name || '',
        dob: officer.dob || '',
        email: officer.email || '',
        mobile_no: officer.mobile_no || '',
        gad_role_id: officer.gad_role_id || ''
      })
      setErrors({})
    }
  }, [open, officer])
  


  const handleChange = (e) => {
    const { name, value } = e.target
  
   setErrors((prevErrors) => ({
    ...prevErrors,
    [name]: '', // Clear error for the field being changed
  }))

  setFormData((prevData) => ({
    ...prevData,
    [name]: value,
  }))
  }
  const validateForm = () => {
    const newErrors = {}
  
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required.'
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required.'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid.'
    }
    if (!formData.mobile_no.trim()) {
      newErrors.mobile_no = 'Mobile number is required.'
    } else if (!/^[6-9]\d{9}$/.test(formData.mobile_no)) {
      newErrors.mobile_no = 'Mobile number must be 10 digits and start with 6, 7, 8, or 9.'
    }
    
   
     if (!formData.gad_role_id) newErrors.gad_role_id = 'GAD Service Type is required.'
     
     if (!formData.dob.trim()) {
      newErrors.dob = 'Date of Birth is required.'
    } else {
      const dobDate = new Date(formData.dob)
      const today = new Date()
      let age = today.getFullYear() - dobDate.getFullYear()
      const monthDiff = today.getMonth() - dobDate.getMonth()
      const dayDiff = today.getDate() - dobDate.getDate()
      
      // Adjust age if birthday hasn’t occurred yet this year
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--
      }
    
      if (age < 18 || age > 60) {
        newErrors.dob = 'Officer must be between 18 and 60 years old.'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return // prevent submission if validation fails
  
    setIsSubmitting(true)
    try {
      if (officer) {
        await axiosInstance.put(`/admin/clerk/${officer.id}`, formData)
        toast.success("Details Updated Successfully")
      } else {
        await axiosInstance.post('/admin/clerk', formData)
        toast.success("Section Officer Created Successfully")
        
      }
      onSave()
      setOpen(false)
    } catch (error) {
      // console.error('Error saving officer data:', error.response?.data?.detail || error.message)
      const errorMessage = error.response?.data?.detail || 'Something went wrong. Please try again.'
      toast.error(errorMessage) // Show toast notification

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

                
      <div className="sm:col-span-3">
  <label htmlFor="gad_service_type" className="block text-sm font-medium text-gray-900">
    GAD Service Type
  </label>
  <div className="mt-2">
  <select
      id="gad_role_id"
      name="gad_role_id"
      value={formData.gad_role_id}
      onChange={handleChange}
      className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
    >
      <option value="">Select GAD Service</option>
      {Object.entries(SERVICE_TYPE_MAP).map(([id, label]) => (
        <option key={id} value={id}>{label}</option>
      ))}
    </select>
  </div>
  {errors.gad_role_id && (
    <p className="mt-1 text-sm text-red-600">{errors.gad_role_id}</p>
  )}
</div>

        {/* Other Input Fields */}
        {[
          { label: 'First Name', id: 'first_name', type: 'text', placeholder: 'Enter First Name' },
          { label: 'Last Name', id: 'last_name', type: 'text', placeholder: 'Enter Last Name' },
          { label: 'Date of Birth', id: 'dob', type: 'date' },
          { label: 'Email', id: 'email', type: 'email', placeholder: 'Enter Email' },
          { label: 'Mobile No', id: 'mobile_no', type: 'text', placeholder: 'Enter Mobile No' },
        
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
                placeholder={field.placeholder || ''}
                value={formData[field.id] || ''}
                onChange={handleChange}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                min={new Date(new Date().setFullYear(new Date().getFullYear() - 60)).toISOString().split('T')[0]}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              />
            </div>
            {errors[field.id] && (
    <p className="mt-1 text-sm text-red-600">{errors[field.id]}</p>
  )}
          </div>
        ))}
       
      
      </div>
    </div>

    {/* Buttons */}
    <div className="mt-6 flex items-center justify-end gap-x-6">
      <button type="button" className="text-sm font-semibold text-gray-900" onClick={() => setOpen(false)}>
        Cancel
      </button>
      <button type="submit" disabled={isSubmitting} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
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
