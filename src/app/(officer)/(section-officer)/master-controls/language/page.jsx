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
import { ModalLanguageDetails } from "../modal/language-details";
import ConfirmModal from "../../../../components/confirmModal";
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from "../../../../components/dataTableControls";

export default function LanguageList() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [languageList, setLanguageList] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [languageToDelete, setLanguageToDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [languageToReactivate, setLanguageToReactivate] = useState(null);
  const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Added loading state

  const itemsPerPage = 25;

  const fetchLanguage = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/masters/language-all`);
      console.log("Fetched languageList:", response.data.data.languages); // Debug log
      setLanguageList(response.data.data.languages);
    } catch (error) {
      console.error("Error fetching Language:", error);
      toast.error("Failed to load languages.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLanguage();
  }, [fetchLanguage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddOrUpdate = async (LanguageData) => {
    if (isLoading) {
      toast.error("Please wait until languages are loaded.");
      return;
    }

    try {
      const trimmedLanguage = LanguageData.language.trim().toLowerCase();
      console.log("Input language:", trimmedLanguage); // Debug log
      console.log("Current languageList:", languageList); // Debug log

      // Check for existing language
      const existing = languageList.find(
        (lang) => lang.language.toLowerCase() === trimmedLanguage
      );

      // Case: Language exists and is deactivated
      if (existing && !existing.is_active && !LanguageData.language_id) {
        console.log("Found deactivated language:", existing);
        setLanguageToReactivate(existing);
        setConfirmReactivateOpen(true);
        return;
      }

      // Case: Language exists and is active
      if (existing && existing.is_active && !LanguageData.language_id) {
        toast.error(`Language "${LanguageData.language.trim()}" already exists and is active.`);
        return;
      }

      // Case: Update or add new language
      let response;
      if (LanguageData.language_id) {
        const { language_id, ...LanguageDataWithoutId } = LanguageData;
        response = await axiosInstance.put(
          `/masters/language/${language_id}`,
          { ...LanguageDataWithoutId, language: LanguageData.language.trim() }
        );
        toast.success("Language updated successfully");
      } else {
        response = await axiosInstance.post("/masters/language", {
          ...LanguageData,
          language: LanguageData.language.trim(),
        });
        toast.success("Language added successfully");
      }

      fetchLanguage();
      setModalOpen(false);
      setSelectedLanguage(null);
    } catch (error) {
      console.error("Error in handleAddOrUpdate:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";

      // Handle case where backend reports the language exists
      if (
        error.response?.status === 400 &&
        errorMessage.toLowerCase().includes("already exists")
      ) {
        await fetchLanguage(); // Refresh languageList
        const updatedExisting = languageList.find(
          (lang) => lang.language.toLowerCase() === trimmedLanguage
        );
        if (updatedExisting && !updatedExisting.is_active) {
          console.log("Backend reported existing deactivated language:", updatedExisting);
          setLanguageToReactivate(updatedExisting);
          setConfirmReactivateOpen(true);
          return;
        }
        toast.error(`Language "${LanguageData.language.trim()}" already exists.`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteClick = (language_id) => {
    setLanguageToDelete(language_id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/masters/language/${languageToDelete}`, {
        data: { is_active: false },
      });
      fetchLanguage();
      toast.success("Language deactivated successfully");
    } catch (error) {
      console.error("Error deactivating language:", error);
      toast.error("Failed to deactivate Language.");
    } finally {
      setLanguageToDelete(null);
      setConfirmOpen(false);
    }
  };

  const reactivateLanguage = async () => {
    if (!languageToReactivate) {
      toast.error("Language data not found.");
      setConfirmReactivateOpen(false);
      return;
    }

    try {
      await axiosInstance.put(`/masters/language/${languageToReactivate.language_id}`, {
        language: languageToReactivate.language,
        is_active: true,
      });
      fetchLanguage();
      toast.success("Language reactivated successfully");
    } catch (error) {
      toast.error("Failed to reactivate Language.");
      console.error("Reactivation error:", error);
    } finally {
      setLanguageToReactivate(null);
      setConfirmReactivateOpen(false);
    }
  };

  const handleReactivateClick = (language_id) => {
    const language = languageList.find((l) => l.language_id === language_id);
    console.log("Reactivating language:", language); // Debug log
    setLanguageToReactivate(language);
    setConfirmReactivateOpen(true);
  };

  const filteredLanguage = languageList
    .filter((language) =>
      language.language.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((language) => language.is_active !== showDeactivated);

  const paginatedLanguage = filteredLanguage.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLanguage.length / itemsPerPage);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Sl. No", "Language"];
    const rows = filteredLanguage.map((language, index) => [
      index + 1,
      language.language.toUpperCase(),
    ]);
    exportToCSV("language.csv", headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ["Sl. No", "Language"];
    const rows = filteredLanguage.map((language, index) => [
      index + 1,
      language.language.toUpperCase(),
    ]);
    exportToPDF("Language", headers, rows, "language.pdf");
  };

  const handleExportExcel = () => {
    const data = filteredLanguage.map((language, index) => ({
      "Sl. No": index + 1,
      "Language": language.language.toUpperCase(),
    }));
    exportToExcel("Language", data, "language.xlsx");
  };

  return (
    <>
      <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
            Language List
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search Language..."
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
                    <>View Active Languages</>
                  ) : (
                    <>View Deactivated Languages</>
                  )}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedLanguage(null);
                    setModalOpen(true);
                  }}
                >
                  Add New Language
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
                    Language
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider float-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedLanguage.map((language, index) => (
                  <tr
                    key={language.language_id}
                    className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {language.language.toUpperCase()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex justify-end space-x-2">
                        {language.is_active && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-indigo-100 px-2.5 py-1.5 text-sm font-semibold text-grey"
                            onClick={() => {
                              setSelectedLanguage(language);
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
                              onClick={() => handleDeleteClick(language.language_id)}
                            >
                              <NoSymbolIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Deactivate Language
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <button
                              type="button"
                              className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-green-600 hover:bg-green-100 hover:ring-0 px-2.5 py-1.5 text-sm font-semibold"
                              onClick={() => handleReactivateClick(language.language_id)}
                            >
                              <ArrowUturnLeftIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Activate Language
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
        onConfirm={reactivateLanguage}
        title={`Reactivate "${languageToReactivate?.language?.toUpperCase() || 'Language'}"`}
        message={`Are you sure you want to reactivate "${languageToReactivate?.language?.toUpperCase() || 'this language'}?"`}
        iconType="success"
        confirmText="Reactivate"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={confirmOpen}
        setIsOpen={setConfirmOpen}
        onConfirm={confirmDelete}
        title={`Deactivate "${languageList.find((l) => l.language_id === languageToDelete)?.language?.toUpperCase() || 'Language'}"`}
        message={`Are you sure you want to deactivate "${languageList.find((l) => l.language_id === languageToDelete)?.language?.toUpperCase() || 'this language'}?"`}
        iconType="delete"
        confirmText="Deactivate"
        cancelText="Cancel"
      />

      <ModalLanguageDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        save={handleAddOrUpdate}
        language={selectedLanguage}
      />
    </>
  );
}