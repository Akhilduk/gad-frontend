'use client';

import PropTypes from "prop-types";
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BoltIcon } from "@heroicons/react/24/solid";

const initialFormData = {
  qualification_id: "",
  institute_name: "",
  subject_name: "",
};

const fields = [
  { label: "Qualification", key: "qualification_id", isSelect: true, idForSelect: "qualification_id" },
  { label: "University/Institute/Board", key: "institute_name" },
  { label: "Subject", key: "subject_name" },
];

const requiredFields = ["qualification_id", "institute_name", "subject_name"];
const disabledFields = [];

export function ModalEducationalQualifications({
    open,
    setOpen,
    educationalQualifications,
    onSave,
    masterData,
    isSparkData,
    sparkFields,
    officerFields,
  }) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [sparkUpdatedFields, setSparkUpdatedFields] = useState({});
  const [userUpdatedFields, setUserUpdatedFields] = useState(new Set());

  const prevProgressRef = useRef({ completed: 0, total: 0 });

  useEffect(() => {
    if (open) {
      if (educationalQualifications && typeof educationalQualifications === 'object' && educationalQualifications !== null) {
        setFormData({
          qualification_id: educationalQualifications.qualification_id ?? "",
          institute_name: educationalQualifications.institute_name ?? "",
          subject_name: educationalQualifications.subject_name ?? "",
        });
      } else {
        setFormData(initialFormData);
      }
      setErrors({});
      setSparkUpdatedFields({});
      setUserUpdatedFields(new Set());
      console.log("Modal opened with educationalQualifications:", JSON.stringify(educationalQualifications, null, 2));
    }
  }, [open, educationalQualifications]);

 

  const hasPreFilledValue = (fieldKey) => {
    return educationalQualifications && typeof educationalQualifications === 'object' && educationalQualifications[fieldKey] && educationalQualifications[fieldKey].toString().trim() !== '';
  };

  const isSparkField = (fieldKey) => {
    // If user has updated this field in current session, it's no longer SPARK
    if (userUpdatedFields.has(fieldKey)) return false;
    
    // Check if this field originally came from SPARK based on fieldSources
    return educationalQualifications?.fieldSources?.[fieldKey] === "SPARK";
  };

  const isFieldDisabled = (fieldKey) => {
    if (disabledFields.includes(fieldKey)) return true;
    if (userUpdatedFields.has(fieldKey)) return false;
    if (educationalQualifications?.fieldSources?.[fieldKey] === "USER") return false;
    
    // If it's a SPARK field and has a pre-filled value, keep it disabled
    if (isSparkField(fieldKey) && hasPreFilledValue(fieldKey)) return true;
    
    if (officerFields?.GAD_OFFICER?.includes(fieldKey) && hasPreFilledValue(fieldKey)) return true;
    return false;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Apply character limit for institute_name and subject_name
    let processedValue = value;
    if ((name === "institute_name" || name === "subject_name") && value.length > 100) {
      processedValue = value.substring(0, 100);
    }

    setFormData((prevState) => ({
      ...prevState,
      [name]: processedValue || "",
    }));

    if (isSparkField(name)) {
      setSparkUpdatedFields((prev) => ({ ...prev, [name]: processedValue || "" }));
    }
    setUserUpdatedFields((prev) => new Set([...prev, name]));

    setErrors((prevErrors) => {
      const updatedErrors = { ...prevErrors };
      const strValue = (processedValue || "").toString().trim();

      if (requiredFields.includes(name)) {
        if (strValue.length === 0) {
          updatedErrors[name] = `${fields.find((f) => f.key === name).label} is required`;
        } else {
          if (
            (name === "institute_name" || name === "subject_name") &&
            (strValue.length < 1 || !/^[A-Za-z](?:[A-Za-z\s,]*[A-Za-z])?$/.test(strValue))
          ) {
            updatedErrors[name] = `${fields.find((f) => f.key === name).label} must contain only alphabets and single spaces (no symbols, numbers, or leading/trailing spaces)`;
          } else {
            delete updatedErrors[name];
          }
        }
      }

      return updatedErrors;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const newErrors = {};

    fields.forEach((field) => {
      const value = formData[field.key];

      if (requiredFields.includes(field.key) && (!value || value.toString().trim() === "")) {
        newErrors[field.key] = `${field.label} is required`;
      }

      if ((field.key === "institute_name" || field.key === "subject_name") && value) {
        const trimmedValue = value.toString().trim();

        if (trimmedValue.length < 1) {
          newErrors[field.key] = `${field.label} must be at least 3 characters long`;
        } else if (!/^[A-Za-z](?:[A-Za-z\s,]*[A-Za-z])?$/.test(trimmedValue)) {
          newErrors[field.key] = `${field.label} must contain only alphabets and single spaces (no symbols, numbers, or leading/trailing spaces)`;
        }
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    // Construct spark_data and user_data based on field status
    const sparkData = {};
    const userData = {};

    fields.forEach((field) => {
      const key = field.key;
      const value = formData[key] || "";

      if (isSparkField(key) && isFieldDisabled(key) && !userUpdatedFields.has(key)) {
        // Disabled SPARK fields go into spark_data
        sparkData[key] = value;
      } else if (userUpdatedFields.has(key) || educationalQualifications?.fieldSources?.[key] === "USER") {
        // User-entered or previously user-saved fields go into user_data
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
    setSparkUpdatedFields({});
    setUserUpdatedFields(new Set());
    setOpen(false);
  };

  const renderSelectOptions = (field) => {
    const keyMap = {
      qualification_id: "qualification",
    };

    const masterKey = keyMap[field.key];
    const options = masterData?.[masterKey] || [];

    return options.length > 0 ? (
      options.map((option) => (
        <option key={option[field.idForSelect]} value={option[field.idForSelect]}>
          {option[masterKey] || 'N/A'}
        </option>
      ))
    ) : (
      <option disabled>No options available</option>
    );
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

  const hasAnyIndication = () => {
    const hasSparkData = fields.some((f) => isSparkField(f.key) && hasPreFilledValue(f.key));
    const hasOfficerData = officerFields?.GAD_OFFICER && fields.some((f) => officerFields.GAD_OFFICER.includes(f.key) && hasPreFilledValue(f.key));
    return hasSparkData || hasOfficerData;
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
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-2">Qualification Details</h3>
                    {hasAnyIndication() && (
                      <div className="mb-5 flex justify-end">
                        <div className="flex items-center space-x-4 border rounded-md px-3 py-2 bg-white dark:bg-gray-800">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center p-0.5 rounded-full bg-orange-100 text-orange-600 text-xs">
                              <BoltIcon className="w-2 h-2" />
                            </span>
                            <span className="text-sm text-gray-700 dark:text-white">Synced from SPARK</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-xs">
                              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                            </span>
                            <span className="text-sm text-gray-700 dark:text-white">Updated by AS-II</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {fields.map((field) => (
                        <div key={field.key} className="relative">
                          <label className="block text-sm font-medium text-gray-700 dark:text-white">
                            {field.label}
                            {requiredFields.includes(field.key) && (
                              <span className="text-red-500 font-semibold"> *</span>
                            )}
                          </label>
                          {renderSparkIndicator(field.key)}
                          {renderGadOfficerIndicator(field.key)}
                          {field.isSelect ? (
                            <select
                              id={field.key}
                              name={field.key}
                              value={formData[field.key] || ""}
                              onChange={handleChange}
                              disabled={isFieldDisabled(field.key)}
                              className={getFieldClassName(field.key)}
                            >
                              <option value="">Select</option>
                              {renderSelectOptions(field)}
                            </select>
                          ) : (
                            <div className="relative">
                              <input
                                type="text"
                                name={field.key}
                                value={formData[field.key] || ""}
                                onChange={handleChange}
                                disabled={isFieldDisabled(field.key)}
                                className={`${getFieldClassName(field.key)} ${(field.key === "institute_name" || field.key === "subject_name") ? 'pr-12' : ''}`}
                                maxLength={101}
                              />
                              {/* Character counter positioned inside the input field */}
                              {(field.key === "institute_name" || field.key === "subject_name") && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 bg-transparent pointer-events-none">
                                  {formData[field.key]?.length || 0}/100
                                </div>
                              )}
                            </div>
                          )}
                          {errors[field.key] && (
                            <p className="mt-1 text-sm text-red-500">{errors[field.key]}</p>
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

ModalEducationalQualifications.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  educationalQualifications: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  masterData: PropTypes.object.isRequired,
  isSparkData: PropTypes.bool,
  sparkFields: PropTypes.instanceOf(Set),
  officerFields: PropTypes.object,
};