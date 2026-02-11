"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/utils/apiClient";
import { toast } from "react-toastify";
import {
  PencilSquareIcon,
  PlusIcon,
  NoSymbolIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/16/solid";
import { ModalRetirementDetails } from "../modal/retirement-details";
import ConfirmModal from "../../../../components/confirmModal";
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from "../../../../components/dataTableControls";

export default function RetirementList() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [retirementList, setRetirementList] = useState([]);
  const [selectedRetirement, setSelectedRetirement] = useState(null);
  const [retirementToDelete, setRetirementToDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [retirementToReactivate, setRetirementToReactivate] = useState(null);
  const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 25;

  const fetchRetirements = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/masters/retirement-all`);
      console.log("Fetched retirementList:", response.data.data.retirement);
      setRetirementList(response.data.data.retirement || []);
    } catch (error) {
      console.error("Error fetching Retirements:", error);
      toast.error("Failed to load retirements.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRetirements();
  }, [fetchRetirements]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddOrUpdate = async (RetirementData) => {
    if (isLoading) {
      toast.error("Please wait until retirements are loaded.");
      return;
    }

    try {
      const trimmedRetirement = RetirementData.retirement.trim().toLowerCase();
      console.log("Input retirement:", trimmedRetirement);
      console.log("Current retirementList:", retirementList);

      // Check for existing retirement
      const existing = retirementList.find(
        (item) => item.retirement.toLowerCase() === trimmedRetirement
      );

      // Case: Retirement exists and is deactivated
      if (existing && !existing.is_active && !RetirementData.retirement_id) {
        console.log("Found deactivated retirement:", existing);
        setRetirementToReactivate(existing);
        setConfirmReactivateOpen(true);
        return;
      }

      // Case: Retirement exists and is active
      if (existing && existing.is_active && !RetirementData.retirement_id) {
        toast.error(`Retirement "${RetirementData.retirement.trim()}" already exists and is active.`);
        return;
      }

      // Case: Update or add new retirement
      let response;
      if (RetirementData.retirement_id) {
        const { retirement_id, ...RetirementDataWithoutId } = RetirementData;
        response = await axiosInstance.put(
          `/masters/retirement/${retirement_id}`,
          { ...RetirementDataWithoutId, retirement: RetirementData.retirement.trim() }
        );
        toast.success("Retirement updated successfully");
      } else {
        response = await axiosInstance.post("/masters/retirement", {
          ...RetirementData,
          retirement: RetirementData.retirement.trim(),
        });
        toast.success("Retirement added successfully");
      }

      fetchRetirements();
      setModalOpen(false);
      setSelectedRetirement(null);
    } catch (error) {
      console.error("Error in handleAddOrUpdate:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";

      // Handle case where backend reports the retirement exists
      if (
        error.response?.status === 400 &&
        errorMessage.toLowerCase().includes("already exists")
      ) {
        await fetchRetirements();
        const updatedExisting = retirementList.find(
          (item) => item.retirement.toLowerCase() === trimmedRetirement
        );
        if (updatedExisting && !updatedExisting.is_active) {
          console.log("Backend reported existing deactivated retirement:", updatedExisting);
          setRetirementToReactivate(updatedExisting);
          setConfirmReactivateOpen(true);
          return;
        }
        toast.error(`Retirement "${RetirementData.retirement.trim()}" already exists.`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteClick = (retirement_id) => {
    setRetirementToDelete(retirement_id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const retirementData = retirementList.find(
        (r) => r.retirement_id === retirementToDelete
      );
      if (!retirementData) {
        toast.error("Retirement data not found.");
        setConfirmOpen(false);
        return;
      }

      await axiosInstance.put(`/masters/retirement/${retirementToDelete}`, {
        retirement: retirementData.retirement,
        is_active: false,
      });
      fetchRetirements();
      toast.success("Retirement deactivated successfully");
    } catch (error) {
      console.error("Error deactivating retirement:", error);
      toast.error("Failed to deactivate Retirement.");
    } finally {
      setRetirementToDelete(null);
      setConfirmOpen(false);
    }
  };

  const reactivateRetirement = async () => {
    if (!retirementToReactivate) {
      toast.error("Retirement data not found.");
      setConfirmReactivateOpen(false);
      return;
    }

    try {
      await axiosInstance.put(`/masters/retirement/${retirementToReactivate.retirement_id}`, {
        retirement: retirementToReactivate.retirement,
        is_active: true,
      });
      fetchRetirements();
      toast.success("Retirement reactivated successfully");
    } catch (error) {
      toast.error("Failed to reactivate Retirement.");
      console.error("Reactivation error:", error);
    } finally {
      setRetirementToReactivate(null);
      setConfirmReactivateOpen(false);
    }
  };

  const handleReactivateClick = (retirement_id) => {
    const retirement = retirementList.find((r) => r.retirement_id === retirement_id);
    console.log("Reactivating retirement:", retirement);
    setRetirementToReactivate(retirement);
    setConfirmReactivateOpen(true);
  };

  const filteredRetirements = retirementList
    .filter((retirement) =>
      retirement.retirement.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((retirement) => retirement.is_active !== showDeactivated);

  const paginatedRetirements = filteredRetirements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredRetirements.length / itemsPerPage);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Sl. No", "Retirement"];
    const rows = filteredRetirements.map((retirement, index) => [
      index + 1,
      retirement.retirement.toUpperCase(),
    ]);
    exportToCSV("retirement.csv", headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ["Sl. No", "Retirement"];
    const rows = filteredRetirements.map((retirement, index) => [
      index + 1,
      retirement.retirement.toUpperCase(),
    ]);
    exportToPDF("Retirement", headers, rows, "retirement.pdf");
  };

  const handleExportExcel = () => {
    const data = filteredRetirements.map((retirement, index) => ({
      "Sl. No": index + 1,
      "Retirement": retirement.retirement.toUpperCase(),
    }));
    exportToExcel("Retirement", data, "retirement.xlsx");
  };

  return (
    <>
      <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
            Retirement List
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search Retirement..."
            />
            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
                <button
                  onClick={() => setShowDeactivated(!showDeactivated)}
                  className={`px-2.5 py-1.5 rounded-md text-sm font-semibold transition-colors duration-200 border flex items-center gap-1 whitespace-nowrap
                    ${
                      showDeactivated
                        ? "border-green-400 text-green-600 bg-green-50 hover:bg-green-100"
                        : "border-red-400 text-red-600 bg-red-50 hover:bg-red-100"
                    }`}
                >
                  {showDeactivated ? (
                    <>View Active Retirements</>
                  ) : (
                    <>View Deactivated Retirements</>
                  )}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedRetirement(null);
                    setModalOpen(true);
                  }}
                >
                  Add New Retirement
                  <PlusIcon aria-hidden="true" className="mr-0.5 size-5" />
                </button>
              </div>
              <ExportButtons
                onCSV={handleExportCSV}
                onPDF={handleExportPDF}
                onExcel={handleExportExcel}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <div className="mx-auto max-w-12xl">
            <table className="table-auto w-full text-left border-collapse">
              <thead className="text-gray-600 text-sm">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sl. No
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Retirement
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRetirements.map((retirement, index) => (
                  <tr
                    key={retirement.retirement_id}
                    className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {retirement.retirement.toUpperCase()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex justify-end space-x-2">
                        {retirement.is_active && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-indigo-100 px-2.5 py-1.5 text-sm font-semibold text-grey"
                            onClick={() => {
                              setSelectedRetirement(retirement);
                              setModalOpen(true);
                            }}
                          >
                            <PencilSquareIcon
                              aria-hidden="true"
                              className="-mr-0.5 size-5 text-indigo-700"
                            />
                          </button>
                        )}
                        {!showDeactivated ? (
                          <div className="relative group">
                            <button
                              type="button"
                              className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-red-600 hover:bg-red-100 hover:ring-0 px-2.5 py-1.5 text-sm font-semibold"
                              onClick={() => handleDeleteClick(retirement.retirement_id)}
                            >
                              <NoSymbolIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Deactivate Retirement
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <button
                              type="button"
                              className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-green-600 hover:bg-green-100 hover:ring-0 px-2.5 py-1.5 text-sm font-semibold"
                              onClick={() => handleReactivateClick(retirement.retirement_id)}
                            >
                              <ArrowUturnLeftIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Activate Retirement
                            </div>
                          </div>
                        )}
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
      </div>

      <ConfirmModal
        isOpen={confirmReactivateOpen}
        setIsOpen={setConfirmReactivateOpen}
        onConfirm={reactivateRetirement}
        title={`Reactivate "${retirementToReactivate?.retirement?.toUpperCase() || 'Retirement'}"`}
        message={`Are you sure you want to reactivate "${retirementToReactivate?.retirement?.toUpperCase() || 'this retirement'}?"`}
        iconType="success"
        confirmText="Reactivate"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={confirmOpen}
        setIsOpen={setConfirmOpen}
        onConfirm={confirmDelete}
        title={`Deactivate "${retirementList.find((r) => r.retirement_id === retirementToDelete)?.retirement?.toUpperCase() || 'Retirement'}"`}
        message={`Are you sure you want to deactivate "${retirementList.find((r) => r.retirement_id === retirementToDelete)?.retirement?.toUpperCase() || 'this retirement'}?"`}
        iconType="delete"
        confirmText="Deactivate"
        cancelText="Cancel"
      />

  
      <ModalRetirementDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        save={handleAddOrUpdate}
        retirement={selectedRetirement}
      />
    </>
  );
}