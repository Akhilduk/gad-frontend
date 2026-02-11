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
import { ModalAdministrativeDepartmentDetails } from "../modal/administrative-department-details";
import ConfirmModal from "../../../../components/confirmModal";
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from "../../../../components/dataTableControls";

export default function AdministrativeDepartmentList() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [departmentList, setDepartmentList] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [departmentToReactivate, setDepartmentToReactivate] = useState(null);
  const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 25;

  // Helper function to decode HTML entities
  function decodeHtml(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  }

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/masters/administrative_department-all`);
      console.log("Fetched departmentList:", response.data.data.departments);
      setDepartmentList(response.data.data.departments);
    } catch (error) {
      console.error("Error fetching Administrative Departments:", error);
      toast.error("Failed to load administrative departments.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddOrUpdate = async (DepartmentData) => {
    if (isLoading) {
      toast.error("Please wait until administrative departments are loaded.");
      return;
    }

    try {
      const trimmedDepartment = decodeHtml(DepartmentData.administrative_department).trim().toLowerCase();
      console.log("Input department:", trimmedDepartment);
      console.log("Current departmentList:", departmentList);

      // Check for existing department
      const existing = departmentList.find(
        (dept) => decodeHtml(dept.administrative_department).toLowerCase() === trimmedDepartment
      );

      // Case: Department exists and is deactivated
      if (existing && !existing.is_active && !DepartmentData.administrative_department_id) {
        console.log("Found deactivated department:", existing);
        setDepartmentToReactivate(existing);
        setConfirmReactivateOpen(true);
        return;
      }

      // Case: Department exists and is active
      if (existing && existing.is_active && !DepartmentData.administrative_department_id) {
        toast.error(`Department "${decodeHtml(DepartmentData.administrative_department).trim()}" already exists and is active.`);
        return;
      }

      // Case: Update or add new department
      let response;
      if (DepartmentData.administrative_department_id) {
        const { administrative_department_id, ...DepartmentDataWithoutId } = DepartmentData;
        response = await axiosInstance.put(
          `/masters/administrative_department/${administrative_department_id}`,
          { ...DepartmentDataWithoutId, administrative_department: DepartmentData.administrative_department.trim() }
        );
        toast.success("Administrative Department updated successfully");
      } else {
        response = await axiosInstance.post("/masters/administrative_department", {
          ...DepartmentData,
          administrative_department: DepartmentData.administrative_department.trim(),
        });
        toast.success("Administrative Department added successfully");
      }

      fetchDepartments();
      setModalOpen(false);
      setSelectedDepartment(null);
    } catch (error) {
      console.error("Error in handleAddOrUpdate:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";

      // Handle case where backend reports the department exists
      if (
        error.response?.status === 400 &&
        errorMessage.toLowerCase().includes("already exists")
      ) {
        await fetchDepartments();
        const updatedExisting = departmentList.find(
          (dept) => decodeHtml(dept.administrative_department).toLowerCase() === trimmedDepartment
        );
        if (updatedExisting && !updatedExisting.is_active) {
          console.log("Backend reported existing deactivated department:", updatedExisting);
          setDepartmentToReactivate(updatedExisting);
          setConfirmReactivateOpen(true);
          return;
        }
        toast.error(`Department "${decodeHtml(DepartmentData.administrative_department).trim()}" already exists.`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteClick = (administrative_department_id) => {
    setDepartmentToDelete(administrative_department_id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const departmentData = departmentList.find((d) => d.administrative_department_id === departmentToDelete);
      if (!departmentData) {
        toast.error("Administrative Department data not found.");
        setConfirmOpen(false);
        return;
      }

      await axiosInstance.put(`/masters/administrative_department/${departmentToDelete}`, {
        administrative_department: departmentData.administrative_department,
        is_active: false,
      });
      fetchDepartments();
      toast.success("Administrative Department deactivated successfully");
    } catch (error) {
      console.error("Error deactivating administrative department:", error);
      toast.error("Failed to deactivate Administrative Department.");
    } finally {
      setDepartmentToDelete(null);
      setConfirmOpen(false);
    }
  };

  const reactivateDepartment = async () => {
    if (!departmentToReactivate) {
      toast.error("Administrative Department data not found.");
      setConfirmReactivateOpen(false);
      return;
    }

    try {
      await axiosInstance.put(`/masters/administrative_department/${departmentToReactivate.administrative_department_id}`, {
        administrative_department: departmentToReactivate.administrative_department,
        is_active: true,
      });
      fetchDepartments();
      toast.success("Administrative Department reactivated successfully");
    } catch (error) {
      toast.error("Failed to reactivate Administrative Department.");
      console.error("Reactivation error:", error);
    } finally {
      setDepartmentToReactivate(null);
      setConfirmReactivateOpen(false);
    }
  };

  const handleReactivateClick = (administrative_department_id) => {
    const department = departmentList.find((d) => d.administrative_department_id === administrative_department_id);
    console.log("Reactivating department:", department);
    setDepartmentToReactivate(department);
    setConfirmReactivateOpen(true);
  };

  const filteredDepartments = departmentList
    .filter((department) =>
      decodeHtml(department.administrative_department).toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((department) => department.is_active !== showDeactivated);

  const paginatedDepartments = filteredDepartments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Sl. No", "Administrative Department"];
    const rows = filteredDepartments.map((department, index) => [
      index + 1,
      decodeHtml(department.administrative_department),
    ]);
    exportToCSV("administrative_department.csv", headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ["Sl. No", "Administrative Department"];
    const rows = filteredDepartments.map((department, index) => [
      index + 1,
      decodeHtml(department.administrative_department),
    ]);
    exportToPDF("Administrative Department", headers, rows, "administrative_department.pdf");
  };

  const handleExportExcel = () => {
    const data = filteredDepartments.map((department, index) => ({
      "Sl. No": index + 1,
      "Administrative Department Name": decodeHtml(department.administrative_department),
    }));
    exportToExcel("Administrative Department", data, "administrative_department.xlsx");
  };

  return (
    <>
      <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
            Administrative Department List
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search Administrative Department..."
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
                    <>View Active Departments</>
                  ) : (
                    <>View Deactivated Departments</>
                  )}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedDepartment(null);
                    setModalOpen(true);
                  }}
                >
                  Add New Department
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
                    Administrative Department
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedDepartments.map((department, index) => (
                  <tr
                    key={department.administrative_department_id}
                    className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {decodeHtml(department.administrative_department).toUpperCase()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex justify-end space-x-2">
                        {department.is_active && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-indigo-100 px-2.5 py-1.5 text-sm font-semibold text-grey"
                            onClick={() => {
                              setSelectedDepartment(department);
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
                              onClick={() => handleDeleteClick(department.administrative_department_id)}
                            >
                              <NoSymbolIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Deactivate Department
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <button
                              type="button"
                              className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-green-600 hover:bg-green-100 hover:ring-0 px-2.5 py-1.5 text-sm font-semibold"
                              onClick={() => handleReactivateClick(department.administrative_department_id)}
                            >
                              <ArrowUturnLeftIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Activate Department
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
        onConfirm={reactivateDepartment}
        title={`Reactivate "${departmentToReactivate?.administrative_department ? decodeHtml(departmentToReactivate.administrative_department).toUpperCase() : 'Department'}"`}
        message={`Are you sure you want to reactivate "${departmentToReactivate?.administrative_department ? decodeHtml(departmentToReactivate.administrative_department).toUpperCase() : 'this department'}?"`}
        iconType="success"
        confirmText="Reactivate"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={confirmOpen}
        setIsOpen={setConfirmOpen}
        onConfirm={confirmDelete}
        title={`Deactivate "${departmentList.find((d) => d.administrative_department_id === departmentToDelete)?.administrative_department ? decodeHtml(departmentList.find((d) => d.administrative_department_id === departmentToDelete).administrative_department).toUpperCase() : 'Department'}"`}
        message={`Are you sure you want to deactivate "${departmentList.find((d) => d.administrative_department_id === departmentToDelete)?.administrative_department ? decodeHtml(departmentList.find((d) => d.administrative_department_id === departmentToDelete).administrative_department).toUpperCase() : 'this department'}?"`}
        iconType="delete"
        confirmText="Deactivate"
        cancelText="Cancel"
      />

      <ModalAdministrativeDepartmentDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        save={handleAddOrUpdate}
        department={selectedDepartment}
      />
    </>
  );
}