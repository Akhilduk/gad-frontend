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
import { ModalQualificationDetails } from "../modal/qualification-details";
import ConfirmModal from "../../../../components/confirmModal";
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from "../../../../components/dataTableControls";

export default function QualificationList() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [qualificationList, setQualificationList] = useState([]);
  const [selectedQualification, setSelectedQualification] = useState(null);
  const [qualificationToDelete, setQualificationToDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [qualificationToReactivate, setQualificationToReactivate] = useState(null);
  const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 25;

  const fetchQualification = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/masters/qualification-all`);
      console.log("Fetched qualificationList:", response.data.data.qualification);
      setQualificationList(response.data.data.qualification);
    } catch (error) {
      console.error("Error fetching Qualification:", error);
      toast.error("Failed to load qualifications.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQualification();
  }, [fetchQualification]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddOrUpdate = async (QualificationData) => {
    if (isLoading) {
      toast.error("Please wait until qualifications are loaded.");
      return;
    }

    try {
      const trimmedQualification = QualificationData.qualification.trim().toLowerCase();
      console.log("Input qualification:", trimmedQualification);
      console.log("Current qualificationList:", qualificationList);

      // Check for existing qualification
      const existing = qualificationList.find(
        (q) => q.qualification.toLowerCase() === trimmedQualification
      );

      // Case: Qualification exists and is deactivated
      if (existing && !existing.is_active && !QualificationData.qualification_id) {
        console.log("Found deactivated qualification:", existing);
        setQualificationToReactivate(existing);
        setConfirmReactivateOpen(true);
        return;
      }

      // Case: Qualification exists and is active
      if (existing && existing.is_active && !QualificationData.qualification_id) {
        toast.error(`Qualification "${QualificationData.qualification.trim()}" already exists and is active.`);
        return;
      }

      // Case: Update or add new qualification
      let response;
      if (QualificationData.qualification_id) {
        const { qualification_id, ...QualificationDataWithoutId } = QualificationData;
        response = await axiosInstance.put(
          `/masters/qualification/${qualification_id}`,
          { ...QualificationDataWithoutId, qualification: QualificationData.qualification.trim() }
        );
        toast.success("Qualification updated successfully");
      } else {
        response = await axiosInstance.post("/masters/qualification", {
          ...QualificationData,
          qualification: QualificationData.qualification.trim(),
        });
        toast.success("Qualification added successfully");
      }

      fetchQualification();
      setModalOpen(false);
      setSelectedQualification(null);
    } catch (error) {
      console.error("Error in handleAddOrUpdate:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";

      // Handle case where backend reports the qualification exists
      if (
        error.response?.status === 400 &&
        errorMessage.toLowerCase().includes("already exists")
      ) {
        await fetchQualification();
        const updatedExisting = qualificationList.find(
          (q) => q.qualification.toLowerCase() === trimmedQualification
        );
        if (updatedExisting && !updatedExisting.is_active) {
          console.log("Backend reported existing deactivated qualification:", updatedExisting);
          setQualificationToReactivate(updatedExisting);
          setConfirmReactivateOpen(true);
          return;
        }
        toast.error(`Qualification "${QualificationData.qualification.trim()}" already exists.`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteClick = (qualification_id) => {
    setQualificationToDelete(qualification_id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/masters/qualification/${qualificationToDelete}`, {
        data: { is_active: false },
      });
      fetchQualification();
      toast.success("Qualification deactivated successfully");
    } catch (error) {
      console.error("Error deactivating qualification:", error);
      toast.error("Failed to deactivate Qualification.");
    } finally {
      setQualificationToDelete(null);
      setConfirmOpen(false);
    }
  };

  const reactivateQualification = async () => {
    if (!qualificationToReactivate) {
      toast.error("Qualification data not found.");
      setConfirmReactivateOpen(false);
      return;
    }

    try {
      await axiosInstance.put(`/masters/qualification/${qualificationToReactivate.qualification_id}`, {
        qualification: qualificationToReactivate.qualification,
        is_active: true,
      });
     fetchQualification();
      toast.success("Qualification reactivated successfully");
    } catch (error) {
      toast.error("Failed to reactivate Qualification.");
      console.error("Reactivation error:", error);
    } finally {
      setQualificationToReactivate(null);
      setConfirmReactivateOpen(false);
    }
  };

  const handleReactivateClick = (qualification_id) => {
    const qualification = qualificationList.find((q) => q.qualification_id === qualification_id);
    console.log("Reactivating qualification:", qualification);
    setQualificationToReactivate(qualification);
    setConfirmReactivateOpen(true);
  };

  const filteredQualification = qualificationList
    .filter((qualification) =>
      qualification.qualification.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((qualification) => qualification.is_active !== showDeactivated);

  const paginatedQualification = filteredQualification.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredQualification.length / itemsPerPage);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Sl. No", "Qualification"];
    const rows = filteredQualification.map((qualification, index) => [
      index + 1,
      qualification.qualification.toUpperCase(),
    ]);
    exportToCSV("qualification.csv", headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ["Sl. No", "Qualification"];
    const rows = filteredQualification.map((qualification, index) => [
      index + 1,
      qualification.qualification.toUpperCase(),
    ]);
    exportToPDF("Qualification", headers, rows, "qualification.pdf");
  };

  const handleExportExcel = () => {
    const data = filteredQualification.map((qualification, index) => ({
      "Sl. No": index + 1,
      "Qualification Name": qualification.qualification.toUpperCase(),
    }));
    exportToExcel("Qualification", data, "qualification.xlsx");
  };

  return (
    <>
      <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
            Qualification List
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search Qualification..."
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
                    <>View Active Qualifications</>
                  ) : (
                    <>View Deactivated Qualifications</>
                  )}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedQualification(null);
                    setModalOpen(true);
                  }}
                >
                  Add New Qualification
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
                    Qualification
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider float-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedQualification.map((qualification, index) => (
                  <tr
                    key={qualification.qualification_id}
                    className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {qualification.qualification.toUpperCase()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex justify-end space-x-2">
                        {qualification.is_active && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-indigo-100 px-2.5 py-1.5 text-sm font-semibold text-grey"
                            onClick={() => {
                              setSelectedQualification(qualification);
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
                              onClick={() => handleDeleteClick(qualification.qualification_id)}
                            >
                              <NoSymbolIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Deactivate Qualification
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <button
                              type="button"
                              className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-green-600 hover:bg-green-100 hover:ring-0 px-2.5 py-1.5 text-sm font-semibold"
                              onClick={() => handleReactivateClick(qualification.qualification_id)}
                            >
                              <ArrowUturnLeftIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Activate Qualification
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
        onConfirm={reactivateQualification}
        title={`Reactivate "${qualificationToReactivate?.qualification?.toUpperCase() || 'Qualification'}"`}
        message={`Are you sure you want to reactivate "${qualificationToReactivate?.qualification?.toUpperCase() || 'this qualification'}?"`}
        iconType="success"
        confirmText="Reactivate"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={confirmOpen}
        setIsOpen={setConfirmOpen}
        onConfirm={confirmDelete}
        title={`Deactivate "${qualificationList.find((q) => q.qualification_id === qualificationToDelete)?.qualification?.toUpperCase() || 'Qualification'}"`}
        message={`Are you sure you want to deactivate "${qualificationList.find((q) => q.qualification_id === qualificationToDelete)?.qualification?.toUpperCase() || 'this qualification'}?"`}
        iconType="delete"
        confirmText="Deactivate"
        cancelText="Cancel"
      />

      <ModalQualificationDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        save={handleAddOrUpdate}
        qualification={selectedQualification}
      />
    </>
  );
}