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
import { ModalRecruitmentDetails } from "../modal/recruitment-details";
import ConfirmModal from "../../../../components/confirmModal";
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from "../../../../components/dataTableControls";

export default function RecruitmentList() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [recruitmentList, setRecruitmentList] = useState([]);
  const [selectedRecruitment, setSelectedRecruitment] = useState(null);
  const [recruitmentToDelete, setRecruitmentToDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [recruitmentToReactivate, setRecruitmentToReactivate] = useState(null);
  const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 25;

  const fetchRecruitments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/masters/recruitment-all`);
      console.log("Fetched recruitmentList:", response.data.data.recruitment);
      setRecruitmentList(response.data.data.recruitment || []);
    } catch (error) {
      console.error("Error fetching Recruitments:", error);
      toast.error("Failed to load recruitments.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecruitments();
  }, [fetchRecruitments]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddOrUpdate = async (RecruitmentData) => {
    if (isLoading) {
      toast.error("Please wait until recruitments are loaded.");
      return;
    }

    try {
      const trimmedRecruitment = RecruitmentData.recruitment.trim().toLowerCase();
      const trimmedAbbr = RecruitmentData.recruitment_abbr?.trim().toLowerCase() || "";
      console.log("Input recruitment:", trimmedRecruitment, "Abbreviation:", trimmedAbbr);
      console.log("Current recruitmentList:", recruitmentList);

      // Check for existing recruitment
      const existing = recruitmentList.find(
        (rec) => rec.recruitment.toLowerCase() === trimmedRecruitment
      );

      // Case: Recruitment exists and is deactivated
      if (existing && !existing.is_active && !RecruitmentData.recruitment_id) {
        console.log("Found deactivated recruitment:", existing);
        setRecruitmentToReactivate(existing);
        setConfirmReactivateOpen(true);
        return;
      }

      // Case: Recruitment exists and is active
      if (existing && existing.is_active && !RecruitmentData.recruitment_id) {
        toast.error(`Recruitment "${RecruitmentData.recruitment.trim()}" already exists and is active.`);
        return;
      }

      // Case: Update or add new recruitment
      let response;
      if (RecruitmentData.recruitment_id) {
        const { recruitment_id, ...RecruitmentDataWithoutId } = RecruitmentData;
        response = await axiosInstance.put(
          `/masters/recruitment/${recruitment_id}`,
          {
            ...RecruitmentDataWithoutId,
            recruitment: RecruitmentData.recruitment.trim(),
            recruitment_abbr: RecruitmentData.recruitment_abbr?.trim() || "",
          }
        );
        toast.success("Recruitment updated successfully");
      } else {
        response = await axiosInstance.post("/masters/recruitment", {
          ...RecruitmentData,
          recruitment: RecruitmentData.recruitment.trim(),
          recruitment_abbr: RecruitmentData.recruitment_abbr?.trim() || "",
        });
        toast.success("Recruitment added successfully");
      }

      fetchRecruitments();
      setModalOpen(false);
      setSelectedRecruitment(null);
    } catch (error) {
      console.error("Error in handleAddOrUpdate:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";

      // Handle case where backend reports the recruitment exists
      if (
        error.response?.status === 400 &&
        errorMessage.toLowerCase().includes("already exists")
      ) {
        await fetchRecruitments();
        const updatedExisting = recruitmentList.find(
          (rec) => rec.recruitment.toLowerCase() === trimmedRecruitment
        );
        if (updatedExisting && !updatedExisting.is_active) {
          console.log("Backend reported existing deactivated recruitment:", updatedExisting);
          setRecruitmentToReactivate(updatedExisting);
          setConfirmReactivateOpen(true);
          return;
        }
        toast.error(`Recruitment "${RecruitmentData.recruitment.trim()}" already exists.`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteClick = (recruitment_id) => {
    setRecruitmentToDelete(recruitment_id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const recruitmentData = recruitmentList.find(
        (r) => r.recruitment_id === recruitmentToDelete
      );
      if (!recruitmentData) {
        toast.error("Recruitment data not found.");
        setConfirmOpen(false);
        return;
      }

      await axiosInstance.put(`/masters/recruitment/${recruitmentToDelete}`, {
        recruitment: recruitmentData.recruitment,
        recruitment_abbr: recruitmentData.recruitment_abbr,
        is_active: false,
      });
      fetchRecruitments();
      toast.success("Recruitment deactivated successfully");
    } catch (error) {
      console.error("Error deactivating recruitment:", error);
      toast.error("Failed to deactivate Recruitment.");
    } finally {
      setRecruitmentToDelete(null);
      setConfirmOpen(false);
    }
  };

  const reactivateRecruitment = async () => {
    if (!recruitmentToReactivate) {
      toast.error("Recruitment data not found.");
      setConfirmReactivateOpen(false);
      return;
    }

    try {
      await axiosInstance.put(`/masters/recruitment/${recruitmentToReactivate.recruitment_id}`, {
        recruitment: recruitmentToReactivate.recruitment,
        recruitment_abbr: recruitmentToReactivate.recruitment_abbr,
        is_active: true,
      });
      fetchRecruitments();
      toast.success("Recruitment reactivated successfully");
    } catch (error) {
      toast.error("Failed to reactivate Recruitment.");
      console.error("Reactivation error:", error);
    } finally {
      setRecruitmentToReactivate(null);
      setConfirmReactivateOpen(false);
    }
  };

  const handleReactivateClick = (recruitment_id) => {
    const recruitment = recruitmentList.find((r) => r.recruitment_id === recruitment_id);
    console.log("Reactivating recruitment:", recruitment);
    setRecruitmentToReactivate(recruitment);
    setConfirmReactivateOpen(true);
  };

  const filteredRecruitments = recruitmentList
    .filter((recruitment) =>
      recruitment.recruitment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recruitment.recruitment_abbr?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((recruitment) => recruitment.is_active !== showDeactivated);

  const paginatedRecruitments = filteredRecruitments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredRecruitments.length / itemsPerPage);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Sl. No", "Recruitment", "Abbreviation"];
    const rows = filteredRecruitments.map((recruitment, index) => [
      index + 1,
      recruitment.recruitment.toUpperCase(),
      recruitment.recruitment_abbr?.toUpperCase() || "",
    ]);
    exportToCSV("recruitment.csv", headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ["Sl. No", "Recruitment", "Abbreviation"];
    const rows = filteredRecruitments.map((recruitment, index) => [
      index + 1,
      recruitment.recruitment.toUpperCase(),
      recruitment.recruitment_abbr?.toUpperCase() || "",
    ]);
    exportToPDF("Recruitment", headers, rows, "recruitment.pdf");
  };

  const handleExportExcel = () => {
    const data = filteredRecruitments.map((recruitment, index) => ({
      "Sl. No": index + 1,
      "Recruitment Name": recruitment.recruitment.toUpperCase(),
      "Abbreviation": recruitment.recruitment_abbr?.toUpperCase() || "",
    }));
    exportToExcel("Recruitment", data, "recruitment.xlsx");
  };

  return (
    <>
      <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
            Recruitment List
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search Recruitment..."
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
                    <>View Active Recruitments</>
                  ) : (
                    <>View Deactivated Recruitments</>
                  )}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedRecruitment(null);
                    setModalOpen(true);
                  }}
                >
                  Add New Recruitment
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
                    Recruitment
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abbreviation
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecruitments.map((recruitment, index) => (
                  <tr
                    key={recruitment.recruitment_id}
                    className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {recruitment.recruitment.toUpperCase()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {recruitment.recruitment_abbr?.toUpperCase() || ""}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex justify-end space-x-2">
                        {recruitment.is_active && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-indigo-100 px-2.5 py-1.5 text-sm font-semibold text-grey"
                            onClick={() => {
                              setSelectedRecruitment(recruitment);
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
                              onClick={() => handleDeleteClick(recruitment.recruitment_id)}
                            >
                              <NoSymbolIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Deactivate Recruitment
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <button
                              type="button"
                              className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-green-600 hover:bg-green-100 hover:ring-0 px-2.5 py-1.5 text-sm font-semibold"
                              onClick={() => handleReactivateClick(recruitment.recruitment_id)}
                            >
                              <ArrowUturnLeftIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Activate Recruitment
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
        onConfirm={reactivateRecruitment}
        title={`Reactivate "${recruitmentToReactivate?.recruitment?.toUpperCase() || 'Recruitment'}"`}
        message={`Are you sure you want to reactivate "${recruitmentToReactivate?.recruitment?.toUpperCase() || 'this recruitment'}?"`}
        iconType="success"
        confirmText="Reactivate"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={confirmOpen}
        setIsOpen={setConfirmOpen}
        onConfirm={confirmDelete}
        title={`Deactivate "${recruitmentList.find((r) => r.recruitment_id === recruitmentToDelete)?.recruitment?.toUpperCase() || 'Recruitment'}"`}
        message={`Are you sure you want to deactivate "${recruitmentList.find((r) => r.recruitment_id === recruitmentToDelete)?.recruitment?.toUpperCase() || 'this recruitment'}?"`}
        iconType="delete"
        confirmText="Deactivate"
        cancelText="Cancel"
      />

      <ModalRecruitmentDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        save={handleAddOrUpdate}
        recruitment={selectedRecruitment}
      />
    </>
  );
}