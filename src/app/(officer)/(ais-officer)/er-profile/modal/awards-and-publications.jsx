"use client";

import PropTypes from "prop-types";
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
} from "@headlessui/react";
import { BoltIcon, XMarkIcon, DocumentIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { validateFile } from "../../../../../utils/fileValidator";
import axiosInstance from "@/utils/apiClient";

export function ModalAwardsAndPublications({
  open = false,
  setOpen,
  save,
  awards,
  sparkFields,
  officerFields,
}) {
  if (typeof open !== "boolean") {
    console.error("The `open` prop for `ModalAwardsAndPublications` must be a boolean.");
    return null;
  }

  const [formData, setFormData] = useState({
    rew_name: "",
    reward_type: "", // NEW FIELD
    rew_from: "",
    received_on: "",
    rew_description: "",
    file: null,
  });
  const [errors, setErrors] = useState({});
  const [userUpdatedFields, setUserUpdatedFields] = useState(new Set());

  // Document modal states - simplified like training modal
  const [isDocumentModalOpen, setDocumentModalOpen] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [documentError, setDocumentError] = useState(null);

  const requiredFields = ["rew_name", "rew_from", "received_on", "reward_doc"]; // Document now required

   // Add category options
  const awardCategoryOptions = [
    { value: "", label: "Select Category" },
    { value: "Personal Award", label: "Personal Award" },
    { value: "Organizational Award", label: "Organizational Award" },
  ];

  const disabledFields = [];

  const MAX_REW_NAME = 100;
  const MAX_REW_FROM = 100;
  const MAX_REW_DESCRIPTION = 500;

  // Remove portal container logic - we'll render inline like training modal
  useEffect(() => {
    if (open) {
      setFormData({
        rew_name: awards?.rew_name || "",
        reward_type: awards?.reward_type || "", // NEW FIELD
        rew_from: awards?.rew_from || "",
        received_on: awards?.received_on || "",
        rew_description: awards?.rew_description || "",
        file: null,
      });
      setErrors({});
      setUserUpdatedFields(new Set());
    }
  }, [open, awards]);

  // Handle Escape key for document modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isDocumentModalOpen) {
        closeDocumentModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isDocumentModalOpen]);

const hasPreFilledValue = (fieldKey) => {
  // Check if award has this field value from any source
  if (awards && awards[fieldKey] && String(awards[fieldKey]).trim() !== "") {
    return true;
  }
  
  // For SPARK fields, check the mapping
  const sparkFieldMap = {
    rew_name: "nature",
    rew_from: "office", 
    rew_description: "purpose",
    reward_doc: "upload_certificate"
  };
  
  // If this is a SPARK field, check if we have the corresponding SPARK data
  if (sparkFieldMap[fieldKey] && awards?.fieldSources?.[fieldKey] === "SPARK") {
    return true;
  }
  
  return false;
};

 // In ModalAwardsAndPublications component, update the isSparkField function:

