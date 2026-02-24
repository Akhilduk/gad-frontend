'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import axiosInstance from '@/utils/apiClient'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
export function ModalViewOfficerDetails({ open, setOpen, officer }) {
 
  const [officeList, setOfficeList] = useState([])
  const [officePosts, setOfficePosts] = useState([])
  const [selectedOfficeId, setSelectedOfficeId] = useState(null)
  const [selectedPostId, setSelectedPostId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!open) return

      try {
        const [officeRes, postRes] = await Promise.all([
          axiosInstance.get('/masters/office/'),
          axiosInstance.get('/admin/office-post/')
        ])

        setOfficeList(officeRes.data.data.office || [])
        setOfficePosts(postRes.data.data.office_post || [])
      } catch (error) {
        console.error('Error fetching data:', error.response?.data || error.message)
      }
    }

    fetchData()
  }, [open])

  useEffect(() => {
    if (officer?.office_id) {
      setSelectedOfficeId(officer.office_id)
    }
  }, [officer])

  if (!officer) return null

  const filteredPosts = officePosts.filter(post => post.office_id === Number(selectedOfficeId))

  const handleSaveMapping = async () => {
  if (!selectedOfficeId || !selectedPostId || !startDate || !endDate) {
    toast.error('Please fill all required fields')
    return
  }

  try {
    setIsSaving(true)

    const officePostData = {
      user_id: officer.user_id,
      office_id: selectedOfficeId,
      office_post_id: selectedPostId,
      is_additional_charge: officer.is_additional_charge || false,
      start_date: startDate,
      end_date: endDate,
    }

    await axiosInstance.post('admin/officer-office-post', officePostData)
   
    toast.success('Mapping saved successfully!')
    setOpen(false)
  } catch (error) {
    console.error('Error saving mapping:',error)
    toast.error(error.response.data.message || 'An error occurred while saving the mapping')
  } finally {
    setIsSaving(false)
  }
}


  const fields = [
    { label: 'First Name', value: officer.first_name },
    { label: 'Last Name', value: officer.last_name },
    { label: 'Date of Birth', value: officer.dob },
    { label: 'Email', value: officer.email },
    { label: 'Mobile No', value: officer.mobile_no },
    { label: 'PEN', value: officer.pen_number },
  ]

  return (
    <Dialog open={open} onClose={() => setOpen(false)} className="relative z-10">
      <DialogBackdrop className="fixed inset-0 bg-gray-800/70 transition-opacity" />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <DialogPanel className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 text-left shadow-xl transition-all">
            {/* Close Button */}
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Header */}
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Officer Details</h2>

            {/* Basic Info */}
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
                {fields.map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-base font-medium text-gray-900">{value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Office Mapping */}
            <div className="border border-indigo-200 rounded-lg p-6 bg-indigo-50">
              <h3 className="text-md font-semibold text-indigo-800 mb-4">Office Mapping</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
                {/* Office Select */}
                <div>
                  <p className="text-sm text-indigo-700 mb-1">Mapped Office</p>
                  <select
                    value={selectedOfficeId || ''}
                    onChange={(e) => {
                      setSelectedOfficeId(e.target.value)
                      setSelectedPostId('')
                    }}
                    className="w-full rounded-md border border-indigo-300 bg-white px-3 py-2 text-sm text-indigo-900 shadow-sm focus:outline-none"
                  >
                    <option value="">Select Office</option>
                    {officeList.map((office) => (
                      <option key={office.office_id} value={office.office_id}>
                        {office.office_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Additional Charge Field */}
                <div>
                  <p className="text-sm text-indigo-700 mb-1">Is Additional Charge?</p>
                  <input
                    type="text"
                    value={officer.is_additional_charge ? 'Yes' : 'No'}
                    disabled
                    className="w-full rounded-md border border-indigo-300 bg-white px-3 py-2 text-sm text-indigo-900 shadow-sm focus:outline-none"
                  />
                </div>

                {/* Post Name Select */}
                <div className="sm:col-span-2">
                  <p className="text-sm text-indigo-700 mb-1">Post Name</p>
                  <select
                    value={selectedPostId}
                    onChange={(e) => setSelectedPostId(e.target.value)}
                    className="w-full rounded-md border border-indigo-300 bg-white px-3 py-2 text-sm text-indigo-900 shadow-sm focus:outline-none"
                  >
                    <option value="">Select Post</option>
                    {filteredPosts.map((post) => (
                      <option key={post.office_post_id} value={post.office_post_id}>
                        {post.post_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <p className="text-sm text-indigo-700 mb-1">Start Date</p>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-md border border-indigo-300 bg-white px-3 py-2 text-sm text-indigo-900 shadow-sm focus:outline-none"
                  />
                </div>

                {/* End Date */}
                <div>
                  <p className="text-sm text-indigo-700 mb-1">End Date</p>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-md border border-indigo-300 bg-white px-3 py-2 text-sm text-indigo-900 shadow-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setOpen(false)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none"
              >
                Close
              </button>

              <button
                onClick={handleSaveMapping}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Add Mapping'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
