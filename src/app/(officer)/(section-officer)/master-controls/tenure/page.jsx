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
import { ModalTenureDetails } from "../modal/tenure-details";
import ConfirmModal from "../../../../components/confirmModal";
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from "../../../../components/dataTableControls";

export default function TenureList() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [tenureList, setTenureList] = useState([]);
  const [selectedTenure, setSelectedTenure] = useState(null);
  const [tenureToDelete, setTenureToDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [tenureToReactivate, setTenureToReactivate] = useState(null);
  const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 25;

  const fetchTenures = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/masters/tenure-all`);
      console.log("Fetched tenureList:", response.data.data.tenure);
      setTenureList(response.data.data.tenure || []);
    } catch (error) {
      console.error("Error fetching Tenures:", error);
      toast.error("Failed to load tenures.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenures();
  }, [fetchTenures]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddOrUpdate = async (TenureData) => {
    if (isLoading) {
      toast.error("Please wait until tenures are loaded.");
      return;
    }

    try {
      const trimmedTenure = TenureData.tenures.trim().toLowerCase();
      console.log("Input tenure:", trimmedTenure);
      console.log("Current tenureList:", tenureList);

      // Check for existing tenure
      const existing = tenureList.find(
        (ten) => ten.tenures.toLowerCase() === trimmedTenure
      );

      // Case: Tenure exists and is deactivated
      if (existing && !existing.is_active && !TenureData.tenure_id) {
        console.log("Found deactivated tenure:", existing);
        setTenureToReactivate(existing);
        setConfirmReactivateOpen(true);
        return;
      }

      // Case: Tenure exists and is active
      if (existing && existing.is_active && !TenureData.tenure_id) {
        toast.error(`Tenure "${TenureData.tenures.trim()}" already exists and is active.`);
        return;
      }

      // Case: Update or add new tenure
      let response;
      if (TenureData.tenure_id) {
        const { tenure_id, ...TenureDataWithoutId } = TenureData;
        response = await axiosInstance.put(
          `/masters/tenure/${tenure_id}`,
          { ...TenureDataWithoutId, tenures: TenureData.tenures.trim() }
        );
        console.log("Tenure updated:", response);
        toast.success("Tenure updated successfully");
      } else {
        response = await axiosInstance.post("/masters/tenure", {
          ...TenureData,
          tenures: TenureData.tenures.trim(),
        });
        console.log("Tenure added:", response);
        toast.success("Tenure added successfully");
      }

      fetchTenures();
      setModalOpen(false);
      setSelectedTenure(null);
    } catch (error) {
      console.error("Error in handleAddOrUpdate:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";

      // Handle case where backend reports the tenure exists
      if (
        error.response?.status === 400 &&
        errorMessage.toLowerCase().includes("already exists")
      ) {
        await fetchTenures();
        const updatedExisting = tenureList.find(
          (ten) => ten.tenures.toLowerCase() === trimmedTenure
        );
        if (updatedExisting && !updatedExisting.is_active) {
          console.log("Backend reported existing deactivated tenure:", updatedExisting);
          setTenureToReactivate(updatedExisting);
          setConfirmReactivateOpen(true);
          return;
        }
        toast.error(`Tenure "${TenureData.tenures.trim()}" already exists.`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteClick = (tenure_id) => {
    setTenureToDelete(tenure_id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const tenureData = tenureList.find((t) => t.tenure_id === tenureToDelete);
      if (!tenureData) {
        toast.error("Tenure data not found.");
        setConfirmOpen(false);
        return;
      }

      await axiosInstance.put(`/masters/tenure/${tenureToDelete}`, {
        tenures: tenureData.tenures,
        is_active: false,
      });
      fetchTenures();
      toast.success("Tenure deactivated successfully");
    } catch (error) {
      console.error("Error deactivating tenure:", error);
      toast.error("Failed to deactivate Tenure.");
    } finally {
      setTenureToDelete(null);
      setConfirmOpen(false);
    }
  };

  const reactivateTenure = async () => {
    if (!tenureToReactivate) {
      toast.error("Tenure data not found.");
      setConfirmReactivateOpen(false);
      return;
    }

    try {
      await axiosInstance.put(`/masters/tenure/${tenureToReactivate.tenure_id}`, {
        tenures: tenureToReactivate.tenures,
        is_active: true,
      });
      fetchTenures();
      toast.success("Tenure reactivated successfully");
    } catch (error) {
      toast.error("Failed to reactivate Tenure.");
      console.error("Reactivation error:", error);
    } finally {
      setTenureToReactivate(null);
      setConfirmReactivateOpen(false);
    }
  };

  const handleReactivateClick = (tenure_id) => {
    const tenure = tenureList.find((t) => t.tenure_id === tenure_id);
    console.log("Reactivating tenure:", tenure);
    setTenureToReactivate(tenure);
    setConfirmReactivateOpen(true);
  };

const filteredTenures = tenureList
  .filter((tenure) =>
    (tenure.tenures || "").toLowerCase().includes(searchTerm.toLowerCase())
  )
  .filter((tenure) => tenure.is_active !== showDeactivated);


  const paginatedTenures = filteredTenures.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredTenures.length / itemsPerPage);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Sl. No", "Tenure"];
    const rows = filteredTenures.map((tenure, index) => [
      index + 1,
      tenure.tenures.toUpperCase(),
    ]);
    exportToCSV("tenure.csv", headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ["Sl. No", "Tenure"];
    const rows = filteredTenures.map((tenure, index) => [
      index + 1,
      tenure.tenures.toUpperCase(),
    ]);
    exportToPDF("Tenure", headers, rows, "tenure.pdf");
  };

  const handleExportExcel = () => {
    const data = filteredTenures.map((tenure, index) => ({
      "Sl. No": index + 1,
      "Tenure": tenure.tenures.toUpperCase(),
    }));
    exportToExcel("Tenure", data, "tenure.xlsx");
  };

  return (
    <>
      <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
            Tenure List
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search Tenure..."
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
                    <>View Active Tenures</>
                  ) : (
                    <>View Deactivated Tenures</>
                  )}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedTenure(null);
                    setModalOpen(true);
                  }}
                >
                  Add New Tenure
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
                    Tenure
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTenures.map((tenure, index) => (
                  <tr
                    key={tenure.tenure_id}
                    className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                 <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(tenure.tenures || "").toUpperCase()}
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex justify-end space-x-2">
                        {tenure.is_active && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-indigo-100 px-2.5 py-1.5 text-sm font-semibold text-grey"
                            onClick={() => {
                              setSelectedTenure(tenure);
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
                              onClick={() => handleDeleteClick(tenure.tenure_id)}
                            >
                              <NoSymbolIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Deactivate Tenure
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <button
                              type="button"
                              className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-green-600 hover:bg-green-100 hover:ring-0 px-2.5 py-1.5 text-sm font-semibold"
                              onClick={() => handleReactivateClick(tenure.tenure_id)}
                            >
                              <ArrowUturnLeftIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Activate Tenure
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
        onConfirm={reactivateTenure}
        title={`Reactivate "${tenureToReactivate?.tenures?.toUpperCase() || 'Tenure'}"`}
        message={`Are you sure you want to reactivate "${tenureToReactivate?.tenures?.toUpperCase() || 'this tenure'}?"`}
        iconType="success"
        confirmText="Reactivate"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={confirmOpen}
        setIsOpen={setConfirmOpen}
        onConfirm={confirmDelete}
        title={`Deactivate "${tenureList.find((t) => t.tenure_id === tenureToDelete)?.tenures?.toUpperCase() || 'Tenure'}"`}
        message={`Are you sure you want to deactivate "${tenureList.find((t) => t.tenure_id === tenureToDelete)?.tenures?.toUpperCase() || 'this tenure'}?"`}
        iconType="delete"
        confirmText="Deactivate"
        cancelText="Cancel"
      />


      <ModalTenureDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        save={handleAddOrUpdate}
        tenure={selectedTenure}
      />
    </>
  );
}