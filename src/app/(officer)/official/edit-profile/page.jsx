// ProfileEditPage.jsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";
import axiosInstance from '@/utils/apiClient';

// Add these imports at the top of the file
import {
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon, 
  ClockIcon,
  ExclamationCircleIcon,
  LockClosedIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { extractErrorMessage, getErrorMessage } from '@/utils/serviceTypeUtils';

// Validation utilities
const validateDate = (date, userDob, relation, fieldName) => {
  if (!date) return null;
  
  const dateObj = new Date(date);
  const userDobObj = userDob ? new Date(userDob) : null;
  const today = new Date();
  const age = (today - dateObj) / (365.25 * 24 * 60 * 60 * 1000);
  
  if (dateObj > today) return `${fieldName} cannot be in the future`;
  
  if (relation) {
    const relLower = relation.toLowerCase();
    if (relLower === 'spouse' && age < 18) {
      return 'Spouse must be at least 18 years old';
    }
    if ((relLower === 'father' || relLower === 'mother') && userDobObj) {
      const parentAge = (userDobObj - dateObj) / (365.25 * 24 * 60 * 60 * 1000);
      if (parentAge < 18) {
        return `${relation} must be at least 18 years older than the officer`;
      }
    }
    if ((relLower === 'son' || relLower === 'daughter' || relLower === 'child') && userDobObj) {
      if (dateObj < userDobObj) {
        return `${relation} cannot be born before the officer`;
      }
    }
  }
  
  return null;
};

const validateDateRange = (startDate, endDate, fieldPrefix = '') => {
  if (!startDate || !endDate) return null;
  if (new Date(startDate) > new Date(endDate)) {
    return `${fieldPrefix} Start date must be before end date`;
  }
  return null;
};

// PF Number validation
const validatePFNumber = (pfNumber) => {
  if (!pfNumber) return null;
  const trimmedValue = pfNumber.toString().trim();
  if (!/^\d{12}$/.test(trimmedValue)) {
    return 'PF Account Number must be exactly 12 numeric digits (0-9 only, no letters, spaces, or special characters).';
  }
  return null;
};

// Check if field source is AIS Officer (override SPARK_API for specific fields)
const getEffectiveSource = (fieldName, fieldData) => {
  const aisOfficerFields = ['pwd_status', 'is_ais_officer', 'spouse_history', 'is_govt_servant'];
  if (aisOfficerFields.includes(fieldName)) {
    return 'ais_officer';
  }
  
  if (fieldData && typeof fieldData === 'object') {
    const sources = ['AIS_OFFICER', 'DB_SPARK_API', 'SPARK_API'];
    for (const source of sources) {
      if (fieldData[source] && fieldData[source][fieldName] !== undefined) {
        return source.toLowerCase();
      }
    }
  }
  
  if (fieldData === 'SPARK_API') {
    return 'spark_api';
  }
  
  return 'ais_officer';
};

// Helper function to get actual field value considering sources
const getFieldValue = (dependent, fieldName) => {
  if (dependent.fields) {
    if (dependent.fields.AIS_OFFICER && dependent.fields.AIS_OFFICER[fieldName] !== undefined) {
      return dependent.fields.AIS_OFFICER[fieldName];
    }
    if (dependent.fields.DB_SPARK_API && dependent.fields.DB_SPARK_API[fieldName] !== undefined) {
      return dependent.fields.DB_SPARK_API[fieldName];
    }
    if (dependent.fields.SPARK_API && dependent.fields.SPARK_API[fieldName] !== undefined) {
      return dependent.fields.SPARK_API[fieldName];
    }
  }
  
  return dependent[fieldName];
};

// Helper function to check if field is disabled (from SPARK)
const isFieldDisabled = (dependent, fieldName) => {
  if (!dependent.fields) return false;
  
  if (fieldName === 'first_name' || fieldName === 'last_name') {
    if (dependent.fields.DB_SPARK_API && dependent.fields.DB_SPARK_API[fieldName] !== undefined) {
      return true;
    }
  }
  
  if (dependent.fields.DB_SPARK_API && dependent.fields.DB_SPARK_API[fieldName] !== undefined) {
    return false;
  }
  
  return false;
};

// Document Viewer Component
const DocumentViewer = ({ documentId, documentName, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [documentUrl, setDocumentUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isPdf, setIsPdf] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!documentId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axiosInstance.get(`/doc-uploader/get-document/${documentId}`, {
          responseType: 'blob',
        });
        
        const url = URL.createObjectURL(response.data);
        const isPdfFile = response.data.type.includes('pdf');
        
        setDocumentUrl(url);
        setIsPdf(isPdfFile);
      } catch (err) {
        console.error('Error fetching document:', err);
        setError('Failed to load document');
        toast.error('Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();

    return () => {
      if (documentUrl) {
        URL.revokeObjectURL(documentUrl);
      }
    };
  }, [documentId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="text-red-500 text-center mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.698-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-800 text-center mb-4 dark:text-gray-100">{error}</p>
          <button
            onClick={onClose}
            className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800 truncate dark:text-gray-100">{documentName}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {isPdf ? (
            <iframe
              src={documentUrl}
              className="w-full h-full min-h-[60vh] border-0"
              title={documentName}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <img
                src={documentUrl}
                alt={documentName}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-between items-center">
          <a
            href={documentUrl}
            download={documentName}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Document Display Component
const DocumentDisplay = ({ documentId, label, className = '' }) => {
  const [showViewer, setShowViewer] = useState(false);
  
  if (!documentId) return null;
  
  return (
    <>
      <div className={`relative ${className}`}>
        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer group dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
             onClick={() => setShowViewer(true)}>
          <div>
            <p className="text-xs font-medium text-indigo-700 mb-1 dark:text-gray-200">{label}</p>
          
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded dark:bg-gray-700 dark:text-gray-200">View</span>
            <svg className="h-4 w-4 text-indigo-600 group-hover:translate-x-1 transition-transform dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
      
      {showViewer && (
        <DocumentViewer
          documentId={documentId}
          documentName={`${label} - ${documentId}`}
          onClose={() => setShowViewer(false)}
        />
      )}
    </>
  );
};

// MultiSelect component for Languages Known
// Updated MultiSelect component with fixed positioning
const MultiSelect = ({ label, options, value = [], onChange, disabled = false, error, searchTerm = '', fieldId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange({ target: { value: newValue } });
  };

  const selectedLabels = value
    .map(v => options.find(opt => opt.value === v)?.label)
    .filter(Boolean)
    .join(', ');

  const isHighlighted = searchTerm && (label.toLowerCase().includes(searchTerm.toLowerCase()) || selectedLabels.toLowerCase().includes(searchTerm.toLowerCase()));

  // Calculate dropdown position
  const getDropdownStyle = () => {
    if (!containerRef.current) return {};
    
    const rect = containerRef.current.getBoundingClientRect();
    return {
      width: rect.width,
      left: rect.left,
      top: rect.bottom + 5
    };
  };

  return (
    <div 
      className={`relative ${isHighlighted ? 'bg-yellow-100 border-2 border-yellow-400 p-3 rounded-lg shadow-sm' : ''}`} 
      ref={containerRef}
      id={fieldId}
    >
      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1 dark:text-gray-200">
        {label}
        {disabled && (
          <span className="inline-flex items-center justify-center w-5 h-5 bg-gray-200 rounded-full text-gray-900 cursor-help ml-1 dark:bg-gray-700 dark:text-gray-100" title="Sourced from SPARK, cannot be edited">
            <LockClosedIcon className="h-3 w-3" />
          </span>
        )}
      </label>
      <div
        className={`flex items-center justify-between cursor-pointer rounded-lg border p-3 bg-white transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 ${
          error ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : 'border-gray-300 hover:border-indigo-400'
        } ${disabled ? 'bg-gray-50 cursor-not-allowed hover:border-gray-300 dark:bg-gray-800 dark:border-gray-600' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="text-sm text-gray-900 truncate dark:text-gray-100">
          {selectedLabels || <span className="text-gray-400 dark:text-gray-400">Select options</span>}
        </span>
        <ChevronDownIcon className={`h-4 w-4 text-gray-500 dark:text-gray-300 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {/* Fixed positioning dropdown */}
      {isOpen && !disabled && (
        <div 
          ref={dropdownRef}
          className="fixed z-[1000] rounded-lg border border-gray-300 bg-white shadow-lg overflow-hidden dark:bg-gray-800 dark:border-gray-700"
          style={getDropdownStyle()}
        >
          <div className="p-2 bg-gray-50 border-b sticky top-0 dark:bg-gray-700 dark:border-gray-600">
            <div className="text-xs text-gray-500 dark:text-gray-300">Select multiple options</div>
          </div>
          <ul className="overflow-y-auto max-h-48 p-1">
            {options.map((option) => (
              <li 
                key={option.value} 
                className="flex items-center space-x-2 p-2 hover:bg-indigo-50 rounded cursor-pointer transition-colors duration-150 dark:hover:bg-gray-700"
                onClick={() => handleSelect(option.value)}
              >
                <input
                  type="checkbox"
                  checked={value.includes(option.value)}
                  onChange={() => handleSelect(option.value)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:border-gray-600"
                  onClick={(e) => e.stopPropagation()}
                />
                <label className="text-sm text-gray-900 cursor-pointer flex-1 dark:text-gray-100">{option.label}</label>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {error && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

// Reusable FormSection with toggle functionality and search highlighting
const FormSection = ({ title, children, onSave, hasData = true, forceOpen = false, searchTerm = '', sectionData = [] }) => {
  const [isOpen, setIsOpen] = useState(forceOpen);

  useEffect(() => {
    if (forceOpen) setIsOpen(true);
  }, [forceOpen]);

  const hasMatches = searchTerm && sectionData.some(item => 
    Object.values(item).some(value => 
      value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (!hasData) return null;

  return (
    <div className="mb-4 border border-gray-200 rounded-lg shadow-sm overflow-hidden bg-white hover:shadow-md transition-shadow duration-200 dark:bg-gray-800 dark:border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex justify-between items-center w-full py-3 px-4 font-semibold transition-colors duration-200 ${
          hasMatches 
            ? 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500' 
            : 'bg-indigo-200 text-gray-800 hover:bg-indigo-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <span className="flex items-center text-base">
          {title}
          {hasMatches && (
            <span className="ml-2 bg-yellow-1000 text-white text-xs font-medium px-2 py-0.5 rounded-full">
              Match
            </span>
          )}
        </span>
       <span className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
        <ChevronDownIcon className="h-5 w-5" />
      </span>
       </button>
      {isOpen && (
        <div className="p-4 bg-white transition-opacity duration-300 dark:bg-gray-800">
          {children}
          {onSave && (
            <div className="mt-4 pt-4 border-t border-gray-100 text-right dark:border-gray-700">
              <button
                onClick={onSave}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
              >
                Save {title} <CheckCircleIcon className="h-4 w-4 inline-block ml-1" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Reusable InputField with enhanced search highlighting
const InputField = ({ label, type = 'text', value, onChange, disabled = false, options = [], multiple = false, error, min, max, searchTerm = '', fieldId }) => {
  const isSelect = type === 'select';
  const isTextarea = type === 'textarea';
  const isCheckbox = type === 'checkbox';

  const displayedValue = isSelect 
    ? (multiple ? (value || []).join(', ') : value?.toString() || '') 
    : (value?.toString() || '');

  const isHighlighted = searchTerm && (
    label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    displayedValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (options && options.some(opt => 
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (multiple ? value.includes(opt.value) : value === opt.value)
    ))
  );

  return (
    <div className={`relative group ${isHighlighted ? 'bg-yellow-100 border-l-4 border-yellow-500 p-3 rounded-r-lg' : ''}`} id={fieldId}>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1 dark:text-gray-200">
        {label}
       {disabled && (
            <span className="inline-flex items-center justify-center w-4 h-4 bg-gray-200 rounded text-gray-900 cursor-help dark:bg-gray-700 dark:text-gray-200" title="Sourced from SPARK, cannot be edited">
              <LockClosedIcon className="h-2.5 w-2.5" />
            </span>
          )}
          {/* {error && (
          <span className="text-red-500 text-xs font-normal ml-auto">
            Required
          </span>
        )} */}
      </label>
      {isCheckbox ? (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={value || false}
            onChange={onChange}
            disabled={disabled}
            className={`h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 transition-colors dark:border-gray-600 ${
              error ? 'border-red-500' : ''
            }`}
          />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Yes</span>
        </div>
      ) : isSelect ? (
        <select
          value={multiple ? (value || []) : (value ?? '')}
          onChange={(e) => {
            if (multiple) {
              const selectedValues = Array.from(e.target.selectedOptions).map(option => option.value);
              onChange({ target: { value: selectedValues } });
            } else {
              const selectedValue = e.target.value;
              onChange({ target: { value: selectedValue } });
            }
          }}
          multiple={multiple}
          disabled={disabled}
          className={`mt-1 block w-full border rounded-lg px-4 py-3 text-base focus:border-indigo-500 focus:ring-indigo-500 shadow-sm transition-colors disabled:bg-gray-100 bg-white text-gray-900 ${error ? 'border-red-500' : 'border-gray-300'} dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:disabled:bg-gray-800`}
        >
          {!multiple && <option value="">Select {label}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : isTextarea ? (
        <textarea
          value={value || ''}
          onChange={onChange}
          disabled={disabled}
          className={`mt-1 block w-full text-sm border rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-colors disabled:bg-gray-200 disabled:text-gray-900 bg-white text-gray-900 ${
            error ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : 'border-gray-300'
          } dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:disabled:bg-gray-800`}
          rows={3}
        />
      ) : (
        <input
          type={type}
          value={value || ''}
          onChange={onChange}
          disabled={disabled}
          min={min}
          max={max}
          className={`mt-1 block w-full text-sm border rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-colors disabled:bg-gray-200 disabled:text-gray-900 bg-white text-gray-900 ${
            error ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : 'border-gray-300'
          } dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:disabled:bg-gray-800`}
        />
      )}
      {error && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <ExclamationCircleIcon className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
};

// PersonalDetails component with PF number validation
const PersonalDetails = ({ editedData, handleChange, errors, searchTerm = '' }) => {
  const masters = editedData._masters;
  const [isLanguagesOpen, setIsLanguagesOpen] = useState(false);
  const languagesDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languagesDropdownRef.current && !languagesDropdownRef.current.contains(event.target)) {
        setIsLanguagesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageSelect = (languageId) => {
    const currentLanguages = editedData.ais_officer_info.languages_known_ids || [];
    const newLanguages = currentLanguages.includes(languageId)
      ? currentLanguages.filter(id => id !== languageId)
      : [...currentLanguages, languageId];
    handleChange(null, null, 'languages_known_ids', newLanguages);
  };

  const selectedLanguages = (editedData.ais_officer_info.languages_known_ids || [])
    .map(id => masters.language.find(lang => lang.language_id === id)?.language)
    .filter(Boolean)
    .join(', ');
  
  const isLanguagesHighlighted = searchTerm && ('Languages Known'.toLowerCase().includes(searchTerm.toLowerCase()) || selectedLanguages.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <InputField 
        label="Honorifics" 
        type="select"
        value={editedData.ais_officer_info.honorifics || ''} 
        onChange={(e) => handleChange(null, null, 'honorifics', e.target.value)} 
        disabled={editedData.ais_officer_info.fields?.honorifics === 'SPARK_API'} 
        options={[
          { value: 'Mr.', label: 'Mr.' },
          { value: 'Ms.', label: 'Ms.' },
          { value: 'Mrs.', label: 'Mrs.' },
          { value: 'Dr.', label: 'Dr.' }
        ]}
        error={errors.honorifics}
        searchTerm={searchTerm}
        fieldId="field-honorifics"
      />
      <InputField label="First Name" value={editedData.ais_officer_info.first_name || ''} onChange={(e) => handleChange(null, null, 'first_name', e.target.value)} disabled={editedData.ais_officer_info.fields?.first_name === 'SPARK_API'} error={errors.first_name} searchTerm={searchTerm} fieldId="field-first_name" />
      <InputField label="Last Name" value={editedData.ais_officer_info.last_name || ''} onChange={(e) => handleChange(null, null, 'last_name', e.target.value)} disabled={editedData.ais_officer_info.fields?.last_name === 'SPARK_API'} error={errors.last_name} searchTerm={searchTerm} fieldId="field-last_name" />
      <InputField label="Email" type="email" value={editedData.ais_officer_info.email || ''} onChange={(e) => handleChange(null, null, 'email', e.target.value)} disabled={true} error={errors.email} searchTerm={searchTerm} fieldId="field-email" />
      <InputField label="Mobile No" type="tel" value={editedData.ais_officer_info.mobile_no || ''} onChange={(e) => handleChange(null, null, 'mobile_no', e.target.value)} disabled={true} error={errors.mobile_no} searchTerm={searchTerm} fieldId="field-mobile_no" />
      <InputField label="Alternative Mobile No" type="tel" value={editedData.ais_officer_info.alternative_mobile_no || ''} onChange={(e) => handleChange(null, null, 'alternative_mobile_no', e.target.value)} disabled={editedData.ais_officer_info.fields?.alternative_mobile_no === 'SPARK_API'} error={errors.alternative_mobile_no} searchTerm={searchTerm} fieldId="field-alternative_mobile_no" />
      <InputField label="Alternative Email" type="email" value={editedData.ais_officer_info.alternative_email || ''} onChange={(e) => handleChange(null, null, 'alternative_email', e.target.value)} disabled={editedData.ais_officer_info.fields?.alternative_email === 'SPARK_API'} error={errors.alternative_email} searchTerm={searchTerm} fieldId="field-alternative_email" />
      <InputField label="AIS Number" value={editedData.ais_officer_info.ais_number || ''} onChange={(e) => handleChange(null, null, 'ais_number', e.target.value)} disabled={editedData.ais_officer_info.fields?.ais_number === 'SPARK_API'} error={errors.ais_number} searchTerm={searchTerm} fieldId="field-ais_number" />
      <InputField label="Karmasri Id" value={editedData.ais_officer_info.identity_number || ''} onChange={(e) => handleChange(null, null, 'identity_number', e.target.value)} disabled={true} error={errors.identity_number} searchTerm={searchTerm} fieldId="field-identity_number" />
      <InputField label="PEN Number" value={editedData.ais_officer_info.pen_number || ''} onChange={(e) => handleChange(null, null, 'pen_number', e.target.value)} disabled={true} error={errors.pen_number} searchTerm={searchTerm} fieldId="field-pen_number" />
      <InputField label="Praan Number" value={editedData.ais_officer_info.praan_number || ''} onChange={(e) => handleChange(null, null, 'praan_number', e.target.value)} disabled={editedData.ais_officer_info.fields?.praan_number === 'SPARK_API'} error={errors.praan_number} searchTerm={searchTerm} fieldId="field-praan_number" />
      <InputField label="PAN" value={editedData.ais_officer_info.pan_no || ''} onChange={(e) => handleChange(null, null, 'pan_no', e.target.value)} disabled={editedData.ais_officer_info.fields?.pan_no === 'SPARK_API'} error={errors.pan_no} searchTerm={searchTerm} fieldId="field-pan_no" />
      
      {/* PF Number with validation */}
      <InputField 
        label="PF Number" 
        type="text" 
        value={editedData.ais_officer_info.pf_number || ''} 
        onChange={(e) => handleChange(null, null, 'pf_number', e.target.value)} 
        disabled={editedData.ais_officer_info.fields?.pf_number === 'SPARK_API'} 
        error={errors.pf_number} 
        searchTerm={searchTerm} 
        fieldId="field-pf_number"
        placeholder="Enter 12-digit PF number"
      />
      
      <InputField label="Date of Birth" type="date" value={editedData.ais_officer_info.dob?.split('T')[0] || ''} onChange={(e) => handleChange(null, null, 'dob', e.target.value)} disabled={true} error={errors.dob} searchTerm={searchTerm} fieldId="field-dob" />
      <InputField label="Retirement Date" type="date" value={editedData.ais_officer_info.retirement_date?.split('T')[0] || ''} onChange={(e) => handleChange(null, null, 'retirement_date', e.target.value)} disabled={editedData.ais_officer_info.fields?.retirement_date === 'SPARK_API'} min={editedData.ais_officer_info.dob?.split('T')[0]} error={errors.retirement_date} searchTerm={searchTerm} fieldId="field-retirement_date" />
      <InputField label="Allotment Year" type="number" value={editedData.ais_officer_info.allotment_year || ''} onChange={(e) => handleChange(null, null, 'allotment_year', parseInt(e.target.value) || '')} disabled={editedData.ais_officer_info.fields?.allotment_year === 'SPARK_API'} error={errors.allotment_year} searchTerm={searchTerm} fieldId="field-allotment_year" />
      <InputField label="Date of Joining" type="date" value={editedData.ais_officer_info.date_of_joining?.split('T')[0] || ''} onChange={(e) => handleChange(null, null, 'date_of_joining', e.target.value)} disabled={editedData.ais_officer_info.fields?.date_of_joining === 'SPARK_API'} error={errors.date_of_joining} searchTerm={searchTerm} fieldId="field-date_of_joining" />
      {/* <InputField label="PWD Status" type="checkbox" value={editedData.ais_officer_info.pwd_status} onChange={(e) => handleChange(null, null, 'pwd_status', e.target.checked)} disabled={false} error={errors.pwd_status} searchTerm={searchTerm} fieldId="field-pwd_status" /> */}
      <InputField label="Gender" type="select" value={editedData.ais_officer_info.gender_id || ''} onChange={(e) => handleChange(null, null, 'gender_id', parseInt(e.target.value))} options={masters.gender.map((g) => ({ value: g.gender_id, label: g.gender }))} disabled={editedData.ais_officer_info.fields?.gender_id === 'SPARK_API'} error={errors.gender_id} searchTerm={searchTerm} fieldId="field-gender_id" />
      <InputField label="Blood Group" type="select" value={editedData.ais_officer_info.blood_group_id || ''} onChange={(e) => handleChange(null, null, 'blood_group_id', parseInt(e.target.value))} options={masters.bloodGroup.map((b) => ({ value: b.blood_group_id, label: b.blood_group }))} disabled={editedData.ais_officer_info.fields?.blood_group_id === 'SPARK_API'} error={errors.blood_group_id} searchTerm={searchTerm} fieldId="field-blood_group_id" />
      <InputField label="Category" type="select" value={editedData.ais_officer_info.category_id || ''} onChange={(e) => handleChange(null, null, 'category_id', parseInt(e.target.value))} options={masters.category.map((c) => ({ value: c.category_id, label: c.category }))} disabled={editedData.ais_officer_info.fields?.category_id === 'SPARK_API'} error={errors.category_id} searchTerm={searchTerm} fieldId="field-category_id" />
      <InputField label="Mother Tongue" type="select" value={editedData.ais_officer_info.mother_tongue_id || ''} onChange={(e) => handleChange(null, null, 'mother_tongue_id', parseInt(e.target.value))} options={masters.language.map((l) => ({ value: l.language_id, label: l.language }))} disabled={editedData.ais_officer_info.fields?.mother_tongue_id === 'SPARK_API'} error={errors.mother_tongue_id} searchTerm={searchTerm} fieldId="field-mother_tongue_id" />

<div 
  className={`relative group ${isLanguagesHighlighted ? 'bg-yellow-50 border-2 border-yellow-400 p-2 rounded-lg shadow-md' : ''}`} 
  ref={languagesDropdownRef} 
  id="field-languages_known"
>
  <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1 dark:text-gray-200">
    Languages Known
    {editedData.ais_officer_info.fields?.languages_known === 'SPARK_API' && (
      <span className="inline-flex items-center justify-center w-4 h-4 bg-gray-200 rounded text-gray-700 cursor-help dark:bg-gray-700 dark:text-gray-200" title="Sourced from SPARK, cannot be edited">
      </span>
    )}
  </label>
  <div
    className={`flex items-center justify-between cursor-pointer rounded-lg border p-2.5 bg-white text-sm transition-colors dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 ${
      errors.languages_known ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : 'border-gray-300 hover:border-indigo-400'
    } ${editedData.ais_officer_info.fields?.languages_known === 'SPARK_API' ? 'bg-gray-50 cursor-not-allowed hover:border-gray-300 dark:bg-gray-800 dark:border-gray-600' : ''} w-full`}
    onClick={() => editedData.ais_officer_info.fields?.languages_known !== 'SPARK_API' && setIsLanguagesOpen(!isLanguagesOpen)}
  >
    <span className="truncate text-gray-900 dark:text-gray-100">
      {selectedLanguages || <span className="text-gray-400 dark:text-gray-400">Select languages</span>}
    </span>
    <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-300 flex-shrink-0" />
  </div>
  
  {/* Fixed dropdown positioning */}
  {isLanguagesOpen && editedData.ais_officer_info.fields?.languages_known !== 'SPARK_API' && (
    <div 
      className="fixed z-[1000] bg-white shadow-lg rounded-lg border border-gray-300 max-h-60 overflow-auto dark:bg-gray-800 dark:border-gray-700"
      style={{
        width: `${languagesDropdownRef.current?.offsetWidth || 300}px`,
        left: `${languagesDropdownRef.current?.getBoundingClientRect().left || 0}px`,
        top: `${(languagesDropdownRef.current?.getBoundingClientRect().bottom || 0) + 5}px`
      }}
    >
      <div className="p-2 bg-gray-50 border-b sticky top-0 z-10 dark:bg-gray-700 dark:border-gray-600">
        <div className="text-xs text-gray-500 dark:text-gray-300">Select multiple languages</div>
      </div>
      <ul className="max-h-48 overflow-y-auto p-1">
        {masters.language.map((option) => (
          <li 
            key={option.language_id} 
            className="flex items-center space-x-2 p-2 hover:bg-indigo-50 rounded cursor-pointer transition-colors dark:hover:bg-gray-700"
            onClick={() => handleLanguageSelect(option.language_id)}
          >
            <input
              type="checkbox"
              checked={(editedData.ais_officer_info.languages_known_ids || []).includes(option.language_id)}
              onChange={() => handleLanguageSelect(option.language_id)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:border-gray-600"
              onClick={(e) => e.stopPropagation()}
            />
            <label className="text-sm text-gray-900 cursor-pointer flex-1 dark:text-gray-100">{option.language}</label>
          </li>
        ))}
      </ul>
    </div>
  )}
  
  {errors.languages_known && (
    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
      <ExclamationCircleIcon className="h-3 w-3" />
      {errors.languages_known}
    </p>
  )}
</div>
      
      <InputField label="Source of Recruitment" type="select" value={editedData.ais_officer_info.source_of_recruitment_id || ''} onChange={(e) => handleChange(null, null, 'source_of_recruitment_id', parseInt(e.target.value))} options={masters.recruitment.map((r) => ({ value: r.recruitment_id, label: r.recruitment }))} disabled={editedData.ais_officer_info.fields?.source_of_recruitment_id === 'SPARK_API'} error={errors.source_of_recruitment_id} searchTerm={searchTerm} fieldId="field-source_of_recruitment_id" />
      <InputField label="Cadre" type="select" value={editedData.ais_officer_info.cadre_id || ''} onChange={(e) => handleChange(null, null, 'cadre_id', parseInt(e.target.value))} options={masters.cadre.map((c) => ({ value: c.cadre_id, label: c.cadre }))} disabled={editedData.ais_officer_info.fields?.cadre_id === 'SPARK_API'} error={errors.cadre_id} searchTerm={searchTerm} fieldId="field-cadre_id" />
    </div>
  );
};

// AddressDetails component
const AddressDetails = ({ editedData, handleChange, errors, searchTerm = '' }) => {
  const masters = editedData._masters;
  
  return (
    <>
      <div className="mb-6">
        <h3 className="font-semibold text-base text-gray-800 mb-3 pb-2 border-b border-gray-200 dark:text-gray-100 dark:border-gray-700">Official Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Address Line 1" value={editedData.ais_officer_info.address_line1_com || ''} onChange={(e) => handleChange(null, null, 'address_line1_com', e.target.value)} disabled={editedData.ais_officer_info.fields?.address_line1_com === 'SPARK_API'} error={errors.address_line1_com} searchTerm={searchTerm} fieldId="field-address_line1_com" />
          <InputField label="Address Line 2" value={editedData.ais_officer_info.address_line2_com || ''} onChange={(e) => handleChange(null, null, 'address_line2_com', e.target.value)} disabled={editedData.ais_officer_info.fields?.address_line2_com === 'SPARK_API'} error={errors.address_line2_com} searchTerm={searchTerm} fieldId="field-address_line2_com" />
          <InputField label="State" type="select" value={editedData.ais_officer_info.state_id_com || ''} onChange={(e) => handleChange(null, null, 'state_id_com', parseInt(e.target.value))} options={masters.state.map((s) => ({ value: s.state_id, label: s.state }))} disabled={editedData.ais_officer_info.fields?.state_id_com === 'SPARK_API'} error={errors.state_id_com} searchTerm={searchTerm} fieldId="field-state_id_com" />
          <InputField label="District" type="select" value={editedData.ais_officer_info.district_id_com || ''} onChange={(e) => handleChange(null, null, 'district_id_com', parseInt(e.target.value))} options={masters.district.filter((d) => d.state_id === editedData.ais_officer_info.state_id_com).map((d) => ({ value: d.district_id, label: d.district }))} disabled={editedData.ais_officer_info.fields?.district_id_com === 'SPARK_API'} error={errors.district_id_com} searchTerm={searchTerm} fieldId="field-district_id_com" />
          <InputField label="Pin Code" type="number" value={editedData.ais_officer_info.pin_code_com || ''} onChange={(e) => handleChange(null, null, 'pin_code_com', parseInt(e.target.value) || '')} disabled={editedData.ais_officer_info.fields?.pin_code_com === 'SPARK_API'} error={errors.pin_code_com} searchTerm={searchTerm} fieldId="field-pin_code_com" />
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-base text-gray-800 mb-3 pb-2 border-b border-gray-200 dark:text-gray-100 dark:border-gray-700">Permanent Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Address Line 1" value={editedData.ais_officer_info.address_line1_per || ''} onChange={(e) => handleChange(null, null, 'address_line1_per', e.target.value)} disabled={editedData.ais_officer_info.fields?.address_line1_per === 'SPARK_API'} error={errors.address_line1_per} searchTerm={searchTerm} fieldId="field-address_line1_per" />
          <InputField label="Address Line 2" value={editedData.ais_officer_info.address_line2_per || ''} onChange={(e) => handleChange(null, null, 'address_line2_per', e.target.value)} disabled={editedData.ais_officer_info.fields?.address_line2_per === 'SPARK_API'} error={errors.address_line2_per} searchTerm={searchTerm} fieldId="field-address_line2_per" />
          <InputField label="State" type="select" value={editedData.ais_officer_info.state_id_per || ''} onChange={(e) => handleChange(null, null, 'state_id_per', parseInt(e.target.value))} options={masters.state.map((s) => ({ value: s.state_id, label: s.state }))} disabled={editedData.ais_officer_info.fields?.state_id_per === 'SPARK_API'} error={errors.state_id_per} searchTerm={searchTerm} fieldId="field-state_id_per" />
          <InputField label="District" type="select" value={editedData.ais_officer_info.district_id_per || ''} onChange={(e) => handleChange(null, null, 'district_id_per', parseInt(e.target.value))} options={masters.district.filter((d) => d.state_id === editedData.ais_officer_info.state_id_per).map((d) => ({ value: d.district_id, label: d.district }))} disabled={editedData.ais_officer_info.fields?.district_id_per === 'SPARK_API'} error={errors.district_id_per} searchTerm={searchTerm} fieldId="field-district_id_per" />
          <InputField label="Pin Code" type="number" value={editedData.ais_officer_info.pin_code_per || ''} onChange={(e) => handleChange(null, null, 'pin_code_per', parseInt(e.target.value) || '')} disabled={editedData.ais_officer_info.fields?.pin_code_per === 'SPARK_API'} error={errors.pin_code_per} searchTerm={searchTerm} fieldId="field-pin_code_per" />
        </div>
      </div>
    </>
  );
};

// DependentDetails component with search functionality
const DependentDetails = ({ editedData, searchTerm = '' }) => {
  const masters = editedData._masters;
  const userDob = editedData.ais_officer_info.dob;
  const userId = editedData.ais_per_id;
  const userFirstName = editedData.ais_officer_info.first_name || '';
  const userLastName = editedData.ais_officer_info.last_name || '';

  const getFieldSource = (dep, fieldName) => {
    if (!dep?.fields) return 'none';
    
    if (dep.fields.AIS_OFFICER && dep.fields.AIS_OFFICER[fieldName] !== undefined) {
      return 'AIS_OFFICER';
    }
    if (dep.fields.DB_SPARK_API && dep.fields.DB_SPARK_API[fieldName] !== undefined) {
      return 'DB_SPARK_API';
    }
    if (dep.fields.SPARK_API && dep.fields.SPARK_API[fieldName] !== undefined) {
      return 'SPARK_API';
    }
    return 'none';
  };

  const getFieldValue = (dep, fieldName) => {
    if (!dep) return '';
    
    const source = getFieldSource(dep, fieldName);
    if (source !== 'none' && dep.fields[source]) {
      const value = dep.fields[source][fieldName];
      if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
        if (value === '') return null;
      }
      return value;
    }
    
    const directValue = dep[fieldName];
    if (typeof directValue === 'string') {
      if (directValue.toLowerCase() === 'true') return true;
      if (directValue.toLowerCase() === 'false') return false;
      if (directValue === '') return null;
    }
    return directValue || '';
  };

  const getParentInfoForChild = (dep) => {
    const father_id = getFieldValue(dep, 'father_id');
    const mother_id = getFieldValue(dep, 'mother_id');
    const spouse_id = getFieldValue(dep, 'spouse_id');
    
    const idToNameMap = {};
    
    if (userId) {
      idToNameMap[userId] = {
        name: `${userFirstName} ${userLastName}`.trim() || 'You',
        relation: 'You'
      };
    }
    
    editedData.family.forEach(f => {
      const fid = f.person_id || f.ais_fam_id;
      if (fid) {
        const firstName = getFieldValue(f, 'first_name');
        const lastName = getFieldValue(f, 'last_name');
        idToNameMap[fid] = {
          name: `${firstName} ${lastName}`.trim(),
          relation: f.relation || 'Dependent'
        };
      }
    });
    
    let parentInfo = { name: 'Not specified', relation: '' };
    
    if (mother_id && idToNameMap[mother_id]) {
      parentInfo = idToNameMap[mother_id];
    } else if (father_id && idToNameMap[father_id]) {
      parentInfo = idToNameMap[father_id];
    } else if (spouse_id && idToNameMap[spouse_id]) {
      parentInfo = idToNameMap[spouse_id];
    }
    
    return parentInfo;
  };

  const getGenderDisplay = (genderId) => {
    if (!genderId && genderId !== 0) return '';
    
    const id = typeof genderId === 'string' ? parseInt(genderId) : genderId;
    
    const genderFromMasters = masters.gender?.find(g => {
      const gid = typeof g.gender_id === 'string' ? parseInt(g.gender_id) : g.gender_id;
      return gid === id;
    });
    
    if (genderFromMasters) return genderFromMasters.gender;
    
    if (id === 1) return 'Male';
    if (id === 2) return 'Female';
    if (id === 3) return 'Other';
    
    return '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (e) {
      return '';
    }
  };

  const getStatusInfo = (dep) => {
    const is_alive = getFieldValue(dep, 'is_alive');
    const relation = dep.relation || '';
    
    if (!is_alive) return { text: 'Deceased', color: 'bg-red-100 text-red-800 border-red-200' };
    if (relation.includes('Divorced')) return { text: 'Divorced', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    if (relation.includes('Current')) return { text: 'Current', color: 'bg-green-100 text-green-800 border-green-200' };
    return { text: 'Active', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
  };

  const SparkIndicator = ({ fieldKey, dep }) => {
    const source = getFieldSource(dep, fieldKey);
    const isSparkSource = source === 'DB_SPARK_API' || source === 'SPARK_API';
    
    if (!isSparkSource) return null;
    
    return (
      <div className="absolute top-1 right-1 group">
        <span className="inline-flex items-center p-0.5 rounded-full bg-orange-100 text-orange-600 text-xs">
          <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        </span>
        <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10">
          <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md whitespace-nowrap">
            Synced from SPARK
          </div>
        </div>
      </div>
    );
  };

  const UserIndicator = ({ fieldKey, dep }) => {
    const source = getFieldSource(dep, fieldKey);
    if (source !== 'AIS_OFFICER') return null;
    
    return (
      <div className="absolute top-1 right-1 group">
        <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-xs">
          <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </span>
        <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10">
          <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md whitespace-nowrap">
            AIS Officer
          </div>
        </div>
      </div>
    );
  };

  const FieldDisplay = ({ label, value, className = '', fieldKey, dep, showIndicator = true }) => {
    const displayValue = value !== null && value !== '' && value !== undefined ? value.toString() : '—';
    const isHighlighted = searchTerm && displayValue.toLowerCase().includes(searchTerm.toLowerCase());
    
    return (
      <div className={`relative p-2 bg-white rounded border border-gray-200 min-h-[60px] ${className} dark:bg-gray-800 dark:border-gray-700 ${
        isHighlighted ? 'bg-yellow-50 border-yellow-300' : ''
      }`}>
        {showIndicator && <SparkIndicator fieldKey={fieldKey} dep={dep} />}
        {showIndicator && <UserIndicator fieldKey={fieldKey} dep={dep} />}
        <p className="text-xs font-medium text-gray-600 mb-1 pr-6 dark:text-gray-300">{label}</p>
        <p className="text-sm font-medium text-gray-900 break-words dark:text-gray-100">{displayValue}</p>
      </div>
    );
  };

  const CompactField = ({ label, value, className = '', fieldKey, dep }) => {
    const displayValue = value !== null && value !== '' && value !== undefined ? value.toString() : '—';
    
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{displayValue}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {editedData.family.map((dep, index) => {
        const relation = dep.relation || 'Not specified';
        const statusInfo = getStatusInfo(dep);
        
        const firstName = getFieldValue(dep, 'first_name');
        const lastName = getFieldValue(dep, 'last_name');
        const dob = getFieldValue(dep, 'dob');
        const age = dob ? calculateAge(dob) : '';
        const genderDisplay = getGenderDisplay(getFieldValue(dep, 'gender_id'));
        const email = getFieldValue(dep, 'email_id');
        const mobile = getFieldValue(dep, 'mobile_number');
        const isAlive = getFieldValue(dep, 'is_alive');
        const isAISOfficer = getFieldValue(dep, 'is_ais_officer');
        const isGovtServant = getFieldValue(dep, 'is_govt_servant');
        const deathCert = getFieldValue(dep, 'death_certificate');
        const marriageCert = getFieldValue(dep, 'marriage_certificate_proof');
        const supportDoc = getFieldValue(dep, 'sup_doc_for_remv');
        const deathDate = getFieldValue(dep, 'death_date');
        const divorceDate = getFieldValue(dep, 'divorce_date');
        
        const isChild = relation.includes('Son') || relation.includes('Daughter') || dep.relation_type === 'Child';
        const parentInfo = isChild ? getParentInfoForChild(dep) : null;

        const hasContactInfo = email || mobile;
        const hasDocuments = deathCert || marriageCert || supportDoc;
        const hasStatusDates = deathDate || divorceDate;
        const hasOccupationInfo = isGovtServant || getFieldValue(dep, 'category_id') || getFieldValue(dep, 'institution_name');

        return (
          <div key={dep.person_id || dep.ais_fam_id || index} className="bg-white rounded-lg border border-gray-300 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-indigo-50 border-b border-gray-300 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-lg dark:text-gray-100">
                    {relation}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    {statusInfo.text}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {isAISOfficer && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700">
                      AIS Officer
                    </span>
                  )}
                  {isGovtServant && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 border border-teal-200 dark:bg-teal-900/40 dark:text-teal-200 dark:border-teal-700">
                      Govt. Servant
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <FieldDisplay 
                  label="First Name" 
                  value={firstName} 
                  fieldKey="first_name" 
                  dep={dep}
                  className="md:col-span-1"
                />
                <FieldDisplay 
                  label="Last Name" 
                  value={lastName} 
                  fieldKey="last_name" 
                  dep={dep}
                  className="md:col-span-1"
                />
                <FieldDisplay 
                  label="Gender" 
                  value={genderDisplay} 
                  fieldKey="gender_id" 
                  dep={dep}
                  className="md:col-span-1"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <FieldDisplay 
                  label="Date of Birth" 
                  value={formatDate(dob)} 
                  fieldKey="dob" 
                  dep={dep}
                  className="md:col-span-1"
                />
                <div className="md:col-span-1 p-2 bg-indigo-50 rounded border border-indigo-200 dark:bg-gray-800 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-600 mb-1 dark:text-gray-300">Age</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{age} {age ? 'years' : ''}</p>
                </div>
                
                {isChild ? (
                  <div className="md:col-span-1 p-2 bg-purple-50 rounded border border-purple-200 dark:bg-gray-800 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-600 mb-1 dark:text-gray-300">Parent</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{parentInfo?.name || '—'}</p>
                    {parentInfo?.relation && parentInfo.relation !== '—' && (
                      <p className="text-xs text-gray-600 mt-0.5 dark:text-gray-300">{parentInfo.relation}</p>
                    )}
                  </div>
                ) : (
                  <div className="md:col-span-1 p-2 bg-white rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-600 mb-1 dark:text-gray-300">Living Status</p>
                    <p className={`text-sm font-medium ${isAlive ? 'text-green-700' : 'text-red-700'}`}>
                      {isAlive ? 'Alive' : 'Deceased'}
                    </p>
                  </div>
                )}
              </div>
              
              {hasContactInfo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {email && (
                    <FieldDisplay 
                      label="Email" 
                      value={email} 
                      fieldKey="email_id" 
                      dep={dep}
                    />
                  )}
                  {mobile && (
                    <FieldDisplay 
                      label="Mobile" 
                      value={mobile} 
                      fieldKey="mobile_number" 
                      dep={dep}
                    />
                  )}
                </div>
              )}
              
              {hasOccupationInfo && (
                <div className="mb-4 p-3 bg-teal-50 rounded border border-teal-200">
                  <p className="text-xs font-medium text-gray-600 mb-2 dark:text-gray-300">Occupation Information</p>
                  <div className="space-y-2">
                    {isGovtServant && (
                      <CompactField 
                        label="Government Service" 
                        value="Yes" 
                        fieldKey="is_govt_servant" 
                        dep={dep}
                      />
                    )}
                    {getFieldValue(dep, 'category_id') && (
                      <CompactField 
                        label="Category" 
                        value={masters.occupationCategory?.find(c => 
                          c.category_id?.toString() === getFieldValue(dep, 'category_id')?.toString()
                        )?.category_name} 
                        fieldKey="category_id" 
                        dep={dep}
                      />
                    )}
                    {getFieldValue(dep, 'institution_name') && (
                      <CompactField 
                        label="Institution" 
                        value={getFieldValue(dep, 'institution_name')} 
                        fieldKey="institution_name" 
                        dep={dep}
                      />
                    )}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Documents Section */}
                {hasDocuments && (
                  <div className="p-3 bg-gray-50 rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-600 mb-2 dark:text-gray-300">Documents</p>
                    <div className="space-y-1">
                      {deathCert && (
                        <DocumentDisplay 
                          documentId={deathCert}
                          label="Death Certificate"
                          className="mb-2"
                        />
                      )}
                      {marriageCert && (
                        <DocumentDisplay 
                          documentId={marriageCert}
                          label="Marriage Certificate"
                          className="mb-2"
                        />
                      )}
                      {supportDoc && (
                        <DocumentDisplay 
                          documentId={supportDoc}
                          label="Supporting Document"
                          className="mb-2"
                        />
                      )}
                    </div>
                  </div>
                )}
                
                {/* Status Dates Section */}
                {hasStatusDates && (
                  <div className={`p-3 rounded border ${
                    deathDate ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <p className="text-xs font-medium text-gray-600 mb-2 dark:text-gray-300">Status Dates</p>
                    <div className="space-y-1">
                      {deathDate && (
                        <CompactField 
                          label="Date Of Death" 
                          value={formatDate(deathDate)} 
                          fieldKey="death_date" 
                          dep={dep}
                        />
                      )}
                      {divorceDate && (
                        <CompactField 
                          label="Divorce Date" 
                          value={formatDate(divorceDate)} 
                          fieldKey="divorce_date" 
                          dep={dep}
                        />
                      )}
                    </div>
                  </div>
                )}
                
                {isChild && (
                  <div className="p-3 bg-white rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-600 mb-1 dark:text-gray-300">Living Status</p>
                    <p className={`text-sm font-medium ${isAlive ? 'text-green-700' : 'text-red-700'}`}>
                      {isAlive ? 'Alive' : 'Deceased'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      
      {editedData.family.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 dark:bg-gray-800 dark:border-gray-700">
          <p className="text-gray-500 text-lg mb-2 dark:text-gray-300">No dependent records available</p>
          <p className="text-gray-400 text-sm dark:text-gray-400">Add dependents from the main profile page</p>
        </div>
      )}
    </div>
  );
};

// EducationalQualifications component
const EducationalQualifications = ({ editedData, handleChange, errors = {}, searchTerm = '' }) => {
  const masters = editedData._masters;

  return (
    <div className="space-y-4">
      {editedData.ais_edu_qualification.map((edu, index) => (
        <div key={`edu-${edu.ais_edu_id}-${index}`} className="bg-gray-50 p-6 rounded-xl shadow-sm border border-primary-500 dark:bg-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField
              label="Qualification"
              type="select"
              value={edu.qualification_id || ''}
              onChange={(e) => {
                const value = e.target.value;
                const parsedValue = value === '' ? null : parseInt(value, 10);
                handleChange('ais_edu_qualification', edu.ais_edu_id, 'qualification_id', parsedValue);
              }}
              options={masters.qualification.map((q) => ({
                value: q.qualification_id,
                label: q.qualification,
              }))}
              disabled={edu.fields?.qualification_id === 'SPARK_API'}
              error={errors[`edu_${index}_qualification_id`]}
              searchTerm={searchTerm}
              fieldId={`field-edu_${index}_qualification_id`}
            />
            <InputField
              label="Institute Name"
              value={edu.institute_name || ''}
              onChange={(e) => handleChange('ais_edu_qualification', edu.ais_edu_id, 'institute_name', e.target.value)}
              disabled={edu.fields?.institute_name === 'SPARK_API'}
              error={errors[`edu_${index}_institute_name`]}
              searchTerm={searchTerm}
              fieldId={`field-edu_${index}_institute_name`}
            />
            <InputField
              label="Subject Name"
              value={edu.subject_name || ''}
              onChange={(e) => handleChange('ais_edu_qualification', edu.ais_edu_id, 'subject_name', e.target.value)}
              disabled={edu.fields?.subject_name === 'SPARK_API'}
              error={errors[`edu_${index}_subject_name`]}
              searchTerm={searchTerm}
              fieldId={`field-edu_${index}_subject_name`}
            />
          </div>
        </div>
      ))}
      {editedData.ais_edu_qualification.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 dark:bg-gray-800 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-300">No educational qualifications available</p>
        </div>
      )}
    </div>
  );
};

// CentralDeputation component
const CentralDeputation = ({ editedData, handleChange, errors = {}, searchTerm = '' }) => {
  const masters = editedData._masters;
  
  return (
    <div className="space-y-4">
      {editedData.ais_central_deputation.map((dep, index) => (
        <div key={`cendep-${dep.cen_dep_id}-${index}`} className="bg-gray-50 p-4 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Designation" value={dep.cen_designation || ''} onChange={(e) => handleChange('ais_central_deputation', dep.cen_dep_id, 'cen_designation', e.target.value)} disabled={dep.fields?.cen_designation === 'SPARK_API'} error={errors[`cendep_${index}_cen_designation`]} searchTerm={searchTerm} fieldId={`field-cendep_${index}_cen_designation`} />
            <InputField label="Phone No" type="tel" value={dep.phone_no || ''} onChange={(e) => handleChange('ais_central_deputation', dep.cen_dep_id, 'phone_no', e.target.value)} disabled={dep.fields?.phone_no === 'SPARK_API'} error={errors[`cendep_${index}_phone_no`]} searchTerm={searchTerm} fieldId={`field-cendep_${index}_phone_no`} />
            <InputField label="Start Date" type="date" value={dep.start_date?.split('T')[0] || ''} onChange={(e) => handleChange('ais_central_deputation', dep.cen_dep_id, 'start_date', e.target.value)} disabled={dep.fields?.start_date === 'SPARK_API'} error={errors[`cendep_${index}_start_date`]} searchTerm={searchTerm} fieldId={`field-cendep_${index}_start_date`} />
            <InputField label="End Date" type="date" value={dep.end_date?.split('T')[0] || ''} onChange={(e) => handleChange('ais_central_deputation', dep.cen_dep_id, 'end_date', e.target.value)} disabled={dep.fields?.end_date === 'SPARK_API'} min={dep.start_date?.split('T')[0]} error={errors[`cendep_${index}_end_date`]} searchTerm={searchTerm} fieldId={`field-cendep_${index}_end_date`} />
            <InputField label="State" type="select" value={dep.state_id || ''} onChange={(e) => handleChange('ais_central_deputation', dep.cen_dep_id, 'state_id', parseInt(e.target.value))} options={masters.state.map((s) => ({ value: s.state_id, label: s.state }))} disabled={dep.fields?.state_id === 'SPARK_API'} error={errors[`cendep_${index}_state_id`]} searchTerm={searchTerm} fieldId={`field-cendep_${index}_state_id`} />
            <InputField label="Tenure" type="select" value={dep.tenure_id || ''} onChange={(e) => handleChange('ais_central_deputation', dep.cen_dep_id, 'tenure_id', parseInt(e.target.value))} options={masters.tenure.map((t) => ({ value: t.tenure_id, label: t.tenures }))} disabled={dep.fields?.tenure_id === 'SPARK_API'} error={errors[`cendep_${index}_tenure_id`]} searchTerm={searchTerm} fieldId={`field-cendep_${index}_tenure_id`} />
            <InputField label="Ministry" type="select" value={dep.cen_min_id || ''} onChange={(e) => handleChange('ais_central_deputation', dep.cen_dep_id, 'cen_min_id', parseInt(e.target.value))} options={masters.ministry.map((m) => ({ value: m.ministry_id, label: m.ministry }))} disabled={dep.fields?.cen_min_id === 'SPARK_API'} error={errors[`cendep_${index}_cen_min_id`]} searchTerm={searchTerm} fieldId={`field-cendep_${index}_cen_min_id`} />
            <InputField label="Department" type="select" value={dep.cen_dept_id || ''} onChange={(e) => handleChange('ais_central_deputation', dep.cen_dep_id, 'cen_dept_id', parseInt(e.target.value))} options={masters.administrativeDepartment.map((d) => ({ value: d.administrative_department_id, label: d.administrative_department }))} disabled={dep.fields?.cen_dept_id === 'SPARK_API'} error={errors[`cendep_${index}_cen_dept_id`]} searchTerm={searchTerm} fieldId={`field-cendep_${index}_cen_dept_id`} />
            <InputField label="Organization" type="select" value={dep.cen_org_id || ''} onChange={(e) => handleChange('ais_central_deputation', dep.cen_dep_id, 'cen_org_id', parseInt(e.target.value))} options={masters.agency.map((a) => ({ value: a.agency_id, label: a.agency }))} disabled={dep.fields?.cen_org_id === 'SPARK_API'} error={errors[`cendep_${index}_cen_org_id`]} searchTerm={searchTerm} fieldId={`field-cendep_${index}_cen_org_id`} />
          </div>
        </div>
      ))}
      {editedData.ais_central_deputation.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 dark:bg-gray-800 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-300">No central deputation records available</p>
        </div>
      )}
    </div>
  );
};

// ServiceDetails component
const ServiceDetails = ({ editedData, handleChange, errors = {}, searchTerm = '' }) => {
  const masters = editedData._masters;
  
  return (
    <div className="space-y-4">
      {editedData.ais_service_history.map((service, index) => (
        <div key={`service-${service.ais_ser_id}-${index}`} className="bg-gray-50 p-4 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputField label="Designation" type="select" value={service.designation_id || ''} onChange={(e) => handleChange('ais_service_history', service.ais_ser_id, 'designation_id', parseInt(e.target.value))} options={masters.designation.map((d) => ({ value: d.designation_id, label: d.designation }))} disabled={service.fields?.designation_id === 'SPARK_API'} error={errors[`service_${index}_designation_id`]} searchTerm={searchTerm} fieldId={`field-service_${index}_designation_id`} />
            <InputField label="Address" value={service.address || ''} onChange={(e) => handleChange('ais_service_history', service.ais_ser_id, 'address', e.target.value)} disabled={service.fields?.address === 'SPARK_API'} error={errors[`service_${index}_address`]} searchTerm={searchTerm} fieldId={`field-service_${index}_address`} />
            <InputField label="Phone No" type="tel" value={service.phone_no || ''} onChange={(e) => handleChange('ais_service_history', service.ais_ser_id, 'phone_no', e.target.value)} disabled={service.fields?.phone_no === 'SPARK_API'} error={errors[`service_${index}_phone_no`]} searchTerm={searchTerm} fieldId={`field-service_${index}_phone_no`} />
            <InputField label="Is Additional Charge" type="checkbox" value={service.is_additional_charge} onChange={(e) => handleChange('ais_service_history', service.ais_ser_id, 'is_additional_charge', e.target.checked)} disabled={service.fields?.is_additional_charge === 'SPARK_API'} error={errors[`service_${index}_is_additional_charge`]} searchTerm={searchTerm} fieldId={`field-service_${index}_is_additional_charge`} />
            <InputField label="Start Date" type="date" value={service.start_date?.split('T')[0] || ''} onChange={(e) => handleChange('ais_service_history', service.ais_ser_id, 'start_date', e.target.value)} disabled={service.fields?.start_date === 'SPARK_API'} error={errors[`service_${index}_start_date`]} searchTerm={searchTerm} fieldId={`field-service_${index}_start_date`} />
            <InputField label="End Date" type="date" value={service.end_date?.split('T')[0] || ''} onChange={(e) => handleChange('ais_service_history', service.ais_ser_id, 'end_date', e.target.value)} disabled={service.fields?.end_date === 'SPARK_API'} min={service.start_date?.split('T')[0]} error={errors[`service_${index}_end_date`]} searchTerm={searchTerm} fieldId={`field-service_${index}_end_date`} />
            <InputField label="Administrative Department" type="select" value={service.administrative_department_id || ''} onChange={(e) => handleChange('ais_service_history', service.ais_ser_id, 'administrative_department_id', parseInt(e.target.value))} options={masters.administrativeDepartment.map((d) => ({ value: d.administrative_department_id, label: d.administrative_department }))} disabled={service.fields?.administrative_department_id === 'SPARK_API'} error={errors[`service_${index}_administrative_department_id`]} searchTerm={searchTerm} fieldId={`field-service_${index}_administrative_department_id`} />
            <InputField label="Agency" type="select" value={service.agency_id || ''} onChange={(e) => handleChange('ais_service_history', service.ais_ser_id, 'agency_id', parseInt(e.target.value))} options={masters.agency.map((a) => ({ value: a.agency_id, label: a.agency }))} disabled={service.fields?.agency_id === 'SPARK_API'} error={errors[`service_${index}_agency_id`]} searchTerm={searchTerm} fieldId={`field-service_${index}_agency_id`} />
            <InputField label="Level" type="select" value={service.level_id || ''} onChange={(e) => handleChange('ais_service_history', service.ais_ser_id, 'level_id', parseInt(e.target.value))} options={masters.level.map((l) => ({ value: l.level_id, label: l.level }))} disabled={service.fields?.level_id === 'SPARK_API'} error={errors[`service_${index}_level_id`]} searchTerm={searchTerm} fieldId={`field-service_${index}_level_id`} />
            <InputField label="State" type="select" value={service.state_id || ''} onChange={(e) => handleChange('ais_service_history', service.ais_ser_id, 'state_id', parseInt(e.target.value))} options={masters.state.map((s) => ({ value: s.state_id, label: s.state }))} disabled={service.fields?.state_id === 'SPARK_API'} error={errors[`service_${index}_state_id`]} searchTerm={searchTerm} fieldId={`field-service_${index}_state_id`} />
            <InputField label="District" type="select" value={service.district_id || ''} onChange={(e) => handleChange('ais_service_history', service.ais_ser_id, 'district_id', parseInt(e.target.value))} options={masters.district.filter((d) => d.state_id === service.state_id).map((d) => ({ value: d.district_id, label: d.district }))} disabled={service.fields?.district_id === 'SPARK_API'} error={errors[`service_${index}_district_id`]} searchTerm={searchTerm} fieldId={`field-service_${index}_district_id`} />
            <InputField label="Ministry" type="select" value={service.ministry_id || ''} onChange={(e) => handleChange('ais_service_history', service.ais_ser_id, 'ministry_id', parseInt(e.target.value))} options={masters.ministry.map((m) => ({ value: m.ministry_id, label: m.ministry }))} disabled={service.fields?.ministry_id === 'SPARK_API'} error={errors[`service_${index}_ministry_id`]} searchTerm={searchTerm} fieldId={`field-service_${index}_ministry_id`} />
            <InputField label="Grade" type="select" value={service.grade_id || ''} onChange={(e) => handleChange('ais_service_history', service.ais_ser_id, 'grade_id', parseInt(e.target.value))} options={masters.grade.map((g) => ({ value: g.grade_id, label: g.grade }))} disabled={service.fields?.grade_id === 'SPARK_API'} error={errors[`service_${index}_grade_id`]} searchTerm={searchTerm} fieldId={`field-service_${index}_grade_id`} />
            <InputField label="Posting Type" type="select" value={service.posting_type_id || ''} onChange={(e) => handleChange('ais_service_history', service.ais_ser_id, 'posting_type_id', parseInt(e.target.value))} options={masters.postingType.map((p) => ({ value: p.posting_type_id, label: p.posting_types }))} disabled={service.fields?.posting_type_id === 'SPARK_API'} error={errors[`service_${index}_posting_type_id`]} searchTerm={searchTerm} fieldId={`field-service_${index}_posting_type_id`} />
            <InputField label="Other Details" value={service.other_details || ''} onChange={(e) => handleChange('ais_service_history', service.ais_ser_id, 'other_details', e.target.value)} disabled={service.fields?.other_details === 'SPARK_API'} error={errors[`service_${index}_other_details`]} searchTerm={searchTerm} fieldId={`field-service_${index}_other_details`} />
            <InputField label="Basic Pay" type="number" value={service.basic_pay || ''} onChange={(e) => handleChange('ais_service_history', service.ais_ser_id, 'basic_pay', parseFloat(e.target.value) || '')} disabled={service.fields?.basic_pay === 'SPARK_API'} error={errors[`service_${index}_basic_pay`]} searchTerm={searchTerm} fieldId={`field-service_${index}_basic_pay`} />
            <InputField label="Order No" value={service.order_no || ''} onChange={(e) => handleChange('ais_service_history', service.ais_ser_id, 'order_no', e.target.value)} disabled={service.fields?.order_no === 'SPARK_API'} error={errors[`service_${index}_order_no`]} searchTerm={searchTerm} fieldId={`field-service_${index}_order_no`} />
            <InputField label="Order Date" type="date" value={service.order_date?.split('T')[0] || ''} onChange={(e) => handleChange('ais_service_history', service.ais_ser_id, 'order_date', e.target.value)} disabled={service.fields?.order_date === 'SPARK_API'} error={errors[`service_${index}_order_date`]} searchTerm={searchTerm} fieldId={`field-service_${index}_order_date`} />
          </div>
        </div>
      ))}
      {editedData.ais_service_history.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 dark:bg-gray-800 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-300">No service history records available</p>
        </div>
      )}
    </div>
  );
};

// TrainingDetails component with document viewing
const TrainingDetails = ({ editedData, handleChange, errors = {}, searchTerm = '' }) => {
  const masters = editedData._masters;
  
  return (
    <div className="space-y-4">
      {editedData.ais_training_info.map((training, index) => (
        <div key={`training-${training.ais_tr_id}-${index}`} className="bg-gray-50 p-4 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* <InputField label="Training Name" value={training.training_name || ''} onChange={(e) => handleChange('ais_training_info', training.ais_tr_id, 'training_name', e.target.value)} disabled={training.fields?.training_name === 'SPARK_API'} error={errors[`training_${index}_training_name`]} searchTerm={searchTerm} fieldId={`field-training_${index}_training_name`} /> */}
            <InputField label="Training Type" type="select" value={training.training_type_id || ''} onChange={(e) => handleChange('ais_training_info', training.ais_tr_id, 'training_type_id', parseInt(e.target.value))} options={masters.trainingType.map((t) => ({ value: t.training_type_id, label: t.training_type }))} disabled={training.fields?.training_type_id === 'SPARK_API'} error={errors[`training_${index}_training_type_id`]} searchTerm={searchTerm} fieldId={`field-training_${index}_training_type_id`} />
            <InputField label="Institute Name" value={training.institute_name || ''} onChange={(e) => handleChange('ais_training_info', training.ais_tr_id, 'institute_name', e.target.value)} disabled={training.fields?.institute_name === 'SPARK_API'} error={errors[`training_${index}_institute_name`]} searchTerm={searchTerm} fieldId={`field-training_${index}_institute_name`} />
            <InputField label="Subject" value={training.subject || ''} onChange={(e) => handleChange('ais_training_info', training.ais_tr_id, 'subject', e.target.value)} disabled={training.fields?.subject === 'SPARK_API'} error={errors[`training_${index}_subject`]} searchTerm={searchTerm} fieldId={`field-training_${index}_subject`} />
            <InputField label="Place" value={training.place || ''} onChange={(e) => handleChange('ais_training_info', training.ais_tr_id, 'place', e.target.value)} disabled={training.fields?.place === 'SPARK_API'} error={errors[`training_${index}_place`]} searchTerm={searchTerm} fieldId={`field-training_${index}_place`} />
            <InputField label="Training From" type="date" value={training.training_from?.split('T')[0] || ''} onChange={(e) => handleChange('ais_training_info', training.ais_tr_id, 'training_from', e.target.value)} disabled={training.fields?.training_from === 'SPARK_API'} error={errors[`training_${index}_training_from`]} searchTerm={searchTerm} fieldId={`field-training_${index}_training_from`} />
            <InputField label="Training To" type="date" value={training.training_to?.split('T')[0] || ''} onChange={(e) => handleChange('ais_training_info', training.ais_tr_id, 'training_to', e.target.value)} disabled={training.fields?.training_to === 'SPARK_API'} min={training.training_from?.split('T')[0]} error={errors[`training_${index}_training_to`]} searchTerm={searchTerm} fieldId={`field-training_${index}_training_to`} />
            <InputField label="Country" type="select" value={training.country_id || ''} onChange={(e) => handleChange('ais_training_info', training.ais_tr_id, 'country_id', parseInt(e.target.value))} options={masters.country.map((c) => ({ value: c.country_id, label: c.country }))} disabled={training.fields?.country_id === 'SPARK_API'} error={errors[`training_${index}_country_id`]} searchTerm={searchTerm} fieldId={`field-training_${index}_country_id`} />
            <InputField label="Training Type" type="select" value={training.training_type_id || ''} onChange={(e) => handleChange('ais_training_info', training.ais_tr_id, 'training_type_id', parseInt(e.target.value))} options={masters.trainingType.map((t) => ({ value: t.training_type_id, label: t.training_type }))} disabled={training.fields?.training_type_id === 'SPARK_API'} error={errors[`training_${index}_training_type_id`]} searchTerm={searchTerm} fieldId={`field-training_${index}_training_type_id`} />
            
            {/* Documents Section */}
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-800 mb-2 dark:text-gray-200">Documents</label>
              {training.documents && training.documents.length > 0 ? (
                <div className="space-y-2">
                  {training.documents.map((docId, docIndex) => (
                    <DocumentDisplay
                      key={`training-${training.ais_tr_id}-doc-${docIndex}`}
                      documentId={docId}
                      label={`Training Document ${docIndex + 1}`}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-base text-gray-600 bg-white p-3 rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">No documents available</p>
              )}
            </div>
          </div>
        </div>
      ))}
      {editedData.ais_training_info.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 dark:bg-gray-800 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-300">No training records available</p>
        </div>
      )}
    </div>
  );
};

// AwardsPublications component with document viewing
const AwardsPublications = ({ editedData, handleChange, errors = {}, searchTerm = '' }) => {
  return (
    <div className="space-y-4">
      {editedData.ais_rewards.map((reward, index) => (
        <div key={`reward-${reward.ais_rew_id}-${index}`} className="bg-gray-50 p-4 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Award/Publication Name" value={reward.rew_name || ''} onChange={(e) => handleChange('ais_rewards', reward.ais_rew_id, 'rew_name', e.target.value)} disabled={reward.fields?.rew_name === 'SPARK_API'} error={errors[`reward_${index}_rew_name`]} searchTerm={searchTerm} fieldId={`field-reward_${index}_rew_name`} />
            <InputField label="Award/Publication From" value={reward.rew_from || ''} onChange={(e) => handleChange('ais_rewards', reward.ais_rew_id, 'rew_from', e.target.value)} disabled={reward.fields?.rew_from === 'SPARK_API'} error={errors[`reward_${index}_rew_from`]} searchTerm={searchTerm} fieldId={`field-reward_${index}_rew_from`} />
            <InputField label="Award/Publication Received On" type="date" value={reward.received_on?.split('T')[0] || ''} onChange={(e) => handleChange('ais_rewards', reward.ais_rew_id, 'received_on', e.target.value)} disabled={reward.fields?.received_on === 'SPARK_API'} error={errors[`reward_${index}_received_on`]} searchTerm={searchTerm} fieldId={`field-reward_${index}_received_on`} />
            <InputField label="Award/Publication Description" type="textarea" value={reward.rew_description || ''} onChange={(e) => handleChange('ais_rewards', reward.ais_rew_id, 'rew_description', e.target.value)} disabled={reward.fields?.rew_description === 'SPARK_API'} error={errors[`reward_${index}_rew_description`]} searchTerm={searchTerm} fieldId={`field-reward_${index}_rew_description`} />
            
            {/* Document Section */}
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-800 mb-2 dark:text-gray-200">Document</label>
              {reward.reward_doc ? (
                <DocumentDisplay
                  documentId={reward.reward_doc}
                  label="Award/Publication Document"
                />
              ) : (
                <p className="text-base text-gray-600 bg-white p-3 rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">No document available</p>
              )}
            </div>
          </div>
        </div>
      ))}
      {editedData.ais_rewards.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 dark:bg-gray-800 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-300">No awards or publications available</p>
        </div>
      )}
    </div>
  );
};

// SuspensionDetails component with delete functionality
const SuspensionDetails = ({ editedData, handleChange, handleAddSuspension, handleDeleteSuspension, errors = {}, searchTerm = '' }) => {

  
  const validSuspensions = editedData.ais_suspension_info.filter((sus, index, array) => {
    const isDuplicate = array.findIndex(item => 
      item.ais_sub_id === sus.ais_sub_id
    ) === index;
    return isDuplicate;
  });

  const isEmptySuspension = (suspension) => {
    return !suspension.from_period && 
           !suspension.to_period && 
           !suspension.suspension_details && 
           !suspension.sus_order_number;
  };
  const joiningDate = editedData?.ais_officer_info?.date_of_joining?.split('T')[0] || '';
  const retirementDate = editedData?.ais_officer_info?.retirement_date?.split('T')[0] || '';
   const handleFileUpload = async (suspensionId, file) => {
    try {
      const metadata = {
        document_type: "ER-Profile",
        document_sub_type: "Suspension",
        document_number: `SUS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: file.name,
        issuing_authority: "GAD Department",
        issue_date: new Date().toISOString().split('T')[0],
        created_by: "unknown",
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
      throw new Error("Document upload failed");
    } catch (err) {
      console.error('Error uploading document:', err);
      toast.error('Failed to upload document');
      return null;
    }
  };

  // Handle file change
  const handleFileChange = async (suspensionId, file) => {
    if (!file) {
      handleChange('ais_suspension_info', suspensionId, 'suspension_document', null);
      return;
    }

    // Validate file
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedExtensions.includes(fileExtension)) {
      toast.error('Only PDF, JPG, JPEG, PNG files are allowed');
      return;
    }

    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Upload file and get document ID
    const documentId = await handleFileUpload(suspensionId, file);
    if (documentId) {
      handleChange('ais_suspension_info', suspensionId, 'suspension_document', documentId);
      toast.success('Document uploaded successfully');
    }
  };
return (
    <div className="space-y-4">
      {validSuspensions.map((sus, index) => {
        const isEmpty = isEmptySuspension(sus);
        const isNew = typeof sus.ais_sub_id === 'string' && sus.ais_sub_id.startsWith('new_');
        
        return (
          <div key={`suspension-${sus.ais_sub_id}-${index}`} className={`p-4 rounded-lg border ${
            isEmpty ? 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/30' : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
          }`}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100">
                  Suspension Record {index + 1}
                </h3>
                
                <div className="flex items-center gap-1">
                  {!isNew && typeof sus.ais_sub_id === 'number' && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-200 px-2 py-0.5 rounded-full">
                      <CheckCircleIcon className="h-3 w-3" />
                      Saved
                    </span>
                  )}
                  {isNew && (
                    <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                      <ClockIcon className="h-3 w-3" />
                      Unsaved
                    </span>
                  )}
                  {isEmpty && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full dark:bg-gray-700 dark:text-gray-200">
                      <ExclamationTriangleIcon className="h-3 w-3" />
                      Empty
                    </span>
                  )}
                </div>
              </div>
              
              {(isEmpty || isNew) && (
                <button
                  onClick={() => handleDeleteSuspension(sus.ais_sub_id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 transition-colors duration-200"
                  title="Delete this suspension record"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  Delete
                </button>
              )}
            </div>
            
            {isEmpty && (
              <div className="mb-3 p-2.5 bg-red-100 border border-red-200 rounded-full text-red-700 text-xs">
                <p className="flex items-center gap-1.5">
                  <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                  This record is empty. Fill in the details or delete it.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField 
                label="From Period *" 
                type="date" 
                value={sus.from_period?.split('T')[0] || ''} 
                onChange={(e) => handleChange('ais_suspension_info', sus.ais_sub_id, 'from_period', e.target.value)} 
                disabled={sus.fields?.from_period === 'SPARK_API'}
                min={joiningDate}
                max={retirementDate}
                error={errors[`suspension_${index}_from_period`]} 
                searchTerm={searchTerm} 
                fieldId={`field-suspension_${index}_from_period`} 
              />
              <InputField 
                label="To Period *" 
                type="date" 
                value={sus.to_period?.split('T')[0] || ''} 
                onChange={(e) => handleChange('ais_suspension_info', sus.ais_sub_id, 'to_period', e.target.value)} 
                disabled={sus.fields?.to_period === 'SPARK_API'} 
                min={sus.from_period?.split('T')[0] || joiningDate}
                max={retirementDate}
                error={errors[`suspension_${index}_to_period`]} 
                searchTerm={searchTerm} 
                fieldId={`field-suspension_${index}_to_period`} 
              />
              <InputField 
                label="Suspension Details *" 
                value={sus.suspension_details || ''} 
                onChange={(e) => handleChange('ais_suspension_info', sus.ais_sub_id, 'suspension_details', e.target.value)} 
                disabled={sus.fields?.suspension_details === 'SPARK_API'} 
                error={errors[`suspension_${index}_suspension_details`]} 
                searchTerm={searchTerm} 
                fieldId={`field-suspension_${index}_suspension_details`} 
              />
              <InputField 
                label="Order Number *" 
                value={sus.sus_order_number || ''} 
                onChange={(e) => handleChange('ais_suspension_info', sus.ais_sub_id, 'sus_order_number', e.target.value)} 
                disabled={sus.fields?.sus_order_number === 'SPARK_API'} 
                error={errors[`suspension_${index}_sus_order_number`]} 
                searchTerm={searchTerm} 
                fieldId={`field-suspension_${index}_sus_order_number`} 
              />
              
              {/* Document Upload Field */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2 dark:text-gray-200">
                  Suspension Order Document
                </label>
                <div className="space-y-2">
                  {sus.suspension_document && (
                    <DocumentDisplay 
                      documentId={sus.suspension_document}
                      label="Suspension Order"
                      className="mb-2"
                    />
                  )}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(sus.ais_sub_id, e.target.files[0])}
                    disabled={sus.fields?.suspension_document === 'SPARK_API'}
                    className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-gray-700 dark:file:text-indigo-200 dark:hover:file:bg-gray-600"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-300">
                    Allowed types: PDF, JPG, JPEG, PNG. Max size: 5MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {validSuspensions.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 dark:bg-gray-800 dark:border-gray-700">
          <p className="text-gray-500 text-sm mb-2 dark:text-gray-300">No suspension records available</p>
          <p className="text-gray-400 text-xs dark:text-gray-400">Click the button below to add a new suspension record</p>
        </div>
      )}
      
      <button
        onClick={handleAddSuspension}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-sm flex items-center gap-2 ml-auto"
      >
        Add New Suspension
        <PlusIcon className="h-5 w-5" />
      </button>
    </div>
  );
};



// ExperienceDetails component
const ExperienceDetails = ({ editedData, handleChange, errors = {}, searchTerm = '' }) => {
  return (
    <div className="space-y-4">
      {editedData.ais_experience.map((exp, index) => (
        <div key={`exp-${exp.exp_id}-${index}`} className="bg-gray-50 p-4 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField label="Domain" value={exp.domain || ''} onChange={(e) => handleChange('ais_experience', exp.exp_id, 'domain', e.target.value)} disabled={exp.fields?.domain === 'SPARK_API'} error={errors[`exp_${index}_domain`]} searchTerm={searchTerm} fieldId={`field-exp_${index}_domain`} />
            <InputField label="From Period" type="date" value={exp.from_period?.split('T')[0] || ''} onChange={(e) => handleChange('ais_experience', exp.exp_id, 'from_period', e.target.value)} disabled={exp.fields?.from_period === 'SPARK_API'} error={errors[`exp_${index}_from_period`]} searchTerm={searchTerm} fieldId={`field-exp_${index}_from_period`} />
            <InputField label="To Period" type="date" value={exp.to_period?.split('T')[0] || ''} onChange={(e) => handleChange('ais_experience', exp.exp_id, 'to_period', e.target.value)} disabled={exp.fields?.to_period === 'SPARK_API'} min={exp.from_period?.split('T')[0]} error={errors[`exp_${index}_to_period`]} searchTerm={searchTerm} fieldId={`field-exp_${index}_to_period`} />
          </div>
        </div>
      ))}
      {editedData.ais_experience.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 dark:bg-gray-800 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-300">No experience records available</p>
        </div>
      )}
    </div>
  );
};

// DisabilityDetails component with document viewing
const DisabilityDetails = ({ editedData, handleChange, errors = {}, searchTerm = '' }) => {
  const masters = editedData._masters;
  
  return (
    <div className="space-y-4">
      {editedData.ais_officer_disability.map((dis, index) => (
        <div key={`disability-${dis.ais_des_id}-${index}`} className="bg-gray-50 p-4 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Disability Type" type="select" value={dis.disability_type_id || ''} onChange={(e) => handleChange('ais_officer_disability', dis.ais_des_id, 'disability_type_id', parseInt(e.target.value))} options={masters.disability.map((d) => ({ value: d.disability_id, label: d.disability }))} disabled={dis.fields?.disability_type_id === 'SPARK_API'} error={errors[`disability_${index}_disability_type_id`]} searchTerm={searchTerm} fieldId={`field-disability_${index}_disability_type_id`} />
            <InputField label="Percentage" type="number" value={dis.disability_perc || ''} onChange={(e) => handleChange('ais_officer_disability', dis.ais_des_id, 'disability_perc', parseInt(e.target.value) || '')} disabled={dis.fields?.disability_perc === 'SPARK_API'} error={errors[`disability_${index}_disability_perc`]} searchTerm={searchTerm} fieldId={`field-disability_${index}_disability_perc`} />
            <InputField label="Valid Up To" type="date" value={dis.dis_valid_up_to?.split('T')[0] || ''} onChange={(e) => handleChange('ais_officer_disability', dis.ais_des_id, 'dis_valid_up_to', e.target.value)} disabled={dis.fields?.dis_valid_up_to === 'SPARK_API'} min={new Date().toISOString().split('T')[0]} error={errors[`disability_${index}_dis_valid_up_to`]} searchTerm={searchTerm} fieldId={`field-disability_${index}_dis_valid_up_to`} />
            
            {/* Proof Document */}
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-800 mb-2 dark:text-gray-200">Proof</label>
              {dis.disability_proof ? (
                <DocumentDisplay
                  documentId={dis.disability_proof}
                  label="Disability Proof Document"
                />
              ) : (
                <p className="text-base text-gray-600 bg-white p-3 rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">No proof document available</p>
              )}
            </div>
          </div>
        </div>
      ))}
      {editedData.ais_officer_disability.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 dark:bg-gray-800 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-300">No disability records available</p>
        </div>
      )}
    </div>
  );
};

// Main ProfileEditPage component
const ProfileEditPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [editedData, setEditedData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [openSections, setOpenSections] = useState([]);
  const [personalErrors, setPersonalErrors] = useState({});
  const [addressErrors, setAddressErrors] = useState({});
  const [dependentErrors, setDependentErrors] = useState({});
  const [educationErrors, setEducationErrors] = useState({});
  const [centralDepErrors, setCentralDepErrors] = useState({});
  const [serviceErrors, setServiceErrors] = useState({});
  const [trainingErrors, setTrainingErrors] = useState({});
  const [rewardsErrors, setRewardsErrors] = useState({});
  const [suspensionErrors, setSuspensionErrors] = useState({});
  const [experienceErrors, setExperienceErrors] = useState({});
  const [disabilityErrors, setDisabilityErrors] = useState({});

  const errorSetters = {
    'Personal Details': setPersonalErrors,
    'Address Details': setAddressErrors,
    'Dependent Details': setDependentErrors,
    'Educational Qualifications': setEducationErrors,
    'Central Deputation': setCentralDepErrors,
    'Service Details': setServiceErrors,
    'Training Details': setTrainingErrors,
    'Awards and Publications': setRewardsErrors,
    'Disciplinary Action': setSuspensionErrors,
    'Experience Details': setExperienceErrors,
    'Disability Details': setDisabilityErrors,
  };

  const errorStates = {
    'Personal Details': personalErrors,
    'Address Details': addressErrors,
    'Dependent Details': dependentErrors,
    'Educational Qualifications': educationErrors,
    'Central Deputation': centralDepErrors,
    'Service Details': serviceErrors,
    'Training Details': trainingErrors,
    'Awards and Publications': rewardsErrors,
    'Disciplinary Action': suspensionErrors,
    'Experience Details': experienceErrors,
    'Disability Details': disabilityErrors,
  };

  const router = useRouter();

  const getAisPerId = () => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('editProfileId');
    }
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const aisPerId = getAisPerId();
        if (!aisPerId) throw new Error('No profile ID found in session storage.');
        
        const [officerResponse, ...masterResponses] = await Promise.all([
          axiosInstance.post('/as-II/officer-preview', { ais_per_id: aisPerId }),
          axiosInstance.get('/masters/recruitment-all'),
          axiosInstance.get('/masters/cadre-all'),
          axiosInstance.get('/masters/gender-all'),
          axiosInstance.get('/masters/state-all'),
          axiosInstance.get('/masters/tenure-all'),
          axiosInstance.get('/masters/district-all'),
          axiosInstance.get('/masters/designation-all'),
          axiosInstance.get('/masters/language-all'),
          axiosInstance.get('/masters/category-all'),
          axiosInstance.get('/masters/occupation-category-all'),
          axiosInstance.get('/masters/institution-all'),
          axiosInstance.get('/masters/training_type-all'),
          axiosInstance.get('/masters/country-all'),
          axiosInstance.get('/masters/ministry-all'),
          axiosInstance.get('/masters/administrative_department-all'),
          axiosInstance.get('/masters/agency-all'),
          axiosInstance.get('/masters/qualification-all'),
          axiosInstance.get('/masters/level-all'),
          axiosInstance.get('/masters/grade-all'),
          axiosInstance.get('/masters/posting_type-all'),
          axiosInstance.get('/masters/disability-all'),
          axiosInstance.get('/masters/blood-groups'),
          axiosInstance.get('/masters/relation'),
        ]);

        if (officerResponse.data.success) {
          const officerData = officerResponse.data.data.officer_data;
          const masters = {
            recruitment: masterResponses[0].data.data.recruitment || [],
            cadre: masterResponses[1].data.data.cadre || [],
            gender: masterResponses[2].data.data.gender || [],
            state: masterResponses[3].data.data.state || [],
            tenure: masterResponses[4].data.data.tenure || [],
            district: masterResponses[5].data.data.district || [],
            designation: masterResponses[6].data.data.designation || [],
            language: masterResponses[7].data.data.languages || [],
            category: masterResponses[8].data.data.category || [],
            occupationCategory: masterResponses[9].data.data.categories || [],
            institution: masterResponses[10].data.data.institutions || [],
            trainingType: masterResponses[11].data.data.training_type || [],
            country: masterResponses[12].data.data.country || [],
            ministry: masterResponses[13].data.data.ministry || [],
            administrativeDepartment: masterResponses[14].data.data.departments || [],
            agency: masterResponses[15].data.data || [],
            qualification: masterResponses[16].data.data.qualification || [],
            level: masterResponses[17].data.data.level || [],
            grade: masterResponses[18].data.data.grade || [],
            postingType: masterResponses[19].data.data.posting_type || [],
            disability: masterResponses[20].data.data.disability || [],
            bloodGroup: masterResponses[21].data.data['blood-group'] || [],
            relation: masterResponses[22].data.data.relation || [],
          };
          
          officerData._masters = masters;
          setOriginalData(officerData);
          setEditedData(JSON.parse(JSON.stringify(officerData)));
        } else {
          throw new Error('Failed to fetch officer data');
        }
      } catch (err) {
        setError(err.message);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const sectionsToOpen = [];
      
      if (editedData) {
        if (Object.values(editedData.ais_officer_info || {}).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )) {
          sectionsToOpen.push('Personal Details');
        }
        
        const addressFields = ['address_line1_com', 'address_line2_com', 'state_id_com', 'district_id_com', 'pin_code_com', 'address_line1_per', 'address_line2_per', 'state_id_per', 'district_id_per', 'pin_code_per'];
        if (addressFields.some(field => 
          editedData.ais_officer_info[field] && editedData.ais_officer_info[field].toString().toLowerCase().includes(searchTerm.toLowerCase())
        )) {
          sectionsToOpen.push('Address Details');
        }
        
        const sectionChecks = [
          { key: 'family', title: 'Dependent Details' },
          { key: 'ais_edu_qualification', title: 'Educational Qualifications' },
          { key: 'ais_central_deputation', title: 'Central Deputation' },
          { key: 'ais_service_history', title: 'Service Details' },
          { key: 'ais_training_info', title: 'Training Details' },
          { key: 'ais_rewards', title: 'Awards and Publications' },
          { key: 'ais_suspension_info', title: 'Disciplinary Action' },
          { key: 'ais_experience', title: 'Experience Details' },
          { key: 'ais_officer_disability', title: 'Disability Details' }
        ];
        
        sectionChecks.forEach(({ key, title }) => {
          if (editedData[key] && editedData[key].some(item => 
            Object.values(item).some(value => 
              value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
            )
          )) {
            sectionsToOpen.push(title);
          }
        });
      }
      
      setOpenSections(sectionsToOpen);
      
      setTimeout(() => {
        const highlights = document.querySelectorAll('.bg-yellow-100');
        setMatchCount(highlights.length);
        if (highlights.length > 0) {
          highlights[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else {
      setMatchCount(0);
      setOpenSections([]);
    }
  }, [searchTerm, editedData]);

  const validateData = (sectionTitle) => {
    const errors = {};
    const userDob = editedData.ais_officer_info.dob;

    if (sectionTitle === 'Dependent Details') {
      editedData.family.forEach((dep, index) => {
        const dobError = validateDate(dep.dob, userDob, dep.relation, 'Date of Birth');
        if (dobError) errors[`family_${index}_dob`] = dobError;
      });
    } else if (sectionTitle === 'Central Deputation') {
      editedData.ais_central_deputation.forEach((dep, index) => {
        const rangeError = validateDateRange(dep.start_date, dep.end_date, 'Deputation');
        if (rangeError) errors[`cendep_${index}_end_date`] = rangeError;
      });
    } else if (sectionTitle === 'Service Details') {
      editedData.ais_service_history.forEach((service, index) => {
        const rangeError = validateDateRange(service.start_date, service.end_date, 'Service');
        if (rangeError) errors[`service_${index}_end_date`] = rangeError;
      });
    } else if (sectionTitle === 'Training Details') {
      editedData.ais_training_info.forEach((training, index) => {
        const rangeError = validateDateRange(training.training_from, training.training_to, 'Training');
        if (rangeError) errors[`training_${index}_training_to`] = rangeError;
      });
    } else if (sectionTitle === 'Disciplinary Action') {
      editedData.ais_suspension_info.forEach((sus, index) => {
    if (!sus.from_period) {
      errors[`suspension_${index}_from_period`] = 'From Period is required';
    }
    if (!sus.to_period) {
      errors[`suspension_${index}_to_period`] = 'To Period is required';
    }
    if (!sus.suspension_details) {
      errors[`suspension_${index}_suspension_details`] = 'Suspension Details are required';
    }
    if (!sus.sus_order_number) {
      errors[`suspension_${index}_sus_order_number`] = 'Order Number is required';
    }

    const rangeError = validateDateRange(sus.from_period, sus.to_period, 'Suspension');
    if (rangeError) errors[`suspension_${index}_to_period`] = rangeError;
      });
    } else if (sectionTitle === 'Experience Details') {
      editedData.ais_experience.forEach((exp, index) => {
        const rangeError = validateDateRange(exp.from_period, exp.to_period, 'Experience');
        if (rangeError) errors[`exp_${index}_to_period`] = rangeError;
      });
    }

    return errors;
  };

  const handleChange = (section, id = null, field, value) => {
    setEditedData((prev) => {
      const newData = { ...prev };
      if (id !== null) {
        const sectionKey = section === 'family' ? 'person_id' : 
                           section === 'ais_edu_qualification' ? 'ais_edu_id' :
                           section === 'ais_central_deputation' ? 'cen_dep_id' :
                           section === 'ais_service_history' ? 'ais_ser_id' :
                           section === 'ais_training_info' ? 'ais_tr_id' :
                           section === 'ais_rewards' ? 'ais_rew_id' :
                           section === 'ais_suspension_info' ? 'ais_sub_id' :
                           section === 'ais_experience' ? 'exp_id' :
                           section === 'ais_officer_disability' ? 'ais_des_id' : null;
        
        if (sectionKey) {
          const index = newData[section].findIndex((item) => item[sectionKey] === id);
          if (index !== -1) {
            newData[section][index] = { ...newData[section][index], [field]: value };
          }
        }
      } else {
        newData.ais_officer_info = { ...newData.ais_officer_info, [field]: value };
      }
      return newData;
    });
  };

  const handleDeleteSuspension = (suspensionId) => {
    const isSavedRecord = typeof suspensionId === 'number';
    
    if (isSavedRecord) {
      if (window.confirm('Are you sure you want to delete this suspension record? This action cannot be undone.')) {
        handleDeleteSavedSuspension(suspensionId);
      }
    } else {
      setEditedData(prev => ({
        ...prev,
        ais_suspension_info: prev.ais_suspension_info.filter(sus => sus.ais_sub_id !== suspensionId)
      }));
      toast.info('🗑️ Empty suspension record removed');
    }
  };

  const handleDeleteSavedSuspension = async (suspensionId) => {
    try {
      await axiosInstance.delete(`/as-II/suspension-info/${suspensionId}`);
      
      setEditedData(prev => ({
        ...prev,
        ais_suspension_info: prev.ais_suspension_info.filter(sus => sus.ais_sub_id !== suspensionId)
      }));
      
      setOriginalData(prev => ({
        ...prev,
        ais_suspension_info: prev.ais_suspension_info.filter(sus => sus.ais_sub_id !== suspensionId)
      }));
      
      toast.success('✅ Suspension record deleted successfully');
    } catch (err) {
      console.error('Error deleting suspension:', err);
      toast.error('❌ Failed to delete suspension record');
    }
  };

  // In the ProfileEditPage component, update handleAddSuspension function
const handleAddSuspension = () => {
  const emptyUnsavedSuspensions = editedData.ais_suspension_info.filter(sus => 
    typeof sus.ais_sub_id === 'string' && 
    sus.ais_sub_id.startsWith('new_') && 
    !sus.from_period && 
    !sus.to_period && 
    !sus.suspension_details && 
    !sus.sus_order_number &&
    !sus.suspension_document
  );

  if (emptyUnsavedSuspensions.length > 0) {
    toast.info('ℹ️ Please fill or delete the existing empty suspension record first');
    setOpenSections(['Disciplinary Action']);
    
    setTimeout(() => {
      const firstEmpty = document.querySelector('.border-red-300');
      if (firstEmpty) {
        firstEmpty.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
    return;
  }

  const newSuspension = {
    ais_sub_id: `new_${Date.now()}`,
    from_period: '',
    to_period: '',
    suspension_details: '',
    sus_order_number: '',
    suspension_document: null, // NEW FIELD
    fields: {
      from_period: "GAD_OFFICER",
      to_period: "GAD_OFFICER", 
      suspension_details: "GAD_OFFICER",
      sus_order_number: "GAD_OFFICER",
      suspension_document: "GAD_OFFICER" // NEW FIELD
    }
  };

  setEditedData(prev => ({
    ...prev,
    ais_suspension_info: [...prev.ais_suspension_info, newSuspension]
  }));

  setOpenSections(prev => [...prev, 'Disciplinary Action']);
  
  toast.info('➕ New suspension record added. Please fill all required fields.');
};
  const getDiff = (original, edited) => {
    const diff = {};
    for (const key in edited) {
      if (key === '_masters') continue;
      if (JSON.stringify(edited[key]) !== JSON.stringify(original[key])) {
        diff[key] = edited[key];
      }
    }
    return diff;
  };

  const handleSavePersonal = async () => {
    const errors = validateData('Personal Details');
    setPersonalErrors(errors);
    if (Object.keys(errors).length > 0) {
      setOpenSections(['Personal Details']);
      const firstKey = Object.keys(errors)[0];
      const element = document.getElementById(`field-${firstKey}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          toast.error('Please correct the highlighted fields in Personal Details.');
        }, 300);
      }
      return;
    }

    const original = originalData.ais_officer_info;
    const edited = editedData.ais_officer_info;
    const ais_per_id = originalData.ais_per_id;
    const changed = getDiff(original, edited);
    if (Object.keys(changed).length === 0) return toast.info('No changes to save');
  
    try {
      await axiosInstance.put(`/as-II/officer/${ais_per_id}`, {
        user_data: changed,
      });
      setOriginalData({ ...originalData, ais_officer_info: { ...original, ...changed } });
      toast.success('Personal details saved');
    } catch (err) {
      toast.error('Failed to save personal details');
    }
  };

  const handleSaveAddress = async () => {
    const errors = validateData('Address Details');
    setAddressErrors(errors);
    if (Object.keys(errors).length > 0) {
      setOpenSections(['Address Details']);
      const firstKey = Object.keys(errors)[0];
      const element = document.getElementById(`field-${firstKey}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          toast.error('Please correct the highlighted fields in Address Details.');
        }, 300);
      }
      return;
    }

    const original = originalData.ais_officer_info;
    const ais_per_id = originalData.ais_per_id;
    const edited = editedData.ais_officer_info;
    const changed = getDiff(original, edited);
    if (Object.keys(changed).length === 0) return toast.info('No changes to save');

    try {
      await axiosInstance.put(`/as-II/officer/${ais_per_id}`, {
        user_data: changed,
      });
      setOriginalData({ ...originalData, ais_officer_info: { ...original, ...changed } });
      toast.success('Address details saved');
    } catch (err) {
      toast.error('Failed to save address details');
    }
  };

 // handleSaveSection function with document upload support
const handleSaveSection = async (section, idKey, urlPrefix, sectionTitle) => {
  const errors = validateData(sectionTitle);
  errorSetters[sectionTitle](errors);
  if (Object.keys(errors).length > 0) {
    setOpenSections([sectionTitle]);
    const firstKey = Object.keys(errors)[0];
    const element = document.getElementById(`field-${firstKey}`);
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        toast.error(` Validation failed in ${sectionTitle}. Please correct the highlighted fields.`);
      }, 300);
    }
    return;
  }

  const originalItems = originalData[section] || [];
  let editedItems = editedData[section] || [];
  const promises = [];

  if (section === 'ais_suspension_info') {
    const nonEmptySuspensions = editedItems.filter(sus => 
      sus.from_period || sus.to_period || sus.suspension_details || sus.sus_order_number
    );
    
    if (nonEmptySuspensions.length !== editedItems.length) {
      setEditedData(prev => ({
        ...prev,
        ais_suspension_info: nonEmptySuspensions
      }));
      toast.info('🧹 Empty suspension records removed before saving');
      editedItems = nonEmptySuspensions;
    }
  }

  let hasChanges = false;

  // Process each item individually
  for (let i = 0; i < editedItems.length; i++) {
    const editedItem = editedItems[i];
    const id = editedItem[idKey];
    const isNew = typeof id === 'string' && id.startsWith('new_');
    const originalItem = isNew ? null : originalItems.find((o) => o[idKey] === id);
    
    // Prepare the data to be sent
    let changed = isNew ? { ...editedItem } : getDiff(originalItem, editedItem);
    
    // Handle document upload for suspension if it's a File object
    if (section === 'ais_suspension_info' && changed.suspension_document instanceof File) {
      try {
        const metadata = {
          document_type: "ER-Profile",
          document_sub_type: "Suspension",
          document_number: `SUS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: changed.suspension_document.name,
          issuing_authority: "GAD Department",
          issue_date: new Date().toISOString().split('T')[0],
          created_by:"unknown"
        };

        const formData = new FormData();
        formData.append("file", changed.suspension_document);
        formData.append("metadata", JSON.stringify(metadata));

        const uploadResponse = await axiosInstance.post("/doc-uploader/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (uploadResponse.data.message === "Uploaded & saved") {
          changed.suspension_document = uploadResponse.data.document_id;
        } else {
          throw new Error("Document upload failed");
        }
      }
      catch (err) {
      console.error('Error uploading suspension document:', err);
  
      // Use utility function for error message
      const errorMessage = extractErrorMessage(err) || 'Failed to upload suspension document';
      toast.error(errorMessage);
      continue; // Skip this item if document upload fails
      }
    }

    if (isNew) {
      // Remove the temporary ID for new items
      delete changed[idKey];
      changed.ais_per_id = originalData.ais_per_id;
      changed.user_id = originalData.user_id;
      
      // Set field sources
      const fieldSources = {
        from_period: "GAD_OFFICER",
        to_period: "GAD_OFFICER",
        suspension_details: "GAD_OFFICER",
        sus_order_number: "GAD_OFFICER",
        suspension_document: "GAD_OFFICER"
      };
      
      // If document was uploaded, mark it as USER source
      if (editedItem.suspension_document instanceof File) {
        fieldSources.suspension_document = "USER";
      }
      
      changed.fields = fieldSources;
    }

    // For updates, only send changed fields
    if (!isNew && Object.keys(changed).length === 0) {
      continue; // No changes, skip
    }

    hasChanges = true;
    const endpoint = isNew ? urlPrefix : `${urlPrefix}/${id}`;
    const method = isNew ? axiosInstance.post : axiosInstance.put;
    const payload = { user_data: changed };
    
    // Create promise for this item
    const promise = method(endpoint, payload)
      .then(response => {
        if (response.data.success) {
          if (section === 'ais_suspension_info' && response.data.data && response.data.data.suspension) {
            return { 
              index: i, 
              newData: response.data.data.suspension,
              isNew: isNew,
              success: true 
            };
          }
          return { 
            index: i, 
            newData: response.data.data,
            isNew: isNew,
            success: true 
          };
        } else {
          return { 
            index: i, 
            error: response.data.detail || 'Unknown error',
            success: false 
          };
        }
      })
      .catch(error => {
       console.error(`Error saving ${sectionTitle} item:`, error);
  
      // Use utility functions for better error messages
      const status = error.response?.status;
      const backendMessage = extractErrorMessage(error);
      const errorMessage = getErrorMessage(status, backendMessage) || 
                      extractErrorMessage(error) || 
                      error.message || 
                      'Network error';
  
      return { 
      index: i, 
      error: errorMessage,
      success: false 
     };
    });
    
    promises.push(promise);
  }

  if (!hasChanges) {
    toast.info(` No changes to save in ${sectionTitle}`);
    return;
  }

  try {
    const results = await Promise.all(promises);
    let newEditedItems = [...editedItems];
    let successCount = 0;
    let errorCount = 0;
    let hasDataUpdates = false;

    results.forEach(result => {
      if (result.success && result.newData) {
        successCount++;
        hasDataUpdates = true;
        
        // Update the item with server response
        const updatedItem = {
          ...newEditedItems[result.index],
          ...result.newData,
          // Preserve fields property
          fields: newEditedItems[result.index].fields || result.newData.fields
        };
        
        // If it was a new item, update the ID
        if (result.isNew && result.newData.ais_sub_id) {
          updatedItem.ais_sub_id = result.newData.ais_sub_id;
        }
        
        newEditedItems[result.index] = updatedItem;
      } else if (!result.success) {
        errorCount++;
        console.error(` Failed to save ${sectionTitle} item ${result.index + 1}:`, result.error);
        
        // If it's a document upload error and the item was new, mark it for deletion
        if (result.error && result.error.includes('document') && 
            typeof newEditedItems[result.index]?.ais_sub_id === 'string' && 
            newEditedItems[result.index].ais_sub_id.startsWith('new_')) {
          newEditedItems[result.index]._hasError = true;
        }
      }
    });

    // Remove items with document upload errors
    if (section === 'ais_suspension_info') {
      const beforeFilterCount = newEditedItems.length;
      newEditedItems = newEditedItems.filter(item => !item._hasError);
      if (newEditedItems.length < beforeFilterCount) {
        toast.info('Some suspension records with upload errors were removed');
      }
    }

    if (hasDataUpdates) {
      // Update both edited and original data
      setEditedData(prev => ({ 
        ...prev, 
        [section]: JSON.parse(JSON.stringify(newEditedItems))
      }));
      setOriginalData(prev => ({ 
        ...prev, 
        [section]: JSON.parse(JSON.stringify(newEditedItems))
      }));
    }

    // Show appropriate toast messages
    if (successCount > 0 && errorCount === 0) {
      if (successCount === 1) {
        toast.success(` ${sectionTitle} saved successfully`);
      } else {
        toast.success(` ${successCount} ${sectionTitle} records saved successfully`);
      }
    } else if (successCount > 0 && errorCount > 0) {
      toast.warning(` ${successCount} saved, ${errorCount} failed in ${sectionTitle}`);
    } else if (errorCount > 0) {
      toast.error(` Failed to save ${errorCount} ${sectionTitle} records.Please check your network connection and try again.`);
    }

    // If all saved successfully and there were new items, scroll to show them
    if (successCount > 0 && section === 'ais_suspension_info') {
      setTimeout(() => {
        const savedItems = document.querySelectorAll('[id^="field-suspension_"]');
        if (savedItems.length > 0) {
          savedItems[savedItems.length - 1].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 500);
    }

  } catch (err) {
  console.error('Save error:', err);
  
  // Use utility functions for the main error too
  const status = err.response?.status;
  const backendMessage = extractErrorMessage(err);
  const errorMessage = getErrorMessage(status, backendMessage) || 
                      'Failed to save section';
  toast.error(` ${errorMessage}`);
}
};

  const handleSaveCompletely = () => {
    /*let hasErrors = false;
    const allSections = [
      'Personal Details',
      'Address Details',
      'Dependent Details',
      'Educational Qualifications',
      'Central Deputation',
      'Service Details',
      'Training Details',
      'Awards and Publications',
      'Disciplinary Action',
      'Experience Details',
      'Disability Details'
    ];

    const sectionsWithErrors = [];

    allSections.forEach((sectionTitle) => {
      const errors = validateData(sectionTitle);
      errorSetters[sectionTitle](errors);
      if (Object.keys(errors).length > 0) {
        hasErrors = true;
        sectionsWithErrors.push(sectionTitle);
      }
    });

    if (hasErrors) {
      setOpenSections(sectionsWithErrors);
      toast.error('Please fix validation errors in all sections before completing.');
      return;
    }

    if (JSON.stringify(originalData) === JSON.stringify(editedData)) {*/
      toast.success('Back to preview page.');
      router.back();
  /*  } else {
      toast.warning('Please save all sections before completing');
    }*/
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen text-gray-600 dark:text-gray-300">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-sm">Loading profile data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center min-h-screen text-red-600">
      <div className="text-center">
        <p className="mb-4 text-sm">Error: {error}</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">
          Go Back
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 dark:bg-gray-900 dark:text-gray-100">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-400 transition-colors duration-200 shadow-sm dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </button>
          <div className="mb-2 p-3 bg-gray-100 rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-700">
      
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center p-0.5 rounded-full bg-orange-100 text-orange-600">
              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-300">SPARK Synced</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600">
              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-300">AIS Officer</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-gray-200 rounded-full text-gray-600 dark:bg-gray-700 dark:text-gray-200">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-300">Read-only (SPARK)</span>
          </div>
        </div>
      </div>
          <div className="relative flex-1 max-w-md mx-4">
            <input
              type="text"
              placeholder="Search fields or data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder:text-gray-400"
            />
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-2.5 dark:text-gray-400" />
          </div>
        </div>
        
        {searchTerm && (
          <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 text-sm">
            {matchCount > 0 ? `${matchCount} match${matchCount > 1 ? 'es' : ''} found` : 'No matches found'}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3 dark:bg-gray-800 dark:border-gray-700">
          <FormSection 
            title="Personal Details" 
            onSave={handleSavePersonal} 
            hasData={true} 
            forceOpen={openSections.includes('Personal Details') || !!searchTerm}
            searchTerm={searchTerm}
            sectionData={[editedData.ais_officer_info]}
          >
            <PersonalDetails editedData={editedData} handleChange={handleChange} errors={personalErrors} searchTerm={searchTerm} />
          </FormSection>

          <FormSection 
            title="Address Details" 
            onSave={handleSaveAddress} 
            hasData={true} 
            forceOpen={openSections.includes('Address Details') || !!searchTerm}
            searchTerm={searchTerm}
            sectionData={[editedData.ais_officer_info]}
          >
            <AddressDetails editedData={editedData} handleChange={handleChange} errors={addressErrors} searchTerm={searchTerm} />
          </FormSection>

          <FormSection 
            title="Dependent Details" 
            onSave={() => handleSaveSection('family', 'person_id', '/as-II/family', 'Dependent Details')} 
            hasData={editedData.family.length > 0}
            forceOpen={openSections.includes('Dependent Details') || !!searchTerm}
            searchTerm={searchTerm}
            sectionData={editedData.family}
          >
            <DependentDetails editedData={editedData} handleChange={handleChange} errors={dependentErrors} searchTerm={searchTerm} />
          </FormSection>

          <FormSection 
            title="Educational Qualifications" 
            onSave={() => handleSaveSection('ais_edu_qualification', 'ais_edu_id', '/as-II/qualification', 'Educational Qualifications')} 
            hasData={editedData.ais_edu_qualification.length > 0}
            forceOpen={openSections.includes('Educational Qualifications') || !!searchTerm}
            searchTerm={searchTerm}
            sectionData={editedData.ais_edu_qualification}
          >
            <EducationalQualifications editedData={editedData} handleChange={handleChange} errors={educationErrors} searchTerm={searchTerm} />
          </FormSection>

          <FormSection 
            title="Central Deputation" 
            onSave={() => handleSaveSection('ais_central_deputation', 'cen_dep_id', '/as-II/central-deputation', 'Central Deputation')} 
            hasData={editedData.ais_central_deputation.length > 0}
            forceOpen={openSections.includes('Central Deputation') || !!searchTerm}
            searchTerm={searchTerm}
            sectionData={editedData.ais_central_deputation}
          >
            <CentralDeputation editedData={editedData} handleChange={handleChange} errors={centralDepErrors} searchTerm={searchTerm} />
          </FormSection>

          <FormSection 
            title="Service Details" 
            onSave={() => handleSaveSection('ais_service_history', 'ais_ser_id', '/as-II/service-history', 'Service Details')} 
            hasData={editedData.ais_service_history.length > 0}
            forceOpen={openSections.includes('Service Details') || !!searchTerm}
            searchTerm={searchTerm}
            sectionData={editedData.ais_service_history}
          >
            <ServiceDetails editedData={editedData} handleChange={handleChange} errors={serviceErrors} searchTerm={searchTerm} />
          </FormSection>

          <FormSection 
            title="Training Details" 
            onSave={() => handleSaveSection('ais_training_info', 'ais_tr_id', '/as-II/training-info', 'Training Details')} 
            hasData={editedData.ais_training_info.length > 0}
            forceOpen={openSections.includes('Training Details') || !!searchTerm}
            searchTerm={searchTerm}
            sectionData={editedData.ais_training_info}
          >
            <TrainingDetails editedData={editedData} handleChange={handleChange} errors={trainingErrors} searchTerm={searchTerm} />
          </FormSection>

          <FormSection 
            title="Awards and Publications" 
            onSave={() => handleSaveSection('ais_rewards', 'ais_rew_id', '/as-II/award-info', 'Awards and Publications')} 
            hasData={editedData.ais_rewards.length > 0}
            forceOpen={openSections.includes('Awards and Publications') || !!searchTerm}
            searchTerm={searchTerm}
            sectionData={editedData.ais_rewards}
          >
            <AwardsPublications editedData={editedData} handleChange={handleChange} errors={rewardsErrors} searchTerm={searchTerm} />
          </FormSection>
          
          <FormSection 
            title="Disciplinary Action" 
            onSave={() => handleSaveSection('ais_suspension_info', 'ais_sub_id', '/as-II/suspension-info', 'Disciplinary Action')} 
            hasData={true}
            forceOpen={openSections.includes('Disciplinary Action') || !!searchTerm}
            searchTerm={searchTerm}
            sectionData={editedData.ais_suspension_info}
          >
            <SuspensionDetails 
              editedData={editedData} 
              handleChange={handleChange} 
              handleAddSuspension={handleAddSuspension}
              handleDeleteSuspension={handleDeleteSuspension}
              errors={suspensionErrors} 
              searchTerm={searchTerm}
            />
          </FormSection>

          <FormSection 
            title="Experience Details" 
            onSave={() => handleSaveSection('ais_experience', 'exp_id', '/as-II/experience', 'Experience Details')} 
            hasData={editedData.ais_experience.length > 0}
            forceOpen={openSections.includes('Experience Details') || !!searchTerm}
            searchTerm={searchTerm}
            sectionData={editedData.ais_experience}
          >
            <ExperienceDetails editedData={editedData} handleChange={handleChange} errors={experienceErrors} searchTerm={searchTerm} />
          </FormSection>

          <FormSection 
            title="Disability Details" 
            onSave={() => handleSaveSection('ais_officer_disability', 'ais_des_id', '/as-II/disability-officer', 'Disability Details')} 
            hasData={editedData.ais_officer_disability.length > 0}
            forceOpen={openSections.includes('Disability Details') || !!searchTerm}
            searchTerm={searchTerm}
            sectionData={editedData.ais_officer_disability}
          >
            <DisabilityDetails editedData={editedData} handleChange={handleChange} errors={disabilityErrors} searchTerm={searchTerm} />
          </FormSection>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={handleSaveCompletely}
              className="w-full px-4 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-sm"
            >
              Back to preview page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPage;
 