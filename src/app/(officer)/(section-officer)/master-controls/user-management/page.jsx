'use client'

import { useState, useEffect, useMemo } from 'react'
import { PencilSquareIcon, PlusIcon } from '@heroicons/react/16/solid'
import axiosInstance from '@/utils/apiClient'
import { ModalUserDetails } from './modal/user-details'
import Link from 'next/link'
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from "../../../../components/dataTableControls"

export default function UserManagementPage() {
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
      const response = await axiosInstance.get('/clerk/officers')
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

 // Filter officers based on search term
  const filteredOfficers = useMemo(() => {
    const trimmedSearch = searchTerm.trim().toLowerCase(); // Remove leading/trailing spaces

    return officerData.filter((officer) =>
      `${officer.first_name} ${officer.last_name}, ${officer.ais_number}, ${officer.dob}, ${officer.mobile_no}, ${officer.pen_number}`
        .toLowerCase()
        .includes(trimmedSearch)
    );
  }, [searchTerm, officerData]);


  // Pagination Logic
  const paginatedOfficers = filteredOfficers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredOfficers.length / itemsPerPage)

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Sl. No", "Officer Name", "Email ID", "Mobile Number", "Date of Birth", "AIS Number", "PEN "]
    const rows = filteredOfficers.map((officer, index) => [
      index + 1,
      `${officer.first_name} ${officer.last_name}`,
      officer.email,
      officer.mobile_no,
      officer.dob,
      officer.ais_number,
      officer.pen_number,
    ])
    exportToCSV("officer-list.csv", headers, rows)
  }

  const handleExportPDF = () => {
    const headers = ["Sl. No", "Officer Name", "Email ID", "Mobile Number", "Date of Birth", "AIS Number", "PEN "]
    const rows = filteredOfficers.map((officer, index) => [
      index + 1,
      `${officer.first_name} ${officer.last_name}`,
      officer.email,
      officer.mobile_no,
      officer.dob,
      officer.ais_number,
      officer.pen_number,
    ])
    exportToPDF("Officer List", headers, rows, "officer-list.pdf")
  }

  const handleExportExcel = () => {
    const data = filteredOfficers.map((officer, index) => ({
      "Sl. No": index + 1,
      "Officer Name": `${officer.first_name} ${officer.last_name}`,
      "Email ID": officer.email,
      "Mobile Number": officer.mobile_no,
      "Date of Birth": officer.dob,
      "AIS Number": officer.ais_number,
      "PEN": officer.pen_number,
    }))
    exportToExcel("Officer List", data, "officer-list.xlsx")
  }

  const handleAddClick = () => {
    setSelectedOfficer(null)
    setModalOpen(true)
  }

  const handleEditClick = (officer) => {
    sessionStorage.setItem('OfficerUserId', officer.user_id)
    setSelectedOfficer(officer)
  }

  const handleSave = () => {
    fetchOfficers() // Refresh the officer list after saving
  }

  return (
    <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
      <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
        <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
          Officer List
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by Officer Name..."
          />
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
              disabled={loading}
              onClick={handleAddClick}
            >
              Add New Officer
              <PlusIcon aria-hidden="true" className="mr-0.5 size-5" />
            </button>
            <ExportButtons
              onCSV={handleExportCSV}
              onPDF={handleExportPDF}
              onExcel={handleExportExcel}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading officer list...</div>
      ) : (
        <div className="mx-auto max-w-12xl">
          <table className="table-auto w-full text-left border-collapse">
            <thead className="text-gray-600 text-sm">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sl. No</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Officer Name</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email ID</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile Number</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Birth</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AIS Number</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PEN</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOfficers.map((officer, index) => (
                <tr key={officer.user_id} className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700">
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {officer.first_name} {officer.last_name}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{officer.email}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{officer.mobile_no}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{officer.dob}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{officer.ais_number}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{officer.pen_number}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <Link
                      href={`/officer-profile`}
                      onClick={(e) => {
                        e.preventDefault()
                        handleEditClick(officer)
                        setTimeout(() => {
                          window.location.href = "/officer-profile"
                        }, 100)
                      }}
                      className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-indigo-100 px-2.5 py-1.5 text-sm font-semibold text-grey"
                    >
                      <PencilSquareIcon className="-mr-0.5 size-5 text-indigo-700" />
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

      <ModalUserDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        officer={selectedOfficer}
        onSave={handleSave}
      />
    </div>
  )
}