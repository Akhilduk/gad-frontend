'use client'

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from "@/utils/apiClient";
import { toast } from 'react-toastify';
import { TrashIcon, PencilSquareIcon, PlusIcon } from '@heroicons/react/16/solid'
import { ModalStateDetails } from '../modal/state-details'
import ConfirmModal from '../../../../components/confirmModal';
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from '../../../../components/dataTableControls';

export default function StateList() {
    const [isModalOpen, setModalOpen] = useState(false)
    const [stateList, setStateList] = useState([]);
    const [selectedState, setSelectedState] = useState(null);
    const [stateToDelete, setStateToDelete] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;
    
      const fetchState = useCallback(async () => {
        try {
          const response = await axiosInstance.get(`/masters/state`);
          setStateList(response.data.data.state);
        } catch (error) {
          console.error("Error fetching state:", error);
        }
      }, []);
      
      useEffect(() => {
        fetchState();
      }, [fetchState]); 

      useEffect(() => {
        setCurrentPage(1); // reset to first page when search changes
      }, [searchTerm]);
    ;

    const handleAddOrUpdate = async (StateData) => {
          try {
              let response;
              if (StateData.state_id) {
                  const { state_id, ...StateDataWithoutId } = StateData;
                  response = await axiosInstance.put(`/masters/state/${state_id}`, StateDataWithoutId);
                  toast.success('State updated successfully');
              } else {
                  response = await axiosInstance.post('/masters/state', StateData);
                  toast.success('State added successfully');
              }
              fetchState();
              setModalOpen(false);
              setSelectedState(null);
          } catch (error) {
              const errorMessage = error.response?.data?.detail || 'Something went wrong. Please try again.'
            toast.error(errorMessage);
          }
      };

    const handleDeleteClick = (state_id) => {
          setStateToDelete(state_id);
          setConfirmOpen(true);
      };
  
      const confirmDelete = async () => {
          try {
              await axiosInstance.delete(`/masters/state/${stateToDelete}`);
              fetchState();
              toast.success(' State deleted successfully')
          } catch (error) {
              console.error('Error deleting state:', error);
              toast.error('Failed to delete State.');
          } finally {
              setStateToDelete(null);
          }
      };



      const filteredstate = stateList.filter(state =>
              state.state.toLowerCase().includes(searchTerm.toLowerCase())
          );
      
          const paginatedState = filteredstate.slice(
              (currentPage - 1) * itemsPerPage,
              currentPage * itemsPerPage
          );
      
          const totalPages = Math.ceil(filteredstate.length / itemsPerPage);


       // Export handlers
        const handleExportCSV = () => {
          const headers = ['Sl. No', 'State'];
          const rows = filteredstate.map((state, index) => [index + 1, state.state]);
          exportToCSV('state.csv', headers, rows);
        };
      
        const handleExportPDF = () => {
          const headers = ['Sl. No', 'State'];
          const rows = filteredstate.map((state, index) => [index + 1, state.state]);
          exportToPDF('State', headers, rows, 'state.pdf');
        };
      
        const handleExportExcel = () => {
          const data = filteredstate.map((state, index) => ({
            'Sl. No': index + 1,
            'State Name': state.state,
          }));
          exportToExcel('State', data, 'state.xlsx');
        };
      

    

    return (
        <>
        <div className="bg-white p-3 pt-0 roun d-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
          <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
            State List
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            {/* Search Input */}
            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search State..."/>

            {/* Buttons Column */}
            <div className="flex flex-col gap-2">
              {/* Add Button */}
              <button
                type="button"
                className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                onClick={() => {
                  setSelectedState(null);
                  setModalOpen(true);
                }}
              >
                Add New State
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
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State Name</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider float-right ">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                {paginatedState.map((state, index) => (
                <tr
                  key={state.state_id}
                  className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                >
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {state.state.toUpperCase()}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-indigo-700 hover:ring-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-grey"
                        onClick={() => {
                          setSelectedState(state);
                          setModalOpen(true);
                        }}
                      >
                        Edit <PencilSquareIcon aria-hidden="true" className="-mr-0.5 size-5" />
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-red-600 hover:bg-red-600 hover:text-white hover:ring-0 px-2.5 py-1.5 text-sm font-semibold text-grey"
                        onClick={() => handleDeleteClick(state.state_id)}
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
        title="Delete State"
        message="Are you sure you want to delete this State? This action cannot be undone."
        iconType="delete"
      />
        <ModalStateDetails 
        open={isModalOpen} 
        setOpen={setModalOpen}
        save={handleAddOrUpdate}
        state={selectedState} />
        </>
    );
}

