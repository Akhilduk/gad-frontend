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
import { ModalDesignationDetails } from "../modal/designation-details";
import ConfirmModal from "../../../../components/confirmModal";
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from "../../../../components/dataTableControls";

export default function DesignationList() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [designationList, setDesignationList] = useState([]);
  const [selectedDesignation, setSelectedDesignation] = useState(null);
  const [designationToDelete, setDesignationToDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [designationToReactivate, setDesignationToReactivate] = useState(null);
  const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 25;

  const fetchDesignation = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/masters/designation-all`);
      console.log("Fetched designationList:", response.data.data.designation);
      setDesignationList(response.data.data.designation);
    } catch (error) {
      console.error("Error fetching Designation:", error);
      toast.error("Failed to load designations.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDesignation();
  }, [fetchDesignation]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddOrUpdate = async (DesignationData) => {
    if (isLoading) {
      toast.error("Please wait until designations are loaded.");
      return;
    }

    try {
      const trimmedDesignation = DesignationData.designation.trim().toLowerCase();
      console.log("Input designation:", trimmedDesignation);
      console.log("Current designationList:", designationList);

      // Check for existing designation
      const existing = designationList.find(
        (des) => des.designation.toLowerCase() === trimmedDesignation
      );

      // Case: Designation exists and is deactivated
      if (existing && !existing.is_active && !DesignationData.designation_id) {
        console.log("Found deactivated designation:", existing);
        setDesignationToReactivate(existing);
        setConfirmReactivateOpen(true);
        return;
      }

      // Case: Designation exists and is active
      if (existing && existing.is_active && !DesignationData.designation_id) {
        toast.error(`Designation "${DesignationData.designation.trim()}" already exists and is active.`);
        return;
      }

      // Case: Update or add new designation
      let response;
      if (DesignationData.designation_id) {
        const { designation_id, ...DesignationDataWithoutId } = DesignationData;
        response = await axiosInstance.put(
          `/masters/designation/${designation_id}`,
          { ...DesignationDataWithoutId, designation: DesignationData.designation.trim() }
        );
        toast.success("Designation updated successfully");
      } else {
        response = await axiosInstance.post("/masters/designation", {
          ...DesignationData,
          designation: DesignationData.designation.trim(),
        });
        toast.success("Designation added successfully");
      }

      fetchDesignation();
      setModalOpen(false);
      setSelectedDesignation(null);
    } catch (error) {
      console.error("Error in handleAddOrUpdate:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";

      // Handle case where backend reports the designation exists
      if (
        error.response?.status === 400 &&
        errorMessage.toLowerCase().includes("already exists")
      ) {
        await fetchDesignation();
        const updatedExisting = designationList.find(
          (des) => des.designation.toLowerCase() === trimmedDesignation
        );
        if (updatedExisting && !updatedExisting.is_active) {
          console.log("Backend reported existing deactivated designation:", updatedExisting);
          setDesignationToReactivate(updatedExisting);
          setConfirmReactivateOpen(true);
          return;
        }
        toast.error(`Designation "${DesignationData.designation.trim()}" already exists.`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteClick = (designation_id) => {
    setDesignationToDelete(designation_id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const designationData = designationList.find((d) => d.designation_id === designationToDelete);
      if (!designationData) {
        toast.error("Designation data not found.");
        setConfirmOpen(false);
        return;
      }

      await axiosInstance.put(`/masters/designation/${designationToDelete}`, {
        designation: designationData.designation,
        is_active: false,
      });
      fetchDesignation();
      toast.success("Designation deactivated successfully");
    } catch (error) {
      console.error("Error deactivating designation:", error);
      toast.error("Failed to deactivate Designation.");
    } finally {
      setDesignationToDelete(null);
      setConfirmOpen(false);
    }
  };

  const reactivateDesignation = async () => {
    if (!designationToReactivate) {
      toast.error("Designation data not found.");
      setConfirmReactivateOpen(false);
      return;
    }

    try {
      await axiosInstance.put(`/masters/designation/${designationToReactivate.designation_id}`, {
        designation: designationToReactivate.designation,
        is_active: true,
      });
      fetchDesignation();
      toast.success("Designation reactivated successfully");
    } catch (error) {
      toast.error("Failed to reactivate Designation.");
      console.error("Reactivation error:", error);
    } finally {
      setDesignationToReactivate(null);
      setConfirmReactivateOpen(false);
    }
  };

  const handleReactivateClick = (designation_id) => {
    const designation = designationList.find((d) => d.designation_id === designation_id);
    console.log("Reactivating designation:", designation);
    setDesignationToReactivate(designation);
    setConfirmReactivateOpen(true);
  };

  const filteredDesignation = designationList
    .filter((designation) =>
      designation.designation.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((designation) => designation.is_active !== showDeactivated);

  const paginatedDesignation = filteredDesignation.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredDesignation.length / itemsPerPage);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Sl. No", "Designation"];
    const rows = filteredDesignation.map((designation, index) => [
      index + 1,
      designation.designation.toUpperCase(),
    ]);
    exportToCSV("designation.csv", headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ["Sl. No", "Designation"];
    const rows = filteredDesignation.map((designation, index) => [
      index + 1,
      designation.designation.toUpperCase(),
    ]);
    exportToPDF("Designation", headers, rows, "designation.pdf");
  };

  const handleExportExcel = () => {
    const data = filteredDesignation.map((designation, index) => ({
      "Sl. No": index + 1,
      "Designation Name": designation.designation.toUpperCase(),
    }));
    exportToExcel("Designation", data, "designation.xlsx");
  };

  return (
    <>
      <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
            Designation List
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search Designation..."
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
                    <>View Active Designations</>
                  ) : (
                    <>View Deactivated Designations</>
                  )}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedDesignation(null);
                    setModalOpen(true);
                  }}
                >
                  Add New Designation
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
                    Designation
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider float-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedDesignation.map((designation, index) => (
                  <tr
                    key={designation.designation_id}
                    className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {designation.designation.toUpperCase()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex justify-end space-x-2">
                        {designation.is_active && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-indigo-100 px-2.5 py-1.5 text-sm font-semibold text-grey"
                            onClick={() => {
                              setSelectedDesignation(designation);
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
                              onClick={() => handleDeleteClick(designation.designation_id)}
                            >
                              <NoSymbolIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Deactivate Designation
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <button
                              type="button"
                              className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-green-600 hover:bg-green-100 hover:ring-0 px-2.5 py-1.5 text-sm font-semibold"
                              onClick={() => handleReactivateClick(designation.designation_id)}
                            >
                              <ArrowUturnLeftIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Activate Designation
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
        onConfirm={reactivateDesignation}
        title={`Reactivate "${designationToReactivate?.designation?.toUpperCase() || 'Designation'}"`}
        message={`Are you sure you want to reactivate "${designationToReactivate?.designation?.toUpperCase() || 'this designation'}?"`}
        iconType="success"
        confirmText="Reactivate"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={confirmOpen}
        setIsOpen={setConfirmOpen}
        onConfirm={confirmDelete}
        title={`Deactivate "${designationList.find((d) => d.designation_id === designationToDelete)?.designation?.toUpperCase() || 'Designation'}"`}
        message={`Are you sure you want to deactivate "${designationList.find((d) => d.designation_id === designationToDelete)?.designation?.toUpperCase() || 'this designation'}?"`}
        iconType="delete"
        confirmText="Deactivate"
        cancelText="Cancel"
      />

      <ModalDesignationDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        save={handleAddOrUpdate}
        designation={selectedDesignation}
      />
    </>
  );
}