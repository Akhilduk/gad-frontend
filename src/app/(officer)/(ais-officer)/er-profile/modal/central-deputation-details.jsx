"use client";

import PropTypes from "prop-types";
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BoltIcon, UserIcon } from "@heroicons/react/24/solid";
import { useProfileCompletion } from "@/contexts/Profile-completion-context";
import { toast } from 'react-toastify';
import { 
  formatDateToDDMMYYYY, 
} from "@/utils/dateFormat";

const initialFormData = {
  cen_designation: "",
  phone_no: "",
  state_id: "",
  start_date: "",
  end_date: "",
  tenure_id: "",
  cen_min_id: "",
  cen_dept_id: "",
  cen_org_id: "",
  deputation_type: "",
};

// Designation suggestions data
const designationSuggestions = [
  "Additional Director General",
  "Additional Secretary",
  "Assistant Inspector General of Forests (Central)",
  "CVO",
  "Conservator of Forests",
  "Deputy Conservator of Forest, ICFRE",
  "Deputy Director (Administration)",
  "Deputy Director General",
  "Deputy Inspector General",
  "Deputy Secretary",
  "Development Commissioner for Handloom",
  "Director",
  "Director (Finance)",
  "Director General",
  "Director of Census Operations (DCO)",
  "Director of Citizen Registration (DCR)",
  "DIG",
  "Executive Director",
  "Inspector General",
  "Inspector General of Forests (IGF)",
  "Joint Director",
  "Joint Secretary",
  "Lecturer",
  "Principal Financial Sector Specialist",
  "Regional Deputy Director",
  "Regional Officer",
  "Registrar",
  "Secretary",
  "Senior Analyst",
  "Special Director",
  "Sr Adviser to Executive Director",
  "Superintendent of Police",
  "Under Secretary"
];

const fields = [
  { label: "Designation", key: "cen_designation", hasSuggestions: true },
  { label: "Phone Number", key: "phone_no" },
  { label: "State", key: "state_id", isSelect: true, idKey: "state_id", masterKey: "state" },
  { label: "Start Date", key: "start_date", type: "date" },
  { label: "End Date", key: "end_date", type: "date" },
  { label: "Tenure Type", key: "tenure_id", isSelect: true, idKey: "tenure_id", masterKey: "tenures" },
  { label: "Ministry/Department", key: "cen_min_id", isSelect: true, idKey: "ministry_id", masterKey: "ministry" },
  { label: "Department", key: "cen_dept_id", isSelect: true, idKey: "administrative_department_id", masterKey: "administrative_department" },
  { label: "Office", key: "cen_org_id", isSelect: true, idKey: "agency_id", masterKey: "agency" },
  { label: "Deputation Type", key: "deputation_type", isSelect: true, idKey: "deputation_type_id", masterKey: "deputation_type" },
];

const masterFields = [
  "state_id",
  "tenure_id",
  "cen_min_id",
  "cen_dept_id",
  "cen_org_id",
  "deputation_type",
];

const requiredFields = [
  "cen_designation",
  "state_id",
  "start_date",
  "tenure_id",
  "cen_min_id",
  "cen_dept_id",
  "cen_org_id",
  "deputation_type",
];

const disabledFields = [];

const PHONE_MAX_LENGTH = 10;
const DESIGNATION_MAX_LENGTH = 250;

// Regex for allowed characters in designation
const allowedDesignationCharsRegex = /^[a-zA-Z0-9\s(),./\-&]*$/;

// Helper function to calculate date constraints
const getDateConstraints = () => {
  const allotmentYear = sessionStorage.getItem('allotmentYear');
  const retirementDate = sessionStorage.getItem('retirementDate');
  const dob = sessionStorage.getItem('dob');
  
  let minDate = null;
  let maxDate = null;

  if (allotmentYear) {
    const yearInt = parseInt(allotmentYear);
    minDate = new Date(Date.UTC(yearInt, 0, 1));
    
    if (retirementDate) {
      maxDate = new Date(retirementDate);
    } else if (dob) {
      const dobDate = new Date(dob);
      maxDate = new Date(dobDate.getFullYear() + 60, dobDate.getMonth(), dobDate.getDate());
    }
  } else if (dob) {
    const dobDate = new Date(dob);
    minDate = new Date(dobDate.getFullYear() + 18, dobDate.getMonth(), dobDate.getDate());
    
    if (retirementDate) {
      maxDate = new Date(retirementDate);
    } else {
      maxDate = new Date(dobDate.getFullYear() + 60, dobDate.getMonth(), dobDate.getDate());
    }
  }

  return { minDate, maxDate };
};

