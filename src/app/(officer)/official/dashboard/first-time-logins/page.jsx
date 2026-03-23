"use client";

import { useState, useEffect, useMemo } from "react";
import axiosInstance from "@/utils/apiClient";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { extractErrorMessage, getErrorMessage } from "@/utils/serviceTypeUtils";
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from "@/app/components/dataTableControls";

// Service type mapping
const serviceTypeMap = {
  1: "IAS",
  2: "IPS",
  3: "IFS",
};

export default function FirstTimeLoginsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const itemsPerPage = 50;

  // Fetch officers
  const fetchData = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await axiosInstance.get("/as-II/first-login-completed");
      setData(response.data.data.officers || []);
    } catch (error) {
      console.error("Error fetching officers:", error);
      const status = error.response?.status;
    const backendMessage = extractErrorMessage(error);

    const message = getErrorMessage(status, backendMessage);

    setErrorMessage(message);
    setData([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchData();
  }, []);

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Search filtering
  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return data.filter((item) => {
      const serviceType = serviceTypeMap[item.service_type_id] ?? "";

      return `${item.name ?? ""} ${item.pen_number ?? ""} ${item.email ?? ""} ${
        item.mobile_no ?? ""
      } ${serviceType}`
        .toLowerCase()
        .includes(q);
    });
  }, [searchTerm, data]);

  // Pagination
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;

  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Sl. No",
      "Name",
      "PEN",
      "Email",
      "Mobile",
      "Service Type",
    ];

    const rows = filteredData.map((item, idx) => [
      idx + 1,
      item.name ?? "",
      item.pen_number ?? "",
      item.email ?? "",
      item.mobile_no ?? "",
      serviceTypeMap[item.service_type_id] ?? "Unknown",
    ]);

    exportToCSV("first-login-completed.csv", headers, rows);
  };

  // Export PDF
  const handleExportPDF = () => {
    const headers = [
      "Sl. No",
      "Name",
      "PEN",
      "Email",
      "Mobile",
      "Service Type",
    ];

    const rows = filteredData.map((item, idx) => [
      idx + 1,
      item.name ?? "",
      item.pen_number ?? "",
      item.email ?? "",
      item.mobile_no ?? "",
      serviceTypeMap[item.service_type_id] ?? "Unknown",
    ]);

    exportToPDF(
      "First Login Completed Officers",
      headers,
      rows,
      "first-login-completed.pdf"
    );
  };

  // Export Excel
  const handleExportExcel = () => {
    const excelData = filteredData.map((item, idx) => ({
      "Sl. No": idx + 1,
      Name: item.name ?? "",
      PEN: item.pen_number ?? "",
      Email: item.email ?? "",
      Mobile: item.mobile_no ?? "",
      "Service Type": serviceTypeMap[item.service_type_id] ?? "Unknown",
    }));

    exportToExcel(
      "First Login Completed Officers",
      excelData,
      "first-login-completed.xlsx"
    );
  };

  return (
    <div className="bg-white p-3 pt-0 rounded-xl border mb-3 dark:bg-gray-800 dark:border-gray-900">

      <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900 flex justify-between items-center">

        <div>
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 bg-white border border-indigo-300 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                    >
                      <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.5} />
                      Back
                    </button>
          <h3 className="text-base font-semibold text-indigo-700 dark:text-white pt-5 uppercase">
            Login Activated Officers
          </h3>

          <div className="mt-5">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by Name / PEN / Email / Mobile / Service Type"
            />
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <ExportButtons
            onCSV={handleExportCSV}
            onPDF={handleExportPDF}
            onExcel={handleExportExcel}
          />
        </div>

      </div>

      {loading ? (
        <div className="text-center py-6 text-gray-600 dark:text-gray-200">
          Loading officers...
        </div>
      ) : (
        <div className="mx-auto w-full overflow-x-auto">
        {errorMessage && (
      <div className="text-red-600 text-center py-3 font-medium">
       {errorMessage}
      </div>
         )}

          <table className="table-auto w-full text-left border-collapse">

            <thead className="text-gray-600 text-sm">
              <tr>
                <th className="px-3 py-3 text-xs font-medium uppercase">
                  Sl. No
                </th>
                <th className="px-3 py-3 text-xs font-medium uppercase">
                  Name
                </th>
                <th className="px-3 py-3 text-xs font-medium uppercase">
                  PEN
                </th>
                <th className="px-3 py-3 text-xs font-medium uppercase">
                  Email
                </th>
                <th className="px-3 py-3 text-xs font-medium uppercase">
                  Mobile
                </th>
                <th className="px-3 py-3 text-xs font-medium uppercase">
                  Service Type
                </th>
              </tr>
            </thead>

            <tbody>

              {currentItems.map((item, index) => (
                <tr
                  key={item.pen_number}
                  className="odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700"
                >

                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                    {indexOfFirst + index + 1}
                  </td>

                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                    {item.name}
                  </td>

                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                    {item.pen_number}
                  </td>

                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                    {item.email}
                  </td>

                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                    {item.mobile_no}
                  </td>

                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                    {serviceTypeMap[item.service_type_id] ?? "Unknown"}
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
        onPrevious={() =>
          setCurrentPage((prev) => Math.max(prev - 1, 1))
        }
        onNext={() =>
          setCurrentPage((prev) => Math.min(prev + 1, totalPages))
        }
      />

    </div>
  );
}