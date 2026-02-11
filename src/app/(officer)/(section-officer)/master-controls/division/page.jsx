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
import { ModalDivisionDetails } from "../modal/division-details";
import ConfirmModal from "../../../../components/confirmModal";
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from "../../../../components/dataTableControls";

export default function DivisionList() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [divisionList, setDivisionList] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [divisionToDelete, setDivisionToDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [divisionToReactivate, setDivisionToReactivate] = useState(null);
  const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 25;

  const fetchDivision = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/masters/division-all`);
      console.log("Fetched divisionList:", response.data.data.division);
      setDivisionList(response.data.data.division);
    } catch (error) {
      console.error("Error fetching Division:", error);
      toast.error("Failed to load divisions.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDivision();
  }, [fetchDivision]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddOrUpdate = async (DivisionData) => {
    if (isLoading) {
      toast.error("Please wait until divisions are loaded.");
      return;
    }

    try {
      const trimmedDivision = DivisionData.division.trim().toLowerCase();
      console.log("Input division:", trimmedDivision);
      console.log("Current divisionList:", divisionList);

      // Check for existing division
      const existing = divisionList.find(
        (div) => div.division.toLowerCase() === trimmedDivision
      );

      // Case: Division exists and is deactivated
      if (existing && !existing.is_active && !DivisionData.division_id) {
        console.log("Found deactivated division:", existing);
        setDivisionToReactivate(existing);
        setConfirmReactivateOpen(true);
        return;
      }

      // Case: Division exists and is active
      if (existing && existing.is_active && !DivisionData.division_id) {
        toast.error(`Division "${DivisionData.division.trim()}" already exists and is active.`);
        return;
      }

      // Case: Update or add new division
      let response;
      if (DivisionData.division_id) {
        const { division_id, ...DivisionDataWithoutId } = DivisionData;
        response = await axiosInstance.put(
          `/masters/division/${division_id}`,
          { ...DivisionDataWithoutId, division: DivisionData.division.trim() }
        );
        toast.success("Division updated successfully");
      } else {
        response = await axiosInstance.post("/masters/division", {
          ...DivisionData,
          division: DivisionData.division.trim(),
        });
        toast.success("Division added successfully");
      }

      fetchDivision();
      setModalOpen(false);
      setSelectedDivision(null);
    } catch (error) {
      console.error("Error in handleAddOrUpdate:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";

      // Handle case where backend reports the division exists
      if (
        error.response?.status === 400 &&
        errorMessage.toLowerCase().includes("already exists")
      ) {
        await fetchDivision();
        const updatedExisting = divisionList.find(
          (div) => div.division.toLowerCase() === trimmedDivision
        );
        if (updatedExisting && !updatedExisting.is_active) {
          console.log("Backend reported existing deactivated division:", updatedExisting);
          setDivisionToReactivate(updatedExisting);
          setConfirmReactivateOpen(true);
          return;
        }
        toast.error(`Division "${DivisionData.division.trim()}" already exists.`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteClick = (division_id) => {
    setDivisionToDelete(division_id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/masters/division/${divisionToDelete}`, {
        data: { is_active: false },
      });
      fetchDivision();
      toast.success("Division deactivated successfully");
    } catch (error) {
      console.error("Error deactivating division:", error);
      toast.error("Failed to deactivate Division.");
    } finally {
      setDivisionToDelete(null);
      setConfirmOpen(false);
    }
  };

  const reactivateDivision = async () => {
    if (!divisionToReactivate) {
      toast.error("Division data not found.");
      setConfirmReactivateOpen(false);
      return;
    }

    try {
      await axiosInstance.put(`/masters/division/${divisionToReactivate.division_id}`, {
        division: divisionToReactivate.division,
        is_active: true,
      });
      fetchDivision();
      toast.success("Division reactivated successfully");
    } catch (error) {
      toast.error("Failed to reactivate Division.");
      console.error("Reactivation error:", error);
    } finally {
      setDivisionToReactivate(null);
      setConfirmReactivateOpen(false);
    }
  };

  const handleReactivateClick = (division_id) => {
    const division = divisionList.find((d) => d.division_id === division_id);
    console.log("Reactivating division:", division);
    setDivisionToReactivate(division);
    setConfirmReactivateOpen(true);
  };

  const filteredDivision = divisionList
    .filter((division) =>
      division.division.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((division) => division.is_active !== showDeactivated);

  const paginatedDivision = filteredDivision.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredDivision.length / itemsPerPage);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Sl. No", "Division"];
    const rows = filteredDivision.map((division, index) => [
      index + 1,
      division.division.toUpperCase(),
    ]);
    exportToCSV("division.csv", headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ["Sl. No", "Division"];
    const rows = filteredDivision.map((division, index) => [
      index + 1,
      division.division.toUpperCase(),
    ]);
    exportToPDF("Division", headers, rows, "division.pdf");
  };

  const handleExportExcel = () => {
    const data = filteredDivision.map((division, index) => ({
      "Sl. No": index + 1,
      "Division Name": division.division.toUpperCase(),
    }));
    exportToExcel("Division", data, "division.xlsx");
  };

  return (
    <>
      <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
            Division List
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search Division..."
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
                    <>View Active Divisions</>
                  ) : (
                    <>View Deactivated Divisions</>
                  )}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedDivision(null);
                    setModalOpen(true);
                  }}
                >
                  Add New Division
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
                    Division
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider float-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedDivision.map((division, index) => (
                  <tr
                    key={division.division_id}
                    className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {division.division.toUpperCase()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex justify-end space-x-2">
                        {division.is_active && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-indigo-100 px-2.5 py-1.5 text-sm font-semibold text-grey"
                            onClick={() => {
                              setSelectedDivision(division);
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
                              onClick={() => handleDeleteClick(division.division_id)}
                            >
                              <NoSymbolIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Deactivate Division
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <button
                              type="button"
                              className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-green-600 hover:bg-green-100 hover:ring-0 px-2.5 py-1.5 text-sm font-semibold"
                              onClick={() => handleReactivateClick(division.division_id)}
                            >
                              <ArrowUturnLeftIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Activate Division
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
        onConfirm={reactivateDivision}
        title={`Reactivate "${divisionToReactivate?.division?.toUpperCase() || 'Division'}"`}
        message={`Are you sure you want to reactivate "${divisionToReactivate?.division?.toUpperCase() || 'this division'}?"`}
        iconType="success"
        confirmText="Reactivate"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={confirmOpen}
        setIsOpen={setConfirmOpen}
        onConfirm={confirmDelete}
        title={`Deactivate "${divisionList.find((d) => d.division_id === divisionToDelete)?.division?.toUpperCase() || 'Division'}"`}
        message={`Are you sure you want to deactivate "${divisionList.find((d) => d.division_id === divisionToDelete)?.division?.toUpperCase() || 'this division'}?"`}
        iconType="delete"
        confirmText="Deactivate"
        cancelText="Cancel"
      />

      <ModalDivisionDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        save={handleAddOrUpdate}
        division={selectedDivision}
      />
    </>
  );
}