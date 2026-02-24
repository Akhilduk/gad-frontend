"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  PlusIcon,
  PencilSquareIcon,
  BookOpenIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  DocumentIcon,
  XMarkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { BoltIcon, UserIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { ModalAwardsAndPublications } from "../modal/awards-and-publications";
import { toast } from "react-toastify";
import axiosInstance from "@/utils/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import { useProfileCompletion } from '@/contexts/Profile-completion-context';
import ConfirmModal from "@/app/components/confirmModal";
import moment from 'moment';

// Helper function to safely format dates using moment.js
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = moment(dateString);
  // Check if date is valid
  if (!date.isValid()) return 'N/A';
  
  return date.format('MMMM D, YYYY');
};

export function AwardsAndPublications({ profileData }) {
  const { updateSectionProgress } = useProfileCompletion();
  const [isModalOpen, setModalOpen] = useState(false);
  const [awardsList, setAwardsList] = useState([]);
  const [selectedAward, setSelectedAward] = useState(null);
  const [isDocumentModalOpen, setDocumentModalOpen] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [documentError, setDocumentError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sparkFields, setSparkFields] = useState(new Set());
  
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [awardToDelete, setAwardToDelete] = useState(null);
  
  const profileStatus = sessionStorage.getItem('profile_status');
  const isButtonDisabled = profileStatus === '2' || profileStatus === '3';
  const [officerFields, setOfficerFields] = useState({
    GAD_OFFICER: [],
    AIS_OFFICER: [],
    DB_SPARK_API: [],
    UNKNOWN: [],
  });

  const fields = [
    {
      key: "rew_name",
      display: "Award Name",
      icon: BookOpenIcon,
      type: "text",
    },
    {
      key: "reward_type",
      display: "Award Category",
      icon: BookOpenIcon,
      type: "text",
      getValue: (value) => value || "Not specified",
    },
    {
      key: "rew_from",
      display: "Awarded By",
      icon: UserGroupIcon,
      type: "text",
    },
    {
      key: "received_on",
      display: "Award Received Date",
      icon: CalendarIcon,
      type: "date",
      getValue: (value) => formatDate(value),
    },
    {
      key: "rew_description",
      display: "Description",
      icon: DocumentTextIcon,
      type: "text",
    },
    {
      key: "reward_doc",
      display: "Supporting Document",
      icon: DocumentIcon,
      type: "file",
    },
  ];

  const mapSparkDataToAwards = useCallback(
    (sparkData, dbAwards = []) => {
      if (!sparkData || !sparkData.awards) return { details: [], sparkKeys: new Set() };

      const sparkKeys = new Set();
      const tempSparkList = sparkData.awards.map((award, index) => {
        const awardData = {
          ais_rew_id: `spark_${index}`,
          rew_name: award.nature ? String(award.nature).trim() : "",
          rew_from: (award.office || award.department || "").trim(),
          received_on: "",
          rew_description: award.purpose ? String(award.purpose).trim() : "",
          reward_doc: award.upload_certificate || "",
          _source: "SPARK",
          isSaved: false,
          fieldSources: {
            rew_name: award.nature ? "SPARK" : "USER",
            reward_type: "USER",
            rew_from: award.office || award.department ? "SPARK" : "USER",
            received_on: "USER",
            rew_description: award.purpose ? "SPARK" : "USER",
            reward_doc: award.upload_certificate ? "SPARK" : "USER",
          },
        };

        if (award.nature) sparkKeys.add(`rew_name_${index}`);
        if (award.office || award.department) sparkKeys.add(`rew_from_${index}`);
        if (award.purpose) sparkKeys.add(`rew_description_${index}`);
        if (award.upload_certificate) sparkKeys.add(`reward_doc_${index}`);

        return awardData;
      });

      const dbAwardsList = dbAwards.map((dbAward) => {
        const merged = {
          rew_name: "",
          reward_type: "",
          rew_from: "",
          received_on: "",
          rew_description: "",
          reward_doc: "",
        };
        const fieldSources = {
          rew_name: "USER",
          reward_type: "USER",
          rew_from: "USER",
          received_on: "USER",
          rew_description: "USER",
          reward_doc: "USER",
        };

        for (const src in dbAward.fields) {
          const mappedSource = sourceMap[src] || "USER";
          const sourceFields = dbAward.fields[src] || {};
          for (const key of fields.map((f) => f.key)) {
            if (sourceFields[key] && String(sourceFields[key]).trim()) {
              merged[key] = String(sourceFields[key]).trim();
              fieldSources[key] = mappedSource;
            }
          }
        }

        return {
          ais_rew_id: String(dbAward.ais_rew_id),
          rew_name: merged.rew_name,
          reward_type: merged.reward_type,
          rew_from: merged.rew_from,
          received_on: merged.received_on,
          rew_description: merged.rew_description,
          reward_doc: merged.reward_doc,
          _source: Object.values(fieldSources).some((s) => s !== "USER") ? "MIXED" : "USER",
          isSaved: true,
          fieldSources,
        };
      });

      const matchedSparkIndices = new Set();
      const matchedDbIds = new Set();

      dbAwardsList.forEach((dbAward) => {
        const matchedIndex = tempSparkList.findIndex((sparkAward, sparkIndex) => {
          const sparkName = String(sparkAward.rew_name || "").trim().toLowerCase();
          const dbName = String(dbAward.rew_name || "").trim().toLowerCase();

          const isMatch = sparkName == dbName;
          if (isMatch) {
            matchedSparkIndices.add(sparkIndex);
            matchedDbIds.add(dbAward.ais_rew_id);
            tempSparkList[sparkIndex].isSaved = true;
            tempSparkList[sparkIndex].ais_rew_id = String(dbAward.ais_rew_id);
            tempSparkList[sparkIndex].fieldSources = { ...tempSparkList[sparkIndex].fieldSources, ...dbAward.fieldSources };
            tempSparkList[sparkIndex].received_on = dbAward.received_on;
            tempSparkList[sparkIndex].reward_type = dbAward.reward_type;
            tempSparkList[sparkIndex].reward_doc = dbAward.reward_doc;
            tempSparkList[sparkIndex]._source = dbAward._source;
          }
          return isMatch;
        });
      });

      const finalDetails = [
        ...tempSparkList.filter((_, index) => !matchedSparkIndices.has(index)),
        ...tempSparkList.filter((_, index) => matchedSparkIndices.has(index)),
        ...dbAwardsList.filter((dbAward) => !matchedDbIds.has(dbAward.ais_rew_id)),
      ].reduce((unique, current) => {
        if (!unique.some((item) => String(item.ais_rew_id) === String(current.ais_rew_id))) {
          unique.push(current);
        }
        return unique;
      }, []);

      finalDetails.sort((a, b) => {
        const dateA = moment(a.received_on || "1900-01-01");
        const dateB = moment(b.received_on || "1900-01-01");
        return dateB.valueOf() - dateA.valueOf();
      });
      return { details: finalDetails, sparkKeys };
    },
    []
  );

  useEffect(() => {
    const storedAwards = sessionStorage.getItem('awards_and_publications');
    
    if (storedAwards) {
      console.log("Loading awards from sessionStorage");
      const parsedAwards = JSON.parse(storedAwards);
      setAwardsList(parsedAwards);
      setLoading(false);
      return;
    }
    
    if (!profileData) return;

    console.log("Processing awards from API data");
    const processAwardsData = async () => {
      setLoading(true);
      try {
        const sparkData = profileData.spark_data?.data || {};
        const officerInfo =
          profileData.officer_data?.get_all_officer_info_by_user_id?.officer_info?.[0] || {};
        const dbAwards =
          profileData.officer_data?.get_all_officer_info_by_user_id?.rewards || [];

        const officerFieldsData = {
          GAD_OFFICER: officerInfo?.fields?.GAD_OFFICER
            ? Object.keys(officerInfo.fields.GAD_OFFICER)
            : [],
          AIS_OFFICER: officerInfo?.fields?.AIS_OFFICER
            ? Object.keys(officerInfo.fields.AIS_OFFICER)
            : [],
          DB_SPARK_API: officerInfo?.fields?.DB_SPARK_API
            ? Object.keys(officerInfo.fields.DB_SPARK_API)
            : [],
          UNKNOWN: officerInfo?.fields?.UNKNOWN
            ? Object.keys(officerInfo.fields.UNKNOWN)
            : [],
        };
        setOfficerFields(officerFieldsData);

        const { details: sparkMappedDetails, sparkKeys } = mapSparkDataToAwards(
          sparkData,
          dbAwards
        );

        console.log("Mapped awards:", sparkMappedDetails);
        
        setAwardsList(sparkMappedDetails);
        setSparkFields(sparkKeys);
        
      } catch (error) {
        console.error("Error processing awards:", error);
        setError("Failed to process awards data");
        toast.error("Failed to process awards data", {
          className: "bg-red-500 text-white",
          progressClassName: "bg-red-200",
        });
      } finally {
        setLoading(false);
      }
    };

    processAwardsData();
  }, [profileData, mapSparkDataToAwards]);

  const handleAdd = useCallback(() => {
    setSelectedAward({
      ais_rew_id: null,
      rew_name: "",
      reward_type: "",
      rew_from: "",
      received_on: "",
      rew_description: "",
      reward_doc: "",
      _source: "USER",
      isSaved: false,
      fieldSources: {
        rew_name: "USER",
        reward_type: "USER",
        rew_from: "USER",
        received_on: "USER",
        rew_description: "USER",
        reward_doc: "USER",
      },
    });
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((award) => {
    setSelectedAward(award);
    setModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((award) => {
    setAwardToDelete(award);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!awardToDelete) return;

    const awardId = awardToDelete.ais_rew_id;

    if (isButtonDisabled) {
      toast.error("cannot delete award after the profile is submitted or approved", {
        className: "bg-red-500 text-white",
        progressClassName: "bg-red-200",
      });
      return;
    }

    console.log("Delete award with ID:", awardId);

    setDeleteLoading(awardId);
    try {
      if (typeof awardId === "string" && awardId.startsWith("spark_")) {
        let updatedList;
        setAwardsList((prev) => {
          updatedList = prev.filter((q) => q.ais_rew_id !== awardId);
          return updatedList;
        });
        sessionStorage.setItem('awards_and_publications', JSON.stringify(updatedList));
        toast.success("Award removed successfully", {
          className: "bg-primary-500 text-white",
          progressClassName: "bg-primary-200",
        });
        return;
      }

      const response = await axiosInstance.delete(`/officer/awards_delete/${awardId}`);

      if (response.data.success) {
        let updatedList;
        setAwardsList((prev) => {
          updatedList = prev.filter((q) => String(q.ais_rew_id) !== String(awardId));
          return updatedList;
        });

        sessionStorage.setItem('awards_and_publications', JSON.stringify(updatedList));

        toast.success("Award deleted Successfully", {
          className: "bg-primary-500 text-white",
          progressClassName: "bg-primary-200",
        });
      } else {
        throw new Error("Failed to delete award");
      }
    } catch (err) {
      console.error("Error deleting award:", err);
      toast.error("Failed to delete award", {
        className: "bg-red-500 text-white",
        progressClassName: "bg-red-200",
      });
    } finally {
      setDeleteLoading(null);
      setIsDeleteModalOpen(false);
      setAwardToDelete(null);
    }
  }, [isButtonDisabled, awardsList, awardToDelete]);

  const sourceMap = {
    DB_SPARK_API: "SPARK",
    AIS_OFFICER: "USER",
    GAD_OFFICER: "GAD",
    UNKNOWN: "USER",
  };

  const handleAddOrUpdate = useCallback(
    async (updatedData) => {
      try {
        const isSparkEntry =
          selectedAward &&
          selectedAward.ais_rew_id &&
          typeof selectedAward.ais_rew_id === "string" &&
          selectedAward.ais_rew_id.startsWith("spark_");
        const isUpdate =
          selectedAward &&
          selectedAward.ais_rew_id &&
          !isSparkEntry;
        const isNew = !selectedAward || !selectedAward.ais_rew_id;

        // UPDATED DUPLICATE CHECK: Removed rew_description and added reward_type
        const newRewName = String(updatedData.user_data.rew_name ?? selectedAward?.rew_name ?? "").trim().toLowerCase();
        const newRewardType = String(updatedData.user_data.reward_type ?? selectedAward?.reward_type ?? "").trim().toLowerCase();
        const newRewFrom = String(updatedData.user_data.rew_from ?? selectedAward?.rew_from ?? "").trim().toLowerCase();
        const newReceivedOn = String(updatedData.user_data.received_on ?? selectedAward?.received_on ?? "").trim().toLowerCase();

        const hasDuplicate = awardsList.some((existing) => {
          const isSelf = isUpdate && String(existing.ais_rew_id) === String(selectedAward.ais_rew_id);
          return (
            !isSelf &&
            String(existing.rew_name || "").trim().toLowerCase() === newRewName &&
            String(existing.reward_type || "").trim().toLowerCase() === newRewardType &&
            String(existing.rew_from || "").trim().toLowerCase() === newRewFrom &&
            String(existing.received_on || "").trim().toLowerCase() === newReceivedOn &&
            existing.isSaved
          );
        });

        if (hasDuplicate) {
          toast.error("An entry with the same award name, category, awarded by, and received date already exists.", {
            className: "bg-red-500 text-white",
            progressClassName: "bg-red-200",
          });
          return;
        }

        let documentIds = [];
        const filesToProcess = [];
        let rewardDocId = "";

        if (updatedData.user_data?.reward_doc instanceof File) {
          filesToProcess.push(updatedData.user_data.reward_doc);
        } else if (updatedData.user_data?.reward_doc) {
          rewardDocId = updatedData.user_data.reward_doc;
        } else if (updatedData.spark_data?.reward_doc) {
          rewardDocId = updatedData.spark_data.reward_doc;
        }

        if (filesToProcess.length > 0) {
          const documentPromises = filesToProcess.map(async (file) => {
            const metadata = {
              document_type: "ER-Profile",
              document_sub_type: "Awards",
              document_number: `TRN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: file.name,
              issuing_authority: "N/A",
              issue_date: new Date().toISOString().split("T")[0],
              created_by: profileData?.user_id || "unknown",
            };

            const formData = new FormData();
            formData.append("file", file);
            formData.append("metadata", JSON.stringify(metadata));

            const response = await axiosInstance.post("/doc-uploader/upload", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.data.message === "Uploaded & saved") {
              return response.data.document_id;
            }
            throw new Error(`Document upload failed for ${file.name}`);
          });

          documentIds = await Promise.all(documentPromises);
        }

        const userDataWithDocuments = {
          rew_name: updatedData.user_data.rew_name || null,
          reward_type: updatedData.user_data.reward_type || null,
          rew_from: updatedData.user_data.rew_from || null,
          received_on: updatedData.user_data.received_on || null,
          rew_description: updatedData.user_data.rew_description || null,
          reward_doc: documentIds.length > 0 ? documentIds.join(",") : rewardDocId,
        };

        const requestBody = {
          spark_data: updatedData.spark_data || null,
          user_data: userDataWithDocuments,
        };

        let response;

        if (isSparkEntry || isNew) {
          response = await axiosInstance.post("/officer/award-info", requestBody);
        } else if (isUpdate) {
          response = await axiosInstance.put(
            `/officer/award-info/${selectedAward.ais_rew_id}`,
            requestBody
          );
        }

        if (response.data.success) {
          const savedAward = response.data.data.award_info || {};
          const isNewDoc = documentIds.length > 0;

          const originalFieldSources = selectedAward?.fieldSources || {};
          const updatedFieldSources = { ...originalFieldSources };

          const userUpdatedKeys = Object.keys(updatedData.user_data || {}).filter(
            (key) => updatedData.user_data[key] !== undefined && updatedData.user_data[key] !== null
          );

          userUpdatedKeys.forEach((key) => {
            if (key !== "reward_doc" || isNewDoc) {
              updatedFieldSources[key] = "USER";
            }
          });

          if (isNewDoc) {
            updatedFieldSources.reward_doc = "USER";
          } else if (updatedData.user_data?.reward_doc && typeof updatedData.user_data.reward_doc === "string") {
            updatedFieldSources.reward_doc = "USER";
          }

          if (updatedData.spark_data) {
            if (
              !userUpdatedKeys.includes("rew_name") &&
              savedAward.rew_name === updatedData.spark_data.nature
            ) {
              updatedFieldSources.rew_name = "SPARK";
            }
            if (
              !userUpdatedKeys.includes("rew_from") &&
              savedAward.rew_from === (updatedData.spark_data.office || updatedData.spark_data.department)
            ) {
              updatedFieldSources.rew_from = "SPARK";
            }
            if (
              !userUpdatedKeys.includes("rew_description") &&
              savedAward.rew_description === updatedData.spark_data.purpose
            ) {
              updatedFieldSources.rew_description = "SPARK";
            }
            if (
              !userUpdatedKeys.includes("reward_doc") &&
              savedAward.reward_doc === updatedData.spark_data.upload_certificate
            ) {
              updatedFieldSources.reward_doc = "SPARK";
            }
          }

          const updatedAward = {
            ais_rew_id: String(savedAward.ais_rew_id || selectedAward?.ais_rew_id || ""),
            rew_name: savedAward.rew_name || "",
            reward_type: savedAward.reward_type || "",
            rew_from: savedAward.rew_from || "",
            received_on: savedAward.received_on || "",
            rew_description: savedAward.rew_description || "",
            reward_doc: savedAward.reward_doc || "",
            _source: userUpdatedKeys.length > 0 ? "USER" : selectedAward?._source || "MIXED",
            isSaved: true,
            fieldSources: updatedFieldSources,
          };

          setAwardsList((prevData = []) => {
            let newAwardsList;
            if (isSparkEntry) {
              newAwardsList = [
                ...prevData.filter(
                  (a) => String(a.ais_rew_id) !== String(selectedAward.ais_rew_id)
                ),
                updatedAward,
              ];
            } else if (isUpdate) {
              newAwardsList = prevData.map((award) =>
                String(award.ais_rew_id) === String(selectedAward.ais_rew_id)
                  ? updatedAward
                  : award
              );
            } else {
              newAwardsList = [...prevData, updatedAward];
            }

            sessionStorage.setItem('awards_and_publications', JSON.stringify(newAwardsList));
            
            return newAwardsList;
          });

          setSparkFields((prev) => {
            const newSparkFields = new Set(prev);
            if (isSparkEntry) {
              const index = parseInt(selectedAward.ais_rew_id.split("_")[1]);
              [
                "rew_name",
                "rew_from",
                "received_on",
                "rew_description",
                "reward_doc",
              ].forEach((key) => {
                newSparkFields.delete(`${key}_${index}`);
              });
            }
            return newSparkFields;
          });

          setModalOpen(false);
          setSelectedAward(null);
          toast.success(
            isUpdate ? "Award updated successfully" : "Award added successfully",
            {
              className: "bg-primary-500 text-white",
              progressClassName: "bg-primary-200",
            }
          );
        } else {
          toast.error("Failed to save award details", {
            className: "bg-red-500 text-white",
            progressClassName: "bg-red-200",
          });
        }
      } catch (err) {
        let errorMsg = "Failed to save award details";

        const details = err.response?.data?.detail;

        if (Array.isArray(details)) {
          if (details.some((d) => d.includes("Invalid file content type"))) {
            errorMsg = "Invalid file type. Allowed types are PDF, JPG, JPEG, PNG.";
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
    [selectedAward, profileData, awardsList]
  );

  const openDocumentModal = useCallback(async (documentId) => {
    if (!documentId) return;
    setLoadingDocument(true);
    setDocumentError(null);
    try {
      const response = await axiosInstance.get(`/doc-uploader/get-document/${documentId}`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const isPdf = response.data.type.includes("pdf");
      setDocumentData({ id: documentId, url, name: `Award Document`, isPdf });
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

  const renderDocumentButton = (documentId, awardName) => {
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
    if (!loading && awardsList) {
      const total = awardsList.length;
      const completed = awardsList.filter((a) => a.isSaved).length;
      updateSectionProgress('awards', total === 0 ? 0 : completed, total === 0 ? 0 : total);
    }
  }, [loading, updateSectionProgress, awardsList?.length, awardsList?.map((a) => a.isSaved).join(',')]);

  const renderAddButton = () => {
    if (sessionStorage.getItem('role_id') !== '2') return null;
    
    return (
      <div className="relative group">
        <button
          className={`px-2 py-2 rounded-md flex items-center gap-2 text-sm font-medium self-end sm:self-center transition-colors ${
            isButtonDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
          }`}
          onClick={handleAdd}
          disabled={isButtonDisabled}
        >
          <PlusIcon className="w-4 h-4" strokeWidth={2} />
          <span>Add Award</span>
        </button>
        {isButtonDisabled && (
          <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            Cannot add awards after profile is submitted or approved
          </div>
        )}
      </div>
    );
  };

  const renderEditButton = (award) => {
    if (sessionStorage.getItem('role_id') !== '2') return null;
    
    return (
      <div className="relative group">
        <button
          className={`${
            isButtonDisabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400'
          }`}
          onClick={() => handleEdit(award)}
          disabled={isButtonDisabled}
        >
          <PencilSquareIcon className="w-4 h-4" strokeWidth={2} />
        </button>
        <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          {isButtonDisabled ? 'Cannot edit awards after profile is submitted or approved' : 'Edit'}
        </div>
      </div>
    );
  };

  const renderDeleteButton = (award) => {
    if (sessionStorage.getItem('role_id') !== '2') return null;

    const hasSparkData = Object.values(award.fieldSources || {}).some(
      (source) => source === "SPARK"
    );

    if (hasSparkData) return null;

    const isLoading = deleteLoading === award.ais_rew_id;

    return (
      <div className="relative group">
        <button
          className={`${
            isButtonDisabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-red-600 hover:text-red-500 dark:hover:text-red-400'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={(e) => handleDeleteClick(award)}
          disabled={isButtonDisabled || isLoading}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-t-2 border-b-2 border-red-600 rounded-full animate-spin"></div>
          ) : (
            <TrashIcon className="w-4 h-4" strokeWidth={2} />
          )}
        </button>
        <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          {isButtonDisabled ? 'Cannot delete awards after profile is submitted or approved' : 'Delete'}
        </div>
      </div>
    );
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
      <div className="absolute top-3 left-4 group">
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
    <div className="p-2 mx-auto w-full  bg-white dark:bg-gray-900">
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
      ) : awardsList.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {awardsList.map((award) => (
            <div
              key={award.ais_rew_id}
              className="relative bg-gray-50 dark:bg-gray-800 border border-indigo-300 dark:border-indigo-600 rounded-md p-3 shadow-sm"
            >
              {renderSavedIndicator(award.isSaved)}
              <div className="flex items-center justify-end mb-2 gap-2">
                {renderEditButton(award)}
                {renderDeleteButton(award)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {fields.map((field) => (
                  <div
                    key={`${award.ais_rew_id}_${field.key}`}
                    className="relative flex items-start gap-2 bg-white dark:bg-gray-700 rounded-lg p-2 border border-gray-200 dark:border-gray-600"
                  >
                    {renderSparkIndicator(field.key, award.fieldSources[field.key])}
                    {renderUserIndicator(field.key, award.fieldSources[field.key])}
                    {renderGadIndicator(field.key, award.fieldSources[field.key])}
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mt-0.5">
                      <field.icon className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {field.display}
                      </p>
                      <p 
                        className={`text-sm font-bold text-gray-900 dark:text-white break-words line-clamp-5`}
                        title={
                          field.type === "file"
                            ? renderDocumentButton(award[field.key], award.rew_name)
                            : field.type === "date"
                            ? field.getValue(award[field.key])
                            : award[field.key] || "N/A"
                        }
                      >
                        {field.type === "file"
                          ? renderDocumentButton(award[field.key], award.rew_name)
                          : field.type === "date"
                          ? field.getValue(award[field.key])
                          : award[field.key] || "N/A"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 dark:text-gray-400 text-sm text-center py-3">
          No Awards Available.
        </div>
      )}

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {/* Document Modal */}
            {isDocumentModalOpen && documentData && (
              <motion.div
                key="document-modal"
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
                    onClick={(e) => e.stopPropagation()}
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

      <AnimatePresence>
        {/* Awards Modal */}
        {isModalOpen && (
          <ModalAwardsAndPublications
            key="awards-modal"
            open={isModalOpen}
            setOpen={setModalOpen}
            save={handleAddOrUpdate}
            awards={selectedAward}
            sparkFields={sparkFields}
            officerFields={officerFields}
          />
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <ConfirmModal
            key="delete-modal"
            isOpen={isDeleteModalOpen}
            setIsOpen={setIsDeleteModalOpen}
            onConfirm={handleDeleteConfirm}
            title="Delete Award Details"
            message={`Are you sure you want to delete "${
              awardToDelete
                ? awardToDelete.rew_name || 'this award'
                : "this award"
            }"? This action cannot be undone.`}
            iconType="delete"
            confirmText="Delete"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
