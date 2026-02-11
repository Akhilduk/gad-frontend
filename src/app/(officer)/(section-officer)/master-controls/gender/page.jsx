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
import { ModalGenderDetails } from "../modal/gender-details";
import ConfirmModal from "../../../../components/confirmModal";
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from "../../../../components/dataTableControls";

export default function GenderList() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [genderList, setGenderList] = useState([]);
  const [selectedGender, setSelectedGender] = useState(null);
  const [genderToDelete, setGenderToDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [genderToReactivate, setGenderToReactivate] = useState(null);
  const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 25;

  const fetchGender = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/masters/gender-all`);
      console.log("Fetched genderList:", response.data.data.gender);
      setGenderList(response.data.data.gender);
    } catch (error) {
      console.error("Error fetching Gender:", error);
      toast.error("Failed to load genders.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGender();
  }, [fetchGender]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddOrUpdate = async (GenderData) => {
    if (isLoading) {
      toast.error("Please wait until genders are loaded.");
      return;
    }

    try {
      const trimmedGender = GenderData.gender.trim().toLowerCase();
      console.log("Input gender:", trimmedGender);
      console.log("Current genderList:", genderList);

      // Check for existing gender
      const existing = genderList.find(
        (g) => g.gender.toLowerCase() === trimmedGender
      );

      // Case: Gender exists and is deactivated
      if (existing && !existing.is_active && !GenderData.gender_id) {
        console.log("Found deactivated gender:", existing);
        setGenderToReactivate(existing);
        setConfirmReactivateOpen(true);
        return;
      }

      // Case: Gender exists and is active
      if (existing && existing.is_active && !GenderData.gender_id) {
        toast.error(`Gender "${GenderData.gender.trim()}" already exists and is active.`);
        return;
      }

      // Case: Update or add new gender
      let response;
      if (GenderData.gender_id) {
        const { gender_id, ...GenderDataWithoutId } = GenderData;
        response = await axiosInstance.put(
          `/masters/gender/${gender_id}`,
          { ...GenderDataWithoutId, gender: GenderData.gender.trim() }
        );
        toast.success("Gender updated successfully");
      } else {
        response = await axiosInstance.post("/masters/gender", {
          ...GenderData,
          gender: GenderData.gender.trim(),
        });
        toast.success("Gender added successfully");
      }

      fetchGender();
      setModalOpen(false);
      setSelectedGender(null);
    } catch (error) {
      console.error("Error in handleAddOrUpdate:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";

      // Handle case where backend reports the gender exists
      if (
        error.response?.status === 400 &&
        errorMessage.toLowerCase().includes("already exists")
      ) {
        await fetchGender();
        const updatedExisting = genderList.find(
          (g) => g.gender.toLowerCase() === trimmedGender
        );
        if (updatedExisting && !updatedExisting.is_active) {
          console.log("Backend reported existing deactivated gender:", updatedExisting);
          setGenderToReactivate(updatedExisting);
          setConfirmReactivateOpen(true);
          return;
        }
        toast.error(`Gender "${GenderData.gender.trim()}" already exists.`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteClick = (gender_id) => {
    setGenderToDelete(gender_id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/masters/gender/${genderToDelete}`, {
        data: { is_active: false },
      });
      fetchGender();
      toast.success("Gender deactivated successfully");
    } catch (error) {
      console.error("Error deactivating gender:", error);
      toast.error("Failed to deactivate Gender.");
    } finally {
      setGenderToDelete(null);
      setConfirmOpen(false);
    }
  };

  const reactivateGender = async () => {
    if (!genderToReactivate) {
      toast.error("Gender data not found.");
      setConfirmReactivateOpen(false);
      return;
    }

    try {
      await axiosInstance.put(`/masters/gender/${genderToReactivate.gender_id}`, {
        gender: genderToReactivate.gender,
        is_active: true,
      });
      fetchGender();
      toast.success("Gender reactivated successfully");
    } catch (error) {
      toast.error("Failed to reactivate Gender.");
      console.error("Reactivation error:", error);
    } finally {
      setGenderToReactivate(null);
      setConfirmReactivateOpen(false);
    }
  };

  const handleReactivateClick = (gender_id) => {
    const gender = genderList.find((g) => g.gender_id === gender_id);
    console.log("Reactivating gender:", gender);
    setGenderToReactivate(gender);
    setConfirmReactivateOpen(true);
  };

  const filteredGender = genderList
    .filter((gender) =>
      gender.gender.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((gender) => gender.is_active !== showDeactivated);

  const paginatedGender = filteredGender.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredGender.length / itemsPerPage);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Sl. No", "Gender"];
    const rows = filteredGender.map((gender, index) => [
      index + 1,
      gender.gender.toUpperCase(),
    ]);
    exportToCSV("gender.csv", headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ["Sl. No", "Gender"];
    const rows = filteredGender.map((gender, index) => [
      index + 1,
      gender.gender.toUpperCase(),
    ]);
    exportToPDF("Gender", headers, rows, "gender.pdf");
  };

  const handleExportExcel = () => {
    const data = filteredGender.map((gender, index) => ({
      "Sl. No": index + 1,
      "Gender": gender.gender.toUpperCase(),
    }));
    exportToExcel("Gender", data, "gender.xlsx");
  };

  return (
    <>
      <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
            Gender List
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search Gender..."
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
                    <>View Active Genders</>
                  ) : (
                    <>View Deactivated Genders</>
                  )}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedGender(null);
                    setModalOpen(true);
                  }}
                >
                  Add New Gender
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
                    Gender
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider float-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedGender.map((gender, index) => (
                  <tr
                    key={gender.gender_id}
                    className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {gender.gender.toUpperCase()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex justify-end space-x-2">
                        {gender.is_active && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-indigo-100 px-2.5 py-1.5 text-sm font-semibold text-grey"
                            onClick={() => {
                              setSelectedGender(gender);
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
                              onClick={() => handleDeleteClick(gender.gender_id)}
                            >
                              <NoSymbolIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Deactivate Gender
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <button
                              type="button"
                              className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-green-600 hover:bg-green-100 hover:ring-0 px-2.5 py-1.5 text-sm font-semibold"
                              onClick={() => handleReactivateClick(gender.gender_id)}
                            >
                              <ArrowUturnLeftIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Activate Gender
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
        onConfirm={reactivateGender}
        title={`Reactivate "${genderToReactivate?.gender?.toUpperCase() || 'Gender'}"`}
        message={`Are you sure you want to reactivate "${genderToReactivate?.gender?.toUpperCase() || 'this gender'}?"`}
        iconType="success"
        confirmText="Reactivate"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={confirmOpen}
        setIsOpen={setConfirmOpen}
        onConfirm={confirmDelete}
        title={`Deactivate "${genderList.find((g) => g.gender_id === genderToDelete)?.gender?.toUpperCase() || 'Gender'}"`}
        message={`Are you sure you want to deactivate "${genderList.find((g) => g.gender_id === genderToDelete)?.gender?.toUpperCase() || 'this gender'}?"`}
        iconType="delete"
        confirmText="Deactivate"
        cancelText="Cancel"
      />

      <ModalGenderDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        save={handleAddOrUpdate}
        gender={selectedGender}
      />
    </>
  );
}