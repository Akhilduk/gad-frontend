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
import { ModalLevelDetails } from "../modal/level-details";
import ConfirmModal from "../../../../components/confirmModal";
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from "../../../../components/dataTableControls";

export default function LevelList() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [levelList, setLevelList] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [levelToDelete, setLevelToDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [levelToReactivate, setLevelToReactivate] = useState(null);
  const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 25;

  const fetchLevels = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/masters/level-all`);
      console.log("Fetched levelList:", response.data.data.level);
      setLevelList(response.data.data.level || []);
    } catch (error) {
      console.error("Error fetching Levels:", error);
      toast.error("Failed to load levels.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddOrUpdate = async (LevelData) => {
    if (isLoading) {
      toast.error("Please wait until levels are loaded.");
      return;
    }

    try {
      const trimmedLevel = LevelData.level.trim().toLowerCase();
      console.log("Input level:", trimmedLevel);
      console.log("Current levelList:", levelList);

      // Check for existing level
      const existing = levelList.find(
        (lvl) => lvl.level.toLowerCase() === trimmedLevel
      );

      // Case: Level exists and is deactivated
      if (existing && !existing.is_active && !LevelData.level_id) {
        console.log("Found deactivated level:", existing);
        setLevelToReactivate(existing);
        setConfirmReactivateOpen(true);
        return;
      }

      // Case: Level exists and is active
      if (existing && existing.is_active && !LevelData.level_id) {
        toast.error(`Level "${LevelData.level.trim()}" already exists and is active.`);
        return;
      }

      // Case: Update or add new level
      let response;
      if (LevelData.level_id) {
        const { level_id, ...LevelDataWithoutId } = LevelData;
        response = await axiosInstance.put(
          `/masters/level/${level_id}`,
          { ...LevelDataWithoutId, level: LevelData.level.trim() }
        );
        toast.success("Level updated successfully");
      } else {
        response = await axiosInstance.post("/masters/level", {
          ...LevelData,
          level: LevelData.level.trim(),
        });
        toast.success("Level added successfully");
      }

      fetchLevels();
      setModalOpen(false);
      setSelectedLevel(null);
    } catch (error) {
      console.error("Error in handleAddOrUpdate:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";

      // Handle case where backend reports the level exists
      if (
        error.response?.status === 400 &&
        errorMessage.toLowerCase().includes("already exists")
      ) {
        await fetchLevels();
        const updatedExisting = levelList.find(
          (lvl) => lvl.level.toLowerCase() === trimmedLevel
        );
        if (updatedExisting && !updatedExisting.is_active) {
          console.log("Backend reported existing deactivated level:", updatedExisting);
          setLevelToReactivate(updatedExisting);
          setConfirmReactivateOpen(true);
          return;
        }
        toast.error(`Level "${LevelData.level.trim()}" already exists.`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteClick = (level_id) => {
    setLevelToDelete(level_id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const levelData = levelList.find((l) => l.level_id === levelToDelete);
      if (!levelData) {
        toast.error("Level data not found.");
        setConfirmOpen(false);
        return;
      }

      await axiosInstance.put(`/masters/level/${levelToDelete}`, {
        level: levelData.level,
        is_active: false,
      });
      fetchLevels();
      toast.success("Level deactivated successfully");
    } catch (error) {
      console.error("Error deactivating level:", error);
      toast.error("Failed to deactivate Level.");
    } finally {
      setLevelToDelete(null);
      setConfirmOpen(false);
    }
  };

  const reactivateLevel = async () => {
    if (!levelToReactivate) {
      toast.error("Level data not found.");
      setConfirmReactivateOpen(false);
      return;
    }

    try {
      await axiosInstance.put(`/masters/level/${levelToReactivate.level_id}`, {
        level: levelToReactivate.level,
        is_active: true,
      });
      fetchLevels();
      toast.success("Level reactivated successfully");
    } catch (error) {
      toast.error("Failed to reactivate Level.");
      console.error("Reactivation error:", error);
    } finally {
      setLevelToReactivate(null);
      setConfirmReactivateOpen(false);
    }
  };

  const handleReactivateClick = (level_id) => {
    const level = levelList.find((l) => l.level_id === level_id);
    console.log("Reactivating level:", level);
    setLevelToReactivate(level);
    setConfirmReactivateOpen(true);
  };

  const filteredLevels = levelList
    .filter((level) =>
      level.level.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((level) => level.is_active !== showDeactivated);

  const paginatedLevels = filteredLevels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLevels.length / itemsPerPage);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Sl. No", "Level"];
    const rows = filteredLevels.map((level, index) => [
      index + 1,
      level.level.toUpperCase(),
    ]);
    exportToCSV("level.csv", headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ["Sl. No", "Level"];
    const rows = filteredLevels.map((level, index) => [
      index + 1,
      level.level.toUpperCase(),
    ]);
    exportToPDF("Level", headers, rows, "level.pdf");
  };

  const handleExportExcel = () => {
    const data = filteredLevels.map((level, index) => ({
      "Sl. No": index + 1,
      "Level Name": level.level.toUpperCase(),
    }));
    exportToExcel("Level", data, "level.xlsx");
  };

  return (
    <>
      <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
            Level List
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search Level..."
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
                    <>View Active Levels</>
                  ) : (
                    <>View Deactivated Levels</>
                  )}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedLevel(null);
                    setModalOpen(true);
                  }}
                >
                  Add New Level
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
                    Level
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedLevels.map((level, index) => (
                  <tr
                    key={level.level_id}
                    className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {level.level.toUpperCase()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex justify-end space-x-2">
                        {level.is_active && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-indigo-100 px-2.5 py-1.5 text-sm font-semibold text-grey"
                            onClick={() => {
                              setSelectedLevel(level);
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
                              onClick={() => handleDeleteClick(level.level_id)}
                            >
                              <NoSymbolIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Deactivate Level
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <button
                              type="button"
                              className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-green-600 hover:bg-green-100 hover:ring-0 px-2.5 py-1.5 text-sm font-semibold"
                              onClick={() => handleReactivateClick(level.level_id)}
                            >
                              <ArrowUturnLeftIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Activate Level
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
        onConfirm={reactivateLevel}
        title={`Reactivate "${levelToReactivate?.level?.toUpperCase() || 'Level'}"`}
        message={`Are you sure you want to reactivate "${levelToReactivate?.level?.toUpperCase() || 'this level'}?"`}
        iconType="success"
        confirmText="Reactivate"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={confirmOpen}
        setIsOpen={setConfirmOpen}
        onConfirm={confirmDelete}
        title={`Deactivate "${levelList.find((l) => l.level_id === levelToDelete)?.level?.toUpperCase() || 'Level'}"`}
        message={`Are you sure you want to deactivate "${levelList.find((l) => l.level_id === levelToDelete)?.level?.toUpperCase() || 'this level'}?"`}
        iconType="delete"
        confirmText="Deactivate"
        cancelText="Cancel"
      />

      <ModalLevelDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        save={handleAddOrUpdate}
        level={selectedLevel}
      />
    </>
  );
}