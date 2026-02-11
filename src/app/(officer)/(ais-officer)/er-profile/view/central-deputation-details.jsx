'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BriefcaseIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  GlobeAltIcon,
  HomeIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { BoltIcon, UserIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { ModalCentralDeputation } from '../modal/central-deputation-details';
import { toast } from 'react-toastify';
import axiosInstance from '@/utils/apiClient';
import { useProfileCompletion } from '@/contexts/Profile-completion-context';
import ConfirmModal from '@/app/components/confirmModal';
import moment from 'moment';

export function CentralDeputationDetails({ profileData }) {
  const { updateSectionProgress } = useProfileCompletion();
  const [isModalOpen, setModalOpen] = useState(false);
  const [deputationDetails, setDeputationDetails] = useState([]);
  const [selectedDeputation, setSelectedDeputation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [masterData, setMasterData] = useState({
    state: [],
    tenures: [],
    ministry: [],
    administrative_department: [],
    agency: [],
    deputation_type: [],
  });
  const [officerFields, setOfficerFields] = useState({
    GAD_OFFICER: [],
    AIS_OFFICER: [],
    DB_SPARK_API: [],
  });
  const [sparkFields, setSparkFields] = useState(new Set());
  const [localProfileData, setLocalProfileData] = useState(profileData);
  
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deputationToDelete, setDeputationToDelete] = useState(null);
  
  // Get profile status from sessionStorage
  const profileStatus = sessionStorage.getItem('profile_status');
  console.log('profile_status:==========================================', sessionStorage.getItem('profile_status'));
  console.log('profile_status type:', typeof profileStatus, 'value:', profileStatus);
  const isButtonDisabled = profileStatus === '2' || profileStatus === '3'; // Disable for submitted or approved
  console.log('isButtonDisabled:', isButtonDisabled, 'profileStatus:', profileStatus);

 

  // Button Handlers
  const handleAdd = useCallback(
    (e) => {
      e.stopPropagation();
      const roleId = sessionStorage.getItem('role_id');
      const userSource = roleId === '2' ? 'AIS_OFFICER' : 'GAD_OFFICER';
      setSelectedDeputation({
        cen_dep_id: null,
        cen_designation: '',
        phone_no: '',
        state_id: '',
        raw_state: '',
        start_date: '',
        end_date: '',
        tenure_id: '',
        raw_tenure: '',
        cen_min_id: '',
        raw_ministry: '',
        cen_dept_id: '',
        raw_department: '',
        cen_org_id: '',
        deputation_type: '',
        raw_organisation: '',
        _source: userSource,
        isSaved: false,
        fieldSources: {
          cen_designation: userSource,
          phone_no: userSource,
          state_id: userSource,
          start_date: userSource,
          end_date: userSource,
          tenure_id: userSource,
          cen_min_id: userSource,
          cen_dept_id: userSource,
          cen_org_id: userSource,
          deputation_type: userSource,
        },
      });
      setModalOpen(true);
    },
    []
  );

  const handleEdit = useCallback(
    (deputation) => (e) => {
      e.stopPropagation();
      const cleanDeputation = {
        cen_dep_id: String(deputation.cen_dep_id),
        cen_designation: deputation.cen_designation || '',
        phone_no: deputation.phone_no || '',
        state_id: deputation.state_id || '',
        raw_state: deputation.raw_state || '',
        start_date: deputation.start_date || '',
        end_date: deputation.end_date || '',
        tenure_id: deputation.tenure_id || '',
        raw_tenure: deputation.raw_tenure || '',
        cen_min_id: deputation.cen_min_id || '',
        raw_ministry: deputation.raw_ministry || '',
        cen_dept_id: deputation.cen_dept_id || '',
        raw_department: deputation.raw_department || '',
        cen_org_id: deputation.cen_org_id || '',
        deputation_type: deputation.deputation_type || '',
        raw_organisation: deputation.raw_organisation || '',
        _source: deputation._source || 'MIXED',
        isSaved: deputation.isSaved,
        fieldSources: deputation.fieldSources || {},
      };
      setSelectedDeputation(cleanDeputation);
      setModalOpen(true);
    },
    []
  );



  // ALL EXISTING CODE BELOW REMAINS EXACTLY THE SAME
  const fields = [
    { label: 'Designation', key: 'cen_designation', icon: BriefcaseIcon },
    { label: 'Phone', key: 'phone_no', icon: PhoneIcon },
    { label: 'State', key: 'state_id', icon: MapPinIcon, isMaster: true, rawKey: 'raw_state' },
    { label: 'Start Date', key: 'start_date', icon: CalendarIcon, isDate: true },
    { label: 'End Date', key: 'end_date', icon: CalendarIcon, isDate: true },
    { label: 'Tenure', key: 'tenure_id', icon: UserGroupIcon, isMaster: true, rawKey: 'raw_tenure' },
    { label: 'Ministry/Department', key: 'cen_min_id', icon: BuildingOffice2Icon, isMaster: true, rawKey: 'raw_ministry' },
    { label: 'Department', key: 'cen_dept_id', icon: GlobeAltIcon, isMaster: true, rawKey: 'raw_department' },
    { label: 'Office', key: 'cen_org_id', icon: HomeIcon, isMaster: true, rawKey: 'raw_organisation' },
    { label: 'Deputation Type', key: 'deputation_type', icon: PencilSquareIcon, isMaster: true, rawKey: 'deputation_type' },
  ];

  const leftColumnFields = fields.slice(0, 5);
  const rightColumnFields = fields.slice(5);

  // Initialize localProfileData from sessionStorage
  useEffect(() => {
    const storedProfile = sessionStorage.getItem('profileData');
    if (storedProfile) {
      setLocalProfileData(JSON.parse(storedProfile));
    } else {
      setLocalProfileData(profileData);
    }
  }, [profileData]);

  // Fetch master data
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const masters = await Promise.all([
          axiosInstance.get('/masters/state-all'),
          axiosInstance.get('/masters/tenure-all'),
          axiosInstance.get('/masters/ministry-all'),
          axiosInstance.get('/masters/administrative_department-all'),
          axiosInstance.get('/masters/agency-all'),
          axiosInstance.get('/masters/deputation_type-all'),

        ]);

        const masterDataResponse = {
          state: masters[0].data.data.state || [],
          tenures: masters[1].data.data.tenure || [],
          ministry: masters[2].data.data.ministry || [],
          administrative_department: masters[3].data.data.departments || [],
          agency: masters[4].data.data || [],
          deputation_type: masters[5].data.data.deputation_type || [],
        };
        setMasterData(masterDataResponse);
      } catch (err) {
        console.error('Error fetching master data:', err);
        setError('Failed to fetch master data');
        toast.error('Failed to fetch master data', {
          className: 'bg-red-500 text-white',
          progressClassName: 'bg-red-200',
        });
      }
    };

    fetchMasterData();
  }, []);

  const getMasterValue = useCallback(
    (id, key) => {
      if (!id && id !== 0) return 'N/A';
      const dataMap = {
        state_id: { data: masterData.state, id: 'state_id', value: 'state' },
        tenure_id: { data: masterData.tenures, id: 'tenure_id', value: 'tenures' },
        cen_min_id: { data: masterData.ministry, id: 'ministry_id', value: 'ministry' },
        cen_dept_id: {data: masterData.administrative_department, id: 'administrative_department_id', value: 'administrative_department'},
        cen_org_id: { data: masterData.agency, id: 'agency_id', value: 'agency' },
        deputation_type: { data: masterData.deputation_type, id: 'deputation_type_id', value: 'deputation_type' },
      };

      if (dataMap[key]) {
        const { data, id: idField, value } = dataMap[key];
        const match = data.find((item) => String(item[idField]) === String(id));
        return match ? match[value] : 'N/A';
      }
      return 'N/A';
    },
    [masterData]
  );

  const getDeputationStatus = useCallback((startDate, endDate) => {
    if (!startDate) return 'N/A';
    const today = moment();
    const start = moment(startDate);
    const end = endDate ? moment(endDate) : null;
    if (today.isBefore(start)) return 'Upcoming';
    if (end && today.isAfter(end)) return 'Past';
    return 'Current';
  }, []);

  const mapDeputationData = useCallback(
    (sparkData, dbDeputations = []) => {
      const sparkKeys = new Set();
      let tempSparkList = [];

      if (sparkData?.deputation_details?.length > 0) {
        tempSparkList = sparkData.deputation_details.map((dep, index) => {
          const stateMatch = masterData.state.find(
            (s) => s.state.toLowerCase() === (dep.state || '').toLowerCase()
          );
          const tenureMatch = masterData.tenures.find(
            (t) => t.tenures.toLowerCase() === (dep.tenure || '').toLowerCase()
          );
          const ministryMatch = masterData.ministry.find(
            (m) => m.ministry.toLowerCase() === (dep.ministry || '').toLowerCase()
          );
          const deptMatch = masterData.administrative_department.find(
            (d) => d.administrative_department.toLowerCase() === (dep.department || '').toLowerCase()
          );
          const agencyMatch = masterData.agency.find(
            (a) => a.agency.toLowerCase() === (dep.organisation || '').toLowerCase()
          );
          const deputationTypeMatch = masterData.deputation_type.find(
            (d) => d.deputation_type.toLowerCase() === (dep.deputation_type || '').toLowerCase()
          );

          const deputation = {
            cen_dep_id: `spark_${index}`,
            cen_designation: dep.designation || '',
            phone_no: dep.phone_no || '',
            state_id: stateMatch ? stateMatch.state_id : '',
            raw_state: dep.state || '',
            start_date: dep.start_date || '',
            end_date: dep.end_date || '',
            tenure_id: tenureMatch ? tenureMatch.tenure_id : '',
            raw_tenure: dep.tenure || '',
            cen_min_id: ministryMatch ? ministryMatch.ministry_id : '',
            raw_ministry: dep.ministry || '',
            cen_dept_id: deptMatch ? deptMatch.administrative_department_id : '',
            raw_department: dep.department || '',
            cen_org_id: agencyMatch ? agencyMatch.agency_id : '',
            deputation_type: deputationTypeMatch ? deputationTypeMatch.deputation_type_id : '',
            raw_organisation: dep.organisation || '',
            _source: 'SPARK',
            isSaved: false,
            fieldSources: {
              cen_designation: 'SPARK',
              phone_no: 'SPARK',
              state_id: 'SPARK',
              start_date: 'SPARK',
              end_date: 'SPARK',
              tenure_id: 'SPARK',
              cen_min_id: 'SPARK',
              cen_dept_id: 'SPARK',
              cen_org_id: 'SPARK',
              deputation_type: 'SPARK',
            },
          };

          [
            'cen_designation',
            'phone_no',
            'state_id',
            'start_date',
            'end_date',
            'tenure_id',
            'cen_min_id',
            'cen_dept_id',
            'cen_org_id',
            'deputation_type',
          ].forEach((key) => {
            let fieldValue;
            if (key === 'cen_designation') {
              fieldValue = dep.designation;
            } else {
              fieldValue = dep[key.replace('cen_', '').replace('_id', '')];
            }
            if (fieldValue) {
              sparkKeys.add(`${key}_${index}`);
            }
          });

          return deputation;
        });
      }

      const dbDeputationsList = dbDeputations.map((dbDep) => {
        const fieldSources = {};
        const getField = (key) => {
          if (dbDep.fields?.GAD_OFFICER && dbDep.fields.GAD_OFFICER[key] !== undefined) {
            fieldSources[key] = 'GAD_OFFICER';
            return dbDep.fields.GAD_OFFICER[key];
          } else if (dbDep.fields?.AIS_OFFICER && dbDep.fields.AIS_OFFICER[key] !== undefined) {
            fieldSources[key] = 'AIS_OFFICER';
            return dbDep.fields.AIS_OFFICER[key];
          } else if (dbDep.fields?.UNKNOWN && dbDep.fields.UNKNOWN[key] !== undefined) {
            fieldSources[key] = 'UNKNOWN';
            return dbDep.fields.UNKNOWN[key];
          } else {
            fieldSources[key] = null;
            return '';
          }
        };

        const cenDesignation = getField('cen_designation');
        const phoneNo = getField('phone_no');
        const stateId = getField('state_id');
        const startDate = getField('start_date');
        const endDate = getField('end_date');
        const tenureId = getField('tenure_id');
        const cenMinId = getField('cen_min_id');
        const cenDeptId = getField('cen_dept_id');
        const cenOrgId = getField('cen_org_id');
        const deputationTypeId = getField('deputation_type');

        const sourcesUsed = Object.values(fieldSources).filter((s) => s !== null);
        const uniqueSources = new Set(sourcesUsed);
        const _source = uniqueSources.size === 1 ? [...uniqueSources][0] : 'MIXED';

        return {
          cen_dep_id: String(dbDep.cen_dep_id),
          cen_designation: cenDesignation,
          phone_no: phoneNo,
          state_id: stateId,
          raw_state: getMasterValue(stateId, 'state_id') || '',
          start_date: startDate,
          end_date: endDate,
          tenure_id: tenureId,
          raw_tenure: getMasterValue(tenureId, 'tenure_id') || '',
          cen_min_id: cenMinId,
          raw_ministry: getMasterValue(cenMinId, 'cen_min_id') || '',
          cen_dept_id: cenDeptId,
          raw_department: getMasterValue(cenDeptId, 'cen_dept_id') || '',
          cen_org_id: cenOrgId,
          deputation_type: deputationTypeId,
          raw_organisation: getMasterValue(cenOrgId, 'cen_org_id') || '',
          _source,
          isSaved: true,
          fieldSources,
        };
      });

      const matchedSparkIndices = new Set();
      dbDeputationsList.forEach((dbDep) => {
        const matchedIndex = tempSparkList.findIndex((sparkDep, sparkIndex) => {
          const sparkDesignation = String(sparkDep.cen_designation || '').toLowerCase();
          const dbDesignation = String(dbDep.cen_designation || '').toLowerCase();
          const sparkStartDate = String(sparkDep.start_date || '').toLowerCase();
          const dbStartDate = String(dbDep.start_date || '').toLowerCase();
          const sparkOrg = String(
            getMasterValue(sparkDep.cen_org_id, 'cen_org_id') || sparkDep.raw_organisation || ''
          ).toLowerCase();
          const dbOrg = String(dbDep.raw_organisation || '').toLowerCase();

          return (
            sparkDesignation === dbDesignation &&
            sparkStartDate === dbStartDate &&
            sparkOrg === dbOrg
          );
        });

        if (matchedIndex !== -1) {
          matchedSparkIndices.add(matchedIndex);
          const sparkDep = tempSparkList[matchedIndex];
          const dbFields = dbDeputations.find((d) => String(d.cen_dep_id) === dbDep.cen_dep_id)?.fields || {};

          const keys = [
            'cen_designation',
            'phone_no',
            'state_id',
            'start_date',
            'end_date',
            'tenure_id',
            'cen_min_id',
            'cen_dept_id',
            'cen_org_id',
            'deputation_type',
          ];

          const fieldSources = {};
          keys.forEach((key) => {
            const gadValue = dbFields?.GAD_OFFICER?.[key];
            const aisValue = dbFields?.AIS_OFFICER?.[key];
            if (gadValue !== undefined) {
              fieldSources[key] = 'GAD_OFFICER';
              sparkDep[key] = gadValue;
            } else if (aisValue !== undefined) {
              fieldSources[key] = 'AIS_OFFICER';
              sparkDep[key] = aisValue;
            } else {
              fieldSources[key] = 'SPARK';
            }
          });

          sparkDep.raw_state = getMasterValue(sparkDep.state_id, 'state_id');
          sparkDep.raw_tenure = getMasterValue(sparkDep.tenure_id, 'tenure_id');
          sparkDep.raw_ministry = getMasterValue(sparkDep.cen_min_id, 'cen_min_id');
          sparkDep.raw_department = getMasterValue(sparkDep.cen_dept_id, 'cen_dept_id');
          sparkDep.raw_organisation = getMasterValue(sparkDep.cen_org_id, 'cen_org_id');
          sparkDep.raw_deputation_type = getMasterValue(sparkDep.deputation_type, 'deputation_type');

          sparkDep.isSaved = true;
          sparkDep.cen_dep_id = dbDep.cen_dep_id;
          sparkDep.fieldSources = fieldSources;

          const sourcesUsed = Object.values(fieldSources);
          const uniqueSources = new Set(sourcesUsed);
          sparkDep._source = uniqueSources.size === 1 ? [...uniqueSources][0] : 'MIXED';
        }
      });

      const finalDetails = [
        ...tempSparkList.filter((_, index) => !matchedSparkIndices.has(index)),
        ...tempSparkList.filter((_, index) => matchedSparkIndices.has(index)),
        ...dbDeputationsList.filter((dbDep) =>
          !tempSparkList.some((sparkDep) => sparkDep.cen_dep_id === dbDep.cen_dep_id)
        ),
      ].reduce((unique, current) => {
        if (!unique.some((item) => String(item.cen_dep_id) === String(current.cen_dep_id))) {
          unique.push(current);
        }
        return unique;
      }, []);

      finalDetails.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

      return { details: finalDetails, sparkKeys };
    },
    [masterData, getMasterValue]
  );

  // Process deputation data
  const processDeputationData = useCallback(() => {
    if (!localProfileData) {
      return;
    }

    try {
      setLoading(true);
      const sparkData = localProfileData.spark_data?.data || {};
      const officerInfo = localProfileData.officer_data?.get_all_officer_info_by_user_id?.officer_info?.[0] || {};
      const dbDeputations = localProfileData.officer_data?.get_all_officer_info_by_user_id?.central_deputation || [];

      const officerFieldsData = {
        GAD_OFFICER: officerInfo?.fields?.GAD_OFFICER ? Object.keys(officerInfo.fields.GAD_OFFICER) : [],
        AIS_OFFICER: officerInfo?.fields?.AIS_OFFICER ? Object.keys(officerInfo.fields.AIS_OFFICER) : [],
        DB_SPARK_API: officerInfo?.fields?.DB_SPARK_API ? Object.keys(officerInfo.fields.DB_SPARK_API) : [],
      };
      setOfficerFields(officerFieldsData);

      const { details: mappedDetails, sparkKeys } = mapDeputationData(sparkData, dbDeputations);

      setDeputationDetails((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(mappedDetails)) {
          // sessionStorage.setItem('central_deputation_details', JSON.stringify(mappedDetails));
          return mappedDetails;
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
      console.error('Error processing deputation data:', err);
      setError('Failed to process deputation data.');
    } finally {
      setLoading(false);
    }
  }, [masterData, localProfileData, mapDeputationData]);

  useEffect(() => {
    const storedDeputations = sessionStorage.getItem('central_deputation_details');
    if (storedDeputations) {
      setDeputationDetails(JSON.parse(storedDeputations));
    }
    processDeputationData();
  }, [masterData, localProfileData, mapDeputationData, processDeputationData]);


    const handleDeleteClick = useCallback(deputation => {
    setDeputationToDelete(deputation);
    setIsDeleteModalOpen(true);
  }, []);

    const handleDeleteConfirm = useCallback(async () => {
      if (!deputationToDelete) return;

    const deputationId = deputationToDelete.cen_dep_id;
    if (isButtonDisabled) {
      toast.error("Cannot delete deputation after the profile is submitted or approved", {
        className: "bg-red-500 text-white",
        progressClassName: "bg-red-200",
      });
      return;
    }

    // TODO: Add actual delete functionality later
    console.log("Delete deputation with ID:", deputationId);

    
      // Check if it's a SPARK entry (not saved to DB yet)
      if (typeof deputationId === "string" && deputationId.startsWith("spark_")) {

        // Remove from local state only
        setDeputationDetails(prev => prev.filter(d => d.cen_dep_id !== deputationId));
        toast.success("Deputation removed successfully", {
          className: "bg-primary-500 text-white",
          progressClassName: "bg-primary-200",
        });
        return;
      } 
      // For saved entries, call the API
      setDeleteLoading(deputationId);
      try {
        const response = await axiosInstance.delete(`/officer/deputation_delete/${deputationId}`);
        if (response.data.success) {
          // Remove from local state
          setDeputationDetails(prev => prev.filter(d => String(d.cen_dep_id) !== String(deputationId)));
          toast.success("Deputation deleted successfully", {
           className: "bg-primary-500 text-white",
           progressClassName: "bg-primary-200",
        });
      } else {
        throw new Error("Failed to delete deputation");
      }
    } catch (err) {
      console.error("Error deleting deputation:", err);
      toast.error("Failed to delete deputation", {
        className: "bg-red-500 text-white",
        progressClassName: "bg-red-200",
      });
    } finally {
      setDeleteLoading(null);
      setIsDeleteModalOpen(false);
      setDeputationToDelete(null);
    }
    
  }, [isButtonDisabled, deputationDetails, deputationToDelete]);


  const handleSave = useCallback(
    async (updatedData) => {
      try {
        console.log('Incoming updatedData:', JSON.stringify(updatedData, null, 2));

        const isSparkEntry = selectedDeputation?.cen_dep_id?.startsWith('spark_');
        const isUpdate = selectedDeputation?.cen_dep_id && !isSparkEntry;
        const isNew = !selectedDeputation || !selectedDeputation.cen_dep_id;

        const requestBody = {
          spark_data: updatedData.spark_data || null,
          user_data: updatedData.user_data || {
            cen_designation: null,
            phone_no: null,
            state_id: null,
            start_date: null,
            end_date: null,
            tenure_id: null,
            cen_min_id: null,
            cen_dept_id: null,
            cen_org_id: null,
            deputation_type: null,
          },
        };

        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        if (!requestBody.user_data || typeof requestBody.user_data !== 'object') {
          throw new Error('Invalid user_data structure');
        }
        if (requestBody.spark_data && typeof requestBody.spark_data !== 'object') {
          throw new Error('Invalid spark_data structure');
        }

        let response;
        const roleId = sessionStorage.getItem('role_id');
        const userSource = roleId === '2' ? 'AIS_OFFICER' : 'GAD_OFFICER';
        const OfficerUserId = sessionStorage.getItem('OfficerUserId');

        if (roleId === '2') {
          if (isSparkEntry || isNew) {
            response = await axiosInstance.post('/officer/central-deputation', requestBody);
          } else if (isUpdate) {
            response = await axiosInstance.put(
              `/officer/central-deputation/${selectedDeputation.cen_dep_id}`,
              requestBody
            );
          }
        } else if (roleId === '3') {
          if (isSparkEntry || isNew) {
            response = await axiosInstance.post(
              `/clerk/central_deputation/${OfficerUserId}`,
              requestBody
            );
          } else if (isUpdate) {
            response = await axiosInstance.put(
              `/clerk/central_deputation/${OfficerUserId}/${selectedDeputation.cen_dep_id}`,
              requestBody
            );
          }
        }

        if (response.data.success) {
          const savedDeputation = response.data.data.central_deputation;

          const prevFieldSources = isUpdate ? selectedDeputation?.fieldSources || {} : {};
          const fieldSources = {
            cen_designation: requestBody.user_data.cen_designation !== null && requestBody.user_data.cen_designation !== undefined
              ? userSource
              : prevFieldSources.cen_designation || (savedDeputation.cen_designation ? 'SPARK' : null),
            phone_no: requestBody.user_data.phone_no !== null && requestBody.user_data.phone_no !== undefined
              ? userSource
              : prevFieldSources.phone_no || (savedDeputation.phone_no ? 'SPARK' : null),
            state_id: requestBody.user_data.state_id !== null && requestBody.user_data.state_id !== undefined
              ? userSource
              : prevFieldSources.state_id || (savedDeputation.state_id ? 'SPARK' : null),
            start_date: requestBody.user_data.start_date !== null && requestBody.user_data.start_date !== undefined
              ? userSource
              : prevFieldSources.start_date || (savedDeputation.start_date ? 'SPARK' : null),
            end_date: requestBody.user_data.end_date !== null && requestBody.user_data.end_date !== undefined
              ? userSource
              : prevFieldSources.end_date || (savedDeputation.end_date ? 'SPARK' : null),
            tenure_id: requestBody.user_data.tenure_id !== null && requestBody.user_data.tenure_id !== undefined
              ? userSource
              : prevFieldSources.tenure_id || (savedDeputation.tenure_id ? 'SPARK' : null),
            cen_min_id: requestBody.user_data.cen_min_id !== null && requestBody.user_data.cen_min_id !== undefined
              ? userSource
              : prevFieldSources.cen_min_id || (savedDeputation.cen_min_id ? 'SPARK' : null),
            cen_dept_id: requestBody.user_data.cen_dept_id !== null && requestBody.user_data.cen_dept_id !== undefined
              ? userSource
              : prevFieldSources.cen_dept_id || (savedDeputation.cen_dept_id ? 'SPARK' : null),
            cen_org_id: requestBody.user_data.cen_org_id !== null && requestBody.user_data.cen_org_id !== undefined
              ? userSource
              : prevFieldSources.cen_org_id || (savedDeputation.cen_org_id ? 'SPARK' : null),
            deputation_type: requestBody.user_data.deputation_type !== null && requestBody.user_data.deputation_type !== undefined
              ? userSource
              : prevFieldSources.deputation_type || (savedDeputation.deputation_type ? 'SPARK' : null),
          };

          const sourcesUsed = Object.values(fieldSources).filter((s) => s !== null);
          const uniqueSources = new Set(sourcesUsed);
          const _source = uniqueSources.size === 1 ? [...uniqueSources][0] : 'MIXED';

          const updatedDeputation = {
            cen_dep_id: String(savedDeputation.cen_dep_id),
            cen_designation: savedDeputation.cen_designation || '',
            phone_no: savedDeputation.phone_no || '',
            state_id: savedDeputation.state_id || '',
            raw_state: getMasterValue(savedDeputation.state_id, 'state_id') || '',
            start_date: savedDeputation.start_date || '',
            end_date: savedDeputation.end_date || '',
            tenure_id: savedDeputation.tenure_id || '',
            raw_tenure: getMasterValue(savedDeputation.tenure_id, 'tenure_id') || '',
            cen_min_id: savedDeputation.cen_min_id || '',
            raw_ministry: getMasterValue(savedDeputation.cen_min_id, 'cen_min_id') || '',
            cen_dept_id: savedDeputation.cen_dept_id || '',
            raw_department: getMasterValue(savedDeputation.cen_dept_id, 'cen_dept_id') || '',
            cen_org_id: savedDeputation.cen_org_id || '',
            deputation_type: savedDeputation.deputation_type || '',
            raw_organisation: getMasterValue(savedDeputation.cen_org_id, 'cen_org_id') || '',
            _source,
            isSaved: true,
            fieldSources,
          };

          setDeputationDetails((prevData = []) => {
            let updatedDetails;
            if (isSparkEntry) {
              updatedDetails = [
                ...prevData.filter((d) => String(d.cen_dep_id) !== String(selectedDeputation.cen_dep_id)),
                updatedDeputation,
              ];
            } else if (isUpdate) {
              updatedDetails = prevData.map((deputation) =>
                String(deputation.cen_dep_id) === String(selectedDeputation.cen_dep_id)
                  ? updatedDeputation
                  : deputation
              );
            } else {
              updatedDetails = [...prevData, updatedDeputation];
            }

            // Update sessionStorage
            sessionStorage.setItem('central_deputation_details', JSON.stringify(updatedDetails));

            // Update localProfileData
            const updatedProfileData = {
              ...localProfileData,
              officer_data: {
                ...localProfileData.officer_data,
                get_all_officer_info_by_user_id: {
                  ...localProfileData.officer_data?.get_all_officer_info_by_user_id,
                  central_deputation: updatedDetails.map((dep) => ({
                    cen_dep_id: dep.cen_dep_id,
                    fields: {
                      GAD_OFFICER: Object.keys(dep.fieldSources)
                        .filter((key) => dep.fieldSources[key] === 'GAD_OFFICER')
                        .reduce((acc, key) => ({ ...acc, [key]: dep[key] }), {}),
                      AIS_OFFICER: Object.keys(dep.fieldSources)
                        .filter((key) => dep.fieldSources[key] === 'AIS_OFFICER')
                        .reduce((acc, key) => ({ ...acc, [key]: dep[key] }), {}),
                      UNKNOWN: {},
                    },
                  })),
                },
              },
            };
            setLocalProfileData(updatedProfileData);
            sessionStorage.setItem('profileData', JSON.stringify(updatedProfileData));

            return updatedDetails;
          });

          setSparkFields((prev) => {
            const newSparkFields = new Set(prev);
            if (isSparkEntry) {
              const index = parseInt(selectedDeputation.cen_dep_id.split('_')[1]);
              [
                'cen_designation',
                'phone_no',
                'state_id',
                'start_date',
                'end_date',
                'tenure_id',
                'cen_min_id',
                'cen_dept_id',
                'cen_org_id',
                'deputation_type',
              ].forEach((key) => {
                newSparkFields.delete(`${key}_${index}`);
              });
            }
            [
              'cen_designation',
              'phone_no',
              'state_id',
              'start_date',
              'end_date',
              'tenure_id',
              'cen_min_id',
              'cen_dept_id',
              'cen_org_id',
              'deputation_type',
            ].forEach((key) => {
              if (
                fieldSources[key] === 'SPARK' &&
                savedDeputation[key] !== null &&
                savedDeputation[key] !== undefined
              ) {
                newSparkFields.add(`${key}_${savedDeputation.cen_dep_id}`);
              }
            });
            return newSparkFields;
          });

          setModalOpen(false);
          setSelectedDeputation(null);
          toast.success(
            isUpdate ? ' Deputation updated successfully' : ' Deputation added successfully',
            {
              className: 'bg-primary-500 text-white',
              progressClassName: 'bg-primary-200',
            }
          );
        } else {
          toast.error('Failed to save Deputation details', {
            className: 'bg-red-500 text-white',
            progressClassName: 'bg-red-200',
          });
        }
      } catch (err) {
        console.error('Error saving  Deputation:', err);
        toast.error('Error occurred while saving  Deputation', {
          className: 'bg-red-500 text-white',
          progressClassName: 'bg-red-200',
        });
      }
    },
    [selectedDeputation, getMasterValue, localProfileData]
  );

  useEffect(() => {
    if (!loading && deputationDetails) {

      console.log('Deputation Details for Progress Calculation:', deputationDetails);
      const total = deputationDetails.length;
      const completed = deputationDetails.filter((d) => d.isSaved).length;
      updateSectionProgress('central_deputation', total === 0 ? 0 : completed, total === 0 ? 0 : total);
    }
  }, [
    loading,
    updateSectionProgress,
    deputationDetails?.length,
    deputationDetails?.map((d) => d.isSaved).join(','),
  ]);

   // Common Button Helper Functions
  const renderAddButton = () => {
    if (sessionStorage.getItem('role_id') !== '2') return null;
    
    return (
      <div className="relative group">
        <button
          className={`px-2 py-2 rounded-md flex items-center gap-2 text-[0.875rem] font-medium self-end sm:self-center transition-colors ${
            isButtonDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
          }`}
          onClick={handleAdd}
          disabled={isButtonDisabled}
        >
          <PlusIcon className="w-4 h-4" strokeWidth={2} />
          <span>Add Deputation</span>
        </button>
        {isButtonDisabled && (
          <div
            className={`absolute right-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap`}
          >
            Cannot add deputations after the profile is submitted or approved
          </div>
        )}
      </div>
    );
  };

  const renderEditButton = (deputation, index) => {
    if (sessionStorage.getItem('role_id') !== '2') return null;
    
    return (
      <div className="relative group">
        <button
          className={`${
            isButtonDisabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400'
          }`}
          onClick={handleEdit(deputation)}
          disabled={isButtonDisabled}
        >
          <PencilSquareIcon className="w-4 h-4" strokeWidth={2} />
        </button>
        <div
          className={`absolute right-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap`}
        >
          {isButtonDisabled ? 'Cannot edit deputations after the profile is submitted or approved' : 'Edit Deputation'}
        </div>
      </div>
    );
  };

  const renderDeleteButton = (deputation) => {
    if (sessionStorage.getItem('role_id') !== '2') return null;

    const hasSparkData = Object.values(deputation.fieldSources || {}).some(
      (source) => source === "SPARK"
    );
    if (hasSparkData) return null;

    const isLoading = deleteLoading === deputation.cen_dep_id;
    
    return (
      <div className="relative group">
        <button
          className={`${
            isButtonDisabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-red-600 hover:text-red-500 dark:hover:text-red-400'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => handleDeleteClick(deputation)}
          disabled={isButtonDisabled || isLoading}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-t-2 border-b-2 border-red-600 rounded-full animate-spin"></div>
          ) : (
            <TrashIcon className="w-4 h-4" strokeWidth={2} />
          )}
        </button>
        <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          {isButtonDisabled ? 'Cannot delete deputations after the profile is submitted or approved' : 'Delete'}
        </div>
      </div>
    );
  };

  const renderSparkIndicator = (fieldKey, fieldSource) => {
    if (fieldSource !== 'SPARK') return null;
    return (
      <div className="absolute top-2 right-2 group">
        <span className="inline-flex items-center p-0.5 rounded-full bg-orange-100 text-orange-600 text-[8px]" aria-label="Synced from SPARK">
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
    if (fieldSource !== 'AIS_OFFICER' && fieldSource !== 'UNKNOWN') return null;
    return (
      <div className="absolute top-2 right-2 group">
        <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-[8px]" aria-label="User Entered">
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

  const renderGadIndicator = (fieldKey, fieldSource) => {
    if (fieldSource !== 'GAD_OFFICER') return null;
    return (
      <div className="absolute top-2 right-2 group">
        <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-[8px]" aria-label="Updated by AS-II">
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
            isSaved ? 'text-green-600' : 'text-red-600'
          } text-xs`}
          aria-label={isSaved ? 'Saved' : 'Not Saved'}
        >
          {isSaved ? (
            <CheckCircleIcon className="w-4 h-4" strokeWidth={2} />
          ) : (
            <ExclamationTriangleIcon className="w-4 h-4" strokeWidth={2} />
          )}
        </span>
        <div className="absolute left-0 top-full mt-0.5 hidden group-hover:block z-10">
          <div className="bg-gray-800 text-white text-xs rounded px-1 py-0.5 whitespace-nowrap">
            {isSaved ? 'Saved' : 'Not Saved'}
          </div>
        </div>
      </div>
    );
  };

  const sections = useMemo(
    () =>
      [
        {
          cards: deputationDetails.map((deputation, index) => ({
            cen_dep_id: deputation.cen_dep_id,
            isSaved: deputation.isSaved,
            fields: fields.map((field) => ({
              label: field.label,
              key: `${field.key}_${index}`,
              originalKey: field.key,
              icon: field.icon,
              isMaster: field.isMaster || false,
              computeValue: () => {
                const val = deputation[field.key];
                if (val === null || val === undefined || val === '') return 'N/A';
                if (field.isDate) {
                  return moment(val).format('DD/MM/YYYY');
                }
                if (field.isMaster) {
                  return getMasterValue(val, field.key) || deputation[field.rawKey] || 'N/A';
                }
                return val;
              },
            })),
          })),
        },
      ],
    [deputationDetails, getMasterValue]
  );

  if (error) {
    return (
      <div className="text-red-500 text-center p-3 rounded-md bg-red-50 dark:bg-red-900/30 text-sm">
        {error}
      </div>
    );
  }

return (
    <div className="p-2 mx-auto w-full  bg-white dark:bg-gray-900">
      <div className="flex flex-col sm:flex-row sm:justify-between items-center my-5 gap-4">
        <div className="flex flex-wrap items-center border rounded-md px-3 py-2 bg-white dark:bg-gray-800 gap-3">
          <div className="flex items-center space-x-2 min-w-[120px]">
            <span className="inline-flex items-center p-0.5 rounded-full bg-orange-100 text-orange-600 text-[0.65rem]">
              <BoltIcon className="w-2 h-2" />
            </span>
            <span className="text-[0.875rem] text-gray-700 dark:text-white truncate">Synced from SPARK</span>
          </div>
          <div className="flex items-center space-x-2 min-w-[120px]">
            <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-[0.65rem]">
              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" />
              </svg>
            </span>
            <span className="text-[0.875rem] text-gray-700 dark:text-white truncate">Updated by AS-II</span>
          </div>
          <div className="flex items-center space-x-2 min-w-[120px]">
            <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-[0.65rem]">
              <UserIcon className="w-2 h-2" />
            </span>
            <span className="text-[0.875rem] text-gray-700 dark:text-white truncate">User Entered</span>
          </div>
          <div className="flex items-center space-x-2 min-w-[120px]">
            <span className="inline-flex items-center rounded-full text-green-600 text-[0.65rem]">
              <CheckCircleIcon className="w-4 h-4" strokeWidth={2} />
            </span>
            <span className="text-[0.875rem] text-gray-700 dark:text-white truncate">Saved</span>
          </div>
          <div className="flex items-center space-x-2 min-w-[120px]">
            <span className="inline-flex items-center rounded-full text-red-600 text-[0.65rem]">
              <ExclamationTriangleIcon className="w-4 h-4" strokeWidth={2} />
            </span>
            <span className="text-[0.875rem] text-gray-700 dark:text-white truncate">Not Saved</span>
          </div>
        </div>
       {renderAddButton()}
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : sections[0].cards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-6">
          {sections[0].cards.map((card, index) => {
            const status = getDeputationStatus(
              deputationDetails[index].start_date,
              deputationDetails[index].end_date
            );
            return (
              <div
                key={card.cen_dep_id}
                className="relative bg-gray-50 dark:bg-gray-800 border border-indigo-300 dark:border-indigo-600 rounded-md p-3 shadow-sm max-w-full"
              >
                {renderSavedIndicator(card.isSaved)}
                <span
                  className={`absolute top-[-10px] left-3 inline-flex items-center px-2 py-0.5 rounded-full text-[0.75rem] font-semibold text-white shadow-sm border ${
                    status === 'Current'
                      ? 'bg-green-600 border-green-600'
                      : status === 'Upcoming'
                      ? 'bg-yellow-500 border-yellow-500'
                      : status === 'Past'
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'bg-gray-300 border-gray-400'
                  }`}
                >
                  {status}
                </span>
                <div className="flex items-center justify-end mb-3 mt-2 gap-2">
                 {renderEditButton(deputationDetails[index], index)}
                 {renderDeleteButton(deputationDetails[index])}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-3">
                    {leftColumnFields.map((field) => (
                      <div
                        key={field.key}
                        className="relative flex items-start gap-2 bg-white dark:bg-gray-700 rounded-lg p-2 border border-gray-200 dark:border-gray-600"
                      >
                        {renderSparkIndicator(`${field.key}_${index}`, deputationDetails[index].fieldSources[field.key] || 'MIXED')}
                        {renderUserIndicator(`${field.key}_${index}`, deputationDetails[index].fieldSources[field.key] || 'MIXED')}
                        {renderGadIndicator(`${field.key}_${index}`, deputationDetails[index].fieldSources[field.key] || 'MIXED')}
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mt-1">
                          <field.icon className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.75rem] text-gray-500 dark:text-gray-400 truncate">{field.label}</p>
                          <p className="text-[0.875rem] font-bold text-gray-900 dark:text-white break-words">
                            {card.fields.find((f) => f.originalKey === field.key)?.computeValue()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {rightColumnFields.map((field) => (
                      <div
                        key={field.key}
                        className="relative flex items-start gap-2 bg-white dark:bg-gray-700 rounded-lg p-2 border border-gray-200 dark:border-gray-600"
                      >
                        {renderSparkIndicator(`${field.key}_${index}`, deputationDetails[index].fieldSources[field.key] || 'MIXED')}
                        {renderUserIndicator(`${field.key}_${index}`, deputationDetails[index].fieldSources[field.key] || 'MIXED')}
                        {renderGadIndicator(`${field.key}_${index}`, deputationDetails[index].fieldSources[field.key] || 'MIXED')}
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mt-1">
                          <field.icon className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.75rem] text-gray-500 dark:text-gray-400 truncate">{field.label}</p>
                          <p className="text-[0.875rem] font-bold text-gray-900 dark:text-white break-words">
                            {card.fields.find((f) => f.originalKey === field.key)?.computeValue()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-gray-500 dark:text-gray-400 text-[0.875rem] text-center py-3 italic">
          No Deputation Details Available.
        </div>
      )}
      <ModalCentralDeputation
        open={isModalOpen}
        setOpen={setModalOpen}
        deputationDetails={selectedDeputation}
        onSave={handleSave}
        masterData={masterData}
        isSparkData={selectedDeputation && selectedDeputation._source === 'SPARK'}
        sparkFields={sparkFields}
        officerFields={officerFields}
      />

    <ConfirmModal
      isOpen={isDeleteModalOpen}
      setIsOpen={setIsDeleteModalOpen}
      onConfirm={handleDeleteConfirm}
      title="Delete Central Deputation"
      message={`Are you sure you want to delete "${
        deputationToDelete
          ? getMasterValue(deputationToDelete.cen_dept_id, 'cen_dept_id') || 'this deputation'
          : 'this deputation'
      }"? This action cannot be undone.`}
      iconType="delete"
      confirmText="Delete"
    />

    </div>
  );

}
