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
import { ModalTrainingTypeDetails } from "../modal/training-type-details";
import ConfirmModal from "../../../../components/confirmModal";
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from "../../../../components/dataTableControls";

export default function TrainingTypeList() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [trainingTypeList, setTrainingTypeList] = useState([]);
  const [selectedTrainingType, setSelectedTrainingType] = useState(null);
  const [trainingTypeToDelete, setTrainingTypeToDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [trainingTypeToReactivate, setTrainingTypeToReactivate] = useState(null);
  const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 25;

  const fetchTrainingTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/masters/training_type-all`);
      console.log("Fetched trainingTypeList:", response.data.data.training_type);
      setTrainingTypeList(response.data.data.training_type || []);
    } catch (error) {
      console.error("Error fetching Training Types:", error);
      toast.error("Failed to load training types.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainingTypes();
  }, [fetchTrainingTypes]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddOrUpdate = async (TrainingTypeData) => {
    if (isLoading) {
      toast.error("Please wait until training types are loaded.");
      return;
    }

    try {
      const trimmedTrainingType = TrainingTypeData.training_type.trim().toLowerCase();
      console.log("Input training type:", trimmedTrainingType);
      console.log("Current trainingTypeList:", trainingTypeList);

      // Check for existing training type
      const existing = trainingTypeList.find(
        (t) => t.training_type.toLowerCase() === trimmedTrainingType
      );

      // Case: Training type exists and is deactivated
      if (existing && !existing.is_active && !TrainingTypeData.training_type_id) {
        console.log("Found deactivated training type:", existing);
        setTrainingTypeToReactivate(existing);
        setConfirmReactivateOpen(true);
        return;
      }

      // Case: Training type exists and is active
      if (existing && existing.is_active && !TrainingTypeData.training_type_id) {
        toast.error(`Training Type "${TrainingTypeData.training_type.trim()}" already exists and is active.`);
        return;
      }

      // Case: Update or add new training type
      let response;
      if (TrainingTypeData.training_type_id) {
        const { training_type_id, ...TrainingTypeDataWithoutId } = TrainingTypeData;
        response = await axiosInstance.put(
          `/masters/training_type/${training_type_id}`,
          { ...TrainingTypeDataWithoutId, training_type: TrainingTypeData.training_type.trim() }
        );
        console.log("Training Type updated:", response);
        toast.success("Training Type updated successfully");
      } else {
        response = await axiosInstance.post("/masters/training_type", {
          ...TrainingTypeData,
          training_type: TrainingTypeData.training_type.trim(),
        });
        console.log("Training Type added:", response);
        toast.success("Training Type added successfully");
      }

      fetchTrainingTypes();
      setModalOpen(false);
      setSelectedTrainingType(null);
    } catch (error) {
      console.error("Error in handleAddOrUpdate:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";

      // Handle case where backend reports the training type exists
      if (
        error.response?.status === 400 &&
        errorMessage.toLowerCase().includes("already exists")
      ) {
        await fetchTrainingTypes();
        const updatedExisting = trainingTypeList.find(
          (t) => t.training_type.toLowerCase() === trimmedTrainingType
        );
        if (updatedExisting && !updatedExisting.is_active) {
          console.log("Backend reported existing deactivated training type:", updatedExisting);
          setTrainingTypeToReactivate(updatedExisting);
          setConfirmReactivateOpen(true);
          return;
        }
        toast.error(`Training Type "${TrainingTypeData.training_type.trim()}" already exists.`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteClick = (training_type_id) => {
    setTrainingTypeToDelete(training_type_id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const trainingTypeData = trainingTypeList.find(
        (t) => t.training_type_id === trainingTypeToDelete
      );
      if (!trainingTypeData) {
        toast.error("Training Type data not found.");
        setConfirmOpen(false);
        return;
      }

      await axiosInstance.put(`/masters/training_type/${trainingTypeToDelete}`, {
        training_type: trainingTypeData.training_type,
        is_active: false,
      });
      fetchTrainingTypes();
      toast.success("Training Type deactivated successfully");
    } catch (error) {
      console.error("Error deactivating training type:", error);
      toast.error("Failed to deactivate Training Type.");
    } finally {
      setTrainingTypeToDelete(null);
      setConfirmOpen(false);
    }
  };

  const reactivateTrainingType = async () => {
    if (!trainingTypeToReactivate) {
      toast.error("Training Type data not found.");
      setConfirmReactivateOpen(false);
      return;
    }

    try {
      await axiosInstance.put(`/masters/training_type/${trainingTypeToReactivate.training_type_id}`, {
        training_type: trainingTypeToReactivate.training_type,
        is_active: true,
      });
      fetchTrainingTypes();
      toast.success("Training Type reactivated successfully");
    } catch (error) {
      toast.error("Failed to reactivate Training Type.");
      console.error("Reactivation error:", error);
    } finally {
      setTrainingTypeToReactivate(null);
      setConfirmReactivateOpen(false);
    }
  };

  const handleReactivateClick = (training_type_id) => {
    const training_type = trainingTypeList.find((t) => t.training_type_id === training_type_id);
    console.log("Reactivating training type:", training_type);
    setTrainingTypeToReactivate(training_type);
    setConfirmReactivateOpen(true);
  };

  const filteredTrainingTypes = trainingTypeList
    .filter((training_type) =>
      training_type.training_type.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((training_type) => training_type.is_active !== showDeactivated);

  const paginatedTrainingTypes = filteredTrainingTypes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredTrainingTypes.length / itemsPerPage);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Sl. No", "Training Type"];
    const rows = filteredTrainingTypes.map((training_type, index) => [
      index + 1,
      training_type.training_type.toUpperCase(),
    ]);
    exportToCSV("training-type.csv", headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ["Sl. No", "Training Type"];
    const rows = filteredTrainingTypes.map((training_type, index) => [
      index + 1,
      training_type.training_type.toUpperCase(),
    ]);
    exportToPDF("Training Type", headers, rows, "training-type.pdf");
  };

  const handleExportExcel = () => {
    const data = filteredTrainingTypes.map((training_type, index) => ({
      "Sl. No": index + 1,
      "Training Type": training_type.training_type.toUpperCase(),
    }));
    exportToExcel("Training Type", data, "training-type.xlsx");
  };

  return (
    <>
      <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
            Training Type List
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search Training Type..."
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
                    <>View Active Training Types</>
                  ) : (
                    <>View Deactivated Training Types</>
                  )}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedTrainingType(null);
                    setModalOpen(true);
                  }}
                >
                  Add New Training Type
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
                    Training Type
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrainingTypes.map((training_type, index) => (
                  <tr
                    key={training_type.training_type_id}
                    className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {training_type.training_type.toUpperCase()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex justify-end space-x-2">
                        {training_type.is_active && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-indigo-100 px-2.5 py-1.5 text-sm font-semibold text-grey"
                            onClick={() => {
                              setSelectedTrainingType(training_type);
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
                              onClick={() => handleDeleteClick(training_type.training_type_id)}
                            >
                              <NoSymbolIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Deactivate Training Type
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <button
                              type="button"
                              className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-green-600 hover:bg-green-100 hover:ring-0 px-2.5 py-1.5 text-sm font-semibold"
                              onClick={() => handleReactivateClick(training_type.training_type_id)}
                            >
                              <ArrowUturnLeftIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Activate Training Type
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
        onConfirm={reactivateTrainingType}
        title={`Reactivate "${trainingTypeToReactivate?.training_type?.toUpperCase() || 'Training Type'}"`}
        message={`Are you sure you want to reactivate "${trainingTypeToReactivate?.training_type?.toUpperCase() || 'this training type'}?"`}
        iconType="success"
        confirmText="Reactivate"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={confirmOpen}
        setIsOpen={setConfirmOpen}
        onConfirm={confirmDelete}
        title={`Deactivate "${trainingTypeList.find((t) => t.training_type_id === trainingTypeToDelete)?.training_type?.toUpperCase() || 'Training Type'}"`}
        message={`Are you sure you want to deactivate "${trainingTypeList.find((t) => t.training_type_id === trainingTypeToDelete)?.training_type?.toUpperCase() || 'this training type'}?"`}
        iconType="delete"
        confirmText="Deactivate"
        cancelText="Cancel"
      />

      <ModalTrainingTypeDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        save={handleAddOrUpdate}
        training_type={selectedTrainingType}
      />
    </>
  );
}