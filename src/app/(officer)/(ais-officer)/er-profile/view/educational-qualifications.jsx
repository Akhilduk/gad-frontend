'use client';

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AcademicCapIcon,
  BuildingLibraryIcon,
  BookOpenIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { BoltIcon, UserIcon, ExclamationTriangleIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import { ModalEducationalQualifications } from "../modal/educational-qualifications";
// ... existing imports
import { useProfileCompletion } from '@/contexts/Profile-completion-context';
import { toast } from "react-toastify";
import axiosInstance from "@/utils/apiClient";
import ConfirmModal from "@/app/components/confirmModal";

export function EducationalQualifications({ profileData }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [educationalQualifications, setEducationalQualifications] = useState([]);
  const [selectedQualification, setSelectedQualification] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [masterData, setMasterData] = useState({
    qualification: [],
  });
  const [sparkFields, setSparkFields] = useState(new Set());
  const [localProfileData, setLocalProfileData] = useState(profileData);
  const { updateSectionProgress } = useProfileCompletion();
  
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); //New
  const [qualificationToDelete, setQualificationToDelete] = useState(null); //New
  
  // Get profile status from sessionStorage
  const profileStatus = sessionStorage.getItem('profile_status');
  const isButtonDisabled = profileStatus === '2' || profileStatus === '3'; // Disable for submitted or approved


  // ALL EXISTING CODE BELOW REMAINS EXACTLY THE SAME
  // Load from sessionStorage on mount
  useEffect(() => {
    const storedProfile = sessionStorage.getItem('profileData');
    if (storedProfile) {
      setLocalProfileData(JSON.parse(storedProfile));
    } else {
      setLocalProfileData(profileData);
    }
  }, [profileData]);

  // Fetch master data only once on mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const qualificationResponse = await axiosInstance.get("/masters/qualification-all");
        setMasterData({
          qualification: qualificationResponse.data.data.qualification || [],
        });
      } catch (err) {
        console.error("Error fetching master data:", err);
        setError("Failed to fetch master data");
        toast.error("Failed to fetch master data", {
          className: "bg-primary-500 text-white",progressClassName: "bg-primary-200",
        });
      }
    };

    fetchMasterData();
  }, []);

  const getMasterValue = useCallback(
    (id, key) => {
      if (!id && id !== 0) return "N/A";
      if (key === "qualification_id") {
        const match = masterData.qualification.find(
          (item) => String(item.qualification_id) === String(id)
        );
        return match ? match.qualification : "N/A";
      }
      return "N/A";
    },
    [masterData]
  );

  const mapSparkDataToEducationalQualifications = useCallback(
    (sparkData, dbQualifications = []) => {
      if (!sparkData || !sparkData.education_details) return { details: [], sparkKeys: new Set() };

      const sparkKeys = new Set();
      const tempSparkList = sparkData.education_details.map((edu, index) => {
        const qualificationMatch = masterData.qualification.find(
          (q) => q.qualification.toLowerCase() === (edu.course_type || "").toLowerCase()
        );
        const qualification = {
          ais_edu_id: `spark_${index}`, // Ensure string format
          qualification_id: qualificationMatch ? qualificationMatch.qualification_id : "",
          raw_qualification: edu.course_type || "",
          subject_name: edu.subject || "",
          institute_name: edu.university || "",
          _source: "SPARK",
          isSaved: false,
          fields: {}, // Empty for pure SPARK
          fieldSources: {
            qualification_id: "SPARK",
            subject_name: "SPARK",
            institute_name: "SPARK",
          },
        };

        if (edu.course_type && qualificationMatch) sparkKeys.add(`qualification_id_${index}`);
        if (edu.subject) sparkKeys.add(`subject_name_${index}`);
        if (edu.university) sparkKeys.add(`institute_name_${index}`);

        return qualification;
      });

      // Merge with DB qualifications
      const dbQualificationsList = dbQualifications.map((dbQual) => {
        // Per-field source determination
        const fieldSources = {
          qualification_id: dbQual.fields?.AIS_OFFICER?.qualification_id !== undefined ? "USER" :
                            dbQual.fields?.DB_SPARK_API?.qualification_id !== undefined ? "SPARK" :
                            dbQual.fields?.GAD_OFFICER?.qualification_id !== undefined ? "GAD" : "UNKNOWN",
          subject_name: dbQual.fields?.AIS_OFFICER?.subject_name !== undefined ? "USER" :
                        dbQual.fields?.DB_SPARK_API?.subject_name !== undefined ? "SPARK" :
                        dbQual.fields?.GAD_OFFICER?.subject_name !== undefined ? "GAD" : "UNKNOWN",
          institute_name: dbQual.fields?.AIS_OFFICER?.institute_name !== undefined ? "USER" :
                          dbQual.fields?.DB_SPARK_API?.institute_name !== undefined ? "SPARK" :
                          dbQual.fields?.GAD_OFFICER?.institute_name !== undefined ? "GAD" : "UNKNOWN",
        };

        // Determine overall _source
        const sources = Object.values(fieldSources);
        const _source = sources.every(s => s === "SPARK") ? "SPARK" :
                        sources.every(s => s === "USER") ? "USER" :
                        sources.some(s => s === "USER") ? "MIXED" : "SPARK";

        // Extract qualification_id from fields if available
        const dbQualId = dbQual.fields?.DB_SPARK_API?.qualification_id || dbQual.fields?.AIS_OFFICER?.qualification_id || dbQual.qualification_id;

        return {
          ais_edu_id: String(dbQual.ais_edu_id), // Ensure string format
          qualification_id: dbQualId || "",
          raw_qualification: getMasterValue(dbQualId, "qualification_id"),
          subject_name: dbQual.subject_name || "",
          institute_name: dbQual.institute_name || "",
          _source,
          isSaved: true,
          fields: dbQual.fields,
          fieldSources,
        };
      });

      // Match Spark data with DB data and update saved status
      const matchedSparkIndices = new Set();
      dbQualifications.forEach((dbQual, dbIndex) => {
        const dbQualId = dbQual.fields?.DB_SPARK_API?.qualification_id || dbQual.fields?.AIS_OFFICER?.qualification_id || dbQual.qualification_id;
        const matchedIndex = tempSparkList.findIndex((sparkQual, sparkIndex) => {
          const sparkQualName = String(getMasterValue(sparkQual.qualification_id, "qualification_id") || sparkQual.raw_qualification || "").toLowerCase().trim();
          const dbQualName = String(getMasterValue(dbQualId, "qualification_id") || "").toLowerCase().trim();
          const sparkSubject = String(sparkQual.subject_name || "").toLowerCase().trim();
          const sparkInstitute = String(sparkQual.institute_name || "").toLowerCase().trim();
          const dbSubject = String(dbQual.subject_name || "").toLowerCase().trim();
          const dbInstitute = String(dbQual.institute_name || "").toLowerCase().trim();

          const qualMatch = sparkQualName === dbQualName;
          const subjectMatch = !sparkSubject || sparkSubject === dbSubject;
          const instituteMatch = !sparkInstitute || sparkInstitute === dbInstitute;
          const isMatch = qualMatch && subjectMatch && instituteMatch;
          if (isMatch) {
            matchedSparkIndices.add(sparkIndex);
            tempSparkList[sparkIndex].isSaved = true;
            tempSparkList[sparkIndex].ais_edu_id = String(dbQual.ais_edu_id); // Update with DB ais_edu_id
            tempSparkList[sparkIndex].qualification_id = dbQualId; // Update with DB qualification_id
            // Update fields with DB values (prioritize DB)
            tempSparkList[sparkIndex].subject_name = dbQual.subject_name || sparkQual.subject_name || "";
            tempSparkList[sparkIndex].institute_name = dbQual.institute_name || sparkQual.institute_name || "";
            tempSparkList[sparkIndex].raw_qualification = getMasterValue(dbQualId, "qualification_id") || sparkQual.raw_qualification || "";
            // Set fields from DB
            tempSparkList[sparkIndex].fields = dbQual.fields;
            // Set fieldSources from DB
            tempSparkList[sparkIndex].fieldSources = {
              qualification_id: dbQual.fields?.AIS_OFFICER?.qualification_id !== undefined ? "USER" :
                                dbQual.fields?.DB_SPARK_API?.qualification_id !== undefined ? "SPARK" :
                                dbQual.fields?.GAD_OFFICER?.qualification_id !== undefined ? "GAD" : "UNKNOWN",
              subject_name: dbQual.fields?.AIS_OFFICER?.subject_name !== undefined ? "USER" :
                            dbQual.fields?.DB_SPARK_API?.subject_name !== undefined ? "SPARK" :
                            dbQual.fields?.GAD_OFFICER?.subject_name !== undefined ? "GAD" : "UNKNOWN",
              institute_name: dbQual.fields?.AIS_OFFICER?.institute_name !== undefined ? "USER" :
                              dbQual.fields?.DB_SPARK_API?.institute_name !== undefined ? "SPARK" :
                              dbQual.fields?.GAD_OFFICER?.institute_name !== undefined ? "GAD" : "UNKNOWN",
            };
            // Update _source based on fieldSources
            const sources = Object.values(tempSparkList[sparkIndex].fieldSources);
            tempSparkList[sparkIndex]._source = sources.every(s => s === "SPARK") ? "SPARK" :
                                                sources.every(s => s === "USER") ? "USER" :
                                                sources.some(s => s === "USER") ? "MIXED" : "SPARK";
          }
          return isMatch;
        });
      });

      // Combine all data: unmatched Spark (unsaved), matched Spark (saved), and DB entries
    const finalDetails = [
  ...tempSparkList.filter((_, index) => !matchedSparkIndices.has(index)), // Unsaved Spark data
  ...tempSparkList.filter((_, index) => matchedSparkIndices.has(index)), // Saved Spark data
  ...dbQualificationsList,
].reduce((unique, current) => {
  if (!unique.some((item) => String(item.ais_edu_id) === String(current.ais_edu_id))) {
    unique.push(current);
  }
  return unique;
}, []);

console.log("Final details after reduce:", JSON.stringify(finalDetails, null, 2));

      // Sort by displayed qualification
      finalDetails.sort((a, b) =>
        (getMasterValue(a.qualification_id, "qualification_id") || a.raw_qualification || "N/A").localeCompare(
          (getMasterValue(b.qualification_id, "qualification_id") || b.raw_qualification || "N/A")
        )
      );

      if (tempSparkList.length > 0 && [...matchedSparkIndices].length > dbQualifications.length) {
        console.warn("Multiple Spark records matched a single DB record; using first match per DB entry.");
      }

      return { details: finalDetails, sparkKeys };
    },
    [masterData, getMasterValue]
  );

  // Process education data when masterData or localProfileData changes
