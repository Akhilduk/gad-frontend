"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  PlusIcon,
  PencilSquareIcon,
  DocumentIcon,
  CalculatorIcon,
  CalendarIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { BoltIcon, UserIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { ModalDisabilityDetails } from "../modal/officer-disability-details";
import { toast } from "react-toastify";
import axiosInstance from "@/utils/apiClient";
import ConfirmModal from "@/app/components/confirmModal";
import { motion, AnimatePresence } from "framer-motion";
import { useProfileCompletion } from '@/contexts/Profile-completion-context';
import moment from 'moment';

export function DisabilityDetails({ profileData }) {
  const { updateSectionProgress } = useProfileCompletion();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDocumentModalOpen, setDocumentModalOpen] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [documentError, setDocumentError] = useState(null);
  const [disabilityDetails, setDisabilityDetails] = useState([]);
  const [selectedDisability, setSelectedDisability] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [masterData, setMasterData] = useState([]);
  const [sparkFields, setSparkFields] = useState(new Set());
  const [officerFields, setOfficerFields] = useState({
    GAD_OFFICER: [],
    AIS_OFFICER: [],
    DB_SPARK_API: [],
  });
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [disabilityToDelete, setDisabilityToDelete] = useState(null);

  const profileStatus = sessionStorage.getItem('profile_status');
  const isButtonDisabled = profileStatus === '2' || profileStatus === '3';

  const fields = [
    {
      key: "disability_type_id",
      display: "Disability Type",
      icon: ClipboardDocumentIcon,
      type: "master",
      masterKey: "disability_type_id",
    },
    {
      key: "disability_perc",
      display: "Disability Percentage",
      icon: CalculatorIcon,
      type: "text",
      getValue: (value) => (value ? `${value}%` : "N/A"),
    },
    {
      key: "dis_valid_up_to",
      display: "Valid Up To",
      icon: CalendarIcon,
      type: "date",
      getValue: (value) =>
      value
      ? moment(value).format("DD/MM/YYYY")
      : "N/A",
    },
    {
      key: "udid_number",
      display: "UDID Document Number",
      icon: DocumentIcon,
      type: "text",
    },
    {
      key: "disability_proof",
      display: "UDID Document",
      icon: DocumentIcon,
      type: "file",
    },
  ];

  const sourceMap = {
    DB_SPARK_API: 'SPARK',
    AIS_OFFICER: 'USER',
    GAD_OFFICER: 'GAD',
    UNKNOWN: 'USER',
  };

  const mapSparkDataToDisability = useCallback(
    (sparkData, dbDisability = []) => {
      const sparkKeys = new Set();
      let tempSparkList = [];

      if (sparkData?.disability && Array.isArray(sparkData.disability)) {
        tempSparkList = sparkData.disability.map((disability, index) => {
          const disabilityData = {
            ais_des_id: `spark_${index}`,
            disability_type_id: disability.disability_type_id || "",
            disability_perc: disability.disability_percentage || "",
            dis_valid_up_to: disability.valid_up_to || "",
            udid_number: disability.udid_number || "",
            disability_proof: disability.upload_certificate || "",
            _source: "SPARK",
            isSaved: false,
            fieldSources: {
              disability_type_id: disability.disability_type_id ? "SPARK" : "USER",
              disability_perc: disability.disability_percentage ? "SPARK" : "USER",
              dis_valid_up_to: disability.valid_up_to ? "SPARK" : "USER",
              udid_number: disability.udid_number ? "SPARK" : "USER",
              disability_proof: disability.upload_certificate ? "SPARK" : "USER",
            },
          };

          ["disability_type_id", "disability_perc", "dis_valid_up_to", "udid_number", "disability_proof"].forEach((key) => {
            if (disabilityData[key]) sparkKeys.add(`${key}_${index}`);
          });

          return disabilityData;
        });
      }

      const dbDisabilityList = dbDisability.map((dbDisability) => {
        const merged = {};
        const fieldSources = {};
        for (const src in dbDisability.fields || {}) {
          const mappedSource = sourceMap[src] || src;
          for (const key in dbDisability.fields[src] || {}) {
            merged[key] = dbDisability.fields[src][key];
            fieldSources[key] = mappedSource;
          }
        }

        return {
          ais_des_id: String(dbDisability.ais_des_id),
          disability_type_id: merged.disability_type_id || "",
          disability_perc: merged.disability_perc || "",
          dis_valid_up_to: merged.dis_valid_up_to || "",
          udid_number: merged.udid_number || "",
          disability_proof: merged.disability_proof || "",
          _source: Object.keys(fieldSources).length > 1 ? "MIXED" : Object.values(fieldSources)[0] || "USER",
          isSaved: true,
          fieldSources,
        };
      });

      const matchedSparkIndices = new Set();
      const matchedDbIds = new Set();

      dbDisabilityList.forEach((dbDisability) => {
        const matchedIndex = tempSparkList.findIndex((sparkDisability, sparkIndex) => {
          const sparkType = String(sparkDisability.disability_type_id || "").trim().toLowerCase();
          const dbType = String(dbDisability.disability_type_id || "").trim().toLowerCase();
          const sparkPerc = String(sparkDisability.disability_perc || "").trim().toLowerCase();
          const dbPerc = String(dbDisability.disability_perc || "").trim().toLowerCase();
          const sparkValid = String(sparkDisability.dis_valid_up_to || "").trim().toLowerCase();
          const dbValid = String(dbDisability.dis_valid_up_to || "").trim().toLowerCase();
          const sparkUdid = String(sparkDisability.udid_number || "").trim().toLowerCase();
          const dbUdid = String(dbDisability.udid_number || "").trim().toLowerCase();

          const isMatch =
            sparkType === dbType &&
            sparkPerc === dbPerc &&
            sparkValid === dbValid &&
            sparkUdid === dbUdid;

          if (isMatch) {
            matchedSparkIndices.add(sparkIndex);
            matchedDbIds.add(dbDisability.ais_des_id);
            tempSparkList[sparkIndex].isSaved = true;
            tempSparkList[sparkIndex].ais_des_id = String(dbDisability.ais_des_id);
            tempSparkList[sparkIndex].fieldSources = { ...tempSparkList[sparkIndex].fieldSources, ...dbDisability.fieldSources };
            tempSparkList[sparkIndex].disability_proof = dbDisability.disability_proof;
          }
          return isMatch;
        });
      });

      const finalDetails = [
        ...tempSparkList.filter((_, index) => !matchedSparkIndices.has(index)),
        ...tempSparkList.filter((_, index) => matchedSparkIndices.has(index)),
        ...dbDisabilityList.filter((dbDis) => !matchedDbIds.has(dbDis.ais_des_id)),
      ].reduce((unique, current) => {
        if (!unique.some((item) => String(item.ais_des_id) === String(current.ais_des_id))) {
          unique.push(current);
        }
        return unique;
      }, []);

      finalDetails.sort((a, b) =>
      moment(b.dis_valid_up_to || "1900-01-01").diff(moment(a.dis_valid_up_to || "1900-01-01"))
    );

      return { details: finalDetails, sparkKeys };
    },
    []
  );

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const res = await axiosInstance.get("/masters/disability-all");
        setMasterData(res.data.data.disability || []);
      } catch (err) {
        toast.error("Failed to fetch master data", {
          className: "bg-red-500 text-white",
          progressClassName: "bg-red-200",
        });
        console.error("Error fetching master data:", err);
      }
    };

    fetchMasterData();
  }, []);

  useEffect(() => {
    const storedDisability = sessionStorage.getItem('disability_details');

    if (storedDisability) {
      console.log("Loading disability details from sessionStorage");
      const parsedDisability = JSON.parse(storedDisability);
      setDisabilityDetails(parsedDisability);
      setLoading(false);
      return;
    }

    if (!profileData) return;

    console.log("Processing disability details from API data");
    const processDisabilityData = async () => {
      setLoading(true);
      try {
        const sparkData = profileData?.spark_data?.data || {};
        const officerInfo =
          profileData?.officer_data?.get_all_officer_info_by_user_id?.officer_info?.[0] || {};
        const dbDisability =
          profileData?.officer_data?.get_all_officer_info_by_user_id?.officer_disability || [];

        const officerFieldsData = {
          GAD_OFFICER: officerInfo?.fields?.GAD_OFFICER ? Object.keys(officerInfo.fields.GAD_OFFICER) : [],
          AIS_OFFICER: officerInfo?.fields?.AIS_OFFICER ? Object.keys(officerInfo.fields.AIS_OFFICER) : [],
          DB_SPARK_API: officerInfo?.fields?.DB_SPARK_API ? Object.keys(officerInfo.fields.DB_SPARK_API) : [],
        };
        setOfficerFields(officerFieldsData);

        const { details: sparkMappedDetails, sparkKeys } = mapSparkDataToDisability(sparkData, dbDisability);

        console.log("Mapped disability details:", sparkMappedDetails);

        setDisabilityDetails(sparkMappedDetails);
        setSparkFields(sparkKeys);
      } catch (error) {
        console.error("Error processing disability details:", error);
        setError("Failed to process disability details");
        toast.error("Failed to process disability details", {
          className: "bg-red-500 text-white",
          progressClassName: "bg-red-200",
        });
      } finally {
        setLoading(false);
      }
    };

    processDisabilityData();
  }, [profileData, mapSparkDataToDisability]);

  const handleDeleteClick = useCallback((disability) => {
    setDisabilityToDelete(disability);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!disabilityToDelete) return;

    const disabilityId = disabilityToDelete.ais_des_id;

    if (isButtonDisabled) {
      toast.error("Cannot delete disability details after the profile is submitted or approved", {
        className: "bg-red-500 text-white",
        progressClassName: "bg-red-200",
      });
      return;
    }

    if (typeof disabilityId === "string" && disabilityId.startsWith("spark_")) {
      setDisabilityDetails(prev => prev.filter(d => d.ais_des_id !== disabilityId));
      toast.success("Disability details removed successfully", {
        className: "bg-primary-500 text-white",
        progressClassName: "bg-primary-200",
      });
      return;
    }

    setDeleteLoading(disabilityId);
    try {
      const response = await axiosInstance.delete(`/officer/disability_officer/${disabilityId}`);

      if (response.data.success) {
        setDisabilityDetails(prev => prev.filter(d => String(d.ais_des_id) !== String(disabilityId)));

        const updatedDisabilityDetails = disabilityDetails.filter(d => String(d.ais_des_id) !== String(disabilityId));
        sessionStorage.setItem('disability_details', JSON.stringify(updatedDisabilityDetails));

        toast.success("Disability details deleted successfully", {
          className: "bg-primary-500 text-white",
          progressClassName: "bg-primary-200",
        });
      } else {
        throw new Error("Failed to delete disability details");
      }
    } catch (err) {
      console.error("Error deleting disability details:", err);
      toast.error("Failed to delete disability details", {
        className: "bg-red-500 text-white",
        progressClassName: "bg-red-200",
      });
    } finally {
      setDeleteLoading(null);
      setIsDeleteModalOpen(false);
      setDisabilityToDelete(null);
    }
  }, [isButtonDisabled, disabilityDetails, disabilityToDelete]);

  const handleSave = useCallback(
    async (updatedDisability) => {
      try {
        const isSparkEntry =
          selectedDisability?.ais_des_id &&
          typeof selectedDisability.ais_des_id === "string" &&
          selectedDisability.ais_des_id.startsWith("spark_");
        const isUpdate = selectedDisability?.ais_des_id && !isSparkEntry;
        const isNew = !selectedDisability?.ais_des_id;

        let documentId = "";
        const fileToProcess = updatedDisability.user_data.disability_proof;

        if (fileToProcess && fileToProcess instanceof File) {
          const metadata = {
            document_type: "ER-Profile",
            document_sub_type: "Disability",
            document_number: `DIS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: fileToProcess.name,
            issuing_authority: "N/A",
            issue_date: new Date().toISOString().split("T")[0],
            created_by: profileData?.user_id || "unknown",
          };

          const formData = new FormData();
          formData.append("file", fileToProcess);
          formData.append("metadata", JSON.stringify(metadata));

          const response = await axiosInstance.post("/doc-uploader/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          if (response.data.message === "Uploaded & saved") {
            documentId = response.data.document_id;
          } else {
            throw new Error(`Document upload failed for ${fileToProcess.name}`);
          }
        }

        const userDataWithDocuments = {
          disability_type_id: updatedDisability.user_data.disability_type_id || null,
          disability_perc: updatedDisability.user_data.disability_perc || null,
          dis_valid_up_to: updatedDisability.user_data.dis_valid_up_to || null,
          udid_number: updatedDisability.user_data.udid_number || null,
          disability_proof: documentId || updatedDisability.user_data.disability_proof || "",
        };

        const requestBody = {
          spark_data: updatedDisability.spark_data || null,
          user_data: userDataWithDocuments,
        };

        const newDisTypeId = String(
          requestBody.user_data.disability_type_id ??
            selectedDisability?.disability_type_id ??
            ""
        );
        const newDisPerc = requestBody.user_data.disability_perc ?? selectedDisability?.disability_perc ?? "";
        const newValidUpTo = requestBody.user_data.dis_valid_up_to ?? selectedDisability?.dis_valid_up_to ?? "";
        const newUdidNumber = requestBody.user_data.udid_number ?? selectedDisability?.udid_number ?? "";

        const hasDuplicate = disabilityDetails.some((existing) => {
          const isSelf = isUpdate && String(existing.ais_des_id) === String(selectedDisability.ais_des_id);
          return (
            !isSelf &&
            String(existing.disability_type_id || "") === newDisTypeId &&
            String(existing.disability_perc || "") === newDisPerc &&
            String(existing.dis_valid_up_to || "") === newValidUpTo &&
            String(existing.udid_number || "") === newUdidNumber &&
            existing.isSaved
          );
        });

        if (hasDuplicate) {
          toast.error("An entry with the same disability type, percentage, valid up to date and UDID number already exists.", {
            className: "bg-red-500 text-white",
            progressClassName: "bg-red-200",
          });
          return;
        }

        let response;

        if (isSparkEntry || isNew) {
          response = await axiosInstance.post("/officer/disability-officer", requestBody);
        } else if (isUpdate) {
          response = await axiosInstance.put(
            `/officer/disability-officer/${selectedDisability.ais_des_id}`,
            requestBody
          );
        }

        if (response.data.success) {
          const savedDisability = response.data.data.disability_info;
          // const fieldSources = {
          //   disability_type_id: requestBody.user_data.disability_type_id ? "USER" : savedDisability.disability_type_id ? "SPARK" : "USER",
          //   disability_perc: requestBody.user_data.disability_perc ? "USER" : savedDisability.disability_perc ? "SPARK" : "USER",
          //   dis_valid_up_to: requestBody.user_data.dis_valid_up_to ? "USER" : savedDisability.dis_valid_up_to ? "SPARK" : "USER",
          //   udid_number: requestBody.user_data.udid_number ? "USER" : savedDisability.udid_number ? "SPARK" : "USER",
          //   disability_proof: documentId || requestBody.user_data.disability_proof ? "USER" : savedDisability.disability_proof ? "SPARK" : "USER",
          // };


          // --- FIXED: Preserve original fieldSources ---
        const originalFieldSources = selectedDisability?.fieldSources || {};
        const updatedFieldSources = { ...originalFieldSources };  // Start with originals (keeps GAD)

        // --- FIXED: Identify actually updated keys ---
        const userUpdatedKeys = Object.keys(updatedDisability.user_data || {}).filter(
          (key) => updatedDisability.user_data[key] !== undefined && updatedDisability.user_data[key] !== null
        );

        // --- FIXED: Only set to "USER" for updated fields ---
        userUpdatedKeys.forEach((key) => {
          updatedFieldSources[key] = "USER";
        });

        // --- FIXED: Special handling for document (only "USER" if new upload) ---
        if (documentId) {  // Equivalent to isNewDoc in Awards
          updatedFieldSources.disability_proof = "USER";
        } else if (updatedDisability.user_data?.disability_proof && typeof updatedDisability.user_data.disability_proof === "string") {
          updatedFieldSources.disability_proof = "USER";  // If existing doc ID provided by user
        }

        // --- FIXED: Preserve "SPARK" if not updated and matches spark_data ---
        if (updatedDisability.spark_data) {
          const spark = updatedDisability.spark_data;
          if (
            !userUpdatedKeys.includes("disability_type_id") &&
            savedDisability.disability_type_id === spark.disability_type_id
          ) {
            updatedFieldSources.disability_type_id = "SPARK";
          }
          if (
            !userUpdatedKeys.includes("disability_perc") &&
            savedDisability.disability_perc === spark.disability_percentage
          ) {
            updatedFieldSources.disability_perc = "SPARK";
          }
          if (
            !userUpdatedKeys.includes("dis_valid_up_to") &&
            savedDisability.dis_valid_up_to === spark.valid_up_to
          ) {
            updatedFieldSources.dis_valid_up_to = "SPARK";
          }
          if (
            !userUpdatedKeys.includes("udid_number") &&
            savedDisability.udid_number === spark.udid_number
          ) {
            updatedFieldSources.udid_number = "SPARK";
          }
          if (
            !userUpdatedKeys.includes("disability_proof") &&
            savedDisability.disability_proof === spark.upload_certificate
          ) {
            updatedFieldSources.disability_proof = "SPARK";
          }
        }

          // --- UPDATED: Use the fixed fieldSources in the new data ---
        const updatedDisabilityData = {
          ais_des_id: String(savedDisability.ais_des_id),
          disability_type_id: savedDisability.disability_type_id || "",
          disability_perc: savedDisability.disability_perc || "",
          dis_valid_up_to: savedDisability.dis_valid_up_to || "",
          udid_number: savedDisability.udid_number || "",
          disability_proof: savedDisability.disability_proof || "",
          _source: Object.values(updatedFieldSources).some((s) => s !== "USER") ? "MIXED" : "USER",  // Improved: Better detect MIXED
          isSaved: true,
          fieldSources: updatedFieldSources,
        };

          setDisabilityDetails((prevData = []) => {
            let newDisabilityDetails;
            if (isSparkEntry) {
              newDisabilityDetails = [
                ...prevData.filter((d) => String(d.ais_des_id) !== String(selectedDisability.ais_des_id)),
                updatedDisabilityData,
              ];
            } else if (isUpdate) {
              newDisabilityDetails = prevData.map((disability) =>
                String(disability.ais_des_id) === String(selectedDisability.ais_des_id)
                  ? updatedDisabilityData
                  : disability
              );
            } else {
              newDisabilityDetails = [...prevData, updatedDisabilityData];
            }

            sessionStorage.setItem('disability_details', JSON.stringify(newDisabilityDetails));
            return newDisabilityDetails;
          });

          setSparkFields((prev) => {
            const newSparkFields = new Set(prev);
            if (isSparkEntry) {
              const index = parseInt(selectedDisability.ais_des_id.split("_")[1]);
              ["disability_type_id", "disability_perc", "dis_valid_up_to", "udid_number", "disability_proof"].forEach((key) => {
                newSparkFields.delete(`${key}_${index}`);
              });
            }
            return newSparkFields;
          });

          setModalOpen(false);
          setSelectedDisability(null);
          toast.success(
            isUpdate ? "Disability details updated successfully" : "Disability details added successfully",
            {
              className: "bg-primary-500 text-white",
              progressClassName: "bg-primary-200",
            }
          );
        } else {
          toast.error("Failed to save disability details", {
            className: "bg-red-500 text-white",
            progressClassName: "bg-red-200",
          });
        }
      } catch (err) {
        let errorMsg = "Failed to save disability details";

        if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
          const details = err.response.data.detail;

          if (details.some((d) => d.includes("Invalid file content type"))) {
            errorMsg = "Invalid file type. Allowed types are PDF, JPEG, PNG, DOC, DOCX.";
          } else if (details.some((d) => d.includes("File extension"))) {
            errorMsg = "File extension does not match the actual file type. Please check your file.";
          } else {
            errorMsg = details.join(" ");
          }
        }

        toast.error(errorMsg, {
          className: "bg-red-500 text-white",
          progressClassName: "bg-red-200",
        });
      }
    },
    [selectedDisability, profileData, disabilityDetails]
  );

  const handleEdit = useCallback(
    (disability) => (e) => {
      e.stopPropagation();
      if (isButtonDisabled) return;
      setSelectedDisability(disability);
      setModalOpen(true);
    },
    [isButtonDisabled]
  );

  const handleAdd = useCallback(
    (e) => {
      e.stopPropagation();
      if (isButtonDisabled) return;
      setSelectedDisability({
        ais_des_id: null,
        disability_type_id: "",
        disability_perc: "",
        dis_valid_up_to: "",
        udid_number: "",
        disability_proof: "",
        _source: "USER",
        isSaved: false,
        fieldSources: {
          disability_type_id: "USER",
          disability_perc: "USER",
          dis_valid_up_to: "USER",
          udid_number: "USER",
          disability_proof: "USER",
        },
      });
      setModalOpen(true);
    },
    [isButtonDisabled]
  );

  const renderAddButton = () => {
    if (sessionStorage.getItem('role_id') !== '2') return null;
    return (
      <div className="relative group">
        <button
          className={`px-2 py-2 rounded-md flex items-center gap-2 text-[0.875rem] font-medium self-end sm:self-center transition-colors ${
            isButtonDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
          }`}
          onClick={handleAdd}
          disabled={isButtonDisabled}
        >
          <PlusIcon className="w-4 h-4" strokeWidth={2} />
          <span>Add Disability</span>
        </button>
        {isButtonDisabled && (
          <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            Cannot add disability details after the profile is submitted or approved
          </div>
        )}
      </div>
    );
  };

  const renderEditButton = (disability) => {
    if (sessionStorage.getItem('role_id') !== '2') return null;
    return (
      <div className="relative group">
        <button
          className={`${
            isButtonDisabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400'
          }`}
          onClick={handleEdit(disability)}
          disabled={isButtonDisabled}
        >
          <PencilSquareIcon className="w-4 h-4" strokeWidth={2} />
        </button>
        <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          {isButtonDisabled ? 'Cannot edit disability details after the profile is submitted or approved' : 'Edit'}
        </div>
      </div>
    );
  };

  const renderDeleteButton = (disability) => {
    if (sessionStorage.getItem('role_id') !== '2') return null;

    const hasSparkData = Object.values(disability.fieldSources || {}).some(
      (source) => source === "SPARK"
    );

    if (hasSparkData) return null;

    const isLoading = deleteLoading === disability.ais_des_id;

    return (
      <div className="relative group">
        <button
          className={`${
            isButtonDisabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-red-600 hover:text-red-500 dark:hover:text-red-400'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => handleDeleteClick(disability)}
          disabled={isButtonDisabled || isLoading}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-t-2 border-b-2 border-red-600 rounded-full animate-spin"></div>
          ) : (
            <TrashIcon className="w-4 h-4" strokeWidth={2} />
          )}
        </button>
        <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          {isButtonDisabled ? 'Cannot delete disability details after the profile is submitted or approved' : 'Delete'}
        </div>
      </div>
    );
  };

  const openDocumentModal = useCallback(async (documentId) => {
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
      toast.error("Failed to load document", {
        className: "bg-red-500 text-white",
        progressClassName: "bg-red-200",
      });
    } finally {
      setLoadingDocument(false);
    }
  }, []);

  const closeDocumentModal = () => {
    setDocumentModalOpen(false);
    setDocumentData(null);
    setDocumentError(null);
  };

  const getMasterValue = (id, key) => {
    if (!id) return "N/A";
    if (key === "disability_type_id") {
      const match = masterData.find((item) => String(item.disability_id) === String(id));
      return match ? match.disability : id;
    }
    return "N/A";
  };

  const renderDocumentButton = (documentId) => {
    if (!documentId) return "No document uploaded";
    return (
      <span>
        <button
          onClick={() => openDocumentModal(documentId)}
          className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 px-2 py-0.5 mt-1 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition transform shadow-sm inline-flex items-center gap-1 text-sm"
        >
          <DocumentIcon className="w-4 h-4" />
          View Document
        </button>
      </span>
    );
  };

  useEffect(() => {
    if (!loading && disabilityDetails) {
      const total = disabilityDetails.length;
      const completed = disabilityDetails.filter((d) => d.isSaved).length;
      updateSectionProgress('disability', total === 0 ? 0 : completed, total === 0 ? 0 : total);
    }
  }, [loading, updateSectionProgress, disabilityDetails]);

  const getDisabilityStatus = (validUpTo) => {
    if (!validUpTo) return "N/A";
    const today = moment();
    const validDate = moment(validUpTo);
    return today.isSameOrBefore(validDate) ? "Valid" : "Expired";
  };

  const renderSparkIndicator = (fieldKey, fieldSource) => {
    if (fieldSource !== "SPARK") return null;
    return (
      <div className="absolute top-2 right-2 group">
        <span
          className="inline-flex items-center p-0.5 rounded-full bg-orange-100 text-orange-600 text-[8px]"
          aria-label="Synced from SPARK"
        >
          <BoltIcon className="w-2 h-2" />
        </span>
        <div className="absolute right-0 top-full mt-0.5 hidden group-hover:block z-10">
          <div className="bg-gray-800 text-white text-xs rounded px-1 py-0.5 whitespace-nowrap">
            Synced from SPARK
          </div>
        </div>
      </div>
    );
  };

  const renderUserIndicator = (fieldKey, fieldSource) => {
    if (fieldSource !== "USER") return null;
    return (
      <div className="absolute top-2 right-2 group">
        <span
          className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-[8px]"
          aria-label="User Entered"
        >
          <UserIcon className="w-2 h-2" />
        </span>
        <div className="absolute right-0 top-full mt-0.5 hidden group-hover:block z-10">
          <div className="bg-gray-800 text-white text-xs rounded px-1 py-0.5 whitespace-nowrap">
            User Entered
          </div>
        </div>
      </div>
    );
  };

  const renderGadIndicator = (fieldKey, fieldSource) => {
    if (fieldSource !== "GAD") return null;
    return (
      <div className="absolute top-2 right-6 group">
        <span
          className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-[8px]"
          aria-label="Sourced by AS Officer"
        >
          <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3" />
          </svg>
        </span>
        <div className="absolute right-0 top-full mt-0.5 hidden group-hover:block z-10">
          <div className="bg-gray-800 text-white text-xs rounded px-1 py-0.5 whitespace-nowrap">
            Updated by AS-II
          </div>
        </div>
      </div>
    );
  };

  const renderSavedIndicator = (isSaved) => {
    return (
      <div className="absolute top-5 left-4 group">
        <span
          className={`inline-flex items-center rounded-full ${
            isSaved ? "text-green-600" : "text-red-600"
          } text-xs`}
          aria-label={isSaved ? "Saved" : "Not Saved"}
        >
          {isSaved ? (
            <CheckCircleIcon className="w-4 h-4" strokeWidth={2} />
          ) : (
            <ExclamationTriangleIcon className="w-4 h-4" strokeWidth={2} />
          )}
        </span>
        <div className="absolute left-0 top-full mt-0.5 hidden group-hover:block z-10">
          <div className="bg-gray-800 text-white text-xs rounded px-1 py-0.5 whitespace-nowrap">
            {isSaved ? "Saved" : "Not Saved"}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-2 mx-auto w-full bg-white dark:bg-gray-900">
      <div className="flex flex-col sm:flex-row sm:justify-between items-center my-5 gap-4">
        <div className="flex flex-wrap items-center border rounded-md px-3 py-2 bg-white dark:bg-gray-800 gap-3">
          <div className="flex items-center space-x-2 min-w-[120px]">
            <span className="inline-flex items-center p-0.5 rounded-full bg-orange-100 text-orange-600 text-xs">
              <BoltIcon className="w-2 h-2" />
            </span>
            <span className="text-sm text-gray-700 dark:text-white">Synced from SPARK</span>
          </div>
          <div className="flex items-center space-x-2 min-w-[120px]">
            <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-xs">
              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" />
              </svg>
            </span>
            <span className="text-sm text-gray-700 dark:text-white">Updated by AS-II</span>
          </div>
          <div className="flex items-center space-x-2 min-w-[120px]">
            <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-xs">
              <UserIcon className="w-2 h-2" />
            </span>
            <span className="text-sm text-gray-700 dark:text-white">User Entered</span>
          </div>
          <div className="flex items-center space-x-2 min-w-[120px]">
            <span className="inline-flex items-center rounded-full text-green-600 text-xs">
              <CheckCircleIcon className="w-4 h-4" strokeWidth={2} />
            </span>
            <span className="text-sm text-gray-700 dark:text-white">Saved</span>
          </div>
          <div className="flex items-center space-x-2 min-w-[120px]">
            <span className="inline-flex items-center rounded-full text-red-600 text-xs">
              <ExclamationTriangleIcon className="w-4 h-4" strokeWidth={2} />
            </span>
            <span className="text-sm text-gray-700 dark:text-white">Not Saved</span>
          </div>
        </div>
        {renderAddButton()}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center p-3 rounded-md bg-red-50 dark:bg-red-900/30 text-sm">
          {error}
        </div>
      ) : disabilityDetails.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-6">
          {disabilityDetails.map((disability) => {
            const status = getDisabilityStatus(disability.dis_valid_up_to);
            const statusStyles = {
              Valid: "bg-green-600 border-green-600",
              Expired: "bg-red-700 border-red-700",
              "N/A": "bg-gray-600 border-gray-600",
            };
            return (
              <div
                key={disability.ais_des_id}
                className="relative bg-gray-50 dark:bg-gray-800 border border-indigo-300 dark:border-indigo-600 rounded-md p-3 shadow-sm"
              >
                {renderSavedIndicator(disability.isSaved)}
                <span
                  className={`absolute top-[-10px] left-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white shadow-sm border ${statusStyles[status]}`}
                >
                  {status}
                </span>
                <div className="flex items-center justify-end my-1 gap-2">
                  {renderEditButton(disability)}
                  {renderDeleteButton(disability)}
                </div>
                <div className="space-y-2 mt-6">
                  {fields.map((field) => (
                    <div
                      key={field.key}
                      className="relative flex items-start gap-2 bg-white dark:bg-gray-700 rounded-lg p-2 border border-gray-200 dark:border-gray-600"
                    >
                      {renderSparkIndicator(field.key, disability.fieldSources?.[field.key])}
                      {renderUserIndicator(field.key, disability.fieldSources?.[field.key])}
                      {renderGadIndicator(field.key, disability.fieldSources?.[field.key])}
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mt-0.5">
                        <field.icon className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{field.display}</p>
                        <p
                          className={`text-sm font-bold text-gray-900 dark:text-white ${
                            field.type !== "file" ? 'break-words line-clamp-5' : ''
                          }`}
                        >
                          {field.type === "file"
                            ? renderDocumentButton(disability[field.key])
                            : field.type === "master"
                            ? getMasterValue(disability[field.key], field.masterKey)
                            : field.getValue
                            ? field.getValue(disability[field.key])
                            : disability[field.key] || "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-gray-500 dark:text-gray-400 text-sm text-center py-3">
          No Disability Details Available.
        </div>
      )}

      <ModalDisabilityDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        disabilityDetails={selectedDisability}
        onSave={handleSave}
        masterData={masterData}
        sparkFields={sparkFields}
        officerFields={officerFields}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Disability Details"
        message={`Are you sure you want to delete "${
          disabilityToDelete
            ? getMasterValue(disabilityToDelete.disability_type_id, "disability_type_id") || "this disability"
            : "this disability"
        }"? This action cannot be undone.`}
        iconType="delete"
        confirmText="Delete"
      />

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isDocumentModalOpen && documentData && (
              <motion.div
                className="fixed inset-0 z-[200] overflow-y-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <motion.div
                    className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 transition-opacity"
                    onClick={closeDocumentModal}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  ></motion.div>
                  <motion.div
                    className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:w-full sm:max-w-4xl sm:p-6"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="absolute right-0 top-0 pr-4 pt-4">
                      <button
                        type="button"
                        className="rounded-md bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-200"
                        onClick={closeDocumentModal}
                      >
                        <XMarkIcon className="h-6 w-6" strokeWidth={2} />
                      </button>
                    </div>
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                        <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100 mb-4">
                          {documentData.name}
                        </h3>
                        {loadingDocument ? (
                          <div className="flex justify-center items-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
                          </div>
                        ) : documentError ? (
                          <div className="text-red-500 text-center p-3 rounded-md bg-red-50 dark:bg-red-900/30 text-sm">
                            {documentError}
                          </div>
                        ) : (
                          <div className="mt-2">
                            {documentData.isPdf ? (
                              <object
                                data={documentData.url}
                                type="application/pdf"
                                width="100%"
                                height="500px"
                                className="rounded-lg shadow-lg"
                              >
                                <p className="text-gray-500 dark:text-gray-400">
                                  Unable to display PDF file.
                                </p>
                              </object>
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
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
