"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  BookOpenIcon,
  GlobeAltIcon,
  BuildingLibraryIcon,
  MapPinIcon,
  CalendarIcon,
  DocumentIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { BoltIcon, UserIcon, ExclamationTriangleIcon, CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { ModalCareerTrainingDetails } from "../modal/career-training-details";
import { toast } from "react-toastify";
import axiosInstance from "@/utils/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import { useProfileCompletion } from '@/contexts/Profile-completion-context';
import ConfirmModal from "@/app/components/confirmModal";

export function CareerTrainingDetails({ profileData }) {
  
  const { updateSectionProgress } = useProfileCompletion();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDocumentModalOpen, setDocumentModalOpen] = useState(false);
  const [documentsData, setDocumentsData] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [documentError, setDocumentError] = useState(null);
  const [trainingList, setTrainingList] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localProfileData, setLocalProfileData] = useState(profileData);

  const [deleteLoading, setDeleteLoading] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [trainingToDelete, setTrainingToDelete] = useState(null);
  
  const profileStatus = sessionStorage.getItem('profile_status');
  const isButtonDisabled = profileStatus === '2' || profileStatus === '3';
  
  const [masterData, setMasterData] = useState({
    training_types: [],
    countries: [],
  });
  const [officerFields, setOfficerFields] = useState({
    GAD_OFFICER: [],
    AIS_OFFICER: [],
    DB_SPARK_API: [],
  });
  const [sparkFields, setSparkFields] = useState(new Set());
  const [hasFetched, setHasFetched] = useState(false);
  const BASE_FILE_URL = process.env.NEXT_PUBLIC_API_URL;

  
  // Button Handlers
  const handleAdd = useCallback(() => {
    setSelectedTraining({
      ais_tr_id: null,
      training_type_id: "",
      country_id: "",
      raw_country: "",
      institute_name: "",
      subject: "",
      place: "",
      training_from: "",
      training_to: "",
      documents: [],
      _source: "USER",
      isSaved: false,
      fieldSources: {
        training_type_id: "USER",
        country_id: "USER",
        institute_name: "USER",
        subject: "USER",
        place: "USER",
        training_from: "USER",
        training_to: "USER",
        documents: "USER",
      },
    });
    setModalOpen(true);
  }, []);

 

  // ALL EXISTING CODE BELOW REMAINS EXACTLY THE SAME
  const fields = [
    { label: "Training Type", key: "training_type_id", icon: BookOpenIcon, isMaster: true, idForSelect: "training_type_id", masterKey: "training_types" },
    { label: "Country", key: "country_id", icon: GlobeAltIcon, isMaster: true, idForSelect: "country_id", masterKey: "countries" },
    { label: "Institute Name", key: "institute_name", icon: BuildingLibraryIcon, type: "text" },
    { label: "Subject", key: "subject", icon: BookOpenIcon, type: "text" },
    { label: "Place", key: "place", icon: MapPinIcon, type: "text" },
    { label: "Duration", key: "duration", icon: CalendarIcon, type: "computed" },
    { label: "Documents", key: "documents", icon: DocumentIcon, type: "file" },
  ];

  const masterFields = ["training_type_id", "country_id"];
  const leftColumnFields = fields.slice(0, 4);
  const rightColumnFields = fields.slice(4);

  const sourceMap = {
    DB_SPARK_API: 'SPARK',
    AIS_OFFICER: 'USER',
    GAD_OFFICER: 'GAD',
    UNKNOWN: 'USER',
  };

  const isValidTraining = (training) => {
    return (
      training &&
      typeof training === "object" &&
      training.ais_tr_id &&
      training.training_from &&
      training.training_to
    );
  };

  const getMasterValue = useCallback(
    (id, key, rawValue = "") => {
      if (key === "country_id") {
        if (rawValue === "IND") return "India";
        if (!id && rawValue) return rawValue;
      }
      if (!id && id !== 0) return "N/A";
      if (masterFields.includes(key)) {
        const dataMap = {
          training_type_id: {
            data: masterData.training_types,
            id: "training_type_id",
            value: "training_type",
          },
          country_id: {
            data: masterData.countries,
            id: "country_id",
            value: "country",
          },
        };
        const { data, id: idField, value } = dataMap[key];
        const match = data.find((item) => String(item[idField]) === String(id));
        return match ? match[value] : rawValue || "N/A";
      }
      return "N/A";
    },
    [masterData]
  );

function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Remove any time portion if present
  dateStr = dateStr.split(' ')[0];
  
  // Try multiple date formats
  const formats = [
    // yyyy-mm-dd (ISO format)
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // dd/mm/yyyy
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // mm/dd/yyyy
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // dd-mm-yyyy
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    // mm-dd-yyyy
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/
  ];
  
  for (let i = 0; i < formats.length; i++) {
    const match = dateStr.match(formats[i]);
    if (match) {
      let year, month, day;
      
      if (i === 0) {
        // yyyy-mm-dd format
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1; // months are 0-indexed
        day = parseInt(match[3], 10);
      } else if (i === 1) {
        // dd/mm/yyyy format
        day = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1;
        year = parseInt(match[3], 10);
      } else if (i === 2) {
        // mm/dd/yyyy format
        month = parseInt(match[1], 10) - 1;
        day = parseInt(match[2], 10);
        year = parseInt(match[3], 10);
      } else if (i === 3) {
        // dd-mm-yyyy format
        day = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1;
        year = parseInt(match[3], 10);
      } else if (i === 4) {
        // mm-dd-yyyy format
        month = parseInt(match[1], 10) - 1;
        day = parseInt(match[2], 10);
        year = parseInt(match[3], 10);
      }
      
      const date = new Date(year, month, day);
      
      // Validate the date
      if (date.getFullYear() === year && 
          date.getMonth() === month && 
          date.getDate() === day) {
        return date;
      }
    }
  }
  
  // Fallback to native Date parsing
  const fallbackDate = new Date(dateStr);
  return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
}

