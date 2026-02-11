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
import { ModalDisabilityDetails } from "../modal/disability-details";
import ConfirmModal from "../../../../components/confirmModal";
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from "../../../../components/dataTableControls";

export default function DisabilityList() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [disabilityList, setDisabilityList] = useState([]);
  const [selectedDisability, setSelectedDisability] = useState(null);
  const [disabilityToDelete, setDisabilityToDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [disabilityToReactivate, setDisabilityToReactivate] = useState(null);
  const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 25;

  const fetchDisability = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/masters/disability-all`);
      console.log("Fetched disabilityList:", response.data.data.disability);
      setDisabilityList(response.data.data.disability);
    } catch (error) {
      console.error("Error fetching Disability:", error);
      toast.error("Failed to load disabilities.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisability();
  }, [fetchDisability]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddOrUpdate = async (DisabilityData) => {
    if (isLoading) {
      toast.error("Please wait until disabilities are loaded.");
      return;
    }

    try {
      const trimmedDisability = DisabilityData.disability.trim().toLowerCase();
      console.log("Input disability:", trimmedDisability);
      console.log("Current disabilityList:", disabilityList);

      // Check for existing disability
      const existing = disabilityList.find(
        (dis) => dis.disability.toLowerCase() === trimmedDisability
      );

      // Case: Disability exists and is deactivated
      if (existing && !existing.is_active && !DisabilityData.disability_id) {
        console.log("Found deactivated disability:", existing);
        setDisabilityToReactivate(existing);
        setConfirmReactivateOpen(true);
        return;
      }

      // Case: Disability exists and is active
      if (existing && existing.is_active && !DisabilityData.disability_id) {
        toast.error(`Disability "${DisabilityData.disability.trim()}" already exists and is active.`);
        return;
      }

      // Case: Update or add new disability
      let response;
      if (DisabilityData.disability_id) {
        const { disability_id, ...DisabilityDataWithoutId } = DisabilityData;
        response = await axiosInstance.put(
          `/masters/disability/${disability_id}`,
          { ...DisabilityDataWithoutId, disability: DisabilityData.disability.trim() }
        );
        toast.success("Disability updated successfully");
      } else {
        response = await axiosInstance.post("/masters/disability", {
          ...DisabilityData,
          disability: DisabilityData.disability.trim(),
        });
        toast.success("Disability added successfully");
      }

      fetchDisability();
      setModalOpen(false);
      setSelectedDisability(null);
    } catch (error) {
      console.error("Error in handleAddOrUpdate:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";

      // Handle case where backend reports the disability exists
      if (
        error.response?.status === 400 &&
        errorMessage.toLowerCase().includes("already exists")
      ) {
        await fetchDisability();
        const updatedExisting = disabilityList.find(
          (dis) => dis.disability.toLowerCase() === trimmedDisability
        );
        if (updatedExisting && !updatedExisting.is_active) {
          console.log("Backend reported existing deactivated disability:", updatedExisting);
          setDisabilityToReactivate(updatedExisting);
          setConfirmReactivateOpen(true);
          return;
        }
        toast.error(`Disability "${DisabilityData.disability.trim()}" already exists.`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteClick = (disability_id) => {
    setDisabilityToDelete(disability_id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/masters/disability/${disabilityToDelete}`, {
        data: { is_active: false },
      });
      fetchDisability();
      toast.success("Disability deactivated successfully");
    } catch (error) {
      console.error("Error deactivating disability:", error);
      toast.error("Failed to deactivate Disability.");
    } finally {
      setDisabilityToDelete(null);
      setConfirmOpen(false);
    }
  };

  const reactivateDisability = async () => {
    if (!disabilityToReactivate) {
      toast.error("Disability data not found.");
      setConfirmReactivateOpen(false);
      return;
    }

    try {
      await axiosInstance.put(`/masters/disability/${disabilityToReactivate.disability_id}`, {
        disability: disabilityToReactivate.disability,
        is_active: true,
      });
      fetchDisability();
      toast.success("Disability reactivated successfully");
    } catch (error) {
      toast.error("Failed to reactivate Disability.");
      console.error("Reactivation error:", error);
    } finally {
      setDisabilityToReactivate(null);
      setConfirmReactivateOpen(false);
    }
  };

  const handleReactivateClick = (disability_id) => {
    const disability = disabilityList.find((d) => d.disability_id === disability_id);
    console.log("Reactivating disability:", disability);
    setDisabilityToReactivate(disability);
    setConfirmReactivateOpen(true);
  };

  const filteredDisability = disabilityList
    .filter((disability) =>
      disability.disability.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((disability) => disability.is_active !== showDeactivated);

  const paginatedDisability = filteredDisability.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredDisability.length / itemsPerPage);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Sl. No", "Disability"];
    const rows = filteredDisability.map((disability, index) => [
      index + 1,
      disability.disability.toUpperCase(),
    ]);
    exportToCSV("disability.csv", headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ["Sl. No", "Disability"];
    const rows = filteredDisability.map((disability, index) => [
      index + 1,
      disability.disability.toUpperCase(),
    ]);
    exportToPDF("Disability", headers, rows, "disability.pdf");
  };

  const handleExportExcel = () => {
    const data = filteredDisability.map((disability, index) => ({
      "Sl. No": index + 1,
      "Disability Name": disability.disability.toUpperCase(),
    }));
    exportToExcel("Disability", data, "disability.xlsx");
  };

  return (
    <>
      <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
            Disability List
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search Disability..."
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
                    <>View Active Disabilities</>
                  ) : (
                    <>View Deactivated Disabilities</>
                  )}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedDisability(null);
                    setModalOpen(true);
                  }}
                >
                  Add New Disability
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
                    Disability Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider float-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedDisability.map((disability, index) => (
                  <tr
                    key={disability.disability_id}
                    className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {disability.disability.toUpperCase()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex justify-end space-x-2">
                        {disability.is_active && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-indigo-100 px-2.5 py-1.5 text-sm font-semibold text-grey"
                            onClick={() => {
                              setSelectedDisability(disability);
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
                              onClick={() => handleDeleteClick(disability.disability_id)}
                            >
                              <NoSymbolIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Deactivate Disability
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <button
                              type="button"
                              className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-green-600 hover:bg-green-100 hover:ring-0 px-2.5 py-1.5 text-sm font-semibold"
                              onClick={() => handleReactivateClick(disability.disability_id)}
                            >
                              <ArrowUturnLeftIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Activate Disability
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
        onConfirm={reactivateDisability}
        title={`Reactivate "${disabilityToReactivate?.disability?.toUpperCase() || 'Disability'}"`}
        message={`Are you sure you want to reactivate "${disabilityToReactivate?.disability?.toUpperCase() || 'this disability'}?"`}
        iconType="success"
        confirmText="Reactivate"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={confirmOpen}
        setIsOpen={setConfirmOpen}
        onConfirm={confirmDelete}
        title={`Deactivate "${disabilityList.find((d) => d.disability_id === disabilityToDelete)?.disability?.toUpperCase() || 'Disability'}"`}
        message={`Are you sure you want to deactivate "${disabilityList.find((d) => d.disability_id === disabilityToDelete)?.disability?.toUpperCase() || 'this disability'}?"`}
        iconType="delete"
        confirmText="Deactivate"
        cancelText="Cancel"
      />

      <ModalDisabilityDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        save={handleAddOrUpdate}
        disability={selectedDisability}
      />
    </>
  );
}