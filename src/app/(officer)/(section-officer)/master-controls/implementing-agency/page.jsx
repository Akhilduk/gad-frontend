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
import { ModalImplementingAgencyDetails } from "../modal/implementing-agency-details";
import ConfirmModal from "../../../../components/confirmModal";
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from "../../../../components/dataTableControls";

export default function ImplementingAgencyList() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [agencyList, setAgencyList] = useState([]);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [agencyToDelete, setAgencyToDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [agencyToReactivate, setAgencyToReactivate] = useState(null);
  const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 25;

  // Helper function to decode HTML entities
  function decodeHtml(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  }

  const fetchAgencies = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/masters/agency-all`);
      console.log("Fetched agencyList:", response.data.data);
      setAgencyList(response.data.data || []);
    } catch (error) {
      console.error("Error fetching Implementing Agencies:", error);
      toast.error("Failed to load implementing agencies.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddOrUpdate = async (AgencyData) => {
    if (isLoading) {
      toast.error("Please wait until implementing agencies are loaded.");
      return;
    }

    try {
      const trimmedAgency = decodeHtml(AgencyData.agency).trim().toLowerCase();
      console.log("Input agency:", trimmedAgency);
      console.log("Current agencyList:", agencyList);

      // Check for existing agency
      const existing = agencyList.find(
        (agency) => decodeHtml(agency.agency).toLowerCase() === trimmedAgency
      );

      // Case: Agency exists and is deactivated
      if (existing && !existing.is_active && !AgencyData.agency_id) {
        console.log("Found deactivated agency:", existing);
        setAgencyToReactivate(existing);
        setConfirmReactivateOpen(true);
        return;
      }

      // Case: Agency exists and is active
      if (existing && existing.is_active && !AgencyData.agency_id) {
        toast.error(`Agency "${decodeHtml(AgencyData.agency).trim()}" already exists and is active.`);
        return;
      }

      // Case: Update or add new agency
      let response;
      if (AgencyData.agency_id) {
        const { agency_id, ...AgencyDataWithoutId } = AgencyData;
        response = await axiosInstance.put(
          `/masters/agency/${agency_id}`,
          { ...AgencyDataWithoutId, agency: AgencyData.agency.trim() }
        );
        toast.success("Implementing Agency updated successfully");
      } else {
        response = await axiosInstance.post("/masters/agency", {
          ...AgencyData,
          agency: AgencyData.agency.trim(),
        });
        toast.success("Implementing Agency added successfully");
      }

      fetchAgencies();
      setModalOpen(false);
      setSelectedAgency(null);
    } catch (error) {
      console.error("Error in handleAddOrUpdate:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";

      // Handle case where backend reports the agency exists
      if (
        error.response?.status === 400 &&
        errorMessage.toLowerCase().includes("already exists")
      ) {
        await fetchAgencies();
        const updatedExisting = agencyList.find(
          (agency) => decodeHtml(agency.agency).toLowerCase() === trimmedAgency
        );
        if (updatedExisting && !updatedExisting.is_active) {
          console.log("Backend reported existing deactivated agency:", updatedExisting);
          setAgencyToReactivate(updatedExisting);
          setConfirmReactivateOpen(true);
          return;
        }
        toast.error(`Agency "${decodeHtml(AgencyData.agency).trim()}" already exists.`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteClick = (agency_id) => {
    setAgencyToDelete(agency_id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const agencyData = agencyList.find((a) => a.agency_id === agencyToDelete);
      if (!agencyData) {
        toast.error("Implementing Agency data not found.");
        setConfirmOpen(false);
        return;
      }

      await axiosInstance.put(`/masters/agency/${agencyToDelete}`, {
        agency: agencyData.agency,
        is_active: false,
      });
      fetchAgencies();
      toast.success("Implementing Agency deactivated successfully");
    } catch (error) {
      console.error("Error deactivating implementing agency:", error);
      toast.error("Failed to deactivate Implementing Agency.");
    } finally {
      setAgencyToDelete(null);
      setConfirmOpen(false);
    }
  };

  const reactivateAgency = async () => {
    if (!agencyToReactivate) {
      toast.error("Implementing Agency data not found.");
      setConfirmReactivateOpen(false);
      return;
    }

    try {
      await axiosInstance.put(`/masters/agency/${agencyToReactivate.agency_id}`, {
        agency: agencyToReactivate.agency,
        is_active: true,
      });
      fetchAgencies();
      toast.success("Implementing Agency reactivated successfully");
    } catch (error) {
      toast.error("Failed to reactivate Implementing Agency.");
      console.error("Reactivation error:", error);
    } finally {
      setAgencyToReactivate(null);
      setConfirmReactivateOpen(false);
    }
  };

  const handleReactivateClick = (agency_id) => {
    const agency = agencyList.find((a) => a.agency_id === agency_id);
    console.log("Reactivating agency:", agency);
    setAgencyToReactivate(agency);
    setConfirmReactivateOpen(true);
  };

  const filteredAgencies = agencyList
    .filter((agency) =>
      decodeHtml(agency.agency).toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((agency) => agency.is_active !== showDeactivated);

  const paginatedAgencies = filteredAgencies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAgencies.length / itemsPerPage);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Sl. No", "Implementing Agency"];
    const rows = filteredAgencies.map((agency, index) => [
      index + 1,
      decodeHtml(agency.agency),
    ]);
    exportToCSV("implementing-agency.csv", headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ["Sl. No", "Implementing Agency"];
    const rows = filteredAgencies.map((agency, index) => [
      index + 1,
      decodeHtml(agency.agency),
    ]);
    exportToPDF("Implementing Agency", headers, rows, "implementing-agency.pdf");
  };

  const handleExportExcel = () => {
    const data = filteredAgencies.map((agency, index) => ({
      "Sl. No": index + 1,
      "Implementing Agency Name": decodeHtml(agency.agency),
    }));
    exportToExcel("Implementing Agency", data, "implementing-agency.xlsx");
  };

  return (
    <>
      <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900">
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white mb-3 uppercase">
            Implementing Agency List
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search Implementing Agency..."
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
                    <>View Active Agencies</>
                  ) : (
                    <>View Deactivated Agencies</>
                  )}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedAgency(null);
                    setModalOpen(true);
                  }}
                >
                  Add New Agency
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
                    Implementing Agency
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedAgencies.map((agency, index) => (
                  <tr
                    key={agency.agency_id}
                    className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {decodeHtml(agency.agency).toUpperCase()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex justify-end space-x-2">
                        {agency.is_active && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-indigo-100 px-2.5 py-1.5 text-sm font-semibold text-grey"
                            onClick={() => {
                              setSelectedAgency(agency);
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
                              onClick={() => handleDeleteClick(agency.agency_id)}
                            >
                              <NoSymbolIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Deactivate Agency
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <button
                              type="button"
                              className="inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 text-green-600 hover:bg-green-100 hover:ring-0 px-2.5 py-1.5 text-sm font-semibold"
                              onClick={() => handleReactivateClick(agency.agency_id)}
                            >
                              <ArrowUturnLeftIcon className="-mr-0.5 size-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded shadow-lg">
                              Activate Agency
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
        onConfirm={reactivateAgency}
        title={`Reactivate "${agencyToReactivate?.agency ? decodeHtml(agencyToReactivate.agency).toUpperCase() : 'Agency'}"`}
        message={`Are you sure you want to reactivate "${agencyToReactivate?.agency ? decodeHtml(agencyToReactivate.agency).toUpperCase() : 'this agency'}?"`}
        iconType="success"
        confirmText="Reactivate"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={confirmOpen}
        setIsOpen={setConfirmOpen}
        onConfirm={confirmDelete}
        title={`Deactivate "${agencyList.find((a) => a.agency_id === agencyToDelete)?.agency ? decodeHtml(agencyList.find((a) => a.agency_id === agencyToDelete).agency).toUpperCase() : 'Agency'}"`}
        message={`Are you sure you want to deactivate "${agencyList.find((a) => a.agency_id === agencyToDelete)?.agency ? decodeHtml(agencyList.find((a) => a.agency_id === agencyToDelete).agency).toUpperCase() : 'this agency'}?"`}
        iconType="delete"
        confirmText="Deactivate"
        cancelText="Cancel"
      />

      <ModalImplementingAgencyDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        save={handleAddOrUpdate}
        agency={selectedAgency}
      />
    </>
  );
}