'use client'

import { useState, useEffect } from 'react'
import { PencilSquareIcon, PlusIcon , TrashIcon } from '@heroicons/react/16/solid'
import axiosInstance from '@/utils/apiClient'
import { ModalAddOfficeDetails } from '../modal/add-office-details'
import ConfirmModal from '../../../components/confirmModal' 
import { toast } from 'react-toastify';
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from '../../../components/dataTableControls';

export function OfficeList() {
  const [isModalOpen, setModalOpen] = useState(false)
  const [officeData, setOfficeData] = useState([])  
  const [loading, setLoading] = useState(true)
  const [selectedOffice, setSelectedOffice] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [officeToDelete, setOfficeToDelete] = useState(null) 
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25
  
  const [masterData, setMasterData] = useState({
    district: [],
    state: []
  })

  const fetchOffices = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/masters/office/')
     
      setOfficeData(Array.isArray(response?.data?.data?.office) ? response.data.data.office : [])
    } catch (error) {
      console.error('Error fetching office data:', error.response?.data || error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const fetchMasterData = async () => {
    try {
      const [districtRes, stateRes] = await Promise.all([
        axiosInstance.get('/masters/district/'),
        axiosInstance.get('/masters/state/'),
      ])
      setMasterData({
        district: districtRes.data?.data?.district || [],
        state: stateRes.data?.data?.state || [],
      })
    } catch (error) {
      console.error('Error fetching master data:', error)
    }
  }
  
  useEffect(() => {
    fetchOffices()
    fetchMasterData()
  }, [])

  useEffect(() => {
  setCurrentPage(1); 
  }, [searchTerm]);


  const handleDeleteClick = (office_id) => {
    setOfficeToDelete(office_id)
    setConfirmOpen(true)
  }
  
  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/masters/office/${officeToDelete}/`)
      toast.success('Office deleted successfully')
      fetchOffices()
    } catch (error) {
      console.error("Error deleting office:", error.response?.data || error.message)
      toast.error('Failed to delete Office')
    } finally {
      setOfficeToDelete(null)
    }
  }

  const getDistrictName = (id) => {
    const district = masterData.district.find(d => d.district_id === id)
    return district ? district.district : '-'
  }
  
  const getStateName = (id) => {
    const state = masterData.state.find(s => s.state_id === id)
    return state ? state.state : '-'
  }

  const filteredoffice = officeData.filter(office =>
          office.office_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  
      const paginatedOffice = filteredoffice.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage
      );
  
      const totalPages = Math.ceil(filteredoffice.length / itemsPerPage);



    const handleExportCSV = () => {
      const headers = ['Sl. No', 'Office'];
      const rows = filteredoffice.map((office, index) => [index + 1, office.office_name]);
      exportToCSV('office.csv', headers, rows);
    };
  
    const handleExportPDF = () => {
      const headers = ['Sl. No', 'Office'];
      const rows = filteredoffice.map((office, index) => [index + 1, office.office_name]);
      exportToPDF('Office', headers, rows, 'office.pdf');
    };
  
    const handleExportExcel = () => {
      const data = filteredoffice.map((office, index) => ({
        'Sl. No': index + 1,
        'Office Name': office.office_name,
      }));
      exportToExcel('Office', data, 'office.xlsx');
    };


  const handleSave = () => {
    fetchOffices() 
  }

  return (
    <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
      <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
        <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase"> Office List</h3>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    
                       <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search Office..."/>
       
                       <div className="flex flex-col gap-2">

                         <button
                           type="button"
                           className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                           onClick={() => {
                             setSelectedOffice(null);
                             setModalOpen(true);
                           }}
                         >
                           Add New Office
                           <PlusIcon aria-hidden="true" className="mr-0.5 size-5" />
                         </button>
       
                         {/* Export Buttons */}
                         <ExportButtons onCSV={handleExportCSV} onPDF={handleExportPDF} onExcel={handleExportExcel} />
                       </div>
                     </div>
                     </div>
     

      {loading ? (
        <div className="text-center py-4">Loading office list...</div>
      ) : (
        <div className="mx-auto max-w-12xl overflow-x-auto">
          <table className="table-auto w-full text-left border-collapse">
            <thead className="text-gray-600 text-sm">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sl. No</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Office Name</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Office Address</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Office Mobile</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider float-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOffice.map((office, index) => (
                            <tr
                              key={office.office_id}
                              className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                            >
                              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {(currentPage - 1) * itemsPerPage + index + 1}
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">{office.office_name}</td>
                              <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">{office.office_address}</td>
                              <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">{office.office_mobile}</td>
                              <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">{getDistrictName(office.district_id)}</td>
                              <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">{getStateName(office.state_id)}</td>
                              <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-indigo-700 hover:ring-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-grey"
                                    onClick={() => {
                                      setSelectedOffice(office);
                                      setModalOpen(true);
                                    }}
                                  >
                                    Edit <PencilSquareIcon aria-hidden="true" className="-mr-0.5 size-5" />
                                  </button>
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-red-600 hover:bg-red-600 hover:text-white hover:ring-0 px-2.5 py-1.5 text-sm font-semibold text-grey"
                                    onClick={() => handleDeleteClick(office.office_id)}
                                  >
                                    <TrashIcon aria-hidden="true" className="-mr-0.5 size-5" />
                                  </button>
                                </div>
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

      <ConfirmModal
        isOpen={confirmOpen}
        setIsOpen={setConfirmOpen}
        onConfirm={confirmDelete}
        title="Delete Office"
        message="Are you sure you want to delete this office? This action cannot be undone."
        iconType = "delete"
      />

      <ModalAddOfficeDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        office={selectedOffice}
        onSave={handleSave}
        masterData={masterData}
      />

    </div>
  );
}