const isSparkField = (fieldKey) => {
  if (!sparkFields || userUpdatedFields.has(fieldKey)) return false;
  if (awards?.fieldSources?.[fieldKey] === "USER") return false;
  
  // Check if this field exists in spark data based on response structure
  const sparkFieldMap = {
    rew_name: "nature",      // SPARK has "nature" instead of "rew_name"
    rew_from: "office",      // SPARK has "office" instead of "rew_from"
    rew_description: "purpose", // SPARK has "purpose" instead of "rew_description"
    reward_doc: "upload_certificate" // SPARK has "upload_certificate"
  };
  
  const sparkFieldName = sparkFieldMap[fieldKey];
  if (!sparkFieldName) return false;
  
  // Check if this field exists in the awards SPARK data
  const awardIndex = awards?.ais_rew_id?.split("_")[1] || 0;
  
  // Check sparkFields Set
  if (sparkFields.has(`${fieldKey}_${awardIndex}`)) {
    return true;
  }
  
  // Also check if the award has this field from SPARK in its data
  if (awards?.fieldSources?.[fieldKey] === "SPARK") {
    return true;
  }
  
  return false;
};

  const isFieldDisabled = (fieldKey) => {
    if (officerFields?.GAD_OFFICER?.includes(fieldKey) && hasPreFilledValue(fieldKey)) return true;
    if (disabledFields.includes(fieldKey)) return true;
    if (userUpdatedFields.has(fieldKey)) return false;
    if (awards?.fieldSources?.[fieldKey] === "USER") return false;
    if (isSparkField(fieldKey) && hasPreFilledValue(fieldKey)) return true;
    return false;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    const trackedKey = name === "file" ? "reward_doc" : name;

    let error = "";
    const nameRegex = /^[A-Za-z0-9\s()&/.,\-]*$/;
    const descRegex = /^[A-Za-z0-9\s()&/.,\-:;'"]*$/;
    const fromRegex = /^[A-Za-z0-9\s()&/.,-]*$/;

    let updatedValue = value;
    if (name === "rew_name" || name === "rew_from" || name === "rew_description") {
      updatedValue = value.trimStart();
    }
    switch (name) {
      case "rew_name":
        if (!value) {
          error = "This field is required.";
        } else if (!nameRegex.test(value)) {
          error = "Only letters, numbers, spaces, and & . , - are allowed.";
        } else if (value.length > MAX_REW_NAME) {
          updatedValue = value.slice(0, MAX_REW_NAME);
          error = "Must be under 100 characters.";
        }
        break;

      case "reward_type": // NEW FIELD VALIDATION
        if (!value) {
          error = "Please select an award category.";
        }
        break;

      case "rew_from":
        if (!value) {
          error = "This field is required.";
        } else if (!fromRegex.test(value)) {
          error = "Only letters, numbers, spaces, and & . , - are allowed.";
        } else if (value.length > MAX_REW_FROM) {
          updatedValue = value.slice(0, MAX_REW_FROM);
          error = "Must be under 50 characters.";
        }
        break;

      case "rew_description":
        if (value && !descRegex.test(value)) {
          error = "Only letters, numbers, spaces, and & . , - : ; ' \" are allowed.";
        } else if (value.length > MAX_REW_DESCRIPTION) {
          updatedValue = value.slice(0, MAX_REW_DESCRIPTION);
          error = "Maximum 500 characters allowed.";
        }
        break;

      case "received_on":
        if (!value) {
          error = "Date is required.";
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (selectedDate >= today) {
            error = "Current and Future dates are not allowed.";
          }
        }
        break;

      case "file":
        if (files && files[0]) {
          const uploadedFile = files[0];
          const fileExtension = uploadedFile.name.split('.').pop().toLowerCase();
          const isPdf = fileExtension === 'pdf';
          const validationType = isPdf ? 'document' : 'image';
          const result = validateFile(uploadedFile, validationType);
          if (!result.valid) {
            error = result.error;
          }
        } else {
          // If file is cleared and no existing document, mark as required
          if (!awards?.reward_doc) {
            error = "Document upload is required.";
          }
        }
        break;

      default:
        break;
    }

    setFormData({
      ...formData,
      [name]: name === "file" ? (files && files[0]) : updatedValue,
    });

    setUserUpdatedFields((prev) => new Set([...prev, trackedKey]));
    setErrors({
      ...errors,
      [name]: error,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    const nameRegex = /^[A-Za-z0-9\s()&/.,\-]*$/;
    const descRegex = /^[A-Za-z0-9\s()&/.,\-:;'"]*$/;
    const fromRegex = /^[A-Za-z0-9\s()&/.,-]*$/;

    const { rew_name, reward_type, rew_from, received_on, rew_description, file } = formData; // Added reward_type

    if (!rew_name) {
      newErrors.rew_name = "This field is required.";
    } else if (!nameRegex.test(rew_name)) {
      newErrors.rew_name = "Only letters, numbers, spaces, and & . , - are allowed.";
    } else if (rew_name.length > MAX_REW_NAME) {
      newErrors.rew_name = "Must be under 100 characters.";
    }

    // NEW VALIDATION FOR AWARD CATEGORY
    if (!reward_type) {
      newErrors.reward_type = "Award category is required.";
    }

    if (!rew_from) {
      newErrors.rew_from = "This field is required.";
    } else if (!fromRegex.test(rew_from)) {
      newErrors.rew_from = "Only letters, numbers, spaces, and & . , - are allowed.";
    } else if (rew_from.length > MAX_REW_FROM) {
      newErrors.rew_from = "Must be under 50 characters.";
    }

    if (!received_on) {
      newErrors.received_on = "This field is required.";
    } else {
      const selectedDate = new Date(received_on);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        newErrors.received_on = "Future dates are not allowed.";
      }
    }

    if (rew_description && !descRegex.test(rew_description)) {
      newErrors.rew_description = "Only letters, numbers, spaces, and & . , - : ; ' \" are allowed.";
    } else if (rew_description.length > MAX_REW_DESCRIPTION) {
      newErrors.rew_description = "Maximum 500 characters allowed.";
    }

    // Document required: must have either existing document or new upload
    if (!awards?.reward_doc && !file) {
      newErrors.file = "Document upload is required.";
    } else if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const isPdf = fileExtension === 'pdf';
      const validationType = isPdf ? 'document' : 'image';
      const result = validateFile(file, validationType);
      if (!result.valid) {
        newErrors.file = result.error;
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    const sparkData = {};
    const userData = {};

    ["rew_name", "reward_type", "rew_from", "received_on", "rew_description", "reward_doc"].forEach((key) => { // Added reward_type
      const value = key === "reward_doc" ? formData.file : formData[key];

      if (key === "reward_doc") {
        if (userUpdatedFields.has(key)) {
          userData[key] = value;
        }
        return;
      }

      if (isSparkField(key) && isFieldDisabled(key) && !userUpdatedFields.has(key)) {
        sparkData[key] = value || "";
      } else if (userUpdatedFields.has(key) || awards?.fieldSources?.[key] === "USER") {
        userData[key] = value || "";
      }
    });

    // Handle reward_doc specially to preserve existing if not updated
    const docKey = "reward_doc";
    if (!userUpdatedFields.has(docKey)) {
      const existingDoc = awards?.reward_doc || "";
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

    save(payload);
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
      setDocumentData({ id: documentId, url, name: `Award Document`, isPdf });
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

  const handleCloseMainModal = () => {
    if (!isDocumentModalOpen) {
      setOpen(false);
    }
  };

  const renderSparkIndicator = (fieldKey) => {
    if (!isSparkField(fieldKey) || !hasPreFilledValue(fieldKey)) return null;
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
    if (!(officerFields?.GAD_OFFICER?.includes(fieldKey) && hasPreFilledValue(fieldKey))) return null;
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
  const baseClasses = "mt-1 block w-full rounded-md sm:text-sm p-2 border";

  if (
    officerFields?.GAD_OFFICER?.includes(fieldKey) &&
    hasPreFilledValue(fieldKey) &&
    !userUpdatedFields.has(fieldKey)
  ) {
    return `${baseClasses} bg-indigo-50 text-gray-900 border-indigo-200 cursor-not-allowed pointer-events-none dark:bg-gray-800 dark:text-white dark:border-indigo-500`;
  }

  // Updated SPARK field check
  if (isSparkField(fieldKey) && !userUpdatedFields.has(fieldKey)) {
    return `${baseClasses} bg-orange-50 text-gray-900 border-orange-200 cursor-not-allowed pointer-events-none dark:bg-indigo-900 dark:text-gray-200 dark:border-gray-600`;
  }

  if (disabledFields.includes(fieldKey)) {
    return `${baseClasses} bg-gray-200 text-gray-900 border-gray-300 cursor-not-allowed pointer-events-none dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600 opacity-100`;
  }

  return `${baseClasses} border-gray-300 text-gray-900 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-300`;
};

  const hasAnyIndication = () => {
    const hasSparkData = ["rew_name", "reward_type", "rew_from", "received_on", "rew_description", "reward_doc"].some( 
      (key) => isSparkField(key) && hasPreFilledValue(key)
    );
    const hasOfficerData =
      officerFields?.GAD_OFFICER &&
      ["rew_name", "reward_type", "rew_from", "received_on", "rew_description", "reward_doc"].some( // Added reward_type
        (key) => officerFields.GAD_OFFICER.includes(key) && hasPreFilledValue(key)
      );
    return hasSparkData || hasOfficerData;
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
      <Dialog 
        open={open} 
        onClose={() => !isDocumentModalOpen && setOpen(false)} 
        className="relative z-10"
      >
        <DialogBackdrop
          className="fixed inset-0 bg-gray-500/75 transition-opacity"
        />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto flex items-center justify-center">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-700 dark:text-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button
                onClick={handleCloseMainModal}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <XMarkIcon className="size-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-12">
                <div className="border-b border-gray-900/10 pb-12 dark:border-gray-600">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-2">
                    Award Details
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
                  <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    <div className="sm:col-span-3 relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Name of Award
                        <span className="text-red-500 font-semibold"> *</span>
                      </label>
                      {renderSparkIndicator("rew_name")}
                      {renderGadOfficerIndicator("rew_name")}
                      <div className="relative">
                        <input
                          type="text"
                          name="rew_name"
                          value={formData.rew_name}
                          onChange={handleChange}
                          disabled={isFieldDisabled("rew_name")}
                          placeholder="Enter the name of the award"
                          className={`${getFieldClassName("rew_name")} pr-16`}
                          maxLength={MAX_REW_NAME + 1}
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                          {formData.rew_name.length}/{MAX_REW_NAME}
                        </div>
                      </div>
                      {errors.rew_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.rew_name}</p>
                      )}
                    </div>

                     {/* NEW AWARD CATEGORY FIELD */}
                      <div className="sm:col-span-3 relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-white">
                          Award Category
                          <span className="text-red-500 font-semibold"> *</span>
                        </label>
                        {renderSparkIndicator("reward_type")}
                        {renderGadOfficerIndicator("reward_type")}
                        <select
                          name="reward_type"
                          value={formData.reward_type}
                          onChange={handleChange}
                          disabled={isFieldDisabled("reward_type")}
                          className={getFieldClassName("reward_type")}
                        >
                          {awardCategoryOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {errors.reward_type && (
                          <p className="mt-1 text-sm text-red-600">{errors.reward_type}</p>
                        )}
                      </div>


                    <div className="sm:col-span-3 relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Award Received Date
                        <span className="text-red-500 font-semibold"> *</span>
                      </label>
                      {renderSparkIndicator("received_on")}
                      {renderGadOfficerIndicator("received_on")}
                      <input
                        type="date"
                        name="received_on"
                        value={formData.received_on}
                        onChange={handleChange}
                        disabled={isFieldDisabled("received_on")}
                        min="1900-01-01"
                        max={new Date().toISOString().split("T")[0]}
                        className={getFieldClassName("received_on")}
                      />
                      {errors.received_on && (
                        <p className="mt-1 text-sm text-red-600">{errors.received_on}</p>
                      )}
                    </div>

                    <div className="sm:col-span-3 relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Awarded By
                        <span className="text-red-500 font-semibold"> *</span>
                      </label>
                      {renderSparkIndicator("rew_from")}
                      {renderGadOfficerIndicator("rew_from")}
                      <div className="relative">
                        <textarea
                          name="rew_from"
                          value={formData.rew_from}
                          onChange={handleChange}
                          disabled={isFieldDisabled("rew_from")}
                          placeholder="Enter organization or institution name"
                          className={`${getFieldClassName("rew_from")} pr-16`}
                          maxLength={MAX_REW_FROM + 1}
                        ></textarea>
                        <div className="absolute right-2 top-2 text-xs text-gray-500 dark:text-gray-400">
                          {formData.rew_from.length}/{MAX_REW_FROM}
                        </div>
                      </div>
                      {errors.rew_from && (
                        <p className="mt-1 text-sm text-red-600">{errors.rew_from}</p>
                      )}
                    </div>

                    <div className="sm:col-span-3 relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Description
                      </label>
                      {renderSparkIndicator("rew_description")}
                      {renderGadOfficerIndicator("rew_description")}
                      <div className="relative">
                        <textarea
                          name="rew_description"
                          value={formData.rew_description}
                          onChange={handleChange}
                          disabled={isFieldDisabled("rew_description")}
                          placeholder="Enter award details (optional)"
                          className={`${getFieldClassName("rew_description")} pr-16 resize-vertical`}
                          maxLength={MAX_REW_DESCRIPTION + 1}
                          rows={4}
                        ></textarea>
                        <div className="absolute right-2 top-2 text-xs text-gray-500 dark:text-gray-400">
                          {formData.rew_description.length}/{MAX_REW_DESCRIPTION}
                        </div>
                      </div>
                      {errors.rew_description && (
                        <p className="mt-1 text-sm text-red-600">{errors.rew_description}</p>
                      )}
                    </div>

                    <div className="sm:col-span-3 relative">
  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1.5">
    Upload Document <span className="text-red-500 font-semibold">*</span>
  </label>
  {renderSparkIndicator("reward_doc")}
  {renderGadOfficerIndicator("reward_doc")}

  <div className="flex items-center gap-3 flex-wrap">
    <label
      htmlFor="award-file-upload"
      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors
        ${isFieldDisabled("reward_doc")
          ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
          : "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800"
        }`}
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      {formData.file ? "Change document" : "Choose document"}
      <input
        id="award-file-upload"
        name="file"
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={handleChange}
        disabled={isFieldDisabled("reward_doc")}
        className="hidden"
      />
    </label>

    {formData.file ? (
      <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[220px] font-medium">
        {formData.file.name}
      </span>
    ) : awards?.reward_doc ? (
      renderDocumentButton(awards.reward_doc)
    ) : (
      <span className="text-sm text-gray-500 dark:text-gray-400 italic">No document selected</span>
    )}
  </div>

  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
    Allowed: PDF, JPG, JPEG, PNG • max 1MB
  </p>

  {errors.file && (
    <p className="mt-1.5 text-sm text-red-600">{errors.file}</p>
  )}
</div>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-x-6">
                  <button
                    type="button"
                    onClick={handleCloseMainModal}
                    className="text-sm font-semibold text-gray-700 dark:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    {awards && awards.ais_rew_id ? "Update" : "Save"}
                  </button>
                </div>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Document Viewer Modal - Render inline with higher z-index like training modal */}
      <Dialog open={isDocumentModalOpen} onClose={closeDocumentModal} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-gray-900/75 transition-opacity" />
        <div className="fixed inset-0 z-50 w-screen overflow-y-auto flex items-center justify-center">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
            <div className="absolute right-0 top-0 pr-4 pt-4">
              <button
                type="button"
                onClick={closeDocumentModal}
                className="rounded-md bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-200 focus:outline-none"
              >
                <XMarkIcon className="h-6 w-6" strokeWidth={2} />
              </button>
            </div>
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100 mb-4">
                  {documentData?.name || "Document"}
                </h3>
                {loadingDocument ? (
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
                  </div>
                ) : documentError ? (
                  <div className="text-red-500 text-center p-3 rounded-md bg-red-50 dark:bg-red-900/30 text-sm">
                    {documentError}
                  </div>
                ) : documentData ? (
                  <div className="mt-2">
                    {documentData.isPdf ? (
                      <iframe
                        src={documentData.url}
                        width="100%"
                        height="500px"
                        className="border rounded-lg"
                        title="Document PDF"
                      >
                        <p className="text-gray-500 dark:text-gray-400">
                          Unable to display PDF file. <a href={documentData.url} download>Download</a>
                        </p>
                      </iframe>
                    ) : (
                      <img
                        src={documentData.url}
                        alt={documentData.name}
                        className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "block";
                        }}
                      />
                    )}
                    <div className="hidden text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        Unable to load document
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}

ModalAwardsAndPublications.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  save: PropTypes.func.isRequired,
  awards: PropTypes.object,
  sparkFields: PropTypes.instanceOf(Set),
  officerFields: PropTypes.object,
};