const calculateDuration = (from, to) => {
  if (!from || !to) return "N/A";
  
  const start = parseDate(from);
  const end = parseDate(to);
  
  if (!start || !end || start >= end) {
    return "N/A";
  }
  
  // Calculate months
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) {
    months -= 1;
  }
  
  if (months < 0) months = 0;
  
  if (months > 0) {
    return months > 1 ? `${months} months` : `${months} month`;
  }
  
  // Calculate days
  const diffTime = end.getTime() - start.getTime();
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (days > 0) {
    return days > 1 ? `${days} days` : `${days} day`;
  }
  
  return "Less than a day";
};

// Helper function to normalize date to YYYY-MM-DD format
const normalizeDate = (dateStr) => {
  const date = parseDate(dateStr);
  if (!date) return '';
  return date.toISOString().split('T')[0];
};

// Helper function to create key for matching
const createMatchKey = (training) => {
  const subject = (training.subject || '').toLowerCase().trim();
  const institute = (training.institute_name || '').toLowerCase().trim();
  const fromDate = normalizeDate(training.training_from);
  return `${subject}_${institute}_${fromDate}`;
};

const mapSparkDataToTrainingDetails = useCallback(
  (sparkData, dbTrainings = []) => {
    const sparkKeys = new Set();
    let tempSparkList = [];

    // Create a map of DB trainings for easy lookup by multiple criteria
    const dbTrainingMap = new Map();
    const dbTrainingBySparkMatch = new Map();
    
    // First, process DB trainings into maps for different lookup methods
    dbTrainings.forEach((dbTraining) => {
      const merged = {
        training_type_id: String(dbTraining.training_type_id || ""),
        country_id: String(dbTraining.country_id || ""),
        institute_name: dbTraining.institute_name || "",
        subject: dbTraining.subject || "",
        place: dbTraining.place || "",
        training_from: dbTraining.training_from || "",
        training_to: dbTraining.training_to || "",
        documents: Array.isArray(dbTraining.documents)
          ? dbTraining.documents
          : dbTraining.documents
            ? dbTraining.documents.split(",").filter(Boolean)
            : [],
      };
      
      const fieldSources = {};
      
      // Process field sources from DB
      for (const src in dbTraining.fields || {}) {
        const mappedSource = sourceMap[src] || src;
        for (const key in dbTraining.fields[src] || {}) {
          if (merged[key] !== undefined) {
            merged[key] = dbTraining.fields[src][key];
            fieldSources[key] = mappedSource;
          }
        }
      }

      const dbTrainingObj = {
        ais_tr_id: String(dbTraining.ais_tr_id),
        ...merged,
        raw_country: "",
        _source: Object.keys(fieldSources).length > 1 ? "MIXED" : Object.values(fieldSources)[0] || "USER",
        isSaved: true,
        fieldSources,
      };
      
      // Store in maps for different lookup methods
      
      // 1. By DB ID (primary)
      dbTrainingMap.set(`db_${dbTrainingObj.ais_tr_id}`, dbTrainingObj);
      
      // 2. By subject + institute + from date (for matching with SPARK)
      const subject = (dbTrainingObj.subject || '').toLowerCase().trim();
      const institute = (dbTrainingObj.institute_name || '').toLowerCase().trim();
      const fromDate = normalizeDate(dbTrainingObj.training_from);
      const matchKey = `${subject}_${institute}_${fromDate}`;
      if (matchKey && matchKey !== '__') {
        dbTrainingBySparkMatch.set(matchKey, dbTrainingObj);
      }
    });

    // Process SPARK data
    if (sparkData?.trainingList && Array.isArray(sparkData.trainingList)) {
      tempSparkList = sparkData.trainingList.map((training, index) => {
        const trainingTypeMatch = masterData.training_types.find(
          (t) => t.training_type.toLowerCase() === (training.qualification || "").toLowerCase()
        );
        const countryMatch = masterData.countries.find(
          (c) => c.country.toLowerCase() === (training.country || "").toLowerCase()
        );
        
        const sparkTrainingDetail = {
          ais_tr_id: `spark_${index}`,
          training_type_id: trainingTypeMatch ? trainingTypeMatch.training_type_id : "",
          country_id: countryMatch ? countryMatch.country_id : "",
          raw_country: training.country || "",
          institute_name: training.conducted_by || "",
          subject: training.qualification || "",
          place: training.city || "",
          training_from: training.from_date ? training.from_date.split(" ")[0] : "",
          training_to: training.to_date ? training.to_date.split(" ")[0] : "",
          documents: [],
          _source: "SPARK",
          isSaved: false,
          fieldSources: {
            training_type_id: trainingTypeMatch ? "SPARK" : "USER",
            country_id: countryMatch ? "SPARK" : training.country ? "SPARK" : "USER",
            institute_name: training.conducted_by ? "SPARK" : "USER",
            subject: training.qualification ? "SPARK" : "USER",
            place: training.city ? "SPARK" : "USER",
            training_from: training.from_date ? "SPARK" : "USER",
            training_to: training.to_date ? "SPARK" : "USER",
            documents: "USER",
          },
        };

        // Add to sparkKeys
        [
          "training_type_id",
          "country_id",
          "institute_name",
          "subject",
          "place",
          "training_from",
          "training_to",
        ].forEach((key) => {
          if (sparkTrainingDetail[key] || (key === "country_id" && sparkTrainingDetail.raw_country)) {
            sparkKeys.add(`${key}_${index}`);
          }
        });

        return sparkTrainingDetail;
      });
    }

    // Now match SPARK entries with DB entries
    const finalDetails = [];
    const matchedDbIds = new Set();
    const matchedSparkKeys = new Set();

    // First, try to match SPARK entries with DB entries
    tempSparkList.forEach((sparkTraining) => {
      const sparkSubject = (sparkTraining.subject || '').toLowerCase().trim();
      const sparkInstitute = (sparkTraining.institute_name || '').toLowerCase().trim();
      const sparkFromDate = normalizeDate(sparkTraining.training_from);
      const sparkMatchKey = `${sparkSubject}_${sparkInstitute}_${sparkFromDate}`;
      
      let matchedDbTraining = null;
      
      // Try to find match by subject + institute + from date
      if (sparkMatchKey && sparkMatchKey !== '__') {
        matchedDbTraining = dbTrainingBySparkMatch.get(sparkMatchKey);
      }
      
      if (matchedDbTraining) {
        // Found a match - merge the data (DB data takes precedence)
        matchedDbIds.add(matchedDbTraining.ais_tr_id);
        matchedSparkKeys.add(sparkTraining.ais_tr_id);
        
        const mergedTraining = {
          ...sparkTraining,
          ...matchedDbTraining,
          ais_tr_id: matchedDbTraining.ais_tr_id, // Use DB ID
          isSaved: true,
          fieldSources: {
            ...sparkTraining.fieldSources,
            ...matchedDbTraining.fieldSources,
          },
        };
        
        finalDetails.push(mergedTraining);
      } else {
        // No match - keep as SPARK entry
        finalDetails.push(sparkTraining);
      }
    });

    // Add remaining DB entries that weren't matched with SPARK
    dbTrainingMap.forEach((dbTraining) => {
      if (!matchedDbIds.has(dbTraining.ais_tr_id)) {
        finalDetails.push(dbTraining);
      }
    });

    // Sort by end date (descending), then by start date (ascending)
    finalDetails.sort((a, b) => {
      const dateToA = parseDate(a.training_to);
      const dateToB = parseDate(b.training_to);
      
      if (!dateToA || !dateToB) {
        if (!dateToA && dateToB) return 1;
        if (dateToA && !dateToB) return -1;
        return 0;
      }
      
      if (dateToA.getTime() === dateToB.getTime()) {
        const dateFromA = parseDate(a.training_from);
        const dateFromB = parseDate(b.training_from);
        
        if (!dateFromA || !dateFromB) {
          if (!dateFromA && dateFromB) return 1;
          if (dateFromA && !dateFromB) return -1;
          return 0;
        }
        
        return dateFromB.getTime() - dateFromA.getTime();
      }
      
      return dateToB.getTime() - dateToA.getTime();
    });

    return { details: finalDetails, sparkKeys };
  },
  [masterData]
);

  useEffect(() => {
    // Check sessionStorage first
    const storedTrainings = sessionStorage.getItem('training_data');
    if (storedTrainings) {
      const parsedTrainings = JSON.parse(storedTrainings);
      setTrainingList(
        parsedTrainings.map((t) => ({
          ...t,
          documents: Array.isArray(t.documents)
            ? t.documents.filter((id) => id)
            : typeof t.documents === "string"
            ? t.documents.split(",").filter((id) => id.trim())
            : [],
        }))
      );

      setLoading(false);
      
      // Still need to load master data if not already loaded
      if (!hasFetched) {
        loadMasterData();
      }
      return;
    }
  
    if (!profileData || hasFetched) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [typesRes, countriesRes] = await Promise.all([
          axiosInstance.get("/masters/training_type-all"),
          axiosInstance.get("/masters/country-all"),
        ]);

        const dbTrainings = profileData?.officer_data?.get_all_officer_info_by_user_id?.training_info || [];
        const sparkData = profileData?.spark_data?.data || {};
        const officerInfo = profileData?.officer_data?.get_all_officer_info_by_user_id?.officer_info?.[0] || {};

        const newMasterData = {
          training_types: typesRes.data.data.training_type || [],
          countries: countriesRes.data.data.country || [],
        };
        setMasterData(newMasterData);

        const officerFieldsData = {
          GAD_OFFICER: officerInfo?.fields?.GAD_OFFICER ? Object.keys(officerInfo.fields.GAD_OFFICER) : [],
          AIS_OFFICER: officerInfo?.fields?.AIS_OFFICER ? Object.keys(officerInfo.fields.AIS_OFFICER) : [],
          DB_SPARK_API: officerInfo?.fields?.DB_SPARK_API ? Object.keys(officerInfo.fields.DB_SPARK_API) : [],
        };
        setOfficerFields(officerFieldsData);
       
        const { details: sparkMappedDetails, sparkKeys } = mapSparkDataToTrainingDetails(sparkData, dbTrainings);
       
        setTrainingList(sparkMappedDetails);
        setSparkFields(sparkKeys);
        setHasFetched(true);
        
        // Store initial data in sessionStorage
        sessionStorage.setItem('training_data', JSON.stringify(sparkMappedDetails));
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load training data");
        toast.error("Failed to load training data", {
          className: "bg-red-500 text-white",
          progressClassName: "bg-red-200",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profileData, mapSparkDataToTrainingDetails, hasFetched]);

  // Helper function to load master data separately
  const loadMasterData = async () => {
    try {
      const [typesRes, countriesRes] = await Promise.all([
        axiosInstance.get("/masters/training_type-all"),
        axiosInstance.get("/masters/country-all"),
      ]);

      const newMasterData = {
        training_types: typesRes.data.data.training_type || [],
        countries: countriesRes.data.data.country || [],
      };
      setMasterData(newMasterData);
      setHasFetched(true);
    } catch (error) {
      console.error("Error loading master data:", error);
    }
  };


 const handleEdit = useCallback((training) => {
    setSelectedTraining(training);

    if (!training.isSaved && training.ais_tr_id?.startsWith?.("spark_")) {
      const idx = training.ais_tr_id.split("_")[1];
      const sparkSet = new Set();
      [
        "training_type_id",
        "country_id",
        "institute_name",
        "subject",
        "place",
        "training_from",
        "training_to",
        "documents",
      ].forEach((k) => {
        if (training.fieldSources?.[k] === "SPARK") sparkSet.add(`${k}_${idx}`);
      });
      setSparkFields(sparkSet);
    }
    setModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((training) => {
    setTrainingToDelete(training);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!trainingToDelete) return;

    const trainingId = trainingToDelete.ais_tr_id;

    if (isButtonDisabled) {
      toast.error("Cannot delete training after the profile is submitted or approved", {
        className: "bg-red-500 text-white",
        progressClassName: "bg-red-200",
      });
      return;
    }

    // Check if it's a SPARK entry (not saved to DB yet)
    if (typeof trainingId === "string" && trainingId.startsWith("spark_")) {
      // Remove from local state only
      setTrainingList(prev => prev.filter(t => t.ais_tr_id !== trainingId));
      
      // Update sessionStorage
      const updatedTrainingList = trainingList.filter(t => t.ais_tr_id !== trainingId);
      sessionStorage.setItem('training_data', JSON.stringify(updatedTrainingList));
      
      toast.success("Training removed successfully", {
        className: "bg-primary-500 text-white",
        progressClassName: "bg-primary-200",
      });
      
      setIsDeleteModalOpen(false);
      setTrainingToDelete(null);
      return;
    }

    // For saved entries, call the API
    setDeleteLoading(trainingId);
    try {
      const response = await axiosInstance.delete(`/officer/training_info_delete/${trainingId}`);
    
      if (response.data.success) {
        // Remove from local state
        setTrainingList(prev => prev.filter(t => String(t.ais_tr_id) !== String(trainingId)));
        
        // Update sessionStorage
        const updatedTrainingList = trainingList.filter(t => String(t.ais_tr_id) !== String(trainingId));
        sessionStorage.setItem('training_data', JSON.stringify(updatedTrainingList));
        
        toast.success("Training deleted successfully", {
          className: "bg-primary-500 text-white",
          progressClassName: "bg-primary-200",
        });
      } else {
        throw new Error("Failed to delete training");
      }
    } catch (err) {
      console.error("Error deleting training:", err);
      toast.error("Failed to delete training", {
        className: "bg-red-500 text-white",
        progressClassName: "bg-red-200",
      });
    } finally {
      setDeleteLoading(null);
      setIsDeleteModalOpen(false);
      setTrainingToDelete(null);
    }
    
  }, [isButtonDisabled, trainingList, trainingToDelete]);


  const handleSave = useCallback(
    async (updatedData) => {
      try {
        const isSparkEntry =
          selectedTraining &&
          selectedTraining.ais_tr_id &&
          typeof selectedTraining.ais_tr_id === "string" &&
          selectedTraining.ais_tr_id.startsWith("spark_");
        const isUpdate =
          selectedTraining &&
          selectedTraining.ais_tr_id &&
          !(typeof selectedTraining.ais_tr_id === "string" &&
            selectedTraining.ais_tr_id.startsWith("spark_"));
        const isNew = !selectedTraining || !selectedTraining.ais_tr_id;

        let documentIds = [];

        const filesToProcess = updatedData.user_data.files || [];

      if (filesToProcess.length > 0) {
        const documentPromises = filesToProcess.map(async (file) => {
          const metadata = {
            document_type: "ER-Profile",
            document_sub_type: "Training",
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
          } else {
            throw new Error(`Document upload failed for ${file.name}`);
          }
        });

        documentIds = await Promise.all(documentPromises);
      }

      const existingDocs = updatedData.user_data.documents
        ? (Array.isArray(updatedData.user_data.documents)
            ? updatedData.user_data.documents
            : updatedData.user_data.documents.split(",").filter(Boolean))
        : [];

      const userDataWithDocuments = {
        // training_name: updatedData.user_data.training_name || null,
        training_type_id: updatedData.user_data.training_type_id || null,
        country_id: updatedData.user_data.country_id || null,
        institute_name: updatedData.user_data.institute_name || null,
        subject: updatedData.user_data.subject || null,
        place: updatedData.user_data.place || null,
        training_from: updatedData.user_data.training_from || null,
        training_to: updatedData.user_data.training_to || null,
        documents: [...existingDocs, ...documentIds],
      };

      const requestBody = {
        spark_data: updatedData.spark_data || null,
        user_data: userDataWithDocuments,
      };
      

      let response;

      if (isSparkEntry || isNew) {
        response = await axiosInstance.post("/officer/training-info", requestBody);
      } else if (isUpdate) {
        response = await axiosInstance.put(
          `/officer/training-info/${selectedTraining.ais_tr_id}`,
          requestBody
        );
      }

      if (response.data.success) {
        const savedTraining = response.data.data.training_info;

        // const fieldSources = {
        //   training_name: requestBody.user_data.training_name ? "USER" : savedTraining.training_name ? "SPARK" : "USER",
        //   training_type_id: requestBody.user_data.training_type_id ? "USER" : savedTraining.training_type_id ? "SPARK" : "USER",
        //   country_id: requestBody.user_data.country_id ? "USER" : savedTraining.country_id ? "SPARK" : "USER",
        //   institute_name: requestBody.user_data.institute_name ? "USER" : savedTraining.institute_name ? "SPARK" : "USER",
        //   subject: requestBody.user_data.subject ? "USER" : savedTraining.subject ? "SPARK" : "USER",
        //   place: requestBody.user_data.place ? "USER" : savedTraining.place ? "SPARK" : "USER",
        //   training_from: requestBody.user_data.training_from ? "USER" : savedTraining.training_from ? "SPARK" : "USER",
        //   training_to: requestBody.user_data.training_to ? "USER" : savedTraining.training_to ? "SPARK" : "USER",
        //   documents: documentIds.length > 0 || requestBody.user_data.documents ? "USER" : savedTraining.documents ? "SPARK" : "USER",
        // };

        // FIXED: Preserve original fieldSources
        const originalFieldSources = selectedTraining?.fieldSources || {};
        const updatedFieldSources = { ...originalFieldSources };  // Start with originals (keeps GAD)

        // FIXED: Identify actually updated keys
        const userUpdatedKeys = Object.keys(updatedData.user_data || {}).filter(
          (key) => updatedData.user_data[key] !== undefined && updatedData.user_data[key] !== null
        );

        // FIXED: Only set to "USER" for updated fields
        userUpdatedKeys.forEach((key) => {
          updatedFieldSources[key] = "USER";
        });

        // FIXED: Special handling for documents (only "USER" if new upload)
        if (documentIds.length > 0) {
          updatedFieldSources.documents = "USER";
        } else if (updatedData.user_data?.documents && typeof updatedData.user_data.documents === "string") {
          updatedFieldSources.documents = "USER";  // If existing doc IDs provided by user
        }

        // FIXED: Preserve "SPARK" if not updated and matches spark_data
        if (updatedData.spark_data) {
          const spark = updatedData.spark_data;
          // if (
          //   !userUpdatedKeys.includes("training_name") &&
          //   savedTraining.training_name === spark.title
          // ) {
          //   updatedFieldSources.training_name = "SPARK";
          // }
          if (
            !userUpdatedKeys.includes("training_type_id") &&
            savedTraining.training_type_id === spark.qualification  // Adjust if field names differ
          ) {
            updatedFieldSources.training_type_id = "SPARK";
          }
          if (
            !userUpdatedKeys.includes("country_id") &&
            savedTraining.country_id === spark.country  // Adjust if needed
          ) {
            updatedFieldSources.country_id = "SPARK";
          }
          if (
            !userUpdatedKeys.includes("institute_name") &&
            savedTraining.institute_name === spark.conducted_by
          ) {
            updatedFieldSources.institute_name = "SPARK";
          }
          if (
            !userUpdatedKeys.includes("subject") &&
            savedTraining.subject === spark.qualification
          ) {
            updatedFieldSources.subject = "SPARK";
          }
          if (
            !userUpdatedKeys.includes("place") &&
            savedTraining.place === spark.city
          ) {
            updatedFieldSources.place = "SPARK";
          }
          if (
            !userUpdatedKeys.includes("training_from") &&
            savedTraining.training_from === spark.from_date?.split(" ")[0]
          ) {
            updatedFieldSources.training_from = "SPARK";
          }
          if (
            !userUpdatedKeys.includes("training_to") &&
            savedTraining.training_to === spark.to_date?.split(" ")[0]
          ) {
            updatedFieldSources.training_to = "SPARK";
          }
        }

        // FIXED: Use the updated fieldSources in the new data
        const updatedTrainingData = {
          ais_tr_id: String(savedTraining.ais_tr_id),
          // training_name: savedTraining.training_name || "",
          training_type_id: savedTraining.training_type_id || "",
          country_id: savedTraining.country_id || "",
          raw_country: savedTraining.raw_country || "",
          institute_name: savedTraining.institute_name || "",
          subject: savedTraining.subject || "",
          place: savedTraining.place || "",
          training_from: savedTraining.training_from || "",
          training_to: savedTraining.training_to || "",
          documents: savedTraining.documents || [],
          _source: Object.values(updatedFieldSources).some((s) => s !== "USER") ? "MIXED" : "USER",
          isSaved: true,
          fieldSources: updatedFieldSources,
        };
        let newTrainingList;
        setTrainingList((prevData = []) => {
          if (isSparkEntry) {
            newTrainingList = [
              ...prevData.filter(
                (t) => String(t.ais_tr_id) !== String(selectedTraining.ais_tr_id)
              ),
              updatedTrainingData,
            ];
          } else if (isUpdate) {
            newTrainingList = prevData.map((training) =>
              String(training.ais_tr_id) === String(selectedTraining.ais_tr_id)
                ? updatedTrainingData
                : training
            );
          } else {
            newTrainingList = [...prevData, updatedTrainingData];
          }

          // Store updated training list in sessionStorage
          sessionStorage.setItem('training_data', JSON.stringify(newTrainingList));
          
          return newTrainingList;
        });

        setSparkFields((prev) => {
          const newSparkFields = new Set(prev);
          if (isSparkEntry) {
            const index = parseInt(selectedTraining.ais_tr_id.split("_")[1]);
            [
              // "training_name",
              "training_type_id",
              "country_id",
              "institute_name",
              "subject",
              "place",
              "training_from",
              "training_to",
              "documents",
            ].forEach((key) => {
              newSparkFields.delete(`${key}_${index}`);
            });
          }
          return newSparkFields;
        });

        // FIXED: Properly update the profile data structure
        const currentProfileData = localProfileData || {};
        
        // Get the current officer data structure
        const currentOfficerData = currentProfileData.officer_data?.get_all_officer_info_by_user_id || {};
        
        // Get current training info array
        let updatedTrainingInfo = [...(currentOfficerData.training_info || [])];

        // Create the merged training object with proper structure
        const mergedSavedTraining = {
          ais_tr_id: savedTraining.ais_tr_id,
          user_id: profileData?.user_id || savedTraining.user_id,
          email: profileData?.email || savedTraining.email,
          first_name: currentOfficerData.officer_info?.[0]?.first_name || "",
          last_name: currentOfficerData.officer_info?.[0]?.last_name || "",
          // training_name: savedTraining.training_name,
          institute_name: savedTraining.institute_name,
          subject: savedTraining.subject,
          place: savedTraining.place,
          training_from: savedTraining.training_from,
          training_to: savedTraining.training_to,
          country_id: savedTraining.country_id,
          training_type_id: savedTraining.training_type_id,
          documents: savedTraining.documents || [],
          fields: savedTraining.fields || {
            DB_SPARK_API: {},
            AIS_OFFICER: {},
            UNKNOWN: {}
          }
        };

        // Update the training info array based on operation type
        if (isSparkEntry) {
          // For spark entries, find and update by matching training details
          const sparkTrainingIndex = updatedTrainingInfo.findIndex(t => 
            t.fields?.DB_SPARK_API?.subject === selectedTraining.subject &&
            t.fields?.DB_SPARK_API?.training_from === selectedTraining.training_from
          );
          
          if (sparkTrainingIndex !== -1) {
            updatedTrainingInfo[sparkTrainingIndex] = mergedSavedTraining;
          } else {
            // If not found, add as new
            updatedTrainingInfo.push(mergedSavedTraining);
          }
        } else if (isUpdate) {
          // Update existing training by ais_tr_id
          updatedTrainingInfo = updatedTrainingInfo.map((training) =>
            String(training.ais_tr_id) === String(selectedTraining.ais_tr_id)
              ? mergedSavedTraining
              : training
          );
        } else if (isNew) {
          // Add new training
          updatedTrainingInfo.push(mergedSavedTraining);
        }

        // Create the updated officer data structure
        const updatedOfficerDataRoot = {
          ...currentOfficerData,
          training_info: updatedTrainingInfo,
        };

        // Create the complete updated profile data
        const updatedProfileData = {
          ...currentProfileData,
          officer_data: {
            ...currentProfileData.officer_data,
            get_all_officer_info_by_user_id: updatedOfficerDataRoot,
          },
        };

        console.log("Updated profile data:", updatedProfileData);
        
        // Update localProfileData and sessionStorage
        setLocalProfileData(updatedProfileData);
        sessionStorage.setItem('profileData', JSON.stringify(updatedProfileData));
        
        console.log("Updated profile data saved to sessionStorage:", 
          JSON.parse(sessionStorage.getItem('profileData')));

        toast.success(
          isUpdate ? "Training updated successfully" : "Training added successfully",
          {
            className: "bg-primary-500 text-white",
            progressClassName: "bg-primary-200",
          }
        );
        setModalOpen(false);
        setSelectedTraining(null);
        setHasFetched(false);
      } else {
        toast.error("Failed to save training details", {
          className: "bg-red-500 text-white",
          progressClassName: "bg-red-200",
        });
      }
    } catch (error) {
      console.error("Error saving training:", error);
      toast.error("Error occurred while saving training", {
        className: "bg-red-500 text-white",
        progressClassName: "bg-red-200",
      });
    }
  },
  [selectedTraining, profileData, localProfileData, setLocalProfileData]
);



// Common Button Helper Functions
  const renderAddButton = () => {
    if (sessionStorage.getItem('role_id') !== '2') return null;
    
    return (
      <div className="relative group">
        <button
          className={`px-2 py-2 rounded-md transition-colors flex items-center gap-2 text-[0.875rem] font-medium self-end sm:self-center ${
            isButtonDisabled 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
          }`}
          onClick={handleAdd}
          disabled={isButtonDisabled}
        >
          <PlusIcon className="w-4 h-4" strokeWidth={2} />
          <span>Add Training</span>
        </button>
        {isButtonDisabled && (
          <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            Cannot add training after profile is submitted or approved
          </div>
        )}
      </div>
    );
  };

  const renderEditButton = (training) => {
    if (sessionStorage.getItem('role_id') !== '2') return null;
    
    return (
      <div className="relative group">
        <button
          className={`${
            isButtonDisabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400'
          }`}
          onClick={() => handleEdit(training)}
          disabled={isButtonDisabled}
        >
          <PencilSquareIcon className="w-4 h-4" strokeWidth={2} />
        </button>
        <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          {isButtonDisabled ? 'Cannot edit training after profile is submitted or approved' : 'Edit'}
        </div>
      </div>
    );
  };

  const renderDeleteButton = (training) => {
    if (sessionStorage.getItem('role_id') !== '2') return null;

    const hasSparkData = Object.values(training.fieldSources || {}).some(
      (source) => source === "SPARK"
    );
    if (hasSparkData) return null; // Hide delete button if SPARK data exists
    const isLoading = deleteLoading === training.ais_tr_id;
    
    return (
      <div className="relative group">
        <button
          className={`${
            isButtonDisabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-red-600 hover:text-red-500 dark:hover:text-red-400'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => handleDeleteClick(training)}
          disabled={isButtonDisabled || isLoading}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-t-2 border-b-2 border-red-600 rounded-full animate-spin"></div>
          ) : (
            <TrashIcon className="w-4 h-4" strokeWidth={2} />
          )}
        </button>
        <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          {isButtonDisabled ? 'Cannot delete training after profile is submitted or approved' : 'Delete'}
        </div>
      </div>
    );
  };


  const fetchDocuments = useCallback(async (documentIds, trainingName) => {
    setLoadingDocuments(true);
    setDocumentError(null);
    try {
      const documentPromises = documentIds.map(async (id, index) => {
        const response = await axiosInstance.get(`/doc-uploader/get-document/${id}`, {
          responseType: 'blob',
        });
        const url = URL.createObjectURL(response.data);
        const isPdf = response.data.type.includes('pdf');
        return { id, url, name: `Training Document ${index + 1}`, isPdf };
      });
      const documents = await Promise.all(documentPromises);
      setDocumentsData(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocumentError("Failed to load documents");
      toast.error("Failed to load documents", {
        className: "bg-red-500 text-white",
        progressClassName: "bg-red-200",
      });
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  const openDocumentModal = useCallback((documentIds, trainingName) => {
    if (documentIds && documentIds.length > 0) {
      fetchDocuments(documentIds, trainingName);
      setDocumentModalOpen(true);
    }
  }, [fetchDocuments]);

  const closeDocumentModal = () => {
    setDocumentModalOpen(false);
    setDocumentsData([]);
    setDocumentError(null);
  };

  const renderFile = (documents, trainingName) => {
    if (!documents || documents.length === 0) return "No document uploaded";
    const files = Array.isArray(documents)
      ? documents
      : typeof documents === "string"
      ? documents.split(",").map((file) => file.trim())
      : [documents];

    return (
      <span>
        <button
          onClick={() => openDocumentModal(files, trainingName)}
            className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 px-2 py-0.5 mt-1 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition transform shadow-sm inline-flex items-center gap-1 text-sm"
        >
          <DocumentIcon className="w-4 h-4" />
          View {files.length > 1 ? `${files.length} Documents` : "Document"}
        </button>
      </span>
    );
  };

  const getTrainingStatus = (from, to) => {
    if (!from || !to) return "N/A";
    const today = new Date();
    const start = new Date(from);
    const end = new Date(to);
    if (today < start) return "Upcoming";
    if (today > end) return "Past";
    return "Current";
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
useEffect(() => {
    if (!loading && trainingList) {
      const total = trainingList.length;
      const completed = trainingList.filter((t) => t.isSaved).length;
      updateSectionProgress('training', total === 0 ? 0 : completed, total === 0 ? 0 : total);
    }
  }, [loading, updateSectionProgress, trainingList?.length, trainingList?.map((t) => t.isSaved).join(',')]);

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
      <div className="absolute top-6 left-4 group">
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

  const sections = useMemo(
    () => [
      {
        cards: trainingList.map((training, index) => ({
          ais_tr_id: training.ais_tr_id,
          isSaved: training.isSaved,
          fields: fields.map((field) => ({
            label: field.label,
            key: `${field.key}_${index}`,
            originalKey: field.key,
            icon: field.icon,
            isMaster: field.isMaster,
            computeValue: () => {
              if (field.type === "computed") {
                return calculateDuration(training.training_from, training.training_to);
              }
              if (field.type === "file") {
                return renderFile(training.documents, training.training_type_id);
              }
              if (field.isMaster) {
                return getMasterValue(training[field.key], field.key, training.raw_country);
              }
              return training[field.key] || "N/A";
            },
          })),
        })),
      },
    ],
    [trainingList, getMasterValue]
  );

  if (error) {
    return (
      <div className="text-red-500 text-center p-3 rounded-md bg-red-50 dark:bg-red-900/30 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="p-2 mx-auto w-full  bg-white dark:bg-gray-900">
      <div className="flex flex-col sm:flex-row sm:justify-between items-center my-5 gap-4">
        <div className="flex flex-wrap items-center border rounded-md px-3 py-2 bg-white dark:bg-gray-800 gap-3">
          <div className="flex items-center space-x-2 min-w-[120px]">
            <span className="inline-flex items-center p-0.5 rounded-full bg-orange-100 text-orange-600 text-[0.65rem]">
              <BoltIcon className="w-2 h-2" />
            </span>
            <span className="text-[0.875rem] text-gray-700 dark:text-white truncate">Synced from SPARK</span>
          </div>
          <div className="flex items-center space-x-2 min-w-[120px]">
            <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-[0.65rem]">
              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" />
              </svg>
            </span>
            <span className="text-[0.875rem] text-gray-700 dark:text-white truncate">Updated by AS-II</span>
          </div>
          <div className="flex items-center space-x-2 min-w-[120px]">
            <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-[0.65rem]">
              <UserIcon className="w-2 h-2" />
            </span>
            <span className="text-[0.875rem] text-gray-700 dark:text-white truncate">User Entered</span>
          </div>
          <div className="flex items-center space-x-2 min-w-[120px]">
            <span className="inline-flex items-center rounded-full text-green-600 text-[0.65rem]">
              <CheckCircleIcon className="w-4 h-4" strokeWidth={2} />
            </span>
            <span className="text-[0.875rem] text-gray-700 dark:text-white truncate">Saved</span>
          </div>
          <div className="flex items-center space-x-2 min-w-[120px]">
            <span className="inline-flex items-center rounded-full text-red-600 text-[0.65rem]">
              <ExclamationTriangleIcon className="w-4 h-4" strokeWidth={2} />
            </span>
            <span className="text-[0.875rem] text-gray-700 dark:text-white truncate">Not Saved</span>
          </div>
        </div>
        {renderAddButton()}
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : sections[0].cards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-6">
          {sections[0].cards.map((card, index) => (
            <div
              key={card.ais_tr_id}
              className="relative bg-gray-50 dark:bg-gray-800 border border-indigo-300 dark:border-indigo-600 rounded-md p-4 shadow-sm max-w-full"
            >
              {renderSavedIndicator(card.isSaved)}
              <span
                className={`absolute top-[-10px] left-3 inline-flex items-center px-2 py-0.5 rounded-full text-[0.75rem] font-semibold text-white shadow-sm border ${
                  getTrainingStatus(trainingList[index].training_from, trainingList[index].training_to) === "Current"
                    ? "bg-green-600 border-green-600"
                    : getTrainingStatus(trainingList[index].training_from, trainingList[index].training_to) === "Upcoming"
                    ? "bg-yellow-500 border-yellow-500"
                    : getTrainingStatus(trainingList[index].training_from, trainingList[index].training_to) === "Past"
                    ? "bg-indigo-600 border-indigo-600"
                    : "bg-gray-300 border-gray-400"
                }`}
              >
                {getTrainingStatus(trainingList[index].training_from, trainingList[index].training_to)}
              </span>
              <div className="flex items-center justify-end mb-3 gap-2">
                {renderEditButton(trainingList[index])}
                {renderDeleteButton(trainingList[index])}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-3">
                  {leftColumnFields.map((field) => (
                    <div
                      key={field.key}
                      className="relative flex items-center gap-2 bg-white dark:bg-gray-700 rounded-lg p-2 border border-gray-200 dark:border-gray-600 overflow-hidden"
                    >
                      {renderSparkIndicator(field.key, trainingList[index].fieldSources[field.key])}
                      {renderUserIndicator(field.key, trainingList[index].fieldSources[field.key])}
                      {renderGadIndicator(field.key, trainingList[index].fieldSources[field.key])}
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <field.icon className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.75rem] text-gray-500 dark:text-gray-400 truncate">{field.label}</p>
                        <p className="text-[0.875rem] font-bold text-gray-900 dark:text-white truncate">
                          {card.fields.find((f) => f.originalKey === field.key)?.computeValue()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {rightColumnFields.map((field) => (
                    <div
                      key={field.key}
                      className="relative flex items-center gap-2 bg-white dark:bg-gray-700 rounded-lg p-2 border border-gray-200 dark:border-gray-600 overflow-hidden"
                    >
                      {renderSparkIndicator(field.key, trainingList[index].fieldSources[field.key])}
                      {renderUserIndicator(field.key, trainingList[index].fieldSources[field.key])}
                      {renderGadIndicator(field.key, trainingList[index].fieldSources[field.key])}
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <field.icon className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.75rem] text-gray-500 dark:text-gray-400 truncate">{field.label}</p>
                        <p className="text-[0.875rem] font-bold text-gray-900 dark:text-white truncate">
                          {card.fields.find((f) => f.originalKey === field.key)?.computeValue()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 dark:text-gray-400 text-[0.875rem] text-center py-3">
          No Training Details Available.
        </div>
      )}
      <ModalCareerTrainingDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        save={handleSave}
        training={selectedTraining}
        masterData={masterData}
        sparkFields={sparkFields}
        officerFields={officerFields}
        userId={profileData?.user_id}
        onDocumentRemove={(docId) => {
    // Immediately update trainingList to remove doc ID
          setTrainingList((prev) =>
            prev.map((t) =>
              String(t.ais_tr_id) === String(selectedTraining?.ais_tr_id)
                ? {
                    ...t,
                    documents: Array.isArray(t.documents)
                      ? t.documents.filter((id) => id !== docId)
                      : t.documents
                          ?.split(",")
                          .filter((id) => id.trim() && id.trim() !== docId)
                          .join(","),
                  }
                : t
            )
          );
          // Also update sessionStorage
          const updated = trainingList.map((t) =>
            String(t.ais_tr_id) === String(selectedTraining?.ais_tr_id)
              ? {
                  ...t,
                  documents: Array.isArray(t.documents)
                    ? t.documents.filter((id) => id !== docId)
                    : t.documents
                        ?.split(",")
                        .filter((id) => id.trim() && id.trim() !== docId)
                        .join(","),
                }
              : t
          );
          sessionStorage.setItem('training_data', JSON.stringify(updated));
        }}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Training Details"
        message={`Are you sure you want to delete "${
          trainingToDelete
             ? getMasterValue(trainingToDelete.training_type_id, "training_type_id") || 'this training'
             : "this training"
            }"? This action cannot be undone.`}
            iconType="delete"
            confirmText="Delete"
      />
      
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isDocumentModalOpen && (
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
                          Training Documents
                        </h3>
                        {loadingDocuments ? (
                          <div className="flex justify-center items-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
                          </div>
                        ) : documentError ? (
                          <div className="text-red-500 text-center p-3 rounded-md bg-red-50 dark:bg-red-900/30 text-[0.875rem]">
                            {documentError}
                          </div>
                        ) : documentsData.length > 0 ? (
                          <div className="mt-2 space-y-4">
                            {documentsData.map((doc, index) => (
                              <div key={doc.id} className="border-b pb-4">
                                <h4 className="text-[0.875rem] font-medium text-gray-700 dark:text-gray-200 mb-2 truncate">
                                  {doc.name}
                                </h4>
                                {doc.isPdf ? (
                                  <object
                                    data={doc.url}
                                    type="application/pdf"
                                    width="100%"
                                    height="500px"
                                    className="rounded-lg shadow-lg"
                                  >
                                    <p className="text-gray-500 dark:text-gray-400 text-[0.875rem]">
                                      Unable to display PDF file.
                                    </p>
                                  </object>
                                ) : (
                                  <img
                                    src={doc.url}
                                    alt={doc.name}
                                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      e.target.nextSibling.style.display = "block";
                                    }}
                                  />
                                )}
                                <div className="hidden text-center py-8">
                                  <p className="text-gray-500 dark:text-gray-400 text-[0.875rem]">
                                    Unable to load document
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-500 dark:text-gray-400 text-[0.875rem] text-center py-3">
                            No documents available.
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
