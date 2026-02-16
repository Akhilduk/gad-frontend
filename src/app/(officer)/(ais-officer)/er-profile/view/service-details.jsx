'use client';
import { useState, useEffect, useCallback } from 'react';
import { BriefcaseIcon, ChartBarIcon, BuildingOffice2Icon, GlobeAltIcon, MapPinIcon, HomeIcon, PencilSquareIcon, PlusIcon, DocumentTextIcon, CalendarIcon, EyeIcon, TrashIcon} from '@heroicons/react/24/outline';
import { BoltIcon, UserIcon, ExclamationCircleIcon, CheckCircleIcon, ArrowDownTrayIcon,ChevronDownIcon } from '@heroicons/react/24/solid';
import { ModalServiceDetails } from '../modal/service-details';
import { ModalServiceDetailsView } from '../modal/service-details-view';
import { toast } from 'react-toastify';
import axiosInstance from '@/utils/apiClient';
import { useProfileCompletion } from '@/contexts/Profile-completion-context';
import ConfirmModal from '@/app/components/confirmModal';
import moment from 'moment';
// import { ExportButtons, exportToCSV, exportToPDF, exportToExcel } from '@/components/dataTableControls'; // Adjust import path as needed
import { ExportButtons, exportToCSV, exportToPDF, exportToExcel } from '@/app/components/dataTableControls'; // Adjust import path as needed
import { jsPDF } from 'jspdf';
export function ServiceDetails({ masterData, profileData }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [viewService, setViewService] = useState(null);
  const [serviceList, setServiceList] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [levels, setLevels] = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [postingTypes, setPostingTypes] = useState([]);
  const [implementingAgencies, setImplementingAgencies] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleId, setRoleId] = useState(null);
  const [officerUserId, setOfficerUserId] = useState(null);
  const [officerFields, setOfficerFields] = useState({
    GAD_OFFICER: [],
    AIS_OFFICER: [],
    DB_SPARK_API: [],
  });
  const [sparkFields, setSparkFields] = useState(new Set());
  const [activeTab, setActiveTab] = useState('main');
  const [viewMode, setViewMode] = useState('cards');
  const { updateSectionProgress } = useProfileCompletion();
 
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); //New
  const [serviceToDelete, setServiceToDelete] = useState(null); //New
   
 
  // Get profile status from sessionStorage
  const profileStatus = sessionStorage.getItem('profile_status');
  const isButtonDisabled = profileStatus === '2' || profileStatus === '3'; // Disable for submitted or approved
  const normalize = (str) => str?.toString().trim().toLowerCase() || '';
  const getDesignationName = useCallback((id) => designations.find((item) => item.designation_id === id)?.designation || ' ', [designations]);
  const getLevelName = useCallback((id) => levels.find((item) => item.level_id === id)?.level || ' ', [levels]);
  const getMinistryName = useCallback((id) => ministries.find((item) => item.ministry_id === id)?.ministry || ' ', [ministries]);
  const getDepartmentName = useCallback((id) => departments.find((item) => item.administrative_department_id === id)?.administrative_department || ' ', [departments]);
  const getGradeName = useCallback((id) => grades.find((item) => item.grade_id === id)?.grade || ' ', [grades]);
  const getDistrictName = useCallback((id) => districts.find((item) => item.district_id === id)?.district || ' ', [districts]);
  const getPostingTypeName = useCallback((id) => postingTypes.find((item) => item.posting_type_id === id)?.posting_types || ' ', [postingTypes]);
  const getAgencyName = useCallback((id) => implementingAgencies.find((item) => item.agency_id === id)?.agency || ' ', [implementingAgencies]);
  const getStateName = useCallback((id) => states.find((item) => item.state_id === id)?.state || ' ', [states]);
  const getOtherDetails = useCallback((value) => value || ' ', []);
  const getOrderNo = useCallback((value) => value || ' ', []);
  const getOrderDate = useCallback((value) => value ? moment(value).format('DD/MM/YYYY') : ' ', []);
  const mapServiceDetails = useCallback((serviceDetails, dbServices = []) => {
    const sparkKeys = new Set();
    const tempServiceList = serviceDetails.map((service, index) => {
      const designationMatch = designations.find((d) => normalize(d.designation) === normalize(service.designation));
      const departmentMatch = departments.find((d) => normalize(d.administrative_department) === normalize(service.department));
      const districtMatch = districts.find((d) => normalize(d.district) === normalize(service.district));
      const stateMatch = states.find((s) => normalize(s.state) === normalize(service.state || 'Kerala'));
      const serviceData = {
        ais_ser_id: `spark_${index}`,
        designation_id: designationMatch ? designationMatch.designation_id : null,
        level_id: null,
        ministry_id: null,
        administrative_department_id: departmentMatch ? departmentMatch.administrative_department_id : null,
        state_id: stateMatch ? stateMatch.state_id : null,
        district_id: districtMatch ? districtMatch.district_id : null,
        start_date: service.date_from ? moment(service.date_from.split(' ')[0], 'DD/MM/YYYY').format('YYYY-MM-DD') : '',
        end_date: service.date_to ? moment(service.date_to.split(' ')[0], 'DD/MM/YYYY').format('YYYY-MM-DD') : '',
        grade_id: null,
        posting_type_id: null,
        address: service.office || ' ',
        phone_no: ' ',
        is_additional_charge: false,
        other_details: service.remarks || ' ',
        basic_pay: service.basic_pay || null,
        order_no: service.order_no || ' ',
        order_date: service.order_date ? moment(service.order_date.split(' ')[0], 'DD/MM/YYYY').format('YYYY-MM-DD') : null,
        _source: 'SPARK',
        isSaved: false,
        fieldSources: {
          designation_id: designationMatch ? 'SPARK' : 'USER',
          level_id: 'USER',
          ministry_id: 'USER',
          administrative_department_id: departmentMatch ? 'SPARK' : 'USER',
          state_id: stateMatch ? 'SPARK' : 'USER',
          district_id: districtMatch ? 'SPARK' : 'USER',
          start_date: service.date_from ? 'SPARK' : 'USER',
          end_date: service.date_to ? 'SPARK' : 'USER',
          grade_id: 'USER',
          posting_type_id: 'USER',
          address: service.office ? 'SPARK' : 'USER',
          phone_no: 'USER',
          is_additional_charge: 'USER',
          other_details: service.remarks ? 'SPARK' : 'USER',
          basic_pay: service.basic_pay ? 'SPARK' : 'USER',
          order_no: service.order_no ? 'SPARK' : 'USER',
          order_date: service.order_date ? 'SPARK' : 'USER',
        },
      };
      if (service.designation && designationMatch) sparkKeys.add(`designation_id_${index}`);
      if (service.department && departmentMatch) sparkKeys.add(`administrative_department_id_${index}`);
      if (service.district && districtMatch) sparkKeys.add(`district_id_${index}`);
      if (service.state && stateMatch) sparkKeys.add(`state_id_${index}`);
      if (service.date_from) sparkKeys.add(`start_date_${index}`);
      if (service.date_to) sparkKeys.add(`end_date_${index}`);
      if (service.office) sparkKeys.add(`address_${index}`);
      if (service.remarks) sparkKeys.add(`other_details_${index}`);
      if (service.basic_pay) sparkKeys.add(`basic_pay_${index}`);
      if (service.order_no) sparkKeys.add(`order_no_${index}`);
      if (service.order_date) sparkKeys.add(`order_date_${index}`);
      return serviceData;
    });
    const dbServicesList = dbServices.map((dbService) => {
      const fields = dbService.fields || {};
      const merged = {};
      const fieldSourcesLocal = {};
     Object.keys(fields).forEach(sourceKey => {
        Object.entries(fields[sourceKey]|| {}).forEach(([key, value]) => {
          merged[key] = value;
          fieldSourcesLocal[key] = sourceKey === 'DB_SPARK_API' ? 'SPARK' : 'USER';
        });
      });
      const parsedMerged = {
        designation_id: merged.designation_id ? parseInt(merged.designation_id, 10) : null,
        level_id: merged.level_id ? parseInt(merged.level_id, 10) : null,
        ministry_id: merged.ministry_id ? parseInt(merged.ministry_id, 10) : null,
        administrative_department_id: merged.administrative_department_id ? parseInt(merged.administrative_department_id, 10) : null,
        agency_id: merged.agency_id ? parseInt(merged.agency_id, 10) : null,
        state_id: merged.state_id ? parseInt(merged.state_id, 10) : null,
        district_id: merged.district_id ? parseInt(merged.district_id, 10) : null,
        start_date: merged.start_date || '',
        end_date: merged.end_date || '',
        grade_id: merged.grade_id ? parseInt(merged.grade_id, 10) : null,
        posting_type_id: merged.posting_type_id ? parseInt(merged.posting_type_id, 10) : null,
        address: merged.address || ' ',
        phone_no: merged.phone_no || ' ',
        is_additional_charge: merged.is_additional_charge === 'true' || merged.is_additional_charge === true ? true : false,
        other_details: merged.other_details || ' ',
        basic_pay: merged.basic_pay ? parseFloat(merged.basic_pay) : null,
        order_no: merged.order_no || ' ',
        order_date: merged.order_date || null,
      };
      const sourcesSet = new Set(Object.values(fieldSourcesLocal));
      const _source = sourcesSet.size > 1 ? 'MIXED' : sourcesSet.has('SPARK') ? 'SPARK' : 'USER';
      return {
        ais_ser_id: String(dbService.ais_ser_id),
        ...parsedMerged,
        _source,
        isSaved: true,
        fieldSources: fieldSourcesLocal,
      };
    });
    const matchedSparkIndices = new Set();
    dbServicesList.forEach((dbService) => {
      const matchedIndex = tempServiceList.findIndex((sparkService, sparkIndex) => {
        const sparkDesignation = normalize(designations.find((d) => d.designation_id === sparkService.designation_id)?.designation || '');
        const dbDesignation = normalize(designations.find((d) => d.designation_id === dbService.designation_id)?.designation || '');
        const sparkDepartment = normalize(departments.find((d) => d.administrative_department_id === sparkService.administrative_department_id)?.administrative_department || '');
        const dbDepartment = normalize(departments.find((d) => d.administrative_department_id === dbService.administrative_department_id)?.administrative_department || '');
        const sparkStartDate = sparkService.start_date;
        const dbStartDate = dbService.start_date;
        return sparkDesignation === dbDesignation && sparkDepartment === dbDepartment && sparkStartDate === dbStartDate;
      });
      if (matchedIndex !== -1) {
        matchedSparkIndices.add(matchedIndex);
        tempServiceList[matchedIndex].isSaved = true;
        tempServiceList[matchedIndex].ais_ser_id = dbService.ais_ser_id;
        Object.keys(dbService).forEach(key => {
          if (!['ais_ser_id', '_source', 'isSaved', 'fieldSources'].includes(key) && dbService[key] !== null && dbService[key] !== undefined && dbService[key] !== '') {
            tempServiceList[matchedIndex][key] = dbService[key];
          }
        });
        tempServiceList[matchedIndex].fieldSources = {
          ...tempServiceList[matchedIndex].fieldSources,
          ...dbService.fieldSources,
        };
        const newFieldSources = tempServiceList[matchedIndex].fieldSources;
        const sourcesSet = new Set(Object.values(newFieldSources));
        tempServiceList[matchedIndex]._source = sourcesSet.size > 1 ? 'MIXED' : sourcesSet.has('SPARK') ? 'SPARK' : 'USER';
      }
    });
    const finalDetails = [
      ...tempServiceList.filter((_, index) => !matchedSparkIndices.has(index)),
      ...tempServiceList.filter((_, index) => matchedSparkIndices.has(index)),
      ...dbServicesList,
    ].reduce((unique, current) => {
      if (!unique.some((item) => String(item.ais_ser_id) === String(current.ais_ser_id))) {
        unique.push(current);
      }
      return unique;
    }, []);
    finalDetails.sort((a, b) => moment(b.start_date).valueOf() - moment(a.start_date).valueOf());
    return { details: finalDetails, sparkKeys };
  }, [designations, departments, districts, states]);
  const isActiveService = (startDate, endDate) => {
    const currentDate = moment();
    const start = moment(startDate);
    const end = endDate ? moment(endDate) : null;
    return start.isSameOrBefore(currentDate) && (!end || end.isSameOrAfter(currentDate));
  };
  useEffect(() => {
    const storedRoleId = parseInt(sessionStorage.getItem('role_id'), 10);
    const storedOfficerId = sessionStorage.getItem('OfficerUserId');
    setRoleId(storedRoleId);
    setOfficerUserId(storedOfficerId);
    fetchDropdownData();
  }, []);
