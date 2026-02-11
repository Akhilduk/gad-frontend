'use client';

import PropTypes from 'prop-types';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { XMarkIcon, BoltIcon, UserIcon, DocumentArrowUpIcon, EyeIcon } from '@heroicons/react/24/outline';
import axiosInstance from '@/utils/apiClient';
import { toast } from 'react-toastify';
import { useProfileCompletion } from '@/contexts/Profile-completion-context';
import { uploadDocument, viewDocument } from '@/utils/documentUpload';

const initialFormData = {
  relation_id: '',
  is_govt_servant: false,
  is_ais_officer: false,
  aisNumber: '',
  first_name: '',
  last_name: '',
  dob: '',
  gender_id: '',
  email_id: null,
  mobile_number: null,
  user_id: '',
  category_id: null,
  institution_id: '',
  institution_name: '',
  spouse_id: '',
  showChildFields: false,
  manualEntry: false,
  verifiedFields: new Set(),
  sourceMap: {},
  is_alive: true,
  death_date: '',
  death_certificate: null,
  child_type: '',
  spouse_history: [],
  removing_reason: 0,
  sup_doc_for_remv: null,
  marriage_certificate_proof: null,
  divorce_date: '',
  spouse_status: 'current', // current, divorced, deceased
};

const disabledFields = ['age'];

const resetAisVerification = ({
  setFormData,
  setIsVerified,
  setShowDobVerification,
  setVerificationDob,
  setTempFetchedData,
  setSparkFields,
  setUserUpdatedFields,
  originalSparkData,
}) => {
  setFormData(prev => ({
    ...prev,
    is_ais_officer: false,
    aisNumber: '',
    user_id: null,
    first_name: originalSparkData?.first_name ?? '',
    last_name: originalSparkData?.last_name ?? '',
    dob: '',
    email_id: null,
    mobile_number: null,
    gender_id: '',
    verifiedFields: new Set(),
    manualEntry: true,
  }));
  setIsVerified(false);
  setShowDobVerification(false);
  setVerificationDob('');
  setTempFetchedData(null);

  setSparkFields(prev => {
    const next = new Set(prev);
    if (originalSparkData?.first_name) next.add('first_name');
    if (originalSparkData?.last_name) next.add('last_name');
    return next;
  });
  setUserUpdatedFields(new Set());
};

