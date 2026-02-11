"use client";

import PropTypes from "prop-types";
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BoltIcon, UserIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { useProfileCompletion } from "@/contexts/Profile-completion-context";

const initialFormData = {
  suspension_details: "",
  from_period: "",
  to_period: "",
};

const fields = [
  { label: "Suspension Reason", key: "suspension_details" },
  { label: "From Period", key: "from_period" },
  { label: "To Period", key: "to_period" },
];

const masterFields = [];
const requiredFields = ["suspension_details", "from_period", "to_period"];
const disabledFields = [];

export function ModalSuspensionDetails({
  open,
  setOpen,
  suspension,
  onSave,
  isSparkData,
  sparkFields,
  officerFields,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [charError, setCharError] = useState("");
  const [sparkUpdatedFields, setSparkUpdatedFields] = useState({});
  const [userUpdatedFields, setUserUpdatedFields] = useState(new Set());
  // const { updateSectionProgress } = useProfileCompletion();
  // const prevProgressRef = useRef({ completed: 0, total: 0 });

  const today = new Date().toISOString().split("T")[0];
  const sixtyYearsAgo = new Date();
  sixtyYearsAgo.setFullYear(new Date().getFullYear() - 60);
  const minDate = sixtyYearsAgo.toISOString().split("T")[0];

  const MAX_CHARACTERS = 250;

  const countWords = (text) => {
    return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  };

  useEffect(() => {
    if (open) {
      if (suspension && typeof suspension === 'object' && suspension !== null) {
        setFormData({
          suspension_details: suspension.suspension_details ?? "",
          from_period: suspension.from_period ?? "",
          to_period: suspension.to_period ?? "",
        });
      } else {
        setFormData(initialFormData);
      }
      setErrors({});
      setCharError("");
      setSparkUpdatedFields({});
      setUserUpdatedFields(new Set());
      console.log("Modal opened with suspension:", JSON.stringify(suspension, null, 2));
    }
  }, [open, suspension]);

  // Remove this function since we don't need word count anymore
// const countWords = (text) => {
//   return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
// };

// Fix the progress calculation useEffect
useEffect(() => {
  const totalFields = requiredFields.length;
  let completed = 0;

  requiredFields.forEach((key) => {
    const value = formData[key];
    if (value && value.toString().trim().length > 0) {
      if (key === "suspension_details") {
        // Only check character limit and pattern for suspension_details
        if (value.length <= MAX_CHARACTERS && /^[a-zA-Z0-9\s./\-()]*$/.test(value)) {
          completed += 1;
        }
      } else {
        completed += 1;
      }
    }
  });

  // const prev = prevProgressRef.current;
  // if (prev.completed !== completed || prev.total !== totalFields) {
  //   updateSectionProgress("suspension", completed, totalFields);
  //   prevProgressRef.current = { completed, total: totalFields };
  // }
}, [formData, ]);

  const hasPreFilledValue = (fieldKey) => {
    return suspension && typeof suspension === 'object' && suspension[fieldKey] && suspension[fieldKey].toString().trim() !== '';
  };

  const isSparkField = (fieldKey) => {
    if (!sparkFields || userUpdatedFields.has(fieldKey)) return false;
    if (suspension?.fieldSources?.[fieldKey] === "USER") return false;
    return Array.from(sparkFields).some((sparkField) =>
      sparkField.startsWith(`${fieldKey}_`) || sparkField === fieldKey
    );
  };

  const isFieldDisabled = (fieldKey) => {
    if (disabledFields.includes(fieldKey)) return true;
    if (userUpdatedFields.has(fieldKey)) return false;
    if (suspension?.fieldSources?.[fieldKey] === "USER") return false;
    if (isSparkField(fieldKey) && hasPreFilledValue(fieldKey)) return true;
    if (officerFields?.GAD_OFFICER?.includes(fieldKey) && hasPreFilledValue(fieldKey)) return true;
    return false;
  };

  const handleInputChange = (e) => {
  const { name, value } = e.target;

  // Apply character limit for suspension_details
  let processedValue = value;
  if (name === "suspension_details" && value.length > MAX_CHARACTERS) {
    processedValue = value.substring(0, MAX_CHARACTERS);
  }

  setFormData((prevState) => ({
    ...prevState,
    [name]: processedValue || "",
  }));

  if (isSparkField(name)) {
    setSparkUpdatedFields((prev) => ({ ...prev, [name]: processedValue || "" }));
  }
  setUserUpdatedFields((prev) => new Set([...prev, name]));

  if (name === "suspension_details") {
    const allowedPattern = /^[a-zA-Z0-9\s./\-()]*$/;

    let newError = { ...errors };

    if (!allowedPattern.test(processedValue)) {
      setCharError("Only letters, numbers, spaces, and . / - ( ) are allowed.");
      newError.suspension_details = "Only letters, numbers, spaces, and . / - ( ) are allowed.";
    } else if (processedValue.length > MAX_CHARACTERS) {
      setCharError(`Maximum ${MAX_CHARACTERS} characters allowed.`);
      newError.suspension_details = `Suspension Reason must not exceed ${MAX_CHARACTERS} characters.`;
    } else {
      setCharError("");
      delete newError.suspension_details;
    }

    setErrors(newError);
  }

  if (name === "from_period" || name === "to_period") {
    const updated = { ...formData, [name]: value };
    const fromDate = new Date(updated.from_period);
    const toDate = new Date(updated.to_period);
    let newError = { ...errors };

    if (updated.from_period && fromDate < sixtyYearsAgo) {
      newError.from_period = "From Period must be within the last 60 years.";
    } else {
      delete newError.from_period;
    }

    if (updated.from_period && updated.to_period && toDate < fromDate) {
      newError.to_period = "To Period must be after or same as From Period.";
    } else {
      delete newError.to_period;
    }

    setErrors(newError);
  }

  setErrors((prevErrors) => {
    const updatedErrors = { ...prevErrors };
    if (requiredFields.includes(name)) {
      const strValue = (value || "").toString().trim();
      if (strValue.length > 0) {
        delete updatedErrors[name];
      }
    }
    return updatedErrors;
  });
};

const handleSave = async (e) => {
  e.preventDefault();

  const newErrors = {};

  if (!formData.suspension_details) {
    newErrors.suspension_details = "Suspension Reason is required.";
  } else if (formData.suspension_details.length > MAX_CHARACTERS) {
    newErrors.suspension_details = `Suspension Reason must not exceed ${MAX_CHARACTERS} characters.`;
  } else if (!/^[a-zA-Z0-9\s./\-()]*$/.test(formData.suspension_details)) {
    newErrors.suspension_details = "Only letters, numbers, spaces, and . / - ( ) are allowed.";
  }

  if (!formData.from_period) {
    newErrors.from_period = "From Period is required.";
  } else {
    const fromDate = new Date(formData.from_period);
    if (fromDate < sixtyYearsAgo) {
      newErrors.from_period = "From Period must be within the last 60 years.";
    }
  }

  if (!formData.to_period) {
    newErrors.to_period = "To Period is required.";
  } else {
    const fromDate = new Date(formData.from_period);
    const toDate = new Date(formData.to_period);
    if (toDate < fromDate) {
      newErrors.to_period = "To Period must be after or same as From Period.";
    }
  }

  setErrors(newErrors);
  setCharError("");

  if (Object.keys(newErrors).length > 0) return;

    const sparkData = {};
    const userData = {};

    fields.forEach((field) => {
      const key = field.key;
      const value = formData[key] || "";

      if (isSparkField(key) && isFieldDisabled(key) && !userUpdatedFields.has(key)) {
        sparkData[key] = value;
      } else if (userUpdatedFields.has(key) || suspension?.fieldSources?.[key] === "USER") {
        userData[key] = value;
      }
    });

    const updatedData = {
      spark_data: isSparkData ? sparkData : {},
      user_data: userData,
    };

    console.log("Modal handleSave updatedData:", JSON.stringify(updatedData, null, 2));
    await onSave(updatedData);
    setFormData(initialFormData);
    setOpen(false);
    setUserUpdatedFields(new Set());
    setSparkUpdatedFields({});
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setCharError("");
    setSparkUpdatedFields({});
    setUserUpdatedFields(new Set());
    setOpen(false);
  };

  const getFieldClassName = (fieldKey) => {
    const baseClasses = 'mt-1 block w-full rounded-md sm:text-sm p-2 border';

    if (
      officerFields?.GAD_OFFICER?.includes(fieldKey) &&
      hasPreFilledValue(fieldKey)
    ) {
      return `${baseClasses} bg-indigo-50 text-gray-900 border-indigo-200 cursor-not-allowed pointer-events-none dark:bg-gray-800 dark:text-white dark:border-indigo-500`;
    }

    if (
      isSparkField(fieldKey) &&
      hasPreFilledValue(fieldKey)
    ) {
      return `${baseClasses} bg-orange-50 text-gray-900 border-orange-200 cursor-not-allowed pointer-events-none dark:bg-indigo-900 dark:text-gray-200 dark:border-gray-600`;
    }

    if (disabledFields.includes(fieldKey)) {
      return `${baseClasses} bg-gray-200 text-gray-900 border-gray-300 cursor-not-allowed pointer-events-none dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600 opacity-100`;
    }

    if (fieldKey === "suspension_details") {
      return `${baseClasses} border-gray-300 text-gray-900 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-300 resize-none`;
    }

    if (fieldKey === "from_period" || fieldKey === "to_period") {
      return `${baseClasses} border-gray-300 text-gray-900 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-300`;
    }

    return `${baseClasses} border-gray-300 text-gray-900 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-300`;
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

  const renderUserIndicator = (fieldKey) => {
    if (!suspension?.fieldSources?.[fieldKey] || suspension.fieldSources[fieldKey] === "USER" || userUpdatedFields.has(fieldKey)) {
      return (
        <div className="absolute top-3 right-3 group z-10">
          <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-xs" aria-label="User Entered">
            <UserIcon className="w-2 h-2" />
          </span>
          <div className="absolute right-0 top-full mt-1 hidden group-hover:block">
            <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md whitespace-nowrap">
              User Entered
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const hasAnyIndication = () => {
    const hasSparkData = fields.some((f) => isSparkField(f.key) && hasPreFilledValue(f.key));
    const hasOfficerData = officerFields?.GAD_OFFICER && fields.some((f) => officerFields.GAD_OFFICER.includes(f.key) && hasPreFilledValue(f.key));
    const hasUserData = fields.some((f) => suspension?.fieldSources?.[f.key] === "USER" || userUpdatedFields.has(f.key));
    return hasSparkData || hasOfficerData || hasUserData || (suspension && suspension.isSaved !== undefined);
  };

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-700 dark:text-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-4xl sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95">
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </button>
            </div>
            <div className="w-full">
              <form onSubmit={handleSave}>
                <div className="space-y-12">
                  <div className="border-b border-gray-900/10 pb-12 dark:border-gray-600">
                    <DialogTitle className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-2">
                      {suspension ? "Edit Suspension Details" : "Add Suspension Details"}
                    </DialogTitle>
                    {hasAnyIndication() && (
                      <div className="mb-5 flex flex-col sm:flex-row sm:justify-end items-start sm:items-center gap-4">
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
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {fields.map((field) => (
                        <div
                          key={field.key}
                          className={
                            field.key === "from_period" || field.key === "to_period"
                              ? "sm:col-span-1 relative"
                              : "sm:col-span-2 relative"
                          }
                        >
                          <label className="block text-sm font-medium text-gray-700 dark:text-white">
                            {field.label}
                            {requiredFields.includes(field.key) && (
                              <span className="text-red-500 font-semibold"> *</span>
                            )}
                          </label>
                          {renderSparkIndicator(field.key)}
                          {renderGadOfficerIndicator(field.key)}
                          {renderUserIndicator(field.key)}
                        {field.key === "suspension_details" ? (
                          <div className="relative">
                            <textarea
                              id={field.key}
                              name={field.key}
                              value={formData[field.key] || ""}
                              onChange={handleInputChange}
                              placeholder="Enter suspension details (max 250 characters)"
                              rows={3}
                              disabled={isFieldDisabled(field.key)}
                              className={`${getFieldClassName(field.key)} pr-16`}
                              maxLength={MAX_CHARACTERS + 1}
                            />
                            {/* Character counter */}
                            <div className="absolute right-2 bottom-2">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {formData.suspension_details?.length || 0}/{MAX_CHARACTERS}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <input
                            type={field.key.includes("period") ? "date" : "text"}
                            id={field.key}
                            name={field.key}
                            value={formData[field.key] || ""}
                            onChange={handleInputChange}
                            min={minDate}
                            disabled={isFieldDisabled(field.key)}
                            className={getFieldClassName(field.key)}
                          />
                        )}
                          {errors[field.key] && (
                            <p className="mt-1 text-sm text-red-500">{errors[field.key]}</p>
                          )}
                          {charError && field.key === "suspension_details" && (
                            <p className="mt-1 text-sm text-red-500">{charError}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-end gap-x-6">
                    <button
                      type="button"
                      className="text-sm font-semibold text-gray-900 dark:text-white"
                      onClick={handleClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}

ModalSuspensionDetails.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  suspension: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  isSparkData: PropTypes.bool,
  sparkFields: PropTypes.instanceOf(Set),
  officerFields: PropTypes.object,
};