// Process education data when masterData or localProfileData changes
useEffect(() => {
  if (!masterData.qualification.length || !localProfileData) return;

  // ADD THIS: Check for cached educational qualifications first
  const storedQualifications = sessionStorage.getItem('educational_qualifications');
  if (storedQualifications) {
    console.log("Loading educational qualifications from sessionStorage");
    const parsedQualifications = JSON.parse(storedQualifications);
    setEducationalQualifications(parsedQualifications);
    setLoading(false);
    return;
  }

  const processEducationData = () => {
    const sparkData = localProfileData.spark_data?.data || {};
    const dbQualifications = localProfileData.officer_data?.get_all_officer_info_by_user_id?.edu_qualification || [];

    const { details: sparkMappedDetails, sparkKeys } = mapSparkDataToEducationalQualifications(sparkData, dbQualifications);

    setEducationalQualifications((prev) => {
      if (JSON.stringify(prev) !== JSON.stringify(sparkMappedDetails)) {
        return sparkMappedDetails;
      }
      return prev;
    });
    setSparkFields((prev) => {
      if (JSON.stringify([...prev]) !== JSON.stringify([...sparkKeys])) {
        return sparkKeys;
      }
      return prev;
    });
  };

  setLoading(true);
  processEducationData();
  setLoading(false);
}, [masterData, localProfileData, mapSparkDataToEducationalQualifications]);

 const sections = useMemo(() => {
  const cards = educationalQualifications.map((qualification, index) => ({
    ais_edu_id: qualification.ais_edu_id,
    isSaved: qualification.isSaved,
    fields: [
      {
        label: "Qualification",
        key: `qualification_id_${index}`,
        originalKey: "qualification_id",
        icon: AcademicCapIcon,
        isMaster: true,
        source: qualification.fieldSources.qualification_id,
        computeValue: () => getMasterValue(qualification.qualification_id, "qualification_id") || qualification.raw_qualification || "N/A",
      },
      {
        label: "Institute",
        key: `institute_name_${index}`,
        originalKey: "institute_name",
        icon: BuildingLibraryIcon,
        source: qualification.fieldSources.institute_name,
        computeValue: () => qualification.institute_name || "N/A",
      },
      {
        label: "Subject",
        key: `subject_name_${index}`,
        originalKey: "subject_name",
        icon: BookOpenIcon,
        source: qualification.fieldSources.subject_name,
        computeValue: () => qualification.subject_name || "N/A",
      },
    ],
  }));
  console.log("Generated sections:", JSON.stringify(cards, null, 2));
  return [{ cards }];
}, [educationalQualifications, getMasterValue]);

 // Button Handlers
  const handleAdd = useCallback(
    (e) => {
      e.stopPropagation();
      setSelectedQualification({
        ais_edu_id: null,
        qualification_id: "",
        raw_qualification: "",
        institute_name: "",
        subject_name: "",
        _source: "USER",
        isSaved: false,
        fields: {},
        fieldSources: {
          qualification_id: "USER",
          subject_name: "USER",
          institute_name: "USER",
        },
      });
      setModalOpen(true);
    },
    []
  );

  const handleEdit = useCallback(
    (qualification) => (e) => {
      e.stopPropagation();
      const cleanQualification = {
        ais_edu_id: String(qualification.ais_edu_id), // Ensure string format
        qualification_id: qualification.qualification_id || "",
        raw_qualification: qualification.raw_qualification || "",
        institute_name: qualification.institute_name || "",
        subject_name: qualification.subject_name || "",
        _source: qualification._source || "USER",
        isSaved: qualification.isSaved,
        fields: qualification.fields,
        fieldSources: qualification.fieldSources,
      };
      console.log("Selected Qualification:", JSON.stringify(cleanQualification, null, 2));
      setSelectedQualification(cleanQualification);
      setModalOpen(true);
    },
    []
  );
   
  const handleDeleteClick = useCallback((qualification) => {
    setQualificationToDelete(qualification);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if(!qualificationToDelete) return;

    const qualificationId = qualificationToDelete.ais_edu_id;

    if(isButtonDisabled) {
      toast.error("cannot delete qualification after the profile is submitted or approved", {
        className: "bg-red-500 text-white",
        progressClassName: "bg-red-200",
      });
      return;
    }

    console.log("Delete qualification with ID:", qualificationId);

    // Example of how delete would work:
    
    // setDeleteLoading(qualificationId);
    // try {
      // Check if it's a SPARK entry (not saved to DB yet)
      if (typeof qualificationId === "string" && qualificationId.startsWith("spark_")) {
        // Remove from local state only
        setEducationalQualifications(prev => prev.filter(q => q.ais_edu_id !== qualificationId));
        toast.success("Qualification removed successfully", {
          className: "bg-primary-500 text-white",
          progressClassName: "bg-primary-200",
        });
        return;
      }

      // For saved entries, call the API
      setDeleteLoading(qualificationId);
      try {
      const response = await axiosInstance.delete(`/officer/qualification_officer_delete/${qualificationId}`);
      
      if (response.data.success) {
        // Remove from local state
        setEducationalQualifications(prev => prev.filter(q => String(q.ais_edu_id) !== String(qualificationId)));
        
        // Update sessionStorage
        const updatedQualifications = educationalQualifications.filter(q => String(q.ais_edu_id) !== String(qualificationId));
        sessionStorage.setItem('educational_qualifications', JSON.stringify(updatedQualifications));
        
        toast.success("Qualification deleted successfully", {
          className: "bg-primary-500 text-white",
          progressClassName: "bg-primary-200",
        });
      } else {
        throw new Error("Failed to delete qualification");
      }
    } catch (err) {
      console.error("Error deleting qualification:", err);
      toast.error("Failed to delete qualification", {
        className: "bg-red-500 text-white",
        progressClassName: "bg-red-200",
      });
    } finally {
      setDeleteLoading(null);
      setIsDeleteModalOpen(false);
      setQualificationToDelete(null);
    }
    
  }, [isButtonDisabled, educationalQualifications, qualificationToDelete]);


  const handleSave = useCallback(
    async (updatedData) => {
      try {
      console.log("Incoming updatedData:", JSON.stringify(updatedData, null, 2));

      const isSparkEntry = selectedQualification && selectedQualification.ais_edu_id && typeof selectedQualification.ais_edu_id === "string" && selectedQualification.ais_edu_id.startsWith("spark_");
      const isUpdate = selectedQualification && selectedQualification.ais_edu_id && !(typeof selectedQualification.ais_edu_id === "string" && selectedQualification.ais_edu_id.startsWith("spark_"));
      const isNew = !selectedQualification || !selectedQualification.ais_edu_id;

      // FIXED: Only include fields that were actually modified
      const requestBody = {
        spark_data: updatedData.spark_data || null,
        user_data: {}
      };

      // Only include fields that were explicitly provided in user_data
      if (updatedData.user_data) {
        if (updatedData.user_data.qualification_id !== undefined && updatedData.user_data.qualification_id !== null) {
          requestBody.user_data.qualification_id = updatedData.user_data.qualification_id;
        }
        if (updatedData.user_data.subject_name !== undefined && updatedData.user_data.subject_name !== null) {
          requestBody.user_data.subject_name = updatedData.user_data.subject_name;
        }
        if (updatedData.user_data.institute_name !== undefined && updatedData.user_data.institute_name !== null) {
          requestBody.user_data.institute_name = updatedData.user_data.institute_name;
        }
      }

      console.log("Request body:", JSON.stringify(requestBody, null, 2));

      // Duplication check - use the actual values that will be saved
      const newQualId = String(
        requestBody.user_data.qualification_id !== undefined 
          ? requestBody.user_data.qualification_id 
          : selectedQualification?.qualification_id || ""
      );
      const newSubject = 
        requestBody.user_data.subject_name !== undefined 
          ? requestBody.user_data.subject_name 
          : selectedQualification?.subject_name || "";
      
      const hasDuplicate = educationalQualifications.some((existing) => {
        const existingQualId = String(existing.qualification_id || "");
        const existingSubject = existing.subject_name || "";
        const isSelf = isUpdate && String(existing.ais_edu_id) === String(selectedQualification.ais_edu_id);
        return (
          !isSelf &&
          existingQualId === newQualId &&
          String(existingSubject).toLowerCase().trim() === String(newSubject).toLowerCase().trim() &&
          existing.isSaved
        );
      });

      if (hasDuplicate) {
        toast.error("An entry with the same qualification and subject already exists. Please choose a different combination.", {
          className: "bg-red-500 text-white",
          progressClassName: "bg-red-200",
        });
        return;
      }

      let response;
      if (isSparkEntry || isNew) {
        response = await axiosInstance.post("officer/qualification", requestBody);
      } else if (isUpdate) {
        response = await axiosInstance.put(`officer/qualification/${selectedQualification.ais_edu_id}`, requestBody);
      }

      if (response.data.success) {
        const savedQualification = response.data.data.qualification_officer;

        // Reconstruct fields based on request
        let updatedSavedQualification = { ...savedQualification };
        if (requestBody.spark_data) {
          updatedSavedQualification.fields = {
            ...updatedSavedQualification.fields,
            DB_SPARK_API: {
              ...(updatedSavedQualification.fields?.DB_SPARK_API || {}),
              ...requestBody.spark_data
            }
          };
        }
        if (Object.keys(requestBody.user_data).length > 0) {
          updatedSavedQualification.fields = {
            ...updatedSavedQualification.fields,
            AIS_OFFICER: {
              ...(updatedSavedQualification.fields?.AIS_OFFICER || {}),
              ...requestBody.user_data
            }
          };
        }

        // Update localProfileData and sessionStorage
        const updatedEduQualifications = [...(localProfileData.officer_data?.get_all_officer_info_by_user_id?.edu_qualification || [])];
        if (isNew || isSparkEntry) {
          updatedEduQualifications.push(updatedSavedQualification);
        } else if (isUpdate) {
          const index = updatedEduQualifications.findIndex(q => String(q.ais_edu_id) === String(selectedQualification.ais_edu_id));
          if (index !== -1) {
            updatedEduQualifications[index] = updatedSavedQualification;
          }
        }

        const updatedProfileData = {
          ...localProfileData,
          officer_data: {
            ...localProfileData.officer_data,
            get_all_officer_info_by_user_id: {
              ...localProfileData.officer_data.get_all_officer_info_by_user_id,
              edu_qualification: updatedEduQualifications
            }
          },
          spark_data: localProfileData.spark_data
        };

        setLocalProfileData(updatedProfileData);
        sessionStorage.setItem('profileData', JSON.stringify(updatedProfileData));

        // FIXED: Preserve original field sources - if it was SPARK, keep it as SPARK even after saving
        const originalFieldSources = selectedQualification?.fieldSources || {
          qualification_id: "USER",
          subject_name: "USER", 
          institute_name: "USER",
        };

        // Only update field sources for fields that were actually modified by user
        const updatedFieldSources = { ...originalFieldSources };

        if (requestBody.user_data.qualification_id !== undefined) {
          updatedFieldSources.qualification_id = "USER";
        }
        if (requestBody.user_data.subject_name !== undefined) {
          updatedFieldSources.subject_name = "USER";
        }
        if (requestBody.user_data.institute_name !== undefined) {
          updatedFieldSources.institute_name = "USER";
        }

        // Determine overall _source based on updated fieldSources
        const sources = Object.values(updatedFieldSources);
        const _source = sources.every(s => s === "SPARK") ? "SPARK" :
                        sources.every(s => s === "USER") ? "USER" :
                        sources.some(s => s === "USER") ? "MIXED" : "SPARK";

        setEducationalQualifications((prevData = []) => {
          const updatedQualification = {
            ais_edu_id: String(savedQualification.ais_edu_id),
            qualification_id: savedQualification.qualification_id || selectedQualification?.qualification_id || "",
            raw_qualification: getMasterValue(savedQualification.qualification_id, "qualification_id") || selectedQualification?.raw_qualification || "",
            subject_name: savedQualification.subject_name || selectedQualification?.subject_name || "",
            institute_name: savedQualification.institute_name || selectedQualification?.institute_name || "",
            _source,
            isSaved: true,
            fields: updatedSavedQualification.fields,
            fieldSources: updatedFieldSources, // Keep original sources
          };

          let newQualifications;
          if (isSparkEntry) {
            // Replace the SPARK entry with the saved one
            newQualifications = prevData.map(qualification =>
              String(qualification.ais_edu_id) === String(selectedQualification.ais_edu_id)
                ? updatedQualification
                : qualification
            );
          } else if (isUpdate) {
            newQualifications = prevData.map((qualification) =>
              String(qualification.ais_edu_id) === String(selectedQualification.ais_edu_id)
                ? updatedQualification
                : qualification
            );
          } else {
            newQualifications = [...prevData, updatedQualification];
          }

          // Store processed educational qualifications in sessionStorage
          sessionStorage.setItem('educational_qualifications', JSON.stringify(newQualifications));
          
          console.log("Updated educationalQualifications:", JSON.stringify(newQualifications, null, 2));
          return newQualifications;
        });

        setModalOpen(false);
        setSelectedQualification(null);
        toast.success(
          isUpdate || isSparkEntry
            ? "Qualification updated successfully"
            : "Qualification added successfully",
          {
            className: "bg-primary-500 text-white",
            progressClassName: "bg-primary-200",
          }
        );
      } else {
        toast.error("Failed to save qualification details", {
          className: "bg-red-500 text-white",
          progressClassName: "bg-red-200",
        });
      }
    } catch (err) {
      console.error("Error saving qualification:", err);
      if (err.response?.status === 409 || err.response?.data?.message?.includes("duplicate") || err.message.includes("duplicate")) {
        toast.error("Duplicate qualification and subject already exists. Please choose a different combination.", {
          className: "bg-red-500 text-white",
          progressClassName: "bg-red-200",
        });
      } else {
        toast.error("Error occurred while saving qualification", {
          className: "bg-red-500 text-white",
          progressClassName: "bg-red-200",
        });
      }
    }
  },
  [selectedQualification, getMasterValue, educationalQualifications, localProfileData]
);

