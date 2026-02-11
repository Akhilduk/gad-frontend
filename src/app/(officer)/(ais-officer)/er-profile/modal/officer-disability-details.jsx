"use client";

import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { BoltIcon, XMarkIcon, DocumentIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { validateFile } from "../../../../../utils/fileValidator";
import axiosInstance from "@/utils/apiClient";

const initialFormData = {
  disability_type_id: "",
  disability_perc: "",
  dis_valid_up_to: "",
  udid_number: "",
  file: null,
  ais_des_id: "",
};

const fields = [
  {
    label: "Disability Type",
    key: "disability_type_id",
    type: "select",
    selectId: "disability_id",
    selectName: "disability",
  },
  { label: "Disability Percentage", key: "disability_perc", type: "number" },
  { label: "UDID Document Number", key: "udid_number", type: "text" },
  {
    label: "UDID Document",
    key: "file",
    type: "file",
    helperText: "Max Size: 2MB. Allowed types: PDF, DOC, DOCX",
  },
  { label: "Date of Expiry", key: "dis_valid_up_to", type: "date" },
];

const alwaysRequiredFields = ["disability_type_id", "disability_perc", "dis_valid_up_to", "udid_number"];
const disabledFields = [];

export function ModalDisabilityDetails({
  open = false,
  setOpen,
  disabilityDetails,
  onSave,
  masterData,
  sparkFields,
  officerFields,
}) {
  if (typeof open !== "boolean") {
    console.error("The `open` prop for `ModalDisabilityDetails` must be a boolean.");
    return null;
  }

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [userUpdatedFields, setUserUpdatedFields] = useState(new Set());

  const [isDocumentModalOpen, setDocumentModalOpen] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [documentError, setDocumentError] = useState(null);

  useEffect(() => {
    if (open) {
      setFormData({
        disability_type_id: disabilityDetails?.disability_type_id || "",
        disability_perc: disabilityDetails?.disability_perc || "",
        dis_valid_up_to: disabilityDetails?.dis_valid_up_to || "",
        udid_number: disabilityDetails?.udid_number || "",
        file: null,
        ais_des_id: disabilityDetails?.ais_des_id || "",
      });
      setErrors({});
      setUserUpdatedFields(new Set());
    }
  }, [open, disabilityDetails]);

  const hasPreFilledValue = (fieldKey) => {
    return disabilityDetails && disabilityDetails[fieldKey] && disabilityDetails[fieldKey].toString().trim() !== "";
  };

  const isSparkField = (fieldKey) => {
    if (!sparkFields || userUpdatedFields.has(fieldKey)) return false;
    if (disabilityDetails?.fieldSources?.[fieldKey] === "USER") return false;
    return sparkFields.has(`${fieldKey}_${disabilityDetails?.ais_des_id?.split("_")[1] || 0}`);
  };

  const isFieldDisabled = (fieldKey) => {
    if (disabledFields.includes(fieldKey)) return true;
    if (userUpdatedFields.has(fieldKey)) return false;
    if (disabilityDetails?.fieldSources?.[fieldKey] === "USER") return false;
    if (isSparkField(fieldKey) && hasPreFilledValue(fieldKey)) return true;
    if (officerFields?.GAD_OFFICER?.includes(fieldKey) && hasPreFilledValue(fieldKey)) return true;
    return false;
  };

  const getActualFieldKey = (modalKey) => {
    return modalKey === "file" ? "disability_proof" : modalKey;
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    let error = "";
    if (alwaysRequiredFields.includes(name) && !value.trim()) {
      error = "This field is required.";
    }

    if (name === "disability_perc") {
      const perc = parseFloat(value);
      if (value) {
        if (isNaN(perc) || perc <= 0) {
          error = "Please provide a valid percentage.";
        } else if (perc > 100) {
          error = "Percentage cannot be more than 100.";
        }
      }
    }

    if (name === "dis_valid_up_to") {
      if (value) {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sixtyYearsAgo = new Date();
        sixtyYearsAgo.setFullYear(today.getFullYear() - 60);
        if (selectedDate < sixtyYearsAgo) {
          error = "Date must be within the last 60 years.";
        }
      }
    }

    if (name === "file" && files && files[0]) {
      const fileValidation = validateFile(files[0], "document");
      if (!fileValidation.valid) {
        error = fileValidation.error;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "file" ? (files && files[0]) : value,
    }));

    setUserUpdatedFields((prev) => new Set([...prev, name]));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();

    const newErrors = {};

    alwaysRequiredFields.forEach((field) => {
      if (!formData[field]?.toString().trim()) {
        newErrors[field] = "This field is required.";
      }
    });

    const hasExistingDocument = !!disabilityDetails?.disability_proof;
    const hasNewFile = !!formData.file;

    if (!hasExistingDocument && !hasNewFile) {
      newErrors["file"] = "This field is required.";
    }

    if (formData.disability_perc) {
      const perc = parseFloat(formData.disability_perc);
      if (isNaN(perc) || perc <= 0) {
        newErrors["disability_perc"] = "Please provide a valid percentage.";
      } else if (perc > 100) {
        newErrors["disability_perc"] = "Percentage cannot be more than 100.";
      }
    }

    if (formData.dis_valid_up_to) {
      const selectedDate = new Date(formData.dis_valid_up_to);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sixtyYearsAgo = new Date();
      sixtyYearsAgo.setFullYear(today.getFullYear() - 60);
      if (selectedDate < sixtyYearsAgo) {
        newErrors["dis_valid_up_to"] = "Date must be within the last 60 years.";
      }
    }

    if (formData.file) {
      const fileValidation = validateFile(formData.file, "document");
      if (!fileValidation.valid) {
        newErrors["file"] = fileValidation.error;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const sparkData = {};
    const userData = {};

    const dataFields = ["disability_type_id", "disability_perc", "dis_valid_up_to", "udid_number"];
    dataFields.forEach((key) => {
      const value = formData[key];
      if (isSparkField(key) && isFieldDisabled(key) && !userUpdatedFields.has(key)) {
        sparkData[key] = value || "";
      } else if (userUpdatedFields.has(key) || disabilityDetails?.fieldSources?.[key] === "USER") {
        userData[key] = value || "";
      }
    });

    const docKey = "disability_proof";
    const trackedFileKey = "file";
    if (userUpdatedFields.has(trackedFileKey)) {
      userData[docKey] = formData.file || null;
    } else {
      const existingDoc = disabilityDetails?.disability_proof || "";
      if (existingDoc) {
        if (isSparkField(docKey) && hasPreFilledValue(docKey)) {
          sparkData[docKey] = existingDoc;
        } else {
          userData[docKey] = existingDoc;
        }
      }
    }

    const payload = {
      spark_data: sparkData,
      user_data: userData,
    };

    onSave(payload);
  };

  const openDocumentModal = async (documentId) => {
    if (!documentId) return;
    setLoadingDocument(true);
    setDocumentError(null);
    try {
      const response = await axiosInstance.get(`/doc-uploader/get-document/${documentId}`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      const isPdf = response.data.type.includes('pdf');
      setDocumentData({ id: documentId, url, name: `Disability Document`, isPdf });
      setDocumentModalOpen(true);
    } catch (error) {
      console.error("Error fetching document:", error);
      setDocumentError("Failed to load document");
    } finally {
      setLoadingDocument(false);
    }
  };

  const closeDocumentModal = () => {
    setDocumentModalOpen(false);
    setDocumentData(null);
    setDocumentError(null);
    if (documentData?.url) {
      URL.revokeObjectURL(documentData.url);
    }
  };

  const renderSparkIndicator = (fieldKey) => {
    const actualKey = getActualFieldKey(fieldKey);
    if (!isSparkField(actualKey) || !hasPreFilledValue(actualKey)) return null;
    return (
      <div className="absolute top-3 right-3 group z-10">
        <span className="inline-flex items-center p-0.5 rounded-full bg-orange-100 text-orange-600 text-xs" aria-label="Synced from SPARK">
          <BoltIcon className="w-2 h-2" />
        </span>
        <div className="absolute right-0 top-full mt-1 hidden group-hover:block">
          <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md whitespace-nowrap">
            Synced from SPARK
          </div>
        </div>
      </div>
    );
  };

  const renderGadOfficerIndicator = (fieldKey) => {
    const actualKey = getActualFieldKey(fieldKey);
    if (!(officerFields?.GAD_OFFICER?.includes(actualKey) && hasPreFilledValue(actualKey))) return null;
    return (
      <div className="absolute top-3 right-3 group z-10">
        <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-xs" aria-label="Sourced from GAD Officer">
          <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3" />
          </svg>
        </span>
        <div className="absolute right-0 top-full mt-1 hidden group-hover:block">
          <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md whitespace-nowrap">
            Updated by AS-II
          </div>
        </div>
      </div>
    );
  };

  const getFieldClassName = (fieldKey) => {
    const actualKey = getActualFieldKey(fieldKey);
    const baseClasses = "mt-1 block w-full rounded-md sm:text-sm p-2 border";

    if (
      officerFields?.GAD_OFFICER?.includes(actualKey) &&
      hasPreFilledValue(actualKey) &&
      !userUpdatedFields.has(actualKey)
    ) {
      return `${baseClasses} bg-indigo-50 text-gray-900 border-indigo-200 cursor-not-allowed pointer-events-none dark:bg-gray-800 dark:text-white dark:border-indigo-500`;
    }

    if (isSparkField(actualKey) && hasPreFilledValue(actualKey) && !userUpdatedFields.has(actualKey)) {
      return `${baseClasses} bg-orange-50 text-gray-900 border-orange-200 cursor-not-allowed pointer-events-none dark:bg-indigo-900 dark:text-gray-200 dark:border-gray-600`;
    }

    if (disabledFields.includes(fieldKey)) {
      return `${baseClasses} bg-gray-200 text-gray-900 border-gray-300 cursor-not-allowed pointer-events-none dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600 opacity-100`;
    }

    return `${baseClasses} border-gray-300 text-gray-900 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-300`;
  };

  const hasAnyIndication = () => {
    const keys = ["disability_type_id", "disability_perc", "dis_valid_up_to", "udid_number", "disability_proof"];
    return keys.some((key) => isSparkField(key) || officerFields?.GAD_OFFICER?.includes(key));
  };

  const renderDocumentButton = (documentId) => {
    if (!documentId) return null;
    return (
      <button
        type="button"
        onClick={() => openDocumentModal(documentId)}
        className="mt-1 inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 px-2 py-1 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800 transition text-sm"
      >
        <DocumentIcon className="w-4 h-4" />
        View Document
      </button>
    );
  };

  return (
    <>
      <Dialog open={open && !isDocumentModalOpen} onClose={() => setOpen(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />
        <div className="fixed inset-0 z-50 w-screen overflow-y-auto flex items-center justify-center">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-700 dark:text-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <XMarkIcon className="size-6" />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="space-y-12">
                <div className="border-b border-gray-900/10 pb-12 dark:border-gray-600">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-5">
                    Disability Details
                  </h3>
                  {hasAnyIndication() && (
                    <div className="mb-5 flex justify-end">
                      <div className="flex items-center space-x-4 border rounded-md px-3 py-2 bg-indigo-50 dark:bg-gray-800">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center p-0.5 rounded-full bg-orange-100 text-orange-600 text-xs">
                            <BoltIcon className="w-2 h-2" />
                          </span>
                          <span className="text-sm text-gray-700 dark:text-white">
                            Synced from SPARK
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-xs">
                            <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                              <circle cx="4" cy="4" r="3" />
                            </svg>
                          </span>
                          <span className="text-sm text-gray-700 dark:text-white">
                            Updated by AS-II
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                    {fields.map((field) => {
                      const actualKey = getActualFieldKey(field.key);
                      const hasExistingDoc = disabilityDetails?.disability_proof;
                      const isFileRequired = field.key === "file" && !hasExistingDoc && !formData.file;

                      return (
                        <div key={field.key} className="relative">
                          <label className="block text-sm font-medium text-gray-700 dark:text-white">
                            {field.label}
                            {(alwaysRequiredFields.includes(field.key) || isFileRequired) && (
                              <span className="text-red-500 font-semibold"> *</span>
                            )}
                          </label>
                          {renderSparkIndicator(field.key)}
                          {renderGadOfficerIndicator(field.key)}
                          {field.type === "select" ? (
                            <select
                              name={field.key}
                              value={formData[field.key] || ""}
                              onChange={handleChange}
                              disabled={isFieldDisabled(actualKey)}
                              className={getFieldClassName(field.key)}
                            >
                              <option value="">Select {field.label}</option>
                              {masterData.map((option) => (
                                <option
                                  key={option.disability_id}
                                  value={option.disability_id}
                                >
                                  {option.disability}
                                </option>
                              ))}
                            </select>
                          ): field.type === "file" ? (
  <div className="relative">
    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1.5">
     
    </label>
    {renderSparkIndicator(field.key)}
    {renderGadOfficerIndicator(field.key)}

    <div className="flex items-center gap-3 flex-wrap">
      <label
        htmlFor="disability-file-upload"
        className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors
          ${isFieldDisabled(actualKey)
            ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
            : "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800"
          }`}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        {formData.file ? "Change document" : "Choose document"}
        <input
          id="disability-file-upload"
          name={field.key}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleChange}
          disabled={isFieldDisabled(actualKey)}
          className="hidden"
        />
      </label>

      {formData.file ? (
        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[220px] font-medium">
          {formData.file.name}
        </span>
      ) : hasExistingDoc ? (
        renderDocumentButton(disabilityDetails.disability_proof)
      ) : (
        <span className="text-sm text-gray-500 dark:text-gray-400 italic">No document selected</span>
      )}
    </div>

    {field.helperText && (
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {field.helperText}
      </p>
    )}

    {/* {errors[field.key] && (
      <p className="mt-1.5 text-sm text-red-600">{errors[field.key]}</p>
    )} */}
  </div>
)  : field.type === "date" ? (
                            <input
                              type="date"
                              name={field.key}
                              value={formData[field.key] || ""}
                              onChange={handleChange}
                              disabled={isFieldDisabled(actualKey)}
                              min={
                                new Date(
                                  new Date().setFullYear(new Date().getFullYear() - 60)
                                )
                                  .toISOString()
                                  .split("T")[0]
                              }
                              className={getFieldClassName(field.key)}
                            />
                          ) : field.type === "number" ? (
                            <input
                              type="number"
                              name={field.key}
                              value={formData[field.key] || ""}
                              onChange={handleChange}
                              disabled={isFieldDisabled(actualKey)}
                              min="0"
                              max="100"
                              step="1"
                              className={getFieldClassName(field.key)}
                            />
                          ) : (
                            <input
                              type="text"
                              name={field.key}
                              value={formData[field.key] || ""}
                              onChange={handleChange}
                              disabled={isFieldDisabled(actualKey)}
                              className={getFieldClassName(field.key)}
                            />
                          )}
                          {errors[field.key] && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[field.key]}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-x-6">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-sm font-semibold text-gray-700 dark:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    {disabilityDetails && disabilityDetails.ais_des_id ? "Update" : "Save"}
                  </button>
                </div>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      <AnimatePresence>
        {isDocumentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <motion.div
              className="absolute inset-0 bg-black/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDocumentModal}
            />
            <motion.div
              className="relative bg-white dark:bg-gray-800 rounded-md mx-2 w-full max-w-4xl flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ maxHeight: '90vh' }}
            >
              <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {documentData?.name || 'Document Viewer'}
                </h2>
                <button
                  onClick={closeDocumentModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden p-6">
                {loadingDocument ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                  </div>
                ) : documentError ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="text-red-500 text-center p-4 rounded-md bg-red-50 dark:bg-red-900/30">
                      {documentError}
                    </div>
                  </div>
                ) : documentData ? (
                  <div className="h-full overflow-auto bg-gray-100 dark:bg-gray-900 rounded-lg">
                    {documentData.isPdf ? (
                      <iframe
                        src={documentData.url}
                        className="w-full h-full min-h-[500px]"
                        title="PDF Document"
                      />
                    ) : (
                      <div className="flex justify-center items-center p-4">
                        <img
                          src={documentData.url}
                          alt={documentData.name}
                          className="max-w-full max-h-[70vh] object-contain"
                          onError={(e) => {
                            e.target.style.display = "none";
                            const fallback = e.target.nextSibling;
                            if (fallback) fallback.style.display = "block";
                          }}
                        />
                        <div className="hidden text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400">
                            Unable to load document
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

ModalDisabilityDetails.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  disabilityDetails: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  masterData: PropTypes.array.isRequired,
  sparkFields: PropTypes.instanceOf(Set),
  officerFields: PropTypes.object,
};