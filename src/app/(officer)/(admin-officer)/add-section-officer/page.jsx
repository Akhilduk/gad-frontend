'use client'

import { useState, useEffect, useMemo } from 'react'
import { PencilSquareIcon, PlusIcon } from '@heroicons/react/16/solid'
import axiosInstance from '@/utils/apiClient'
import { ModalAddSectionOfficerDetails } from '../modal/add-section-officer-details'
import Link from 'next/link'
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel
} from '../../../components/dataTableControls'
import { GAD_TYPE_MAP } from '@/utils/serviceTypeUtils'

export default function SectionOfficerList() {
  const [isModalOpen, setModalOpen] = useState(false)
  const [officerData, setOfficerData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOfficer, setSelectedOfficer] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

  const fetchOfficers = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/admin/clerk')
      setOfficerData(response.data.data || [])
    } catch (error) {
      console.error('Error fetching officer data:', error.response?.data || error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOfficers()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

const filteredOfficers = useMemo(() => {
  return officerData.filter((officer) => {
    const fullName = `${officer.first_name} ${officer.last_name}`.toLowerCase()
    const serviceType = (GAD_TYPE_MAP[officer.gad_role_id] || 'N/A').toLowerCase()
    const email = officer.email?.toLowerCase() || ''
    const mobile = officer.mobile_no?.toLowerCase() || ''
    const dob = officer.dob?.toLowerCase() || ''
    const search = searchTerm.toLowerCase()

    return (
      fullName.includes(search) ||
      serviceType.includes(search) ||
      email.includes(search) ||
      mobile.includes(search) ||
      dob.includes(search)
    )
  })
}, [searchTerm, officerData])


  const paginatedOfficers = filteredOfficers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredOfficers.length / itemsPerPage)

  const handleSave = () => fetchOfficers()

  const handleEditClick = (officer) => {
    sessionStorage.setItem('OfficerUserId', officer.user_id)
    setSelectedOfficer(officer)
    setModalOpen(true)
  }

  const handleExportCSV = () => {
    const headers = ['Sl. No', 'Officer Name', 'Service Type', 'Email', 'Mobile', 'DOB' ]
    const rows = filteredOfficers.map((o, i) => [
      i + 1,
      `${o.first_name} ${o.last_name}`,
      GAD_TYPE_MAP[o.gad_role_id] || 'N/A',
      o.email,
      o.mobile_no,
      o.dob,
 
    ])
    exportToCSV('section_officer_list.csv', headers, rows)
  }

  const handleExportPDF = () => {
    const headers = ['Sl. No', 'Officer Name', 'Service Type', 'Email', 'Mobile', 'DOB']
    const rows = filteredOfficers.map((o, i) => [
      i + 1,
      `${o.first_name} ${o.last_name}`,
      GAD_TYPE_MAP[o.gad_role_id] || 'N/A',
      o.email,
      o.mobile_no,
      o.dob,
  
    ])
    exportToPDF('Section Officer List', headers, rows, 'section_officer_list.pdf')
  }

  const handleExportExcel = () => {
    const data = filteredOfficers.map((o, i) => ({
      'Sl. No': i + 1,
      'Officer Name': `${o.first_name} ${o.last_name}`,
      'Service Type': GAD_TYPE_MAP[o.gad_role_id] || 'N/A',
      'Email': o.email,
      'Mobile': o.mobile_no,
      'DOB': o.dob,
    }))
    exportToExcel('Section Officer List', data, 'section_officer_list.xlsx')
  }

  return (
    <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
      <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
        <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">Section Officer List</h3>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search Section Officer..." />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              onClick={() => {
                setSelectedOfficer(null)
                setModalOpen(true)
              }}
            >
              Add New Section Officer <PlusIcon aria-hidden="true" className="mr-0.5 size-5" />
            </button>
            <ExportButtons onCSV={handleExportCSV} onPDF={handleExportPDF} onExcel={handleExportExcel} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading Section Officer list...</div>
      ) : (
        <div className="mx-auto max-w-12xl overflow-x-auto">
          <table className="table-auto w-full text-left border-collapse">
            <thead className="text-gray-600 text-sm">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sl No</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Officer Name</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>        
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOfficers.map((officer, index) => (
                <tr key={index} className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700">
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                    {officer.first_name} {officer.last_name}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                    {GAD_TYPE_MAP[officer.gad_role_id] || 'N/A'}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">{officer.email}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">{officer.mobile_no}</td>               
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">{officer.dob}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white text-right">
                    <Link
                      href="/officer-profile"
                      onClick={(e) => {
                        e.preventDefault()
                        handleEditClick(officer)
                      }}
                      className="text-indigo-500"
                    >
                      <PencilSquareIcon className="size-6" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevious={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        onNext={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
      />

      <ModalAddSectionOfficerDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        officer={selectedOfficer}
        onSave={handleSave}
      />
    </div>
  )
}
