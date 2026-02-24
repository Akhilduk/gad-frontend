'use client';

import { useState, useEffect, useMemo } from 'react';
import { PencilSquareIcon, PlusIcon } from '@heroicons/react/16/solid';
import axiosInstance from '@/utils/apiClient';
import { ModalAddOfficerDetails } from '../modal/add-officer-details';
import { ModalViewOfficerDetails } from '../modal/view-officer';
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from '../../../components/dataTableControls';

export function OfficerList() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [officerData, setOfficerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [viewOfficer, setViewOfficer] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);

  useEffect(() => {
    fetchOfficers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/admin/admin-officer');
      setOfficerData(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching officer data:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredOfficers = useMemo(() => {
    return officerData.filter((officer) =>
      `${officer.first_name} ${officer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, officerData]);

  const paginatedOfficers = filteredOfficers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredOfficers.length / itemsPerPage);

  const handleAddClick = () => {
    setSelectedOfficer(null);
    setModalOpen(true);
  };

  const handleEditClick = (officer) => {
    sessionStorage.setItem('OfficerUserId', officer.user_id);
    setSelectedOfficer(officer);
    setModalOpen(true);
  };

  const handleSave = () => {
    fetchOfficers();
  };

  const handleExportCSV = () => {
    const headers = ['Sl No', 'Officer Name', 'Email', 'Mobile', 'DOB'];
    const rows = filteredOfficers.map((officer, index) => [
      index + 1,
      `${officer.first_name} ${officer.last_name}`,
      officer.email,
      officer.mobile_no,
      officer.dob,
    ]);
    exportToCSV('officers.csv', headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['Sl No', 'Officer Name', 'Email', 'Mobile', 'DOB'];
    const rows = filteredOfficers.map((officer, index) => [
      index + 1,
      `${officer.first_name} ${officer.last_name}`,
      officer.email,
      officer.mobile_no,
      officer.dob,
    ]);
    exportToPDF('Officers', headers, rows, 'officers.pdf');
  };

  const handleExportExcel = () => {
    const data = filteredOfficers.map((officer, index) => ({
      'Sl. No': index + 1,
      'Officer Name': `${officer.first_name} ${officer.last_name}`,
      'Email': officer.email,
      'Mobile': officer.mobile_no,
      'DOB': officer.dob,
    }));
    exportToExcel('Officers', data, 'officers.xlsx');
  };

  return (
    <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
      <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
        <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">Officer List</h3>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search Officer..." />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              onClick={handleAddClick}
            >
              Add New Officer
              <PlusIcon aria-hidden="true" className="mr-0.5 size-5" />
            </button>
            <ExportButtons onCSV={handleExportCSV} onPDF={handleExportPDF} onExcel={handleExportExcel} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading officer list...</div>
      ) : (
        <div className="mx-auto max-w-12xl overflow-x-auto">
          <table className="table-auto w-full text-left border-collapse">
            <thead className="text-gray-600 text-sm">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sl. No</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">View</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOfficers.map((officer, index) => (
                <tr key={officer.user_id} className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700">
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">{officer.first_name} {officer.last_name}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">{officer.email}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">{officer.mobile_no}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">{officer.dob}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                    <button
                      onClick={() => handleEditClick(officer)}
                      className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-indigo-700 hover:ring-indigo-700 px-2.5 py-1.5 text-sm font-semibold"
                    >
                      Edit <PencilSquareIcon className="-mr-0.5 size-5" />
                    </button>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                    <button
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                      onClick={() => {
                        setViewOfficer(officer);
                        setViewOpen(true);
                      }}
                    >
                      View
                    </button>
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

      <ModalAddOfficerDetails open={isModalOpen} setOpen={setModalOpen} officer={selectedOfficer} onSave={handleSave} />

      <ModalViewOfficerDetails open={viewOpen} setOpen={setViewOpen} officer={viewOfficer} />
    </div>
  );
}
