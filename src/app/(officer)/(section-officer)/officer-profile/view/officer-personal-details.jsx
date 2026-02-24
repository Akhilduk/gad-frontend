'use client'

import { useState, useEffect } from 'react'
import { PencilSquareIcon, ArrowPathIcon } from '@heroicons/react/20/solid'
import { OfficerModalPersonalDetails } from '../modal/officer-personal-details'
import { toast } from 'react-toastify'; // Import and toast
import 'react-toastify/dist/ReactToastify.css'; // Import the necessary CSS for Toastify
import { getServiceTypeName } from '@/utils/serviceTypeUtils';
import axiosInstance from "@/utils/apiClient";

export function OfficerPersonalDetails() {
  const [isModalOpen, setModalOpen] = useState(false)
  const [personalDetails, setPersonalDetails] = useState(null)
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [penNumber, setPenNumber] = useState('');
  const [masterData, setMasterData] = useState({
    recruitment: [],
    cadre: [],
    gender: [],
    state: [],
    tenure: [],
    district: [],
    designation: [],
    retirement: [],
    motherTongue: [],
    languageKnown: [],
    category: [],
  });

  const fields = [
    { label: "Honorifics", key: "honorifics" },
    { label: "First Name", key: "first_name" },
    { label: "Last Name", key: "last_name" },
    { label: "Identity Number", key: "identity_number" },
    { label: "AIS Number", key: "ais_number" },
    { label: "PEN", key: "pen_number" },
    { label: "Allotment Year", key: "allotment_year" },
    { label: "Source of Recruitment", key: "source_of_recruitment_id" },
    { label: "Service Type", key: "service_type_id" },
    { label: "Cadre", key: "cadre_id" },
    // { label: "Designation", key: "designation_id" },
    { label: "Retirement", key: "retirement_id" },
    { label: "Date of Birth", key: "dob" },
    { label: "Age", key: "age" },
    { label: "Gender", key: "gender_id" },
    { label: "Email", key: "email" },
    { label: "Alternate Email", key: "alternative_email" },
    { label: "Mobile Number", key: "mobile_no" },
    { label: "Alternative Mobile Number", key: "alternative_mobile_no" },
    { label: "PAN Number", key: "PAN_no" },
    { label: "Aadhaar Number", key: "aadhaar_number" },
    { label: "Category", key: "category_id" },
    { label: "Mother Tongue", key: "mother_tongue_id" }


  ];

  const masterFields = [
    "source_of_recruitment_id",
    "cadre_id",
    "gender_id",
    "state_id",
    "tenure_id",
    "district",
    "designation_id",
    "retirement_id",
    "designation_id",
    "mother_tongue_id",
    "language_known",
    "category_id",
  ];
  const fetchPersonalDetails = async (OfficerUserId, setPersonalDetails, setError) => {
    if (!OfficerUserId) {
      setError('Officer User ID is missing');
      return;
    }

    try {
      const response = await axiosInstance.get(`/clerk/officer/${OfficerUserId}`);
      if (response.data.success) {
        const personalDetails = response.data.data || {};
        if (personalDetails.pen_number) {
          setPenNumber(personalDetails.pen_number);
        }
        setPersonalDetails(personalDetails);
      } else {
        setError('Failed to fetch user details');
      }
    } catch (err) {
      setError('Failed to fetch user details');
      console.error(err);
    }
  };
  useEffect(() => {
    const userId = sessionStorage.getItem('user_id');
    const OfficerUserId = sessionStorage.getItem('OfficerUserId');

  //  Only call once, fetchPersonalDetails is already called above
  // fetchPersonalDetails(); ❌ REMOVE THIS LINE
  
    if (!userId) {
      setError('User not logged in');
      return;
    }

    // ✅ Correct call with all required arguments
    fetchPersonalDetails(OfficerUserId, setPersonalDetails, setError);

    const fetchMasterData = async () => {
      try {
        const [
          recruitmentResponse,
          cadreResponse,
          genderResponse,
          stateResponse,
          tenureResponse,
          districtResponse,
          languageResponse,
          retirementResponse,
          categoryResponse,
          designationResponse,
        ] = await Promise.all([
          axiosInstance.get('/masters/recruitment'),
          axiosInstance.get('/masters/cadre'),
          axiosInstance.get('/masters/gender'),
          axiosInstance.get('/masters/state'),
          axiosInstance.get('/masters/tenure'),
          axiosInstance.get('/masters/district'),
          axiosInstance.get('/masters/language'),
          axiosInstance.get('/masters/retirement'),
          axiosInstance.get('/masters/category'),
          axiosInstance.get('/masters/designation'),
        ]);

        setMasterData({
          recruitment: recruitmentResponse.data.data.recruitment || [],
          cadre: cadreResponse.data.data.cadre || [],
          gender: genderResponse.data.data.gender || [],
          state: stateResponse.data.data.state || [],
          tenure: tenureResponse.data.data.tenure || [],
          district: districtResponse.data.data.district || [],
          motherTongue: languageResponse.data.data.languages || [],
          languageKnown: languageResponse.data.data.languages || [],
          retirement: retirementResponse.data.data.retirement || [],
          category: categoryResponse.data.data.category || [],
          designation: designationResponse.data.data.designation || [],
        });
      } catch (err) {
        setError('Failed to fetch master data');
        console.error(err);
      }
    };

    // 🔁 Only call once, fetchPersonalDetails is already called above
    // fetchPersonalDetails(); ❌ REMOVE THIS LINE

    fetchMasterData();
  }, []);



  const handleSave = async (updatedDetails) => {
    console.log("Saving...", updatedDetails);

    try {
      const response = await axiosInstance.put(
        `/clerk/officer/${updatedDetails.user_id}`,
        updatedDetails
      );

      if (response.data.success) {
        const OfficerUserId = sessionStorage.getItem('OfficerUserId');
        await fetchPersonalDetails(OfficerUserId, setPersonalDetails, setError); // refresh UI
        setModalOpen(false);
      } else {
        setError('Failed to save user details');
      }
    } catch (err) {
      setError('Failed to save user details');
      console.error(err);
    }
  };

  const getMasterValue = (id, key) => {
    if (!id) return 'N/A';

    const keyMap = {
      source_of_recruitment_id: "recruitment",
      cadre_id: "cadre",
      gender_id: "gender",
      state_id_com: "state",
      state_id_per: "state",
      district_id_com: "district",
      district_id_per: "district",
      tenure_id: "tenure",
      mother_tongue_id: "motherTongue",
      retirement_id: "retirement",
      designation_id: "designation",
      language_known: "language",
      category_id: "category",
    };

    const masterKey = keyMap[key];
    if (!masterKey || !masterData[masterKey]) return 'N/A';

    const idKey = Object.keys(masterData[masterKey][0] || {}).find(k => k.includes("_id")) || "id";

    const match = masterData[masterKey].find(item => item[idKey] == id);
    if (!match) return 'N/A';

    return match.recruitment || match.cadre || match.state || match.gender || match.tenures ||
      match.district || match.language || match.retirement || match.designation || match.category || 'N/A';
  };



  const calculateAge = (dob) => {
    if (!dob) return ''; // Return empty string if dob is not provided

    const birthDate = new Date(dob);
    if (isNaN(birthDate)) return ''; // Ensure the input is a valid date

    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    // Check if the birthday has occurred this year
    const hasBirthdayOccurred =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

    return hasBirthdayOccurred ? age : age - 1;
  };

  const mapSparkToPersonalDetails = (sparkData, masters) => {//map saprk data to personal details
    if (!sparkData) return {};

    const penKey = Object.keys(sparkData)[0];
    const details = sparkData[penKey]?.personal_details || {};
    const address = sparkData[penKey]?.address_details || {};

    // 🧹 Clean name
    let cleanName = details.name?.trim() || "";
    cleanName = cleanName.replace(/\b(IAS|IPS|IFS)\b$/i, "").trim();

    const [firstName, ...lastParts] = cleanName.split(" ");
    const lastName = lastParts.join(" ");

    // 🟢 Gender mapping
    let gender_id = null;
    if (details.sex) {
      const genderOption = masters.gender.find((g) => {
        if (details.sex.toUpperCase() === "M" && g.gender.toLowerCase() === "male") return true;
        if (details.sex.toUpperCase() === "F" && g.gender.toLowerCase() === "female") return true;
        if (details.sex.toUpperCase() === "T" && g.gender.toLowerCase() === "transgender") return true;
        return false;
      });
      gender_id = genderOption ? genderOption.gender_id : null;
    }

    // 🟢 District mapping
    const mapDistrict = (sparkDistrict) => {
      if (!sparkDistrict) return null;
      const match = masters.district.find(
        (d) => d.district.toLowerCase() === sparkDistrict.toLowerCase()
      );
      return match ? match.district_id : null;
    };

    const district_id_com = mapDistrict(address.current_address?.district);
    const district_id_per = mapDistrict(address.permanent_address?.district);

    // 🟢 State mapping

    const mapState = (sparkStateCodeOrName) => {
      if (!sparkStateCodeOrName) return null;

      const stateCodeToName = {
        "AP": "andhra pradesh",
        "AR": "arunachal pradesh",
        "AS": "assam",
        "BR": "bihar",
        "CG": "chhattisgarh",
        "GA": "goa",
        "GJ": "gujarat",
        "HR": "haryana",
        "HP": "himachal pradesh",
        "JH": "jharkhand",
        "KA": "karnataka",
        "KL": "kerala",
        "MP": "madhya pradesh",
        "MH": "maharashtra",
        "MN": "manipur",
        "ML": "meghalaya",
        "MZ": "mizoram",
        "NL": "nagaland",
        "OD": "odisha",
        "PB": "punjab",
        "RJ": "rajasthan",
        "SK": "sikkim",
        "TN": "tamil nadu",
        "TS": "telangana",
        "TR": "tripura",
        "UP": "uttar pradesh",
        "UK": "uttarakhand",
        "WB": "west bengal",
        "AN": "andaman and nicobar islands",
        "CH": "chandigarh",
        "DN": "dadra and nagar haveli and daman and diu",
        "DL": "delhi",
        "JK": "jammu and kashmir",
        "LD": "ladakh",
        "LW": "lakshadweep",
        "PY": "puducherry",
      };

      let normalizedSparkState = sparkStateCodeOrName.trim().toLowerCase();

      // ✅ If it's a state code (e.g., "AP"), convert to full name
      if (stateCodeToName[sparkStateCodeOrName.toUpperCase()]) {
        normalizedSparkState = stateCodeToName[sparkStateCodeOrName.toUpperCase()];
      }

      // ✅ Match with DB ignoring case
      const match = masters.state.find(
        (s) => s.state.trim().toLowerCase() === normalizedSparkState
      );

      return match ? match.state_id : null;
    };

    const state_id_com = mapState(address.current_address?.state);

    const state_id_per = mapState(address.permanent_address?.state);

    return {
      ais_per_id: null,
      pen_number: details.permanent_emp_no || "",
      ais_number: "",
      dob: details.date_of_birth || null,
      address_line1_com: [
        address.current_address?.house_name,
        address.current_address?.street_name
      ].filter(Boolean).join(', ') || null,
      address_line2_com: address.current_address?.place || null,
      pin_code_com: address.current_address?.pin || null,
      allotment_year: null,
      profile_image: null,
      alternative_email: null,
      is_mobile_verified: false,
      pwd_status: false,
      is_serving: true,
      retirement_reason: null,
      registered_on: new Date().toISOString(),
      last_updated_on: null,
      cadre_id: null,
      gender_id,
      mother_tongue_id: null,
      registered_by_id: null,
      retirement_id: null,
      source_of_recruitment_id: null,
      state_id_com,
      last_updated_by_id: null,
      user_id: null,
      confirmation_on_appointment: null,
      date_of_appointment: null,
      identity_number: "",
      service_type_id: null,
      mobile_no: address.current_address?.phone_number || null,
      alternative_mobile_no: null,
      district_id_com,
      address_line1_per: [
        address.permanent_address?.house_name,
        address.permanent_address?.street_name
      ].filter(Boolean).join(', ') || null,

      address_line2_per: address.permanent_address?.place || null,
      pin_code_per: address.permanent_address?.pin || null,
      district_id_per,
      state_id_per,
      retirement_date: details.retirement_date || null,
      is_super_annuated: false,
      supe_annuated_start_date: null,
      supe_annuated_end_date: null,
      languages_known: null,
      category_id: null,
      id: null,
      password: null,
      first_name: firstName || "",
      last_name: lastName || "",
      is_active: true,
      email: "",
      is_first_login: true,
      failed_attempts: 0,
      locked_at: null,
      last_login: null,
      last_password_changed: null,
      honorifics: "",
      role_id: null,
      current_login: null,

      spark_data: sparkData
    };
  };

  const handleRefreshFromSpark = async () => {
  const currentPen = penNumber?.trim();

  if (!currentPen) {
    toast.error("PEN is missing.");
    return;
  }

    try {
      setIsFetching(true);

      const sparkResponse = await axiosInstance.get(`/spark/${currentPen}`);

      if (sparkResponse.status === 200 && sparkResponse.data) {
        const sparkData = sparkResponse.data;
        console.log("Fetched SPARK data:", sparkData);

        const mappedData = mapSparkToPersonalDetails(sparkData, masterData);
        console.log("Mapped Data:", mappedData);

        setTimeout(() => {
          setPersonalDetails((prevDetails) => ({
            ...prevDetails,
            ...Object.keys(mappedData).reduce((acc, key) => {
              acc[key] =
                mappedData[key] !== null && mappedData[key] !== ""
                  ? mappedData[key]
                  : prevDetails[key];
              return acc;
            }, {})
          }));

          toast.success("Data refreshed from SPARK!");
          setIsFetching(false);
        }, 2000);

      } else {
        toast.error("No officer found in SPARK with this PEN.");
        setIsFetching(false);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to refresh data from SPARK.";
      toast.error(errorMessage);
      console.error("SPARK fetch error:", error);
      setIsFetching(false);
    }
  };


  if (error) {
    return <div>{error}</div>;
  }

  return (
    <>
      <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white rounded-xl border w-full mb-3">
        <div className="p-3 sm:p-3">
          <div>
            <div className="px-4 sm:px-0 flex justify-between items-center">
              <div>
                <h3 className="text-base/7 font-semibold text-gray-900">Personal Details</h3>
                <p className="max-w-2xl text-sm/6 text-gray-500">Personal details of Officer.</p>
              </div>
              <div className='space-x-1.5'>
              <button
                  type="button"
                  onClick={handleRefreshFromSpark}
                  disabled={isFetching}
                  className="inline-flex items-center gap-x-1.5 rounded-md 
                            text-indigo-700 bg-indigo-300 
                            hover:bg-indigo-200 hover:text-indigo-700
                            px-2.5 py-1.5 text-sm font-semibold shadow-sm 
                            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600
                            disabled:opacity-90 disabled:hover:bg-indigo-300 disabled:hover:text-indigo-700"
                >
                  {isFetching ? "Refreshing..." : "Refresh data from Spark"}
                  <ArrowPathIcon
                    aria-hidden="true"
                    className={`-mr-0.5 size-5 ${isFetching ? "animate-spin" : ""}`}
                  />
                </button>

              <button
                type="button"
                className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm  hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                onClick={() => setModalOpen(true)}
              >
                Edit <PencilSquareIcon aria-hidden="true" className="-mr-0.5 size-5" />
              </button>
              </div>
            </div>
            <div className="mt-3">
              <dl className="grid grid-cols-1 sm:grid-cols-3">

                {personalDetails && fields.map((field) => {
                  // Check if it's "first_name" and concatenate salutation
                  if (field.key === "first_name") {
                    const salutation = personalDetails.honorofics || '';
                    const firstName = personalDetails.first_name || '';
                    const combinedName = `${salutation ? salutation + ' ' : ''}${firstName}`;
                    return (
                      <div key={field.key} className="border-t border-gray-100 px-3 py-3 sm:col-span-1 sm:px-0">
                        <div className="sm:col-span-2">
                          <dt className="font-medium text-gray-900">{field.label}</dt>
                          <dd className="mt-1 text-gray-500">{combinedName}</dd>
                        </div>
                      </div>
                    );
                  }

                  // For other fields, render them normally
                  return (
                    <div key={field.key} className="border-t border-gray-100 px-3 py-3 sm:col-span-1 sm:px-0">
                      <div className="sm:col-span-2">
                        <dt className="font-medium text-gray-900">{field.label}</dt>
                        <dd className="mt-1 text-gray-500">
                          {field.key === "age"
                            ? calculateAge(personalDetails.dob)
                            : field.key === "service_type_id"
                              ? getServiceTypeName(personalDetails[field.key])
                              : masterFields.includes(field.key)
                                ? getMasterValue(personalDetails[field.key], field.key)
                                : personalDetails[field.key] || ""}
                        </dd>
                      </div>
                    </div>
                  );
                })}


                <div className="border-t border-gray-100 px-3 py-3 sm:col-span-1 sm:px-0">
                  <dt className="font-medium text-gray-900">Languages Known</dt>
                  <dd className="mt-1 text-gray-500">
                    {personalDetails?.languages_known?.length > 0
                      ? personalDetails.languages_known
                        .map((id) => {
                          const languageObj = masterData.languageKnown.find((lang) => lang.language_id === id);
                          return languageObj ? languageObj.language : null;
                        })
                        .filter(Boolean)
                        .join(", ")
                      : "N/A"}
                  </dd>

                </div>
              </dl>

              {/* Current Address Section */}
              <div className="mt-6">
                <h3 className="text-base/7 font-semibold text-gray-900 mb-3">Current Address</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-3">
                  {[
                    { label: "Address", key: "address_line1_com" },
                    { label: "District", key: "district_id_com", masterKey: "district_id" },
                    { label: "State", key: "state_id_com", masterKey: "state_id" },
                    { label: "Pincode", key: "pin_code_com" },
                  ].map(({ label, key, masterKey }) => (
                    <div key={key} className="border-t border-gray-100 px-3 py-3 sm:col-span-1 sm:px-0">
                      <dt className="font-medium text-gray-900">{label}</dt>
                      <dd className="mt-1 text-gray-500">
                        {masterKey ? getMasterValue(personalDetails?.[key], key) : personalDetails?.[key] ?? "N/A"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>


              {/* Permanent Residential Address Section */}
              <div className="mt-6">
                <h3 className="text-base/7 font-semibold text-gray-900 mb-3">Permanent Residential Address</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-3">
                  {[
                    { label: "Address", key: "address_line1_per" },
                    { label: "District", key: "district_id_per", masterKey: "district_id" },
                    { label: "State", key: "state_id_per", masterKey: "state_id" },
                    { label: "Pincode", key: "pin_code_per" },
                  ].map(({ label, key, masterKey }) => (
                    <div key={key} className="border-t border-gray-100 px-3 py-3 sm:col-span-1 sm:px-0">
                      <dt className="font-medium text-gray-900">{label}</dt>
                      <dd className="mt-1 text-gray-500">
                        {masterKey ? getMasterValue(personalDetails?.[key], key) : personalDetails?.[key] ?? "N/A"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>


            </div>
          </div>
        </div>
      </div>

      <OfficerModalPersonalDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        personalDetails={personalDetails}
        onSave={handleSave}
        masterData={masterData} // Pass the masterData to the modal
      />

    </>
  );
}

