"use client";
import { useState, useEffect, useCallback, useRef } from "react";

import { BoltIcon, XMarkIcon, PaperClipIcon, TrashIcon, EyeIcon, ArrowUpTrayIcon, CloudArrowUpIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { toast } from "react-toastify";
import axiosInstance from "@/utils/apiClient";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
} from "@headlessui/react";

// Import the ConfirmModal component
import ConfirmModal from "@/app/components/confirmModal"; // Adjust the path as needed

export function ModalCareerTrainingDetails({
  open = false,
  setOpen,
  save,
  training,
  masterData,
  sparkFields,
  officerFields,
  userId,
  onDocumentRemove, 
}) {
  if (typeof open !== "boolean") {
    console.error("The `open` prop for `ModalCareerTrainingDetails` must be a boolean.");
    return null;
  }

  const [formData, setFormData] = useState({
    training_type_id: "",
    country_id: "",
    institute_name: "",
    subject: "",
    place: "",
    training_from: "",
    training_to: "",
    files: [],
    documents: "", 
  });

  const [errors, setErrors] = useState({});
  const [userUpdatedFields, setUserUpdatedFields] = useState(new Set());
  const [documentsData, setDocumentsData] = useState([]);
  const documentsDataRef = useRef([]);

  useEffect(() => {
    documentsDataRef.current = documentsData;
  }, [documentsData]);

  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [documentError, setDocumentError] = useState(null);
  const [openView, setOpenView] = useState(false);
  const [selectedView, setSelectedView] = useState(null);
  const [isPdf, setIsPdf] = useState(false);

  // Add state for confirm modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [documentToRemove, setDocumentToRemove] = useState(null);
  
  // New states for improved upload flow
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  const countryCodeMap = { IND: "India" };

  // Helper function to trim form data
  const trimFormData = (data) => {
    const trimmed = { ...data };
    // Trim string fields
    const stringFields = ['training_type_id', 'institute_name', 'subject', 'place'];
    stringFields.forEach(field => {
      if (typeof trimmed[field] === 'string') {
        trimmed[field] = trimmed[field].trim();
      }
    });
    
    // Trim documents field (comma-separated IDs)
    if (trimmed.documents && typeof trimmed.documents === 'string') {
      trimmed.documents = trimmed.documents
        .split(',')
        .map(id => id.trim())
        .filter(id => id !== '')
        .join(',');
    }
    
    return trimmed;
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const [d, m, y] = parts;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    return dateStr;
  };
  
  const cleanIds = (idsString) => {
    if (!idsString) return [];
    return idsString
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);
  };
  
  const requiredFields = ["training_type_id", "country_id", "institute_name", "subject", "place", "training_from", "training_to"];
  const disabledFields = [];

  // Get document IDs from formData.documents string
  const getDocumentIds = () => {
    return formData.documents
      .split(",")
      .map(id => id.trim())
      .filter(id => id.length > 0);
  };

  const fetchDocuments = useCallback(async (documentIds, trainingName) => {
    setLoadingDocuments(true);
    setDocumentError(null);
    // Revoke previous URLs before fetching new ones
    documentsDataRef.current.forEach((doc) => {
      if (doc.url) {
        URL.revokeObjectURL(doc.url);
      }
    });
    try {
      const documentPromises = documentIds.map(async (id, index) => {
        try {
          const response = await axiosInstance.get(`/doc-uploader/get-document/${id}`, {
            responseType: 'blob',
          });
          const url = URL.createObjectURL(response.data);
          const isPdf = response.data.type.includes('pdf');
          return { 
            id, 
            url, 
            name: `Training Document ${index + 1}`, 
            isPdf, 
            status: 'loaded' 
          };
        } catch (error) {
          console.error(`Error fetching document ${id}:`, error);
          return { 
            id, 
            url: null, 
            name: `Document ${id.substring(0, 8)}...`, 
            isPdf: false, 
            status: 'error',
            error: 'Failed to load'
          };
        }
      });
      const documents = await Promise.all(documentPromises);
      setDocumentsData(documents);
      
      // Check if all documents failed to load
      const failedCount = documents.filter(doc => doc.status === 'error').length;
      if (failedCount > 0) {
        setDocumentError(`${failedCount} document(s) failed to load.`);
      }
    } catch (error) {
      console.error("Error in fetchDocuments:", error);
      // Even if there's an error, ensure document IDs are still accessible
      const documentIds = getDocumentIds();
      const placeholderDocs = documentIds.map((id, index) => ({
        id,
        url: null,
        name: `Document ${id.substring(0, 8)}...`,
        isPdf: false,
        status: 'error',
        error: 'Failed to load'
      }));
      setDocumentsData(placeholderDocs);
      setDocumentError("Failed to load documents. You can still remove or upload new documents.");
    } finally {
      setLoadingDocuments(false);
    }
  }, [axiosInstance]);

  useEffect(() => {
    if (!open) {
      // Cleanup when modal closes
      documentsDataRef.current.forEach((doc) => {
        if (doc.url) {
          URL.revokeObjectURL(doc.url);
        }
      });
      setDocumentsData([]);
      setUploadingFiles([]);
      setUploadProgress({});
      setIsUploading(false);
      setOpenView(false);
      setSelectedView(null);
      setIsPdf(false);
      setConfirmModalOpen(false);
      setDocumentToRemove(null);
      return;
    }

    let countryId = training?.country_id || "";
    if (!countryId && training?.raw_country) {
      const displayCountry = countryCodeMap[training.raw_country] || training.raw_country;
      const match = masterData.countries.find(c => c.country.toLowerCase() === displayCountry.toLowerCase());
      if (match) {
        countryId = match.country_id;
      }
    }

    let typeId = training?.training_type_id || "";
    if (!typeId && training?.subject && training.fieldSources?.subject === "SPARK") {
      const match = masterData.training_types.find(t => t.training_type.toLowerCase() === training.subject.toLowerCase().trim());
      if (match) {
        typeId = match.training_type_id;
      }
    }

    const initialDocuments = Array.isArray(training?.documents) ? training.documents.join(",") : training?.documents || "";
    
    // Apply trimming to initial data
    const initialData = trimFormData({
      training_type_id: typeId,
      country_id: countryId,
      institute_name: training?.institute_name || "",
      subject: training?.subject || "",
      place: training?.place || "",
      training_from: parseDate(training?.training_from) || "",
      training_to: parseDate(training?.training_to) || "",
      files: [],
      documents: initialDocuments,
    });
    
    setFormData(initialData);
    setErrors({});
    setUserUpdatedFields(new Set());
    setDocumentsData([]);
    setUploadingFiles([]);
    setUploadProgress({});
    setIsUploading(false);
    setDocumentError(null);
    setConfirmModalOpen(false);
    setDocumentToRemove(null);

    if (initialDocuments) {
      const ids = initialDocuments.split(",").filter(Boolean);
      fetchDocuments(ids, training?.training_type || "");
    }
  }, [open, training, masterData, fetchDocuments]);

  // Improved uploadFiles function with progress tracking
  const uploadFiles = async (files) => {
    setIsUploading(true);
    const uploadPromises = files.map(async (file, index) => {
      const tempId = `temp-${Date.now()}-${index}`;
      
      // Add file to uploading state
      setUploadingFiles(prev => [...prev, {
        id: tempId,
        name: file.name,
        size: file.size,
        status: 'uploading',
        progress: 0
      }]);

      const metadata = {
        document_type: "ER-Profile",
        document_sub_type: "Training",
        document_number: `TRN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: file.name,
        issuing_authority: "N/A",
        issue_date: new Date().toISOString().split("T")[0],
        created_by: userId,
      };
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("metadata", JSON.stringify(metadata));
      
      try {
        const response = await axiosInstance.post("/doc-uploader/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({ ...prev, [tempId]: progress }));
          }
        });
        
        if (response.data.message === "Uploaded & saved") {
          // Update file status to completed
          setUploadingFiles(prev => prev.map(f => 
            f.id === tempId ? { ...f, status: 'completed' } : f
          ));
          return response.data.document_id;
        } else {
          throw new Error(`Upload failed for ${file.name}`);
        }
      } catch (error) {
        // Update file status to failed
        setUploadingFiles(prev => prev.map(f => 
          f.id === tempId ? { ...f, status: 'failed', error: error.message } : f
        ));
        throw error;
      }
    });

    try {
      const results = await Promise.allSettled(uploadPromises);
      const successfulIds = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);
      const failed = results.filter((r) => r.status === "rejected");
      
      // Clear uploading state after delay
      setTimeout(() => {
        setUploadingFiles([]);
        setUploadProgress({});
        setIsUploading(false);
      }, 1500);

      if (failed.length > 0) {
        failed.forEach((f) => {
          toast.error(`Failed to upload file`);
        });
      }

      return successfulIds;
    } catch (error) {
      setIsUploading(false);
      throw error;
    }
  };

  const hasPreFilledValue = (fieldKey) => {
    let value = training?.[fieldKey];
    if (fieldKey === 'country_id' && !value) {
      value = training?.raw_country;
    }
    return value && value.toString().trim() !== "";
  };

  const isSparkField = (fieldKey) => {
    if (userUpdatedFields.has(fieldKey)) return false;
    if (training?.fieldSources?.[fieldKey] === "USER") return false;
    if (training?.isSaved && training?.fieldSources?.[fieldKey] === "SPARK") return true;
    return sparkFields.has(`${fieldKey}_${training?.ais_tr_id?.split("_")[1] || 0}`);
  };

  const isFieldDisabled = (fieldKey) => {
    if (disabledFields.includes(fieldKey)) return true;
    if (userUpdatedFields.has(fieldKey)) return false;
    if (training?.fieldSources?.[fieldKey] === "USER") return false;
    if (isSparkField(fieldKey) && hasPreFilledValue(fieldKey)) return true;
    if (officerFields?.GAD_OFFICER?.includes(fieldKey) && hasPreFilledValue(fieldKey)) return true;
    return false;
  };

  // Handle blur event to trim input immediately
  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (['training_type_id', 'institute_name', 'subject', 'place'].includes(name) && typeof value === 'string') {
      const trimmedValue = value.trim();
      if (trimmedValue !== value) {
        handleChange({
          target: {
            name,
            value: trimmedValue
          }
        });
      }
    }
  };

  const handleChange = async (e) => {
    const { name, value, files } = e.target;
    let trimmedValue = value;
    let error = "";
    const textRegex = /^[A-Za-z0-9\s()&/.,\-]*$/;
    
    // Trim input values for string fields
    if (typeof trimmedValue === 'string' && 
        ['training_type_id', 'institute_name', 'subject', 'place'].includes(name)) {
      trimmedValue = trimmedValue.trim();
    }
    
    switch (name) {
      case "institute_name":
      case "subject":
      case "place":
        if (!trimmedValue && requiredFields.includes(name)) {
          error = "This field is required.";
        } else if (trimmedValue && !textRegex.test(trimmedValue)) {
          error = "Only letters, numbers, spaces, and & . , - are allowed.";
        } else if (trimmedValue && trimmedValue.length > 100) {
          error = "Must be under 100 characters.";
        }
        break;
      case "training_type_id":
      case "country_id":
        if (!trimmedValue && requiredFields.includes(name)) {
          error = "This field is required.";
        }
        break;
      case "training_from":
      case "training_to":
        if (!trimmedValue && requiredFields.includes(name)) {
          error = "Date is required.";
        } else if (name === "training_to" && formData.training_from && new Date(trimmedValue) < new Date(formData.training_from)) {
          error = "End date cannot be before start date.";
        }
        break;
      case "files":
        if (files && files.length > 0) {
          let hasError = false;
          let errorMsg = "";
          
          // Validate each file
          const validFiles = [];
          Array.from(files).forEach((file) => {
            const extension = file.name.split(".").pop().toLowerCase();
            const allowedExtensions = ["jpg", "jpeg", "png", "pdf"];
            
            if (!allowedExtensions.includes(extension)) {
              hasError = true;
              errorMsg = "Only JPG, JPEG, PNG, PDF allowed.";
            } else if (file.size > 1024 * 1024) {
              hasError = true;
              errorMsg = "File size must be under 1MB.";
            } else {
              validFiles.push(file);
            }
          });
          
          if (hasError) {
            error = errorMsg;
            setErrors({ ...errors, [name]: error });
            return;
          }
          
          if (validFiles.length > 0) {
            // Upload files
            try {
              const newIds = await uploadFiles(validFiles);
              if (newIds.length > 0) {
                setFormData((prev) => {
                  const currentDocs = prev.documents || "";
                  const updatedDocs = currentDocs ? `${currentDocs},${newIds.join(",")}` : newIds.join(",");
                  return { 
                    ...prev, 
                    documents: updatedDocs.trim(),
                    files: [] 
                  };
                });
                setUserUpdatedFields((prev) => new Set([...prev, "documents"]));
                
                // Refetch all documents
                const fullIds = formData.documents ? 
                  formData.documents.split(",").filter(Boolean).concat(newIds) : 
                  newIds;
                fetchDocuments(fullIds, training?.training_type || "");
                
                toast.success(`${newIds.length} file(s) uploaded successfully`);
              }
            } catch (err) {
              console.error("Upload error:", err);
              toast.error("Failed to upload files");
            }
          }
        }
        break;
      default:
        break;
    }
    
    setErrors({
      ...errors,
      [name]: error,
    });
    
    if (name !== "files") {
      setFormData({
        ...formData,
        [name]: trimmedValue,
      });
      setUserUpdatedFields((prev) => new Set([...prev, name]));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isUploading) {
      toast.warning("Please wait for file uploads to complete");
      return;
    }
    
    // Trim all form data before validation
    const trimmedFormData = trimFormData(formData);
    
    // Update form state with trimmed values
    setFormData(trimmedFormData);
    
    const newErrors = {};
    const textRegex = /^[A-Za-z0-9\s()&/.,\-]*$/;

    // Helper to check emptiness on trimmed values
    const checkEmpty = (field) => {
      const value = trimmedFormData[field];
      return !value || (typeof value === 'string' && value.trim() === '');
    };

    requiredFields.forEach((field) => {
      const value = trimmedFormData[field];
      const trimmed = value ? value.toString().trim() : '';

      if (!trimmed) {
        newErrors[field] = "This field is required.";
      } else if (["training_type_id", "institute_name", "subject", "place"].includes(field)) {
        if (!textRegex.test(value)) {
          newErrors[field] = "Only letters, numbers, spaces, and & . , - are allowed.";
        } else if (value.length > 100) {
          newErrors[field] = "Must be under 100 characters.";
        }
      }
    });

    if (trimmedFormData.training_to && trimmedFormData.training_from && 
        new Date(trimmedFormData.training_to) < new Date(trimmedFormData.training_from)) {
      newErrors.training_to = "End date cannot be before start date.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const sparkData = {};
    const userData = {};
    
    // Use trimmed form data for payload
    [ "training_type_id", "country_id", "institute_name", "subject", "place", "training_from", "training_to", "documents"].forEach((key) => {
      const value = trimmedFormData[key];
      if (isSparkField(key) && isFieldDisabled(key) && !userUpdatedFields.has(key)) {
        if (key !== "documents") {
          sparkData[key] = value || "";
        }
      } else if (userUpdatedFields.has(key) || training?.fieldSources?.[key] === "USER") {
        userData[key] = value || "";
      }
    });

    // Ensure the payload data is also trimmed
    Object.keys(userData).forEach(key => {
      if (typeof userData[key] === 'string' && 
          ['training_type_id', 'institute_name', 'subject', 'place', 'documents'].includes(key)) {
        userData[key] = userData[key].trim();
      }
    });

    const payload = {
      spark_data: sparkData,
      user_data: userData,
    };
    
    save(payload);
  };

  // Updated handleRemove function to use the ConfirmModal
  const handleRemove = (id) => {
    setDocumentToRemove(id);
    setConfirmModalOpen(true);
  };

  // New function to handle the actual removal after confirmation
  const handleRemoveConfirmed = async () => {
    if (!documentToRemove) return;

    try {
      await axiosInstance.delete(`/doc-uploader/document/${documentToRemove}`);

      // Update local form state with trimmed values
      setFormData((prev) => {
        const currentDocs = prev.documents || "";
        const updatedIds = currentDocs
          .split(",")
          .map(id => id.trim())
          .filter(id => id && id !== documentToRemove);
        
        return { 
          ...prev, 
          documents: updatedIds.join(",") 
        };
      });

      setUserUpdatedFields((prev) => new Set([...prev, "documents"]));

      // Clear document error if removing the problematic document
      if (documentError) {
        setDocumentError(null);
      }

      // Refetch remaining with trimmed IDs
      const currentDocs = formData.documents || "";
      const remainingIds = currentDocs
        .split(",")
        .map(id => id.trim())
        .filter(id => id && id !== documentToRemove);
      
      if (remainingIds.length > 0) {
        fetchDocuments(remainingIds, training?.training_type || "");
      } else {
        setDocumentsData([]);
        setLoadingDocuments(false);
      }

      // Notify parent immediately
      if (onDocumentRemove) {
        onDocumentRemove(documentToRemove);
      }

      toast.success("Document removed successfully");
    } catch (error) {
      console.error("Error removing document:", error);
      toast.error(
        error.response?.data?.detail || "Failed to remove document"
      );
    } finally {
      setDocumentToRemove(null);
    }
  };

  const openViewDocument = (id) => {
    const doc = documentsData.find((d) => d.id === id);
    if (doc && doc.url && doc.status === 'loaded') {
      setSelectedView({ url: doc.url, name: doc.name });
      setIsPdf(doc.isPdf);
      setOpenView(true);
    } else {
      toast.error("Document not loaded or unavailable. Please remove and re-upload.");
    }
  };

  const closeView = () => {
    setOpenView(false);
    setSelectedView(null);
    setIsPdf(false);
  };

  // Function to format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Cancel upload function
  const cancelUpload = (fileId) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
    
    if (uploadingFiles.length === 1) {
      setIsUploading(false);
    }
  };

  // Function to get documents to display (always show document IDs from formData, even if failed to load)
  const getDocumentsToDisplay = () => {
    const documentIds = getDocumentIds();
    
    // If we have no documents in formData, return empty
    if (documentIds.length === 0) {
      return [];
    }
    
    // If we have loaded some documents data, use that
    if (documentsData.length > 0) {
      // Ensure we have entries for all document IDs
      const docs = documentIds.map(id => {
        const existingDoc = documentsData.find(d => d.id === id);
        if (existingDoc) {
          return existingDoc;
        }
        // If we don't have data for this ID, create a placeholder
        return {
          id,
          url: null,
          name: `Document ${id.substring(0, 8)}...`,
          isPdf: false,
          status: 'unknown',
          error: 'Not loaded'
        };
      });
      return docs;
    }
    
    // If no documents data loaded yet, create placeholders
    return documentIds.map((id, index) => ({
      id,
      url: null,
      name: `Document ${index + 1}`,
      isPdf: false,
      status: 'loading',
      error: null
    }));
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
    if (officerFields?.GAD_OFFICER?.includes(fieldKey) && hasPreFilledValue(fieldKey)) {
      return `${baseClasses} bg-indigo-50 text-gray-900 border-indigo-200 cursor-not-allowed pointer-events-none dark:bg-gray-800 dark:text-white dark:border-indigo-500`;
    }
    if (isSparkField(fieldKey) && hasPreFilledValue(fieldKey)) {
      return `${baseClasses} bg-orange-50 text-gray-900 border-orange-200 cursor-not-allowed pointer-events-none dark:bg-indigo-900 dark:text-gray-200 dark:border-gray-600`;
    }
    if (disabledFields.includes(fieldKey)) {
      return `${baseClasses} bg-gray-200 text-gray-900 border-gray-300 cursor-not-allowed pointer-events-none dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600 opacity-100`;
    }
    return `${baseClasses} border-gray-300 text-gray-900 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-300`;
  };

  const hasAnyIndication = () => {
    const fieldsToCheck = ["training_type_id", "country_id", "institute_name", "subject", "place", "training_from", "training_to", "documents"];
    const hasSparkData = fieldsToCheck.some((key) => isSparkField(key) && hasPreFilledValue(key));
    const hasOfficerData = fieldsToCheck.some((key) => officerFields?.GAD_OFFICER?.includes(key) && hasPreFilledValue(key));
    return hasSparkData || hasOfficerData;
  };

  return (
    <>
      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-10">
        <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto flex items-center justify-center">
         <DialogPanel className="relative transform overflow-y-auto rounded-lg bg-white dark:bg-gray-700 dark:text-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6 max-h-[90vh]">
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <XMarkIcon className="size-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-12">
                <div className="border-b border-gray-900/10 pb-12 dark:border-gray-600">
                  <h3 className="text-lg font-bold leading-6 text-gray-900 dark:text-white mb-5">
                    TRAINING DETAILS
                  </h3>
                  {hasAnyIndication() && (
                    <div className="mb-5 flex justify-end">
                      <div className="flex items-center space-x-4 border rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-800">
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
                        Training Type <span className="text-red-500 font-semibold">*</span>
                      </label>
                      {renderSparkIndicator("training_type_id")}
                      {renderGadOfficerIndicator("training_type_id")}
                      <select
                        name="training_type_id"
                        value={formData.training_type_id}
                        onChange={handleChange}
                        disabled={isFieldDisabled("training_type_id")}
                        className={getFieldClassName("training_type_id")}
                      >
                        <option value="">Select Training Type</option>
                        {masterData.training_types.map((type) => (
                          <option key={type.training_type_id} value={type.training_type_id}>
                            {type.training_type}
                          </option>
                        ))}
                      </select>
                      {errors.training_type_id && <p className="mt-1 text-sm text-red-600">{errors.training_type_id}</p>}
                    </div>
                    <div className="sm:col-span-3 relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Country <span className="text-red-500 font-semibold">*</span>
                      </label>
                      {renderSparkIndicator("country_id")}
                      {renderGadOfficerIndicator("country_id")}
                      <select
                        name="country_id"
                        value={formData.country_id}
                        onChange={handleChange}
                        disabled={isFieldDisabled("country_id")}
                        className={getFieldClassName("country_id")}
                      >
                        <option value="">Select Country</option>
                        {masterData.countries.map((country) => (
                          <option key={country.country_id} value={country.country_id}>
                            {country.country}
                          </option>
                        ))}
                      </select>
                      {errors.country_id && <p className="mt-1 text-sm text-red-600">{errors.country_id}</p>}
                    </div>
                    <div className="sm:col-span-3 relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Institute Name <span className="text-red-500 font-semibold">*</span>
                      </label>
                      {renderSparkIndicator("institute_name")}
                      {renderGadOfficerIndicator("institute_name")}
                      <input
                        type="text"
                        name="institute_name"
                        value={formData.institute_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={isFieldDisabled("institute_name")}
                        className={getFieldClassName("institute_name")}
                      />
                      {errors.institute_name && <p className="mt-1 text-sm text-red-600">{errors.institute_name}</p>}
                    </div>
                    <div className="sm:col-span-3 relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Subject <span className="text-red-500 font-semibold">*</span>
                      </label>
                      {renderSparkIndicator("subject")}
                      {renderGadOfficerIndicator("subject")}
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={isFieldDisabled("subject")}
                        className={getFieldClassName("subject")}
                      />
                      {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
                    </div>
                    <div className="sm:col-span-3 relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Place <span className="text-red-500 font-semibold">*</span>
                      </label>
                      {renderSparkIndicator("place")}
                      {renderGadOfficerIndicator("place")}
                      <input
                        type="text"
                        name="place"
                        value={formData.place}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={isFieldDisabled("place")}
                        className={getFieldClassName("place")}
                      />
                      {errors.place && <p className="mt-1 text-sm text-red-600">{errors.place}</p>}
                    </div>
                    <div className="sm:col-span-3 relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        From Date <span className="text-red-500 font-semibold">*</span>
                      </label>
                      {renderSparkIndicator("training_from")}
                      {renderGadOfficerIndicator("training_from")}
                      <input
                        type="date"
                        name="training_from"
                        value={formData.training_from}
                        onChange={handleChange}
                        disabled={isFieldDisabled("training_from")}
                        className={getFieldClassName("training_from")}
                      />
                      {errors.training_from && <p className="mt-1 text-sm text-red-600">{errors.training_from}</p>}
                    </div>
                    <div className="sm:col-span-3 relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        To Date <span className="text-red-500 font-semibold">*</span>
                      </label>
                      {renderSparkIndicator("training_to")}
                      {renderGadOfficerIndicator("training_to")}
                      <input
                        type="date"
                        name="training_to"
                        value={formData.training_to}
                        onChange={handleChange}
                        disabled={isFieldDisabled("training_to")}
                        className={getFieldClassName("training_to")}
                      />
                      {errors.training_to && <p className="mt-1 text-sm text-red-600">{errors.training_to}</p>}
                    </div>
                    
                    {/* Improved Upload Section */}
                    <div className="sm:col-span-6">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-white">
                          Upload Documents (optional)
                        </label>
                        <span className="text-xs text-gray-500">Max 1MB each • JPG, PNG, PDF</span>
                      </div>
                      
                      {/* Upload Area - ALWAYS enabled */}
                      <div className="mt-1">
                        <div className="relative">
                          <input
                            type="file"
                            name="files"
                            multiple
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={handleChange}
                            disabled={isUploading}
                            className="hidden"
                            id="file-upload"
                          />
                          <label
                            htmlFor="file-upload"
                            className={`relative flex flex-col items-center justify-center w-full h-32 px-4 transition-all border-2 border-dashed rounded-lg cursor-pointer ${
                              isUploading 
                                ? 'bg-gray-100 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:border-gray-600'
                                : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-indigo-400 dark:bg-gray-800 dark:border-gray-600 dark:hover:border-indigo-400'
                            }`}
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              {isUploading ? (
                                <>
                                  <CloudArrowUpIcon className="w-10 h-10 mb-3 text-indigo-500 animate-pulse" />
                                  <p className="mb-1 text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold">Uploading files...</span>
                                  </p>
                                  <p className="text-xs text-gray-500">Please wait</p>
                                </>
                              ) : (
                                <>
                                  <ArrowUpTrayIcon className="w-10 h-10 mb-3 text-gray-400" />
                                  <p className="mb-1 text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold">Click to upload</span>
                                  </p>
                                  <p className="text-xs text-gray-500">JPG, PNG or PDF (MAX. 1MB each)</p>
                                </>
                              )}
                            </div>
                          </label>
                        </div>
                        
                        {/* Upload Progress Section */}
                        {uploadingFiles.length > 0 && (
                          <div className="mt-4 space-y-3">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-white">Uploading Files</h4>
                            {uploadingFiles.map((file) => (
                              <div key={file.id} className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                <div className="flex items-center space-x-3">
                                  <PaperClipIcon className="w-5 h-5 text-indigo-500" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  {file.status === 'uploading' && (
                                    <>
                                      <div className="w-24 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                        <div 
                                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                          style={{ width: `${uploadProgress[file.id] || 0}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs text-indigo-600 font-medium">
                                        {uploadProgress[file.id] || 0}%
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => cancelUpload(file.id)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <XMarkIcon className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                  {file.status === 'completed' && (
                                    <span className="text-green-600 text-xs font-medium flex items-center">
                                      ✓ Uploaded
                                    </span>
                                  )}
                                  {file.status === 'failed' && (
                                    <span className="text-red-600 text-xs font-medium">
                                      Failed
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Current Documents Section - ALWAYS SHOWN if there are document IDs */}
                        {getDocumentIds().length > 0 && (
                          <div className="mt-6">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-white">
                                Current Documents
                              </h4>
                              <span className="text-xs text-gray-500">
                                {getDocumentIds().length} document(s)
                              </span>
                            </div>
                            
                            {/* Error message if documents failed to load */}
                            {/* {documentError && (
                              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                                <div className="flex items-start">
                                  <ExclamationCircleIcon className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                      {documentError}
                                    </p>
                                   
                                  </div>
                                </div>
                              </div>
                            )} */}
                            
                            {loadingDocuments ? (
                              <div className="flex items-center justify-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                <span className="ml-3 text-sm text-gray-600 dark:text-gray-300">Loading documents...</span>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {getDocumentsToDisplay().map((doc) => (
                                  <div 
                                    key={doc.id} 
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                      doc.status === 'error' 
                                        ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
                                        : doc.status === 'loaded'
                                        ? 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600'
                                        : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                      {doc.status === 'error' ? (
                                        <ExclamationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                                      ) : doc.status === 'loaded' ? (
                                        <PaperClipIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                      ) : (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500 flex-shrink-0"></div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${
                                          doc.status === 'error' 
                                            ? 'text-red-900 dark:text-red-300' 
                                            : 'text-gray-900 dark:text-white'
                                        }`}>
                                          {doc.name}
                                          {doc.status === 'error' && ' (Failed to load)'}
                                        </p>
                                        <div className="flex items-center space-x-2 text-xs">
                                 
                                          {doc.status === 'loaded' && (
                                            <span className="text-gray-500">
                                              • {doc.isPdf ? 'PDF' : 'Image'}
                                            </span>
                                          )}
                                          {doc.status === 'error' && doc.error && (
                                            <span className="text-red-500">
                                              • {doc.error}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2 flex-shrink-0 ">
                                      {doc.status === 'loaded' && doc.url && (
                                        <button
                                          type="button"
                                          onClick={() => openViewDocument(doc.id)}
                                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 rounded-md transition-colors "
                                          title="View document"
                                        >
                                          <EyeIcon className="w-4 h-4" />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleRemove(doc.id)}
                                        className={`p-1.5 rounded-md transition-colors ${
                                          doc.status === 'error'
                                            ? 'text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300'
                                            : 'text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300'
                                        }`}
                                        title="Remove document"
                                      >
                                        <TrashIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        You can upload multiple documents. 
                      </p>
                      {errors.files && <p className="mt-1 text-sm text-red-600">{errors.files}</p>}
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-x-6">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={isUploading}
                    className="text-sm font-semibold text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className={`rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      isUploading 
                        ? 'bg-indigo-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600'
                    }`}
                  >
                    {isUploading ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </span>
                    ) : (
                      training && training.ais_tr_id ? "Save" : "Save"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Document View Modal */}
      <Dialog open={openView} onClose={closeView} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />
        <div className="fixed inset-0 z-50 w-screen overflow-y-auto flex items-center justify-center">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-700 dark:text-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6 max-w-4xl">
            <div className="absolute right-0 top-0 pr-4 pt-4">
              <button
                type="button"
                onClick={closeView}
                className="rounded-md bg-white dark:bg-gray-700 text-gray-400 hover:text-gray-500 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <XMarkIcon className="size-6" />
              </button>
            </div>
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white mb-4">
                  {selectedView?.name}
                </h3>
                <div className="mt-2 flex justify-center">
                  {isPdf ? (
                    <iframe
                      src={selectedView?.url}
                      width="100%"
                      height="500px"
                      className="border rounded-lg"
                      title="Document PDF"
                    >
                      <p>Unable to display PDF. <a href={selectedView?.url} download>Download</a></p>
                    </iframe>
                  ) : (
                    <img
                      src={selectedView?.url}
                      alt="Document"
                      className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                    />
                  )}
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Confirm Modal for Document Removal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        setIsOpen={setConfirmModalOpen}
        onConfirm={handleRemoveConfirmed}
        title="Remove Document"
        message="Are you sure you want to remove this document? This action cannot be undone."
        iconType="delete"
        confirmText="Remove"
      />
    </>
  );
}