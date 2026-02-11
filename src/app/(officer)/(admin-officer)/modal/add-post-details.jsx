'use client'

import PropTypes from 'prop-types' // Import for prop validation
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import axiosInstance from '@/utils/apiClient'
import { toast } from "react-toastify";

export function ModalAddPostDetails({ open = false, setOpen, post = null, onSave, masterData = { office: [] },  serviceTypeMap = {}}) {
  if (typeof open !== 'boolean') {
    console.error('The `open` prop for `ModalAddPostDetails` must be a boolean.')
    return null // Prevent rendering if `open` is invalid
  }

  const [formData, setFormData] = useState({
    post_name: '',
    max_no_of_officer: '',
    service_type_id: '',
    office_id: '',
    
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({});
  // const [masters, setMasters] = useState({ office: [] })

  useEffect(() => {
    if (open && !post) {
      setFormData({
        post_id: '',
        max_no_of_officer: '',
        service_type_id: '',
        office_id: '',
      })
      
    } else if(post) {
      setFormData({
        post_id: post.post_id || '',
        max_no_of_officer: post.max_no_of_officer || '',
        service_type_id: post.service_type_id || '',
        office_id: post.office_id || '',
      })
      
    }
  }, [post, open])

  const handleChange = (e) => {
    const { name, value } = e.target

    let errorMsg = '';
    if (name === 'max_no_of_officer') {
      const num = Number(value);
      if (num < 1 || num > 1000) {
        errorMsg = 'This value is not allowed';
      }
    }
  
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (post && post.office_post) {
        await axiosInstance.put(`/admin/office-post/${post.office_post}`, formData)
        toast.success("Officer Post Updated Successfully");
      } else {
        await axiosInstance.post('/admin/office-post', formData)
        toast.success("Officer Post Added Successfully")
      }
      onSave()
      setIsSubmitting(false)
      setOpen(false)
    } catch (error) {
      toast.error("Failed to save data");
      console.error('Error saving post data:', error.response?.data || error.message)
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
        {/* Select Fields */}
        {[
                          { label: 'Office Name', id: 'office_id', options: masterData.office ,optionName:'office_name'},
                          { label: 'Post Name', id: 'post_id', options: masterData.post,optionName:'post_name'},
                        ].map((field) => (
                          <div className="sm:col-span-3" key={field.id}>
                            <label htmlFor={field.id} className="block text-sm font-medium text-gray-900">{field.label}<span className="text-red-600">*</span></label>
                            <div className="mt-2">
                              <select
                                id={field.id}
                                name={field.id}
                                value={formData[field.id] || ''}
                                onChange={handleChange}
                                required
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                              >
                                <option value="">Select {field.label}</option>
                                {field.options.map((option) => {
                                 
                                 const optionId = field.optionValue ? option[field.optionValue] : option[field.id];
  // Dynamically get option ID
                                 const optionName = option[field.optionName]; // Dynamically get option Name
                       
                                 return (
                                   <option key={optionId} value={optionId}>
                                     {optionName}
                                   </option>
                                  )
                                })}
                              </select>
                            </div>
                          </div>
                        ))}

<div className="sm:col-span-3">
  <label htmlFor="max_no_of_officer" className="block text-sm font-medium text-gray-900">
    Max no. of Officer
    <span className="text-red-600">*</span></label>
  <div className="mt-2">
    <input
      id="max_no_of_officer"
      name="max_no_of_officer"
      type="number"
      placeholder="Enter Max no. of Officer"
      value={formData.max_no_of_officer || ''}
      onChange={handleChange}
      required
      min={1}
      max={1000}
      step={1}
      className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
    />
    {errors?.max_no_of_officer && (
      <p className="text-sm text-red-600 mt-1">{errors.max_no_of_officer}</p>
    )}
  </div>
</div>

        
        {/* Other Input Fields */}
        <div className="sm:col-span-3">
  <label htmlFor="service_type_id" className="block text-sm font-medium text-gray-900">
    Service Type
    <span className="text-red-600">*</span></label>
  <div className="mt-2">
    <select
      id="service_type_id"
      name="service_type_id"
      value={formData.service_type_id || ''}
      onChange={handleChange}
      required
      className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
    >
      <option value="">Select Service Type</option>
      {Object.entries(serviceTypeMap).map(([id, name]) => (
        <option key={id} value={id}>
          {name}
        </option>
      ))}
    </select>
  </div>
</div>

       

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