export function ModalDependentDetails({
  open,
  setOpen,
  dependentDetails,
  onSave,
  masterData,
  officerFields,
  dependentDetailsList,
  userDob,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [childrenCount, setChildrenCount] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [userUpdatedFields, setUserUpdatedFields] = useState(new Set());
  const [sparkFields, setSparkFields] = useState(new Set());
  const [tempFetchedData, setTempFetchedData] = useState(null);
  const [showDobVerification, setShowDobVerification] = useState(false);
  const [verificationDob, setVerificationDob] = useState('');
  const [errors, setErrors] = useState({});
  const [originalSparkData, setOriginalSparkData] = useState({});
  const [profileStatus, setProfileStatus] = useState('');
  const [deathCertificateFile, setDeathCertificateFile] = useState(null);
  const [marriageCertificateFile, setMarriageCertificateFile] = useState(null);
  const [divorceDocumentFile, setDivorceDocumentFile] = useState(null);
  const [availableSpouses, setAvailableSpouses] = useState([]);
  const [existingCurrentSpouse, setExistingCurrentSpouse] = useState(null);
  const fileInputRef = useRef(null);
  const marriageCertInputRef = useRef(null);
  const divorceDocInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [existingDeathCertificateId, setExistingDeathCertificateId] = useState(null);
  const [existingMarriageCertificateId, setExistingMarriageCertificateId] = useState(null);
  const [existingDivorceDocumentId, setExistingDivorceDocumentId] = useState(null);
  
  // New states for restrictions
  const [isRelationChangeRestricted, setIsRelationChangeRestricted] = useState(false);
  const [isSpouseStatusChangeRestricted, setIsSpouseStatusChangeRestricted] = useState(false);
  const [originalRelationId, setOriginalRelationId] = useState('');
  const [originalSpouseStatus, setOriginalSpouseStatus] = useState('');
  const [isSpouseLinkedToChild, setIsSpouseLinkedToChild] = useState(false);
  const [linkedChildren, setLinkedChildren] = useState([]);
  
  const backendFields = [
    'first_name', 'last_name', 'dob', 'email_id', 'mobile_number',
    'gender_id', 'place_of_domicile_id', 'category_id', 'institution_name',
    'is_govt_servant', 'is_ais_officer', 'pwd_status', 'removing_reason',
    'spouse_history', 'marriage_certificate_proof', 'sup_doc_for_remv',
    'user_id', 'relation_id', 'is_alive', 'death_date', 'death_certificate',
    'child_type', 'spouse_id', 'divorce_date',
  ];

  const mandatoryFields = [
    'relation_id',
    'first_name',
    'gender_id',
  ];

  // Add useRef to track initial render
  const hasCheckedSpouseRef = useRef(false);

  // Check if spouse is linked to any child
  const checkSpouseLinkedToChild = useCallback((spouseId) => {
    if (!spouseId || !dependentDetailsList.length) {
      setIsSpouseLinkedToChild(false);
      setLinkedChildren([]);
      return;
    }

    const children = dependentDetailsList.filter(dep => {
      const relName = getMasterValue(dep.relation_id, 'relation_id');
      const isChild = relName === 'Child';
      
      if (!isChild) return false;
      
      // Check if this spouse is linked as father or mother
      const fatherId = dep.father_id?.toString();
      const motherId = dep.mother_id?.toString();
      const spouseIdStr = spouseId.toString();
      
      return (fatherId === spouseIdStr) || (motherId === spouseIdStr);
    });

    if (children.length > 0) {
      setIsSpouseLinkedToChild(true);
      setLinkedChildren(children);
    } else {
      setIsSpouseLinkedToChild(false);
      setLinkedChildren([]);
    }
  }, [dependentDetailsList]);

  // Function to check if relation change should be restricted
  const checkRelationChangeRestriction = useCallback((currentRelationId, originalRelationId) => {
    // Restrict if this is an existing dependent (has ais_fam_id) and not from SPARK
    if (dependentDetails?.ais_fam_id && 
        !dependentDetails.ais_fam_id.toString().startsWith('spark_') &&
        currentRelationId !== originalRelationId) {
      return true;
    }
    return false;
  }, [dependentDetails]);

  // Function to check if spouse status change should be restricted
  const checkSpouseStatusChangeRestriction = useCallback((currentSpouseStatus, originalSpouseStatus) => {
    // Only restrict if original status is 'deceased' and trying to change to something else
    if (originalSpouseStatus === 'deceased' && 
        currentSpouseStatus !== originalSpouseStatus &&
        dependentDetails?.ais_fam_id && 
        !dependentDetails.ais_fam_id.toString().startsWith('spark_')) {
      return true;
    }
    return false;
  }, [dependentDetails]);

  const validateGovtServantFields = useCallback((data) => {
    const newErrors = {};
    
    // Debug log
    console.log('Validating govt servant fields:', {
      is_govt_servant: data.is_govt_servant,
      is_ais_officer: data.is_ais_officer,
      is_alive: data.is_alive,
      relation_id: data.relation_id,
      spouse_status: data.spouse_status,
      category_id: data.category_id,
      institution_id: data.institution_id,
      institution_name: data.institution_name,
      conditions: {
        is_govt_servant: data.is_govt_servant === true,
        is_ais_officer: data.is_ais_officer === false,
        is_alive: data.is_alive !== false,
        not_divorced_spouse: !(data.relation_id === '1' && data.spouse_status === 'divorced'),
        not_deceased_spouse: !(data.relation_id === '1' && data.spouse_status === 'deceased')
      }
    });
    
    // Only validate if all conditions are met
    const shouldValidateGovtFields = 
      data.is_govt_servant === true && 
      data.is_ais_officer === false && 
      data.is_alive !== false && 
      !(data.relation_id === '1' && data.spouse_status === 'divorced')&& !(data.relation_id === '1' && data.spouse_status === 'deceased');
    
    if (!shouldValidateGovtFields) {
      console.log("newErrors=1=",newErrors)
      return newErrors;
    }
    
    // Check category_id
    if (!data.category_id || data.category_id.toString().trim() === '' || data.category_id.toString().trim() === '0') {
      newErrors.category_id = 'Occupation category is required for government servants.';
    }
    
    if (data.category_id && data.category_id.toString().trim() !== '' && data.category_id.toString().trim() !== '0') {
      const categoryIdNum = parseInt(data.category_id.toString().trim());
      
      if (categoryIdNum === 4) {
        // For "Other" category, only institution_name is required
        const institutionName = (data.institution_name || '').toString().trim();
        if (!institutionName) {
          newErrors.institution_name = 'Institution name is required.';
        }
      } else if (categoryIdNum !== 4) {
        // For non-"Other" categories
        const institutionId = data.institution_id ? data.institution_id.toString().trim() : '';
        const institutionName = (data.institution_name || '').toString().trim();
        
        // CRITICAL FIX: When institution_id is "0", we only need institution_name
        if (institutionId === '0') {
          // For "Other" option in dropdown
          if (!institutionName) {
            newErrors.institution_name = 'Institution name is required when selecting "Other".';
          }
          // Don't require institution_id error when "Other" is selected
        } else if (!institutionId) {
          // Regular case - institution_id is required (and not "Other")
          newErrors.institution_id = 'Institution is required.';
        }
        
        // Additional check: If institution_id is NOT "0" but is empty
        if (institutionId !== '0' && !institutionId) {
          newErrors.institution_id = 'Institution is required.';
        }
      }
    }
    console.log("newErrors==",newErrors)
    return newErrors;
  }, []);

  // Effect to validate form whenever relevant fields change
  useEffect(() => {
    if (!open) return;

    const newErrors = { ...errors };
    
    // First, validate mandatory fields
    mandatoryFields.forEach(field => {
      const value = formData[field];
      if (field === 'gender_id') {
        // Special handling for gender - check if it's truly empty
        const genderValue = formData.gender_id;
        if (!genderValue || genderValue.toString().trim() === '' || genderValue.toString().trim() === '0') {
          newErrors[field] = 'This field is required.';
        } else {
          delete newErrors[field];
        }
      } else if (!value || (typeof value === 'string' && value.trim() === '')) {
        newErrors[field] = 'This field is required.';
      } else {
        // Clear the error if field is now valid
        delete newErrors[field];
      }
    });

    // Check if this is a deceased spouse or non-spouse deceased
    const isDeceasedSpouse = formData.relation_id === '1' && formData.spouse_status === 'deceased';
    const isNonSpouseDeceased = formData.relation_id !== '1' && formData.is_alive === false;
    
    if (isDeceasedSpouse || isNonSpouseDeceased) {
      // For deceased persons, only Date of Death and Death Certificate are required
      // Clear errors for email/mobile/dob
      delete newErrors.email_id;
      delete newErrors.mobile_number;
      delete newErrors.dob;
      
      // Check for death date and certificate
      if (!formData.death_date) {
        newErrors.death_date = 'Date Of Death is required.';
      } else {
        delete newErrors.death_date;
      }
      
      if (!formData.death_certificate && !existingDeathCertificateId) {
        newErrors.death_certificate = 'Death certificate is required.';
      } else {
        delete newErrors.death_certificate;
      }
    } else if (formData.is_alive === true && 
               !(formData.relation_id === '1' && formData.spouse_status === 'divorced') &&
               !(formData.relation_id === '1' && formData.spouse_status === 'deceased')) {
      // For alive persons (not divorced or deceased spouses)
      
      // DOB is required for alive persons
     /* if (!formData.dob) {
        newErrors.dob = 'DOB is required for alive persons.';
      } */
      if (formData.dob) {
        const dobError = validateDob(formData);
        if (dobError) {
          newErrors.dob = dobError;
        } else {
          delete newErrors.dob;
        }
      }else{
        delete newErrors.dob;
      }
      
      // Email and mobile are required for current spouse and non-spouse alive persons
      if ((formData.relation_id === '1' && formData.spouse_status === 'current') || 
          (formData.relation_id !== '1')) {
        /*if (!formData.email_id || formData.email_id.trim() === '') {
          newErrors.email_id = 'Email is required for alive persons.';
        } else {
          delete newErrors.email_id;
        }*/
        
        /*if (!formData.mobile_number || formData.mobile_number.trim() === '') {
          newErrors.mobile_number = 'Mobile number is required for alive persons.';
        } */
        
         if (formData.mobile_number && formData.mobile_number.trim() != '') { 
          const mobileError = validateMobileNumber(formData.mobile_number);
          if (mobileError) {
            newErrors.mobile_number = mobileError;
          } else {
            delete newErrors.mobile_number;
          }
        }else{
           delete newErrors.mobile_number;
        }
      }
    } else {
      // For divorced spouse or other cases, clear these errors
      delete newErrors.dob;
      delete newErrors.email_id;
      delete newErrors.mobile_number;
    }

    // Spouse specific validations
    if (formData.relation_id === '1') {
      if (formData.spouse_status === 'deceased') {
        // For deceased spouse, require death date and certificate
        if (!formData.death_date) {
          newErrors.death_date = 'Date Of Death is required for deceased spouse.';
        } else {
          delete newErrors.death_date;
        }
        
        if (!formData.death_certificate && !existingDeathCertificateId) {
          newErrors.death_certificate = 'Death certificate is required for deceased spouse.';
        } else {
          delete newErrors.death_certificate;
        }
        
        // CLEAR divorce-related errors for deceased spouse
        delete newErrors.divorce_date;
        delete newErrors.sup_doc_for_remv;
        
      } else if (formData.spouse_status === 'divorced') {
        // For divorced spouse, require divorce date and document
        if (!formData.divorce_date) {
          newErrors.divorce_date = 'Divorce date is required for divorced spouse.';
        } else {
          delete newErrors.divorce_date;
        }
        
        if (!formData.sup_doc_for_remv && !existingDivorceDocumentId) {
          newErrors.sup_doc_for_remv = 'Divorce document is required for divorced spouse.';
        } else {
          delete newErrors.sup_doc_for_remv;
        }
        
        // CLEAR death-related errors for divorced spouse
        delete newErrors.death_date;
        delete newErrors.death_certificate;
      } else {
        // For current spouse, clear both death and divorce errors
        delete newErrors.death_date;
        delete newErrors.death_certificate;
        delete newErrors.divorce_date;
        delete newErrors.sup_doc_for_remv;
      }
    }

    // Child specific validation
    if (formData.relation_id === '2') {
      if (!formData.child_type || formData.child_type.toString().trim() === '') {
        newErrors.child_type = 'Child type is required.';
      } else {
        delete newErrors.child_type;
      }
      
      // Allow child to be assigned to any spouse (current, divorced, or deceased)
      if (availableSpouses.length > 0 && (!formData.spouse_id || formData.spouse_id.toString().trim() === '')) {
        newErrors.spouse_id = 'Please select spouse for child.';
      } else {
        delete newErrors.spouse_id;
      }
    }

    // Validate govt servant fields
    const govtServantErrors = validateGovtServantFields(formData);
    
    // Clear any existing govt servant errors first
    ['category_id', 'institution_id', 'institution_name'].forEach(field => {
      if (newErrors[field] && (
          newErrors[field].includes('Occupation category') ||
          newErrors[field].includes('Institution') ||
          newErrors[field].includes('category is required')
      )) {
        delete newErrors[field];
      }
    });
    
    // Add new govt servant errors
    Object.keys(govtServantErrors).forEach(key => {
      if (govtServantErrors[key]) {
        newErrors[key] = govtServantErrors[key];
      }
    });

    // Special handling for institution fields when "Other" is selected
    if (formData.category_id && parseInt(formData.category_id) !== 4) {
      if (formData.institution_id === '0') {
        // When "Other" is selected, institution_name should clear institution_id error
        if (formData.institution_name && formData.institution_name.trim()) {
          delete newErrors.institution_id;
          delete newErrors.institution_name;
        }
      } else if (formData.institution_id && formData.institution_id !== '0') {
        // When a valid institution is selected, clear both errors
        delete newErrors.institution_id;
        delete newErrors.institution_name;
      }
    }

    // Update errors state - only if there are actual changes
    if (JSON.stringify(errors) !== JSON.stringify(newErrors)) {
      setErrors(newErrors);
    }
    
  }, [
    open, 
    formData.is_govt_servant,
    formData.is_ais_officer,
    formData.is_alive,
    formData.relation_id,
    formData.spouse_status,
    formData.category_id,
    formData.institution_id,
    formData.institution_name,
    formData.dob,
    formData.email_id,
    formData.mobile_number,
    formData.death_date,
    formData.divorce_date,
    formData.child_type,
    formData.spouse_id,
    validateGovtServantFields, 
    existingDeathCertificateId, 
    existingDivorceDocumentId,
    availableSpouses.length,
    errors,
    formData.first_name,
    formData.last_name,
    formData.gender_id
  ]);

  // Update the useEffect to initialize document IDs and restrictions
  useEffect(() => {
    const status = sessionStorage.getItem('profile_status');
    setProfileStatus(status);

    if (open) {
      setIsVerified(false);
      setUserUpdatedFields(new Set());
      setShowDobVerification(false);
      setTempFetchedData(null);
      setVerificationDob('');
      setErrors({}); // Clear all errors
      setOriginalSparkData({});
      setDeathCertificateFile(null);
      setMarriageCertificateFile(null);
      setDivorceDocumentFile(null);
      setIsUploading(false);
      setExistingCurrentSpouse(null);
      
      // Reset existing document IDs
      setExistingDeathCertificateId(null);
      setExistingMarriageCertificateId(null);
      setExistingDivorceDocumentId(null);
      
      // Reset restriction states
      setIsRelationChangeRestricted(false);
      setIsSpouseStatusChangeRestricted(false);
      setIsSpouseLinkedToChild(false);
      setLinkedChildren([]);
      setOriginalRelationId('');
      setOriginalSpouseStatus('');

      // Get available spouses (only saved ones, excluding unsaved spark entries)
     const allSpouses = dependentDetailsList.filter(dep => {
  const relName = getMasterValue(dep.relation_id, 'relation_id');
  return (relName === 'Spouse' || dep.relation === 'Current Spouse' || 
          dep.relation === 'Divorced Spouse' || dep.relation === 'Deceased Spouse') &&
         !dep.ais_fam_id.toString().startsWith('spark_');
});
setAvailableSpouses(allSpouses);

      // Find existing current spouse
      const currentSpouse = allSpouses.find(spouse => 
        (spouse.relation === 'Current Spouse' || 
         (getMasterValue(spouse.relation_id, 'relation_id') === 'Spouse' && 
          spouse.removing_reason !== '1' && 
          spouse.is_alive !== false))
      );
      setExistingCurrentSpouse(currentSpouse);

      console.log('Modal opening with dependentDetails:', dependentDetails);
      console.log('Document IDs in dependent:', {
        death_certificate: dependentDetails?.death_certificate,
        marriage_certificate_proof: dependentDetails?.marriage_certificate_proof,
        sup_doc_for_remv: dependentDetails?.sup_doc_for_remv
      });

      if (dependentDetails && dependentDetails.ais_fam_id) {
        // Store original values for restriction checks
        const originalRelation = dependentDetails.relation_id?.toString() || '';
        setOriginalRelationId(originalRelation);
        
        // Determine original spouse status
        let originalSpouseStatusValue = 'current';
        const relationId = Number(dependentDetails.relation_id);
        const isSpouse = relationId === masterData.relationship?.find(r => r.rel_status_name === 'Spouse')?.rel_status_id;
        
        if (isSpouse) {
          if (dependentDetails.removing_reason === '1' || dependentDetails.removing_reason === 1) {
            originalSpouseStatusValue = 'divorced';
          } 
          else if (dependentDetails.is_alive === false || dependentDetails.is_alive === 'false') {
            originalSpouseStatusValue = 'deceased';
          }
          else if (dependentDetails.death_date || dependentDetails.death_certificate) {
            originalSpouseStatusValue = 'deceased';
          }
          else if (dependentDetails.divorce_date || dependentDetails.sup_doc_for_remv) {
            originalSpouseStatusValue = 'divorced';
          }
        }
        setOriginalSpouseStatus(originalSpouseStatusValue);
        
        // Check if spouse is linked to any child
        if (isSpouse) {
          checkSpouseLinkedToChild(dependentDetails.ais_fam_id);
        }

        // Store existing document IDs
        if (dependentDetails.death_certificate) {
          setExistingDeathCertificateId(dependentDetails.death_certificate);
        }
        if (dependentDetails.marriage_certificate_proof) {
          setExistingMarriageCertificateId(dependentDetails.marriage_certificate_proof);
        }
        if (dependentDetails.sup_doc_for_remv) {
          setExistingDivorceDocumentId(dependentDetails.sup_doc_for_remv);
        }

        const isFromSpark = dependentDetails.fromSpark;
        const isSavedSpouse = !dependentDetails.ais_fam_id.toString().startsWith('spark_');
        const verifiedFields = dependentDetails.is_ais_officer && dependentDetails.user_id
          ? new Set(['first_name', 'last_name', 'dob', 'email_id', 'mobile_number', 'gender_id'])
          : new Set();

        // Capture original SPARK name values
        const sparkFirst = (dependentDetails.sourceMap?.first_name === 'DB_SPARK_API' ||
          dependentDetails.sourceMap?.first_name === 'SPARK')
          ? dependentDetails.first_name : '';
        const sparkLast = (dependentDetails.sourceMap?.last_name === 'DB_SPARK_API' ||
          dependentDetails.sourceMap?.last_name === 'SPARK')
          ? dependentDetails.last_name : '';
        setOriginalSparkData({ first_name: sparkFirst, last_name: sparkLast });

        // Determine spouse status - use actual data from the dependent
        let spouse_status = originalSpouseStatusValue;

        console.log('Determined spouse_status:', spouse_status, 'for dependent:', {
          removing_reason: dependentDetails.removing_reason,
          is_alive: dependentDetails.is_alive,
          death_date: dependentDetails.death_date,
          divorce_date: dependentDetails.divorce_date,
          relation_id: dependentDetails.relation_id
        });

        // For non-spouse deceased persons
        let is_alive = true;
        if (dependentDetails.is_alive === false || dependentDetails.is_alive === 'false' || dependentDetails.death_date) {
          is_alive = false;
        }

        // For child relations, ensure we have child_type
        let child_type = dependentDetails.child_type || '';
        if (isSpouse === false && relationId === masterData.relationship?.find(r => r.rel_status_name === 'Child')?.rel_status_id) {
          // Try to determine child_type from relation name if not set
          if (!child_type && dependentDetails.relation) {
            const childTypeMap = {
              'Son': '1',
              'Daughter': '2',
              'Step Son': '3',
              'Step Daughter': '4'
            };
            child_type = childTypeMap[dependentDetails.relation] || child_type;
          }
        }

        // Determine spouse_id for children
       let spouse_id = '';
if (dependentDetails && isSpouse === false && relationId === masterData.relationship?.find(r => r.rel_status_name === 'Child')?.rel_status_id) {
  // For children, check if any spouse exists in father_id or mother_id
  const fatherId = dependentDetails.father_id ? dependentDetails.father_id.toString() : null;
  const motherId = dependentDetails.mother_id ? dependentDetails.mother_id.toString() : null;
  
  console.log('Child parent IDs (string):', {
    father_id: fatherId,
    mother_id: motherId,
    availableSpouses: allSpouses.map(s => s.ais_fam_id?.toString())
  });
  
  // Check if father_id exists in availableSpouses (compare as strings)
  if (fatherId) {
    const fatherSpouse = allSpouses.find(s => 
      s.ais_fam_id?.toString() === fatherId
    );
    if (fatherSpouse) {
      spouse_id = fatherId;
      console.log('Found father as spouse:', fatherSpouse);
    }
  }
  
  // Check if mother_id exists in availableSpouses (if father wasn't found)
  if (!spouse_id && motherId) {
    const motherSpouse = allSpouses.find(s => 
      s.ais_fam_id?.toString() === motherId
    );
    if (motherSpouse) {
      spouse_id = motherId;
      console.log('Found mother as spouse:', motherSpouse);
    }
  }
  
  // If still not found, check spouse_id directly
  if (!spouse_id && dependentDetails.spouse_id) {
    spouse_id = dependentDetails.spouse_id.toString();
  }
  
  console.log('Final spouse_id for child:', spouse_id);
}

        const updatedForm = {
  ...initialFormData,
  ...dependentDetails,
  is_govt_servant: dependentDetails.is_govt_servant === 'true' || dependentDetails.is_govt_servant === true,
  is_ais_officer: dependentDetails.is_ais_officer === 'true' || dependentDetails.is_ais_officer === true,
  user_id: dependentDetails.user_id || dependentDetails.ais_fam_id,
  manualEntry: true,
  spouse_id: spouse_id, // Use the determined spouse_id
  verifiedFields,
  relation_id: dependentDetails.relation_id?.toString() || '',
  sourceMap: dependentDetails.sourceMap || {},
  is_alive: is_alive,
  death_date: dependentDetails.death_date || '',
  death_certificate: dependentDetails.death_certificate || null,
  child_type: child_type,
  spouse_history: dependentDetails.spouse_history || [],
  removing_reason: spouse_status === 'divorced' ? '1' : 
                  spouse_status === 'deceased' ? '2' : '0',
  sup_doc_for_remv: dependentDetails.sup_doc_for_remv || null,
  marriage_certificate_proof: dependentDetails.marriage_certificate_proof || null,
  divorce_date: dependentDetails.divorce_date || '',
  spouse_status, // Set the determined status
  showChildFields: relationId === masterData.relationship?.find(r => r.rel_status_name === 'Child')?.rel_status_id,
};

        console.log('Updated form data for edit:', updatedForm);

        // Auto-set gender based on child type if not set
        if (updatedForm.relation_id === '2' && updatedForm.child_type && !updatedForm.gender_id) {
          if (updatedForm.child_type === '1' || updatedForm.child_type === '3') {
            updatedForm.gender_id = '1'; // Male for Son/Step Son
          } else if (updatedForm.child_type === '2' || updatedForm.child_type === '4') {
            updatedForm.gender_id = '2'; // Female for Daughter/Step Daughter
          }
        }

        const sparkKeys = Object.keys(dependentDetails.sourceMap || {}).filter(
          k => dependentDetails.sourceMap[k] === 'DB_SPARK_API' || dependentDetails.sourceMap[k] === 'SPARK'
        );
        setSparkFields(new Set(sparkKeys));

        if (isFromSpark) {
          setSparkFields(prev => new Set([...prev, 'first_name', 'last_name', 'relation_id']));
          setUserUpdatedFields(new Set(['relation_id']));
        }

        // Handle institution mapping
        if (dependentDetails.institution_name && !dependentDetails.institution_id) {
          const matchingInst = masterData.institution.find(
            i => i.institution_name.toLowerCase() === dependentDetails.institution_name.toLowerCase()
          );
          if (matchingInst) {
            updatedForm.institution_id = matchingInst.institution_id.toString();
            updatedForm.category_id = matchingInst.category_id?.toString();
          } else {
            updatedForm.institution_id = '0';
            updatedForm.category_id = dependentDetails.category_id || '4';
          }
        }
        
        // If institution_id exists but not in form, set it
        if (dependentDetails.institution_id && !updatedForm.institution_id) {
          updatedForm.institution_id = dependentDetails.institution_id.toString();
        }
        
        // If category_id exists but not in form, set it
        if (dependentDetails.category_id && !updatedForm.category_id) {
          updatedForm.category_id = dependentDetails.category_id.toString();
        }
        
        if (updatedForm.is_ais_officer) updatedForm.is_govt_servant = true;

        setFormData(updatedForm);
        setIsVerified(dependentDetails.is_ais_officer && dependentDetails.user_id);
      } else {
        console.log('Setting initial form data for new dependent');
        setFormData({
          ...initialFormData,
          // Set initial children count
          showChildFields: false,
        });
        setSparkFields(new Set());
        const children = dependentDetailsList?.filter(dep => {
          const relName = getMasterValue(dep.relation_id, 'relation_id');
          return relName === 'Child';
        }) || [];
        setChildrenCount(children.length);
        console.log('Children count:', children.length);
      }
      
      // Reset the ref when modal opens
      hasCheckedSpouseRef.current = false;
    }
  }, [open, dependentDetails, dependentDetailsList, masterData.institution, masterData.relationship, checkSpouseLinkedToChild]);

  const calculateAge = (dob, referenceDate) => {
    const birthDate = new Date(dob);
    const refDate = new Date(referenceDate);
    let age = refDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = refDate.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && refDate.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const validateDob = newFormData => {
    // For divorced spouses, DOB is not required
    if (newFormData.relation_id === '1' && newFormData.spouse_status === 'divorced') {
      return '';
    }
    
    // For deceased persons, DOB is not required
    if (!newFormData.is_alive) {
      return '';
    }
    
    //if (!newFormData.dob) return 'DOB is required for alive persons.';
    
    const dependentDob = new Date(newFormData.dob);
    if (isNaN(dependentDob.getTime())) return 'Invalid date.';
    const currentDate = new Date();
    const userDobDate = new Date(userDob);
    const depAge = calculateAge(newFormData.dob, currentDate);
    const userAge = calculateAge(userDob, currentDate);
    let error = '';
    if (dependentDob > currentDate) error = 'DOB cannot be in the future.';
    else if (depAge > 120) error = 'Unreasonable age: over 120 years old.';

    const relation = Number(newFormData.relation_id);
    if (relation === 3 || relation === 4) {
      if (dependentDob >= userDobDate) error = "Parent's DOB must be before your DOB.";
      else {
        const parentAgeAtBirth = calculateAge(newFormData.dob, userDob);
        const minAge = relation === 3 ? 18 : 15;
        const maxAge = relation === 3 ? 60 : 45;
        if (parentAgeAtBirth < minAge)
          error = `Parent was too young at your birth (must be at least ${minAge}).`;
        else if (parentAgeAtBirth > maxAge)
          error = `Parent was too old at your birth (over ${maxAge}).`;
      }
    } else if (relation === 2) {
      if (dependentDob <= userDobDate) error = "Child's DOB must be after your DOB.";
      else {
        const userAgeAtBirth = calculateAge(userDob, newFormData.dob);
        if (userAgeAtBirth < 18) error = 'You were too young at child\'s birth (must be at least 18).';
        else if (userAgeAtBirth > 60) error = 'You were too old at child\'s birth (over 60).';
      }
    } else if (relation === 1 && newFormData.spouse_status === 'current') {
      const ageDiff = Math.abs(depAge - userAge);
      if (depAge < 18) error = 'Spouse must be at least 18 years old.';
      else if (ageDiff > 50) error = 'Unreasonable age difference with spouse (over 50 years).';
    }
    if (!error && newFormData.is_govt_servant && depAge < 18)
      error = 'Government servants must be at least 18 years old.';
    return error;
  };

  const handleDeathCertificateChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    setDeathCertificateFile(file);
    setIsUploading(true);
    try {
      const userId = sessionStorage.getItem('user_id');
      const documentId = await uploadDocument(file, 'Death-Certificate', userId);
      
      // Update form data with new document ID
      setFormData(prev => ({ 
        ...prev, 
        death_certificate: documentId 
      }));
      
      // Clear the existing ID since we have a new one
      setExistingDeathCertificateId(null);
      
      // IMPORTANT: Clear the death certificate error
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.death_certificate;
        return newErrors;
      });
      
      toast.success('Death certificate uploaded successfully');
    } catch (error) {
      console.error('Death cert upload error:', error);
      toast.error('Failed to upload death certificate');
      setDeathCertificateFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDivorceDocumentChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    setDivorceDocumentFile(file);
    setIsUploading(true);
    try {
      const userId = sessionStorage.getItem('user_id');
      const documentId = await uploadDocument(file, 'Divorce-Document', userId);
      
      // Update form data with new document ID
      setFormData(prev => ({ 
        ...prev, 
        sup_doc_for_remv: documentId 
      }));
      
      // Clear the existing ID since we have a new one
      setExistingDivorceDocumentId(null);
      
      // Clear divorce document error
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.sup_doc_for_remv;
        return newErrors;
      });
      
      toast.success('Divorce document uploaded successfully');
    } catch (error) {
      console.error('Divorce doc upload error:', error);
      toast.error('Failed to upload divorce document');
      setDivorceDocumentFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMarriageCertificateChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    setMarriageCertificateFile(file);
    setIsUploading(true);
    try {
      const userId = sessionStorage.getItem('user_id');
      const documentId = await uploadDocument(file, 'Marriage-Certificate', userId);
      
      // Update form data with new document ID
      setFormData(prev => ({ 
        ...prev, 
        marriage_certificate_proof: documentId 
      }));
      
      // Clear the existing ID since we have a new one
      setExistingMarriageCertificateId(null);
      
      toast.success('Marriage certificate uploaded successfully');
    } catch (error) {
      console.error('Marriage cert upload error:', error);
      toast.error('Failed to upload marriage certificate');
      setMarriageCertificateFile(null);
    } finally {
      setIsUploading(false);
    }
  };

 const validateMobileNumber = (mobileNumber) => {
    // Check if the input is effectively empty
    if (!mobileNumber || !mobileNumber.trim()) return '';
    
    // Remove all non-digit characters
    const cleaned = mobileNumber.replace(/\D/g, '');
    
    // If empty after cleaning (only non-digits were entered including spaces)
    if (cleaned.length === 0) {
        return '';
    }
    
    // Check length
    if (cleaned.length < 10) {
        return `Mobile number must be 10 digits (you entered ${cleaned.length} digit${cleaned.length !== 1 ? 's' : ''})`;
    } else if (cleaned.length > 10) {
        return `Mobile number must be exactly 10 digits (you entered ${cleaned.length} digits)`;
    }
    
    // Check if it starts with valid Indian mobile prefix
    const firstDigit = cleaned.charAt(0);
    if (!['6', '7', '8', '9'].includes(firstDigit)) {
        return 'Indian mobile number must start with 6, 7, 8, or 9';
    }
    
    // Check if it's all the same digit
    if (/^(\d)\1+$/.test(cleaned)) {
        return 'Invalid mobile number pattern';
    }
    
    return '';
};

  const handleChange = e => {
    const { name, value, type } = e.target;
    
    // Check for relation change restriction
    if (name === 'relation_id') {
      const isRestricted = checkRelationChangeRestriction(value, originalRelationId);
      if (isRestricted) {
        toast.error('Cannot change relation type for an existing dependent. Please remove this and add as new.');
        return;
      }
      setIsRelationChangeRestricted(false);
    }
    
    // Check for spouse status change restriction
    if (name === 'spouse_status') {
      const isRestricted = checkSpouseStatusChangeRestriction(value, originalSpouseStatus);
      if (isRestricted) {
        toast.error('Cannot change deceased spouse to other status.');
        return;
      }
      setIsSpouseStatusChangeRestricted(false);
    }
    
    setFormData(prevState => {
      let updatedData = {
        ...prevState,
        [name]: type === 'radio' ? (value === 'true') : value,
      };
      setUserUpdatedFields(prev => new Set([...prev, name]));

      if (name === 'relation_id') {
        const relName = masterData.relationship.find(r => r.rel_status_id === Number(value))?.rel_status_name;
        console.log('Relation changed to:', relName, 'value:', value);
        
        // Initialize updatedData first
        updatedData = {
          ...updatedData,
          relation_id: value,
        };
        
        if (relName === 'Spouse') {
          // Only check for existing current spouse when adding NEW spouse (not editing)
          if (!dependentDetails) {
            const currentSpouse = dependentDetailsList.find(d => {
              const dRelName = getMasterValue(d.relation_id, 'relation_id');
              return dRelName === 'Spouse' && 
                     d.removing_reason !== '1' && 
                     d.is_alive !== false &&
                     !d.ais_fam_id.toString().startsWith('spark_')
            });
            
            if (currentSpouse) {
              // Auto-set to divorced for new spouse when current already exists
              updatedData = {
                ...updatedData,
                spouse_status: 'divorced',
                is_alive: true,
                removing_reason: '1',
                // Clear fields not needed for divorced spouse
                email_id: '',
                mobile_number: '',
                dob: '',
                is_govt_servant: false,
                is_ais_officer: false,
                category_id: '',
                institution_name: '',
              };
              
              // Show toast once after state update
              setTimeout(() => {
                toast.info('A current spouse already exists. You can add this as a divorced spouse.');
              }, 0);
            } else {
              // No current spouse exists, set to current
              updatedData = {
                ...updatedData,
                spouse_status: 'current',
                is_alive: true,
                removing_reason: '0',
              };
            }
          } else {
            // Editing existing spouse, keep existing status
            updatedData = {
              ...updatedData,
              spouse_status: formData.spouse_status || 'current',
            };
          }
        } else {
          // Not a spouse relation
          updatedData = {
            ...updatedData,
            spouse_status: undefined,
          };
        }
        
        if (relName === 'Child') {
          /*if (childrenCount >= 2) {
            toast.warn('Only 2 children can be added.');
            return prevState;
          }*/
         updatedData.showChildFields = false;
          updatedData.child_type = '';
          updatedData.spouse_id = '';
        } else {
          updatedData.showChildFields = false;
          updatedData.child_type = '';
          updatedData.spouse_id = '';
        }
        
        let newGenderId = '';
        if (relName === 'Father') newGenderId = '1';
        else if (relName === 'Mother') newGenderId = '2';
        
        // Update gender and other fields
        updatedData = {
          ...updatedData,
          gender_id: newGenderId || updatedData.gender_id,
          spouse_id: '',
          is_alive: relName === 'Spouse' ? updatedData.is_alive : true,
        };
        
        // Clear child-specific fields if not a child
        if (relName !== 'Child') {
          updatedData.child_type = '';
          updatedData.spouse_id = '';
        }
      }

      if (name === 'child_type') {
        console.log('Child type changed to:', value);
        if (formData.relation_id === '2') {
          if (value === '1' || value === '3') {
            updatedData.gender_id = '1';
          } else if (value === '2' || value === '4') {
            updatedData.gender_id = '2';
          } else {
            updatedData.gender_id = '';
          }
        }
      }

      if (name === 'spouse_status') {
        console.log('Spouse status changed to:', value);
        updatedData.spouse_status = value;
        if (value === 'divorced') {
          updatedData.is_alive = true;
          updatedData.removing_reason = '1';
          updatedData.death_date = '';
          updatedData.death_certificate = null;
          setDeathCertificateFile(null);
          // Clear govt servant fields for divorced spouse
          updatedData.is_govt_servant = false;
          updatedData.is_ais_officer = false;
          updatedData.category_id = '';
          updatedData.institution_id = '';
          updatedData.institution_name = '';
        } else if (value === 'deceased') {
          updatedData.is_alive = false;
          updatedData.removing_reason = '2';
          updatedData.divorce_date = '';
          updatedData.sup_doc_for_remv = null;
          setDivorceDocumentFile(null);

          updatedData.is_govt_servant = false;
          updatedData.is_ais_officer = false;
          updatedData.category_id = '';
          updatedData.institution_id = '';
          updatedData.institution_name = '';
        } else {
          updatedData.is_alive = true;
          updatedData.removing_reason = '0';
          updatedData.divorce_date = '';
          updatedData.sup_doc_for_remv = null;
          updatedData.death_date = '';
          updatedData.death_certificate = null;
          setDeathCertificateFile(null);
          setDivorceDocumentFile(null);
        }
      }

      if (name === 'is_ais_officer') {
        const yes = value === 'true';
        if (yes) {
          updatedData.is_govt_servant = true;
          updatedData.manualEntry = false;
          updatedData.category_id = '';
          updatedData.institution_id = '';
          updatedData.institution_name = '';
          updatedData.aisNumber = '';
          updatedData.user_id = null;
          updatedData.verifiedFields = new Set();
          setIsVerified(false);
          setShowDobVerification(false);
          setVerificationDob('');
          setTempFetchedData(null);
        } else {
          resetAisVerification({
            setFormData,
            setIsVerified,
            setShowDobVerification,
            setVerificationDob,
            setTempFetchedData,
            setSparkFields,
            setUserUpdatedFields,
            originalSparkData,
          });
          updatedData.manualEntry = true;
          updatedData.is_govt_servant = false;
        }
        updatedData.aisNumber = '';
        updatedData.user_id = null;
        updatedData.verifiedFields = new Set();
        setIsVerified(false);
      }

      if (name === 'is_govt_servant') {
        const yes = value === 'true';
        if (!yes) {
          updatedData.category_id = '';
          updatedData.institution_id = '';
          updatedData.institution_name = '';
          updatedData.is_ais_officer = false;
          updatedData.aisNumber = '';
          updatedData.user_id = null;
          updatedData.manualEntry = true;
          updatedData.verifiedFields = new Set();
          setIsVerified(false);
          resetAisVerification({
            setFormData,
            setIsVerified,
            setShowDobVerification,
            setVerificationDob,
            setTempFetchedData,
            setSparkFields,
            setUserUpdatedFields,
            originalSparkData,
          });
        }
      }

     if (name === 'category_id') {
  updatedData.institution_id = '';
  updatedData.institution_name = '';
  
  // Clear category_id error if it was set
  if (errors.category_id) {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.category_id;
      return newErrors;
    });
  }
}
      
     if (name === 'institution_id') {
  if (value === '0') {
    updatedData.institution_name = '';
    // When selecting "Other", clear institution_id error but show institution_name as required
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.institution_id; // Clear "Institution is required" error
      return newErrors;
    });
  } else {
    const instName = masterData.institution.find(i => i.institution_id === parseInt(value))?.institution_name || '';
    updatedData.institution_name = instName;
    // When selecting a valid institution, clear both errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.institution_id;
      delete newErrors.institution_name;
      return newErrors;
    });
  }
}
// Add this after the existing handleChange logic
if (name === 'institution_name') {
  // When user types in institution_name, clear the error if present
  if (errors.institution_name) {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.institution_name;
      return newErrors;
    });
  }
}

      // Add error clearing for death date
      if (name === 'death_date') {
        // Clear death date error when user enters a value
        if (errors.death_date) {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.death_date;
            return newErrors;
          });
        }
      }

      if (name === 'divorce_date') {
        // Clear divorce date error when user enters a value
        if (errors.divorce_date) {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.divorce_date;
            return newErrors;
          });
        }
      }

      if (name === 'gender_id') {
        // Clear gender error when user selects a value
        if (errors.gender_id) {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.gender_id;
            return newErrors;
          });
        }
      }

      return updatedData;
    });
  };

  const handleVerifyAIS = async () => {
    if (!formData.aisNumber) {
      toast.warn('Please enter an KARMASRI Id or PEN!');
      return;
    }
    try {
      const response = await axiosInstance.get(`/officer/user-data-pen/${formData.aisNumber.trim()}`);
      if (response.data.success) {
        const fetched = response.data.data.user;
        if (!fetched?.id) {
          toast.error('No data found for the provided AIS Number/PEN.');
          setShowDobVerification(false);
          setFormData(prev => ({ ...prev, manualEntry: true, verifiedFields: new Set() }));
          return;
        }
        const loggedInUserId = sessionStorage.getItem('user_id');
        const newUserId = fetched.id?.toString();
        if (newUserId === loggedInUserId) {
          toast.warn('Cannot add yourself as a dependent.');
          setShowDobVerification(false);
          setFormData(prev => ({ ...prev, manualEntry: true, verifiedFields: new Set() }));
          return;
        }
        const alreadyExists = dependentDetailsList.some(dep => 
          dep?.user_id?.toString() === newUserId && 
          !dep.ais_fam_id.toString().startsWith('spark_')
        );
        if (alreadyExists) {
          toast.warn('This person is already added as a dependent.');
          setShowDobVerification(false);
          setFormData(prev => ({ ...prev, manualEntry: true, verifiedFields: new Set() }));
          return;
        }

        setTempFetchedData(fetched);
        setShowDobVerification(true);
        toast.info('Please enter DOB for verification.');
      } else {
        toast.error('Details not found in the system. Please enter manually.');
        setShowDobVerification(false);
        setFormData(prev => ({ ...prev, manualEntry: true, verifiedFields: new Set() }));
      }
    } catch (err) {
      console.error('Error fetching details:', err);
      toast.error('Failed to verify. Please enter manually.');
      setShowDobVerification(false);
      setFormData(prev => ({ ...prev, manualEntry: true, verifiedFields: new Set() }));
    }
  };

  const handleDobConfirm = () => {
    if (!verificationDob) {
      toast.warn('Please enter DOB for verification.');
      return;
    }
    if (verificationDob === tempFetchedData.dob) {
      const verified = new Set(['first_name', 'last_name', 'dob', 'email_id', 'mobile_number', 'gender_id']);
      setFormData(prev => ({
        ...prev,
        first_name: tempFetchedData.first_name || '',
        last_name: tempFetchedData.last_name || '',
        dob: tempFetchedData.dob || '',
        email_id: tempFetchedData.email || '',
        mobile_number: tempFetchedData.mobile_no || '',
        gender_id: tempFetchedData.gender_id || '',
        user_id: tempFetchedData.id || null,
        manualEntry: true,
        verifiedFields: verified,
      }));
      setSparkFields(new Set());
      setUserUpdatedFields(new Set(['first_name', 'last_name', 'dob', 'email_id', 'mobile_number', 'gender_id']));
      setIsVerified(true);
      setShowDobVerification(false);
      setVerificationDob('');
      setTempFetchedData(null);
      toast.success('DOB verified. Details populated successfully!');
    } else {
      toast.error('DOB does not match. Please try again or enter manually.');
      setVerificationDob('');
    }
  };

  const handleManualEntry = () => {
    setFormData(prev => ({
      ...prev,
      manualEntry: true,
      first_name: originalSparkData.first_name || '',
      last_name: originalSparkData.last_name || '',
      dob: '',
      email_id: '',
      mobile_number: '',
      gender_id: '',
      user_id: null,
      verifiedFields: new Set(),
    }));
    setIsVerified(false);
    setSparkFields(prev => {
      const next = new Set(prev);
      if (originalSparkData.first_name) next.add('first_name');
      if (originalSparkData.last_name) next.add('last_name');
      return next;
    });
    setUserUpdatedFields(new Set());
    setShowDobVerification(false);
    setTempFetchedData(null);
    setVerificationDob('');
  };

  const getMasterValue = (id, key) => {
    if (!id || !key || !masterData.relationship.length) return 'Not Specified';
    if (key === 'relation_id') {
      const match = masterData.relationship.find((rel) => rel.rel_status_id === Number(id));
      return match ? match.rel_status_name : 'Not Specified';
    }
    return 'Not Specified';

    
  };

  const validateMandatory = () => {
  const newErrors = {};
  
  mandatoryFields.forEach(field => {
    const value = formData[field];
    if (field === 'gender_id') {
      // Special handling for gender - check if it's truly empty
      const genderValue = formData.gender_id;
      if (!genderValue || genderValue.toString().trim() === '' || genderValue.toString().trim() === '0') {
        newErrors[field] = 'This field is required.';
      }
    } else if (!value || (typeof value === 'string' && value.trim() === '')) {
      newErrors[field] = 'This field is required.';
    }
  });

  // Check if this is a deceased spouse specifically
  const isDeceasedSpouse = formData.relation_id === '1' && formData.spouse_status === 'deceased';
  const isNonSpouseDeceased = formData.relation_id !== '1' && formData.is_alive === false;
  
  // For deceased persons (spouse or non-spouse), email/mobile/dob are NOT required
  if (isDeceasedSpouse || isNonSpouseDeceased) {
    // Only Date of Death and Death Certificate are required for deceased persons
    if (!formData.death_date) {
      newErrors.death_date = 'Date Of Death is required for deceased persons.';
    }
    if (!formData.death_certificate && !existingDeathCertificateId) {
      newErrors.death_certificate = 'Death certificate is required for deceased persons.';
    }
    
    // Clear any errors for email/mobile/dob since they're not required
    delete newErrors.email_id;
    delete newErrors.mobile_number;
    delete newErrors.dob;
  } else {
    // For alive persons (except divorced spouses)
  /*  if (formData.relation_id !== '1' || formData.spouse_status !== 'divorced') {
      // These fields are required for alive persons
      if (!formData.dob) {
        newErrors.dob = 'DOB is required for alive persons.';
      }
      
      if ((formData.relation_id === '1' && formData.spouse_status === 'current') || 
          (formData.relation_id !== '1')) {
        if (!formData.email_id) {
          newErrors.email_id = 'Email is required for alive persons.';
        }
        if (!formData.mobile_number) {
          newErrors.mobile_number = 'Mobile number is required for alive persons.';
        }
      }
    }*/
  }

  // Spouse specific validations
  if (formData.relation_id === '1') {
    if (formData.spouse_status === 'deceased') {
      if (!formData.death_date) {
        newErrors.death_date = 'Date Of Death is required for deceased spouse.';
      }
      if (!formData.death_certificate && !existingDeathCertificateId) {
        newErrors.death_certificate = 'Death certificate is required for deceased spouse.';
      }
      // Don't require divorce fields for deceased spouse
    } else if (formData.spouse_status === 'divorced') {
      if (!formData.divorce_date) {
        newErrors.divorce_date = 'Divorce date is required for divorced spouse.';
      }
      if (!formData.sup_doc_for_remv && !existingDivorceDocumentId) {
        newErrors.sup_doc_for_remv = 'Divorce document is required for divorced spouse.';
      }
      // Don't require death fields for divorced spouse
    }
  }

  // Child specific validation
  if (formData.relation_id === '2') {
    if (!formData.child_type) {
      newErrors.child_type = 'Child type is required.';
    }
    if (availableSpouses.length > 0 && !formData.spouse_id) {
      newErrors.spouse_id = 'Please select spouse for child.';
    }
    if (availableSpouses.length === 0) {
      toast.error('Please add and save a spouse first before adding child.');
      return false;
    }
  }

  // DOB validation if present
  if (formData.dob) {
    const dobError = validateDob(formData);
    if (dobError) newErrors.dob = dobError;
  }

  // Validate govt servant fields
  const govtServantErrors = validateGovtServantFields(formData);
  Object.keys(govtServantErrors).forEach(key => {
    newErrors[key] = govtServantErrors[key];
  });

  // Check if there are any errors
  const hasErrors = Object.keys(newErrors).length > 0;
  
  if (hasErrors) {
    // Update errors state
    setErrors(newErrors);
    return false;
  }
  
  return true;
};
 
 const handleSubmit = async e => {
  e.preventDefault();

  if (isUploading) {
    toast.warn('Please wait for document upload to complete');
    return;
  }
  
  // Check for restriction violations before submission
  if (dependentDetails?.ais_fam_id && !dependentDetails.ais_fam_id.toString().startsWith('spark_')) {
    // Check relation change restriction
    if (formData.relation_id !== originalRelationId) {
      toast.error('Cannot change relation type for an existing dependent. Please remove this and add as new.');
      return;
    }
    
    // Check spouse status change restriction
    if (originalSpouseStatus === 'deceased' && formData.spouse_status !== originalSpouseStatus) {
      toast.error('Cannot change deceased spouse to other status.');
      return;
    }
  }
  
  console.log('Form validation errors:', errors);
  console.log('Form data for deceased spouse:', {
    relation_id: formData.relation_id,
    spouse_status: formData.spouse_status,
    is_alive: formData.is_alive,
    death_date: formData.death_date,
    death_certificate: formData.death_certificate,
    existingDeathCertificateId
  });
  if (!validateMandatory()) {
    console.log('validateMandatory returned false');
    toast.error('Please fill all required fields.');
    return;
  }

  // Check if there are any validation errors in the current state
  const hasErrors = Object.values(errors).some(err => err && err !== '');
  if (hasErrors) {
      console.log('Current errors found:', errors);
    toast.error('Please fix the errors before saving.');
    return;
  }

  // For new current spouse, check if existing current spouse needs to be marked as divorced
  if (formData.relation_id === '1' && 
      formData.spouse_status === 'current' && 
      existingCurrentSpouse && 
      (!dependentDetails || dependentDetails.ais_fam_id !== existingCurrentSpouse.ais_fam_id)) {
    if (!window.confirm(`You already have a current spouse (${existingCurrentSpouse.first_name} ${existingCurrentSpouse.last_name}). Adding a new current spouse will mark the existing one as divorced. Continue?`)) {
      return;
    }
  }

  const spark_data = {};
  const user_data = {};

  // Helper to check if a value should be included
  const shouldInclude = (value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    return true;
  };

  // Helper to convert values
  const convertValue = (key, value) => {
    if (!shouldInclude(value)) return undefined;

    // Integer fields
    const intFields = ['category_id', 'spouse_id', 'child_type', 'place_of_domicile_id', 
                      'father_id', 'mother_id', 'gender_id', 'relation_id', 'removing_reason', 'user_id'];
    if (intFields.includes(key)) {
      if (typeof value === 'string') {
        const num = parseInt(value.trim());
        return isNaN(num) ? undefined : num;
      }
      return Number.isInteger(value) ? value : undefined;
    }

    // Boolean fields - only include if explicitly true/false
    const boolFields = ['is_ais_officer', 'is_govt_servant', 'pwd_status', 'is_alive'];
    if (boolFields.includes(key)) {
      if (typeof value === 'string') {
        return value === 'true' ? true : (value === 'false' ? false : undefined);
      }
      return typeof value === 'boolean' ? value : undefined;
    }

    // Date fields - only include if valid date string
    const dateFields = ['dob', 'death_date', 'divorce_date'];
    if (dateFields.includes(key) && typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed ? trimmed : undefined;
    }

    // String fields - trim and include only if not empty
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed ? trimmed : undefined;
    }

    // Document fields - include existing IDs if no new file was uploaded
    const documentFields = ['death_certificate', 'marriage_certificate_proof', 'sup_doc_for_remv'];
    if (documentFields.includes(key)) {
      // If we have a new document ID, use it
      if (value) {
        return value;
      }
      // Otherwise check if we have an existing document ID
      const existingId = {
        'death_certificate': existingDeathCertificateId,
        'marriage_certificate_proof': existingMarriageCertificateId,
        'sup_doc_for_remv': existingDivorceDocumentId
      }[key];
      
      return existingId || undefined;
    }

    // Special handling for spouse_history - only include if it has content
    if (key === 'spouse_history') {
      if (Array.isArray(value) && value.length > 0) {
        return JSON.stringify(value);
      }
      if (typeof value === 'string' && value !== '[]') {
        return value;
      }
      return undefined;
    }

    return value;
  };

  // CRITICAL FIX: Only first_name and last_name should be in spark_data if from SPARK
  // All other fields should go to user_data
  
  // Process first_name and last_name for spark_data ONLY if they are from SPARK
  if (sparkFields.has('first_name') && !userUpdatedFields.has('first_name')) {
    const converted = convertValue('first_name', formData.first_name);
    if (converted !== undefined) {
      spark_data.first_name = converted;
    }
  }
  
  if (sparkFields.has('last_name') && !userUpdatedFields.has('last_name')) {
    const converted = convertValue('last_name', formData.last_name);
    if (converted !== undefined) {
      spark_data.last_name = converted;
    }
  }

  // Process ALL other fields to user_data (except those handled above)
  Object.entries(formData).forEach(([key, value]) => {
    if (disabledFields.includes(key) || !backendFields.includes(key)) return;
    
    // Skip first_name and last_name if already in spark_data
    if ((key === 'first_name' || key === 'last_name') && 
        sparkFields.has(key) && !userUpdatedFields.has(key)) {
      return;
    }
    
    const converted = convertValue(key, value);
    if (converted !== undefined) {
      user_data[key] = converted;
    }
  });

  // Ensure relation_id is always included for user_data (it's required)
  if (formData.relation_id && !user_data.relation_id) {
    const relationId = parseInt(formData.relation_id);
    if (!isNaN(relationId)) {
      user_data.relation_id = relationId;
    }
  }

  // ========== CHILD UPDATE HANDLING ==========
  if (formData.relation_id === '2' && formData.spouse_id) {
    console.log('Processing child update with spouse_id:', formData.spouse_id);
    console.log('Existing parent IDs:', {
      father_id: dependentDetails?.father_id,
      mother_id: dependentDetails?.mother_id
    });
    
    const newSpouseId = parseInt(formData.spouse_id);
    
    // Find the selected spouse in availableSpouses to get their gender
    const selectedSpouse = availableSpouses.find(s => 
      s.ais_fam_id?.toString() === formData.spouse_id?.toString()
    );
    
    if (selectedSpouse) {
      const spouseGender = selectedSpouse.gender_id;
      
      // Determine if we're updating father or mother based on spouse gender
      if (spouseGender === '1' || spouseGender === 1) {
        // Selected spouse is MALE, so we're updating the FATHER
        user_data.father_id = newSpouseId;
        console.log('Updating father_id to:', newSpouseId, '(spouse is male)');
        
        // Keep the existing mother_id if we have it
        if (dependentDetails?.mother_id) {
          user_data.mother_id = parseInt(dependentDetails.mother_id);
          console.log('Keeping existing mother_id:', dependentDetails.mother_id);
        }
      } else if (spouseGender === '2' || spouseGender === 2) {
        // Selected spouse is FEMALE, so we're updating the MOTHER
        user_data.mother_id = newSpouseId;
        console.log('Updating mother_id to:', newSpouseId, '(spouse is female)');
        
        // Keep the existing father_id if we have it
        if (dependentDetails?.father_id) {
          user_data.father_id = parseInt(dependentDetails.father_id);
          console.log('Keeping existing father_id:', dependentDetails.father_id);
        }
      } else {
        console.warn('Cannot determine gender for spouse:', selectedSpouse);
        
        // Try to infer from existing parent IDs
        // If new spouse ID matches existing father_id, we're updating father
        if (dependentDetails?.father_id?.toString() === formData.spouse_id?.toString()) {
          user_data.father_id = newSpouseId;
          if (dependentDetails?.mother_id) {
            user_data.mother_id = parseInt(dependentDetails.mother_id);
          }
          console.log('Inferred: Updating father_id (matches existing)');
        } 
        // If new spouse ID matches existing mother_id, we're updating mother
        else if (dependentDetails?.mother_id?.toString() === formData.spouse_id?.toString()) {
          user_data.mother_id = newSpouseId;
          if (dependentDetails?.father_id) {
            user_data.father_id = parseInt(dependentDetails.father_id);
          }
          console.log('Inferred: Updating mother_id (matches existing)');
        }
        // If we have only one parent currently, new spouse must be the other parent
        else if (dependentDetails?.father_id && !dependentDetails?.mother_id) {
          // Only father exists, so new spouse must be mother
          user_data.mother_id = newSpouseId;
          user_data.father_id = parseInt(dependentDetails.father_id);
          console.log('Inferred: Adding mother (only father exists)');
        }
        else if (dependentDetails?.mother_id && !dependentDetails?.father_id) {
          // Only mother exists, so new spouse must be father
          user_data.father_id = newSpouseId;
          user_data.mother_id = parseInt(dependentDetails.mother_id);
          console.log('Inferred: Adding father (only mother exists)');
        }
        else {
          console.error('Cannot determine which parent to update');
          toast.error('Cannot determine parent assignment. Please contact support.');
          return;
        }
      }
    } else {
      console.warn('Selected spouse not found in availableSpouses');
      
      // Try to determine based on existing parent IDs
      if (dependentDetails?.father_id?.toString() === formData.spouse_id?.toString()) {
        // Spouse ID matches existing father_id
        user_data.father_id = newSpouseId;
        if (dependentDetails?.mother_id) {
          user_data.mother_id = parseInt(dependentDetails.mother_id);
        }
        console.log('Updating father_id (matches existing)');
      }
      else if (dependentDetails?.mother_id?.toString() === formData.spouse_id?.toString()) {
        // Spouse ID matches existing mother_id
        user_data.mother_id = newSpouseId;
        if (dependentDetails?.father_id) {
          user_data.father_id = parseInt(dependentDetails.father_id);
        }
        console.log('Updating mother_id (matches existing)');
      }
      else {
        console.error('Cannot determine which parent to update - spouse not found');
        toast.error('Cannot determine parent assignment. Please contact support.');
        return;
      }
    }
    
    // Remove spouse_id from user_data as backend expects father_id/mother_id
    delete user_data.spouse_id;
    
    console.log('Final child parent assignment:', {
      father_id: user_data.father_id,
      mother_id: user_data.mother_id,
      selected_spouse_gender: selectedSpouse?.gender_id
    });
  }

  // Handle spouse status specific logic
  if (formData.relation_id === '1') {
    if (formData.spouse_status === 'divorced') {
      user_data.is_alive = true;
      user_data.removing_reason = 1;
      
      // Remove fields that should NOT be included for divorced spouse
      delete user_data.email_id;
      delete user_data.mobile_number;
      delete user_data.dob;
      delete user_data.is_govt_servant;
      delete user_data.category_id;
      delete user_data.institution_name;
      
      // Include divorce-specific fields if they have values
      if (formData.divorce_date) {
        user_data.divorce_date = formData.divorce_date;
      }
      // Include divorce document ID (either new or existing)
      const divorceDocId = formData.sup_doc_for_remv || existingDivorceDocumentId;
      if (divorceDocId) {
        user_data.sup_doc_for_remv = divorceDocId;
      }
    } else if (formData.spouse_status === 'deceased') {
      user_data.is_alive = false;
      user_data.removing_reason = 2;
      
      // Remove fields that should NOT be included for deceased spouse
      delete user_data.email_id;
      delete user_data.mobile_number;
      
      // Include death-specific fields if they have values
      if (formData.death_date) {
        user_data.death_date = formData.death_date;
      }
      // Include death certificate ID (either new or existing)
      const deathCertId = formData.death_certificate || existingDeathCertificateId;
      if (deathCertId) {
        user_data.death_certificate = deathCertId;
      }
    } else {
      // Current spouse
      user_data.is_alive = true;
      user_data.removing_reason = 0;
      // Email, mobile, and DOB are required for current spouse
      // They should already be in user_data if filled
      
      // Include marriage certificate if available (either new or existing)
      const marriageCertId = formData.marriage_certificate_proof || existingMarriageCertificateId;
      if (marriageCertId) {
        user_data.marriage_certificate_proof = marriageCertId;
      }
    }
  }

  // For non-spouse deceased persons
  if (formData.relation_id !== '1' && formData.is_alive === false) {
    // Include Date Of Death and certificate
    if (formData.death_date) {
      user_data.death_date = formData.death_date;
    }
    const deathCertId = formData.death_certificate || existingDeathCertificateId;
    if (deathCertId) {
      user_data.death_certificate = deathCertId;
    }
  }

  // Clean up fields not needed for backend
  delete user_data.institution_id;
  delete user_data.showChildFields;
  delete user_data.verifiedFields;
  delete user_data.spouse_status;

  // Also clean from spark data
  delete spark_data.institution_id;
  delete spark_data.showChildFields;
  delete spark_data.verifiedFields;
  delete spark_data.spouse_status;

  // Clean up spark_data - remove any undefined/null values that might have slipped through
  Object.keys(spark_data).forEach(key => {
    if (spark_data[key] === undefined || spark_data[key] === null) {
      delete spark_data[key];
    }
  });

  // Clean up user_data - remove any undefined/null values
  Object.keys(user_data).forEach(key => {
    if (user_data[key] === undefined || user_data[key] === null) {
      delete user_data[key];
    }
  });

  console.log('Sending to backend - cleaned:', {
    spark_data,
    user_data
  });

  onSave({ 
    spark_data, 
    user_data, 
    ais_fam_id: formData.ais_fam_id 
  });
};

