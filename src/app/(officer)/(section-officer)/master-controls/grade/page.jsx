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
import { ModalGradeDetails } from "../modal/grade-details";
import ConfirmModal from "../../../../components/confirmModal";
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from "../../../../components/dataTableControls";

export default function GradeList() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [gradeList, setGradeList] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [gradeToDelete, setGradeToDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [gradeToReactivate, setGradeToReactivate] = useState(null);
  const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 25;

  const fetchGrades = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/masters/grade-all`);
      console.log("Fetched gradeList:", response.data.data.grade);
      setGradeList(response.data.data.grade || []);
    } catch (error) {
      console.error("Error fetching Grades:", error);
      toast.error("Failed to load grades.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddOrUpdate = async (GradeData) => {
    if (isLoading) {
      toast.error("Please wait until grades are loaded.");
      return;
    }

    try {
      const trimmedGrade = GradeData.grade.trim().toLowerCase();
      console.log("Input grade:", trimmedGrade);
      console.log("Current gradeList:", gradeList);

      // Check for existing grade
      const existing = gradeList.find(
        (g) => g.grade.toLowerCase() === trimmedGrade
      );

      // Case: Grade exists and is deactivated
      if (existing && !existing.is_active && !GradeData.grade_id) {
        console.log("Found deactivated grade:", existing);
        setGradeToReactivate(existing);
        setConfirmReactivateOpen(true);
        return;
      }

      // Case: Grade exists and is active
      if (existing && existing.is_active && !GradeData.grade_id) {
        toast.error(`Grade "${GradeData.grade.trim()}" already exists and is active.`);
        return;
      }

      // Case: Update or add new grade
      let response;
      if (GradeData.grade_id) {
        const { grade_id, ...GradeDataWithoutId } = GradeData;
        response = await axiosInstance.put(
          `/masters/grade/${grade_id}`,
          { ...GradeDataWithoutId, grade: GradeData.grade.trim() }
        );
        console.log("Grade updated:", response);
        toast.success("Grade updated successfully");
      } else {
        response = await axiosInstance.post("/masters/grade", {
          ...GradeData,
          grade: GradeData.grade.trim(),
        });
        console.log("Grade added:", response);
        toast.success("Grade added successfully");
      }

      fetchGrades();
      setModalOpen(false);
      setSelectedGrade(null);
    } catch (error) {
      console.error("Error in handleAddOrUpdate:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";

      // Handle case where backend reports the grade exists
      if (
        error.response?.status === 400 &&
        errorMessage.toLowerCase().includes("already exists")
      ) {
        await fetchGrades();
        const updatedExisting = gradeList.find(
          (g) => g.grade.toLowerCase() === trimmedGrade
        );
        if (updatedExisting && !updatedExisting.is_active) {
          console.log("Backend reported existing deactivated grade:", updatedExisting);
          setGradeToReactivate(updatedExisting);
          setConfirmReactivateOpen(true);
          return;
        }
        toast.error(`Grade "${GradeData.grade.trim()}" already exists.`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteClick = (grade_id) => {
    setGradeToDelete(grade_id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const gradeData = gradeList.find((g) => g.grade_id === gradeToDelete);
      if (!gradeData) {
        toast.error("Grade data not found.");
        setConfirmOpen(false);
        return;
      }

      await axiosInstance.put(`/masters/grade/${gradeToDelete}`, {
        grade: gradeData.grade,
        is_active: false,
      });
      fetchGrades();
      toast.success("Grade deactivated successfully");
    } catch (error) {
      console.error("Error deactivating grade:", error);
      toast.error("Failed to deactivate Grade.");
    } finally {
      setGradeToDelete(null);
      setConfirmOpen(false);
    }
  };

  const reactivateGrade = async () => {
    if (!gradeToReactivate) {
      toast.error("Grade data not found.");
      setConfirmReactivateOpen(false);
      return;
    }

    try {
      await axiosInstance.put(`/masters/grade/${gradeToReactivate.grade_id}`, {
        grade: gradeToReactivate.grade,
        is_active: true,
      });
      fetchGrades();
      toast.success("Grade reactivated successfully");
    } catch (error) {
      toast.error("Failed to reactivate Grade.");
      console.error("Reactivation error:", error);
    } finally {
      setGradeToReactivate(null);
      setConfirmReactivateOpen(false);
    }
  };

  const handleReactivateClick = (grade_id) => {
    const grade = gradeList.find((g) => g.grade_id === grade_id);
    console.log("Reactivating grade:", grade);
    setGradeToReactivate(grade);
    setConfirmReactivateOpen(true);
  };

  const filteredGrades = gradeList
    .filter((grade) =>
      grade.grade.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((grade) => grade.is_active !== showDeactivated);

  const paginatedGrades = filteredGrades.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredGrades.length / itemsPerPage);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Sl. No", "Grade"];
    const rows = filteredGrades.map((grade, index) => [
      index + 1,
      grade.grade.toUpperCase(),
    ]);
    exportToCSV("grade.csv", headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ["Sl. No", "Grade"];
    const rows = filteredGrades.map((grade, index) => [
      index + 1,
      grade.grade.toUpperCase(),
    ]);
    exportToPDF("Grade", headers, rows, "grade.pdf");
  };

  const handleExportExcel = () => {
    const data = filteredGrades.map((grade, index) => ({
      "Sl. No": index + 1,
      "Grade": grade.grade.toUpperCase(),
    }));
    exportToExcel("Grade", data, "grade.xlsx");
  };

  return (
    <>
      <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
            Grade List
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search Grade..."
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
                    <>View Active Grades</>
                  ) : (
                    <>View Deactivated Grades</>
                  )}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedGrade(null);
                    setModalOpen(true);
                  }}
                >
                  Add New Grade
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
                    Grade
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedGrades.map((grade, index) => (
                  <tr
                    key={grade.grade_id}
                    className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {grade.grade.toUpperCase()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex justify-end space-x-2">
                        {grade.is_active && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-indigo-100 px-2.5 py-1.5 text-sm font-semibold text-grey"
                            onClick={() => {
                              setSelectedGrade(grade);
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
                              onClick={() => handleDeleteClick(grade.grade_id)}
                            >
                              <NoSymbolIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Deactivate Grade
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <button
                              type="button"
                              className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-green-600 hover:bg-green-100 hover:ring-0 px-2.5 py-1.5 text-sm font-semibold"
                              onClick={() => handleReactivateClick(grade.grade_id)}
                            >
                              <ArrowUturnLeftIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Activate Grade
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
        onConfirm={reactivateGrade}
        title={`Reactivate "${gradeToReactivate?.grade?.toUpperCase() || 'Grade'}"`}
        message={`Are you sure you want to reactivate "${gradeToReactivate?.grade?.toUpperCase() || 'this grade'}?"`}
        iconType="success"
        confirmText="Reactivate"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={confirmOpen}
        setIsOpen={setConfirmOpen}
        onConfirm={confirmDelete}
        title={`Deactivate "${gradeList.find((g) => g.grade_id === gradeToDelete)?.grade?.toUpperCase() || 'Grade'}"`}
        message={`Are you sure you want to deactivate "${gradeList.find((g) => g.grade_id === gradeToDelete)?.grade?.toUpperCase() || 'this grade'}?"`}
        iconType="delete"
        confirmText="Deactivate"
        cancelText="Cancel"
      />

      <ModalGradeDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        save={handleAddOrUpdate}
        grade={selectedGrade}
      />
    </>
  );
}