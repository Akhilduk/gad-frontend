"use client";

import { useState, useEffect, useMemo } from "react";
import { PlusIcon } from "@heroicons/react/16/solid";
import moment from "moment"; // Added for date formatting
import axiosInstance from "@/utils/apiClient";
import { ModalOfficialDetails } from "./modal/official-details";
import Link from "next/link";
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from "../../components/dataTableControls";

// Service type mapping for display
const serviceTypeMap = {
  1: "IAS",
  2: "IPS",
  3: "IFS",
};

export default function OfficialManagementPage() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [officerData, setOfficerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/as-II/officers");
      setOfficerData(response.data.data || []);
    } catch (error) {
      console.error(
        "Error fetching officer data:",
        error.response?.data || error.detail
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filter by PEN, Email, Mobile, DOB, Service Type
  const filteredOfficers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return officerData.filter((officer) =>
      `${officer.pen_number ?? ""} ${officer.email ?? ""} ${
        officer.mobile_no ?? ""
      } ${officer.dob ?? ""} ${serviceTypeMap[officer.service_type_id] ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [searchTerm, officerData]);

  // Pagination
  const indexOfLastOfficer = currentPage * itemsPerPage;
  const indexOfFirstOfficer = indexOfLastOfficer - itemsPerPage;
  const currentOfficers = filteredOfficers.slice(
    indexOfFirstOfficer,
    indexOfLastOfficer
  );
  const totalPages = Math.ceil(filteredOfficers.length / itemsPerPage);

  // Updated date formatting using moment.js
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const m = moment(dateStr); // moment can parse YYYY-MM-DD directly
    return m.isValid() ? m.format("DD-MM-YYYY") : "";
  };

  // Export handlers
  const handleExportCSV = () => {
    const headers = [
      "Sl. No",
      "PEN",
      "Email ID",
      "Mobile Number",
      "Date of Birth",
      "Service Type",
    ];
    const rows = filteredOfficers.map((officer, index) => [
      index + 1,
      officer.pen_number ?? "",
      officer.email ?? "",
      officer.mobile_no ?? "",
      formatDate(officer.dob),
      serviceTypeMap[officer.service_type_id] ?? "Unknown",
    ]);
    exportToCSV("officer-list.csv", headers, rows);
  };

  const handleExportPDF = () => {
    const headers = [
      "Sl. No",
      "PEN",
      "Email ID",
      "Mobile Number",
      "Date of Birth",
      "Service Type",
    ];
    const rows = filteredOfficers.map((officer, index) => [
      index + 1,
      officer.pen_number ?? "",
      officer.email ?? "",
      officer.mobile_no ?? "",
      formatDate(officer.dob),
      serviceTypeMap[officer.service_type_id] ?? "Unknown",
    ]);
    exportToPDF("Officer List", headers, rows, "officer-list.pdf");
  };

  const handleExportExcel = () => {
    const data = filteredOfficers.map((officer, index) => ({
      "Sl. No": index + 1,
      "PEN": officer.pen_number ?? "",
      "Email ID": officer.email ?? "",
      "Mobile Number": officer.mobile_no ?? "",
      "Date of Birth": formatDate(officer.dob),
      "Service Type": serviceTypeMap[officer.service_type_id] ?? "Unknown",
    }));
    exportToExcel("Officer List", data, "officer-list.xlsx");
  };

  const handleAddClick = () => {
    setSelectedOfficer(null);
    setModalOpen(true);
  };

  const handleEditClick = (officer) => {
    sessionStorage.setItem("OfficerUserId", officer.user_id);
    setSelectedOfficer({
      ...officer,
      service_type: serviceTypeMap[officer.service_type_id] || "", // Map ID to name for modal
    });
  };

  const handleSave = () => {
    fetchOfficers();
  };

  return (
    <div className="bg-white p-3 pt-0 rounded-xl border mb-3 dark:bg-gray-800 dark:border-gray-900">
      <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900 flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white uppercase">
            Officer List
          </h3>
          {/* Search */}
          <div className="mt-5">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by PEN / Email / Mobile / DOB / Service Type"
            />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-700 px-2.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
            onClick={handleAddClick}
            disabled={loading}
          >
            Add New Officer{" "}
            <PlusIcon aria-hidden="true" className="-mr-0.5 size-5" />
          </button>

          <ExportButtons
            onCSV={handleExportCSV}
            onPDF={handleExportPDF}
            onExcel={handleExportExcel}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-4">Loading officer list...</div>
      ) : (
        <div className="mx-auto w-full overflow-x-auto">
          <table className="table-auto w-full text-left border-collapse">
            <thead className="text-gray-600 text-sm">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sl. No
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PEN
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email ID
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mobile Number
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date of Birth
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Type
                </th>
              </tr>
            </thead>
            <tbody>
              {currentOfficers.map((officer, index) => (
                <tr
                  key={index}
                  className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                >
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                    {indexOfFirstOfficer + index + 1}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                    {officer.pen_number}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                    {officer.email}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                    {officer.mobile_no}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                    {formatDate(officer.dob)}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                    {serviceTypeMap[officer.service_type_id] ?? "Unknown"}
                  </td>
                  {/*  */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevious={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        onNext={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
      />

      <ModalOfficialDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        officer={selectedOfficer}
        onSave={handleSave}
      />
    </div>
  );
}