useEffect(() => {
    if (!loading && educationalQualifications) { // After data is set
      const total = educationalQualifications.length;
      const completed = educationalQualifications.filter(q => q.isSaved).length; // Based on existing isSaved
      if (total === 0) {
        updateSectionProgress('education', 0, 0); // No cards = complete
      } else {
        updateSectionProgress('education', completed, total); // All must be saved for 100%
      }
    }
  }, [educationalQualifications, loading, updateSectionProgress]);
  

   // Common Button Helper Functions
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
          <span>Add Education</span>
        </button>
        {isButtonDisabled && (
          <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            Cannot add educational qualifications after the profile is submitted or approved
          </div>
        )}
      </div>
    );
  };

  const renderEditButton = (qualification, index) => {
    if (sessionStorage.getItem('role_id') !== '2') return null;
    
    return (
      <div className="relative group">
        <button
          className={`${
            isButtonDisabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400'
          }`}
          onClick={handleEdit(qualification)}
          disabled={isButtonDisabled}
        >
          <PencilSquareIcon className="w-4 h-4" strokeWidth={2} />
        </button>
        <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          {isButtonDisabled ? 'Cannot edit qualification after the profile is submitted or approved' : 'Edit Educational Qualification'}
        </div>
      </div>
    );
  };
  //Render Delete Button with tooltip
  const renderDeleteButton = (qualification) => {
    if (sessionStorage.getItem('role_id') !== '2') return null;

    //check if any field has spark as source
    const hasSparkData = Object.values(qualification.fieldSources || {}).some(
      (source) => source ==="SPARK"
    );
    if (hasSparkData) return null; // Do not render delete button if any field is from SPARK
    const isLoading = deleteLoading === qualification.ais_edu_id;
    
    return (
      <div className="relative group">
        <button
          className={`${
            isButtonDisabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-red-600 hover:text-red-500 dark:hover:text-red-400'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => handleDeleteClick(qualification)}
          disabled={isButtonDisabled || isLoading}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-t-2 border-b-2 border-red-600 rounded-full animate-spin"></div>
          ) : (
            <TrashIcon className="w-4 h-4" strokeWidth={2} />
          )}
        </button>
        <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          {isButtonDisabled ? 'Cannot delete qualification after the profile is submitted or approved' : 'Delete'}
        </div>
      </div>
    );
  };

  const renderSparkIndicator = (fieldKey, fieldSource, qualification, originalKey) => {
    if (fieldSource !== "SPARK") return null;

  // Get the field value from the qualification object
  const fieldValue = qualification[originalKey];

  // Only show the Spark indicator if the field value is not null, undefined, or empty
  if (fieldValue === null || fieldValue === undefined || fieldValue === "") return null;

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

  const renderGadOfficerIndicator = (fieldKey, qualification) => {
    if (qualification.fields?.GAD_OFFICER?.[fieldKey] === undefined) return null;
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
      <div className="absolute top-2 left-2 group">
        <span
          className={`inline-flex items-center rounded-full ${
            isSaved ? "text-green-600" : "text-red-600"
          } text-xs`}
          aria-label={isSaved ? "Saved" : "Not Saved"}
        >
          {isSaved ? (
            <CheckCircleIcon className="w-4 h-4" />
          ) : (
            <ExclamationTriangleIcon className="w-4 h-4" />
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

  if (error) {
    return (
      <div className="text-red-500 text-center p-3 rounded-md bg-red-50 dark:bg-red-900/30 text-sm">
        {error}
      </div>
    );
  }
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
      ) : sections[0].cards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sections[0].cards.map((card, index) => (
            <div
              key={card.ais_edu_id}
              className="relative bg-gray-50 dark:bg-gray-800 border border-indigo-300 dark:border-indigo-600 rounded-md p-3 shadow-sm"
            >
              {renderSavedIndicator(card.isSaved)}
              <div className="flex items-center justify-end mb-2 gap-2">
                {renderEditButton(educationalQualifications[index], index)}
                {renderDeleteButton(educationalQualifications[index])}
              </div>
             <div className="space-y-2">
                {card.fields.map((field) => (
                  <div
                    key={field.key}
                    className="relative flex items-start gap-2 bg-white dark:bg-gray-700 rounded-lg p-2 border border-gray-200 dark:border-gray-600"
                  >
                    {renderSparkIndicator(field.key, field.source, educationalQualifications[index], field.originalKey)}
                    {renderUserIndicator(field.key, field.source)}
                    {renderGadOfficerIndicator(field.originalKey, educationalQualifications[index])}
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mt-0.5">
                      <field.icon className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {field.label}
                      </p>
                      <p 
                        className={`text-sm font-bold text-gray-900 dark:text-white ${
                          field.originalKey === 'institute_name' || field.originalKey === 'subject_name' 
                            ? 'break-words line-clamp-5' 
                            : 'truncate'
                        }`}
                        title={field.computeValue
                          ? (() => {
                              const val = field.computeValue();
                              return val === null || val === undefined || Number.isNaN(val) ? "N/A" : val;
                            })()
                          : field.isMaster
                          ? getMasterValue(
                              educationalQualifications[index][field.originalKey],
                              field.originalKey
                            )
                          : educationalQualifications[index][field.originalKey] || "N/A"}
                      >
                        {field.computeValue
                          ? (() => {
                              const val = field.computeValue();
                              return val === null || val === undefined || Number.isNaN(val) ? "N/A" : val;
                            })()
                          : field.isMaster
                          ? getMasterValue(
                              educationalQualifications[index][field.originalKey],
                              field.originalKey
                            )
                          : educationalQualifications[index][field.originalKey] || "N/A"}
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
          No Qualification Details Available.
        </div>
      )}
      <ModalEducationalQualifications
        open={isModalOpen}
        setOpen={setModalOpen}
        educationalQualifications={selectedQualification}
        onSave={handleSave}
        masterData={masterData}
        isSparkData={selectedQualification && selectedQualification._source === "SPARK"}
        sparkFields={sparkFields}
      />
      <ConfirmModal
          isOpen={isDeleteModalOpen}
          setIsOpen={setIsDeleteModalOpen}
          onConfirm={handleDeleteConfirm}
          title="Delete Qualification Details"
          message={`Are you sure you want to delete "${
            qualificationToDelete
                ? getMasterValue(qualificationToDelete.qualification_id, "qualification_id") || 'this qualification'
                : "this qualification"
              }"? This action cannot be undone.`}
              iconType="delete"
              confirmText="Delete"
            />
    </div>
  );
}