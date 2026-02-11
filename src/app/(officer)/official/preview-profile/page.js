"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowDownTrayIcon, CheckCircleIcon, ArrowLeftIcon, ExclamationTriangleIcon, ExclamationCircleIcon, CheckBadgeIcon, DocumentTextIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";
import axiosInstance from '@/utils/apiClient';
import { axiosInstanceFile } from '../../../../utils/apiClient';
import ConfirmModal from '../../../components/confirmModal';
import SignerPortModal from '../../../components/SignerPortModal';
import pdfGenerator from '../../../../utils/pdfGenerator';
import saveDocument from '../../../../utils/saveDocument';
import OTPModal from '../../../components/otpModal';
import downloadFile from '../../../../utils/downloadFile';

const ProfilePreviewPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState(null);
  const [error, setError] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isOtpClicked, setIsOtpClicked] = useState(false);
  const [otpId, setOtpId] = useState('');
  const loggedInUser = JSON.parse(sessionStorage.getItem('user_details'));
  const fullName = `${loggedInUser?.first_name || ''} ${loggedInUser?.last_name || ''}`.trim();
  const mobileNo = loggedInUser?.mobile_no || null;
  const roleId = sessionStorage.getItem('role_id');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [signerPortModalOpen, setSignerPortModalOpen] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState('');
  const [remark, setRemark] = useState('');
  const [remarkError, setRemarkError] = useState('');
  const [statusTimeline, setStatusTimeline] = useState([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const aisPerId = searchParams.get('id') || sessionStorage.getItem('selected_profile_id');
  const contentRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState(null);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [documentError, setDocumentError] = useState(null);
  const [documentNumber, setDocumentNumber] = useState(null);
  const [profileDocumentError, setProfileDocumentError] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Date formatting error:", error);
      return "N/A";
    }
  };

  // Helper function to get value from any source dynamically
  const getFieldValue = (dep, fieldNames) => {
    // Check direct fields first
    for (const fieldName of fieldNames) {
      if (dep[fieldName] !== undefined && dep[fieldName] !== null && dep[fieldName] !== "") {
        return dep[fieldName];
      }
    }

    // Check nested fields (AIS_OFFICER, DB_SPARK_API, etc.)
    if (dep.fields) {
      for (const sourceKey in dep.fields) {
        const source = dep.fields[sourceKey];
        if (source && typeof source === 'object') {
          for (const fieldName of fieldNames) {
            if (source[fieldName] !== undefined && source[fieldName] !== null && source[fieldName] !== "") {
              return source[fieldName];
            }
          }
        }
      }
    }

    return null;
  };

  const transformOfficerData = useCallback((data) => {
    const officerInfo = data.ais_officer_info;

    // Create a map of family members for parent lookup
    const familyMap = {};
    if (data.family) {
      data.family.forEach(member => {
        familyMap[member.person_id] = {
          name: `${getFieldValue(member, ['first_name']) || ''} ${getFieldValue(member, ['last_name']) || ''}`.trim(),
          relation: getFieldValue(member, ['relation', 'relation_type']) || 'Dependent'
        };
      });
    }

    return {
      full_name: `${officerInfo.honorifics ? formatField(officerInfo.honorifics, "Honorifics") + " " : ""}${officerInfo.first_name || ""} ${officerInfo.last_name || ""}`.trim(),
      position: formatField(officerInfo.service_type_name, "Service Type") || "N/A",
      profile_image: officerInfo.profile_image
        ? `${process.env.NEXT_PUBLIC_API_URL}/officer/get-image/${officerInfo.profile_image}?t=${new Date().getTime()}`
        : null,
      personal_details: {
        "Full Name": `${officerInfo.honorifics ? formatField(officerInfo.honorifics, "Honorifics") + " " : ""}${officerInfo.first_name || ""} ${officerInfo.last_name || ""}`.trim(),
        "Date of Birth": formatDate(officerInfo.dob),
        "Gender": formatField(officerInfo.gender, "Gender") || "N/A",
        "Blood Group": formatField(officerInfo.blood_group, "Blood Group") || "N/A",
        "Email": officerInfo.email || "N/A",
        "Alternative Email": officerInfo.alternative_email || "N/A",
        "Mobile No": officerInfo.mobile_no || "N/A",
        "Alternative Mobile No": officerInfo.alternative_mobile_no || "N/A",
        "Karmasri ID": officerInfo.identity_number || "N/A",
        "PEN": officerInfo.pen_number || "N/A",
        "AIS Number": formatField(officerInfo.ais_number, "AIS Number") || "N/A",
        "PAN": formatField(officerInfo.pan_no, "PAN") || "N/A",
        "PRAN": officerInfo.praan_number || "N/A",
        "PF Number": officerInfo.pf_number || "N/A",
        "Source of Recruitment": formatField(officerInfo.recruitment, "Source of Recruitment") || "N/A",
        "Cadre": formatField(officerInfo.cadre, "Cadre") || "N/A",
        "Allotment Year": officerInfo.allotment_year || "N/A",
        "Date of Joining": formatDate(officerInfo.date_of_joining),
        "Service Type": formatField(officerInfo.service_type_name, "Service Type") || "N/A",
        "Mother Tongue": formatField(officerInfo.mother_tongue, "Mother Tongue") || "N/A",
        "Languages Known": officerInfo.languages_known?.map(lang => formatField(lang, "Languages Known")).join(", ") || "N/A",
        "Category": formatField(officerInfo.category, "Category") || "N/A",
        "Retirement Date": formatDate(officerInfo.retirement_date),
        "Mode of Retirement": formatField(officerInfo.retirement, "Mode of Retirement") || "N/A",
      },
      address_details: [
        {
          title: "Official Address",
          value: [
            formatField(officerInfo.address_line1_com, "Address Line1 Com"),
            formatField(officerInfo.address_line2_com, "Address Line2 Com"),
            formatField(officerInfo.district_com, "District Com"),
            formatField(officerInfo.state_com, "State Com"),
            officerInfo.pin_code_com,
          ].filter(Boolean).join(", ") || "N/A",
        },
        {
          title: "Permanent Address",
          value: [
            formatField(officerInfo.address_line1_per, "Address Line1 Per"),
            formatField(officerInfo.address_line2_per, "Address Line2 Per"),
            formatField(officerInfo.district_per, "District Per"),
            formatField(officerInfo.state_per, "State Per"),
            officerInfo.pin_code_per,
          ].filter(Boolean).join(", ") || "N/A",
        },
      ],
      dependent_details: data.family?.length
        ? data.family.map(dep => {
          // Use dynamic field getter for all fields
          const firstName = getFieldValue(dep, ['first_name']);
          const lastName = getFieldValue(dep, ['last_name']);
          const relation = getFieldValue(dep, ['relation', 'relation_type']);
          const dob = getFieldValue(dep, ['dob', 'date_of_birth']);
          const deathDate = getFieldValue(dep, ['death_date']);
          const divorceDate = getFieldValue(dep, ['divorce_date']);
          const email = getFieldValue(dep, ['email_id', 'email']);
          const mobile = getFieldValue(dep, ['mobile_number', 'mobile_no']);
          const institution = getFieldValue(dep, ['institution_name', 'institution']);
          const occupation = getFieldValue(dep, ['occupation_category', 'occupation']);

          // Get gender from any source
          let genderValue = "N/A";
          const genderName = getFieldValue(dep, ['gender_name', 'gender']);
          const genderId = getFieldValue(dep, ['gender_id']);

          if (genderName && genderName !== "Other" && genderName !== "other") {
            genderValue = formatField(genderName, "Gender");
          } else if (genderId) {
            // Convert numeric gender_id to text
            const genderIdNum = parseInt(genderId);
            if (genderIdNum === 1) genderValue = "Male";
            else if (genderIdNum === 2) genderValue = "Female";
            else if (genderIdNum === 3) genderValue = "Transgender";
          }

          // Get parent name from family map
          let parentName = "N/A";
          const fatherId = getFieldValue(dep, ['father_id']);
          const motherId = getFieldValue(dep, ['mother_id']);
          const spouseId = getFieldValue(dep, ['spouse_id']);

          if (fatherId && familyMap[fatherId]) {
            parentName = familyMap[fatherId].name;
          } else if (motherId && familyMap[motherId]) {
            parentName = familyMap[motherId].name;
          } else if (spouseId && familyMap[spouseId]) {
            parentName = familyMap[spouseId].name;
          }

          // Get document IDs from any source
          const deathCert = getFieldValue(dep, ['death_certificate']);
          const marriageCert = getFieldValue(dep, ['marriage_certificate_proof']);
          const supDoc = getFieldValue(dep, ['sup_doc_for_remv']);

          // Determine if alive (check multiple sources)
          let isAlive = true;
          const aliveValue = getFieldValue(dep, ['is_alive', 'alive_status']);
          if (aliveValue === false || aliveValue === "false" || aliveValue === "False") {
            isAlive = false;
          } else if (aliveValue === true || aliveValue === "true" || aliveValue === "True") {
            isAlive = true;
          }

          // Determine if AIS officer
          const isAisOfficer = getFieldValue(dep, ['is_ais_officer']);
          const isGovtServant = getFieldValue(dep, ['is_govt_servant', 'government_servant']);
          const isFromHistory = getFieldValue(dep, ['is_from_history']) === true ||
            getFieldValue(dep, ['is_from_history']) === "true" ||
            getFieldValue(dep, ['is_from_history']) === "True";

          return {
            relation: (formatField(relation, "Relation") === "Current Spouse" ? "Spouse" : formatField(relation, "Relation")) || "Dependent",
            name: `${formatField(firstName, "First Name")} ${formatField(lastName, "Last Name")}`.trim() || "N/A",
            date_of_birth: formatDate(dob),
            gender: genderValue,
            email: email || "N/A",
            mobile_number: mobile || "N/A",
            ais_officer: isAisOfficer === true || isAisOfficer === "true" || isAisOfficer === "True" ? "Yes" : "No",
            government_servant: isGovtServant === true || isGovtServant === "true" || isGovtServant === "True" ? "Yes" : "No",
            institution: formatField(institution, "Institution Name") || "N/A",
            occupation: formatField(occupation, "Occupation Category") || "N/A",
            // Document fields
            death_certificate: deathCert,
            marriage_certificate_proof: marriageCert,
            sup_doc_for_remv: supDoc,
            // Status fields
            is_alive: isAlive,
            death_date: deathDate,
            divorce_date: divorceDate,
            is_from_history: isFromHistory,
            // Parent info
            father_id: fatherId,
            mother_id: motherId,
            spouse_id: spouseId,
            parent_name: parentName,
          };
        })
        : [],
      educational_qualifications: data.ais_edu_qualification?.length
        ? data.ais_edu_qualification.map(edu => ({
          qualification: formatField(edu.qualification, "Qualification") || "N/A",
          institute: formatField(edu.institute_name, "Institute Name") || "N/A",
          subject: formatField(edu.subject_name, "Subject Name") || "N/A",
        }))
        : [],
      central_deputation: data.ais_central_deputation?.length
        ? data.ais_central_deputation.map(dep => ({
          designation: formatField(dep.cen_designation, "cen_designation") || "N/A",
          phone: dep.phone_no || "N/A",
          state: formatField(dep.state, "State") || "N/A",
          start_date: formatDate(dep.start_date),
          end_date: formatDate(dep.end_date),
          tenure: formatField(dep.tenures, "Tenures") || "N/A",
          ministry: formatField(dep.ministry, "Ministry") || "N/A",
          office: formatField(dep.agency, "Agency") || "N/A",
          department: formatField(dep.administrative_department, "Administrative Department") || "N/A",
        }))
        : [],
      service_details: data.ais_service_history?.length
        ? data.ais_service_history.map(service => ({
          designation: formatField(service.designation, "designation") || "N/A",
          ministry: formatField(service.ministry, "Ministry") || "N/A",
          department: formatField(service.administrative_department, "Administrative Department") || "N/A",
          office: formatField(service.agency, "Agency") || "N/A",
          state: formatField(service.state, "State") || "N/A",
          district: formatField(service.district, "District") || "N/A",
          grade: formatField(service.grade, "Grade") || "N/A",
          level: formatField(service.level, "Level") || "N/A",
          posting_type: formatField(service.posting_types, "Posting Types") || "N/A",
          additional_charge: service.is_additional_charge ? "Yes" : "No",
          address: service.address || "N/A",
          phone_no: service.phone_no || "N/A",
          start_date: formatDate(service.start_date),
          end_date: formatDate(service.end_date),
          order_no: service.order_no || "N/A",
          order_date: formatDate(service.order_date),
          basic_pay: service.basic_pay || "N/A",
          other_details: formatField(service.other_details, "Other Details") || "N/A",
        }))
        : [],
      training_details: data.ais_training_info?.length
        ? data.ais_training_info.map(training => ({
          // training_name: formatField(training.training_name, "Training Name") || "N/A",
          training_type: formatField(training.training_type, "Training Type") || "N/A",
          country: formatField(training.country, "Country") || "N/A",
          institute_name: formatField(training.institute_name, "Institute Name") || "N/A",
          subject: formatField(training.subject, "Subject") || "N/A",
          place: formatField(training.place, "Place") || "N/A",
          start_date: formatDate(training.training_from),
          end_date: formatDate(training.training_to),
          documentIds: training.documents || [],
        }))
        : [],
      awards_and_publications: data.ais_rewards?.length
        ? data.ais_rewards.map(reward => ({
          award_name: formatField(reward.rew_name, "Reward Name") || "N/A",
          awarded_by: formatField(reward.rew_from, "Reward From") || "N/A",
          received_date: formatDate(reward.received_on),
          description: formatField(reward.rew_description, "Reward Description") || "N/A",
          documentId: reward.reward_doc || null,
        }))
        : [],
      disability_details: data.ais_officer_disability?.length
        ? data.ais_officer_disability.map(disability => ({
          disability_type: formatField(disability.disability, "Disability") || "N/A",
          disability_percentage: disability.disability_perc || "N/A",
          expiry_date: formatDate(disability.dis_valid_up_to),
          documentId: disability.disability_proof || null,
          udid_number: formatField(disability.udid_number, "UDID Number") || "N/A",
        }))
        : [],
      disciplinary_details: data.ais_suspension_info?.length
        ? data.ais_suspension_info.map(susp => ({
          suspension_reason: formatField(susp.suspension_details, "Suspension Details") || "N/A",
          from_period: formatDate(susp.from_period),
          to_period: formatDate(susp.to_period),
          documentId: susp.suspension_document || null,
        }))
        : [],
      experience_details: data.ais_experience?.length
        ? data.ais_experience.map(exp => ({
          organization: formatField(exp.organization, "Organization") || "N/A",
          designation: formatField(exp.designation, "Designation") || "N/A",
          start_date: formatDate(exp.start_date),
          end_date: formatDate(exp.end_date),
          description: formatField(exp.description, "Description") || "N/A",
        }))
        : [],
    };
  }, []);

  useEffect(() => {
    const fetchOfficerData = async () => {
      try {
        if (roleId !== '5') throw new Error('Unauthorized access. Role 5 required.');
        if (!aisPerId) throw new Error('No profile ID found. Please go back.');

        const response = await axiosInstance.post('/as-II/officer-preview', {
          ais_per_id: aisPerId,
        });

        if (response.data.success) {
          const officerData = response.data.data?.officer_data;
          if (!officerData) throw new Error('No officer info found in response');
          const transformedData = transformOfficerData(officerData);
          setUserDetails(transformedData);
          setEditedDetails(transformedData);
        } else {
          setError(response.data.detail || 'Failed to fetch officer data');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch or process officer data');
      } finally {
        setLoading(false);
      }
    };

    fetchOfficerData();
  }, [aisPerId, transformOfficerData]);

  useEffect(() => {
    const fetchStatusTimeline = async () => {
      if (!aisPerId) return;
      try {
        const response = await axiosInstance.post("/as-II/profile-submit-status", {
          ais_per_id: String(aisPerId),
        });
        if (response.data.success) {
          const statusData = response.data.data.profile_status || [];
          setStatusTimeline(statusData);
        } else {
          setError(response.data.detail || "Failed to fetch status timeline");
        }
      } catch (err) {
        setError(err.message || "Failed to fetch status timeline");
      }
    };

    fetchStatusTimeline();
  }, [aisPerId]);

  const openDocumentModal = async (documentArray) => {
    if (!documentArray || documentArray.length === 0) return;
    setLoadingDocument(true);
    setDocumentError(null);
    const docs = [];
    try {
      for (let i = 0; i < documentArray.length; i++) {
        const documentId = documentArray[i];
        if (!documentId) continue;

        const response = await axiosInstance.get(`/doc-uploader/get-document/${documentId}`, {
          responseType: "blob",
        });
        const url = URL.createObjectURL(response.data);
        const isPdf = response.data.type.includes("pdf");
        docs.push({ id: documentId, url, name: `Document ${i + 1}`, isPdf });
      }
      setDocumentData(docs);
      setCurrentDocIndex(0);
      setDocumentModalOpen(true);
    } catch (error) {
      console.log("Document fetch error:", error);
      setDocumentError("Failed to load documents");
      toast.error("Failed to load documents");
    } finally {
      setLoadingDocument(false);
    }
  };

  const closeDocumentModal = () => {
    if (documentData) {
      documentData.forEach(doc => {
        if (doc.url) URL.revokeObjectURL(doc.url);
      });
    }
    setDocumentModalOpen(false);
    setDocumentData(null);
    setDocumentError(null);
    setCurrentDocIndex(0);
  };

  const getDisplayStatus = (actionKey) => {
    switch (actionKey?.toLowerCase()) {
      case 'submit': return 'Submitted';
      case 'resubmit': return 'Resubmitted';
      case 'approve':
      case 'approved': return 'Approved';
      case 'return_for_correction': return 'Returned for Correction';
      default: return 'Pending';
    }
  };

  const formatField = (value) => {
    if (!value || typeof value !== 'string') return value;
    return value;
  };

  const getStatusColor = (status) => {
    const lowerStatus = status.toLowerCase();
    switch (lowerStatus) {
      case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'returned':
      case 'return_for_correction':
      case 'returned for correction': return 'bg-red-50 text-red-700 border-red-200';
      case 'submitted': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'resubmitted': return 'bg-indigo-50 text-indigo-700 border-indigo-300';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const latestStatus = statusTimeline.find(status => status.is_current) || statusTimeline[statusTimeline.length - 1] || {};
  const isActionAllowed = ['submit', 'resubmit'].includes(latestStatus.action_key?.toLowerCase());
  const currentStatus = latestStatus.action_key ? getDisplayStatus(latestStatus.action_key) : userDetails?.personal_details?.Status || 'Pending';
  const allowedCharsRegex = /^[A-Za-z0-9\s().,\/-]+$/;

  const validateRemarkChars = (value) => {
    return allowedCharsRegex.test(value);
  };

  const handleActionClick = (action) => {
    const trimmedRemark = remark.trim();
    if (trimmedRemark.length < 5) { /* error */ return; }
    if (trimmedRemark.length > 150) { /* error */ return; }
    if (!validateRemarkChars(remark)) {  // ← NEW: Char validation
      setRemarkError('Remarks can only contain letters, numbers, spaces, and these characters: ( ) . , - /');
      return;
    }
    if (!['approve', 'return_for_correction'].includes(action)) {
      setRemarkError('Invalid action selected. Please try again.');
      return;
    }
    setRemarkError('');
    setConfirmationAction(action);
    setShowConfirmationModal(true);
  };

  const handleConfirmAction = async () => {
    console.log("confirmed");
    if (confirmationAction === 'approve') {
      console.log("approving with otp");
      console.log("loggedInUser===", loggedInUser);
      console.log("mobileNo===", mobileNo);
      console.log("fullName===", fullName);
      if (mobileNo && fullName) {
        console.log("requesting otp");
        const response = await axiosInstance.post('evc/otp/request', {
          phone: mobileNo,
          actor: String(fullName),
          role: roleId,
        });
        console.log("otp response===", response);
        if (response.data.success) {
          setOtpId(response.data.data?.otp_id)
          setShowConfirmationModal(false);
          setShowOtpModal(true);
        }
      }
    } else {
      setShowConfirmationModal(false);
      await handleSubmitAction();
      if(mobileNo){
        toast.error("Mobile number is missing");
      }
    }
  };

  const handleOtpVerfication = async (otp) => {
    setIsOtpClicked(true);
    try {
      const response = await axiosInstance.post('evc/otp/verify', {
        otp_id: otpId,
        otp,
        actor: String(fullName),
      });

      if (response.data.success) {
        setShowOtpModal(false);
        toast.success('OTP Verified');
        await handleSubmitAction(); // optional await
      } else {
        toast.error('OTP verification failed');
      }
    } catch (error) {
      console.error(error);
      toast.error('OTP verification error');
    } finally {
      setIsOtpClicked(false);
    }
  };

  const handleSubmitAction = async () => {
    const trimmedRemark = remark.trim();
    if (trimmedRemark.length < 5) {
      setRemarkError('Remarks must be at least 5 characters long.');
      setSignerPortModalOpen(false);
      return;
    }
    if (trimmedRemark.length > 150) {
      setRemarkError('Remarks cannot exceed 150 characters.');
      setSignerPortModalOpen(false);
      return;
    }
    if (!validateRemarkChars(remark)) {
      setRemarkError('Remarks can only contain letters, numbers, spaces, and these characters: ( ) . , - /');
      setSignerPortModalOpen(false);
      return;
    }
    if (!['approve', 'return_for_correction'].includes(confirmationAction)) {
      alert('Invalid action. Please select Approve or Return for Correction.');
      setShowConfirmationModal(false);
      setConfirmationAction('');
      setSignerPortModalOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      let pdfFile = null;
      let docNum = null;
      console.log("Submitting action:", confirmationAction);
      // Check if document number exists before proceeding
      if (!documentNumber) {
        throw new Error('No officer profile document found. Cannot proceed with approval.');
      }
      if (confirmationAction === 'approve') {
        const pdfGen = await pdfGenerator({ requestType: 'approve', userDetails, setIsDownloading, documentNumber, aisPerId });
        if (pdfGen.success && pdfGen.file && pdfGen.docNum) {

          pdfFile = pdfGen.file;
          docNum = pdfGen.docNum;
          const formData = new FormData();
          formData.append("file", pdfFile);
          const responsefileUpload = await axiosInstanceFile.post('evc/documents/upload', formData);

          if (responsefileUpload.data.detail === "Document Uploaded") {
            const signresponse = await axiosInstance.post('evc/esign/start', {
              otp_id: otpId,
              doc_id: responsefileUpload.data.data.doc_id,
              actor: String(fullName),
              reason: "ER Profile Approved"
            });
            if(!signresponse.signed){
              throw new Error('Failed to initiate e-sign process');
            }

            const signfile = await axiosInstance.get(`evc/documents/${responsefileUpload.data.data.doc_id}/signed`,
              {
                responseType: "blob"
              });
            console.log("signfile===", signfile)
            const blob = new Blob([signfile.data], { type: "application/pdf" });
            const signedFile = new File(
              [blob],
              pdfFile.name.replace(/\.pdf$/i, "_signed.pdf"),
              { type: "application/pdf" }
            );

            const saveResult = await saveDocument(
              signedFile,
              confirmationAction,
              docNum,
              aisPerId
            );
            if (!saveResult.success) {
              throw new Error('Failed to save signed document');
            }
            const url = window.URL.createObjectURL(blob);
            window.open(url, "_blank");
          }
        }
      }
      const response = await axiosInstance.post('/as-II/profile-status-change', {
        ais_per_id: aisPerId,
        action: confirmationAction,
        remarks: remark,
      });
      console.log("Profile status response:", response);
      setShowConfirmationModal(false);
      setRemark('');
      const refreshResponse = await axiosInstance.post('/as-II/officer-preview', {
        ais_per_id: aisPerId,
      });
      if (refreshResponse.data.success) {
        const officerData = refreshResponse.data.data?.officer_data;
        const transformedData = transformOfficerData(officerData);
        const displayStatus = getDisplayStatus(confirmationAction);
        const updatedDetails = {
          ...transformedData,
          personal_details: {
            ...transformedData.personal_details,
            Status: displayStatus,
          },
        };
        setUserDetails(updatedDetails);
        setEditedDetails(updatedDetails);
      }
      const statusResponse = await axiosInstance.post("/as-II/profile-submit-status", {
        ais_per_id: aisPerId,
      });
      if (statusResponse.data.success) {
        setStatusTimeline(statusResponse.data.data.profile_status || []);
      }
      if (confirmationAction === 'approve') {
        toast.success('Profile approved successfully!');
      } else {
        toast.warning('Profile returned for correction successfully!');
      }
    } catch (err) {
      alert(`Failed to perform ${confirmationAction} action: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
      setConfirmationAction('');
    }
  };

  const handleSaveChanges = async () => {
    setIsSubmitting(true);
    try {
      const flattenedData = flattenOfficerData(editedDetails);
      const response = await axiosInstance.post('/as-II/update-officer', {
        ais_per_id: aisPerId,
        ...flattenedData,
      });

      if (response.data.success) {
        const refreshResponse = await axiosInstance.post('/as-II/officer-preview', { ais_per_id: aisPerId });
        if (refreshResponse.data.success) {
          const refreshedData = transformOfficerData(refreshResponse.data.data.officer_data);
          setUserDetails(refreshedData);
          setEditedDetails(refreshedData);
        }
        setIsEditing(false);
        alert('Changes saved successfully!');
      } else {
        throw new Error(response.data.detail || 'Save failed');
      }
    } catch (err) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setConfirmationAction('');
      setSignerPortModalOpen(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedDetails(userDetails);
    setIsEditing(false);
  };

  const flattenOfficerData = () => {
    const officerInfo = {};
    return {
      ais_officer_info: officerInfo,
    };
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    if (currentStatus === 'pending') {
      pdfGenerator({ requestType: 'preview', userDetails, setIsDownloading });
      setIsDownloading(false);
      return;
    }
    else {
      console.log("PEN===", userDetails.personal_details.PEN);
      try {
        const resp = await axiosInstance.post('/file-uploader/fetch-signed-pdf', {
          pen_number: userDetails.personal_details.PEN,
        }, {
          responseType: 'blob',
        });
        console.log('Signed PDF response:', resp);
        // if (resp.status === 200) {
        const pdfBlob = new Blob([resp.data], { type: 'application/pdf' });
        const fileName = `${userDetails.full_name.replace(/ /g, "_")}_profile.pdf`;
        downloadFile(pdfBlob, fileName);
        // } else {
        //   toast.error(resp.data.detail || 'Failed to fetch signed PDF');
        // }
      } catch (error) {
        console.error("Error downloading signed PDF:", error);
        if (error?.response) {
          const data = error.response.data;

          // Case 1: Axios already parsed JSON (rare, but possible)
          if (typeof data === 'object' && data?.detail) {
            toast.error(data.detail);
            return;
          }

          // Case 2: JSON wrapped inside Blob (because responseType = 'blob')
          if (data instanceof Blob && data.type === 'application/json') {
            const text = await data.text();
            const json = JSON.parse(text);
            toast.error(json.detail);
            return;
          }

          toast.error(`Request failed (${error.response.status})`);
          return;
        }
        toast.error('Failed to download signed PDF');
      }
      finally {
        setIsDownloading(false);
      }
    }
  };

  useEffect(() => {
    const fetchOfficerProfileDocument = async () => {
      try {
        const response = await axiosInstance.post('/as-II/get-officer-profile-document', {
          ais_per_id: aisPerId,
        });
        if (response.data.success) {
          const docNum = response.data.data?.document_number;
          if (docNum) {
            setDocumentNumber(docNum);
            setProfileDocumentError(null);
          } else {
            setDocumentNumber(null);
            setProfileDocumentError('No officer profile document found. Please ensure the profile has been properly submitted.');
          }
        } else {
          setDocumentNumber(null);
          setProfileDocumentError(response.data.detail || "Failed to fetch profile document");
        }
      } catch (err) {
        console.error('Error fetching profile document:', err);
        setDocumentNumber(null);
        setProfileDocumentError(err.message || 'Error occurred while fetching profile document');
      }
    };

    if (aisPerId) {
      fetchOfficerProfileDocument();
    }
  }, [aisPerId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (!userDetails) return <div className="text-center py-10">No officer data found</div>;

  // ModernCardSection Component (Updated to handle dependents consistently)
  const ModernCardSection = ({ title, data, icon, onViewDocument }) => {
    const formatFieldName = (key) => {
      return key
        .replace(/_/g, " ")
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    if (!data || data.length === 0) return null;

    const getCardTitle = (item, index) => {
      if (item.relation) {
        const isDeceased = item.is_alive === false || item.death_date;
        const isDivorced = item.divorce_date || item.relation.includes('Divorced');
        const isCurrentSpouse = item.relation.includes('Current') || (item.relation === 'Spouse' && !isDeceased && !isDivorced);

        let status = '';
        if (isDeceased) status = ' (Deceased)';
        else if (isDivorced) status = ' (Divorced)';
        else if (isCurrentSpouse) status = ' (Current)';
        else if (item.is_from_history) status = ' (Previous)';

        let title = `${item.relation}${status} - ${item.name}`;
        if (isDeceased && item.death_date) {
          title += ` (Died: ${formatDate(item.death_date)})`;
        }

        return title;
      }
      if (item.qualification) return item.qualification;
      if (item.designation) return item.designation;
      if (item.training_name) return item.training_name;
      if (item.award_name) return item.award_name;
      if (item.disability_type) return item.disability_type;
      if (item.suspension_reason) return `Disciplinary Case ${index + 1}`;
      return `Entry ${index + 1}`;
    };

    const getDocumentIds = (item) => {
      const docs = [];

      // For dependents, check all document fields
      if (item.relation) {
        if (item.death_certificate) docs.push(item.death_certificate);
        if (item.marriage_certificate_proof) docs.push(item.marriage_certificate_proof);
        if (item.sup_doc_for_remv) docs.push(item.sup_doc_for_remv);
      }
      // For other sections
      else if (item.documentIds) {
        docs.push(...item.documentIds);
      } else if (item.documentId) {
        docs.push(item.documentId);
      }

      return docs.filter(Boolean); // Remove null/undefined
    };

    const getDisplayFields = (item) => {
      const fields = {};

      // For dependents, create custom display fields
      if (item.relation) {
        fields["Name"] = item.name;
        fields["Date of Birth"] = formatDate(item.date_of_birth);
        fields["Gender"] = item.gender;

        // Only show email and mobile if they have values
        if (item.email && item.email !== "N/A") fields["Email"] = item.email;
        if (item.mobile_number && item.mobile_number !== "N/A") fields["Mobile"] = item.mobile_number;

        if (item.ais_officer === 'Yes' || item.ais_officer === true) {
          fields["AIS Officer"] = "Yes";
        }
        if (item.government_servant === 'Yes' || item.government_servant === true) {
          fields["Government Servant"] = "Yes";
        }
        if (item.institution && item.institution !== "N/A") {
          fields["Institution"] = item.institution;
        }
        if (item.occupation && item.occupation !== "N/A") {
          fields["Occupation"] = item.occupation;
        }

        // Add status fields for spouses
        const isSpouse = item.relation.toLowerCase().includes('spouse');
        if (isSpouse) {
          if (item.is_alive === false || item.death_date) {
            fields["Status"] = "Deceased";
            if (item.death_date) {
              fields["Date of Death"] = formatDate(item.death_date);
            }
          } else if (item.divorce_date || item.relation.includes('Divorced')) {
            fields["Status"] = "Divorced";
            if (item.divorce_date) {
              fields["Date of Divorce"] = formatDate(item.divorce_date);
            }
          } else if (item.relation.includes('Current') || item.relation === 'Spouse') {
            fields["Status"] = "Current";
          }
        }

        // Add parent info for children
        const isChild = item.relation?.toLowerCase().includes('son') ||
          item.relation?.toLowerCase().includes('daughter') ||
          item.relation?.toLowerCase().includes('child');
        if (isChild && item.parent_name && item.parent_name !== "N/A") {
          fields["Parent"] = item.parent_name;
        }

        // Add Date Of Death for deceased dependents (non-spouse)
        if (!isSpouse && (item.is_alive === false || item.death_date)) {
          fields["Status"] = "Deceased";
          if (item.death_date) {
            fields["Date of Death"] = formatDate(item.death_date);
          }
        }

        // Add previous spouse indicator
        if (item.is_from_history) {
          fields["Type"] = "Previous Relationship";
        }
      } else {
        // For other sections, use existing logic
        Object.entries(item)
          .filter(([key]) => !['documentId', 'documentIds', 'death_certificate', 'marriage_certificate_proof', 'sup_doc_for_remv', 'is_alive', 'death_date', 'divorce_date', 'father_id', 'mother_id', 'spouse_id', 'parent_name', 'is_from_history'].includes(key))
          .forEach(([key, value]) => {
            // Format date fields in other sections too
            if (typeof value === 'string' && (value.includes('-') || value.includes('/'))) {
              try {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                  const day = String(date.getDate()).padStart(2, '0');
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const year = date.getFullYear();
                  fields[formatFieldName(key)] = `${day}/${month}/${year}`;
                  return;
                }
              } catch (e) {
                // If date parsing fails, use original value
              }
            }
            fields[formatFieldName(key)] = value;
          });
      }

      return fields;
    };

    const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "N/A";
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      } catch (error) {
        console.error("Date formatting error:", error);
        return "N/A";
      }
    };


    return (
      <div className="bg-white rounded-lg shadow-sm border border-indigo-300 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900 
                dark:from-indigo-950 dark:via-indigo-800 dark:to-indigo-950
                text-white dark:text-white px-5 py-3 flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h2 className="font-bold text-base text-white tracking-wide">{title}</h2>
          <span className="ml-auto bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-white border border-white/30">
            {data.length}
          </span>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {data.map((item, index) => {
              const docsArray = getDocumentIds(item);
              const cardTitle = getCardTitle(item, index);
              const displayFields = getDisplayFields(item);

              return (
                <div key={index} className="border border-indigo-300 rounded-lg p-3 bg-gradient-to-br from-white to-indigo-50/30 hover:shadow-md hover:border-indigo-300 transition-all dark:from-gray-800 dark:to-gray-700 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-2.5 pb-2.5 border-b border-indigo-300 dark:border-gray-700">
                    <h3 className="font-bold text-slate-800 text-sm flex-1 dark:text-gray-100">
                      {cardTitle}
                    </h3>
                    {docsArray.length > 0 && (
                      <button
                        onClick={() => onViewDocument && onViewDocument(docsArray)}
                        className="ml-2 px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-xs font-medium rounded-md hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-sm flex items-center gap-1"
                      >
                        <DocumentTextIcon className="w-3.5 h-3.5" />
                        {docsArray.length > 1 ? `${docsArray.length} docs` : 'View Doc'}
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {Object.entries(displayFields)
                      .filter(([key, value]) => value && value !== "N/A" && value !== "")
                      .map(([key, value]) => (
                        <div key={key} className="flex text-xs">
                          <span className="font-medium text-slate-600 w-2/5 flex-shrink-0 dark:text-gray-300">
                            {key}:
                          </span>
                          <span className="text-slate-800 flex-1 break-words dark:text-gray-100">
                            {Array.isArray(value) ? value.join(', ') : (value || "N/A")}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 dark:text-gray-100">
      <div className="mx-auto">
        {/* Profile Document Status Alert */}
        {profileDocumentError && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm dark:bg-yellow-900/30 dark:border-yellow-500">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3" />
              <div className="flex-1">
                <p className="text-sm text-yellow-700 font-medium dark:text-yellow-200">{profileDocumentError}</p>
                <p className="text-xs text-yellow-600 mt-1 dark:text-yellow-300">
                  The profile cannot be approved until a document is properly submitted.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 bg-white border border-indigo-300 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-50 hover:border-indigo-400 transition-all shadow-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.5} />
            Back
          </button>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveChanges}
                  disabled={isSubmitting || isDownloading}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 shadow-sm transition-all"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2.5 bg-white border border-indigo-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-all shadow-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </>
            ) : isActionAllowed ? (
              <button
                onClick={() => {
                  sessionStorage.setItem('editProfileId', aisPerId);
                  router.push('/official/edit-profile');
                }}
                disabled={isSubmitting || isDownloading}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 shadow-sm transition-all"
              >
                Edit Profile
              </button>
            ) : null}

            <button
              onClick={() => handleDownloadPdf()}
              disabled={isDownloading || isSubmitting || profileDocumentError}
              className={`flex items-center gap-2 bg-white border text-sm font-medium px-4 py-2.5 rounded-lg transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 ${profileDocumentError
                ? 'border-yellow-300 text-yellow-700 bg-yellow-50 cursor-not-allowed opacity-70 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-500'
                : 'border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-50 dark:bg-gray-800 dark:text-indigo-300 dark:border-gray-700 dark:hover:bg-gray-700'
                }`}
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="w-4 h-4" strokeWidth={2.5} />
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Profile Card */}
        <div ref={contentRef} className="bg-white shadow-xl rounded-2xl overflow-hidden border border-indigo-300 dark:bg-gray-800 dark:border-gray-700">
          {/* Compact Professional Header */}
         <div className="relative bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900 
                dark:from-indigo-950 dark:via-indigo-800 dark:to-indigo-950
                text-white dark:text-white overflow-hidden">

            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16"></div>
            </div>

            <div className="relative z-10 px-6 py-6">
              <div className="flex flex-col lg:flex-row items-center lg:items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-xl bg-white/10 backdrop-blur-sm p-0.5 shadow-lg border border-white/20">
                    {userDetails.profile_image ? (
                      <div className="w-full h-full rounded-lg overflow-hidden bg-slate-100 dark:bg-gray-700">
                        <img
                          src={userDetails.profile_image}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-lg bg-slate-100 flex items-center justify-center dark:bg-gray-700">
                        <span className="text-slate-400 text-xs dark:text-gray-400">No Image</span>
                      </div>
                    )}
                  </div>
                  {currentStatus === 'Approved' && (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 shadow-lg border-2 border-white">
                      <CheckBadgeIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center lg:text-left">
                  <h1 className="text-2xl font-bold mb-1 drop-shadow-lg">{userDetails.full_name}</h1>
                  <p className="text-indigo-100 text-sm mb-3 drop-shadow">
                    {userDetails.position === "IAS" ? "Indian Administrative Service (IAS)" :
                      userDetails.position === "IFS" ? "Indian Forest Service (IFS)" :
                        userDetails.position === "IPS" ? "Indian Police Service (IPS)" :
                          userDetails.position === "State Service" ? "State Civil Service" :
                            userDetails.position}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                    <span className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium border border-white/20">
                      {userDetails.personal_details["Karmasri ID"]}
                    </span>

                    {/* Enhanced Current Status Display */}
                    <div className="relative group">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm flex items-center gap-1.5 ${getStatusColor(currentStatus)}`}>
                        {/* Status Icon */}
                        {currentStatus === 'Verified' && (
                          <CheckCircleIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                        )}
                        {currentStatus === 'Submitted' && (
                          <ArrowDownTrayIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                        )}
                        {currentStatus === 'Resubmitted' && (
                          <ExclamationCircleIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                        )}
                        {currentStatus === 'Returned for Correction' && (
                          <XMarkIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                        )}
                        {currentStatus === 'Pending' && (
                          <div className="w-3.5 h-3.5 border-2 border-current rounded-full animate-pulse" />
                        )}

                        {/* Status Text */}
                        <span className="font-bold">
                          {currentStatus}
                        </span>

                        {/* Status Badge */}
                        {currentStatus === 'Verified' && (
                          <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            Verified
                          </span>
                        )}
                        {(currentStatus === 'Submitted' || currentStatus === 'Resubmitted') && (
                          <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            ACTION REQUIRED
                          </span>
                        )}
                      </span>

                      {/* Status Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap shadow-xl border border-slate-700">
                        <div className="font-semibold mb-1">Application Status</div>
                        <div className="text-slate-300 dark:text-gray-300">Current: {currentStatus}</div>
                        {(currentStatus === 'Submitted' || currentStatus === 'Resubmitted') && (
                          <div className="text-amber-300 text-[11px] mt-1">⚠️ Requires attention</div>
                        )}
                        <div className="w-2 h-2 bg-slate-900 absolute -bottom-1 left-1/2 transform -translate-x-1/2 rotate-45 border-b border-r border-slate-700"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400"></div>
          </div>

          {/* Content Sections */}
          <div className="p-4 sm:p-6 space-y-4 bg-gradient-to-b from-white to-slate-50 dark:from-gray-900 dark:to-gray-800">
            <ProfessionalSection title="PERSONAL DETAILS" data={userDetails.personal_details} isKeyValue />
            <ProfessionalSection title="ADDRESS DETAILS" data={userDetails.address_details} isAddressList />
            <ModernCardSection title="DEPENDENT DETAILS" data={userDetails.dependent_details} icon="👥" onViewDocument={openDocumentModal} />
            <ModernCardSection title="EDUCATIONAL QUALIFICATIONS" data={userDetails.educational_qualifications} icon="🎓" />
            <ModernCardSection title="DEPUTATION DETAILS" data={userDetails.central_deputation} icon="🏛️" />
            <ModernCardSection title="SERVICE DETAILS" data={userDetails.service_details} icon="💼" />
            <ModernCardSection title="TRAINING DETAILS" data={userDetails.training_details} icon="📚" onViewDocument={openDocumentModal} />
            <ModernCardSection title="AWARDS AND PUBLICATIONS" data={userDetails.awards_and_publications} icon="🏆" onViewDocument={openDocumentModal} />
            <ModernCardSection title="DISABILITY DETAILS" data={userDetails.disability_details} icon="♿" onViewDocument={openDocumentModal} />
            <ModernCardSection title="DISCIPLINARY DETAILS" data={userDetails.disciplinary_details} icon="⚖️" onViewDocument={openDocumentModal}/>
            <ModernTimeline title="STATUS TIMELINE" data={statusTimeline} formatDate={formatDate} />
          </div>
        </div>

        {/* Remarks & Action Section */}
        {isActionAllowed && (
          <div className="mt-6 bg-white shadow-lg rounded-xl p-5 sm:p-6 border border-indigo-300 mb-5 dark:bg-gray-800 dark:border-gray-700">
            {/* Profile Document Warning for Approval Actions */}
            {profileDocumentError && (
              <div className="mb-5 bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900 dark:border-red-700 ">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-red-800 font-medium mb-1 dark:text-red-100">Cannot Approve Profile</p>
                    <p className="text-red-700 text-sm dark:text-red-200">{profileDocumentError}</p>
                    <p className="text-red-600 text-xs mt-2 dark:text-red-200">Please contact the officer to ensure their profile document is properly submitted before approval.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-5">
              <label htmlFor="remark" className="block text-base font-bold text-slate-800 mb-3 flex items-center gap-2 dark:text-gray-100">
                <DocumentTextIcon className="w-5 h-5 text-indigo-600" />
                Official Remarks
                <span className="text-red-600">*</span>
              </label>
              <textarea
                id="remark"
                value={remark}
                onChange={(e) => {
                  setRemark(e.target.value);
                  if (remarkError) setRemarkError('');
                }}
                maxLength={150}
                rows={4}
                className="w-full border border-indigo-400 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y bg-indigo-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder:text-gray-400"
                placeholder="Enter your remarks here..."
                disabled={!!profileDocumentError && confirmationAction === 'approve'}
              />
              <div className="flex justify-between items-center mt-2 text-xs text-slate-500 dark:text-gray-300">
                <span>
                  {remark.length}/150 characters
                </span>
                <span className={remark.length < 5 ? 'text-red-500' : remark.length > 150 ? 'text-red-500' : 'text-green-500'}>
                  {remark.length < 5 ? 'Min 5 characters required' : remark.length > 150 ? 'Max exceeded' : 'Valid'}
                </span>
              </div>
              {remarkError && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  {remarkError}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleActionClick('approve')}
                disabled={isSubmitting || isDownloading || !isActionAllowed || profileDocumentError}
                className={`relative flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-5 py-3 rounded-lg transition-all ${isSubmitting || isDownloading || !isActionAllowed || profileDocumentError
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-indigo-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 shadow-md hover:shadow-lg border-2 border-emerald-600'
                  }`}
              >
                {isSubmitting && confirmationAction === 'approve' ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" strokeWidth={2.5} />
                    Approve Profile
                  </>
                )}
              </button>

              <button
                onClick={() => handleActionClick('return_for_correction')}
                disabled={isSubmitting || isDownloading || !isActionAllowed}
                className={`relative flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-5 py-3 rounded-lg transition-all ${isSubmitting || isDownloading || !isActionAllowed
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-indigo-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                  : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg border-2 border-red-600'
                  }`}
              >
                {isSubmitting && confirmationAction === 'return_for_correction' ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <ExclamationTriangleIcon className="w-5 h-5" strokeWidth={2.5} />
                    Return for Correction
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <OTPModal
        isOpen={showOtpModal}
        onClose={() => { setShowOtpModal(false) }}
        onVerify={handleOtpVerfication}
        title="EVC OTP Verification"
        description='Enter OTP'
        isLoading={isOtpClicked}
      />
      <ConfirmModal
        isOpen={showConfirmationModal}
        setIsOpen={setShowConfirmationModal}
        onConfirm={handleConfirmAction}
        title="Confirm Action"
        message={
          <>
            <div className="text-md mt-3">
              Are you sure you want to{' '}
              <strong className="text-gray-700 dark:text-gray-200">{confirmationAction.replace('_', ' ')}</strong> this profile?
            </div>
            <div className="mt-2" />
            <div className="font-bold text-md mb-1 text-gray-700 dark:text-gray-200">
              Remark: <span className="font-medium">{remark || 'None'}</span>
            </div>
            {profileDocumentError && confirmationAction === 'approve' && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/30 dark:border-red-700">
                <p className="text-red-700 text-sm font-medium dark:text-red-200">⚠️ Warning: No officer profile document found!</p>
                <p className="text-red-600 text-xs mt-1 dark:text-red-300">Approval requires a valid profile document. This action may fail.</p>
              </div>
            )}
          </>
        }
        iconType={confirmationAction === 'approve' ? 'success' : 'delete'}
        confirmText={isSubmitting ? 'Submitting...' : 'Confirm'}
      />

      <SignerPortModal
        isOpen={signerPortModalOpen}
        setIsOpen={setSignerPortModalOpen}
        onClose={() => setSignerPortModalOpen(false)}
        onSubmit={(portNumber) => { handleSubmitAction(portNumber) }}
      />

      {/* Enhanced Document Viewer Modal */}
      {documentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col animate-slideUp dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between p-5 border-b border-indigo-300 bg-slate-50 dark:bg-gray-700 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center dark:bg-gray-600">
                  <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100">Document Viewer</h3>
                  {documentData && documentData.length > 0 && (
                    <p className="text-sm text-slate-500 dark:text-gray-300">
                      {documentData[currentDocIndex].name} ({currentDocIndex + 1} of {documentData.length})
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={closeDocumentModal}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-700 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-600"
              >
                <XMarkIcon className="w-6 h-6" strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden bg-slate-100 dark:bg-gray-900">
              {loadingDocument && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-300 border-t-indigo-600"></div>
                  <p className="text-slate-600 dark:text-gray-300">Loading document...</p>
                </div>
              )}
              {documentError && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <ExclamationTriangleIcon className="w-16 h-16 text-red-500" />
                  <p className="text-red-600 font-medium dark:text-red-300">{documentError}</p>
                </div>
              )}
              {documentData && documentData.length > 0 && !loadingDocument && (
                <div className="h-full p-4 overflow-auto">
                  {(() => {
                    const currentDoc = documentData[currentDocIndex];
                    if (currentDoc.isPdf) {
                      return (
                        <embed
                          src={currentDoc.url}
                          type="application/pdf"
                          className="w-full h-full rounded-lg shadow-lg"
                        />
                      );
                    } else {
                      return (
                        <div className="flex items-center justify-center h-full">
                          <img
                            src={currentDoc.url}
                            alt={currentDoc.name}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                          />
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
            </div>

            {documentData && documentData.length > 1 && (
              <div className="p-4 border-t border-indigo-300 bg-slate-50 flex items-center justify-between dark:bg-gray-700 dark:border-gray-700">
                <button
                  onClick={() => setCurrentDocIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentDocIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {documentData.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentDocIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${index === currentDocIndex ? 'bg-indigo-600 w-6' : 'bg-slate-300 hover:bg-slate-400 dark:bg-gray-600 dark:hover:bg-gray-500'
                        }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setCurrentDocIndex(prev => Math.min(documentData.length - 1, prev + 1))}
                  disabled={currentDocIndex === documentData.length - 1}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  Next
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Professional Section Component
const ProfessionalSection = ({ title, data, isKeyValue = false, isAddressList = false }) => {
  if (!data || (Array.isArray(data) && !data.length)) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-indigo-300 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
      <div className=" bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900 
                dark:from-indigo-950 dark:via-indigo-800 dark:to-indigo-950
                text-white px-5 py-3">
        <h2 className="font-bold text-base text-white tracking-wide">{title}</h2>
      </div>

      <div className="p-4">
        {isKeyValue ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="flex border border-indigo-300 rounded-lg overflow-hidden hover:shadow-sm transition-shadow dark:border-gray-700">
                <div className="w-2/5 bg-indigo-50 p-2.5 font-semibold text-slate-700 text-sm border-r border-indigo-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                  {key}
                </div>
                <div className="w-3/5 p-2.5 text-slate-600 text-sm break-words bg-white dark:bg-gray-800 dark:text-gray-100">
                  {value || "N/A"}
                </div>
              </div>
            ))}
          </div>
        ) : isAddressList ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.map((item, index) => (
              <div key={index} className="border border-indigo-300 rounded-lg p-3 bg-indigo-50 hover:shadow-sm transition-shadow dark:bg-gray-700 dark:border-gray-700">
                <div className="font-semibold text-slate-700 mb-2 text-sm flex items-center gap-2 dark:text-gray-200">
                  <div className="w-1 h-4 bg-indigo-600 rounded-full"></div>
                  {item.title}
                </div>
                <div className="text-slate-600 text-sm leading-relaxed pl-3 dark:text-gray-300">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

// Modern Card Section Component
const ModernCardSection = ({ title, data, icon, onViewDocument }) => {
  const formatFieldName = (key) => {
    return key
      .replace(/_/g, " ")
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (!data || data.length === 0) return null;

  const getCardTitle = (item, index) => {
    if (item.relation) return `${item.relation} - ${item.name}`;
    if (item.qualification) return item.qualification;
    if (item.designation) return item.designation;
    if (item.training_name) return item.training_name;
    if (item.award_name) return item.award_name;
    if (item.disability_type) return item.disability_type;
    if (item.suspension_reason) return `Disciplinary Case ${index + 1}`;
    return `Entry ${index + 1}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-indigo-300 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900 
                dark:from-indigo-950 dark:via-indigo-800 dark:to-indigo-950
                text-white dark:text-white px-5 py-3 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h2 className="font-bold text-base text-white tracking-wide">{title}</h2>
        <span className="ml-auto bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-white border border-white/30">
          {data.length}
        </span>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {data.map((item, index) => {
            const docsArray = item.documentIds || (item.documentId ? [item.documentId] : []);
            const cardTitle = getCardTitle(item, index);

            return (
              <div key={index} className="border border-indigo-300 rounded-lg p-3 bg-gradient-to-br from-white to-indigo-50/30 hover:shadow-md hover:border-indigo-300 transition-all dark:from-gray-800 dark:to-gray-700 dark:border-gray-700">
                <div className="flex justify-between items-start mb-2.5 pb-2.5 border-b border-indigo-300 dark:border-gray-700">
                  <h3 className="font-bold text-slate-800 text-sm flex-1 dark:text-gray-100">
                    {cardTitle}
                  </h3>
                  {docsArray.length > 0 && (
                    <button
                      onClick={() => onViewDocument && onViewDocument(docsArray)}
                      className="ml-2 px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-xs font-medium rounded-md hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-sm flex items-center gap-1"
                    >
                      <DocumentTextIcon className="w-3.5 h-3.5" />
                      {docsArray.length > 1 ? `${docsArray.length}` : 'View'}
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {Object.entries(item)
                    .filter(([key]) => !['documentId', 'documentIds'].includes(key) &&
                      !['relation', 'name', 'qualification', 'designation', 'training_name', 'award_name', 'disability_type'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="flex text-xs">
                        <span className="font-medium text-slate-600 w-2/5 flex-shrink-0 dark:text-gray-300">
                          {formatFieldName(key)}:
                        </span>
                        <span className="text-slate-800 flex-1 break-words dark:text-gray-100">
                          {Array.isArray(value) ? value.join(', ') : (value || "N/A")}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Modern Timeline Component
const ModernTimeline = ({ title, data, formatDate }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-indigo-300 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900 
                dark:from-indigo-950 dark:via-indigo-800 dark:to-indigo-950
                text-white dark:text-white px-5 py-3 flex items-center gap-2">
        <span className="text-lg">📋</span>
        <h2 className="font-bold text-base text-white tracking-wide">{title}</h2>
      </div>

      <div className="p-4">
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-400 via-purple-400 to-cyan-400"></div>
          {data.map((status, index) => (
            <div key={index} className="relative flex items-start mb-4 last:mb-0">
              <div className={`absolute left-2.5 w-4 h-4 rounded-full mt-1 z-10 border-2 border-white shadow-md ${status.is_current ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-600'
                }`}></div>
              <div className="ml-10 bg-gradient-to-br from-indigo-50/50 to-white border border-indigo-300 rounded-lg p-4 w-full hover:shadow-md transition-all dark:from-gray-800 dark:to-gray-700 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2.5 gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-sm capitalize dark:text-gray-100">
                      {status.action_key?.replace(/_/g, ' ') || 'Status'}
                    </h3>
                    {status.is_current && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-300">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <span className="text-slate-500 text-xs font-medium bg-white px-2.5 py-1 rounded-md border border-indigo-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                    {status.event_time ? formatDate(status.event_time) : 'N/A'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-slate-600 text-xs dark:text-gray-300">
                  <div className="space-y-1.5">
                    <p className="flex items-start gap-2">
                      <span className="font-semibold text-slate-700 min-w-fit dark:text-gray-200">Remarks:</span>
                      <span className="break-words">{status.remarks || 'N/A'}</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-semibold text-slate-700 min-w-fit dark:text-gray-200">Role:</span>
                      <span className="break-words">{status.assigned_to_role_name || 'N/A'}</span>
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="flex items-start gap-2">
                      <span className="font-semibold text-slate-700 min-w-fit dark:text-gray-200">From:</span>
                      <span className="break-words">{status.from_activity_name || 'N/A'}</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-semibold text-slate-700 min-w-fit dark:text-gray-200">To:</span>
                      <span className="break-words">{status.to_activity_name || 'N/A'}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePreviewPage;