useEffect(() => {
  const storedServices = sessionStorage.getItem('service_details');
 
  if (storedServices) {
    console.log("Loading service details from sessionStorage");
    const parsedServices = JSON.parse(storedServices);
    setServiceList(parsedServices);
    setLoading(false);
    return;
  }
 
  if (!profileData) return;
  console.log("Processing service details from API data");
 
  setLoading(true);
  try {
    const sparkServiceDetails = profileData.spark_data?.data?.service_details || [];
    const dbServices = profileData?.officer_data?.get_all_officer_info_by_user_id?.service_history || [];
    console.log("dbServices:", dbServices);
   
    const officerInfo = profileData?.officer_data?.get_all_officer_info_by_user_id?.officer_info?.[0] || {};
    const officerFieldsData = {
      GAD_OFFICER: officerInfo?.fields?.GAD_OFFICER ? Object.keys(officerInfo.fields.GAD_OFFICER) : [],
      AIS_OFFICER: officerInfo?.fields?.AIS_OFFICER ? Object.keys(officerInfo.fields.AIS_OFFICER) : [],
      DB_SPARK_API: officerInfo?.fields?.DB_SPARK_API ? Object.keys(officerInfo.fields.DB_SPARK_API) : [],
    };
    setOfficerFields(officerFieldsData);
    const { details: mappedServices, sparkKeys } = mapServiceDetails(sparkServiceDetails, dbServices);
   
    console.log("Mapped service details:", mappedServices);
   
    setServiceList(mappedServices);
    setSparkFields(sparkKeys);
   
   
  } catch (error) {
    console.error("Error processing service details:", error);
    toast.error("Failed to process service details", {
      className: "bg-red-500 text-white",
      progressClassName: "bg-red-200",
    });
  } finally {
    setLoading(false);
  }
}, [profileData, mapServiceDetails]);
  const fetchDropdownData = async () => {
    setLoading(true);
    try {
      const [
        levelRes,
        ministryRes,
        departmentRes,
        gradeRes,
        postingTypeRes,
        implementingAgencyRes,
        designationRes,
        districtRes,
        stateRes,
      ] = await Promise.all([
        axiosInstance.get('/masters/level-all'),
        axiosInstance.get('/masters/ministry-all'),
        axiosInstance.get('/masters/administrative_department-all'),
        axiosInstance.get('/masters/grade-all'),
        axiosInstance.get('/masters/posting_type-all'),
        axiosInstance.get('/masters/agency-all'),
        axiosInstance.get('/masters/designation-all'),
        axiosInstance.get('/masters/district-all'),
        axiosInstance.get('/masters/state-all'),
      ]);
      setLevels(levelRes.data.data.level || []);
      setMinistries(ministryRes.data.data.ministry || []);
      setDepartments(departmentRes.data.data.departments || []);
      setGrades(gradeRes.data.data.grade || []);
      setPostingTypes(postingTypeRes.data.data.posting_type || []);
      setImplementingAgencies(implementingAgencyRes.data.data || []);
      setDesignations(designationRes.data.data.designation || []);
      setDistricts(districtRes.data.data.district || []);
      setStates(stateRes.data.data.state || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast.error('Failed to load dropdown data', {
        className: 'bg-red-500 text-white',
        progressClassName: 'bg-red-200',
      });
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteClick = useCallback((service) => {
   
    setServiceToDelete(service);
    setIsDeleteModalOpen(true);
  }, []);
const handleDeleteConfirm = useCallback(async () => {
  if (!serviceToDelete) return;
  const serviceId = serviceToDelete.ais_ser_id;
  if (isButtonDisabled) {
    toast.error("Cannot delete service after the profile is submitted or approved", {
      className: "bg-red-500 text-white",
      progressClassName: "bg-red-200",
    });
    return;
  }
  console.log("Delete service with ID:", serviceId);
  // Handle spark data (not saved in DB)
  if (typeof serviceId === "string" && serviceId.startsWith("spark_")) {
    const updatedList = serviceList.filter(q => q.ais_ser_id !== serviceId);
    setServiceList(updatedList);
    // Update session storage
    sessionStorage.setItem("service_details", JSON.stringify(updatedList));
    toast.success("Service removed successfully", {
      className: "bg-primary-500 text-white",
      progressClassName: "bg-primary-200",
    });
   
    // Close modal and reset state
    setIsDeleteModalOpen(false);
    setServiceToDelete(null);
    return;
  }
  setDeleteLoading(serviceId);
  try {
    const response = await axiosInstance.delete(`/officer/service_delete/${serviceId}`);
    if (response.data.success) {
      // Use the same filtering logic as in save function
      const updatedList = serviceList.filter(q => String(q.ais_ser_id) !== String(serviceId));
      setServiceList(updatedList);
     
      // Ensure session storage is updated
      sessionStorage.setItem("service_details", JSON.stringify(updatedList));
     
      console.log("Service deleted, session storage updated:", updatedList);
      toast.success("Service deleted successfully", {
        className: "bg-primary-500 text-white",
        progressClassName: "bg-primary-200",
      });
    } else {
      throw new Error("Failed to delete service");
    }
  } catch (err) {
    console.error("Error deleting service:", err);
    toast.error("Failed to delete service", {
      className: "bg-red-500 text-white",
      progressClassName: "bg-red-200",
    });
  } finally {
    setDeleteLoading(null);
    setIsDeleteModalOpen(false);
    setServiceToDelete(null);
  }
}, [isButtonDisabled, serviceList, serviceToDelete]);


 const handleSave = useCallback(
  async (updatedData) => {
    try {
      console.log("Incoming updatedData:", JSON.stringify(updatedData, null, 2));
      const isSparkEntry = selectedService && selectedService.ais_ser_id && typeof selectedService.ais_ser_id === "string" && selectedService.ais_ser_id.startsWith("spark_");
      const isUpdate = selectedService && selectedService.ais_ser_id && !isSparkEntry;
      const isNew = !selectedService || !selectedService.ais_ser_id;
      const currentOfficerId = sessionStorage.getItem('OfficerUserId');
      const requestBody = {
        spark_data: updatedData.spark_data || {},
        user_data: updatedData.user_data || {
          designation_id: null,
          level_id: null,
          ministry_id: null,
          administrative_department_id: null,
          agency_id: null,
          state_id: null,
          district_id: null,
          start_date: null,
          end_date: null,
          grade_id: null,
          posting_type_id: null,
          address: null,
          phone_no: null,
          is_additional_charge: null,
          other_details: null,
          basic_pay: null,
          order_no: null,
          order_date: null,
        },
      };
      console.log("Request body:", JSON.stringify(requestBody, null, 2));
      if (!requestBody.user_data || typeof requestBody.user_data !== "object") {
        throw new Error("Invalid user_data structure");
      }
      if (requestBody.spark_data && typeof requestBody.spark_data !== "object") {
        throw new Error("Invalid spark_data structure");
      }
      let response;
      if (roleId === 2) {
        if (isUpdate) {
          response = await axiosInstance.put(`/officer/service-history/${selectedService.ais_ser_id}`, requestBody);
        } else {
          response = await axiosInstance.post(`/officer/service-history`, requestBody);
        }
      } else if (roleId === 3) {
        if (isUpdate) {
          response = await axiosInstance.put(`/clerk/service/${currentOfficerId}/${selectedService.ais_ser_id}`, requestBody);
        } else {
          response = await axiosInstance.post(`/clerk/service${currentOfficerId}`, requestBody);
        }
      }
      if (response.data.success) {
        console.log("response==", response);
        const savedService = response.data.data.service_history;
        console.log("savedService==", savedService);
        const fieldSources = {
          designation_id: requestBody.user_data.designation_id ? "USER" : requestBody.spark_data.designation_id ? "SPARK" : "USER",
          level_id: requestBody.user_data.level_id ? "USER" : requestBody.spark_data.level_id ? "SPARK" : "USER",
          ministry_id: requestBody.user_data.ministry_id ? "USER" : requestBody.spark_data.ministry_id ? "SPARK" : "USER",
          administrative_department_id: requestBody.user_data.administrative_department_id ? "USER" : requestBody.spark_data.administrative_department_id ? "SPARK" : "USER",
          agency_id: requestBody.user_data.agency_id ? "USER" : requestBody.spark_data.agency_id ? "SPARK" : "USER",
          state_id: requestBody.user_data.state_id ? "USER" : requestBody.spark_data.state_id ? "SPARK" : "USER",
          district_id: requestBody.user_data.district_id ? "USER" : requestBody.spark_data.district_id ? "SPARK" : "USER",
          start_date: requestBody.user_data.start_date ? "USER" : requestBody.spark_data.start_date ? "SPARK" : "USER",
          end_date: requestBody.user_data.end_date ? "USER" : requestBody.spark_data.end_date ? "SPARK" : "USER",
          grade_id: requestBody.user_data.grade_id ? "USER" : requestBody.spark_data.grade_id ? "SPARK" : "USER",
          posting_type_id: requestBody.user_data.posting_type_id ? "USER" : requestBody.spark_data.posting_type_id ? "SPARK" : "USER",
          address: requestBody.user_data.address ? "USER" : requestBody.spark_data.address ? "SPARK" : "USER",
          phone_no: requestBody.user_data.phone_no ? "USER" : requestBody.spark_data.phone_no ? "SPARK" : "USER",
          is_additional_charge: requestBody.user_data.is_additional_charge != null ? "USER" : requestBody.spark_data.is_additional_charge != null ? "SPARK" : "USER",
          other_details: requestBody.user_data.other_details ? "USER" : requestBody.spark_data.other_details ? "SPARK" : "USER",
          basic_pay: requestBody.user_data.basic_pay != null ? "USER" : requestBody.spark_data.basic_pay != null ? "SPARK" : "USER",
          order_no: requestBody.user_data.order_no ? "USER" : requestBody.spark_data.order_no ? "SPARK" : "USER",
          order_date: requestBody.user_data.order_date ? "USER" : requestBody.spark_data.order_date ? "SPARK" : "USER",
        };
        const sourcesSet = new Set(Object.values(fieldSources));
        const _source = sourcesSet.size > 1 ? 'MIXED' : sourcesSet.has('SPARK') ? 'SPARK' : 'USER';
        setServiceList((prevData = []) => {
          const updatedService = {
            ais_ser_id: String(savedService.ais_ser_id),
            designation_id: savedService.designation_id || null,
            level_id: savedService.level_id || null,
            ministry_id: savedService.ministry_id || null,
            administrative_department_id: savedService.administrative_department_id || null,
            agency_id: savedService.agency_id || null,
            state_id: savedService.state_id || null,
            district_id: savedService.district_id || null,
            start_date: savedService.start_date || '',
            end_date: savedService.end_date || '',
            grade_id: savedService.grade_id || null,
            posting_type_id: savedService.posting_type_id || null,
            address: savedService.address || ' ',
            phone_no: savedService.phone_no || ' ',
            is_additional_charge: savedService.is_additional_charge || false,
            other_details: savedService.other_details || ' ',
            basic_pay: savedService.basic_pay || null,
            order_no: savedService.order_no || ' ',
            order_date: savedService.order_date || null,
            _source,
            isSaved: true,
            fieldSources,
          };
          let newServiceList;
          if (isSparkEntry) {
            newServiceList = [
              ...prevData.filter((q) => String(q.ais_ser_id) !== String(selectedService.ais_ser_id)),
              updatedService,
            ];
          } else if (isUpdate) {
            newServiceList = prevData.map((service) =>
              String(service.ais_ser_id) === String(selectedService.ais_ser_id)
                ? updatedService
                : service
            );
          } else {
            newServiceList = [...prevData, updatedService];
          }
          // Store updated service details in sessionStorage
          sessionStorage.setItem('service_details', JSON.stringify(newServiceList));
         
          return newServiceList;
        });
        setSparkFields((prev) => {
          const newSparkFields = new Set(prev);
          if (isSparkEntry) {
            const index = parseInt(selectedService.ais_ser_id.split("_")[1]);
            [
              "designation_id",
              "level_id",
              "ministry_id",
              "administrative_department_id",
              "agency_id",
              "state_id",
              "district_id",
              "start_date",
              "end_date",
              "grade_id",
              "posting_type_id",
              "address",
              "phone_no",
              "is_additional_charge",
              "other_details",
              "basic_pay",
              "order_no",
              "order_date"
            ].forEach((key) => {
              newSparkFields.delete(`${key}_${index}`);
            });
          }
          return newSparkFields;
        });
        setModalOpen(false);
        setSelectedService(null);
        toast.success(
          isUpdate
            ? "Service updated successfully"
            : "Service added successfully",
          {
            className: "bg-primary-500 text-white",
            progressClassName: "bg-primary-200",
          }
        );
      } else {
        toast.error("Failed to save service details", {
          className: "bg-red-500 text-white",
          progressClassName: "bg-red-200",
        });
      }
    } catch (err) {
      console.error("Error saving service:", err);
      toast.error("Error occurred while saving service", {
        className: "bg-red-500 text-white",
        progressClassName: "bg-red-200",
      });
    }
  },
  [selectedService, roleId, officerUserId]
);


  useEffect(() => {
    if (!loading && serviceList) {
      const total = serviceList.length;
      const completed = serviceList.filter((s) => s.isSaved).length;
      updateSectionProgress('service', total === 0 ? 0 : completed, total === 0 ? 0 : total);
    }
  }, [loading, updateSectionProgress, serviceList?.length, serviceList?.map((s) => s.isSaved).join(',')]);
 
  const renderSparkIndicator = (fieldKey, fieldSource) => {
    if (fieldSource !== 'SPARK') return null;
    return (
      <div className="absolute top-2 right-2 group">
        <span
          className="inline-flex items-center p-0.5 rounded-full bg-orange-100 text-orange-600 text-[8px]"
          aria-label="Synced from SPARK"
        >
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
    if (fieldSource !== 'USER') return null;
    return (
      <div className="absolute top-2 right-2 group">
        <span
          className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-[8px]"
          aria-label="User Entered"
        >
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
  const renderGadOfficerIndicator = (fieldKey) => {
    if (!officerFields.GAD_OFFICER.includes(fieldKey)) return null;
    return (
      <div className="absolute top-2 right-2 group">
        <span
          className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-[8px]"
          aria-label="Sourced by AS Officer"
        >
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
      <div className="absolute top-4 left-2 group">
        <span
          className={`inline-flex items-center rounded-full ${
            isSaved ? 'text-green-600' : 'text-red-600'
          } text-xs`}
          aria-label={isSaved ? 'Saved' : 'Not Saved'}
        >
          {isSaved ? (
            <CheckCircleIcon className="w-4 h-4" />
          ) : (
            <ExclamationCircleIcon className="w-4 h-4" />
          )}
        </span>
        <div className="absolute left-0 top-full mt-0.5 hidden group-hover:block z-10">
          <div className="bg-gray-800 text-white text-xs rounded px-1 py-0.5 whitespace-nowrap">
            {isSaved ? "Saved" : "Not Saved"}
          </div>
        </div>
      </div>
    );
  };
  const primaryFields = [
    { label: 'Designation', key: 'designation_id', icon: BriefcaseIcon, getValue: getDesignationName },
    { label: 'Department', key: 'administrative_department_id', icon: GlobeAltIcon, getValue: getDepartmentName },
    // { label: 'Grade', key: 'grade_id', icon: BuildingOffice2Icon, getValue: getGradeName },
    // { label: 'Level', key: 'level_id', icon: ChartBarIcon, getValue: getLevelName }, // ← New: Placed right after Department
   
    // { label: 'Remarks', key: 'other_details', icon: DocumentTextIcon, getValue: getOtherDetails },
    // { label: 'Order No', key: 'order_no', icon: DocumentTextIcon, getValue: getOrderNo },
    // { label: 'Order Date', key: 'order_date', icon: CalendarIcon, getValue: getOrderDate },
  ];
  const sortedServices = [...serviceList].sort((a, b) => {
    const aIsActive = isActiveService(a.start_date, a.end_date);
    const bIsActive = isActiveService(b.start_date, b.end_date);
    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;
    return moment(b.start_date).valueOf() - moment(a.start_date).valueOf();
  });
  const filteredServices = sortedServices.filter((service) =>
    activeTab === 'main' ? !service.is_additional_charge : service.is_additional_charge
  );
  const handleCardClick = (service) => {
    setViewService(service);
    setViewModalOpen(true);
  };
  const handleCSVExport = useCallback(() => {
    const headers = [
      'Period','Designation','Level','Grade','Ministry','Department','Agency','State','District','Posting Type','Address','Phone No','Scale of Pay',
      'Order No','Order Date','Other Details',
    ];
    const rows = filteredServices.map((service) => [
      `${service.start_date ? moment(service.start_date).format('DD/MM/YYYY') : ''} - ${service.end_date ? moment(service.end_date).format('DD/MM/YYYY') : 'Ongoing'}`,
      getDesignationName(service.designation_id),
      getLevelName(service.level_id),
      getGradeName(service.grade_id),
      getMinistryName(service.ministry_id),
      getDepartmentName(service.administrative_department_id),
      getAgencyName(service.agency_id),
      getStateName(service.state_id),
      getDistrictName(service.district_id),
      getPostingTypeName(service.posting_type_id),
      service.address,
      service.phone_no,
      service.basic_pay,
      service.order_no,
      service.order_date ? moment(service.order_date).format('DD/MM/YYYY') : null,
      service.other_details,
    ]);
    exportToCSV(`service_details_${activeTab}.csv`, headers, rows);
  }, [filteredServices, activeTab, getDesignationName, getLevelName, getGradeName, getMinistryName, getDepartmentName, getAgencyName, getStateName, getDistrictName, getPostingTypeName]);
  const handlePDFExport = useCallback(() => {
  const headers = [
    'Period',
    'Designation',
    'Level',
    'Grade',
    'Ministry',
    'Department',
    'Agency',
    'State',
    'District',
    'Posting Type',
    'Address',
    'Phone No',
    'Scale of Pay',
    'Order No',
    'Order Date',
    'Other Details',
  ];
  const rows = filteredServices.map((service) => [
    `${service.start_date ? moment(service.start_date).format('DD/MM/YYYY') : ''} - ${service.end_date ? moment(service.end_date).format('DD/MM/YYYY') : 'Ongoing'}`,
    getDesignationName(service.designation_id),
    getLevelName(service.level_id),
    getGradeName(service.grade_id),
    getMinistryName(service.ministry_id),
    getDepartmentName(service.administrative_department_id),
    getAgencyName(service.agency_id),
    getStateName(service.state_id),
    getDistrictName(service.district_id),
    getPostingTypeName(service.posting_type_id),
    service.address,
    service.phone_no,
    service.basic_pay,
    service.order_no,
    service.order_date ? moment(service.order_date).format('DD/MM/YYYY') : null,
    service.other_details,
  ]);
  const title = `Service Details - ${activeTab === 'main' ? 'Main Services' : 'Additional Charge'} (${filteredServices.length} records)`;
  const filename = `service_details_${activeTab}.pdf`;
  // Direct PDF generation with fixes
  const doc = new jsPDF('landscape', 'pt', 'a4');
  doc.setFontSize(16);
  doc.text(title, 40, 30);
  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 50,
    theme: 'grid',
    styles: {
      fontSize: 7, // Reduced for more space
      cellPadding: 2,
      overflow: 'linebreak', // Enable text wrapping
      halign: 'left',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    margin: { top: 60, left: 40, right: 40 },
    // Custom widths to prevent narrow cells (total ~880pt < 1042pt available)
    columnStyles: {
      0: { cellWidth: 60 }, // Period
      1: { cellWidth: 80 }, // Designation (long)
      2: { cellWidth: 30 }, // Level
      3: { cellWidth: 30 }, // Grade
      4: { cellWidth: 50 }, // Ministry
      5: { cellWidth: 80 }, // Department (long)
      6: { cellWidth: 50 }, // Agency
      7: { cellWidth: 30 }, // State
      8: { cellWidth: 50 }, // District
      9: { cellWidth: 50 }, // Posting Type
      10: { cellWidth: 100 }, // Address (longest, wrap)
      11: { cellWidth: 40 }, // Phone No
      12: { cellWidth: 40 }, // Scale of Pay
      13: { cellWidth: 60 }, // Order No
      14: { cellWidth: 50 }, // Order Date
      15: { cellWidth: 80 }, // Other Details (wrap)
    },
  });
  doc.save(filename);
}, [filteredServices, activeTab, getDesignationName, getLevelName, getGradeName, getMinistryName, getDepartmentName, getAgencyName, getStateName, getDistrictName, getPostingTypeName]);
  const handleExcelExport = useCallback(() => {
    const data = filteredServices.map((service) => ({
      Period: `${service.start_date ? moment(service.start_date).format('DD/MM/YYYY') : ''} - ${service.end_date ? moment(service.end_date).format('DD/MM/YYYY') : 'Ongoing'}`,
      Designation: getDesignationName(service.designation_id),
      Level: getLevelName(service.level_id),
      Grade: getGradeName(service.grade_id),
      Ministry: getMinistryName(service.ministry_id),
      Department: getDepartmentName(service.administrative_department_id),
      Agency: getAgencyName(service.agency_id),
      State: getStateName(service.state_id),
      District: getDistrictName(service.district_id),
      'Posting Type': getPostingTypeName(service.posting_type_id),
      Address: service.address,
      'Phone No': service.phone_no,
      'Scale of Pay': service.basic_pay,
      'Order No': service.order_no,
      'Order Date': service.order_date ? moment(service.order_date).format('DD/MM/YYYY') : null,
      'Other Details': service.other_details,
    }));
    exportToExcel('Service Details', data, `service_details_${activeTab}.xlsx`);
  }, [filteredServices, activeTab, getDesignationName, getLevelName, getGradeName, getMinistryName, getDepartmentName, getAgencyName, getStateName, getDistrictName, getPostingTypeName]);

const renderTimeline = () => {
  const timelineServices = [...filteredServices];
  if (timelineServices.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm text-center italic py-8">
        No service records available.
      </div>
    );
  }

  // Sort services chronologically - latest first for display
  const sortedServices = timelineServices.sort((a, b) => 
    new Date(b.start_date) - new Date(a.start_date)
  );

  const currentDate = new Date();
  const minDate = new Date(Math.min(...sortedServices.map(s => new Date(s.start_date).getTime())));
  const maxDate = new Date(Math.max(...sortedServices.map(s => 
    s.end_date ? new Date(s.end_date).getTime() : currentDate.getTime()
  )));

  const startYear = minDate.getFullYear();
  const endYear = maxDate.getFullYear();

  // Calculate employment gaps - EXCLUDING both end date and start date
  const chronologicalServices = [...sortedServices].sort((a, b) => 
    new Date(a.start_date) - new Date(b.start_date)
  );
 
  const gaps = [];
  for (let i = 1; i < chronologicalServices.length; i++) {
    const prevService = chronologicalServices[i - 1];
    const currService = chronologicalServices[i];
    const prevEnd = prevService.end_date ? new Date(prevService.end_date) : currentDate;
    const currStart = new Date(currService.start_date);
    
    // Calculate the difference between days (excluding both end date and start date)
    const nextDayAfterPrevEnd = new Date(prevEnd);
    nextDayAfterPrevEnd.setDate(prevEnd.getDate() + 1);
    
    const dayBeforeCurrStart = new Date(currStart);
    dayBeforeCurrStart.setDate(currStart.getDate() - 1);
    
    if (nextDayAfterPrevEnd > dayBeforeCurrStart) {
      continue; // No gap (services are consecutive or overlapping)
    }
    
    const gapDays = Math.ceil((dayBeforeCurrStart - nextDayAfterPrevEnd) / (24 * 60 * 60 * 1000)) + 1;
    
    if (gapDays > 0) {
      gaps.push({
        from: prevEnd,
        to: currStart,
        gapStartExcluded: nextDayAfterPrevEnd,
        gapEndExcluded: dayBeforeCurrStart,
        duration: gapDays,
        afterService: getDesignationName(prevService.designation_id),
        beforeService: getDesignationName(currService.designation_id)
      });
    }
  }

  // Check for gap after last service (if not current)
  const lastService = chronologicalServices[chronologicalServices.length - 1];
  if (lastService.end_date) {
    const lastServiceEnd = new Date(lastService.end_date);
    const nextDayAfterLastEnd = new Date(lastServiceEnd);
    nextDayAfterLastEnd.setDate(lastServiceEnd.getDate() + 1);
    
    if (nextDayAfterLastEnd < currentDate) {
      const yesterday = new Date(currentDate);
      yesterday.setDate(currentDate.getDate() - 1);
      
      const gapDays = Math.ceil((yesterday - nextDayAfterLastEnd) / (24 * 60 * 60 * 1000)) + 1;
      
      if (gapDays > 0) {
        gaps.push({
          from: lastServiceEnd,
          to: currentDate,
          gapStartExcluded: nextDayAfterLastEnd,
          gapEndExcluded: yesterday,
          duration: gapDays,
          afterService: getDesignationName(lastService.designation_id),
          beforeService: "Present",
          isCurrentGap: true
        });
      }
    }
  }

  // Responsive item count per row
  const getItemsPerRow = () => {
    if (typeof window === 'undefined') return 4;
    const width = window.innerWidth;
    if (width < 640) return 2; // Mobile
    if (width < 768) return 3; // Tablet
    if (width < 1024) return 4; // Small desktop
    return 6; // Large desktop
  };

  const maxItemsPerRow = getItemsPerRow();
  const timelineRows = [];
  for (let i = 0; i < sortedServices.length; i += maxItemsPerRow) {
    timelineRows.push(sortedServices.slice(i, i + maxItemsPerRow));
  }

  // Generate year markers
  const yearMarkers = [];
  for (let year = endYear; year >= startYear; year -= Math.max(2, Math.floor((endYear - startYear) / 4))) {
    yearMarkers.push(year);
  }

  return (
    <div className="py-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-[600px]">
      {/* Timeline Header */}
      <div className="text-center mb-8 px-4">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Service Timeline ({startYear} - {endYear})
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Career span: {endYear - startYear + 1} years | Total services: {sortedServices.length}
          {gaps.length > 0 && ` | Gaps: ${gaps.length}`}
        </p>
      </div>
      
      {/* Timeline Rows */}
      <div className="space-y-6 px-2 md:px-4">
        {timelineRows.map((row, rowIndex) => (
          <div key={rowIndex} className="relative">
            <div className="relative bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 shadow-md border border-gray-200 dark:border-gray-700">
              <div className="absolute top-1/2 left-4 right-4 md:left-6 md:right-6 h-0.5 bg-gradient-to-r from-red-300 to-red-400 transform -translate-y-1/2"></div>
              
              <div className="relative">
                <div className="grid gap-2 md:gap-4" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
                  {row.map((service, serviceIndex) => {
                    const designation = getDesignationName(service.designation_id);
                    const address = service.address || 'Not specified';
                    const startDate = service.start_date;
                    const endDate = service.end_date;
                    
                    // Format dates in DD/MM/YYYY
                    const startDateStr = startDate ? moment(startDate).format('DD/MM/YYYY') : 'N/A';
                    const endDateStr = endDate ? moment(endDate).format('DD/MM/YYYY') : 'Present';

                    return (
                      <div
                        key={service.ais_ser_id}
                        className="relative flex flex-col items-center group"
                        onClick={() => handleCardClick(service)}
                      >
                        {/* Date above node */}
                        <div className="mb-3 md:mb-4 text-center">
                          <div className="text-xs font-semibold text-red-600 dark:text-red-400 truncate w-full px-1">
                            {startDateStr}
                          </div>
                          {endDate && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate w-full px-1">
                              to {endDateStr}
                            </div>
                          )}
                        </div>

                        {/* Timeline node */}
                        <div className="relative z-20 mb-3">
                          <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-white dark:border-gray-800 shadow
                            ${service.isSaved ? 'bg-green-600' : 'bg-yellow-500'} 
                            group-hover:scale-110 transition-transform duration-200 cursor-pointer`}
                            title="Click to view details"
                          >
                          </div>
                        </div>

                        {/* Enhanced Tooltip */}
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 -translate-y-full
                                      opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                                      transition-all duration-200 z-50 pointer-events-none
                                      min-w-[180px] max-w-[250px] w-auto">
                          <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg p-3 
                                        shadow-xl border border-gray-700">
                            {/* Designation */}
                            <div className="font-bold text-white mb-2 truncate">
                              {designation}
                            </div>
                            
                            {/* Address */}
                            <div className="mb-2">
                              <div className="text-gray-400 text-[10px] uppercase font-medium mb-1">
                                Address
                              </div>
                              <div className="text-gray-300 text-[11px] line-clamp-2">
                                {address}
                              </div>
                            </div>
                            
                            {/* Period - Updated to DD/MM/YYYY */}
                            <div className="mb-2">
                              <div className="text-gray-400 text-[10px] uppercase font-medium mb-1">
                                Period
                              </div>
                              <div className="text-gray-300 text-[11px]">
                                {startDateStr} - {endDateStr}
                              </div>
                            </div>
                            
                            {/* Status */}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
                              <div className="text-gray-400 text-[10px]">
                                Status:
                              </div>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium
                                ${service.isSaved ? 'bg-green-700 text-white' : 'bg-yellow-700 text-white'}`}>
                                {service.isSaved ? 'Saved' : 'Unsaved'}
                              </span>
                            </div>
                            
                            {/* Click hint */}
                            <div className="text-center text-gray-500 text-[9px] mt-2">
                              Click for full details
                            </div>
                            
                            {/* Triangle pointer */}
                            <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
                              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-800"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Connector between rows */}
            {rowIndex < timelineRows.length - 1 && (
              <div className="flex justify-center mt-2 mb-2">
                <div className="w-0.5 h-3 md:h-4 bg-gradient-to-b from-red-300 to-red-200"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Gap Analysis */}
      {gaps.length > 0 && (
        <div className="max-w-4xl mx-auto mt-6 px-4">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <h4 className="text-sm font-bold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
              <ExclamationCircleIcon className="w-4 h-4" />
              Employment Gaps ({gaps.length})
            </h4>
            
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {gaps.map((gap, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 rounded p-3 border border-red-100 dark:border-red-700">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                    <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                      Gap {idx + 1}: {gap.duration} day{gap.duration !== 1 ? 's' : ''}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium self-start
                      ${gap.duration > 30 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                        gap.duration > 7 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                      {gap.duration}d
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                      <span className="font-medium min-w-[40px]">After:</span>
                      <span className="truncate">{gap.afterService}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                      <span className="font-medium min-w-[40px]">Before:</span>
                      <span className="truncate">{gap.beforeService}</span>
                    </div>
                    {/* Updated to DD/MM/YYYY format */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 mt-1">
                      <span className="font-medium min-w-[40px]">Period:</span>
                      <span className="text-xs">
                        {moment(gap.gapStartExcluded).format('DD/MM/YYYY')} to {moment(gap.gapEndExcluded).format('DD/MM/YYYY')}
                      </span>
                    </div>
                    {gap.isCurrentGap && (
                      <div className="text-orange-600 dark:text-orange-400 text-xs font-medium mt-1">
                        (Current gap)
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

  const renderList = () => {
  if (filteredServices.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm text-center italic py-4">
        No service records available for {activeTab === 'main' ? 'Main Services' : 'Additional Charge'}.
      </div>
    );
  }
const formatDate = (dateString) => {
  if (!dateString) return '';
  return moment(dateString).format('DD/MM/YYYY');
};
return (
  <div className="mt-4">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Service List ({filteredServices.length})
      </h3>
      <ExportButtons
        onCSV={handleCSVExport}
        onPDF={handlePDFExport}
        onExcel={handleExcelExport}
      />
    </div>
    <div className="overflow-x-auto shadow-sm ring-1 ring-black ring-opacity-5 dark:ring-gray-600 rounded-md">
      {/* Header Row */}
      <div className="grid grid-cols-7 bg-indigo-600 dark:from-indigo-900 dark:to-indigo-800 text-white min-w-[1000px]">
        <div className="px-4 py-3 text-sm font-semibold">
          SL.NO
        </div>
        <div className="px-4 py-3 text-sm font-semibold">
          Period
        </div>
        <div className="px-4 py-3 text-sm font-semibold">
          Designation
        </div>
        <div className="px-4 py-3 text-sm font-semibold">
          Department
        </div>
        <div className="px-4 py-3 text-sm font-semibold">
          Grade
        </div>
        <div className="px-4 py-3 text-sm font-semibold">
          Level
        </div>
        <div className="px-4 py-3 text-sm font-semibold">
          Actions
        </div>
      </div>
     
      {/* Data Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800 min-w-[1000px]">
        {filteredServices.map((service, index) => (
          <div
            key={service.ais_ser_id}
            className={`grid grid-cols-7 transition-colors duration-200 ${
              index % 2 === 0 ? 'bg-indigo-50 dark:bg-indigo-900/50' : 'bg-white dark:bg-gray-800'
            } hover:bg-indigo-100 dark:hover:bg-indigo-900/70`}
          >
            {/* SL.NO Column */}
            <div className="px-4 py-3 text-sm text-gray-900 dark:text-white flex items-center">
              {index + 1}
            </div>
           
            {/* Period Column */}
            <div className="px-4 py-3 text-sm text-gray-900 dark:text-white flex items-center">
              <div className="whitespace-normal break-words">
                {formatDate(service.start_date)} - {service.end_date ? formatDate(service.end_date) : 'Ongoing'}
              </div>
            </div>
           
            {/* Designation Column */}
            <div className="px-4 py-3 text-sm text-gray-900 dark:text-white flex items-center">
              <div className="whitespace-normal break-words">
                {getDesignationName(service.designation_id)}
              </div>
            </div>
           
            {/* Department Column */}
            <div className="px-4 py-3 text-sm text-gray-900 dark:text-white flex items-center">
              <div className="whitespace-normal break-words">
                {getDepartmentName(service.administrative_department_id)}
              </div>
            </div>
           
            {/* Grade Column */}
            <div className="px-4 py-3 text-sm text-gray-900 dark:text-white flex items-center">
              <div className="whitespace-normal break-words">
                {getGradeName(service.grade_id)}
              </div>
            </div>
           
            {/* Level Column */}
            <div className="px-4 py-3 text-sm text-gray-900 dark:text-white flex items-center">
              <div className="whitespace-normal break-words">
                {getLevelName(service.level_id)}
              </div>
            </div>
           
            {/* Actions Column */}
            <div className="px-4 py-3 text-sm text-gray-900 dark:text-white flex items-center">
              <button
                onClick={() => handleCardClick(service)}
                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-200"
                title="View service details"
              >
                <EyeIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);}
  const inactiveViewButtonClass = 'px-4 py-2 rounded-md text-sm font-medium transition-colors bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200';
  const activeViewButtonClass = 'px-4 py-2 rounded-md text-sm font-medium transition-colors bg-indigo-600 text-white';
 
// Add these useCallback hooks before the return statement
const handleAdd = useCallback(() => {
  const newService = {
    ais_ser_id: null,
    designation_id: null,
    level_id: null,
    ministry_id: null,
    administrative_department_id: null,
    agency_id: null,
    state_id: null,
    district_id: null,
    start_date: '',
    end_date: '',
    grade_id: null,
    posting_type_id: null,
    address: '',
    phone_no: '',
    is_additional_charge: activeTab === 'additional',
    other_details: '',
    basic_pay: null,
    order_no: '',
    order_date: null,
    _source: 'USER',
    isSaved: false,
    fieldSources: {
      designation_id: 'USER',
      level_id: 'USER',
      ministry_id: 'USER',
      administrative_department_id: 'USER',
      agency_id: 'USER',
      state_id: 'USER',
      district_id: 'USER',
      start_date: 'USER',
      end_date: 'USER',
      grade_id: 'USER',
      posting_type_id: 'USER',
      address: 'USER',
      phone_no: 'USER',
      is_additional_charge: 'USER',
      other_details: 'USER',
      basic_pay: 'USER',
      order_no: 'USER',
      order_date: 'USER',
    },
  };
  setSelectedService(newService);
  setModalOpen(true);
}, [activeTab]);
const handleEdit = useCallback((service) => (e) => {
  e.stopPropagation();
  const cleanService = { ...service };
  setSelectedService(cleanService);
  setModalOpen(true);
}, []);

// Render the Add button with custom tooltip
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
        <span>Add Service</span>
      </button>
      {isButtonDisabled && (
        <div
          className={`absolute right-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap`}
        >
          Cannot add services after the profile is submitted or approved
        </div>
      )}
    </div>
  );
};
// Render the Edit button with custom tooltip
const renderEditButton = (service) => {
  if (sessionStorage.getItem('role_id') !== '2') return null;
    return (
      <div className="relative group">
        <button
          className={`${
            isButtonDisabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400'
          }`}
          onClick={handleEdit(service)}
          disabled={isButtonDisabled}
        >
          <PencilSquareIcon className="w-4 h-4" strokeWidth={2} />
        </button>
        <div
          className={`absolute right-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap`}
        >
          {isButtonDisabled ? 'Cannot edit services after the profile is submitted or approved' : 'Edit Service'}
        </div>
      </div>
    );
  };
 const renderDeleteButton = (service) => {
    if (sessionStorage.getItem('role_id') !== '2') return null;
   //check if any field has spark as source
    const hasSparkData = Object.values(service.fieldSources || {}).some(
      (source) => source ==="SPARK"
    );
    if (hasSparkData) return null; // Do not render delete button if any field is from SPARK
    const isLoading = deleteLoading === service.ais_ser_id;
   
   
    return (
      <div className="relative group">
        <button
          className={`${
            isButtonDisabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-red-600 hover:text-red-500 dark:hover:text-red-400'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
         
          onClick={(e) => {
          e.stopPropagation();
          handleDeleteClick(service);
        }}
         
          disabled={isButtonDisabled || isLoading}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-t-2 border-b-2 border-red-600 rounded-full animate-spin"></div>
          ) : (
            <TrashIcon className="w-4 h-4" strokeWidth={2} />
          )}
        </button>
        <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          {isButtonDisabled ? 'Cannot delete service after the profile is submitted or approved' : 'Delete'}
        </div>
      </div>
    );
  };
  return (
    <div className="p-2 mx-auto w-full bg-white dark:bg-gray-900 relative z-[1]">
      <div className="bg-white dark:bg-gray-700 rounded-lg">
        {loading ? (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-2">
                <button
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'main'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200'
                  }`}
                  onClick={() => setActiveTab('main')}
                >
                  Main Services
                </button>
                <button
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'additional'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200'
                  }`}
                  onClick={() => setActiveTab('additional')}
                >
                  Additional Charge
                </button>
                <button
                  className={(viewMode === 'cards' || viewMode === 'list') ? activeViewButtonClass : inactiveViewButtonClass}
                  onClick={() => setViewMode(viewMode === 'cards' ? 'list' : 'cards')}
                >
                  {viewMode === 'cards' ? 'List' : 'Cards'}
                </button>
                <button
                  className={viewMode === 'timeline' ? activeViewButtonClass : inactiveViewButtonClass}
                  onClick={() => setViewMode('timeline')}
                >
                  Timeline
                </button>
               
              </div>
              {renderAddButton()}
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
              <div className="flex items-center space-x-2 min-w-[120px]">
                <span className="inline-flex items-center rounded-full bg-orange-100 p-0.5 text-xs text-orange-600">
                  <BoltIcon className="h-2 w-2" />
                </span>
                <span className="text-sm text-gray-700 dark:text-white">Synced from SPARK</span>
              </div>
              <div className="flex items-center space-x-2 min-w-[120px]">
                <span className="inline-flex items-center rounded-full bg-indigo-100 p-0.5 text-xs text-indigo-600">
                  <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                </span>
                <span className="text-sm text-gray-700 dark:text-white">Updated by AS-II</span>
              </div>
              <div className="flex items-center space-x-2 min-w-[120px]">
                <span className="inline-flex items-center rounded-full bg-indigo-100 p-0.5 text-xs text-indigo-600">
                  <UserIcon className="h-2 w-2" />
                </span>
                <span className="text-sm text-gray-700 dark:text-white">User Entered</span>
              </div>
              <div className="flex items-center space-x-2 min-w-[100px]">
                <span className="inline-flex items-center rounded-full text-xs text-green-600">
                  <CheckCircleIcon className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="text-sm text-gray-700 dark:text-white">Saved</span>
              </div>
              <div className="flex items-center space-x-2 min-w-[100px]">
                <span className="inline-flex items-center rounded-full text-xs text-red-600">
                  <ExclamationCircleIcon className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="text-sm text-gray-700 dark:text-white">Not Saved</span>
              </div>
            </div>
            
             {viewMode === 'cards' ? (
            filteredServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                {filteredServices.map((service, index) => {
                  const isActive = isActiveService(service.start_date, service.end_date);
                  const dateRange = `${service.start_date ? moment(service.start_date).format('DD/MM/YYYY') : ' '} - ${service.end_date ? moment(service.end_date).format('DD/MM/YYYY') : 'Ongoing'}`;
                  return (
                    <div
                      key={service.ais_ser_id}
                      className="relative mt-5 flex flex-col bg-white dark:bg-gray-800 rounded-xl pt-3 px-2 border border-indigo-200 dark:border-indigo-600 transition-all hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-500 cursor-pointer "
                      onClick={() => handleCardClick(service)}
                    >
                      {/* Active/Past Badge - Positioned like DisabilityDetails */}
                      <span
                        className={`absolute top-[-10px] inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white shadow-sm border ${
                          isActive
                            ? 'bg-green-600 border-green-600 dark:bg-green-600 dark:border-green-600'
                            : 'bg-indigo-600 border-indigo-600 dark:bg-indigo-900 dark:border-indigo-900'
                        }`}
                      >
                        {isActive ? 'Active' : 'Past'}
                      </span>
                      <div className='mb-2'>
                       
                      {renderSavedIndicator(service.isSaved)}
                      {/* Edit Button - Positioned on right */}
                     <div className="flex items-center justify-end mb-2 gap-2">
                      {renderEditButton(service, index)}
                      {renderDeleteButton(service)}
                    </div>
                      </div>
                     
                      {/* Date Range - Full Width */}
                      <div className="relative mb-2 p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800">
                        {renderSparkIndicator(`start_date_${service.ais_ser_id}`, service.fieldSources.start_date)}
                        {renderUserIndicator(`start_date_${service.ais_ser_id}`, service.fieldSources.end_date)}
                        {renderGadOfficerIndicator('start_date')}
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-3 h-3 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {dateRange}
                          </p>
                        </div>
                      </div>
                      {/* Fields Section - Better spacing and alignment */}
                      <div className="space-y-2 flex-1 mb-3">
                        {primaryFields.map((field) => (
                          <div
                            key={field.key}
                            className="relative bg-gray-50 dark:bg-gray-700/50 rounded-md p-2 border border-gray-100 dark:border-gray-600 min-h-[60px]"
                          >
                            {/* Field Indicators - Properly positioned */}
                            <div className="absolute top-1 right-1 flex gap-1">
                              {renderSparkIndicator(`${field.key}_${service.ais_ser_id}`, service.fieldSources[field.key])}
                              {renderUserIndicator(`${field.key}_${service.ais_ser_id}`, service.fieldSources[field.key])}
                              {renderGadOfficerIndicator(field.key)}
                            </div>
                           
                            {/* Field Content */}
                            <div className="flex items-start gap-3 pr-8"> {/* Added padding for indicators */}
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                <field.icon className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 tracking-wide">
                                  {field.label}
                                </p>
                                <p
                                  className="text-sm font-semibold text-gray-900 dark:text-white break-words line-clamp-2"
                                  title={field.getValue(service[field.key])}
                                >
                                  {field.getValue(service[field.key])}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
          
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400 text-sm text-center italic py-8">
                No service records available for {activeTab === 'main' ? 'Main Services' : 'Additional Charge'}.
              </div>
            )
          ) : viewMode === 'timeline' ? (
            renderTimeline()
          ) : (
            renderList()
          )}
          </>
        )}
      </div>
      <ModalServiceDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        save={handleSave}
        service={selectedService}
        stateRes={states}
        implementingAgencyRes={implementingAgencies}
        postingTypeRes={postingTypes}
        districtRes={districts}
        gradeRes={grades}
        departmentRes={departments}
        ministryRes={ministries}
        levelRes={levels}
        designationRes={designations}
      />
      <ModalServiceDetailsView
        open={isViewModalOpen}
        setOpen={setViewModalOpen}
        service={viewService}
        getDesignationName={getDesignationName}
        getLevelName={getLevelName}
        getMinistryName={getMinistryName}
        getAgencyName={getAgencyName}
        getDepartmentName={getDepartmentName}
        getGradeName={getGradeName}
        getDistrictName={getDistrictName}
        getPostingTypeName={getPostingTypeName}
        getStateName={getStateName}
        officerFields={officerFields}
      />
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Service Details"
        message={`Are you sure you want to delete service from ${
        serviceToDelete
          ? `"${serviceToDelete.start_date
              ? moment(serviceToDelete.start_date).format('DD/MM/YYYY')
              : ''} - ${
              serviceToDelete.end_date
                ? moment(serviceToDelete.end_date).format('DD/MM/YYYY')
                : 'Ongoing'
            }"`
          : '"this service"'
      }? This action cannot be undone.`}
        iconType="delete"
        confirmText="Delete"
      />
    </div>
  );
}
