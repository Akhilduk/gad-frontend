"use client";

import { useState, useEffect, useCallback } from 'react'
import axiosInstance from "@/utils/apiClient";
import { toast } from 'react-toastify';
import { TrashIcon, PencilSquareIcon,PlusIcon } from '@heroicons/react/16/solid'
import { ModalCountryDetails } from '../modal//country-details'
import ConfirmModal from '../../../../components/confirmModal';
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from '../../../../components/dataTableControls';

export default function CountryList() {
    const [isModalOpen, setModalOpen] = useState(false)
    const [countryList, setCountryList] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(null); 
    const [countryToDelete, setCountryToDelete] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    const fetchCountry = useCallback(async () => {
        try {
          const response = await axiosInstance.get(`/masters/country`);
          setCountryList(response.data.data.country);
        } catch (error) {
          console.error("Error fetching country:", error);
        }
      }, []);
      
      useEffect(() => {
        fetchCountry();
      }, [fetchCountry]); 

      useEffect(() => {
            setCurrentPage(1); // reset to first page when search changes
          }, [searchTerm]);
  
    const handleAddOrUpdate = async (CountryData) => {
            try {
                let response;
                if (CountryData.country_id) {
                    const { country_id, ...CountryDataWithoutId } = CountryData;
                    response = await axiosInstance.put(`/masters/country/${country_id}`, CountryDataWithoutId);
                    toast.success('Country updated successfully');
                } else {
                    response = await axiosInstance.post('/masters/country', CountryData);
                    toast.success('Country added successfully');
                }
                fetchCountry();
                setModalOpen(false);
                setSelectedCountry(null);
            } catch (error) {
                const errorMessage = error.response?.data?.detail || 'Something went wrong. Please try again.'
            toast.error(errorMessage);
            }
        };
        
          const handleDeleteClick = (country_id) => {
                setCountryToDelete(country_id);
                setConfirmOpen(true);
            };
        
            const confirmDelete = async () => {
                try {
                    await axiosInstance.delete(`/masters/country/${countryToDelete}`);
                    fetchCountry();
                    toast.success(' Country deleted successfully')
                } catch (error) {
                    console.error('Error deleting country:', error);
                    toast.error('Failed to delete Country.');
                } finally {
                    setCountryToDelete(null);
                }
            };
                   
      
      const filteredcountry = countryList.filter(country =>
              country.country.toLowerCase().includes(searchTerm.toLowerCase())
          );

      const paginatedCountry = filteredcountry.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage
      );
            
      const totalPages = Math.ceil(filteredcountry.length / itemsPerPage);
      
      
            // Export handlers
      const handleExportCSV = () => {
        const headers = ['Sl. No', 'Country'];
        const rows = filteredcountry.map((country, index) => [index + 1, country.country.uppercase()]);
        exportToCSV('country.csv', headers, rows);
      };
    
      const handleExportPDF = () => {
        const headers = ['Sl. No', 'Country'];
        const rows = filteredcountry.map((country, index) => [index + 1, country.country.uppercase()]);
        exportToPDF('Country', headers, rows, 'country.pdf');
      };
    
      const handleExportExcel = () => {
        const data = filteredcountry.map((country, index) => ({
          'Sl. No': index + 1,
          'Country Name': country.country.uppercase(),
        }));
        exportToExcel('Country', data, 'country.xlsx');
      };

  useEffect(() => {
    fetchCountry();
  }, [fetchCountry]);

    return (
        <>
        <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
           <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
              <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
                Country List
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                {/* Search Input */}
                <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search Country..."/>

                {/* Buttons Column */}
                <div className="flex flex-col gap-2">
                  {/* Add Button */}
                  <button
                    type="button"
                    className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    onClick={() => {
                      setSelectedCountry(null);
                      setModalOpen(true);
                    }}
                  >
                    Add New Country
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
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sl. No</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country Name</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider float-right ">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                         {paginatedCountry.map((country, index) => (
                            <tr
                              key={country.country_id}
                              className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                            >
                              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {(currentPage - 1) * itemsPerPage + index + 1}
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {country.country.toUpperCase()}
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-indigo-700 hover:ring-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-grey"
                                    onClick={() => {
                                      setSelectedCountry(country);
                                      setModalOpen(true);
                                    }}
                                  >
                                    Edit <PencilSquareIcon aria-hidden="true" className="-mr-0.5 size-5" />
                                  </button>
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-red-600 hover:bg-red-600 hover:text-white hover:ring-0 px-2.5 py-1.5 text-sm font-semibold text-grey"
                                    onClick={() => handleDeleteClick(country.country_id)}
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
          title="Delete Country"
          message="Are you sure you want to delete this Country? This action cannot be undone."
          iconType="delete"
        />   
        <ModalCountryDetails 
        open={isModalOpen} 
        setOpen={setModalOpen}
        save={handleAddOrUpdate}
        country={selectedCountry}
      />
    </>
  );
}
