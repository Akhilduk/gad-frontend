"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import axiosInstance from "@/utils/apiClient";
import { toast } from 'react-toastify';

import {
  TrashIcon,
  PencilSquareIcon,
  PlusIcon,
} from "@heroicons/react/16/solid";

import { ModalDistrictDetails } from "../modal/district-details";
import ConfirmModal from '../../../../components/confirmModal';
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from '../../../../components/dataTableControls';


export default function DistrictList() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [districtList, setDistricList] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districtToDelete, setDistrictToDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
    

  const fetchDistricts = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/masters/district`);
      setDistricList(response.data.data.district);
    } catch (error) {
      console.error("Error fetching districts:", error);
    }
  }, []);
  
  useEffect(() => {
    fetchDistricts();
  }, [fetchDistricts]); 
  
  useEffect(() => {
    setCurrentPage(1); // reset to first page when search changes
  }, [searchTerm]);

  const handleAddOrUpdate = async (DistrictData) => {
            try {
                let response;
                if (DistrictData.district_id) {
                    const { district_id, ...DistrictDataWithoutId } = DistrictData;
                    response = await axiosInstance.put(`/masters/district/${district_id}`, DistrictDataWithoutId);
                    toast.success('District updated successfully');
                } else {
                    response = await axiosInstance.post('/masters/district', DistrictData);
                    toast.success('District added successfully');
                }
                fetchDistricts();
                setModalOpen(false);
                setSelectedDistrict(null);
            } catch (error) {
                const errorMessage = error.response?.data?.detail || 'Something went wrong. Please try again.'
            toast.error(errorMessage);
            }
        };
  
      const handleDeleteClick = (district_id) => {
            setDistrictToDelete(district_id);
            setConfirmOpen(true);
        };
    
        const confirmDelete = async () => {
            try {
                await axiosInstance.delete(`/masters/district/${districtToDelete}`);
                fetchDistricts();
                toast.success(' District deleted successfully')
            } catch (error) {
                console.error('Error deleting district:', error);
                toast.error('Failed to delete District.');
            } finally {
                setDistrictToDelete(null);
            }
        };
  
  
  
        const filtereddistrict = districtList.filter(district =>
                district.district.toLowerCase().includes(searchTerm.toLowerCase())
            );
        
            const paginatedDistrict = filtereddistrict.slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
            );
        
            const totalPages = Math.ceil(filtereddistrict.length / itemsPerPage);
  
  
         // Export handlers
          const handleExportCSV = () => {
            const headers = ['Sl. No', 'District'];
            const rows = filtereddistrict.map((district, index) => [index + 1, district.district]);
            exportToCSV('district.csv', headers, rows);
          };
        
          const handleExportPDF = () => {
            const headers = ['Sl. No', 'District'];
            const rows = filtereddistrict.map((district, index) => [index + 1, district.district]);
            exportToPDF('District', headers, rows, 'district.pdf');
          };
        
          const handleExportExcel = () => {
            const data = filtereddistrict.map((district, index) => ({
              'Sl. No': index + 1,
              'District Name': district.district,
            }));
            exportToExcel('District', data, 'district.xlsx');
          };
        
  

  

  return (
    <>
      <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
          <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
            District List
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            {/* Search Input */}
            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search District..."/>

            {/* Buttons Column */}
            <div className="flex flex-col gap-2">
              {/* Add Button */}
              <button
                type="button"
                className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                onClick={() => {
                  setSelectedDistrict(null);
                  setModalOpen(true);
                }}
              >
                Add New District
                <PlusIcon aria-hidden="true" className="mr-0.5 size-5" />
              </button>

              {/* Export Buttons */}
              <ExportButtons onCSV={handleExportCSV} onPDF={handleExportPDF} onExcel={handleExportExcel} />
            </div>
          </div>
        </div>
        
        <div className="mx-auto max-w-12xl">
          <table className="table-auto w-full text-left border-collapse">
            <thead className="text-gray-600 text-sm">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sl. No
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  District Name
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider float-right ">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedDistrict.map((district, index) => (
                <tr
                  key={district.district_id}
                  className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                >
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {district.district.toUpperCase()}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-indigo-700 hover:ring-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-grey"
                        onClick={() => {
                          setSelectedDistrict(district);
                          setModalOpen(true);
                        }}
                      >
                        Edit <PencilSquareIcon aria-hidden="true" className="-mr-0.5 size-5" />
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-red-600 hover:bg-red-600 hover:text-white hover:ring-0 px-2.5 py-1.5 text-sm font-semibold text-grey"
                        onClick={() => handleDeleteClick(district.district_id)}
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
       <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPrevious={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          onNext={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        />
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        setIsOpen={setConfirmOpen}
        onConfirm={confirmDelete}
        title="Delete District"
        message="Are you sure you want to delete this District? This action cannot be undone."
        iconType="delete"
      />
      <ModalDistrictDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        save={handleAddOrUpdate}
        district={selectedDistrict}
      />
    </>
  );
}
