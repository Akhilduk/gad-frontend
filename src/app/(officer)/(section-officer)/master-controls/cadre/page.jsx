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
import { ModalCadreDetails } from "../modal/cadre-details";
import ConfirmModal from "../../../../components/confirmModal";
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from "../../../../components/dataTableControls";

export default function CadreList() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [cadreList, setCadreList] = useState([]);
  const [selectedCadre, setSelectedCadre] = useState(null);
  const [cadreToDelete, setCadreToDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [cadreToReactivate, setCadreToReactivate] = useState(null);
  const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 25;

  const fetchCadre = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/masters/cadre-all`);
      console.log("Fetched cadreList:", response.data.data.cadre);
      setCadreList(response.data.data.cadre);
    } catch (error) {
      console.error("Error fetching Cadre:", error);
      toast.error("Failed to load cadres.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCadre();
  }, [fetchCadre]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddOrUpdate = async (CadreData) => {
    if (isLoading) {
      toast.error("Please wait until cadres are loaded.");
      return;
    }

    try {
      const trimmedCadre = CadreData.cadre.trim().toLowerCase();
      const trimmedAbbr = CadreData.cadre_abbr?.trim().toLowerCase() || "";
      console.log("Input cadre:", trimmedCadre, "Abbreviation:", trimmedAbbr);
      console.log("Current cadreList:", cadreList);

      // Check for existing cadre
      const existing = cadreList.find(
        (cad) => cad.cadre.toLowerCase() === trimmedCadre
      );

      // Case: Cadre exists and is deactivated
      if (existing && !existing.is_active && !CadreData.cadre_id) {
        console.log("Found deactivated cadre:", existing);
        setCadreToReactivate(existing);
        setConfirmReactivateOpen(true);
        return;
      }

      // Case: Cadre exists and is active
      if (existing && existing.is_active && !CadreData.cadre_id) {
        toast.error(`Cadre "${CadreData.cadre.trim()}" already exists and is active.`);
        return;
      }

      // Case: Update or add new cadre
      let response;
      if (CadreData.cadre_id) {
        const { cadre_id, ...CadreDataWithoutId } = CadreData;
        response = await axiosInstance.put(
          `/masters/cadre/${cadre_id}`,
          {
            ...CadreDataWithoutId,
            cadre: CadreData.cadre.trim(),
            cadre_abbr: CadreData.cadre_abbr?.trim() || "",
          }
        );
        toast.success("Cadre updated successfully");
      } else {
        response = await axiosInstance.post("/masters/cadre", {
          ...CadreData,
          cadre: CadreData.cadre.trim(),
          cadre_abbr: CadreData.cadre_abbr?.trim() || "",
        });
        toast.success("Cadre added successfully");
      }

      fetchCadre();
      setModalOpen(false);
      setSelectedCadre(null);
    } catch (error) {
      console.error("Error in handleAddOrUpdate:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";

      // Handle case where backend reports the cadre exists
      if (
        error.response?.status === 400 &&
        errorMessage.toLowerCase().includes("already exists")
      ) {
        await fetchCadre();
        const updatedExisting = cadreList.find(
          (cad) => cad.cadre.toLowerCase() === trimmedCadre
        );
        if (updatedExisting && !updatedExisting.is_active) {
          console.log("Backend reported existing deactivated cadre:", updatedExisting);
          setCadreToReactivate(updatedExisting);
          setConfirmReactivateOpen(true);
          return;
        }
        toast.error(`Cadre "${CadreData.cadre.trim()}" already exists.`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteClick = (cadre_id) => {
    setCadreToDelete(cadre_id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const cadreData = cadreList.find((c) => c.cadre_id === cadreToDelete);
      if (!cadreData) {
        toast.error("Cadre data not found.");
        setConfirmOpen(false);
        return;
      }

      await axiosInstance.put(`/masters/cadre/${cadreToDelete}`, {
        cadre: cadreData.cadre,
        cadre_abbr: cadreData.cadre_abbr,
        is_active: false,
      });
      fetchCadre();
      toast.success("Cadre deactivated successfully");
    } catch (error) {
      console.error("Error deactivating cadre:", error);
      toast.error("Failed to deactivate Cadre.");
    } finally {
      setCadreToDelete(null);
      setConfirmOpen(false);
    }
  };

  const reactivateCadre = async () => {
    if (!cadreToReactivate) {
      toast.error("Cadre data not found.");
      setConfirmReactivateOpen(false);
      return;
    }

    try {
      await axiosInstance.put(`/masters/cadre/${cadreToReactivate.cadre_id}`, {
        cadre: cadreToReactivate.cadre,
        cadre_abbr: cadreToReactivate.cadre_abbr,
        is_active: true,
      });
      fetchCadre();
      toast.success("Cadre reactivated successfully");
    } catch (error) {
      toast.error("Failed to reactivate Cadre.");
      console.error("Reactivation error:", error);
    } finally {
      setCadreToReactivate(null);
      setConfirmReactivateOpen(false);
    }
  };

  const handleReactivateClick = (cadre_id) => {
    const cadre = cadreList.find((c) => c.cadre_id === cadre_id);
    console.log("Reactivating cadre:", cadre);
    setCadreToReactivate(cadre);
    setConfirmReactivateOpen(true);
  };

  const filteredCadre = cadreList
    .filter(
      (cadre) =>
        cadre.cadre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cadre.cadre_abbr &&
          cadre.cadre_abbr.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter((cadre) => cadre.is_active !== showDeactivated);

  const paginatedCadre = filteredCadre.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredCadre.length / itemsPerPage);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Sl. No", "Cadre", "Abbreviation"];
    const rows = filteredCadre.map((cadre, index) => [
      index + 1,
      cadre.cadre.toUpperCase(),
      cadre.cadre_abbr ? cadre.cadre_abbr.toUpperCase() : "",
    ]);
    exportToCSV("cadre.csv", headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ["Sl. No", "Cadre", "Abbreviation"];
    const rows = filteredCadre.map((cadre, index) => [
      index + 1,
      cadre.cadre.toUpperCase(),
      cadre.cadre_abbr ? cadre.cadre_abbr.toUpperCase() : "",
    ]);
    exportToPDF("Cadre", headers, rows, "cadre.pdf");
  };

  const handleExportExcel = () => {
    const data = filteredCadre.map((cadre, index) => ({
      "Sl. No": index + 1,
      "Cadre Name": cadre.cadre.toUpperCase(),
      Abbreviation: cadre.cadre_abbr ? cadre.cadre_abbr.toUpperCase() : "",
    }));
    exportToExcel("Cadre", data, "cadre.xlsx");
  };

  return (
    <>
      <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
            Cadre List
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search Cadre..."
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
                    <>View Active Cadres</>
                  ) : (
                    <>View Deactivated Cadres</>
                  )}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedCadre(null);
                    setModalOpen(true);
                  }}
                >
                  Add New Cadre
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
                    Cadre
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abbreviation
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider float-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedCadre.map((cadre, index) => (
                  <tr
                    key={cadre.cadre_id}
                    className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {cadre.cadre.toUpperCase()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {cadre.cadre_abbr ? cadre.cadre_abbr.toUpperCase() : ""}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex justify-end space-x-2">
                        {cadre.is_active && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-indigo-100 px-2.5 py-1.5 text-sm font-semibold text-grey"
                            onClick={() => {
                              setSelectedCadre(cadre);
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
                              onClick={() => handleDeleteClick(cadre.cadre_id)}
                            >
                              <NoSymbolIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Deactivate Cadre
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <button
                              type="button"
                              className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-green-600 hover:bg-green-100 hover:ring-0 px-2.5 py-1.5 text-sm font-semibold"
                              onClick={() => handleReactivateClick(cadre.cadre_id)}
                            >
                              <ArrowUturnLeftIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Activate Cadre
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
        onConfirm={reactivateCadre}
        title={`Reactivate "${cadreToReactivate?.cadre?.toUpperCase() || 'Cadre'}"`}
        message={`Are you sure you want to reactivate "${cadreToReactivate?.cadre?.toUpperCase() || 'this cadre'}?"`}
        iconType="success"
        confirmText="Reactivate"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={confirmOpen}
        setIsOpen={setConfirmOpen}
        onConfirm={confirmDelete}
        title={`Deactivate "${cadreList.find((c) => c.cadre_id === cadreToDelete)?.cadre?.toUpperCase() || 'Cadre'}"`}
        message={`Are you sure you want to deactivate "${cadreList.find((c) => c.cadre_id === cadreToDelete)?.cadre?.toUpperCase() || 'this cadre'}?"`}
        iconType="delete"
        confirmText="Deactivate"
        cancelText="Cancel"
      />

      <ModalCadreDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        save={handleAddOrUpdate}
        cadre={selectedCadre}
      />
    </>
  );
}