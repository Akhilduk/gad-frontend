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
import { ModalPostingTypeDetails } from "../modal/posting-type-details";
import ConfirmModal from "../../../../components/confirmModal";
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from "../../../../components/dataTableControls";

export default function PostingTypeList() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [postingTypeList, setPostingTypeList] = useState([]);
  const [selectedPostingType, setSelectedPostingType] = useState(null);
  const [postingTypeToDelete, setPostingTypeToDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [postingTypeToReactivate, setPostingTypeToReactivate] = useState(null);
  const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 25;

  const fetchPostingType = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/masters/posting_type-all`);
      console.log("Fetched postingTypeList:", response.data.data.posting_type);
      setPostingTypeList(response.data.data.posting_type);
    } catch (error) {
      console.error("Error fetching Posting Type:", error);
      toast.error("Failed to load posting types.");
    } finally {
      setIsLoading(false);
    }
  }, []);



  useEffect(() => {
    fetchPostingType();
  }, [fetchPostingType]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

const handleAddOrUpdate = async (PostingTypeData) => {
  if (isLoading) {
    toast.error("Please wait until posting types are loaded.");
    return;
  }

  // ✅ Declare before try so it's in scope everywhere
  const trimmedPostingType = PostingTypeData.posting_types
    ? PostingTypeData.posting_types.trim().toLowerCase()
    : "";

  try {
    console.log("Input posting type:", trimmedPostingType);
    console.log("Current postingTypeList:", postingTypeList);

      // Check for existing posting type
      const existing = postingTypeList.find(
        (type) => type.posting_types.toLowerCase() === trimmedPostingType
      );

      // Case: Posting type exists and is deactivated
      if (existing && !existing.is_active && !PostingTypeData.posting_type_id) {
        console.log("Found deactivated posting type:", existing);
        setPostingTypeToReactivate(existing);
        setConfirmReactivateOpen(true);
        return;
      }

      // Case: Posting type exists and is active
      if (existing && existing.is_active && !PostingTypeData.posting_type_id) {
        toast.error(`Posting Type "${PostingTypeData.posting_types.trim()}" already exists and is active.`);
        return;
      }

      // Case: Update or add new posting type
      let response;
      if (PostingTypeData.posting_type_id) {
        const { posting_type_id, ...PostingTypeDataWithoutId } = PostingTypeData;
        response = await axiosInstance.put(
          `/masters/posting_type/${posting_type_id}`,
          { ...PostingTypeDataWithoutId, posting_types: PostingTypeData.posting_types.trim() }
        );
        toast.success("Posting Type updated successfully");
      } else {
        response = await axiosInstance.post("/masters/posting_type", {
          ...PostingTypeData,
          posting_types: PostingTypeData.posting_types.trim(),
        });
        toast.success("Posting Type added successfully");
      }

      fetchPostingType();
      setModalOpen(false);
      setSelectedPostingType(null);
    } catch (error) {
      console.error("Error in handleAddOrUpdate:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";

      // Handle case where backend reports the posting type exists
      if (
        error.response?.status === 400 &&
        errorMessage.toLowerCase().includes("already exists")
      ) {
        await fetchPostingType();
        const updatedExisting = postingTypeList.find(
          (type) => type.posting_types.toLowerCase() === trimmedPostingType
        );
        if (updatedExisting && !updatedExisting.is_active) {
          console.log("Backend reported existing deactivated posting type:", updatedExisting);
          setPostingTypeToReactivate(updatedExisting);
          setConfirmReactivateOpen(true);
          return;
        }
        toast.error(`Posting Type "${PostingTypeData.posting_types.trim()}" already exists.`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteClick = (posting_type_id) => {
    setPostingTypeToDelete(posting_type_id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const postingTypeData = postingTypeList.find((p) => p.posting_type_id === postingTypeToDelete);
      if (!postingTypeData) {
        toast.error("Posting Type data not found.");
        setConfirmOpen(false);
        return;
      }

      await axiosInstance.put(`/masters/posting_type/${postingTypeToDelete}`, {
        posting_types: postingTypeData.posting_types,
        is_active: false,
      });
      fetchPostingType();
      toast.success("Posting Type deactivated successfully");
    } catch (error) {
      console.error("Error deactivating posting type:", error);
      toast.error("Failed to deactivate Posting Type.");
    } finally {
      setPostingTypeToDelete(null);
      setConfirmOpen(false);
    }
  };

  const reactivatePostingType = async () => {
    if (!postingTypeToReactivate) {
      toast.error("Posting Type data not found.");
      setConfirmReactivateOpen(false);
      return;
    }

    try {
      await axiosInstance.put(`/masters/posting_type/${postingTypeToReactivate.posting_type_id}`, {
        posting_types: postingTypeToReactivate.posting_types,
        is_active: true,
      });
      fetchPostingType();
      toast.success("Posting Type reactivated successfully");
    } catch (error) {
      toast.error("Failed to reactivate Posting Type.");
      console.error("Reactivation error:", error);
    } finally {
      setPostingTypeToReactivate(null);
      setConfirmReactivateOpen(false);
    }
  };

  const handleReactivateClick = (posting_type_id) => {
    const postingType = postingTypeList.find((p) => p.posting_type_id === posting_type_id);
    console.log("Reactivating posting type:", postingType);
    setPostingTypeToReactivate(postingType);
    setConfirmReactivateOpen(true);
  };

const filteredPostingType = postingTypeList
  .filter((postingType) =>
    (postingType.posting_types || "").toLowerCase().includes(searchTerm.toLowerCase())
  )
  .filter((postingType) => postingType.is_active !== showDeactivated);


  const paginatedPostingType = filteredPostingType.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredPostingType.length / itemsPerPage);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Sl. No", "Posting Type"];
    const rows = filteredPostingType.map((postingType, index) => [
      index + 1,
      postingType.posting_types.toUpperCase(),
    ]);
    exportToCSV("posting-type.csv", headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ["Sl. No", "Posting Type"];
    const rows = filteredPostingType.map((postingType, index) => [
      index + 1,
      postingType.posting_types.toUpperCase(),
    ]);
    exportToPDF("Posting Type", headers, rows, "posting-type.pdf");
  };

  const handleExportExcel = () => {
    const data = filteredPostingType.map((postingType, index) => ({
      "Sl. No": index + 1,
      "Posting Type Name": postingType.posting_types.toUpperCase(),
    }));
    exportToExcel("Posting Type", data, "posting-type.xlsx");
  };

  return (
    <>
      <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
            Posting Type List
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search Posting Type..."
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
                    <>View Active Posting Types</>
                  ) : (
                    <>View Deactivated Posting Types</>
                  )}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedPostingType(null);
                    setModalOpen(true);
                  }}
                >
                  Add New Posting Type
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
                    Posting Type
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider float-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedPostingType.map((postingType, index) => (
                  <tr
                    key={postingType.posting_type_id}
                    className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                   <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {(postingType.posting_types || "").toUpperCase()}
                      </td>

                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex justify-end space-x-2">
                        {postingType.is_active && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-indigo-100 px-2.5 py-1.5 text-sm font-semibold text-grey"
                            onClick={() => {
                              setSelectedPostingType(postingType);
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
                              onClick={() => handleDeleteClick(postingType.posting_type_id)}
                            >
                              <NoSymbolIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Deactivate Posting Type
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <button
                              type="button"
                              className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-green-600 hover:bg-green-100 hover:ring-0 px-2.5 py-1.5 text-sm font-semibold"
                              onClick={() => handleReactivateClick(postingType.posting_type_id)}
                            >
                              <ArrowUturnLeftIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Activate Posting Type
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
        onConfirm={reactivatePostingType}
        title={`Reactivate "${postingTypeToReactivate?.posting_types?.toUpperCase() || 'Posting Type'}"`}
        message={`Are you sure you want to reactivate "${postingTypeToReactivate?.posting_types?.toUpperCase() || 'this posting type'}?"`}
        iconType="success"
        confirmText="Reactivate"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={confirmOpen}
        setIsOpen={setConfirmOpen}
        onConfirm={confirmDelete}
        title={`Deactivate "${postingTypeList.find((p) => p.posting_type_id === postingTypeToDelete)?.posting_types?.toUpperCase() || 'Posting Type'}"`}
        message={`Are you sure you want to deactivate "${postingTypeList.find((p) => p.posting_type_id === postingTypeToDelete)?.posting_types?.toUpperCase() || 'this posting type'}?"`}
        iconType="delete"
        confirmText="Deactivate"
        cancelText="Cancel"
      />

      <ModalPostingTypeDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        save={handleAddOrUpdate}
        posting_type={selectedPostingType}
      />
    </>
  );
}