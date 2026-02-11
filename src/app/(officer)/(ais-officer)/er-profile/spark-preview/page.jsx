"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  UserCircleIcon,
  ArrowDownTrayIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import axiosInstance from "@/utils/apiClient";
import { toast } from "react-toastify";
import {jsPDF} from "jspdf";
import html2canvas from "html2canvas";

const SparkPreviewPage = () => {
  const [loading, setLoading] = useState(true);
  const [sparkData, setSparkData] = useState({});
  const [error, setError] = useState(null);
  const [masterData, setMasterData] = useState({
    recruitment: [], cadre: [], gender: [], state: [], tenure: [], district: [], designation: [], retirement: [], motherTongue: [], languageKnown: [], category: [], bloodGroup: [],
    designations: [], levels: [], ministries: [], departments: [], grades: [], districts: [], postingTypes: [], implementingAgencies: [], states: [], training_types: [], countries: [],
    qualification: [], relationship: [], occupationCategory: [], institution: [], disability_type: [],
  });
  const [personalDetails, setPersonalDetails] = useState({});
  const [familyList, setFamilyList] = useState([]);
  const [educationalList, setEducationalList] = useState([]);
  const [serviceList, setServiceList] = useState([]);
  const [centralDeputationList, setCentralDeputationList] = useState([]);
  const [trainingList, setTrainingList] = useState([]);
  const [awardsList, setAwardsList] = useState([]);
  const [disabilityList, setDisabilityList] = useState([]);
  const [suspensionList, setSuspensionList] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const router = useRouter();
  const contentRef = useRef(null);

  // Mandatory fields definitions
  const mandatoryPersonalFields = [
    'honorifics', 'first_name', 'last_name', 'ais_number', 'email', 'allotment_year',
    'date_of_joining', 'pen_number', 'source_of_recruitment_id', 'cadre_id', 'date_of_birth',
    'gender_id', 'blood_group_id', 'mother_tongue_id', 'service_type_id', 'mobile_no',
    'address_line1_current', 'district_id_current', 'state_id_current', 'pin_code_current',
    'address_line1_permanent', 'district_id_permanent', 'state_id_permanent', 'pin_code_permanent'
  ];

  const mandatoryDependentFields = [
    'relation_id', 'first_name', 'gender_id', 'date_of_birth'
  ];

  const mandatoryEducationFields = [
    "qualification_id", "institute_name", "subject_name"
  ];

 const mandatoryServiceFields = [
  'designation_id', 'level_id', 'ministry_id', 'administrative_department_id',
  'agency_id', 'state_id', 'district_id', 'grade_id', 'posting_type_id',
  'address', 'start_date', 'is_additional_charge','end_date'
];
const mandatoryDeputationFields = [
  "cen_designation", "state_id", "start_date", "tenure_id",
  "cen_min_id", "cen_dept_id", "cen_org_id", "deputation_type"
];
  const mandatoryTrainingFields = [
    "training_name", "training_type_id", "country_id", "institute_name",
    "subject", "place", "training_from", "training_to"
  ];

  const mandatoryAwardsFields = [
    "reward_name", "reward_from", "received_on", "reward_doc"
  ];

   const mandatoryDisabilityFields = [
    "disability_type_id", "disability_proof", "disability_percentage", "disability_valid_up_to"
  ];

   
  // Format date function - returns empty string instead of "N/A"
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Date formatting error:", error);
      return "";
    }
  }, []);

  // Master data field mapping
  const masterFieldMap = {
  departments: {
    id: "administrative_department_id",
    label: "administrative_department",
  },
  implementingAgencies: {
    id: "agency_id",
    label: "agency",
  },
};

 const resolveFieldKeys = (masterKey, data) => {
  // Special handling for implementingAgencies
  if (masterKey === "implementingAgencies") {
    return { id: "agency_id", label: "agency" };
  }
  
  if (masterFieldMap[masterKey]) {
    return masterFieldMap[masterKey];
  }

  const singular = masterKey.replace(/s$/, "");
  const idKey = `${singular}_id`;
  const sample = data?.[0] || {};
  const labelKey =
    Object.keys(sample).find((k) => k !== idKey && k.includes(singular)) || singular;

  return { id: idKey, label: labelKey };
};

  const getMasterName = (value, key) => {
  if (!value) return "";

  const keyMap = {
    source_of_recruitment_id: "recruitment",
    cadre_id: "cadre",
    gender_id: "gender",
    blood_group_id: "bloodGroup",
    mother_tongue_id: "motherTongue",
    languages_known: "languageKnown",
    category_id: "category",
    state_id_current: "states",
    state_id_permanent: "states",
    district_id_current: "districts",
    district_id_permanent: "districts",
    district_id: "districts",
    state_id: "states",
    designation_id: "designations",
    level_id: "levels",
    ministry_id: "ministries",
    department_id: "departments",
    administrative_department_id: "departments", // Add this for service details
    grade_id: "grades",
    posting_type_id: "postingTypes",
    agency_id: "implementingAgencies", // This is important
    training_type_id: "training_types",
    country_id: "countries",
    qualification_id: "qualification",
    disability_type_id: "disability_type",
    relation_id: "relationship",
  };

  const masterKey = keyMap[key];
  if (!masterKey) return value;

  const data = masterData[masterKey] || [];
  if (data.length === 0) return value;

  const { id, label } = resolveFieldKeys(masterKey, data);

  const match = data.find(
    (item) =>
      String(item[id]) === String(value) ||
      String(item[label])?.toLowerCase() === String(value).toLowerCase()
  );

  return match ? match[label] : value;
};

  // Personal details mapping
  const mapSparkDataToPersonalDetails = (sparkData) => {
    const personal = sparkData.personal_details || {};
    const address = sparkData.address_details || {};
    const currentAddress = address.current_address || {};
    const permanentAddress = address.permanent_address || {};

    const normalizeSparkDate = (dateStr) => {
      if (!dateStr) return "";
      const parts = dateStr.split(" ")[0].split("/");
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
      return "";
    };

    const nameParts = personal.name ? personal.name.trim().split(/\s+/) : [];
    const firstName = nameParts.slice(0, -1).join(" ");
    const lastName = nameParts.slice(-1)[0] || "";

    return {
      details: {
        honorifics: "",
        first_name: firstName,
        last_name: lastName,
        date_of_birth: normalizeSparkDate(personal.date_of_birth),
        gender_id: personal.sex || "",
        blood_group_id: personal.blood_group || "",
        email: "",
        alternative_email: "",
        mobile_no: currentAddress.phone_number || "",
        alternative_mobile_no: "",
        identity_number: "",
        pen_number: personal.permanent_emp_no || "",
        ais_number: "",
        pan_no: personal.pan_number || "",
        praan_number: "",
        pf_number: "",
        source_of_recruitment_id: "",
        cadre_id: "",
        allotment_year: "",
        service_type_id: "",
        mother_tongue_id: "",
        languages_known: "",
        category_id: personal.category || "",
        address_line1_current: currentAddress.house_name || "",
        address_line2_com: `${currentAddress.street_name || ""}, ${currentAddress.place || ""}`.trim(),
        district_id_current: currentAddress.district || "",
        state_id_current: currentAddress.state || "",
        pin_code_current: currentAddress.pin || "",
        address_line1_permanent: permanentAddress.house_name || "",
        address_line2_per: `${permanentAddress.street_name || ""}, ${permanentAddress.place || ""}`.trim(),
        district_id_permanent: permanentAddress.district || "",
        state_id_permanent: permanentAddress.state || "",
        pin_code_permanent: permanentAddress.pin || "",
      },
    };
  };

  // Dependents mapping
  const mapSparkDataToDependents = (sparkFamily = [], personalDetails = {}) => {
    const dependents = [];

    sparkFamily.forEach((dep, index) => {
      dependents.push({
        ais_fam_id: `spark_family_${index}`,
        name: dep.name || "",
        relation_id: dep.relation_id || "",
        date_of_birth: dep.dob || "",
        gender_id: dep.gender_id || "",
        category_id: dep.category_id || "",
        institution_name: dep.institution_name || "",
        email_id: dep.email_id || "",
        mobile_number: dep.mobile_number || "",
        first_name: dep.name?.split(" ")[0] || "",
        _source: "SPARK",
      });
    });

    const { father_name, mother_name, spouse_name } = personalDetails;

    if (father_name) {
      dependents.push({
        ais_fam_id: "spark_father",
        name: father_name,
        first_name: father_name.split(" ")[0] || "",
        relation_id: "FATHER",
        date_of_birth: "",
        gender_id: "M",
        category_id: "",
        _source: "SPARK",
      });
    }

    if (mother_name) {
      dependents.push({
        ais_fam_id: "spark_mother",
        name: mother_name,
        first_name: mother_name.split(" ")[0] || "",
        relation_id: "MOTHER",
        date_of_birth: "",
        gender_id: "F",
        category_id: "",
        _source: "SPARK",
      });
    }

    if (spouse_name) {
      dependents.push({
        ais_fam_id: "spark_spouse",
        name: spouse_name,
        first_name: spouse_name.split(" ")[0] || "",
        relation_id: "SPOUSE",
        date_of_birth: "",
        gender_id: "",
        category_id: "",
        _source: "SPARK",
      });
    }

    return dependents;
  };

  const mapSparkDataToEducationalQualifications = (sparkData) => {
    const education = sparkData.education_details || [];
    return education.map((edu, index) => ({
      ais_edu_id: `spark_${index}`,
      qualification_id: masterData.qualification.find(
        (q) => q.qualification?.toLowerCase() === (edu.course_type || "").toLowerCase()
      )?.qualification_id || "",
      raw_qualification: edu.course_type || "",
      subject_name: edu.subject || "",
      institute_name: edu.university || "",
      _source: "SPARK",
      isSaved: false,
    }));
  };

  const mapServiceDetails = (serviceDetails) => {
    const normalize = (str) => str?.toString().trim().toLowerCase() || "";
    return (serviceDetails || []).map((service, index) => {
      const designationMatch = masterData.designations.find(
        (d) => normalize(d.designation) === normalize(service.designation)
      );
      const departmentMatch = masterData.departments.find(
        (d) => normalize(d.administrative_department) === normalize(service.department)
      );
      const districtMatch = masterData.districts.find(
        (d) => normalize(d.district) === normalize(service.district)
      );
      const stateMatch = masterData.states.find(
        (s) => normalize(s.state) === normalize(service.state || "Kerala")
      );

      return {
        ais_ser_id: `spark_${index}`,
        designation_id: designationMatch?.designation_id || null,
        department_id: departmentMatch?.administrative_department_id || null,
        district_id: districtMatch?.district_id || null,
        state_id: stateMatch?.state_id || null,
        start_date: service.date_from || "",
        end_date: service.date_to || "",
        other_details: service.remarks || "",
        order_no: service.order_number || "",
        order_date: service.order_date || "",
        _source: "SPARK",
        isSaved: false,
      };
    });
  };

  const mapSparkDataToDeputations = (deputations) => (deputations || []).map((dep, index) => ({
    cen_dep_id: `spark_${index}`,
    designation: dep.cen_designation || "",
    phone_no: dep.phone_no || "",
    state_id: dep.state_id || "",
    start_date: dep.start_date || "",
    end_date: dep.end_date || "",
    tenure_id: dep.tenure_id || "",
    cen_min_id: dep.cen_min_id || "",
    cen_dept_id: dep.cen_dept_id || "",
    cen_org_id: dep.cen_org_id || "",
    _source: "SPARK",
    isSaved: false,
  }));

  const mapSparkDataToTraining = (trainings) => {
    return (trainings || []).map((train, index) => {
      // Normalize SPARK date format to YYYY-MM-DD
      const normalizeSparkTrainingDate = (dateStr) => {
        if (!dateStr) return "";
        const parts = dateStr.split(" ")[0].split("/");
        if (parts.length === 3) {
          const [day, month, year] = parts;
          return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
        return "";
      };

      return {
        ais_tr_id: `spark_${index}`,
        training_name: train.title || train.training_name || "",
        training_type_id: train.training_type_id || "",
        country_id: train.country || "",
        institute_name: train.conducted_by || train.institute_name || "",
        subject: train.subject || "",
        place: train.city || train.place || "",
        training_from: normalizeSparkTrainingDate(train.from_date),
        training_to: normalizeSparkTrainingDate(train.to_date),
        _source: "SPARK",
        isSaved: false,
      };
    });
  };

  const mapSparkDataToAwards = (sparkData) => (sparkData.awards || []).map((award, index) => ({
    ais_rew_id: `spark_${index}`,
    reward_name: award.nature || "",
    reward_from: (award.office || award.department || "").trim(),
    received_on: "",
    reward_description: award.purpose || "",
    reward_doc: award.upload_certificate || "",
    _source: "SPARK",
    isSaved: false,
  }));

  const mapSparkDataToDisability = (sparkData) => (sparkData.disability || []).map((dis, index) => ({
    ais_des_id: `spark_${index}`,
    disability_type_id: dis.disability_type_id || "",
    disability_percentage: dis.disability_percentage || "",
    disability_valid_up_to: dis.valid_up_to || "",
    disability_proof: dis.upload_certificate || "",
    _source: "SPARK",
    isSaved: false,
  }));

  const mapSuspensionData = (sparkData) => (sparkData.suspension_details || []).map((sus, index) => ({
    ais_sub_id: `spark_${index}`,
    suspension_details: sus.reason || "",
    from_period: sus.from_date || "",
    to_period: sus.to_date || "",
    _source: "SPARK",
    isSaved: false,
  }));

  // Fetch masters
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const responses = await Promise.all([
          axiosInstance.get("/masters/qualification-all"),
          axiosInstance.get("/masters/recruitment-all"),
          axiosInstance.get("/masters/cadre-all"),
          axiosInstance.get("/masters/gender-all"),
          axiosInstance.get("/masters/state-all"),
          axiosInstance.get("/masters/district-all"),
          axiosInstance.get("/masters/designation-all"),
          axiosInstance.get("/masters/retirement-all"),
          axiosInstance.get("/masters/language-all"),
          axiosInstance.get("/masters/language-all"),
          axiosInstance.get("/masters/category-all"),
          axiosInstance.get("/masters/blood-groups"),
          axiosInstance.get("/masters/designation-all"),
          axiosInstance.get("/masters/level-all"),
          axiosInstance.get("/masters/ministry-all"),
          axiosInstance.get("/masters/administrative_department-all"),
          axiosInstance.get("/masters/grade-all"),
          axiosInstance.get("/masters/district-all"),
          axiosInstance.get("/masters/posting_type-all"),
          axiosInstance.get("/masters/agency-all"),
          axiosInstance.get("/masters/state-all"),
          axiosInstance.get("/masters/training_type-all"),
          axiosInstance.get("/masters/country-all"),
          axiosInstance.get("/masters/relation"),
          axiosInstance.get("/masters/institution-all"),
          axiosInstance.get("/masters/disability-all"),
        ]);

        setMasterData({
          qualification: responses[0].data.data.qualification || [],
          recruitment: responses[1].data.data.recruitment || [],
          cadre: responses[2].data.data.cadre || [],
          gender: responses[3].data.data.gender || [],
          state: responses[4].data.data.state || [],
          district: responses[5].data.data.district || [],
          designation: responses[6].data.data.designation || [],
          retirement: responses[7].data.data.retirement || [],
          motherTongue: responses[8].data.data.motherTongue || [],
          languageKnown: responses[9].data.data.languageKnown || [],
          category: responses[10].data.data.category || [],
          bloodGroup: responses[11].data.data.bloodGroup || [],
          designations: responses[12].data.data.designation || [],
          levels: responses[13].data.data.level || [],
          ministries: responses[14].data.data.ministry || [],
          departments: responses[15].data.data.departments || [],
          grades: responses[16].data.data.grade || [],
          districts: responses[17].data.data.district || [],
          postingTypes: responses[18].data.data.posting_type || [],
          implementingAgencies: responses[19].data.data.implementing_agency || [],
          states: responses[20].data.data.state || [],
          training_types: responses[21].data.data.training_type || [],
          countries: responses[22].data.data.country || [],
          relationship: responses[23].data.data.relationship || [],
          institution: responses[24].data.data.institution || [],
          disability_type: responses[25].data.data.disability_type || [],
        });
      } catch (err) {
        setError("Failed to fetch master data");
        toast.error("Failed to fetch master data");
      }
    };
    fetchMasters();
  }, []);

  // Load spark data from session
  useEffect(() => {
    const storedProfile = sessionStorage.getItem("profileData");
    if (storedProfile) {
      const parsed = JSON.parse(storedProfile);
      setSparkData(parsed.spark_data?.data || {});
    }
    setLoading(false);
  }, []);

  // Apply mappings
  useEffect(() => {
    if (Object.keys(sparkData).length > 0 && Object.keys(masterData).length > 0) {
      try {
        setPersonalDetails(mapSparkDataToPersonalDetails(sparkData).details);
        setFamilyList(mapSparkDataToDependents(sparkData.family_details || [], sparkData.personal_details || {}));
        setEducationalList(mapSparkDataToEducationalQualifications(sparkData));
        setServiceList(mapServiceDetails(sparkData.service_details || []));
        setCentralDeputationList(mapSparkDataToDeputations(sparkData.deputation_details || []));
        
        // FIXED: Access trainingList from sparkData (note the capital L)
        setTrainingList(mapSparkDataToTraining(sparkData.trainingList || []));
        
        setAwardsList(mapSparkDataToAwards(sparkData));
        setDisabilityList(mapSparkDataToDisability(sparkData));
        setSuspensionList(mapSuspensionData(sparkData));
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError("Error processing SPARK data");
        setLoading(false);
      }
    }
  }, [sparkData, masterData]);

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    setIsDownloading(true);

    try {
      // Ensure layout is stable
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 250));

      const element = contentRef.current;

      const canvas = await html2canvas(element, {
        scale: 1.5,                 // ✔ balanced quality
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        logging: false,
        ignoreElements: (el) =>
          el?.hasAttribute?.("data-html2canvas-ignore"),
        onclone: (doc) => {
          const overlay = doc.querySelector("[data-pdf-overlay]");
          if (overlay) overlay.style.display = "none";
        },
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.9);

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Image dimensions in PDF
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let remainingHeight = imgHeight;
      let yPosition = 0;

      // First page
      pdf.addImage(imgData, "JPEG", 0, yPosition, imgWidth, imgHeight);
      remainingHeight -= pdfHeight;

      // Additional pages
      while (remainingHeight > 0) {
        yPosition = remainingHeight - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, yPosition, imgWidth, imgHeight);
        remainingHeight -= pdfHeight;
      }

      pdf.save(
        `SPARK_Preview_${personalDetails.pen_number || "Officer"}_${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );

      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFieldName = (key) => {
  // Special handling for specific field labels
  if (key === "agency_id") return "Office";
  if (key === "cen_dept_id") return "Department";
  if (key === "cen_org_id") return "Office";
  if (key === "cen_min_id") return "Ministry";
  
  return key
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .replace(" Id", "")
    .replace(/Id$/i, "");
};

  const getRelationDisplay = (relationId) => {
    if (!relationId) return "";
    if (["FATHER", "MOTHER", "SPOUSE"].includes(relationId.toUpperCase())) {
      return relationId.charAt(0).toUpperCase() + relationId.slice(1).toLowerCase();
    }
    return getMasterName(relationId, "relation_id") || relationId;
  };

  // Helper to check if a field is mandatory in a section
  const isFieldMandatory = (section, field) => {
    switch (section) {
      case "personal":
        return mandatoryPersonalFields.includes(field);
      case "dependent":
        return mandatoryDependentFields.includes(field);
      case "education":
        return mandatoryEducationFields.includes(field);
      case "service":
        return mandatoryServiceFields.includes(field);
      case "deputation":
        return mandatoryDeputationFields.includes(field);
      case "training":
        return mandatoryTrainingFields.includes(field);
      case "awards":
        return mandatoryAwardsFields.includes(field);
      case "disability":
        return mandatoryDisabilityFields.includes(field);
      default:
        return false;
    }
  };
  // PDF Download Loading Overlay - Simple Version (rendered inside main layout)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <ExclamationCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-lg text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 dark:text-gray-100">
      {isDownloading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          data-pdf-overlay
          data-html2canvas-ignore="true"
        >
          <div className="bg-white rounded-xl p-8 shadow-2xl max-w-sm w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <DocumentTextIcon className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Generating PDF</h3>
              <p className="text-gray-600 text-center mb-6">Please wait while we prepare your document...</p>
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 bg-white border border-indigo-300 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.5} />
            Back
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className={`flex items-center gap-2 border text-sm font-medium px-4 py-2.5 rounded-lg transition-all shadow-sm ${
              isDownloading
                ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                : "bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 dark:bg-gray-800 dark:border-gray-700 dark:text-indigo-300 dark:hover:bg-gray-700"
            }`}
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
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

        {/* Main Content */}
        <div ref={contentRef} className="bg-white shadow-xl rounded-2xl overflow-hidden border border-indigo-300 dark:bg-gray-800 dark:border-gray-700">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16"></div>
            </div>

            <div className="relative z-10 px-6 py-6">
              <div className="flex flex-col lg:flex-row items-center lg:items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-xl bg-white/10 backdrop-blur-sm p-0.5 shadow-lg border border-white/20">
                    <div className="w-full h-full rounded-lg bg-slate-100 flex items-center justify-center">
                      <UserCircleIcon className="w-12 h-12 text-indigo-400" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                    <h1 className="text-2xl font-bold drop-shadow-lg">SPARK Data Preview</h1>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-300 ml-2">
                      SPARK
                    </span>
                  </div>
                  <p className="text-indigo-100 text-sm mb-3 drop-shadow">Imported data from SPARK system</p>
                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                    <span className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium border border-white/20">
                      PEN: {personalDetails.pen_number || ""}
                    </span>
                    <span className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium border border-white/20">
                      Name: {personalDetails.first_name} {personalDetails.last_name}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400"></div>
          </div>

          {/* Content Sections */}
          <div className="p-4 sm:p-6 space-y-4 bg-gradient-to-b from-white to-slate-50 dark:from-gray-900 dark:to-gray-800">
            <ProfessionalSection
              title="PERSONAL DETAILS"
              data={personalDetails}
              getMasterName={getMasterName}
              formatFieldName={formatFieldName}
              isFieldMandatory={(field) => isFieldMandatory("personal", field)}
            />

            <TwoColumnDetailSection
              title="FAMILY MEMBERS"
              data={familyList}
              fields={["name", "relation_id", "date_of_birth", "gender_id", "category_id", "institution_name", "email_id", "mobile_number"]}
              getMasterName={getMasterName}
              formatDate={formatDate}
              formatFieldName={formatFieldName}
              getRelationDisplay={getRelationDisplay}
              isFieldMandatory={(field) => isFieldMandatory("dependent", field)}
              icon="👨‍👩‍👧‍👦"
              showEmptyStructure={true}
            />

            <TwoColumnDetailSection
              title="EDUCATIONAL QUALIFICATIONS"
              data={educationalList}
              fields={["qualification_id", "subject_name", "institute_name"]}
              getMasterName={getMasterName}
              formatFieldName={formatFieldName}
              isFieldMandatory={(field) => isFieldMandatory("education", field)}
              icon="🎓"
              showEmptyStructure={true}
            />

           {/* SERVICE DETAILS section */}
{/* SERVICE DETAILS section */}
{serviceList.length > 0 && (
  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
    <div className="flex items-center">
      <ExclamationCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
      <p className="text-sm text-blue-800">
        <span className="font-semibold">Note:</span> For service periods starting from 2020 onwards, 
        <span className="font-bold text-red-600"> Order No and Order Date are mandatory fields.</span>
      </p>
    </div>
  </div>
)}
<TwoColumnDetailSection
  title="SERVICE DETAILS"
  data={serviceList}
  fields={[
    "designation_id", "level_id", "grade_id", "ministry_id", 
    "administrative_department_id", "agency_id", "state_id", 
    "district_id", "posting_type_id", "address", "phone_no", 
    "is_additional_charge", "basic_pay", "start_date", "end_date", 
    "order_no", "order_date", "other_details"
  ]}
  getMasterName={getMasterName}
  formatDate={formatDate}
  formatFieldName={formatFieldName}
  isFieldMandatory={(field) => isFieldMandatory("service", field)}
  icon="💼"
  showEmptyStructure={true}
  customDisplayHandlers={{
    is_additional_charge: (value) => value === true || value === 'yes' ? 'Yes' : 'No',
    basic_pay: (value) => value ? `₹${value}` : '',
    address: (value) => value || '',
    phone_no: (value) => value || '',
    other_details: (value) => value || ''
  }}
  specialIndicators={{
    order_no: {
      indicator: "⚠️",
      tooltip: "Mandatory for services from 2020 onwards"
    },
    order_date: {
      indicator: "⚠️",
      tooltip: "Mandatory for services from 2020 onwards"
    }
  }}
/>

{/* Simple mandatory note for 2020+ services */}


           <TwoColumnDetailSection
  title="DEPUTATION DETAILS"
  data={centralDeputationList}
  fields={[
    "cen_designation", "phone_no", "state_id", "start_date", 
    "end_date", "tenure_id", "cen_min_id", "cen_dept_id", 
    "cen_org_id", "deputation_type"
  ]}
  getMasterName={getMasterName}
  formatDate={formatDate}
  formatFieldName={formatFieldName}
  isFieldMandatory={(field) => isFieldMandatory("deputation", field)}
  icon="🏛️"
  showEmptyStructure={true}
  customDisplayHandlers={{
    phone_no: (value) => value || '',
    cen_designation: (value) => value || '',
    deputation_type: (value) => value || ''
  }}
/>

            <TwoColumnDetailSection
              title="TRAINING"
              data={trainingList}
              fields={["training_name", "training_type_id", "country_id", "institute_name", "subject", "place", "training_from", "training_to"]}
              getMasterName={getMasterName}
              formatDate={formatDate}
              formatFieldName={formatFieldName}
              isFieldMandatory={(field) => isFieldMandatory("training", field)}
              icon="📚"
              showEmptyStructure={true}
            />

            <TwoColumnDetailSection
              title="AWARDS"
              data={awardsList}
              fields={["reward_name", "reward_from", "received_on", "reward_description"]}
              getMasterName={getMasterName}
              formatDate={formatDate}
              formatFieldName={formatFieldName}
              isFieldMandatory={(field) => isFieldMandatory("awards", field)}
              icon="🏆"
              showEmptyStructure={true}
            />

            <TwoColumnDetailSection
              title="DISABILITY"
              data={disabilityList}
              fields={["disability_type_id", "disability_percentage", "disability_valid_up_to"]}
              getMasterName={getMasterName}
              formatDate={formatDate}
              formatFieldName={formatFieldName}
              isFieldMandatory={(field) => isFieldMandatory("disability", field)}
              icon="♿"
              showEmptyStructure={true}
            />

            <TwoColumnDetailSection
              title="SUSPENSION"
              data={suspensionList}
              fields={["suspension_details", "from_period", "to_period"]}
              getMasterName={getMasterName}
              formatDate={formatDate}
              formatFieldName={formatFieldName}
              icon="🚫"
              showEmptyStructure={true}
            />

            <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-300 text-center text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-indigo-400" />
                <p>No timeline data from SPARK</p>
              </div>
            </div>
          </div>

          {/* Mandatory field footer */}
          {/* Updated mandatory field footer with special indicators explanation */}
<div className="bg-indigo-50 border-t border-indigo-200 p-4 dark:bg-gray-800 dark:border-gray-700">
  <div className="text-center text-sm text-indigo-800 mb-3 dark:text-indigo-200">
    <p className="mb-2">
      <span className="text-red-600 font-bold">* </span> 
      Indicates mandatory fields to record/save the information in KARMASRI portal.
    </p>
  </div>
  
  {/* Special indicator explanation */}
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 dark:bg-yellow-900/20 dark:border-yellow-700">
    <div className="flex items-center justify-center gap-2">
   
      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
       <span className="font-bold">⚠️</span> <span className="font-bold text-red-600"> Order No and Order Date are mandatory for service periods starting from 2020 onwards.</span>
      </p>
    </div>
    
  </div>
  
  {/* Legend section */}
  <div className="flex flex-wrap justify-center gap-3 mt-3">
    <div className="flex items-center gap-1">
      <div className="w-3 h-3 rounded-full bg-red-600"></div>
      <span className="text-xs text-gray-700 dark:text-gray-300">Mandatory Field</span>
    </div>
    <div className="flex items-center gap-1">
      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
      <span className="text-xs text-gray-700 dark:text-gray-300">Conditionally Mandatory (2020+)</span>
    </div>
    <div className="flex items-center gap-1">
      <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
      <span className="text-xs text-gray-700 dark:text-gray-300">Standard Field</span>
    </div>
  </div>
</div>
        </div>

        {/* Note Section */}
        <div className="mt-6 bg-white shadow-lg rounded-xl p-5 sm:p-6 border border-indigo-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <ExclamationCircleIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 mb-2">About SPARK Data</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                This preview shows data imported from the SPARK system. Review the information carefully.
                You can merge this data with your existing profile or use it to update your information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Updated ProfessionalSection to always show fields if no data
const ProfessionalSection = ({ title, data, getMasterName, formatFieldName, isFieldMandatory }) => {
  const allFields = [
    'honorifics', 'first_name', 'last_name', 'ais_number', 'email', 'allotment_year',
    'date_of_joining', 'pen_number', 'source_of_recruitment_id', 'cadre_id', 'date_of_birth',
    'gender_id', 'blood_group_id', 'mother_tongue_id', 'service_type_id', 'mobile_no',
    'address_line1_current', 'district_id_current', 'state_id_current', 'pin_code_current',
    'address_line1_permanent', 'district_id_permanent', 'state_id_permanent', 'pin_code_permanent'
  ]; // Use mandatory as proxy for all relevant fields

  const hasData = Object.keys(data || {}).length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-indigo-300 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900 px-5 py-3">
        <h2 className="font-bold text-base text-white tracking-wide">{title}</h2>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {allFields.map((key) => {
            const value = hasData ? (getMasterName(data[key], key) || data[key] || "") : "";

            return (
              <div
                key={key}
                className="flex border border-indigo-300 rounded-lg overflow-hidden hover:shadow-sm transition-shadow"
              >
                <div className="w-2/5 bg-indigo-50 p-2.5 font-semibold text-slate-700 text-sm border-r border-indigo-300 flex items-center dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                  {formatFieldName(key)}
                  {isFieldMandatory(key) && <span className="text-red-600 font-bold ml-1">*</span>}
                </div>
                <div className="w-3/5 p-2.5 text-slate-600 text-sm break-words bg-white dark:bg-gray-800 dark:text-gray-100">
                  {hasData ? value : "Not available"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const TwoColumnDetailSection = ({
  title,
  data = [],
  fields,
  getMasterName,
  formatDate,
  formatFieldName,
  getRelationDisplay,
  isFieldMandatory,
  icon,
  showEmptyStructure = false,
  customDisplayHandlers = {},
  specialIndicators = {}, // Add this new prop
}) => {
  const hasData = data.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-indigo-300 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900 px-5 py-3 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h2 className="font-bold text-base text-white tracking-wide">{title}</h2>
        <span className="ml-auto bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-white border border-white/30">
          {data.length}
        </span>
      </div>

      <div className="p-4">
        {hasData ? (
          data.map((item, index) => {
            const isLast = index === data.length - 1;

            let entryTitle = `Entry ${index + 1}`;
            
            // Determine title based on section
            if (title.includes("FAMILY")) {
              entryTitle = getRelationDisplay?.(item.relation_id) || item.name || `Member ${index + 1}`;
            } else if (title.includes("SERVICE")) {
              entryTitle = getMasterName(item.designation_id, "designation_id") || 
                          getMasterName(item.designation_id, "designation") || 
                          `Service ${index + 1}`;
              // Add date range to title for service entries
              const startDate = formatDate ? formatDate(item.start_date) : item.start_date;
              const endDate = formatDate ? formatDate(item.end_date) : item.end_date;
              if (startDate) {
                entryTitle += ` (${startDate}${endDate ? ` - ${endDate}` : ' - Ongoing'})`;
              }
              
              // Add special note for 2020+ services
              if (item.start_date) {
                const startYear = new Date(item.start_date).getFullYear();
                if (startYear >= 2020) {
                  entryTitle += ` [2020+ ⚠️]`;
                }
              }
            } else if (item.qualification_id) {
              entryTitle = getMasterName(item.qualification_id, "qualification_id") || `Entry ${index + 1}`;
            } else if (item.training_name) {
              entryTitle = item.training_name;
            } else if (item.reward_name) {
              entryTitle = item.reward_name;
            } else if (item.disability_type_id) {
              entryTitle = getMasterName(item.disability_type_id, "disability_type_id") || `Entry ${index + 1}`;
            }

            return (
              <div key={index} className={`mb-6 ${!isLast ? "pb-6 border-b border-indigo-200 dark:border-gray-700" : ""}`}>
                <h3 className="text-sm font-semibold text-indigo-800 mb-3 dark:text-indigo-300">{entryTitle}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {fields.map((key) => {
                    let value = item[key] || "";

                    // Apply custom display handlers if they exist
                    if (customDisplayHandlers && customDisplayHandlers[key]) {
                      value = customDisplayHandlers[key](item[key]);
                    }
                    // Special handling for relation_id
                    else if (key === "relation_id" && getRelationDisplay) {
                      value = getRelationDisplay(item[key]);
                    } 
                    // Handle date fields
                    else if ((key.includes("date") || key.includes("from") || key.includes("to") || 
                             key.includes("period") || key === "start_date" || key === "end_date" || 
                             key === "order_date" || key === "training_from" || key === "training_to") && formatDate) {
                      value = formatDate(item[key]);
                    } 
                    // Handle master data fields
                    else if (getMasterName && (key.includes("_id") || key === "state_id" || key === "district_id")) {
                      value = getMasterName(item[key], key) || value;
                    }
                    // Handle boolean/yes-no fields
                    else if (key === "is_additional_charge") {
                      value = item[key] === true || item[key] === 'yes' ? 'Yes' : 'No';
                    }
                    // Handle basic pay/currency
                    else if (key === "basic_pay" && item[key]) {
                      value = `₹${item[key]}`;
                    }

                    // Check for special indicators
                    const specialIndicator = specialIndicators[key];
                    const isSpecialField = !!specialIndicator;

                    return (
                      <div
                        key={key}
                        className={`flex border rounded-lg overflow-hidden hover:shadow-sm transition-shadow ${
                          isSpecialField 
                            ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700' 
                            : 'border-indigo-300 dark:border-gray-700'
                        }`}
                      >
                        <div className={`w-2/5 p-2.5 font-semibold text-sm border-r flex items-center ${
                          isSpecialField 
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700' 
                            : 'bg-indigo-50 text-slate-700 border-indigo-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                        }`}>
                          <div className="flex items-center">
                            {isSpecialField && (
                              <span className="mr-1.5" title={specialIndicator.tooltip}>
                                {specialIndicator.indicator}
                              </span>
                            )}
                            {formatFieldName(key)}
                            {isFieldMandatory?.(key) && <span className="text-red-600 font-bold ml-1">*</span>}
                          </div>
                        </div>
                        <div className={`w-3/5 p-2.5 text-sm break-words ${
                          isSpecialField 
                            ? 'bg-yellow-50 text-yellow-900 dark:bg-yellow-900/10 dark:text-yellow-100' 
                            : 'bg-white text-slate-600 dark:bg-gray-800 dark:text-gray-100'
                        }`}>
                          {value || ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : showEmptyStructure ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {fields.map((key) => {
              const specialIndicator = specialIndicators[key];
              const isSpecialField = !!specialIndicator;
              
              return (
                <div
                  key={key}
                  className={`flex border rounded-lg overflow-hidden hover:shadow-sm transition-shadow ${
                    isSpecialField 
                      ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700' 
                      : 'border-indigo-300 dark:border-gray-700'
                  }`}
                >
                  <div className={`w-2/5 p-2.5 font-semibold text-sm border-r flex items-center ${
                    isSpecialField 
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700' 
                      : 'bg-indigo-50 text-slate-700 border-indigo-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                  }`}>
                    <div className="flex items-center">
                      {isSpecialField && (
                        <span className="mr-1.5" title={specialIndicator.tooltip}>
                          {specialIndicator.indicator}
                        </span>
                      )}
                      {formatFieldName(key)}
                      {isFieldMandatory?.(key) && <span className="text-red-600 font-bold ml-1">*</span>}
                    </div>
                  </div>
                  <div className={`w-3/5 p-2.5 text-sm break-words ${
  isSpecialField 
    ? 'bg-yellow-50 text-yellow-900 dark:bg-yellow-900/10 dark:text-yellow-100' 
    : 'bg-white text-slate-600 dark:bg-gray-800 dark:text-gray-100'
}`}>
  
</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-300">
            No data available for {title.toLowerCase()}
          </div>
        )}
      </div>
    </div>
  );
};

export default SparkPreviewPage;
