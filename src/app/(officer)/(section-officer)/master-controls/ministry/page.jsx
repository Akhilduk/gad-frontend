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
import { ModalMinistryDetails } from "../modal/ministry-details";
import ConfirmModal from "../../../../components/confirmModal";
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from "../../../../components/dataTableControls";

export default function MinistryList() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [ministryList, setMinistryList] = useState([]);
  const [selectedMinistry, setSelectedMinistry] = useState(null);
  const [ministryToDelete, setMinistryToDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [ministryToReactivate, setMinistryToReactivate] = useState(null);
  const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 25;

  const fetchMinistry = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/masters/ministry-all`);
      console.log("Fetched ministryList:", response.data.data.ministry);
      setMinistryList(response.data.data.ministry);
    } catch (error) {
      console.error("Error fetching Ministries:", error);
      toast.error("Failed to load ministries.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMinistry();
  }, [fetchMinistry]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddOrUpdate = async (MinistryData) => {
    if (isLoading) {
      toast.error("Please wait until ministries are loaded.");
      return;
    }

    try {
      const trimmedMinistry = MinistryData.ministry.trim().toLowerCase();
      console.log("Input ministry:", trimmedMinistry);
      console.log("Current ministryList:", ministryList);

      // Check for existing ministry
      const existing = ministryList.find(
        (min) => min.ministry.toLowerCase() === trimmedMinistry
      );

      // Case: Ministry exists and is deactivated
      if (existing && !existing.is_active && !MinistryData.ministry_id) {
        console.log("Found deactivated ministry:", existing);
        setMinistryToReactivate(existing);
        setConfirmReactivateOpen(true);
        return;
      }

      // Case: Ministry exists and is active
      if (existing && existing.is_active && !MinistryData.ministry_id) {
        toast.error(`Ministry "${MinistryData.ministry.trim()}" already exists and is active.`);
        return;
      }

      // Case: Update or add new ministry
      let response;
      if (MinistryData.ministry_id) {
        const { ministry_id, ...MinistryDataWithoutId } = MinistryData;
        response = await axiosInstance.put(
          `/masters/ministry/${ministry_id}`,
          { ...MinistryDataWithoutId, ministry: MinistryData.ministry.trim() }
        );
        toast.success("Ministry updated successfully");
      } else {
        response = await axiosInstance.post("/masters/ministry", {
          ...MinistryData,
          ministry: MinistryData.ministry.trim(),
        });
        toast.success("Ministry added successfully");
      }

      fetchMinistry();
      setModalOpen(false);
      setSelectedMinistry(null);
    } catch (error) {
      console.error("Error in handleAddOrUpdate:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";

      // Handle case where backend reports the ministry exists
      if (
        error.response?.status === 400 &&
        errorMessage.toLowerCase().includes("already exists")
      ) {
        await fetchMinistry();
        const updatedExisting = ministryList.find(
          (min) => min.ministry.toLowerCase() === trimmedMinistry
        );
        if (updatedExisting && !updatedExisting.is_active) {
          console.log("Backend reported existing deactivated ministry:", updatedExisting);
          setMinistryToReactivate(updatedExisting);
          setConfirmReactivateOpen(true);
          return;
        }
        toast.error(`Ministry "${MinistryData.ministry.trim()}" already exists.`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteClick = (ministry_id) => {
    setMinistryToDelete(ministry_id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const ministryData = ministryList.find((m) => m.ministry_id === ministryToDelete);
      if (!ministryData) {
        toast.error("Ministry data not found.");
        setConfirmOpen(false);
        return;
      }

      await axiosInstance.put(`/masters/ministry/${ministryToDelete}`, {
        ministry: ministryData.ministry,
        is_active: false,
      });
      fetchMinistry();
      toast.success("Ministry deactivated successfully");
    } catch (error) {
      console.error("Error deactivating ministry:", error);
      toast.error("Failed to deactivate Ministry.");
    } finally {
      setMinistryToDelete(null);
      setConfirmOpen(false);
    }
  };

  const reactivateMinistry = async () => {
    if (!ministryToReactivate) {
      toast.error("Ministry data not found.");
      setConfirmReactivateOpen(false);
      return;
    }

    try {
      await axiosInstance.put(`/masters/ministry/${ministryToReactivate.ministry_id}`, {
        ministry: ministryToReactivate.ministry,
        is_active: true,
      });
      fetchMinistry();
      toast.success("Ministry reactivated successfully");
    } catch (error) {
      toast.error("Failed to reactivate Ministry.");
      console.error("Reactivation error:", error);
    } finally {
      setMinistryToReactivate(null);
      setConfirmReactivateOpen(false);
    }
  };

  const handleReactivateClick = (ministry_id) => {
    const ministry = ministryList.find((m) => m.ministry_id === ministry_id);
    console.log("Reactivating ministry:", ministry);
    setMinistryToReactivate(ministry);
    setConfirmReactivateOpen(true);
  };

  const filteredMinistries = ministryList
    .filter((ministry) =>
      ministry.ministry.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((ministry) => ministry.is_active !== showDeactivated);

  const paginatedMinistries = filteredMinistries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredMinistries.length / itemsPerPage);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Sl. No", "Ministry"];
    const rows = filteredMinistries.map((ministry, index) => [
      index + 1,
      ministry.ministry.toUpperCase(),
    ]);
    exportToCSV("ministry.csv", headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ["Sl. No", "Ministry"];
    const rows = filteredMinistries.map((ministry, index) => [
      index + 1,
      ministry.ministry.toUpperCase(),
    ]);
    exportToPDF("Ministry", headers, rows, "ministry.pdf");
  };

  const handleExportExcel = () => {
    const data = filteredMinistries.map((ministry, index) => ({
      "Sl. No": index + 1,
      "Ministry Name": ministry.ministry.toUpperCase(),
    }));
    exportToExcel("Ministry", data, "ministry.xlsx");
  };

  return (
    <>
      <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
            Ministry List
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search Ministry..."
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
                    <>View Active Ministries</>
                  ) : (
                    <>View Deactivated Ministries</>
                  )}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedMinistry(null);
                    setModalOpen(true);
                  }}
                >
                  Add New Ministry
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
                    Ministry
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedMinistries.map((ministry, index) => (
                  <tr
                    key={ministry.ministry_id}
                    className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {ministry.ministry.toUpperCase()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex justify-end space-x-2">
                        {ministry.is_active && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-indigo-100 px-2.5 py-1.5 text-sm font-semibold text-grey"
                            onClick={() => {
                              setSelectedMinistry(ministry);
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
                              onClick={() => handleDeleteClick(ministry.ministry_id)}
                            >
                              <NoSymbolIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Deactivate Ministry
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <button
                              type="button"
                              className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-green-600 hover:bg-green-100 hover:ring-0 px-2.5 py-1.5 text-sm font-semibold"
                              onClick={() => handleReactivateClick(ministry.ministry_id)}
                            >
                              <ArrowUturnLeftIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Activate Ministry
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
        onConfirm={reactivateMinistry}
        title={`Reactivate "${ministryToReactivate?.ministry?.toUpperCase() || 'Ministry'}"`}
        message={`Are you sure you want to reactivate "${ministryToReactivate?.ministry?.toUpperCase() || 'this ministry'}?"`}
        iconType="success"
        confirmText="Reactivate"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={confirmOpen}
        setIsOpen={setConfirmOpen}
        onConfirm={confirmDelete}
        title={`Deactivate "${ministryList.find((m) => m.ministry_id === ministryToDelete)?.ministry?.toUpperCase() || 'Ministry'}"`}
        message={`Are you sure you want to deactivate "${ministryList.find((m) => m.ministry_id === ministryToDelete)?.ministry?.toUpperCase() || 'this ministry'}?"`}
        iconType="delete"
        confirmText="Deactivate"
        cancelText="Cancel"
      />

      <ModalMinistryDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        save={handleAddOrUpdate}
        ministry={selectedMinistry}
      />
    </>
  );
}