const checkCurrentErrors = () => {
  console.log('=== CURRENT FORM STATE ===');
  console.log('Relation:', formData.relation_id);
  console.log('Spouse Status:', formData.spouse_status);
  console.log('Is Alive:', formData.is_alive);
  console.log('First Name:', formData.first_name);
  console.log('Gender:', formData.gender_id);
  console.log('Death Date:', formData.death_date);
  console.log('Death Certificate:', formData.death_certificate, 'Existing ID:', existingDeathCertificateId);
  console.log('All Errors:', errors);
  console.log('Error Keys:', Object.keys(errors));
  console.log('=== END FORM STATE ===');
};

// Call this function when form changes
useEffect(() => {
  if (open) {
    checkCurrentErrors();
  }
}, [formData, open]);

  const renderIndicator = (type, key) => {
    if (
      formData.sourceMap?.[key] === 'DB_SPARK_API' ||
      formData.sourceMap?.[key] === 'SPARK' ||
      sparkFields.has(key)
    ) {
      return (
        <div className="absolute top-1 right-1 group z-50">
          <span className="inline-flex items-center p-0.5 rounded-full bg-orange-100 text-orange-600 text-xs" aria-label="Synced from SPARK">
            <BoltIcon className="w-3 h-3" />
          </span>
          <div className="absolute -right-4 -top-8 hidden group-hover:block z-50 w-40">
            <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md whitespace-nowrap">
              Synced from SPARK
            </div>
          </div>
        </div>
      );
    }

    if (
      formData.sourceMap?.[key] === 'GAD_OFFICER' ||
      officerFields.GAD_OFFICER?.includes(key)
    ) {
      return (
        <div className="absolute top-1 right-1 group z-50">
          <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-xs" aria-label="Updated by AS-II">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
          </span>
          <div className="absolute -right-4 -top-8 hidden group-hover:block z-50 w-40">
            <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md whitespace-nowrap">
              Updated by AS-II
            </div>
          </div>
        </div>
      );
    }

    if (
      formData.sourceMap?.[key] === 'AIS_OFFICER' ||
      officerFields.AIS_OFFICER?.includes(key)
    ) {
      return (
        <div className="absolute top-1 right-1 group z-50">
          <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-xs" aria-label="User Entered">
            <UserIcon className="w-3 h-3" />
          </span>
          <div className="absolute -right-4 -top-8 hidden group-hover:block z-50 w-40">
            <div className="bg-gray-800 text-white text-xs rounded px 2 py-1 shadow-md whitespace-nowrap">
              User Entered
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const isFieldDisabled = key => sparkFields.has(key) || formData.verifiedFields.has(key);

  const LabelWithAsterisk = ({ children }) => (
    <>
      {children} <span className="text-red-600">*</span>
    </>
  );

  const handleDocumentViewClick = async (documentId) => {
    try {
      await viewDocument(documentId);
    } catch (err) {
      toast.error('Failed to view document');
    }
  };

  // Function to check if spouse is being removed/deleted
  const checkSpouseRemoval = (formData, originalSpouseStatus) => {
    if (formData.relation_id === '1') {
      // Check if spouse status is being changed to something that indicates removal
      // (e.g., from current/divorced to deleted, or if removing_reason is being set)
      const isBeingRemoved = 
        (originalSpouseStatus === 'current' && formData.spouse_status === 'deceased') ||
        (originalSpouseStatus === 'current' && formData.spouse_status === 'divorced') ||
        (formData.removing_reason && formData.removing_reason !== '0');
      
      return isBeingRemoved;
    }
    return false;
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-700 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="absolute right-4 top-4">
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={() => setOpen(false)}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <div className="bg-white px-6 pb-6 pt-8 sm:p-8 sm:pb-6">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Warning for spouse linked to child */}
                {isSpouseLinkedToChild && (
                  <div className="md:col-span-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Spouse Linked to Child</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>This spouse is linked to {linkedChildren.length} child(ren). If you remove or change this spouse, please update the parent information for the linked child(ren) first.</p>
                          <ul className="mt-1 list-disc pl-5">
                            {linkedChildren.map(child => (
                              <li key={child.ais_fam_id}>
                                {child.first_name} {child.last_name} ({getMasterValue(child.child_type, 'child_type')})
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Relationship */}
                <div className="relative md:col-span-2">
                  {renderIndicator('spark', 'relation_id')}
                  <label className="block text-sm font-medium text-gray-700 dark:text-white">
                    <LabelWithAsterisk>Relationship</LabelWithAsterisk>
                  </label>
                  <select
                    name="relation_id"
                    value={formData.relation_id || ''}
                    onChange={handleChange}
                    disabled={isFieldDisabled('relation_id') || (dependentDetails?.ais_fam_id && !dependentDetails.ais_fam_id.toString().startsWith('spark_'))}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-500"
                  >
                    <option value="">Select Relationship</option>
                    {masterData.relationship?.map(rel => (
                      <option key={rel.rel_status_id} value={rel.rel_status_id}>
                        {rel.rel_status_name}
                      </option>
                    ))}
                  </select>
                  {errors.relation_id && <p className="text-red-500 text-sm mt-1">{errors.relation_id}</p>}
                  {dependentDetails?.ais_fam_id && !dependentDetails.ais_fam_id.toString().startsWith('spark_') && (
                    <p className="text-sm text-gray-500 mt-1 italic">
                      Cannot change relation type for saved dependent. Remove and add as new if needed.
                    </p>
                  )}
                </div>

                {/* Spouse Status - Show for ALL spouse relations */}
                {formData.relation_id === 
                  masterData.relationship?.find(r => r.rel_status_name === 'Spouse')?.rel_status_id?.toString() && (
                  <div className="relative md:col-span-2">
                    {renderIndicator('spark', 'spouse_status')}
                    <p className="text-sm font-medium text-gray-700 dark:text-white">
                      <LabelWithAsterisk>Spouse Status</LabelWithAsterisk>
                    </p>
                    <div className="mt-1 flex gap-4">
                      <label className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="spouse_status" 
                          value="current" 
                          checked={formData.spouse_status === 'current'} 
                          onChange={handleChange} 
                          disabled={originalSpouseStatus === 'deceased'}
                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50" 
                        />
                        Current
                      </label>
                      <label className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="spouse_status" 
                          value="divorced" 
                          checked={formData.spouse_status === 'divorced'} 
                          onChange={handleChange} 
                          disabled={originalSpouseStatus === 'deceased'}
                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50" 
                        />
                        Divorced
                      </label>
                      <label className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="spouse_status" 
                          value="deceased" 
                          checked={formData.spouse_status === 'deceased'} 
                          onChange={handleChange} 
                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                        />
                        Deceased
                      </label>
                    </div>
                    {originalSpouseStatus === 'deceased' && (
                      <p className="text-sm text-gray-500 mt-1 italic">
                        Cannot change deceased spouse to other status.
                      </p>
                    )}
                  </div>
                )}

                {/* Alive Status - ONLY show for non-spouse relations */}
                {formData.relation_id && 
                 formData.relation_id !== masterData.relationship?.find(r => r.rel_status_name === 'Spouse')?.rel_status_id?.toString() && (
                  <div className="relative md:col-span-2">
                    {renderIndicator('spark', 'is_alive')}
                    <p className="text-sm font-medium text-gray-700 dark:text-white">
                      <LabelWithAsterisk>Status</LabelWithAsterisk>
                    </p>
                    <div className="mt-1 flex gap-4">
                      <label className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="is_alive" 
                          value="true" 
                          checked={formData.is_alive === true} 
                          onChange={handleChange} 
                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                        />
                        Alive
                      </label>
                      <label className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="is_alive" 
                          value="false" 
                          checked={formData.is_alive === false} 
                          onChange={handleChange} 
                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                        />
                        Deceased
                      </label>
                    </div>
                  </div>
                )}

                {/* Date Of Death and Certificate for deceased persons */}
                {(formData.is_alive === false || formData.spouse_status === 'deceased') && (
                  <>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        <LabelWithAsterisk>Date Of Death</LabelWithAsterisk>
                      </label>
                      <input
                        type="date"
                        name="death_date"
                        value={formData.death_date || ''}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-600"
                      />
                      {errors.death_date && <p className="text-red-500 text-sm mt-1">{errors.death_date}</p>}
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        <LabelWithAsterisk>Death Certificate</LabelWithAsterisk>
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleDeathCertificateChange}
                          accept=".pdf,.jpg,.jpeg,.png"
                          disabled={isUploading}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
                        />
                        {/* Show view button for existing document */}
                        {(formData.death_certificate || existingDeathCertificateId) && (
                          <button
                            type="button"
                            onClick={() => handleDocumentViewClick(formData.death_certificate || existingDeathCertificateId)}
                            className="p-2 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                            disabled={isUploading}
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      {errors.death_certificate && <p className="text-red-500 text-sm mt-1">{errors.death_certificate}</p>}
                      {deathCertificateFile && (
                        <p className="text-sm text-gray-500 mt-1">Selected: {deathCertificateFile.name}</p>
                      )}
                      {(formData.death_certificate || existingDeathCertificateId) && !deathCertificateFile && (
                        <p className="text-sm text-green-500 mt-1">Existing document attached</p>
                      )}
                      {isUploading && (
                        <p className="text-sm text-indigo-500 mt-1">Uploading...</p>
                      )}
                    </div>
                  </>
                )}

                {/* Divorce Date and Document for divorced spouse */}
                {formData.spouse_status === 'divorced' && (
                  <>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        <LabelWithAsterisk>Divorce Date</LabelWithAsterisk>
                      </label>
                      <input
                        type="date"
                        name="divorce_date"
                        value={formData.divorce_date || ''}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-600"
                      />
                      {errors.divorce_date && <p className="text-red-500 text-sm mt-1">{errors.divorce_date}</p>}
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        <LabelWithAsterisk>Divorce Document</LabelWithAsterisk>
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="file"
                          ref={divorceDocInputRef}
                          onChange={handleDivorceDocumentChange}
                          accept=".pdf,.jpg,.jpeg,.png"
                          disabled={isUploading}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
                        />
                        {/* Show view button for existing document */}
                        {(formData.sup_doc_for_remv || existingDivorceDocumentId) && (
                          <button
                            type="button"
                            onClick={() => handleDocumentViewClick(formData.sup_doc_for_remv || existingDivorceDocumentId)}
                            className="p-2 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                            disabled={isUploading}
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      {errors.sup_doc_for_remv && <p className="text-red-500 text-sm mt-1">{errors.sup_doc_for_remv}</p>}
                      {divorceDocumentFile && (
                        <p className="text-sm text-gray-500 mt-1">Selected: {divorceDocumentFile.name}</p>
                      )}
                      {(formData.sup_doc_for_remv || existingDivorceDocumentId) && !divorceDocumentFile && (
                        <p className="text-sm text-green-500 mt-1">Existing document attached</p>
                      )}
                    </div>
                  </>
                )}

                {/* Marriage Certificate for current spouse */}
                {formData.relation_id === masterData.relationship?.find(r => r.rel_status_name === 'Spouse')?.rel_status_id?.toString() && 
                 formData.spouse_status === 'current' && (
                  <div className="relative md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-white">
                      Marriage Certificate (Optional)
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="file"
                        ref={marriageCertInputRef}
                        onChange={handleMarriageCertificateChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={isUploading}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
                      />
                      {/* Show view button for existing document */}
                      {(formData.marriage_certificate_proof || existingMarriageCertificateId) && (
                        <button
                          type="button"
                          onClick={() => handleDocumentViewClick(formData.marriage_certificate_proof || existingMarriageCertificateId)}
                          className="p-2 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                          disabled={isUploading}
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    {marriageCertificateFile && (
                      <p className="text-sm text-gray-500 mt-1">Selected: {marriageCertificateFile.name}</p>
                    )}
                    {(formData.marriage_certificate_proof || existingMarriageCertificateId) && !marriageCertificateFile && (
                      <p className="text-sm text-green-500 mt-1">Existing document attached</p>
                    )}
                  </div>
                )}

                {/* Child Type - Show when relation is Child OR when editing a child */}
                {(formData.relation_id === '2' || formData.showChildFields) && (
                  <div className="relative md:col-span-2">
                    {renderIndicator('spark', 'child_type')}
                    <label className="block text-sm font-medium text-gray-700 dark:text-white">
                      <LabelWithAsterisk>Child Type</LabelWithAsterisk>
                    </label>
                    <select
                      name="child_type"
                      value={formData.child_type || ''}
                      onChange={handleChange}
                      required={formData.relation_id === '2'}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-600"
                    >
                      <option value="">Select Child Type</option>
                      <option value="1">Son</option>
                      <option value="2">Daughter</option>
                      <option value="3">Step Son</option>
                      <option value="4">Step Daughter</option>
                    </select>
                    {errors.child_type && <p className="text-red-500 text-sm mt-1">{errors.child_type}</p>}
                    {formData.child_type && (
                      <p className="text-sm text-gray-500 mt-1">
                        Gender will be automatically set to {
                          formData.child_type === '1' || formData.child_type === '3' ? 'Male' : 
                          formData.child_type === '2' || formData.child_type === '4' ? 'Female' : ''
                        }
                      </p>
                    )}
                  </div>
                )}

                {/* Spouse Selection for Child - Show when relation is Child OR when editing a child */}
{(formData.relation_id === '2' || formData.showChildFields) && (
  <div className="relative md:col-span-2">
    <label className="block text-sm font-medium text-gray-700 dark:text-white">
      <LabelWithAsterisk>Select Parent (Spouse)</LabelWithAsterisk>
    </label>
    <select
  name="spouse_id"
  value={formData.spouse_id || ''}
  onChange={handleChange}
  required={formData.relation_id === '2'}
  disabled={availableSpouses.length === 0}
  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-600 disabled:bg-gray-200"
>
  <option value="">Select Parent</option>
  {availableSpouses
    .filter(spouse => {
      const spouseRelName = getMasterValue(spouse.relation_id, 'relation_id');
      return spouseRelName === 'Spouse';
    })
    .map(spouse => {
      // Determine spouse status for display
      let status = '';
      
      if (spouse.removing_reason === '1') {
        status = ' (Divorced)';
      } else if (spouse.is_alive === false) {
        status = ' (Deceased)';
      } else {
        status = ' (Current)';
      }
      
      return (
        <option key={spouse.ais_fam_id} value={spouse.ais_fam_id}>
          {spouse.first_name} {spouse.last_name}{status}
        </option>
      );
    })}
</select>
    {errors.spouse_id && <p className="text-red-500 text-sm mt-1">{errors.spouse_id}</p>}
    {availableSpouses.length === 0 && (
      <p className="text-sm text-red-500 mt-1">Please add a spouse first before adding child.</p>
    )}
  </div>
)}
                {/* AIS Officer? (only for alive persons, not for divorced/deceased) */}
                {formData.relation_id && formData.is_alive !== false && 
                 !(formData.relation_id === '1' && formData.spouse_status === 'divorced') &&  !(formData.relation_id === '1' && formData.spouse_status === 'deceased') && (
                  <div className="relative md:col-span-2">
                    {renderIndicator('spark', 'is_ais_officer')}
                    <p className="text-sm font-medium text-gray-700 dark:text-white">Is AIS Officer?</p>
                    <div className="mt-1 flex gap-4">
                      <label className="flex items-center gap-2">
                        <input type="radio" name="is_ais_officer" value="true" checked={formData.is_ais_officer === true} onChange={handleChange} className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        Yes
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name="is_ais_officer" value="false" checked={formData.is_ais_officer === false} onChange={handleChange} className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        No
                      </label>
                    </div>
                  </div>
                )}

                {/* AIS Number */}
                {formData.is_ais_officer === true && formData.is_alive !== false && 
                 !(formData.relation_id === '1' && formData.spouse_status === 'divorced') && (
                  <div className="relative md:col-span-2">
                    {renderIndicator('spark', 'aisNumber')}
                    <label className="block text-sm font-medium text-gray-700 dark:text-white">
                      Enter KARMASRI Id / PEN
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="text"
                        name="aisNumber"
                        placeholder="KARMASRI Id / PEN"
                        value={formData.aisNumber || ''}
                        onChange={handleChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-600"
                      />
                      <button type="button" onClick={handleVerifyAIS} className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm">
                        Fetch Details
                      </button>
                    </div>
                    {!isVerified && (
                      <button type="button" onClick={handleManualEntry} className="mt-2 text-sm text-indigo-600 hover:text-indigo-800">
                        Enter details manually
                      </button>
                    )}
                  </div>
                )}

                {/* DOB verification */}
                {showDobVerification && (
                  <div className="relative md:col-span-2">
                    <label htmlFor="verificationDob" className="block text-sm font-medium text-gray-700 dark:text-white">Enter DOB for Verification</label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        id="verificationDob"
                        type="date"
                        value={verificationDob}
                        onChange={e => setVerificationDob(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-600"
                      />
                      <button type="button" onClick={handleDobConfirm} className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm">
                        Confirm
                      </button>
                    </div>
                  </div>
                )}

                {/* Government Servant? (only for alive persons, not for divorced/deceased) */}
                {formData.relation_id && formData.is_ais_officer === false && 
                 formData.is_alive !== false && 
                 !(formData.relation_id === '1' && formData.spouse_status === 'divorced') && !(formData.relation_id === '1' && formData.spouse_status === 'deceased') &&(
                  <div className="relative md:col-span-2">
                    {renderIndicator('spark', 'is_govt_servant')}
                    <p className="text-sm font-medium text-gray-700 dark:text-white">Is Government Servant?</p>
                    <div className="mt-1 flex gap-4">
                      <label className="flex items-center gap-2">
                        <input type="radio" name="is_govt_servant" value="true" checked={formData.is_govt_servant === true} onChange={handleChange} className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        Yes
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name="is_govt_servant" value="false" checked={formData.is_govt_servant === false} onChange={handleChange} className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        No
                      </label>
                    </div>
                  </div>
                )}

                {/* Occupation Category + Institution (only for alive persons, not for divorced/deceased) */}
                {formData.is_govt_servant === true && formData.is_ais_officer === false && 
                 formData.is_alive !== false && 
                 !(formData.relation_id === '1' && formData.spouse_status === 'divorced') && (
                  <>
                    <div className="relative">
                      {renderIndicator('spark', 'category_id')}
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        <LabelWithAsterisk>Occupation Category</LabelWithAsterisk>
                      </label>
                      <select
                        name="category_id"
                        value={formData.category_id || ''}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-600"
                      >
                        <option value="">Select Category</option>
                        {masterData.occupationCategory?.map(cat => (
                          <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                        ))}
                      </select>
                      {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
                    </div>

                    {formData.category_id && (
                      <>
                        {parseInt(formData.category_id) !== 4 ? (
                          <div className="relative">
                            {renderIndicator('spark', 'institution_id')}
                            <label htmlFor="institution_id" className="block text-sm font-medium text-gray-700 dark:text-white">
                              <LabelWithAsterisk>Institution</LabelWithAsterisk>
                            </label>
                            <select
                              id="institution_id"
                              name="institution_id"
                              value={formData.institution_id || ''}
                              onChange={handleChange}
                              required
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-600"
                            >
                              <option value="">Select Institution</option>
                              {masterData.institution
                                .filter(i => i.category_id === parseInt(formData.category_id))
                                .map(inst => (
                                  <option key={inst.institution_id} value={inst.institution_id}>{inst.institution_name}</option>
                                ))}
                              <option value="0">Other</option>
                            </select>
                            {errors.institution_id && <p className="text-red-500 text-sm mt-1">{errors.institution_id}</p>}
                          </div>
                        ) : (
                          <div className="relative">
                            {renderIndicator('spark', 'institution_name')}
                            <label className="block text-sm font-medium text-gray-700 dark:text-white">
                              <LabelWithAsterisk>Institution Name</LabelWithAsterisk>
                            </label>
                            <input
                              type="text"
                              name="institution_name"
                              value={formData.institution_name || ''}
                              onChange={handleChange}
                              required
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-600"
                            />
                            {errors.institution_name && <p className="text-red-500 text-sm mt-1">{errors.institution_name}</p>}
                          </div>
                        )}

                        {parseInt(formData.category_id) !== 4 && formData.institution_id === '0' && (
                          <div className="relative">
                            {renderIndicator('spark', 'institution_name')}
                            <label className="block text-sm font-medium text-gray-700 dark:text-white">
                              <LabelWithAsterisk>Institution Name</LabelWithAsterisk>
                            </label>
                            <input
                              type="text"
                              name="institution_name"
                              value={formData.institution_name || ''}
                              onChange={handleChange}
                              required
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-600"
                            />
                            {errors.institution_name && <p className="text-red-500 text-sm mt-1">{errors.institution_name}</p>}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Personal Details - Show for all except deceased persons where we don't need email/mobile/dob */}
                {(formData.relation_id === '1') ||
                 (formData.relation_id !== '1' && formData.is_alive !== false) ||
                 (formData.relation_id !== '1' && formData.is_alive === false) ? (
                  <>
                    <div className="relative">
                      {renderIndicator('spark', 'first_name')}
                      <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-white">
                        <LabelWithAsterisk>First Name</LabelWithAsterisk>
                      </label>
                      <input
                        id="first_name"
                        type="text"
                        name="first_name"
                        placeholder="First Name"
                        value={formData.first_name}
                        disabled={isFieldDisabled('first_name')}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-500"
                      />
                      {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
                    </div>

                    <div className="relative">
                      {renderIndicator('spark', 'last_name')}
                      <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-white">Last Name</label>
                      <input
                        id="last_name"
                        type="text"
                        name="last_name"
                        placeholder="Last Name"
                        value={formData.last_name}
                        disabled={isFieldDisabled('last_name')}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-500"
                      />
                    </div>

                    <div className="relative">
                      {renderIndicator('spark', 'gender_id')}
                      <label htmlFor="gender_id" className="block text-sm font-medium text-gray-700 dark:text-white">
                        <LabelWithAsterisk>Gender</LabelWithAsterisk>
                      </label>
                      <select
                        id="gender_id"
                        name="gender_id"
                        value={formData.gender_id || ''}
                        disabled={isFieldDisabled('gender_id') || (formData.relation_id === '2' && formData.child_type)}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-500"
                      >
                        <option value="">Select Gender</option>
                        {masterData.gender?.map(g => (
                          <option key={g.gender_id} value={g.gender_id}>{g.gender}</option>
                        ))}
                      </select>
                      {errors.gender_id && <p className="text-red-500 text-sm mt-1">{errors.gender_id}</p>}
                      {formData.relation_id === '2' && formData.child_type && (
                        <p className="text-sm text-gray-500 mt-1">Gender is automatically set based on child type</p>
                      )}
                    </div>

                    {/* DOB - Required for alive persons, optional for deceased/divorced */}
                    {(formData.is_alive !== false && !(formData.relation_id === '1' && formData.spouse_status === 'divorced')) && (
                      <div className="relative">
                        {renderIndicator('spark', 'dob')}
                        <label htmlFor="dob" className="block text-sm font-medium text-gray-700 dark:text-white">
                          Date of Birth
                        </label>
                        <input
                          id="dob"
                          type="date"
                          name="dob"
                          value={formData.dob || ''}
                          disabled={isFieldDisabled('dob')}
                          onChange={handleChange}
                          
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-500"
                        />
                        {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob}</p>}
                      </div>
                    )}

                    {/* Email and Mobile - Required for alive persons (except divorced spouses), not for deceased */}
                    {formData.is_alive !== false && !(formData.relation_id === '1' && formData.spouse_status === 'divorced') && (
                      <>
                        <div className="relative">
                          {renderIndicator('spark', 'email_id')}
                          <label htmlFor="email_id" className="block text-sm font-medium text-gray-700 dark:text-white">
                          Email
                          </label>
                          <input
                            id="email_id"
                            type="email"
                            name="email_id"
                            placeholder="Email"
                            value={formData.email_id || ''}
                            disabled={isFieldDisabled('email_id')}
                            onChange={handleChange}
                            
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-500"
                          />
                          {errors.email_id && <p className="text-red-500 text-sm mt-1">{errors.email_id}</p>}
                        </div>

                        <div className="relative">
                          {renderIndicator('spark', 'mobile_number')}
                          <label htmlFor="mobile_number" className="block text-sm font-medium text-gray-700 dark:text-white">
                           Mobile Number
                          </label>
                          <input
                            id="mobile_number"
                            type="text"
                            name="mobile_number"
                            placeholder="Mobile Number"
                            value={formData.mobile_number || ''}
                            disabled={isFieldDisabled('mobile_number')}
                            onChange={handleChange}
                            
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-500"
                          />
                          {errors.mobile_number && <p className="text-red-500 text-sm mt-1">{errors.mobile_number}</p>}
                        </div>
                      </>
                    )}
                  </>
                ) : null}

                {/* Buttons */}
                <div className="mt-5 md:col-span-2 flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isUploading || Object.values(errors).some(err => err && err !== '')}
                  >
                    {isUploading ? 'Uploading...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}

ModalDependentDetails.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  dependentDetails: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  masterData: PropTypes.object.isRequired,
  officerFields: PropTypes.object.isRequired,
  dependentDetailsList: PropTypes.array.isRequired,
  userDob: PropTypes.string,
};