// Helper function to validate date against constraints
const isValidDateWithinRange = (dateStr, isStartDate = true) => {
  if (!dateStr) return true;
  
  const date = new Date(dateStr);
  const { minDate, maxDate } = getDateConstraints();
  
  if (minDate && date < minDate) {
    return `Date cannot be before ${formatDateToDDMMYYYY(minDate.toISOString().split('T')[0])}`;
  }
  
  if (maxDate && date > maxDate) {
    return `Date cannot be after ${formatDateToDDMMYYYY(maxDate.toISOString().split('T')[0])}`;
  }
  
  return null;
};

export function ModalCentralDeputation({
  open,
  setOpen,
  deputationDetails,
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
  
  // New states for designation suggestions
  const [designationSuggestionsList, setDesignationSuggestionsList] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  

  const prevProgressRef = useRef({ completed: 0, total: 0 });
  
  // Refs for handling outside clicks
  const suggestionRef = useRef(null);
  const inputRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionRef.current && 
        !suggestionRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


    // Helper function to trim form values
  const trimFormValue = (value) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  };

    // Helper function to validate and format phone number
  const formatPhoneNumber = (value) => {
    const trimmed = value.trim();
    // Remove all non-digit characters
    return trimmed.replace(/\D/g, '');
  };

 useEffect(() => {
    if (open) {
      if (
        deputationDetails &&
        typeof deputationDetails === "object" &&
        deputationDetails !== null
      ) {
        const newFormData = {
          cen_designation: trimFormValue(deputationDetails.cen_designation) || "",
          phone_no: formatPhoneNumber(deputationDetails.phone_no) || "",
          state_id: deputationDetails.state_id || "",
          start_date: deputationDetails.start_date || "",
          end_date: deputationDetails.end_date || "",
          tenure_id: deputationDetails.tenure_id ? String(deputationDetails.tenure_id) : "",
          cen_min_id: deputationDetails.cen_min_id || "",
          cen_dept_id: deputationDetails.cen_dept_id || "",
          cen_org_id: deputationDetails.cen_org_id || "",
          deputation_type: deputationDetails.deputation_type || "",
        };
        console.log("Modal formData initialized:", JSON.stringify(newFormData, null, 2));
        setFormData(newFormData);
      } else {
        setFormData(initialFormData);
      }
      setErrors({});
      setSparkUpdatedFields({});
      setUserUpdatedFields(new Set());
      setShowSuggestions(false);
      setActiveSuggestionIndex(0);
    }
  }, [open, deputationDetails, masterData]);

  

  // Filter suggestions based on input
  const filterSuggestions = (input) => {
    if (!input || input.trim() === "") {
      return designationSuggestions;
    }
    
    const inputLower = input.toLowerCase();
    return designationSuggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(inputLower)
    );
  };

  const hasPreFilledValue = (fieldKey) => {
    return (
      deputationDetails &&
      typeof deputationDetails === "object" &&
      deputationDetails[fieldKey] &&
      deputationDetails[fieldKey].toString().trim() !== ""
    );
  };

  const isSparkField = (fieldKey) => {
    if (!sparkFields || userUpdatedFields.has(fieldKey)) return false;
    if (deputationDetails?.fieldSources?.[fieldKey] === "USER") return false;
    return Array.from(sparkFields).some(
      (sparkField) =>
        sparkField.startsWith(`${fieldKey}_`) || sparkField === fieldKey
    );
  };

  const isFieldDisabled = (fieldKey) => {
    if (disabledFields.includes(fieldKey)) return true;
    if (userUpdatedFields.has(fieldKey)) return false;
    if (deputationDetails?.fieldSources?.[fieldKey] === "USER") return false;
    if (isSparkField(fieldKey) && hasPreFilledValue(fieldKey)) return true;
    if (
      officerFields?.GAD_OFFICER?.includes(fieldKey) &&
      hasPreFilledValue(fieldKey)
    )
      return true;
    return false;
  };

