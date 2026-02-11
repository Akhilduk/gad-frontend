"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  BoltIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/solid";
import { ModalSuspensionDetails } from "../modal/suspension-details";
import { toast } from "react-toastify";
import axiosInstance from "@/utils/apiClient";
import { useProfileCompletion } from '@/contexts/Profile-completion-context';
import moment from 'moment';

export function SuspensionDetails({ profileData }) {
  const { updateSectionProgress } = useProfileCompletion();
  const [isModalOpen, setModalOpen] = useState(false);
  const [suspensionList, setSuspensionList] = useState([]);
  const [selectedSuspension, setSelectedSuspension] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [officerFields, setOfficerFields] = useState({
    GAD_OFFICER: [],
    AIS_OFFICER: [],
    DB_SPARK_API: [],
  });
  const [sparkFields, setSparkFields] = useState(new Set());

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = moment(dateString);
    return date.isValid() ? date.format("DD/MM/YYYY") : "N/A";
  };

  const calculateDuration = (from, to) => {
    if (!from || !to) return "N/A";
    const fromDate = moment(from);
    const toDate = moment(to);
    if (!fromDate.isValid() || !toDate.isValid()) return "N/A";

    const duration = moment.duration(toDate.diff(fromDate));
    
    const years = duration.years();
    const months = duration.months();
    const days = duration.days();

    return [
      years > 0 ? `${years} year${years > 1 ? "s" : ""}` : "",
      months > 0 ? `${months} month${months > 1 ? "s" : ""}` : "",
      days > 0 ? `${days} day${days > 1 ? "s" : ""}` : "",
    ]
      .filter(Boolean)
      .join(", ");
  };
    const getSuspensionStatus = (toPeriod) => {
    if (!toPeriod) return "Active";
    const today = moment();
    const toDate = moment(toPeriod);
    return today.isSameOrBefore(toDate) ? "Active" : "Past";
  };

  const mapSuspensionData = useCallback((sparkData, dbSuspensions = []) => {
    const sparkKeys = new Set();
    let tempSparkList = [];

    if (sparkData?.suspension_details?.length > 0) {
      tempSparkList = sparkData.suspension_details.map((sus, index) => {
        const suspension = {
          ais_sub_id: `spark_${index}`,
          suspension_details: sus.reason || "",
          from_period: sus.from_date || "",
          to_period: sus.to_date || "",
          _source: "SPARK",
          isSaved: false,
          fieldSources: {
            suspension_details: "SPARK",
            from_period: "SPARK",
            to_period: "SPARK",
          },
        };

        if (sus.reason) sparkKeys.add(`suspension_details_${index}`);
        if (sus.from_date) sparkKeys.add(`from_period_${index}`);
        if (sus.to_date) sparkKeys.add(`to_period_${index}`);

        return suspension;
      });
    }

    const dbSuspensionsList = dbSuspensions.map((dbSus) => {
      const fieldSources = {};
      const suspension = {
        ais_sub_id: String(dbSus.ais_sub_id),
        suspension_details: "",
        from_period: "",
        to_period: "",
        _source: "MIXED",
        isSaved: true,
        fieldSources,
      };

      const fieldKeys = ["suspension_details", "from_period", "to_period"];
      let hasUserData = false;

      fieldKeys.forEach((key) => {
        if (dbSus.fields?.GAD_OFFICER?.[key]) {
          suspension[key] = dbSus.fields.GAD_OFFICER[key];
          fieldSources[key] = "GAD_OFFICER";
          hasUserData = true;
        } else if (dbSus.fields?.AIS_OFFICER?.[key]) {
          suspension[key] = dbSus.fields.AIS_OFFICER[key];
          fieldSources[key] = "USER";
          hasUserData = true;
        } else if (dbSus.fields?.UNKNOWN?.[key]) {
          suspension[key] = dbSus.fields.UNKNOWN[key];
          fieldSources[key] = "UNKNOWN";
        } else {
          fieldSources[key] = "NONE";
        }
      });

      suspension._source = hasUserData ? "USER" : "MIXED";

      return suspension;
    });

    const matchedSparkIndices = new Set();
    dbSuspensions.forEach((dbSus) => {
      const matchedIndex = tempSparkList.findIndex((sparkSus, sparkIndex) => {
        const sparkDetails = String(sparkSus.suspension_details || "").toLowerCase();
        const dbDetails = String(
          dbSus.fields?.GAD_OFFICER?.suspension_details ||
            dbSus.fields?.AIS_OFFICER?.suspension_details ||
            dbSus.fields?.UNKNOWN?.suspension_details ||
            ""
        ).toLowerCase();
        const sparkFrom = String(sparkSus.from_period || "").toLowerCase();
        const dbFrom = String(
          dbSus.fields?.GAD_OFFICER?.from_period ||
            dbSus.fields?.AIS_OFFICER?.from_period ||
            dbSus.fields?.UNKNOWN?.from_period ||
            ""
        ).toLowerCase();
        const sparkTo = String(sparkSus.to_period || "").toLowerCase();
        const dbTo = String(
          dbSus.fields?.GAD_OFFICER?.to_period ||
            dbSus.fields?.AIS_OFFICER?.to_period ||
            dbSus.fields?.UNKNOWN?.to_period ||
            ""
        ).toLowerCase();

        const isMatch =
          sparkDetails === dbDetails &&
          sparkFrom === dbFrom &&
          sparkTo === dbTo;
        if (isMatch) {
          matchedSparkIndices.add(sparkIndex);
          tempSparkList[sparkIndex].isSaved = true;
          tempSparkList[sparkIndex].ais_sub_id = String(dbSus.ais_sub_id);
          tempSparkList[sparkIndex].fieldSources = {
            suspension_details:
              dbSus.fields?.GAD_OFFICER?.suspension_details ||
              dbSus.fields?.AIS_OFFICER?.suspension_details
                ? dbSus.fields?.GAD_OFFICER?.suspension_details
                  ? "GAD_OFFICER"
                  : "USER"
                : "SPARK",
            from_period:
              dbSus.fields?.GAD_OFFICER?.from_period ||
              dbSus.fields?.AIS_OFFICER?.from_period
                ? dbSus.fields?.GAD_OFFICER?.from_period
                  ? "GAD_OFFICER"
                  : "USER"
                : "SPARK",
            to_period:
              dbSus.fields?.GAD_OFFICER?.to_period ||
              dbSus.fields?.AIS_OFFICER?.to_period
                ? dbSus.fields?.GAD_OFFICER?.to_period
                  ? "GAD_OFFICER"
                  : "USER"
                : "SPARK",
          };
        }
        return isMatch;
      });
    });

    const finalDetails = [
      ...tempSparkList.filter((_, index) => !matchedSparkIndices.has(index)),
      ...tempSparkList.filter((_, index) => matchedSparkIndices.has(index)),
      ...dbSuspensionsList,
    ].reduce((unique, current) => {
      if (
        !unique.some(
          (item) => String(item.ais_sub_id) === String(current.ais_sub_id)
        )
      ) {
        unique.push(current);
      }
      return unique;
    }, []);

   finalDetails.sort((a, b) => {
    const dateToA = a.to_period ? moment(a.to_period) : moment(0);
    const dateToB = b.to_period ? moment(b.to_period) : moment(0);
    if (dateToA.valueOf() === dateToB.valueOf()) {
      const dateFromA = a.from_period ? moment(a.from_period) : moment(0);
      const dateFromB = b.from_period ? moment(b.from_period) : moment(0);
      return dateFromB.valueOf() - dateFromA.valueOf();
    }
    return dateToB.valueOf() - dateToA.valueOf();
  });

    if (
      tempSparkList.length > 0 &&
      [...matchedSparkIndices].length > dbSuspensions.length
    ) {
      console.warn(
        "Multiple Spark records matched a single DB record; using first match per DB entry."
      );
    }

    return { details: finalDetails, sparkKeys };
  }, []);

  useEffect(() => {
    if (!profileData) return;

    const processSuspensionData = () => {
      try {
        const sparkData = profileData.spark_data?.data || {};
        const officerInfo =
          profileData.officer_data?.get_all_officer_info_by_user_id
            ?.officer_info?.[0] || {};
        const dbSuspensions =
          profileData.officer_data?.get_all_officer_info_by_user_id
            ?.suspension_info || [];

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
        };
        setOfficerFields(officerFieldsData);

        const { details: sparkMappedDetails, sparkKeys } =
          mapSuspensionData(sparkData, dbSuspensions);

        setSuspensionList((prev) => {
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
      } catch (err) {
        console.error("Error processing suspension data:", err);
        setError("Failed to process suspension data.");
      }
    };

    setLoading(true);
    processSuspensionData();
    setLoading(false);
  }, [profileData, mapSuspensionData]);

  const sections = useMemo(
    () =>
      [
        {
          cards: suspensionList.map((suspension, index) => ({
            ais_sub_id: suspension.ais_sub_id,
            isSaved: suspension.isSaved,
            status: getSuspensionStatus(suspension.to_period),
            fields: [
              {
                label: "Suspension Reason",
                key: `suspension_details_${index}`,
                originalKey: "suspension_details",
                icon: DocumentTextIcon,
                source: suspension.fieldSources.suspension_details,
                computeValue: () => suspension.suspension_details || "N/A",
              },
              {
                label: "From Period",
                key: `from_period_${index}`,
                originalKey: "from_period",
                icon: CalendarIcon,
                source: suspension.fieldSources.from_period,
                computeValue: () => formatDate(suspension.from_period),
              },
              {
                label: "To Period",
                key: `to_period_${index}`,
                originalKey: "to_period",
                icon: CalendarIcon,
                source: suspension.fieldSources.to_period,
                computeValue: () => formatDate(suspension.to_period),
              },
              {
                label: "Duration",
                key: `duration_${index}`,
                originalKey: "duration",
                icon: ClockIcon,
                source: "COMPUTED",
                computeValue: () =>
                  calculateDuration(suspension.from_period, suspension.to_period),
              },
            ],
          })),
        },
      ],
    [suspensionList]
  );

  const handleSave = useCallback(
    async (updatedData) => {
      try {
        console.log("Incoming updatedData:", JSON.stringify(updatedData, null, 2));

        const isSparkEntry =
          selectedSuspension &&
          selectedSuspension.ais_sub_id &&
          typeof selectedSuspension.ais_sub_id === "string" &&
          selectedSuspension.ais_sub_id.startsWith("spark_");
        const isUpdate =
          selectedSuspension &&
          selectedSuspension.ais_sub_id &&
          !(
            typeof selectedSuspension.ais_sub_id === "string" &&
            selectedSuspension.ais_sub_id.startsWith("spark_")
          );
        const isNew = !selectedSuspension || !selectedSuspension.ais_sub_id;

        const requestBody = {
          spark_data: updatedData.spark_data || null,
          user_data: updatedData.user_data || {
            suspension_details: null,
            from_period: null,
            to_period: null,
          },
        };

        console.log("Request body:", JSON.stringify(requestBody, null, 2));

        if (!requestBody.user_data || typeof requestBody.user_data !== "object") {
          throw new Error("Invalid user_data structure");
        }
        if (requestBody.spark_data && typeof requestBody.spark_data !== "object") {
          throw new Error("Invalid spark_data structure");
        }

        let response;
        if (isSparkEntry || isNew) {
          response = await axiosInstance.post("officer/suspension-info", requestBody);
        } else if (isUpdate) {
          response = await axiosInstance.put(
            `officer/suspension-info/${selectedSuspension.ais_sub_id}`,
            requestBody
          );
        }

        if (response.data.success) {
          console.log("response==", response);
          const savedSuspension = response.data.data.suspension_info;
          console.log("savedSuspension==", savedSuspension);

          const fieldSources = {
            suspension_details:
              requestBody.user_data.suspension_details
                ? "USER"
                : selectedSuspension?.fieldSources?.suspension_details || "SPARK",
            from_period:
              requestBody.user_data.from_period
                ? "USER"
                : selectedSuspension?.fieldSources?.from_period || "SPARK",
            to_period:
              requestBody.user_data.to_period
                ? "USER"
                : selectedSuspension?.fieldSources?.to_period || "SPARK",
          };

          setSuspensionList((prevData = []) => {
            const updatedSuspension = {
              ais_sub_id: String(savedSuspension.ais_sub_id),
              suspension_details: savedSuspension.suspension_details || "",
              from_period: savedSuspension.from_period || "",
              to_period: savedSuspension.to_period || "",
              _source:
                requestBody.user_data.suspension_details ||
                requestBody.user_data.from_period ||
                requestBody.user_data.to_period
                  ? "USER"
                  : "MIXED",
              isSaved: true,
              fieldSources,
            };

            if (isSparkEntry) {
              return [
                ...prevData.filter(
                  (s) => String(s.ais_sub_id) !== String(selectedSuspension.ais_sub_id)
                ),
                updatedSuspension,
              ];
            } else if (isUpdate) {
              return prevData.map((suspension) =>
                String(suspension.ais_sub_id) === String(selectedSuspension.ais_sub_id)
                  ? updatedSuspension
                  : suspension
              );
            } else {
              return [...prevData, updatedSuspension];
            }
          });

          setSparkFields((prev) => {
            const newSparkFields = new Set(prev);
            if (isSparkEntry) {
              const index = parseInt(selectedSuspension.ais_sub_id.split("_")[1]);
              ["suspension_details", "from_period", "to_period"].forEach((key) => {
                newSparkFields.delete(`${key}_${index}`);
              });
            }
            return newSparkFields;
          });

          setModalOpen(false);
          setSelectedSuspension(null);
          toast.success(
            isUpdate
              ? "Suspension updated successfully"
              : "Suspension added successfully",
            {
              className: "bg-primary-500 text-white",
              progressClassName: "bg-primary-200",
            }
          );
        } else {
          toast.error("Failed to save suspension details", {
            className: "bg-red-500 text-white",
            progressClassName: "bg-red-200",
          });
        }
      } catch (err) {
        console.error("Error saving suspension:", err);
        toast.error("Error occurred while saving suspension", {
          className: "bg-red-500 text-white",
          progressClassName: "bg-red-200",
        });
      }
    },
    [selectedSuspension]
  );

  const handleEdit = useCallback(
    (suspension) => (e) => {
      e.stopPropagation();
      const cleanSuspension = {
        ais_sub_id: String(suspension.ais_sub_id),
        suspension_details: suspension.suspension_details || "",
        from_period: suspension.from_period || "",
        to_period: suspension.to_period || "",
        _source: suspension._source || "USER",
        isSaved: suspension.isSaved,
        fieldSources: suspension.fieldSources,
      };
      console.log("Selected Suspension:", JSON.stringify(cleanSuspension, null, 2));
      setSelectedSuspension(cleanSuspension);
      setModalOpen(true);
    },
    []
  );

  const handleAdd = useCallback(
    (e) => {
      e.stopPropagation();
      setSelectedSuspension({
        ais_sub_id: null,
        suspension_details: "",
        from_period: "",
        to_period: "",
        _source: "USER",
        isSaved: false,
        fieldSources: {
          suspension_details: "USER",
          from_period: "USER",
          to_period: "USER",
        },
      });
      setModalOpen(true);
    },
    []
  );
useEffect(() => {
    if (!loading && suspensionList) {
      const total = suspensionList.length;
      const completed = suspensionList.filter((s) => s.isSaved).length;
      updateSectionProgress('disciplinary', total === 0 ? 0 : completed, total === 0 ? 0 : total);
    }
  }, [loading, updateSectionProgress, suspensionList?.length, suspensionList?.map((s) => s.isSaved).join(',')]);
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
    if (fieldSource !== "USER" && fieldSource !== "AIS_OFFICER") return null;
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

  const renderGadOfficerIndicator = (fieldKey, suspension) => {
    if (suspension.fieldSources[fieldKey] !== "GAD_OFFICER") return null;
    return (
      <div className="absolute top-2 right-2 group">
        <span
          className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-[8px]"
          aria-label="Sourced by GAD Officer"
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
        {sessionStorage.getItem("role_id") == 3 && (
          <button
            className="px-2 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors flex items-center gap-2 text-sm font-medium self-end sm:self-center"
            onClick={handleAdd}
          >
            <PlusIcon className="w-4 h-4" strokeWidth={2} />
            <span>Add Suspension</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : sections[0].cards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-6">
          {sections[0].cards.map((card, index) => (
            <div
              key={card.ais_sub_id}
              className="relative bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-indigo-300 dark:border-indigo-600 shadow-sm"
            >
              {renderSavedIndicator(card.isSaved)}
              <span
                className={`absolute top-[-10px] left-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white shadow-sm border ${
                  card.status === "Active" ? "bg-green-600 border-green-600" : "bg-indigo-600 border-indigo-600"
                }`}
              >
                {card.status}
              </span>
              <div className="flex items-center justify-end my-3 relative z-10">
                {sessionStorage.getItem("role_id") == 3 && (
                  <button
                    className="text-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400"
                    onClick={handleEdit(suspensionList[index])}
                  >
                    <PencilSquareIcon className="w-4 h-4" strokeWidth={2} />
                  </button>
                )}
              </div>
             <div className="space-y-2 mt-6">
              {card.fields.map((field) => (
                <div
                  key={field.key}
                  className="relative flex items-start gap-2 bg-white dark:bg-gray-700 rounded-lg p-2 border border-gray-200 dark:border-gray-600"
                >
                  {renderSparkIndicator(field.key, field.source)}
                  {renderUserIndicator(field.key, field.source)}
                  {renderGadOfficerIndicator(field.originalKey, suspensionList[index])}
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mt-0.5">
                    <field.icon className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                  </div>
                  <div className="flex-1 min-w-0"> {/* Added min-w-0 to enable text truncation */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {field.label}
                    </p>
                    <p 
                      className={`text-sm font-bold text-gray-900 dark:text-white ${
                        field.originalKey === 'suspension_details' 
                          ? 'break-words line-clamp-5' // Limits to 3 lines with ellipsis
                          : 'truncate'
                      }`}
                      title={field.computeValue ? field.computeValue() : suspensionList[index][field.originalKey] || "N/A"}
                    >
                      {field.computeValue
                        ? (() => {
                            const val = field.computeValue();
                            return val === null || val === undefined || Number.isNaN(val)
                              ? "N/A"
                              : val;
                          })()
                        : suspensionList[index][field.originalKey] || "N/A"}
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
          No Suspension Details Available.
        </div>
      )}
      <ModalSuspensionDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        suspension={selectedSuspension}
        onSave={handleSave}
        isSparkData={selectedSuspension && selectedSuspension._source === "SPARK"}
        sparkFields={sparkFields}
        officerFields={officerFields}
      />
    </div>
  );
}