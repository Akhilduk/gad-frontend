'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDownIcon, PlusIcon, PencilSquareIcon,  UserCircleIcon, CalendarIcon, IdentificationIcon, EnvelopeIcon, PhoneIcon, BriefcaseIcon, HomeIcon, CheckCircleIcon, ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { UserGroupIcon,  UserIcon, HeartIcon,  BoltIcon,} from '@heroicons/react/24/solid';
import { ModalDependentDetails } from '../modal/dependent-details';
import { toast } from 'react-toastify';
import axiosInstance from '@/utils/apiClient';
import { useProfileCompletion } from '@/contexts/Profile-completion-context';
import { Tree, TreeNode } from 'react-organizational-chart';
import { motion, AnimatePresence } from 'framer-motion';
import 'react-tooltip/dist/react-tooltip.css';
import { viewDocument } from '@/utils/documentUpload';

export function DependentDetails({ profileData }) {
  console.log('Rendering DependentDetails with profileData:', profileData);

  const [isModalOpen, setModalOpen] = useState(false);
  const [dependentDetails, setDependentDetails] = useState([]);
  const [selectedDependent, setSelectedDependent] = useState(null);
  const [error, setError] = useState(null);
  const [isSectionOpen, setSectionOpen] = useState(false);
  const [isbuttondisable, setButtonDisable] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [masterData, setMasterData] = useState({
    gender: [],
    relationship: [],
    occupationCategory: [],
    institution: [],
  });
  
  const [isDataLoaded, setDataLoaded] = useState(false);
  const [officerFields, setOfficerFields] = useState(() => {
    const familyInfo = profileData?.officer_data?.get_all_officer_info_by_user_id?.family_info || [];
    const fieldsBySource = {
      GAD_OFFICER: new Set(),
      AIS_OFFICER: new Set(),
      DB_SPARK_API: new Set(),
    };

    familyInfo.forEach((dependent) => {
      const fields = dependent?.fields || {};
      Object.entries(fields).forEach(([source, sourceFields]) => {
        if (sourceFields && source !== 'UNKNOWN') {
          Object.keys(sourceFields).forEach((field) => {
            if (fieldsBySource[source]) {
              fieldsBySource[source].add(field);
            }
          });
        }
      });
    });

    return {
      GAD_OFFICER: Array.from(fieldsBySource.GAD_OFFICER),
      AIS_OFFICER: Array.from(fieldsBySource.AIS_OFFICER),
      DB_SPARK_API: Array.from(fieldsBySource.DB_SPARK_API),
    };
  });
  const { updateSectionProgress } = useProfileCompletion();
  const [localProfileData, setLocalProfileData] = useState(profileData);
  const [profileStatus, setProfileStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    const storedProfile = sessionStorage.getItem('profileData');
    if (storedProfile) {
      setLocalProfileData(JSON.parse(storedProfile));
    } else {
      setLocalProfileData(profileData);
    }
  }, [profileData]);

  useEffect(() => {
    const status = sessionStorage.getItem('profile_status');
    setProfileStatus(status);
    if (status === '2' || status === '3' || status === '4') {
      setButtonDisable(true);
    } else {
      setButtonDisable(false);
    }
  }, [profileData]);

  // Function to fetch fresh profile data from API
  const fetchFreshProfileData = async () => {
    setIsRefreshing(true);
    try {
      const response = await axiosInstance.get('/officer/officer');
      if (response.data.success) {
        const responseData = response.data.data || {
          officer_data: {
            get_all_officer_info_by_user_id: {
              family_info: []
            }
          }
        };
        
        setLocalProfileData(responseData);
        sessionStorage.setItem('profileData', JSON.stringify(responseData));
        
        // Update officer fields with new data
        const familyInfo = responseData?.officer_data?.get_all_officer_info_by_user_id?.family_info || [];
        const fieldsBySource = {
          GAD_OFFICER: new Set(),
          AIS_OFFICER: new Set(),
          DB_SPARK_API: new Set(),
        };

        familyInfo.forEach((dependent) => {
          const fields = dependent?.fields || {};
          Object.entries(fields).forEach(([source, sourceFields]) => {
            if (sourceFields && source !== 'UNKNOWN') {
              Object.keys(sourceFields).forEach((field) => {
                // Only include first_name, last_name, and relation_id from DB_SPARK_API
                // All other fields should be mapped to GAD_OFFICER or AIS_OFFICER
                if (source === 'DB_SPARK_API') {
                  if (field === 'first_name' || field === 'last_name' || field === 'relation_id') {
                    fieldsBySource.DB_SPARK_API.add(field);
                  } else {
                    // Map other fields to GAD_OFFICER if they exist
                    if (sourceFields[field]) {
                      fieldsBySource.AIS_OFFICER.add(field);
                    }
                  }
                } else if (fieldsBySource[source]) {
                  fieldsBySource[source].add(field);
                }
              });
            }
          });
        });

        setOfficerFields({
          GAD_OFFICER: Array.from(fieldsBySource.GAD_OFFICER),
          AIS_OFFICER: Array.from(fieldsBySource.AIS_OFFICER),
          DB_SPARK_API: Array.from(fieldsBySource.DB_SPARK_API),
        });
        
        return responseData;
      } else {
        toast.error('Failed to fetch updated profile data');
      }
    } catch (err) {
      console.error('Error fetching fresh profile data:', err);
      toast.error('Failed to refresh profile data');
    } finally {
      setIsRefreshing(false);
    }
    return null;
  };

  const fields = useMemo(() => [
    {
      key: 'relation_id',
      icon: HeartIcon,
      label: 'Relationship',
      computeValue: (dependent) => {
        const relName = getMasterValue(dependent.relation_id, 'relation_id');
        if (relName === 'Spouse') {
          if (dependent.fromSpark) {
            if (dependent.ais_fam_id.toString().startsWith('spark_')) {
              return 'Spouse (Select Status)';
            }
          }
          if (dependent.removing_reason === '1') return 'Divorced Spouse';
          if (dependent.is_alive === false) return 'Deceased Spouse';
          return 'Current Spouse';
        }
        return relName;
      },
      className: (dependent) => {
        const relName = getMasterValue(dependent.relation_id, 'relation_id');
        if (relName === 'Spouse') {
          if (dependent.fromSpark && dependent.ais_fam_id.toString().startsWith('spark_')) {
            return 'text-yellow-600 dark:text-yellow-400 font-medium';
          }
          if (dependent.removing_reason === '1') return 'text-orange-600 dark:text-orange-400 font-medium';
          if (dependent.is_alive === false) return 'text-red-600 dark:text-red-400 font-medium';
        }
        return 'text-primary-600 dark:text-primary-400 font-medium';
      },
    },
    {
      key: 'child_type',
      icon: UserIcon,
      label: 'Child Type',
      computeValue: (dependent) => getChildTypeName(dependent.child_type),
      className: 'text-gray-600 dark:text-gray-300',
      condition: (dependent) => getMasterValue(dependent.relation_id, 'relation_id') === 'Child'
    },
    {
      key: 'dob',
      icon: CalendarIcon,
      label: 'Date of Birth',
      className: 'text-gray-600 dark:text-gray-400',
      condition: (dependent) => {
        const relName = getMasterValue(dependent.relation_id, 'relation_id');
        if (relName === 'Spouse' && dependent.removing_reason === '1') return false;
        return dependent.is_alive !== false;
      }
    },
    {
      key: 'age',
      icon: IdentificationIcon,
      label: 'Age',
      computeValue: (dependent) => {
        const relName = getMasterValue(dependent.relation_id, 'relation_id');
        if (relName === 'Spouse') {
          if (dependent.removing_reason === '1') return 'Divorced';
          if (dependent.is_alive === false) return 'Deceased';
        }
        if (dependent.is_alive === false) return 'Deceased';
        const age = calculateAge(dependent.dob);
        return age.includes('month') ? age : `${age} years`;
      },
      className: (dependent) => {
        const relName = getMasterValue(dependent.relation_id, 'relation_id');
        if (relName === 'Spouse') {
          if (dependent.removing_reason === '1') return 'text-orange-600 dark:text-orange-400';
          if (dependent.is_alive === false) return 'text-red-600 dark:text-red-400';
        }
        if (dependent.is_alive === false) return 'text-red-600 dark:text-red-400';
        return 'text-gray-600 dark:text-gray-300';
      },
    },
    {
      key: 'gender_id',
      icon: UserCircleIcon,
      label: 'Gender',
      computeValue: (dependent) => getGenderName(dependent.gender_id),
      className: 'text-gray-600 dark:text-gray-300',
    },
    {
      key: 'category_id',
      icon: BriefcaseIcon,
      label: 'Occupation',
      computeValue: (dependent) => getMasterValue(dependent.category_id, 'category_id'),
      className: 'text-gray-600 dark:text-gray-300',
      condition: (dependent) => {
        const relName = getMasterValue(dependent.relation_id, 'relation_id');
        if (relName === 'Spouse' && dependent.removing_reason === '1') return false;
        return true;
      }
    },
    {
      key: 'institution_name',
      icon: HomeIcon,
      label: 'Institution',
      className: 'text-gray-600 dark:text-gray-300',
      condition: (dependent) => {
        const relName = getMasterValue(dependent.relation_id, 'relation_id');
        if (relName === 'Spouse' && dependent.removing_reason === '1') return false;
        return true;
      }
    },
    {
      key: 'email_id',
      icon: EnvelopeIcon,
      label: 'Email',
      className: 'text-gray-600 dark:text-gray-300',
      condition: (dependent) => {
        const relName = getMasterValue(dependent.relation_id, 'relation_id');
        if (relName === 'Spouse' && dependent.removing_reason === '1') return false;
        return dependent.is_alive !== false;
      }
    },
    {
      key: 'mobile_number',
      icon: PhoneIcon,
      label: 'Mobile',
      className: 'text-gray-600 dark:text-gray-300',
      condition: (dependent) => {
        const relName = getMasterValue(dependent.relation_id, 'relation_id');
        if (relName === 'Spouse' && dependent.removing_reason === '1') return false;
        return dependent.is_alive !== false;
      }
    },
    {
      key: 'death_date',
      icon: CalendarIcon,
      label: 'Date Of Death',
      className: 'text-red-600 dark:text-red-400',
      condition: (dependent) => dependent.is_alive === false
    },
    {
      key: 'divorce_date',
      icon: CalendarIcon,
      label: 'Divorce Date',
      className: 'text-orange-600 dark:text-orange-400',
      condition: (dependent) => dependent.removing_reason === '1'
    },
  ], [masterData]);

  const getChildTypeName = useCallback((childType) => {
    const childTypes = {
      1: 'Son',
      2: 'Daughter',
      3: 'Step Son',
      4: 'Step Daughter',
    };
    return childTypes[childType] || 'Child';
  }, []);

  const getGenderName = useCallback((genderId) => {
    if (!genderId || !masterData.gender.length) return 'Not Specified';
    const genderMatch = masterData.gender.find((g) => g.gender_id === Number(genderId));
    return genderMatch ? genderMatch.gender : 'Not Specified';
  }, [masterData.gender]);

  const getMasterValue = useCallback((id, key) => {
    if (!id || !key || !masterData.relationship.length) return 'Not Specified';
    if (key === 'relation_id') {
      const match = masterData.relationship.find((rel) => rel.rel_status_id === Number(id));
      return match ? match.rel_status_name : 'Not Specified';
    }
    if (key === 'category_id') {
      const match = masterData.occupationCategory.find((cat) => cat.category_id === Number(id));
      return match ? match.category_name : 'Not Specified';
    }
    return 'Not Specified';
  }, [masterData.relationship, masterData.occupationCategory]);

  const calculateAge = useCallback((dob) => {
    if (!dob) return 'Not Specified';
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return 'Not Specified';
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    const days = today.getDate() - birthDate.getDate();

    if (days < 0) {
      months--;
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    if (years < 1) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
    return `${years}`;
  }, []);

  const groupDependentsByRelationship = useCallback(() => {
    const grouped = {};
    const uniqueDependents = Array.from(new Map(dependentDetails.map(item => [item.ais_fam_id, item])).values());
    
    uniqueDependents.forEach((dependent) => {
      let relationshipName = getMasterValue(dependent.relation_id, 'relation_id');
      
      if (relationshipName === 'Spouse') {
        if (dependent.removing_reason === '1') {
          relationshipName = 'Divorced Spouse';
        } else if (dependent.is_alive === false) {
          relationshipName = 'Deceased Spouse';
        } else {
          relationshipName = 'Current Spouse';
        }
      }
      
      if (relationshipName !== 'Not Specified') {
        if (relationshipName.includes('Spouse')) {
          const baseRelName = 'Spouse';
          if (!grouped[baseRelName]) {
            grouped[baseRelName] = [];
          }
          grouped[baseRelName].push({...dependent, displayRelation: relationshipName});
        } else {
          if (!grouped[relationshipName]) {
            grouped[relationshipName] = [];
          }
          grouped[relationshipName].push({...dependent, displayRelation: relationshipName});
        }
      }
    });
    
    setExpandedNodes((prev) => {
      const newExpanded = {};
      Object.keys(grouped).forEach((rel) => {
        newExpanded[rel] = prev[rel] !== undefined ? prev[rel] : false;
      });
      return newExpanded;
    });
    return grouped;
  }, [dependentDetails, getMasterValue]);

  const groupedDependents = useMemo(() => groupDependentsByRelationship(), [groupDependentsByRelationship]);

  const getRelationshipStatus = useCallback((dependents) => {
    const unsavedCount = dependents.filter(dep => dep.ais_fam_id.toString().startsWith('spark_')).length;
    return { saved: dependents.length - unsavedCount, unsaved: unsavedCount };
  }, []);

  const requiredKeys = useMemo(() => ['first_name', 'dob', 'gender_id', 'relation_id'], []);

  const filledCount = useMemo(() => {
    return dependentDetails.reduce((count, dep) => {
      return count + requiredKeys.filter((k) => dep[k]?.toString().trim()).length;
    }, 0);
  }, [dependentDetails, requiredKeys]);

  const fetchDependents = useCallback(async () => {
    try {
      const dbFamilyInfo = localProfileData?.officer_data?.get_all_officer_info_by_user_id?.family_info || [];
      
      console.log('Raw DB Family Info:', dbFamilyInfo);
      
      // Transform database records
      const dbDependents = dbFamilyInfo.map((dep) => {
        let relationName = dep.relation;
        
        const relationMap = {
          'Current Spouse': 'Spouse',
          'Divorced Spouse': 'Spouse',
          'Deceased Spouse': 'Spouse',
          'Son': 'Child',
          'Daughter': 'Child',
          'Step Son': 'Child',
          'Step Daughter': 'Child',
        };
        
        relationName = relationMap[relationName] || relationName;
        
        const relationId = masterData.relationship.find(r => 
          r.rel_status_name === relationName || 
          (relationName === 'Spouse' && r.rel_status_name === 'Spouse') ||
          (relationName === 'Child' && r.rel_status_name === 'Child')
        )?.rel_status_id;
        
        const allFields = {};
        const sourceMap = {};
        
        Object.entries(dep.fields || {}).forEach(([source, sourceFields]) => {
          if (sourceFields && source !== 'UNKNOWN') {
            Object.entries(sourceFields).forEach(([key, value]) => {
              allFields[key] = value;
              // Only mark first_name, last_name, and relation_id as SPARK from DB_SPARK_API
              if (source === 'DB_SPARK_API' && 
                  (key === 'first_name' || key === 'last_name' || key === 'relation_id')) {
                sourceMap[key] = 'SPARK';
              } else if (source === 'DB_SPARK_API') {
                // All other fields from DB_SPARK_API should be marked as GAD_OFFICER or AIS_OFFICER
                sourceMap[key] = value ? 'AIS_OFFICER' : 'GAD_OFFICER';
              } else {
                sourceMap[key] = source;
              }
            });
          }
        });

        let childType = allFields.child_type;
        if (!childType && dep.relation) {
          const childTypeMap = {
            'Son': '1',
            'Daughter': '2',
            'Step Son': '3',
            'Step Daughter': '4'
          };
          childType = childTypeMap[dep.relation];
        }

        const flat = {
          ...dep,
          ...allFields,
          ais_fam_id: dep.person_id,
          person_id: dep.person_id,
          fromSpark: false,
          sourceMap: sourceMap,
          nameDifference: false,
          spark_name: null,
          is_alive: dep.is_alive !== false,
          death_date: dep.death_date || allFields.death_date || null,
          child_type: childType || allFields.child_type || null,
          removing_reason: dep.removing_reason || allFields.removing_reason || null,
          sup_doc_for_remv: dep.sup_doc_for_remv || allFields.sup_doc_for_remv || null,
          divorce_date: dep.divorce_date || allFields.divorce_date || null,
          marriage_certificate_proof: dep.marriage_certificate_proof || allFields.marriage_certificate_proof || null,
          relation_id: relationId || allFields.relation_id || null,
          first_name: allFields.first_name || dep.first_name || '',
          last_name: allFields.last_name || dep.last_name || '',
        };

        return flat;
      });

      console.log('Transformed DB dependents:', dbDependents);

      // Get SPARK data
      const sparkPersonal = localProfileData?.spark_data?.data?.personal_details || {};
      console.log('SPARK personal data:', sparkPersonal);
      
      const sparkRelationMap = {
        father_name: { 
          relation: 'Father', 
          relation_type: 'Parent', 
          relation_id: masterData.relationship.find(r => r.rel_status_name === 'Father')?.rel_status_id 
        },
        mother_name: { 
          relation: 'Mother', 
          relation_type: 'Parent', 
          relation_id: masterData.relationship.find(r => r.rel_status_name === 'Mother')?.rel_status_id 
        },
        spouse_name: { 
          relation: 'Spouse', 
          relation_type: 'Spouse', 
          relation_id: masterData.relationship.find(r => r.rel_status_name === 'Spouse')?.rel_status_id 
        },
      };

      const missingSpark = [];
      const sparkEntries = [];
      
      Object.entries(sparkPersonal).forEach(([key, name]) => {
        const trimmedName = typeof name === 'string' ? name.trim() : '';
        if (trimmedName) {
          const sparkMap = sparkRelationMap[key];
          if (!sparkMap) {
            console.log(`No mapping for SPARK key: ${key}`);
            return;
          }

          console.log(`Checking SPARK ${key}: ${trimmedName} for relation ${sparkMap.relation}`);
          
          const matchingDb = dbDependents.find(d => {
            const dbRelName = getMasterValue(d.relation_id, 'relation_id');
            console.log(`Comparing SPARK ${sparkMap.relation} with DB ${dbRelName} (${d.first_name} ${d.last_name})`);
            
            return dbRelName === sparkMap.relation ||
                   (sparkMap.relation === 'Spouse' && dbRelName === 'Spouse') ||
                   (sparkMap.relation === 'Father' && dbRelName === 'Father') ||
                   (sparkMap.relation === 'Mother' && dbRelName === 'Mother');
          });
          
          if (matchingDb) {
            console.log(`Found matching DB entry for SPARK ${key}:`, matchingDb);
            const dbName = `${matchingDb.first_name || ''} ${matchingDb.last_name || ''}`.trim();
            if (dbName !== trimmedName) {
              matchingDb.nameDifference = true;
              matchingDb.spark_name = trimmedName;
              console.log(`Name difference found: DB="${dbName}", SPARK="${trimmedName}"`);
            }
            
            sparkEntries.push({
              ...matchingDb,
              hasSparkData: true
            });
          } else {
            console.log(`No matching DB entry found for SPARK ${key}, creating SPARK entry`);
            const nameParts = trimmedName.split(/\s+/);
            const first_name = nameParts[0] || '';
            const last_name = nameParts.slice(1).join(' ') || '';
            
            const sparkEntry = {
              relation_type: sparkMap.relation_type,
              relation: sparkMap.relation,
              ais_fam_id: `spark_${key}`,
              person_id: `spark_${key}`,
              first_name,
              last_name,
              relation_id: sparkMap.relation_id,
              fromSpark: true,
              sourceMap: {
                first_name: 'SPARK',
                last_name: 'SPARK',
                relation_id: 'SPARK',
              },
              nameDifference: false,
              spark_name: null,
              is_alive: true,
              death_date: null,
              child_type: null,
              removing_reason: null,
            };
            
            missingSpark.push(sparkEntry);
            console.log('Created SPARK entry:', sparkEntry);
          }
        }
      });

      const merged = [...dbDependents];
      
      console.log('Before merging SPARK, merged count:', merged.length);
      
      missingSpark.forEach(sparkEntry => {
        const alreadyExists = merged.some(dbEntry => {
          const dbRelName = getMasterValue(dbEntry.relation_id, 'relation_id');
          const sparkRelName = getMasterValue(sparkEntry.relation_id, 'relation_id');
          const sameRelation = dbRelName === sparkRelName;
          const isSavedEntry = !dbEntry.ais_fam_id.toString().startsWith('spark_');
          
          console.log(`Checking if SPARK ${sparkRelName} exists: DB=${dbRelName}, same=${sameRelation}, saved=${isSavedEntry}`);
          
          return sameRelation && isSavedEntry;
        });
        
        if (!alreadyExists) {
          console.log(`Adding SPARK entry for ${sparkEntry.relation}`);
          merged.push(sparkEntry);
        } else {
          console.log(`Skipping SPARK ${sparkEntry.relation} - already exists as saved entry`);
        }
      });

      console.log('Final merged dependents:', merged.map(d => ({
        id: d.ais_fam_id,
        name: `${d.first_name} ${d.last_name}`,
        relation: getMasterValue(d.relation_id, 'relation_id'),
        fromSpark: d.fromSpark,
        child_type: d.child_type
      })));

      setDependentDetails(merged);
    } catch (err) {
      setError('Failed to fetch dependent details');
      console.error('fetchDependents error:', err);
    }
  }, [localProfileData, masterData.relationship, getMasterValue]);

  const handleRemoveDependent = useCallback(async (dependentId) => {
    if (!['1', undefined, null].includes(profileStatus)) {
      toast.error('Cannot remove dependents after profile submission');
      return;
    }

    if (!window.confirm('Are you sure you want to remove this dependent?')) {
      return;
    }

    setIsRemoving(true);
    try {
      const response = await axiosInstance.delete(`/officer/family/person/${dependentId}`);
      if (response.data.success) {
        toast.success('Dependent removed successfully');
        
        // Fetch fresh data from API
        await fetchFreshProfileData();
        
        // Re-fetch dependents with fresh data
        await fetchDependents();
        
        toast.success('Dependent removed successfully');
      } else {
        toast.error(response.data.message || 'Failed to remove dependent');
      }
    } catch (err) {
      console.error('Error removing dependent:', err);
      toast.error(err.response?.data?.detail || 'Failed to remove dependent');
    } finally {
      setIsRemoving(false);
    }
  }, [profileStatus, fetchFreshProfileData, fetchDependents]);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [genderResponse, relationshipResponse, occupationCategoryResponse, institutionResponse] = await Promise.all([
          axiosInstance.get('/masters/gender'),
          axiosInstance.get('/masters/relation'),
          axiosInstance.get('/masters/occupation-category-all'),
          axiosInstance.get('/masters/institution-all'),
        ]);

        setMasterData({
          gender: genderResponse.data?.data?.gender || [],
          relationship: relationshipResponse.data?.data || [],
          occupationCategory: occupationCategoryResponse.data?.data?.categories || [],
          institution: institutionResponse.data?.data?.institutions || [],
        });

        setDataLoaded(true);
      } catch (err) {
        setError('Failed to fetch master data');
        console.error('fetchMasterData error:', err);
        setDataLoaded(true);
      }
    };
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      fetchDependents();
    }
  }, [isDataLoaded, fetchDependents]);

  const handleSave = useCallback(async ({ spark_data, user_data, ais_fam_id }) => {
    setIsLoading(true);
    try {
      const relation_id = user_data.relation_id || spark_data.relation_id;
      if (!relation_id) {
        toast.error('Relationship is required');
        return;
      }

      const rel_status = masterData.relationship.find(
        (r) => r.rel_status_id === Number(relation_id)
      );
      if (!rel_status) {
        toast.error('Invalid relationship selected');
        return;
      }

      const rel_name = rel_status.rel_status_name;
      
      if (rel_name === 'Spouse') {
        const existingCurrentSpouse = dependentDetails.find(
          d => getMasterValue(d.relation_id, 'relation_id') === 'Spouse' && 
          d.removing_reason !== '1' && 
          d.is_alive !== false &&
          d.ais_fam_id !== ais_fam_id &&
          !d.ais_fam_id.toString().startsWith('spark_')
        );
        
        if (existingCurrentSpouse) {
          // This logic is handled in the modal with confirmation
        }
      }

      let response;
      const endpointType = rel_name === 'Current Spouse' ? 'spouse' : rel_name.toLowerCase();

      if (ais_fam_id && !String(ais_fam_id).startsWith('spark_')) {
        response = await axiosInstance.put(
          `officer/family/person/${ais_fam_id}`,
          { spark_data, user_data }
        );
      } else {
        response = await axiosInstance.post(
          `officer/family/${endpointType}`,
          { spark_data, user_data }
        );
      }

      if (response.data.success) {
        toast.success('Dependent details saved successfully');
        
        // Fetch fresh data from API
        await fetchFreshProfileData();
        
        // Re-fetch dependents with fresh data
        await fetchDependents();
        
        // Close modal and reset
        setModalOpen(false);
        setSelectedDependent(null);

        if (user_data.relation_id === '1') {
          updateSectionProgress('dependent', 1, 1);
        }

        return;
      }

      const { detail, data } = response.data;
      let message = detail || 'Failed to save dependent details';

      if (data?.field) {
        const fieldLabel = {
          email_id: 'Email',
          mobile_number: 'Mobile',
          user_id: 'User',
        }[data.field] || data.field.replace('_', ' ');
        message = `${fieldLabel} already exists`;
      }

      if (detail?.includes('already have a spouse')) {
        message = 'You already have a spouse. Divorce first.';
      }
      if (detail?.includes('already married')) {
        message = 'The selected person is already married.';
      }

      toast.error(message);
      return;
    } catch (err) {
      console.error('handleSave error:', err);

      if (err.response?.data) {
        const { detail, data } = err.response.data;
        let message = detail || 'Error saving dependent details';

        if (data?.field) {
          const label = {
            email_id: 'Email',
            mobile_number: 'Mobile',
            user_id: 'User',
          }[data.field] || data.field.replace('_', ' ');
          message = `${label} already exists`;
        }

        toast.error(message);
        return;
      }

      toast.error('Network error – please try again later');
    } finally {
      setIsLoading(false);
    }
  }, [
    dependentDetails,
    masterData.relationship,
    getMasterValue,
    fetchFreshProfileData,
    fetchDependents,
    updateSectionProgress,
  ]);

  const handleModalClose = (open) => {
    setModalOpen(open);
    setSelectedDependent(null);
  };

  const toggleSection = () => setSectionOpen(!isSectionOpen);

  const toggleNode = (node) => () => {
    setExpandedNodes((prev) => ({ ...prev, [node]: !prev[node] }));
  };

  const relationshipIcons = {
    Spouse: HeartIcon,
    Child: UserGroupIcon,
    Father: UserIcon,
    Mother: UserIcon,
    'Not Specified': UserIcon,
  };

  const getSourceBadge = (dependent, key) => {
    const source = dependent.sourceMap?.[key];
    if (!source || source === 'UNKNOWN') return null;

    // Only first_name, last_name, and relation_id can be from SPARK
    // All other fields should show as user entered or GAD entered
    if (source === 'SPARK' && !['first_name', 'last_name', 'relation_id'].includes(key)) {
      // Map to GAD_OFFICER for other fields that come from DB_SPARK_API
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-semibold ml-2 flex-shrink-0">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3" />
          </svg>
        </span>
      );
    }

    const badges = {
      'DB_SPARK_API': { icon: BoltIcon, color: 'bg-orange-100 text-orange-600', label: 'S' },
      'SPARK': { icon: BoltIcon, color: 'bg-orange-100 text-orange-600', label: 'S' },
      'GAD_OFFICER': { icon: null, color: 'bg-indigo-100 text-indigo-600', label: 'G' },
      'AIS_OFFICER': { icon: UserIcon, color: 'bg-indigo-100 text-indigo-600', label: 'A' },
    };

    const badge = badges[source];
    if (!badge) return null;

    return (
      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${badge.color} text-[10px] font-semibold ml-2 flex-shrink-0`}>
        {badge.icon && <badge.icon className="w-3 h-3" />}
        {!badge.icon && badge.label}
      </span>
    );
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  };

  const handleDocumentView = async (documentId) => {
    try {
      console.log('Viewing document with ID:', documentId);
      if (!documentId) {
        toast.error('No document available to view');
        return;
      }
      await viewDocument(documentId);
    } catch (err) {
      console.error('Document view error:', err);
      toast.error(err.response?.data?.detail || 'Failed to view document');
    }
  };

  return (
    <div className="p-2 mx-auto w-full bg-white dark:bg-gray-950">
      <button
        className="w-full bg-indigo-300 px-4 rounded-lg border border-indigo-300 shadow-sm py-2 mb-2 flex items-center justify-between text-left hover:bg-indigo-200 dark:bg-gray-800 dark:hover:bg-gray-900 dark:border-gray-600"
        onClick={toggleSection}
        disabled={isLoading || isRemoving}
      >
        <div className="flex items-center gap-4">
          <UserGroupIcon className="w-5 h-5 text-indigo-600" strokeWidth={2} />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Dependent Details</h2>
          {(isLoading || isRefreshing || isRemoving) && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
              {isRemoving ? 'Removing...' : 'Loading...'}
            </span>
          )}
        </div>
        <ChevronDownIcon
          aria-hidden="true"
          className={`w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 transition-transform duration-300 ${isSectionOpen ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      <AnimatePresence>
        {isSectionOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-white dark:bg-gray-900 rounded-lg mt-3 pt-3 overflow-hidden"
          > 
            {/* Compact Legend */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mx-2 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-xs">
              <div className="flex items-center gap-1.5">
                <span className=" inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-600">
                  <BoltIcon className=" w-3 h-3" />
                </span>
                <span className="text-gray-700 dark:text-gray-200">SPARK</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-xs" aria-label="Sourced by AS Officer">
                  <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                </span>
                <span className="text-gray-700 dark:text-gray-200">AS-II</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center p-0.5 rounded-full bg-indigo-100 text-indigo-600 text-xs" aria-label="User Entered">
                  <UserIcon className="w-2 h-2" />
                </span>
                <span className="text-gray-700 dark:text-gray-200">AIS Officer</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircleIcon className="w-5 h-5 text-green-600" strokeWidth={2} />
                <span className="text-gray-700 dark:text-gray-200">Saved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" strokeWidth={2} />
                <span className="text-gray-700 dark:text-gray-200">Unsaved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HeartIcon className="w-5 h-5 text-green-600" strokeWidth={2} />
                <span className="text-gray-700 dark:text-gray-200">Alive</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HeartIcon className="w-5 h-5 text-red-600" strokeWidth={2} />
                <span className="text-gray-700 dark:text-gray-200">Deceased</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HeartIcon className="w-5 h-5 text-orange-600" strokeWidth={2} />
                <span className="text-gray-700 dark:text-gray-200">Divorced</span>
              </div>
            </div>

            {/* Tree Structure */}
            <div className="w-full overflow-x-auto px-4 py-6">
              <div className="min-w-max">
                <Tree
                  lineType="curve"
                  lineColor="#3b82f6"
                  lineWidth="2px"
                  lineBorderRadius="10px"
                  nodePadding="16px"
                  label={
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="bg-primary-500 text-white rounded-full p-3 shadow-lg flex items-center gap-3 mx-auto w-fit"
                    >
                      <UserIcon className="w-6 h-6" />
                      <span className="text-lg font-semibold">You</span>
                    </motion.div>
                  }
                >
                  {Object.entries(groupedDependents).map(([relType, dependents]) => {
                    const Icon = relationshipIcons[relType] || relationshipIcons['Not Specified'];
                    const { saved, unsaved } = getRelationshipStatus(dependents);
                    return (
                      dependents.length > 0 && (
                        <TreeNode
                          key={relType}
                          label={
                            <motion.div
                              className="bg-primary-100 dark:bg-gray-700 rounded-lg p-3 cursor-pointer flex items-center justify-between gap-3 mx-3 min-w-[180px]"
                              onClick={toggleNode(relType)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="w-5 h-5 text-primary-500" />
                                <span className="text-base font-medium text-primary-700 dark:text-primary-300">
                                  {relType} 
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {saved > 0 && (
                                  <span className="inline-flex items-center text-green-600 text-xs">
                                    <CheckCircleIcon className="w-4 h-4" strokeWidth={2} />
                                    <span className="ml-0.5">{saved}</span>
                                  </span>
                                )}
                                {unsaved > 0 && (
                                  <span className="inline-flex items-center text-red-600 text-xs">
                                    <ExclamationTriangleIcon className="w-4 h-4" strokeWidth={2} />
                                    <span className="ml-0.5">{unsaved}</span>
                                  </span>
                                )}
                                <motion.div
                                  animate={{ rotate: expandedNodes[relType] ? 180 : 0 }}
                                  transition={{ duration: 0.3, ease: 'easeOut' }}
                                >
                                  <ChevronDownIcon className="w-4 h-4 text-primary-500" />
                                </motion.div>
                              </div>
                            </motion.div>
                          }
                        >
                          <AnimatePresence>
                            {expandedNodes[relType] && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-wrap justify-center gap-4 p-4"
                              >
                                {dependents.map((dependent) => {
                                  const isSaved = !dependent.ais_fam_id.toString().startsWith('spark_');
                                  const isDeceased = dependent.is_alive === false;
                                  const isDivorced = dependent.removing_reason === '1';
                                  const isPastSpouse = isDeceased || isDivorced;
                                  const showDeathCert = isDeceased && dependent.death_certificate;
                                  const showDivorceDoc = isDivorced && dependent.sup_doc_for_remv;
                                  const showMarriageCert = dependent.marriage_certificate_proof && !isDivorced;
                                  
                                  return (
                                    <TreeNode
                                      key={dependent.ais_fam_id}
                                      label={
                                        <motion.div
                                          variants={cardVariants}
                                          initial="hidden"
                                          animate="visible"
                                          exit="exit"
                                          className={`bg-white dark:bg-gray-800 rounded-lg p-4 border ${
                                            isDeceased ? 'border-red-200 dark:border-red-800' : 
                                            isDivorced ? 'border-orange-200 dark:border-orange-800' : 
                                            'border-gray-200 dark:border-gray-700'
                                          } shadow-sm w-full max-w-sm`}
                                        >
                                          {/* Card Header */}
                                          <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2">
                                                <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                                  {dependent.first_name || 'Dependent'} {dependent.last_name || ''}
                                                </h4>
                                                {isDeceased && (
                                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                    Deceased
                                                  </span>
                                                )}
                                                {isDivorced && (
                                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                                    Divorced
                                                  </span>
                                                )}
                                                {dependent.displayRelation && dependent.displayRelation !== 'Current Spouse' && (
                                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                    {dependent.displayRelation}
                                                  </span>
                                                )}
                                              </div>
                                              {dependent.nameDifference && (
                                                <div className="flex items-center gap-1 mt-1">
                                                  <ExclamationTriangleIcon className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0" />
                                                  <p className="text-xs text-yellow-700 dark:text-yellow-500 truncate">
                                                    SPARK: {dependent.spark_name}
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                              {isSaved ? (
                                                <>
                                                  <CheckCircleIcon className="w-5 h-5 text-green-600" strokeWidth={2} />
                                                  {!isbuttondisable && ['1', undefined, null].includes(profileStatus) && (
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveDependent(dependent.ais_fam_id);
                                                      }}
                                                      className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                                      aria-label="Remove dependent"
                                                      disabled={isLoading || isRemoving}
                                                    >
                                                      {isRemoving ? (
                                                        <span className="inline-flex items-center">
                                                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                          </svg>
                                                        </span>
                                                      ) : (
                                                        <TrashIcon className="w-4 h-4" />
                                                      )}
                                                    </button>
                                                  )}
                                                </>
                                              ) : (
                                                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" strokeWidth={2} />
                                              )}
                                              {!isbuttondisable && (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedDependent(dependent);
                                                    setModalOpen(true);
                                                  }}
                                                  className="p-1.5 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
                                                  aria-label="Edit dependent"
                                                  disabled={isLoading || isRemoving}
                                                >
                                                  <PencilSquareIcon className="w-4 h-4" />
                                                </button>
                                              )}
                                            </div>
                                          </div>

                                          {/* Card Body */}
                                          <div className="space-y-2.5">
                                            {fields.map((field) => {
                                              const Icon = field.icon;
                                              if (field.condition && !field.condition(dependent)) {
                                                return null;
                                              }
                                              
                                              const value = field.computeValue
                                                ? field.computeValue(dependent)
                                                : dependent[field.key] || 'Not Specified';
                                              
                                              if (value === 'Not Specified' && !['relation_id', 'gender_id', 'dob', 'age', 'child_type', 'death_date', 'divorce_date'].includes(field.key)) {
                                                return null;
                                              }

                                              return (
                                                <div
                                                  key={field.key}
                                                  className="flex items-start gap-2.5 text-sm"
                                                >
                                                  <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                                                  <div className="flex-1 min-w-0 flex items-center gap-1">
                                                    <span className={`${typeof field.className === 'function' ? field.className(dependent) : field.className} break-words`}>
                                                      {value}
                                                    </span>
                                                    {getSourceBadge(dependent, field.key)}
                                                  </div>
                                                </div>
                                              );
                                            })}

                                            {/* Document View Buttons */}
                                            <div className="flex flex-wrap gap-2 pt-2">
                                              {showDeathCert && (
                                                <button
                                                  onClick={() => handleDocumentView(dependent.death_certificate)}
                                                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                  disabled={isLoading || isRemoving}
                                                >
                                                  <IdentificationIcon className="w-4 h-4" />
                                                  <span>Death Certificate</span>
                                                </button>
                                              )}
                                              {showDivorceDoc && (
                                                <button
                                                  onClick={() => handleDocumentView(dependent.sup_doc_for_remv)}
                                                  className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                                                  disabled={isLoading || isRemoving}
                                                >
                                                  <IdentificationIcon className="w-4 h-4" />
                                                  <span>Divorce Document</span>
                                                </button>
                                              )}
                                              {showMarriageCert && (
                                                <button
                                                  onClick={() => handleDocumentView(dependent.marriage_certificate_proof)}
                                                  className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                  disabled={isLoading || isRemoving}
                                                >
                                                  <IdentificationIcon className="w-4 h-4" />
                                                  <span>Marriage Certificate</span>
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </motion.div>
                                      }
                                    />
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </TreeNode>
                      )
                    );
                  })}
                </Tree>
              </div>
            </div>

            {/* Add Dependent Button */}
            {!isbuttondisable && (
              <div className="mt-6 flex justify-end px-4 pb-4">
                <button
                  className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors flex items-center gap-2 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalOpen(true);
                    setSelectedDependent(null);
                  }}
                  disabled={isLoading || isRemoving}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-5 h-5" />
                      Add Dependent
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ModalDependentDetails
        open={isModalOpen}
        setOpen={handleModalClose}
        dependentDetails={selectedDependent}
        onSave={handleSave}
        masterData={masterData}
        officerFields={officerFields}
        dependentDetailsList={dependentDetails}
        userDob={profileData?.officer_data?.get_all_officer_info_by_user_id?.officer_info?.[0]?.fields?.GAD_OFFICER?.dob || profileData?.officer_data?.get_all_officer_info_by_user_id?.officer_info?.[0]?.fields?.AIS_OFFICER?.dob}
      />
    </div>
  );
}