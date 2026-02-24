'use client'

import PropTypes from 'prop-types'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import axiosInstance from '@/utils/apiClient'

export function ModalPdfDownload({ open = false, setOpen, userDetails }) {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
  };

  const pdfGenerator = async (selectedLang) => {
    setIsDownloading(true); // Set loading state
    if (userDetails) {
      console.log("Transformed User Details:", userDetails);
      try {
        const response = await axiosInstance.post(
          "/file-uploader/generate-pdf", {
          user_data_json: userDetails,
          lang: selectedLang
        }, { headers: { 'Content-Type': 'application/json' } }
        );
        // console.log("PDF Generation Response:", response);
        handleDownloadPDF(response.data.data.download_url);
      }
      catch (error) {
        console.error("Error generating PDF on server:", error);
      }
      finally {
        setIsDownloading(false); // Reset loading state
        setOpen(false); // Close the modal
      }
    }
  };

  const handleDownloadPDF = async (pdfDownloadLink) => {
    if (!pdfDownloadLink) {
      alert("PDF link is not available.");
      setOpen(false); // Close the modal
      return;
    }

    try {
      console.log("Downloading PDF from:", pdfDownloadLink);
      const response = await axiosInstance.get(
        `/file-uploader${pdfDownloadLink}`,
        { responseType: "blob" } // important!
      );

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", pdfDownloadLink.split('/').pop() || "document.pdf"); // or any other extension
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please try again.");
    }
    finally {
      setIsDownloading(false); // Reset loading state
      setOpen(false); // Close the modal
    }
  };

  return (
    <Dialog open={open} onClose={() => { if (!isDownloading) setOpen(false) }} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/30" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto w-full max-w-md rounded bg-white p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Select PDF Language</h2>
            <button
              onClick={() => { if (!isDownloading) setOpen(false) }}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Language:
            </label>
            <select
              value={selectedLanguage}
              onChange={handleLanguageChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-indigo-300"
            >
              <option value="en">English</option>
              <option value="ml">മലയാളം</option>
            </select>
          </div>

          {isDownloading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-indigo-700"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Downloading...
            </>
          ) : (
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => pdfGenerator(selectedLanguage)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                <>
                  <ArrowDownTrayIcon className="w-5 h-5" strokeWidth={2} />
                  Download PDF
                </>
              </button>
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}

ModalPdfDownload.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
}
