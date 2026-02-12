'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { HomeIcon, ExclamationTriangleIcon, BriefcaseIcon, IdentificationIcon, EnvelopeIcon, PhoneIcon, CalendarIcon, HeartIcon, CakeIcon, LanguageIcon, ChevronDownIcon, PencilSquareIcon, CheckCircleIcon, MapPinIcon, UserCircleIcon} from '@heroicons/react/24/outline';
import { BoltIcon, UserIcon,  } from '@heroicons/react/24/solid';
import { ModalPersonalDetails } from '../modal/personal-details';
import { toast } from 'react-toastify';
import PrimaryDetails from '../primary-details';
import axiosInstance from '@/utils/apiClient';
import { getServiceTypeName } from '@/utils/serviceTypeUtils';
import { useProfileCompletion } from '@/contexts/Profile-completion-context';

export function PersonalDetails({ profileData, guidedModeEnabled = false }) {
  console.log('PersonalDetails profileData:', profileData);
  const [isModalOpen, setModalOpen] = useState(false);
  const [personalDetails, setPersonalDetails] = useState({});
  const [officerFields, setOfficerFields] = useState({ GAD_OFFICER: [], AIS_OFFICER: [], DB_SPARK_API: [] });
  const [sparkFields, setSparkFields] = useState(new Set());
  const [error, setError] = useState(null);
  const [masterData, setMasterData] = useState({
    recruitment: [], cadre: [], gender: [], state: [], tenure: [], district: [],
    designation: [], retirement: [], motherTongue: [], languageKnown: [], category: [], bloodGroup: [],
  });
  const [formData, setFormData] = useState({});
  const [openSections, setOpenSections] = useState({});
  const [activeTabs, setActiveTabs] = useState({});
  const [localProfileData, setLocalProfileData] = useState(profileData);
  const hasAutoGuidedOpened = useRef(false);
  // Get profile status from sessionStorage
  const profileStatus = sessionStorage.getItem('profile_status');
  const isButtonDisabled = profileStatus === '2' || profileStatus === '3'; // Disable for submitted or approved
  const { updateSectionProgress,markSectionLoaded  } = useProfileCompletion();

  const mandatoryFields = [
    'honorifics', 'first_name', 'last_name', 'ais_number', 'email', 'allotment_year','date_of_joining',
    'pen_number', 'source_of_recruitment_id', 'cadre_id', 'dob', 'gender_id',
    'blood_group_id', 'mother_tongue_id', 'service_type_id', 'mobile_no',
    'address_line1_com', 'district_id_com', 'state_id_com', 'pin_code_com',
    'address_line1_per', 'district_id_per', 'state_id_per', 'pin_code_per',
  ];

  const formatDate = useCallback((dateStr) => {
    if (!dateStr) return 'N/A';
    let date;
    const sparkDateMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}:\d{2}:\d{2})$/);
    if (sparkDateMatch) {
      const [_, day, month, year] = sparkDateMatch;
      date = new Date(`${year}-${month}-${day}`);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      date = new Date(`${year}-${month}-${day}`);
    } else {
      date = new Date(dateStr);
    }
    if (isNaN(date.getTime())) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }, []);

  const isDbSparkApiEmpty = useMemo(() => {
    return !officerFields.DB_SPARK_API || officerFields.DB_SPARK_API.length === 0;
  }, [officerFields.DB_SPARK_API]);

  const getMasterValue = useCallback((id, key) => {
    if (!id) return 'N/A';
    const keyMap = {
      source_of_recruitment_id: 'recruitment',
      cadre_id: 'cadre',
      gender_id: 'gender',
      state_id_com: 'state',
      state_id_per: 'state',
      district_id_com: 'district',
      district_id_per: 'district',
      tenure_id: 'tenure',
      mother_tongue_id: 'motherTongue',
      retirement_id: 'retirement',
      designation_id: 'designation',
      languages_known: 'languageKnown',
      category_id: 'category',
      blood_group_id: 'bloodGroup',
    };
    const masterKey = keyMap[key];
    if (!masterKey || !masterData[masterKey]) return 'N/A';
    const idKey = Object.keys(masterData[masterKey][0] || {}).find(k => k.includes('_id')) || 'id';
    const match = masterData[masterKey].find(item => item[idKey] == id);
    return match ? (match[masterKey] || match.recruitment || match.cadre || match.state || match.gender || match.tenures || match.district || match.language || match.retirement || match.designation || match.category || match.blood_group || 'N/A') : 'N/A';
  }, [masterData]);

  const mapSparkDataToPersonalDetails = useCallback((sparkData, masterData) => {
    if (!sparkData || !Object.keys(sparkData).length) return { details: {}, sparkKeys: new Set() };
    const personal = sparkData.personal_details || {};
    const address = sparkData.address_details || {};
    const sparkKeys = new Set();

    const normalizeSparkDate = (dateStr) => {
      if (!dateStr) return '';
      const sparkDateMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}:\d{2}:\d{2})$/);
      if (sparkDateMatch) {
        const [_, day, month, year] = sparkDateMatch;
        return `${year}-${month}-${day}`;
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    };

    const genderKeyMap = { M: 'male', F: 'female', T: 'transgender' };
    const genderId = masterData.gender.find(g => g.gender.toLowerCase() === genderKeyMap[personal.sex])?.gender_id || null;
    if (genderId && personal.sex) sparkKeys.add('gender_id');

    const stateAbbrMap = {
      AP: "Andhra Pradesh", AR: "Arunachal Pradesh", AS: "Assam", BR: "Bihar", CT: "Chhattisgarh",
      GA: "Goa", GJ: "Gujarat", HR: "Haryana", HP: "Himachal Pradesh", JH: "Jharkhand",
      KA: "Karnataka", KL: "Kerala", MP: "Madhya Pradesh", MH: "Maharashtra", MN: "Manipur",
      ML: "Meghalaya", MZ: "Mizoram", NL: "Nagaland", OR: "Odisha", PB: "Punjab",
      RJ: "Rajasthan", SK: "Sikkim", TN: "Tamil Nadu", TG: "Telangana", TR: "Tripura",
      UP: "Uttar Pradesh", UT: "Uttarakhand", WB: "West Bengal", AN: "Andaman and Nicobar Islands",
      CH: "Chandigarh", DN: "Dadra and Nagar Haveli and Daman and Diu", DL: "Delhi",
      JK: "Jammu and Kashmir", LA: "Ladakh", LD: "Lakshadweep", PY: "Puducherry"
    };

    const normalize = (str) => str?.toString().trim().toLowerCase() || "";
    const permanentState = stateAbbrMap[address.permanent_address?.state] || address.permanent_address?.state;
    const stateMap = {
      permanent: masterData.state.find(s => normalize(s.state) === normalize(permanentState))?.state_id,
      current: masterData.state.find(s => normalize(s.state) === normalize(address.current_address?.state))?.state_id
    };
    if (stateMap.permanent && address.permanent_address?.state) sparkKeys.add('state_id_per');
    if (stateMap.current && address.current_address?.state) sparkKeys.add('state_id_com');

    const districtMap = {
      permanent: masterData.district.find(d => normalize(d.district).includes(normalize(address.permanent_address?.district)))?.district_id,
      current: masterData.district.find(d => normalize(d.district).includes(normalize(address.current_address?.district)))?.district_id
    };
    if (districtMap.permanent && address.permanent_address?.district) sparkKeys.add('district_id_per');
    if (districtMap.current && address.current_address?.district) sparkKeys.add('district_id_com');

    const categoryId = masterData.category.find(c => c.category === personal.category)?.category_id || null;
    if (categoryId && personal.category) sparkKeys.add('category_id');

    const bloodGroupId = masterData.bloodGroup.find(bg => normalize(bg.blood_group) === normalize(personal.blood_group))?.blood_group_id || null;
    if (bloodGroupId && personal.blood_group) sparkKeys.add('blood_group_id');

    const nameParts = personal.name?.trim().split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    if (firstName && personal.name) sparkKeys.add('first_name');
    if (lastName && personal.name) sparkKeys.add('last_name');

    if (personal.permanent_emp_no) sparkKeys.add('pen_number');
    if (personal.pan_number) sparkKeys.add('pan_no');
    if (personal.praan_number) sparkKeys.add('praan_number');
    if (personal.pf_number) sparkKeys.add('pf_number');
    if (personal.retirement_date) sparkKeys.add('retirement_date');
    if (personal.date_of_joining) sparkKeys.add('date_of_joining');
    if (address.permanent_address?.house_name) sparkKeys.add('address_line1_per');
    if (address.permanent_address?.street_name) sparkKeys.add('address_line2_per');
    if (address.permanent_address?.pin) sparkKeys.add('pin_code_per');
    if (address.current_address?.house_name) sparkKeys.add('address_line1_com');
    if (address.current_address?.street_name) sparkKeys.add('address_line2_com');
    if (address.current_address?.pin) sparkKeys.add('pin_code_com');

    const details = {
      pen_number: personal.permanent_emp_no || '',
      first_name: firstName,
      last_name: lastName,
      gender_id: genderId || '',
      pan_no: personal.pan_number || '',
      pf_number: personal.pf_number || '',
      praan_number: personal.praan_number || '',
      retirement_date: normalizeSparkDate(personal.retirement_date) || '',
      date_of_joining: normalizeSparkDate(personal.date_of_joining) || '',
      category_id: categoryId || '',
      blood_group_id: bloodGroupId || '',
      address_line1_per: address.permanent_address?.house_name || '',
      address_line2_per: address.permanent_address?.street_name || '',
      pin_code_per: address.permanent_address?.pin || '',
      state_id_per: stateMap.permanent || '',
      district_id_per: districtMap.permanent || '',
      address_line1_com: address.current_address?.house_name || '',
      address_line2_com: address.current_address?.street_name || '',
      pin_code_com: address.current_address?.pin || '',
      state_id_com: stateMap.current || '',
      district_id_com: districtMap.current || ''
    };
    console.log("detailssssssssssss=============", details)

    return { details, sparkKeys };
  }, [masterData]);

  const calculateAge = (dob) => {
    if (!dob) return '';
    let birthDate;
    const sparkMatch = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (sparkMatch) {
      const [_, day, month, year] = sparkMatch;
      birthDate = new Date(`${year}-${month}-${day}`);
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(dob)) {
      const [day, month, year] = dob.split("-");
      birthDate = new Date(`${year}-${month}-${day}`);
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) {
      const [day, month, year] = dob.split("/");
      birthDate = new Date(`${year}-${month}-${day}`);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      const [year, month, day] = dob.split("-");
      birthDate = new Date(`${year}-${month}-${day}`);
    } else {
      birthDate = new Date(dob);
    }
    if (isNaN(birthDate.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const sections = useMemo(() => [
    {  
      title: 'Personal Information',
      icon: UserCircleIcon,
      tabs: [
        {
          label: 'Basic Details',
          fields: [
            { label: 'Honorifics', key: 'honorifics', icon: UserCircleIcon, computeValue: () => ` ${personalDetails.honorifics || 'N/A'}` },
            { label: 'First Name', key: 'first_name', icon: UserCircleIcon, computeValue: () => ` ${personalDetails.first_name || 'N/A'}` },
            { label: 'Last Name', key: 'last_name', icon: UserCircleIcon },
            { label: 'Date of Birth', key: 'dob', icon: CakeIcon, computeValue: () => formatDate(personalDetails.dob) },
            { label: 'Age', key: 'age', icon: CakeIcon, computeValue: () => calculateAge(personalDetails.dob) },
            { label: 'Gender', key: 'gender_id', icon: UserCircleIcon, isMaster: true },
            { label: 'Blood Group', key: 'blood_group_id', icon: HeartIcon, isMaster: true }
          ]
        },
        {
          label: 'Identification Details',
          fields: [
            { label: 'Karmasri ID', key: 'identity_number', icon: IdentificationIcon },
            { label: 'AIS Number', key: 'ais_number', icon: IdentificationIcon },
            { label: 'PEN', key: 'pen_number', icon: IdentificationIcon },
            { label: 'PAN', key: 'pan_no', icon: IdentificationIcon },
            { label: 'PF Account Number', key: 'pf_number', icon: IdentificationIcon },
            { label: 'PRAN (NPS)', key: 'praan_number', icon: IdentificationIcon },
          ]
        },
        {
          label: 'Service Details',
          fields: [
            { label: 'Allotment Year', key: 'allotment_year', icon: CalendarIcon },
            { label: 'Date of Joining', key: 'date_of_joining', icon: CalendarIcon, computeValue: () => formatDate(personalDetails.date_of_joining) },
            { label: 'Source of Recruitment', key: 'source_of_recruitment_id', icon: BriefcaseIcon, isMaster: true },
            { label: 'Service Type', key: 'service_type_id', icon: BriefcaseIcon, computeValue: () => getServiceTypeName(personalDetails.service_type_id) || 'N/A' },
            { label: 'Cadre', key: 'cadre_id', icon: BriefcaseIcon, isMaster: true },
            { label: 'Mode of Retirement', key: 'retirement_id', icon: CalendarIcon, isMaster: true },
            { label: 'Retirement Date', key: 'retirement_date', icon: CalendarIcon, computeValue: () => formatDate(personalDetails.retirement_date) }
          ]
        },
        {
          label: 'Contact Details',
          fields: [
            { label: 'Email', key: 'email', icon: EnvelopeIcon },
            { label: 'Alternate Email', key: 'alternative_email', icon: EnvelopeIcon },
            { label: 'Mobile Number', key: 'mobile_no', icon: PhoneIcon },
            { label: 'Alternate Mobile', key: 'alternative_mobile_no', icon: PhoneIcon }
          ]
        },
        {
          label: 'Demographic Details',
          fields: [
            { label: 'Category', key: 'category_id', icon: UserCircleIcon, isMaster: true },
            { label: 'Mother Tongue', key: 'mother_tongue_id', icon: LanguageIcon, isMaster: true },
            {
              label: 'Languages Known',
              key: 'languages_known',
              icon: LanguageIcon,
              computeValue: () => {
                const languages = personalDetails.languages_known;
                if (!languages) return 'N/A';
                if (Array.isArray(languages)) {
                  return languages.length > 0
                    ? languages
                        .map((id) => masterData.languageKnown.find((lang) => lang.language_id === id)?.language)
                        .filter(Boolean)
                        .join(', ') || 'N/A'
                    : 'N/A';
                }
                if (typeof languages === 'string') {
                  try {
                    const parsedLanguages = JSON.parse(languages);
                    if (Array.isArray(parsedLanguages)) {
                      return parsedLanguages.length > 0
                        ? parsedLanguages
                            .map((id) => masterData.languageKnown.find((lang) => lang.language_id === id)?.language)
                            .filter(Boolean)
                            .join(', ') || 'N/A'
                        : 'N/A';
                    }
                  } catch (e) {
                    const languageArray = languages.split(',').map(lang => lang.trim());
                    return languageArray.length > 0
                      ? languageArray.join(', ')
                      : 'N/A';
                  }
                }
                return 'N/A';
              }
            }
          ]
        }
      ]
    },
    {
      title: 'Address Information',
      icon: MapPinIcon,
      cards: [
        {
          subtitle: 'Official Address',
          fields: [
            { label: 'Address Line 1', key: 'address_line1_com', icon: HomeIcon },
            { label: 'Address Line 2', key: 'address_line2_com', icon: HomeIcon },
            { label: 'District', key: 'district_id_com', icon: MapPinIcon, isMaster: true, masterKey: 'district_id' },
            { label: 'State', key: 'state_id_com', icon: MapPinIcon, isMaster: true, masterKey: 'state_id' },
            { label: 'Pincode', key: 'pin_code_com', icon: MapPinIcon }
          ]
        },
        {
          subtitle: 'Permanent Address',
          fields: [
            { label: 'Address Line 1', key: 'address_line1_per', icon: HomeIcon },
            { label: 'Address Line 2', key: 'address_line2_per', icon: HomeIcon },
            { label: 'District', key: 'district_id_per', icon: MapPinIcon, isMaster: true, masterKey: 'district_id' },
            { label: 'State', key: 'state_id_per', icon: MapPinIcon, isMaster: true, masterKey: 'state_id' },
            { label: 'Pincode', key: 'pin_code_per', icon: MapPinIcon }
          ]
        }
      ]
    }
  ], [personalDetails, masterData, calculateAge, formatDate]);

  const filledCount = useMemo(() => {
    return personalDetails
      ? mandatoryFields.filter(k => personalDetails[k]?.toString().trim()).length
      : 0;
  }, [personalDetails, mandatoryFields]);

  const isPersonalInfoComplete = filledCount === mandatoryFields.length && mandatoryFields.length > 0;

  const updatePersonalDetails = useCallback((newDetails) => {

    setPersonalDetails((prev) => {
      const isEqual = Object.keys(newDetails).every(
        key => Array.isArray(newDetails[key])
          ? newDetails[key]?.length === prev[key]?.length && newDetails[key]?.every((v, i) => v === prev[key][i])
          : newDetails[key] === prev[key]
      );
      return isEqual ? prev : newDetails;
    });
  }, []);

  const updateFormData = useCallback((newDetails) => {
    setFormData((prev) => {
      const isEqual = Object.keys(newDetails).every(
        key => Array.isArray(newDetails[key])
          ? newDetails[key]?.length === prev[key]?.length && newDetails[key]?.every((v, i) => v === prev[key][i])
          : newDetails[key] === prev[key]
      );
      return isEqual ? prev : newDetails;
    });
  }, []);

  const toggleSection = useCallback((section) => (e) => {
    e.stopPropagation();
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
    if (!openSections[section]) {
      const sectionData = sections.find(s => s.title === section);
      if (sectionData?.tabs?.length > 0) {
        setActiveTabs((prev) => ({
          ...prev,
          [section]: sectionData.tabs[0].label
        }));
      }
    }
  }, [sections, openSections]);

  const setActiveTab = useCallback((section, tabLabel) => (e) => {
    e.stopPropagation();
    setActiveTabs((prev) => ({
      ...prev,
      [section]: tabLabel
    }));
  }, []);

  useEffect(() => {
    const storedProfile = sessionStorage.getItem('profileData');
    if (storedProfile) {
       setLocalProfileData(JSON.parse(storedProfile));
        console.log('Updated localProfileData from sessionStorage:', storedProfile);
    } else {
    setLocalProfileData(profileData);
      console.log('Updated localProfileData from props:', profileData);
    
    }
  }, [profileData]);

  useEffect(() => {
    const fetchMasterData = async () => {
      const endpoints = [
        { key: 'recruitment', url: '/masters/recruitment', dataKey: 'recruitment' },
        { key: 'cadre', url: '/masters/cadre', dataKey: 'cadre' },
        { key: 'gender', url: '/masters/gender', dataKey: 'gender' },
        { key: 'state', url: '/masters/state', dataKey: 'state' },
        { key: 'tenure', url: '/masters/tenure', dataKey: 'tenure' },
        { key: 'district', url: '/masters/district', dataKey: 'district' },
        { key: 'motherTongue', url: '/masters/language', dataKey: 'languages' },
        { key: 'languageKnown', url: '/masters/language', dataKey: 'languages' },
        { key: 'retirement', url: '/masters/retirement', dataKey: 'retirement' },
        { key: 'designation', url: '/masters/designation', dataKey: 'designation' },
        { key: 'category', url: '/masters/category', dataKey: 'category' },
        { key: 'bloodGroup', url: '/masters/blood-groups', dataKey: 'blood-group' }
      ];
      try {
        const results = await Promise.allSettled(endpoints.map(endpoint => axiosInstance.get(endpoint.url)));
        const masterDataResult = {};
        results.forEach((result, index) => {
          const { key, dataKey } = endpoints[index];
          if (result.status === 'fulfilled') {
            const apiData = result.value?.data?.data || {};
            masterDataResult[key] = apiData[dataKey] || [];
          } else {
            toast.warn(`Failed to fetch ${key}`, {
              className: 'bg-primary-500 text-white',
              progressClassName: 'bg-primary-200'
            });
            masterDataResult[key] = [];
          }
        });
        setMasterData(masterDataResult);
        return masterDataResult;
      } catch (err) {
        setError('An unexpected error occurred while fetching master data.');
        return null;
      }
    };

    fetchMasterData();
  }, []); // Empty deps: fetch masters only once

  // Separate effect to process data when both masterData and localProfileData are available
  useEffect(() => {
    if (masterData && Object.keys(masterData).length > 0 && localProfileData) {
      processProfileData(masterData, localProfileData);
    }
  }, [masterData, localProfileData]); // Depend on both

  const processProfileData = useCallback((masterData, currentProfileData) => {
    if (!currentProfileData) return;

    const sparkData = currentProfileData.spark_data?.data || {};
    const officerInfoRoot = currentProfileData.officer_data?.get_all_officer_info_by_user_id || {};
    const officerInfo = officerInfoRoot.officer_info?.[0];

   // In processProfileData function, update the officerFieldsData extraction:
   const officerFieldsData = {
  GAD_OFFICER: officerInfo?.fields?.GAD_OFFICER ? Object.keys(officerInfo.fields.GAD_OFFICER) : [],
  AIS_OFFICER: officerInfo?.fields?.AIS_OFFICER ? Object.keys(officerInfo.fields.AIS_OFFICER) : [],
  DB_SPARK_API: officerInfo?.fields?.DB_SPARK_API ? Object.keys(officerInfo.fields.DB_SPARK_API) : [],
  UNKNOWN: officerInfo?.fields?.UNKNOWN ? Object.keys(officerInfo.fields.UNKNOWN) : [],
};
    setOfficerFields(officerFieldsData);

    const primaryDetails = JSON.parse(sessionStorage.getItem('user_details')) || {};
   const dbdata = {
  ...(officerInfo?.fields?.AIS_OFFICER || {}),
  ...(officerInfo?.fields?.GAD_OFFICER || {}),
  ...(officerInfo?.fields?.UNKNOWN || {})
};
    console.log('DB Data:', dbdata);
    const { details: sparkMappedDetails, sparkKeys } = masterData
      ? mapSparkDataToPersonalDetails(sparkData, masterData)
      : { details: {}, sparkKeys: new Set() };

    const userEditableFields = [
      'honorifics', 'ais_number', 'allotment_year','date_of_joining', 'source_of_recruitment_id',
      'cadre_id', 'blood_group_id', 'category_id', 'mother_tongue_id', 'retirement_id',
      'alternative_email', 'alternative_mobile_no', 'languages_known', 'profile_image', 'pf_number', 'praan_number'
    ];

    const mergedDetails = { ...primaryDetails };
    const honorificsDB = officerInfo?.honorifics || '';
    console.log('Honorifics from DB:', honorificsDB);
    console.log('Honorifics from Spark:', sparkMappedDetails.honorifics);
    console.log('mergedDetails==',mergedDetails)
    if (honorificsDB) {
      mergedDetails['honorifics'] = honorificsDB;
    }

    userEditableFields.forEach((key) => {
      if (dbdata[key]) {
        if (key === 'languages_known' && typeof dbdata[key] === 'string') {
          try {
            mergedDetails[key] = JSON.parse(dbdata[key]);
          } catch {
            mergedDetails[key] = dbdata[key];
          }
        } else {
          mergedDetails[key] = dbdata[key];
        }
      }
    });

    Object.keys(sparkMappedDetails).forEach((key) => {
      if (!mergedDetails[key] || sparkKeys.has(key)) {
        mergedDetails[key] = sparkMappedDetails[key];
      }
    });

    // Ensure GAD_OFFICER fields are included, but don't overwrite SPARK data
    if (officerInfo?.fields?.GAD_OFFICER) {
      Object.keys(officerInfo.fields.GAD_OFFICER).forEach((key) => {
        // Don't overwrite if this field came from SPARK
        if (!sparkKeys.has(key)) {
          mergedDetails[key] = officerInfo.fields.GAD_OFFICER[key];
        }
      });
    }
    updatePersonalDetails(mergedDetails);
    updateFormData(mergedDetails);
    setSparkFields(sparkKeys);
   sessionStorage.setItem('personal_details', JSON.stringify(mergedDetails));
  }, [updatePersonalDetails, updateFormData, mapSparkDataToPersonalDetails]);

  const handleSave = useCallback(async (updated_data) => {
    try {
      const mergedDetails = {
        ...personalDetails,
        ...updated_data.user_data,
      };

      const sparkFieldsList = [
        'district_id_per', 'district_id_com', 'address_line1_per', 'address_line2_per',
        'pin_code_per', 'state_id_per', 'address_line1_com', 'address_line2_com',
        'pin_code_com', 'gender_id', 'state_id_com', 'first_name', 'last_name',
        'pen_number', 'pan_no', 'retirement_date', 'category_id', 'blood_group_id','date_of_joining'
      ];

      // Preserve existing spark_data
      const preservedSparkData = localProfileData.spark_data?.data || {};
      const dbSparkApiFields = {};
      sparkFieldsList.forEach((key) => {
        if (localProfileData.officer_data?.get_all_officer_info_by_user_id?.officer_info?.[0]?.fields?.DB_SPARK_API?.[key]) {
          dbSparkApiFields[key] = localProfileData.officer_data.get_all_officer_info_by_user_id.officer_info[0].fields.DB_SPARK_API[key];
        } else if (updated_data.spark_data[key]) {
          dbSparkApiFields[key] = updated_data.spark_data[key];
        }
      });

      updatePersonalDetails(mergedDetails);
      updateFormData(mergedDetails);
      sessionStorage.setItem('personal_details', JSON.stringify(mergedDetails));

      const newSparkFields = new Set(sparkFields);
      sparkFieldsList.forEach((key) => {
        if (dbSparkApiFields[key]) {
          newSparkFields.add(key);
        }
      });
      setSparkFields(newSparkFields);

      const response = await axiosInstance.put('/officer/officer', {
        user_data: updated_data.user_data,
        spark_data: dbSparkApiFields
      });

      if (response.data.success) {
        const apiData = response.data.data || {};
        const sparkData = apiData.spark_data?.data || preservedSparkData;
        const officerDataRoot = apiData.officer_data?.get_all_officer_info_by_user_id || {};
        const officerInfo = officerDataRoot.officer_info?.[0] || localProfileData.officer_data?.get_all_officer_info_by_user_id?.officer_info?.[0] || {};

        // Define user-editable fields for AIS_OFFICER
        const userEditableFields = [
          'honorifics', 'ais_number', 'allotment_year','date_of_joining', 'source_of_recruitment_id',
          'cadre_id', 'blood_group_id', 'category_id', 'mother_tongue_id', 'retirement_id', 
          'alternative_email', 'alternative_mobile_no', 'languages_known', 'profile_image', 'pf_number', 'praan_number'
        ];

        // Dynamically assign fields to AIS_OFFICER
       const aisOfficerFields = {};
          userEditableFields.forEach((key) => {
            if (updated_data.user_data[key] !== undefined) {
              aisOfficerFields[key] = updated_data.user_data[key];
            }
          });
                  const user_details = JSON.parse(sessionStorage.getItem('user_details')) || {};
                  console.log("user_details updated==",user_details)
                  user_details.honorifics = mergedDetails.honorifics || user_details.honorifics;
                  user_details.first_name = mergedDetails.first_name || user_details.first_name;
                  user_details.last_name = mergedDetails.last_name || user_details.last_name;
                  user_details.email = mergedDetails.email || user_details.email;
                  user_details.ais_number = mergedDetails.ais_number || user_details.ais_number;
                  sessionStorage.setItem('user_details', JSON.stringify(user_details)); 
                  // Construct updated officer_info
                  const updatedOfficerInfo = {
                    ais_per_id: officerInfo.ais_per_id || null,
                    pen_number: mergedDetails.pen_number || officerInfo.pen_number || "",
                    ais_number: mergedDetails.ais_number || officerInfo.ais_number || "",
                    email: mergedDetails.email || officerInfo.email || "",
                    honorifics: mergedDetails.honorifics || officerInfo.honorifics || "",
                    first_name: mergedDetails.first_name || officerInfo.first_name || null,
                    last_name: mergedDetails.last_name || officerInfo.last_name || null,
                    profile_status: officerInfo.profile_status || 1,
                    is_super_annuated: officerInfo.is_super_annuated || false,
                  fields: {
            DB_SPARK_API: {
              ...officerInfo.fields?.DB_SPARK_API,
              ...dbSparkApiFields
            },
            GAD_OFFICER: {
              dob: officerInfo.fields?.GAD_OFFICER?.dob || "",
              service_type_id: officerInfo.fields?.GAD_OFFICER?.service_type_id || "",
              mobile_no: officerInfo.fields?.GAD_OFFICER?.mobile_no ?? officerInfo.fields?.UNKNOWN?.mobile_no ?? "",
              identity_number: officerInfo.fields?.GAD_OFFICER?.identity_number || "",
            },
            AIS_OFFICER: {
              ...(officerInfo.fields?.AIS_OFFICER || {}),
              ...aisOfficerFields
            },
            UNKNOWN: {
              is_super_annuated: String(officerInfo.fields?.UNKNOWN?.is_super_annuated || "false"),
              profile_status: String(officerInfo.fields?.UNKNOWN?.profile_status || "1"),
            }
          }
        };

        const updatedProfileData = {
          ...apiData,
          officer_data: {
            get_all_officer_info_by_user_id: {
              officer_info: [updatedOfficerInfo]
            }
          },
          spark_data: {
            data: sparkData
          }
        };
       console.log("updated profile data===",updatedProfileData);
        // Update both localProfileData and profileData in sessionStorage
        setLocalProfileData(updatedProfileData);
        sessionStorage.setItem('profileData', JSON.stringify(updatedProfileData));

        const updatedOfficerFields = {
          GAD_OFFICER: officerInfo.fields?.GAD_OFFICER ? Object.keys(officerInfo.fields.GAD_OFFICER) : [],
          AIS_OFFICER: Object.keys({ ...officerInfo.fields?.AIS_OFFICER, ...aisOfficerFields }),
          DB_SPARK_API: Object.keys({ ...officerInfo.fields?.DB_SPARK_API, ...dbSparkApiFields }),
        };
        setOfficerFields(updatedOfficerFields);

        const { details: sparkMappedDetails, sparkKeys } = mapSparkDataToPersonalDetails(sparkData, masterData);
        const finalSparkFields = new Set(newSparkFields);
        sparkKeys.forEach((key) => {
          finalSparkFields.add(key);
        });

        const finalDetails = { ...mergedDetails };
        userEditableFields.forEach((key) => {
          if (aisOfficerFields[key]) {
            finalDetails[key] = aisOfficerFields[key];
          }
        });
        sparkFieldsList.forEach((key) => {
          if (dbSparkApiFields[key]) {
            finalDetails[key] = dbSparkApiFields[key];
          } else if (sparkMappedDetails[key]) {
            finalDetails[key] = sparkMappedDetails[key];
          }
        });

        updatePersonalDetails(finalDetails);
        updateFormData(finalDetails);
        setSparkFields(finalSparkFields);
        sessionStorage.setItem('personal_details', JSON.stringify(finalDetails));

       toast.success('Profile updated successfully', {
  className: 'bg-primary-500 text-white',
  progressClassName: 'bg-primary-200'
});
// Full page reload after a short delay (so the success toast is visible)
setTimeout(() => {
  window.location.reload();
}, 1200); // Adjust the delay (in ms) if needed – 1200ms = 1.2 seconds
      } else {

        toast.error('Failed to update profile', {
          className: 'bg-red-500 text-white',
          progressClassName: 'bg-red-200'
        });
      }
    } catch (err) {
      console.error('Full error object:', err);
      console.error('Response status:', err.response?.status);
      console.error('Response data:', err.response?.data);
      console.error('Request config:', err.config);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.response?.statusText || 
                          err.message || 
                          'Unknown error occurred while updating profile';
      toast.error(errorMessage, {
        className: "bg-red-500 text-white",
        progressClassName: "bg-red-200",
      });
    }
  }, [personalDetails, localProfileData, sparkFields, masterData, mapSparkDataToPersonalDetails, updatePersonalDetails, updateFormData]);

  useEffect(() => {
    if (Object.keys(personalDetails).length > 0) {
      const completed = mandatoryFields.filter(key => {
        const value = personalDetails[key];
        return value && value !== 'N/A' && value !== '';
      }).length;
      const total = mandatoryFields.length;
      updateSectionProgress('personal', completed, total);
       markSectionLoaded('personal');
    }
  }, [personalDetails, updateSectionProgress]);

  useEffect(() => {
    if (!guidedModeEnabled || hasAutoGuidedOpened.current) return;
    if (!sections?.length) return;

    const personalSection = sections.find((section) => section.title === 'Personal Information');
    if (!personalSection) return;

    setOpenSections((prev) => {
      if (prev['Personal Information']) return prev;
      return {
        ...prev,
        'Personal Information': true,
      };
    });

    setActiveTabs((prev) => {
      if (prev['Personal Information']) return prev;
      const firstTab = personalSection.tabs?.[0]?.label;
      if (!firstTab) return prev;
      return {
        ...prev,
        'Personal Information': firstTab,
      };
    });

    const timer = setTimeout(() => {
      const editButton = document.getElementById('personal-info-edit-button');
      if (editButton) {
        editButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        editButton.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2');
        setTimeout(() => {
          editButton.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2');
        }, 1800);
      }
    }, 220);

    hasAutoGuidedOpened.current = true;
    return () => clearTimeout(timer);
  }, [guidedModeEnabled, sections]);

  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    setFormData(personalDetails);
    setModalOpen(true);
  }, [personalDetails]); 

  if (error) {
    return <div className="text-red-500 text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/30">{error}</div>;
  }

  const renderSparkIndicator = (fieldKey) => {
  if (!sparkFields.has(fieldKey)) return null;
  return (
    <div className="absolute top-2 right-2 group">
      <span className="inline-flex items-center p-0.5 rounded-full bg-orange-100 text-orange-600 text-xs" aria-label="Synced from SPARK">
        <BoltIcon className="w-2 h-2" />
      </span>
      <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10">
        <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md whitespace-nowrap">
          Synced from SPARK
        </div>
      </div>
    </div>
  );
};

const renderGadOfficerIndicator = (fieldKey) => {
  // Show GAD indicator if field is in GAD_OFFICER and NOT in SPARK
  if (!officerFields.GAD_OFFICER.includes(fieldKey) || sparkFields.has(fieldKey)) return null;
  return (
    <div className="absolute top-2 right-2 group">
      <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-xs" aria-label="Sourced by AS Officer">
        <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
          <circle cx="4" cy="4" r="3" />
        </svg>
      </span>
      <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10">
        <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md whitespace-nowrap">
          Updated by AS-II
        </div>
      </div>
    </div>
  );
};

const renderUserIndicator = (fieldKey) => {
  // Show user indicator if field is NOT from SPARK and NOT from GAD_OFFICER
  // This means it's a user-editable field that the user has saved
  if (sparkFields.has(fieldKey) || officerFields.GAD_OFFICER.includes(fieldKey)) return null;
  
  // Check if this field exists in personalDetails (user has saved it)
  if (!personalDetails[fieldKey]) return null;
  
  // List of user-editable fields (from your code)
  const userEditableFields = [
    'honorifics', 'ais_number', 'allotment_year', 'date_of_joining', 'source_of_recruitment_id',
    'cadre_id', 'blood_group_id', 'category_id', 'mother_tongue_id', 'retirement_id',
    'alternative_email', 'alternative_mobile_no', 'languages_known', 'pf_number', 'praan_number'
  ];
  
  // Only show for user-editable fields
  if (!userEditableFields.includes(fieldKey)) return null;
  
  return (
    <div className="absolute top-2 right-2 group">
      <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-xs" aria-label="User Entered">
        <UserIcon className="w-2 h-2" />
      </span>
      <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10">
        <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md whitespace-nowrap">
          User Entered
        </div>
      </div>
    </div>
  );
};

 return (
    <div className="p-2 mx-auto w-full bg-white dark:bg-gray-950 relative z-[1]">
      <PrimaryDetails personalDetails={personalDetails} masterData={masterData} />
      <div className="space-y-3">
        {sections.map((section) => (
          <div key={section.title}>
            <button
              className="w-full bg-indigo-300 px-4 rounded-lg border border-indigo-300 shadow-sm py-2 flex items-center justify-between text-left hover:bg-indigo-200 dark:bg-gray-800 dark:hover:bg-gray-900 dark:border-gray-600"
              onClick={toggleSection(section.title)}
            >
              <div className="flex items-center gap-4">
                <section.icon className="w-5 h-5 text-indigo-600" strokeWidth={2} />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">{section.title}</h2>
              </div>
              <ChevronDownIcon
                aria-hidden="true"
                className={`w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 ${openSections[section.title] ? 'rotate-180' : ''}`}
                strokeWidth={2}
              />
            </button>
            {openSections[section.title] && (
              <div className="bg-white dark:bg-gray-900 rounded-lg mt-3 pt-3">
                <div className="flex flex-wrap mx-2 items-center border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-gray-900 gap-3">
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
                {section.title === 'Personal Information' && !isPersonalInfoComplete && (
                  <div className="mt-3 mx-2 p-2 bg-white dark:bg-red-900/30 border border-red-600 dark:border-red-700 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400 text-xs" />
                      <p className="text-xs text-red-600 dark:text-red-200">
                        ⚠ Some information missing<br />
                        {filledCount} of {mandatoryFields.length} completed
                      </p>
                    </div>
                  </div>
                )}
                {section.title === 'Personal Information' && isPersonalInfoComplete && !isDbSparkApiEmpty && (
                  <div className="mt-3 mx-2 p-2 bg-white dark:bg-green-900/30 border border-green-600 dark:border-green-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" strokeWidth={2} />
                      <p className="text-sm text-green-600 dark:text-green-200">
                        Details saved successfully.
                      </p>
                    </div>
                  </div>
                )}
                {section.tabs ? (
                  <>
                    <div className="flex flex-col sm:flex-row dark:border-gray-600 px-2 py-3">
                      {section.tabs.map((tab) => (
                        <button
                          key={tab.label}
                          className={`flex-1 text-sm font-medium p-2 mx-0.5 m-1 rounded-t-xl sm:rounded-t-md ${
                            activeTabs[section.title] === tab.label
                              ? 'bg-gray-200 text-gray-900 border border-gray-300'
                              : 'bg-white border border-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
                          }`}
                          onClick={setActiveTab(section.title, tab.label)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 px-3">
                      {section.tabs
                        .find((tab) => tab.label === activeTabs[section.title])
                        ?.fields.map((field) => (
                          <div
                            key={field.key}
                            className="relative flex items-start gap-3 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 transition-shadow overflow-hidden"
                          >
                            {renderSparkIndicator(field.key)}
                            {renderGadOfficerIndicator(field.key)}
                            {renderUserIndicator(field.key)}
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                              <field.icon className="w-5 h-5 text-indigo-700 dark:text-indigo-300" />
                            </div>
                            <div className="flex-1 min-w-0 pr-6">
                              <p className="text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400 mb-0.5">
                                {field.label}
                              </p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white break-all line-clamp-3">
                                {field.computeValue
                                  ? (() => {
                                      const val = field.computeValue();
                                      return (val === null || val === undefined || Number.isNaN(val)) ? 'N/A' : String(val);
                                    })()
                                  : field.isMaster
                                    ? getMasterValue(personalDetails[field.key], field.key)
                                    : (personalDetails[field.key] && !Number.isNaN(personalDetails[field.key]))
                                      ? String(personalDetails[field.key])
                                      : 'N/A'}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  {section.title === 'Personal Information' && (
                    <div className="mt-3 mx-3 flex justify-end">
                      <div className="relative group">
                        <button
                          id="personal-info-edit-button"
                          className={`mb-3 px-2 py-1.5 border rounded-md transition-colors flex items-center gap-2 text-sm font-medium ${
                            isButtonDisabled
                              ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
                              : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-500'
                          }`}
                          onClick={handleEdit}
                          disabled={isButtonDisabled}
                        >
                          <span>Edit</span>
                          <PencilSquareIcon className="w-4 h-4" strokeWidth={2} />
                        </button>
                        {isButtonDisabled && (
                          <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                            Cannot edit personal details after the profile is submitted or approved
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  </>
                ) : (
                  <div className="space-y-6 px-3 py-3">
                    {section.cards.map((card, index) => (
                      <div key={index}>
                        <h3 className="text-md font-semibold text-gray-900 dark:text-indigo-300 mb-2">
                          {card.subtitle}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {card.fields.map((field) => (
                            <div
                              key={field.key}
                              className="relative flex items-start gap-3 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 transition-shadow overflow-hidden"
                            >
                              {renderSparkIndicator(field.key)}
                              {renderGadOfficerIndicator(field.key)}
                              {renderUserIndicator(field.key)}
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                              <field.icon className="w-5 h-5 text-indigo-700 dark:text-indigo-300" />
                              </div>
                              <div className="flex-1 min-w-0 pr-6">
                                <p className="text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400 mb-0.5">
                                  {field.label}
                                </p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white break-all line-clamp-3">
                                  {field.computeValue
                                    ? (() => {
                                        const val = field.computeValue();
                                        return (val === null || val === undefined || Number.isNaN(val)) ? 'N/A' : val;
                                      })()
                                    : field.isMaster
                                      ? getMasterValue(personalDetails[field.key], field.key)
                                      : (personalDetails[field.key] && !Number.isNaN(personalDetails[field.key]))
                                        ? personalDetails[field.key]
                                        : 'N/A'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <ModalPersonalDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        personalDetails={formData}
        onSave={handleSave}
        masterData={masterData}
        sparkFields={sparkFields}
        officerFields={officerFields}
      />
    </div>
  );
}