const handleDesignationChange = (e) => {
    const { value } = e.target;

    // Truncate if exceeds max length, but do not trim to preserve spaces while typing
    // No longer filtering invalid characters - allow typing and validate instead
    const processedValue = value.length > DESIGNATION_MAX_LENGTH ? value.substring(0, DESIGNATION_MAX_LENGTH) : value;
    
    setFormData((prevState) => ({
      ...prevState,
      cen_designation: processedValue || "",
    }));

    // Filter suggestions based on input (trim for filtering to avoid trailing space issues in search)
    const filtered = filterSuggestions(processedValue.trim());
    setDesignationSuggestionsList(filtered);
    setShowSuggestions(true);
    setActiveSuggestionIndex(0);

    if (isSparkField("cen_designation")) {
      setSparkUpdatedFields((prev) => ({ ...prev, cen_designation: processedValue || "" }));
    }
    setUserUpdatedFields((prev) => new Set([...prev, "cen_designation"]));

    // Validate characters in real-time and update errors
    setErrors((prevErrors) => {
      const updatedErrors = { ...prevErrors };
      const trimmedValue = processedValue.trim();
      
      if (trimmedValue.length > 0) {
        // Check for invalid characters
        if (!allowedDesignationCharsRegex.test(processedValue)) {
          updatedErrors.cen_designation = "Only the following special characters are allowed: space, (), ., /, -, &";
        } else {
          // Clear error if valid
          delete updatedErrors.cen_designation;
        }
      }
      return updatedErrors;
    });
  };

  const handleSuggestionClick = (suggestion) => {
  // Prevent default to avoid any unwanted behavior
  // Suggestions are pre-validated, so no need for char check here
  // Truncate if over length (unlikely)
  const processedSuggestion = suggestion.length > DESIGNATION_MAX_LENGTH ? suggestion.substring(0, DESIGNATION_MAX_LENGTH) : suggestion;
  
  setFormData((prevState) => ({
    ...prevState,
    cen_designation: processedSuggestion,
  }));

  if (isSparkField("cen_designation")) {
    setSparkUpdatedFields((prev) => ({ ...prev, cen_designation: processedSuggestion }));
  }
  setUserUpdatedFields((prev) => new Set([...prev, "cen_designation"]));
  
  // Close suggestions dropdown when a suggestion is selected
  setShowSuggestions(false);
  setActiveSuggestionIndex(0);

  // Clear designation error since suggestion is valid
  setErrors((prevErrors) => {
    const updatedErrors = { ...prevErrors };
    delete updatedErrors.cen_designation;
    return updatedErrors;
  });

  // Focus back on input
  if (inputRef.current) {
    inputRef.current.focus();
  }
};

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    // Enter key
    if (e.key === 'Enter') {
      e.preventDefault();
      if (designationSuggestionsList[activeSuggestionIndex]) {
        handleSuggestionClick(designationSuggestionsList[activeSuggestionIndex]);
      }
    }
    // Up arrow
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : designationSuggestionsList.length - 1
      );
    }
    // Down arrow
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => 
        prev < designationSuggestionsList.length - 1 ? prev + 1 : 0
      );
    }
    // Escape key
    else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

    // Replace your current handleBlur function with this:
    const handleBlur = (e) => {
      // Check if the blur event was caused by clicking on the suggestions dropdown
      const relatedTarget = e.relatedTarget;
      const suggestionsElement = suggestionRef.current;
      
      // If the blur was caused by clicking on the suggestions dropdown or scrollbar, don't close it
      if (relatedTarget && suggestionsElement && suggestionsElement.contains(relatedTarget)) {
        return;
      }
      
      // Also check if the mouse is currently over the suggestions dropdown
      if (suggestionsElement && suggestionsElement.matches(':hover')) {
        return;
      }
      
      // Close suggestions when input loses focus
      setTimeout(() => {
        setShowSuggestions(false);
      }, 200);
    };

   // Add this new function to handle scrollbar interactions
    const handleSuggestionMouseDown = (e) => {
      // Prevent default to avoid input blur when clicking scrollbar
      e.preventDefault();
      e.stopPropagation();
    };

    // Update your useEffect for outside clicks to be more specific:
    useEffect(() => {
      const handleClickOutside = (event) => {
        // Check if the click is outside both the input and the suggestions dropdown
        const isOutsideInput = inputRef.current && !inputRef.current.contains(event.target);
        const isOutsideSuggestions = suggestionRef.current && !suggestionRef.current.contains(event.target);
        
        if (isOutsideInput && isOutsideSuggestions) {
          setShowSuggestions(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Skip if it's the designation field (handled separately)
    if (name === "cen_designation") {
      handleDesignationChange(e);
      return;
    }

    console.log(`Field ${name} changed to:`, value);

    //Trim values for text fields, format phone numbers
  let processedValue = value;
  if (name === "phone_no") {
    processedValue = formatPhoneNumber(value);
  } else if (typeof value === 'string' && !fields.find(f => f.key === name)?.isSelect && !fields.find(f => f.key === name)?.type === "date") {
    processedValue = trimFormValue(value);
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
      const strValue = (processedValue || "").toString();
      const trimmedValue = trimFormValue(strValue);

      if (requiredFields.includes(name)) {
        if (trimmedValue.length === 0) {
          updatedErrors[name] = `${
            fields.find((f) => f.key === name).label
          } is required`;
        } else {
          delete updatedErrors[name];
      }
      }
      // Phone number validation (not required, but validate if entered)
    if (name === "phone_no" && trimmedValue) {
      const digitStr = trimmedValue;
      let errorMsg = null;
      if (digitStr.length !== 10) {
        errorMsg = "Phone number must be 10 digits";
      } else if (!/^[6-9]\d{9}$/.test(digitStr)) {
        errorMsg = "Phone number must start with 6, 7, 8 or 9";
      }
      if (errorMsg) {
        updatedErrors[name] = errorMsg;
      } else {
        delete updatedErrors[name];
      }
    } else if (name === "phone_no") {
      // Clear error if empty (not required)
      delete updatedErrors[name];
    }

      // Date validation (dates don't need trimming)
      if (name === "start_date" && strValue) {
        const rangeError = isValidDateWithinRange(strValue, true);
        if (rangeError) {
          updatedErrors.start_date = rangeError;
        } else {
          delete updatedErrors.start_date;
        }

        if (formData.end_date && new Date(strValue) > new Date(formData.end_date)) {
          updatedErrors.end_date = "End date should be after start date";
        } else {
          delete updatedErrors.end_date;
        }
      }

      if (name === "end_date" && strValue) {
        const rangeError = isValidDateWithinRange(strValue, false);
        if (rangeError) {
          updatedErrors.end_date = rangeError;
        } else {
          delete updatedErrors.end_date;
        }

        if (formData.start_date && new Date(formData.start_date) > new Date(strValue)) {
          updatedErrors.end_date = "End date should be after start date";
        } else {
          delete updatedErrors.end_date;
        }
      }

      return updatedErrors;
    });
  };


   const handleSave = async (e) => {
  e.preventDefault();

  // Create trimmed form data for validation
  const trimmedFormData = { ...formData };
  Object.keys(trimmedFormData).forEach(key => {
    if (typeof trimmedFormData[key] === 'string') {
      if (key === 'phone_no') {
        trimmedFormData[key] = formatPhoneNumber(trimmedFormData[key]);
      } else if (!fields.find(f => f.key === key)?.isSelect && !fields.find(f => f.key === key)?.type === "date") {
        trimmedFormData[key] = trimFormValue(trimmedFormData[key]);
      }
    }
  });

  const newErrors = {};

  fields.forEach((field) => {
    const value = trimmedFormData[field.key];
    const trimmedValue = trimFormValue(value);

    if (
      requiredFields.includes(field.key) &&
      (!trimmedValue || trimmedValue.toString().trim() === "")
    ) {
      newErrors[field.key] = `${field.label} is required`;
    }

    if (field.key === "phone_no" && trimmedValue) {
      if (!/^\d{10}$/.test(trimmedValue)) {
        newErrors.phone_no = "Phone number must be 10 digits";
      }
    }

    if (field.key === "cen_designation" && trimmedValue) {
      if (trimmedValue.length > DESIGNATION_MAX_LENGTH) {
        newErrors.cen_designation = `Designation must not exceed ${DESIGNATION_MAX_LENGTH} characters`;
      }
      // Validate allowed characters
      if (!allowedDesignationCharsRegex.test(trimmedFormData.cen_designation)) {
        newErrors.cen_designation = "Only the following special characters are allowed: space, (), ., /, -, &";
      }
    }

    // Date validation in save (dates don't need trimming)
    if (field.key === "start_date" && value) {
      const rangeError = isValidDateWithinRange(value, true);
      if (rangeError) {
        newErrors.start_date = rangeError;
      }
    }

    if (field.key === "end_date" && value) {
      const rangeError = isValidDateWithinRange(value, false);
      if (rangeError) {
        newErrors.end_date = rangeError;
      }
    }

    if (
      field.key === "end_date" &&
      value &&
      trimmedFormData.start_date &&
      new Date(trimmedFormData.start_date) > new Date(value)
    ) {
      newErrors.end_date = "End date should be after start date";
    }
  });

  setErrors(newErrors);

  if (Object.keys(newErrors).length > 0) return;

  const sparkData = {};
  const userData = {};

  // Use trimmed data for saving
  fields.forEach((field) => {
    const key = field.key;
    let value = trimmedFormData[key] || "";

    // Ensure final trimming
    if (typeof value === 'string') {
      if (key === 'phone_no') {
        value = formatPhoneNumber(value);
      } else if (!field.isSelect && field.type !== "date") {
        value = trimFormValue(value);
      }
    }

    // Check if this is a SPARK field that hasn't been modified by user
    if (
      isSparkField(key) &&
      isFieldDisabled(key) &&
      !userUpdatedFields.has(key)
    ) {
      sparkData[key] = value;
    } 
    // Check if user has modified this field or it's originally from user
    else if (
      userUpdatedFields.has(key) ||
      deputationDetails?.fieldSources?.[key] === "USER" ||
      deputationDetails?.fieldSources?.[key] === "AIS_OFFICER" ||
      deputationDetails?.fieldSources?.[key] === "GAD_OFFICER"
    ) {
      userData[key] = value;
    }
    // If it's a new record (no fieldSources), include all fields in userData
    else if (!deputationDetails?.fieldSources) {
      userData[key] = value;
    }
    // For SPARK fields that user hasn't modified but we need to save, include in userData
    else if (isSparkField(key) && !userUpdatedFields.has(key)) {
      userData[key] = value;
    }
  });

  // If both are empty and this is an existing record, populate userData with current values
  if (Object.keys(sparkData).length === 0 && Object.keys(userData).length === 0 && selectedDeputation) {
    fields.forEach((field) => {
      const key = field.key;
      let value = trimmedFormData[key] || "";
      
      if (typeof value === 'string') {
        if (key === 'phone_no') {
          value = formatPhoneNumber(value);
        } else if (!field.isSelect && field.type !== "date") {
          value = trimFormValue(value);
        }
      }
      
      userData[key] = value;
    });
  }

  const updatedData = {
    spark_data: isSparkData && Object.keys(sparkData).length > 0 ? sparkData : {},
    user_data: userData,
  };

  console.log("Modal handleSave updatedData:", JSON.stringify(updatedData, null, 2));
  await onSave(updatedData);
  setFormData(initialFormData);
  setOpen(false);
  setUserUpdatedFields(new Set());
  setSparkUpdatedFields({});
  setShowSuggestions(false);
};


  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setSparkUpdatedFields({});
    setUserUpdatedFields(new Set());
    setShowSuggestions(false);
    setActiveSuggestionIndex(0);
    setOpen(false);
  };

  const renderSelectOptions = (field) => {
    const options = masterData?.[field.masterKey] || [];
    if (!options || options.length === 0) {
      return <option disabled>No {field.label} options available</option>;
    }
    return options
      .filter((option) => option[field.idKey] && option[field.masterKey])
      .map((option) => (
        <option key={String(option[field.idKey])} value={String(option[field.idKey])}>
          {option[field.masterKey] || "N/A"}
        </option>
      ));
  };

  const getFieldClassName = (fieldKey) => {
    const baseClasses =
      "mt-1 block w-full rounded-md sm:text-sm p-2 border";

    if (
      officerFields?.GAD_OFFICER?.includes(fieldKey) &&
      hasPreFilledValue(fieldKey)
    ) {
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

  // Get date constraints for setting min/max attributes
  const getDateInputAttributes = () => {
    const { minDate, maxDate } = getDateConstraints();
    const attributes = {};
    
    if (minDate) {
      attributes.min = minDate.toISOString().split('T')[0];
    }
    
    if (maxDate) {
      attributes.max = maxDate.toISOString().split('T')[0];
    }
    
    return attributes;
  };

  const renderSparkIndicator = (fieldKey) => {
    if (!isSparkField(fieldKey) || !hasPreFilledValue(fieldKey)) return null;
    return (
      <div className="absolute top-3 right-3 group z-10">
        <span
          className="inline-flex items-center p-0.5 rounded-full bg-orange-100 text-orange-600 text-xs"
          aria-label="Synced from SPARK"
        >
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
    if (
      !(officerFields?.GAD_OFFICER?.includes(fieldKey) && hasPreFilledValue(fieldKey))
    )
      return null;
    return (
      <div className="absolute top-3 right-3 group z-10">
        <span
          className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-xs"
          aria-label="Sourced from GAD Officer"
        >
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
    const hasSparkData = fields.some(
      (f) => isSparkField(f.key) && hasPreFilledValue(f.key)
    );
    const hasOfficerData =
      officerFields?.GAD_OFFICER &&
      fields.some(
        (f) => officerFields.GAD_OFFICER.includes(f.key) && hasPreFilledValue(f.key)
      );
    return hasSparkData || hasOfficerData;
  };

  // Check if masterData.tenures is populated
  if (open && (!masterData?.tenures || masterData.tenures.length === 0)) {
    console.warn("Modal not rendering: masterData.tenures is empty");
    return null;
  }

  const dateAttributes = getDateInputAttributes();

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
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-2">
                      Deputation Details
                    </h3>
                    {hasAnyIndication() && (
                      <div className="mb-5 flex justify-end">
                        <div className="flex items-center space-x-4 border rounded-md px-3 py-2 bg-white dark:bg-gray-800">
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
                              <svg
                                className="w-2 h-2"
                                fill="currentColor"
                                viewBox="0 0 8 8"
                              >
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {fields.map((field) => (
                      <div key={field.key} className={`relative ${field.hasSuggestions ? 'z-20' : ''}`}>
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
                            <option value="">Select {field.label}</option>
                            {renderSelectOptions(field)}
                          </select>
                        ) : field.type === "date" ? (
                          <input
                            type="date"
                            name={field.key}
                            value={
                              formData[field.key]
                                ? new Date(formData[field.key])
                                    .toISOString()
                                    .split("T")[0]
                                : ""
                            }
                            onChange={handleChange}
                            disabled={isFieldDisabled(field.key)}
                            className={getFieldClassName(field.key)}
                            min={dateAttributes.min}
                            max={dateAttributes.max}
                          />
                        ) : field.hasSuggestions ? (
                          // Designation field with autocomplete
                          <div className="relative">
                            <input
                              ref={inputRef}
                              type="text"
                              name={field.key}
                              value={formData[field.key] || ""}
                              onChange={handleChange}
                              onKeyDown={handleKeyDown}
                              onFocus={() => {
                                const filtered = filterSuggestions(formData[field.key]);
                                setDesignationSuggestionsList(filtered);
                                setShowSuggestions(true);
                              }}
                              onBlur={handleBlur}
                              disabled={isFieldDisabled(field.key)}
                              className={`${getFieldClassName(field.key)} pr-16`}
                              maxLength={DESIGNATION_MAX_LENGTH}
                              autoComplete="off"
                            />
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 z-10">
                              {formData[field.key] ? formData[field.key].length : 0}/{DESIGNATION_MAX_LENGTH}
                            </div>
                            
                            {/* Suggestions Dropdown */}
                            {showSuggestions && designationSuggestionsList.length > 0 && (
                              <div 
                                ref={suggestionRef}
                                className="absolute z-30 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto"
                                onMouseDown={handleSuggestionMouseDown} // Add this line
                              >
                                {designationSuggestionsList.map((suggestion, index) => (
                                  <div
                                    key={suggestion}
                                    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                      index === activeSuggestionIndex 
                                        ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200' 
                                        : 'text-gray-900 dark:text-white'
                                    }`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleSuggestionClick(suggestion);
                                    }}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                                  >
                                    {suggestion}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : field.key === "phone_no" ? (
                          // Phone number field with character count
                          <div className="relative">
                            <input
                              type="text"
                              name={field.key}
                              value={formData[field.key] || ""}
                              onChange={handleChange}
                              disabled={isFieldDisabled(field.key)}
                              className={`${getFieldClassName(field.key)} pr-16`}
                              maxLength={PHONE_MAX_LENGTH}
                              placeholder="Enter 10-digit phone number"
                            />
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                              {formData[field.key] ? formData[field.key].length : 0}/{PHONE_MAX_LENGTH}
                            </div>
                          </div>
                        ) : (
                          // Regular text input
                          <input
                            type="text"
                            name={field.key}
                            value={formData[field.key] || ""}
                            onChange={handleChange}
                            disabled={isFieldDisabled(field.key)}
                            className={getFieldClassName(field.key)}
                          />
                        )}
                        {errors[field.key] && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors[field.key]}
                          </p>
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

ModalCentralDeputation.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  deputationDetails: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  masterData: PropTypes.object.isRequired,
  isSparkData: PropTypes.bool,
  sparkFields: PropTypes.instanceOf(Set),
  officerFields: PropTypes.object,
};