"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import axiosInstance from "@/utils/apiClient";
import { toast } from "react-toastify";
import {
  TrashIcon,
  PencilSquareIcon,
  PlusIcon,
  NoSymbolIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/16/solid";
import { ModalCategoryDetails } from "../modal//category-details";
import ConfirmModal from "../../../../components/confirmModal";
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from "../../../../components/dataTableControls";

export default function CategoryList() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [categoryList, setCategoryList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeactivated, setShowDeactivated] = useState(false); // NEW
  const [categoryToActivate, setCategoryToActivate] = useState(null); // NEW
  const [confirmActivateOpen, setConfirmActivateOpen] = useState(false); // NEW

  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);
  const [categoryToReactivate, setCategoryToReactivate] = useState(null);
  const itemsPerPage = 25;

  const fetchCategory = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/masters/category-all`);
      setCategoryList(response.data.data.category);
    } catch (error) {
      console.error("Error fetching category:", error);
    }
  }, []);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  useEffect(() => {
    setCurrentPage(1); // reset to first page when search changes
  }, [searchTerm]);

  const handleAddOrUpdate = async (CategoryData) => {
    try {
      const existing = categoryList.find(
        (cat) =>
          cat.category.toLowerCase() === CategoryData.category.toLowerCase()
      );

      // Case: trying to add a deactivated category
      if (existing && !existing.is_active && !CategoryData.category_id) {
        setCategoryToReactivate(existing);
        setReactivateModalOpen(true);
        return;
      }

      if (CategoryData.category_id) {
        const { category_id, ...categoryDataWithoutId } = CategoryData;
        console.log("Category Data without ID:", categoryDataWithoutId);
        await axiosInstance.put(
          `/masters/category/${category_id}`,
          categoryDataWithoutId
        );
        toast.success("Category updated successfully");
      } else {
        await axiosInstance.post("/masters/category", CategoryData);
        toast.success("Category added successfully");
      }

      fetchCategory();
      setModalOpen(false);
      setSelectedCategory(null);
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleDeleteClick = (office_id) => {
    setCategoryToDelete(office_id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/masters/category/${categoryToDelete}`, {
        is_active: false,
      });
      toast.success("Category deactivated successfully!");
      fetchCategory();
    } catch (error) {
      console.error("Error deactivating Category:", error);
      toast.error("Failed to deactivate Category.");
    } finally {
      setCategoryToDelete(null);
      setConfirmOpen(false);
    }
  };

  // Activate the deactivated categories
  const activateCategory = async () => {
    const categoryData = categoryList.find(
      (c) => c.category_id === categoryToActivate
    );
    if (!categoryData) return toast.error("Category data not found.");

    try {
      await axiosInstance.put(`/masters/category/${categoryToActivate}`, {
        category: categoryData.category,
        category_abbr: categoryData.category_abbr,
        is_active: true,
      });
      fetchCategory();
      toast.success("Category activated successfully");
    } catch (error) {
      toast.error("Failed to activate Category.");
      console.error("Activation error:", error);
    } finally {
      setCategoryToActivate(null);
      setConfirmActivateOpen(false);
    }
  };

  const handleActivateClick = (category_id) => {
    setCategoryToActivate(category_id);
    setConfirmActivateOpen(true);
  };

  const filteredcategory = categoryList
    .filter(
      (category) =>
        category.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.category_abbr.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((category) => category.is_active !== showDeactivated); // Filter active/deactivated

  const paginatedCategory = filteredcategory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredcategory.length / itemsPerPage);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Sl. No", "Category", "Abbreviation"];
    const rows = filteredcategory.map((category, index) => [
      index + 1,
      category.category,
      category.category_abbr,
    ]);
    exportToCSV("category.csv", headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ["Sl. No", "Category", "Abbreviation"];
    const rows = filteredcategory.map((category, index) => [
      index + 1,
      category.category,
      category.category_abbr,
    ]);
    exportToPDF("Category", headers, rows, "category.pdf");
  };

  const handleExportExcel = () => {
    const data = filteredcategory.map((category, index) => ({
      "Sl. No": index + 1,
      "Category Name": category.category,
      Abbreviation: category.category_abbr,
    }));
    exportToExcel("Category", data, "category.xlsx");
  };

  return (
    <>
      <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
            Category List
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            {/* Search Input */}
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search Category..."
            />

            {/* Right Side: Buttons Block */}
            <div className="flex flex-col items-end gap-2">
              {/* Top Row: Toggle + Add New */}
              <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
                {/* Toggle Active / Deactivated */}
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
                    <>View Active Categories</>
                  ) : (
                    <>View Deactivated Categories</>
                  )}
                </button>

                {/* Add New category Button */}
                <button
                  type="button"
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
                  onClick={() => {
                    setSelectedCategory(null);
                    setModalOpen(true);
                  }}
                >
                  Add New Category
                  <PlusIcon aria-hidden="true" className="mr-0.5 size-5" />
                </button>
              </div>

              {/* Export Buttons */}
              <ExportButtons
                onCSV={handleExportCSV}
                onPDF={handleExportPDF}
                onExcel={handleExportExcel}
              />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-12xl">
          <table className="table-auto w-full text-left border-collapse">
            <thead className="text-gray-600 text-sm">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sl. No
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category Name
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Abbreviation
                </th>

                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider float-right ">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedCategory.map((category, index) => (
                <tr
                  key={category.category_id}
                  className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                >
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {category.category.toUpperCase()}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {category.category_abbr.toUpperCase()}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap flex justify-end text-sm text-gray-900">
                    <div className="flex justify-end space-x-2">
                      {category.is_active && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-indigo-100 px-2.5 py-1.5 text-sm font-semibold text-grey"
                          onClick={() => {
                            setSelectedCategory(category);
                            setModalOpen(true);
                          }}
                        >
                          <PencilSquareIcon
                            aria-hidden="true"
                            className="-mr-0.5 size-5 text-indigo-700"
                          />
                        </button>
                      )}

                      {/*  Show delete button only for active */}
                      {!showDeactivated ? (
                        // Show delete button if active
                        <div className="relative group">
                          <button
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-red-600 hover:bg-red-100  hover:ring-0 px-2.5 py-1.5 text-sm font-semibold"
                            onClick={() =>
                              handleDeleteClick(category.category_id)
                            }
                          >
                            <NoSymbolIcon className="-mr-0.5 size-5" />
                          </button>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                            Deactivate Category
                          </div>
                        </div>
                      ) : (
                        // Show activate button if deactivated
                        <div className="relative group">
                          <button
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-green-600 hover:bg-green-100 hover:ring-0 px-2.5 py-1.5 text-sm font-semibold"
                            onClick={() =>
                              handleActivateClick(category.category_id)
                            }
                          >
                            <ArrowUturnLeftIcon className="-mr-0.5 size-5" />
                          </button>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                            Activate Category
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

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPrevious={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          onNext={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
        />
      </div>

      <ConfirmModal
        isOpen={reactivateModalOpen}
        setIsOpen={setReactivateModalOpen}
        onConfirm={async () => {
          try {
            await axiosInstance.put(
              `/masters/category/${categoryToReactivate.category_id}`,
              {
                category: categoryToReactivate.category,
                category_abbr: categoryToReactivate.category_abbr,
                is_active: true,
              }
            );
            toast.success("Category reactivated successfully");
            fetchCategory();
          } catch (error) {
            toast.error("Failed to reactivate Category.");
          } finally {
            setCategoryToReactivate(null);
          }
        }}
        title="Reactivate Category"
        message={`The category "${categoryToReactivate?.category}" already exists but is deactivated. Would you like to reactivate it?`}
        iconType="success"
        confirmText="Reactivate"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={confirmOpen}
        setIsOpen={setConfirmOpen}
        onConfirm={confirmDelete}
        title="Deactivate Category"
        message="Are you sure you want to deactivate this Category?"
        iconType="delete"
        confirmText="Deactivate"
      />

      <ConfirmModal
        isOpen={confirmActivateOpen}
        setIsOpen={setConfirmActivateOpen}
        onConfirm={activateCategory}
        title="Activate Category"
        message="Are you sure you want to activate this Category?"
        iconType="success"
        confirmText="Activate"
      />

      <ModalCategoryDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        save={handleAddOrUpdate}
        category={selectedCategory}
      />
    </>
  );
}
