'use client'

import { useState, useEffect} from 'react'
import { PlusIcon, PencilSquareIcon } from '@heroicons/react/20/solid'
import { ModalChildrenDetails } from '../modal/children-details'
import { toast } from 'react-toastify';

import axiosInstance from "@/utils/apiClient";

export function ChildrenDetails() {
  const [isModalOpen, setModalOpen] = useState(false)
  const [childrenDetails, setChildrenDetails] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);  // Track the child being edited
  const [error, setError] = useState(null); 

  const [masterData, setMasterData] = useState({
    gender: [],  
  });

  const fields = [
    { label: "Name", key: "name" },
    { label: "Date of Birth", key: "dob" },
    { label: "Age", key: "age" },
    { label: "Gender", key: "gender_id" },  
    { label: "Educational Instituition Name", key: "institute_name" },
    { label: "Educational Instituition Place", key: "institute_place" },
    { label: "Admission Number", key: "admission_no" }, 
    { label: "Disability (if any)", key: "disability" },
  
  ];

   // Master data for fields that require ID lookup
   const masterFields = ['gender_id'];  // Define master fields explicitly

  useEffect(() => {
    const fetchChildrenDetails = async () => {
      const userId = sessionStorage.getItem('user_id');
      if (!userId) {
        setError('User not logged in');
        return;
      }

      try {
        const response = await axiosInstance.get(`/officer/child`);  
        
        if (response.data.success) {

          setChildrenDetails(response.data.data.child || []);  
        } else {
          setError('Failed to fetch children details');
        }
      } catch (err) {
        setError('Failed to fetch children details');
        console.error(err);
      }
    };

    const fetchMasterData = async () => {
      try {
        const genderResponse = await axiosInstance.get('/masters/gender');
        setMasterData({
          gender: genderResponse.data.data.gender || [],  // Set gender master data
        });
      } catch (err) {
        setError('Failed to fetch master data');
        console.error(err);
      }
    };

    fetchChildrenDetails();
    fetchMasterData();
  }, []);

  

  const handleSave = async (updatedChild) => {
    try {
      const response = await axiosInstance.post('/officer/child', updatedChild);
  
      if (response.data.success) {
        setChildrenDetails((prevChild = []) => {
          if (updatedChild.id) {
            return prevChild.map((child) =>
              child.id === updatedChild.id ? response.data.data.children : child
            );
          } else {
            return [...prevChild, response.data.data.children];
          }
        });
        setModalOpen(false);
        setSelectedChild(null);
        toast.success('Child details saved successfully');  // Success toast on successful save
      } else {
        toast.error('Failed to save child details');  // Error toast on failed save
      }
    } catch (err) {
      setError('Failed to save child details');
      console.error(err);
    }
  };

  const handleEdit = (child) => {
    setSelectedChild(child);  // Pass the child object instead of just the index
    setModalOpen(true);
  };
  
  const handleAdd = () => {
    setSelectedChild(null);  // Reset the selectedChild for new entry
    setModalOpen(true);
  };
  

  // Helper function to get the name from master data by id
  const getMasterValue = (id, key) => {
    if (!id) return ''; 
    
    if (masterFields.includes(key)) {
      if (key === "gender_id") {
        const match = masterData.gender.find(item => item.id === id);
        return match ? match.gender : ''; 
      }
    }

    return '';  // Return empty if no match
  };


  const calculateAge = (dob) => {
    if (!dob) return ""; // If dob is missing, return empty
    const birthDate = new Date(dob);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
  
    // If birth month is ahead of current month or it's the same month but birth date is ahead, subtract one year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  
    return age;
  };

     return (
        <>
          <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white rounded-xl border w-full mb-3">
            <div className="p-3 sm:p-3">
              <div>
                <div className="px-4 sm:px-0 flex justify-between items-center">
                  <div>
                    <h3 className="text-base/7 font-semibold text-gray-900">Children Details</h3>
                    <p className="max-w-2xl text-sm/6 text-gray-500">Children details of Officer.</p>
                  </div>
                  <button 
                    type="button" 
                    className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={handleAdd}
                  >
                    Add <PlusIcon aria-hidden="true" className="-mr-0.5 size-5" />
                  </button>
                </div>
                <div className="mt-3">  
                  <dl className="space-y-6">
                    {/* Check if there is a children in the array and map through it */}
                    {error ? (
                       <p className="text-red-500 sr-only">Failed to fetch data</p>
                    ): childrenDetails.length > 0 ?( childrenDetails.map((children, index) => (
                      <div key={index} className="grid grid-cols-1 sm:grid-cols-2 rounded-lg bg-white rounded-xl border px-3">
                        {fields.map((field) => (
                          <div key={field.key} className="border-b border-gray-100 px-3 py-3 sm:col-span-1 sm:px-0">
                            <div className="sm:col-span-2">
                              <dt className="font-medium text-gray-900">{field.label}</dt>
                              <dd className="mt-1 text-gray-500">
                                {field.key === "age"
                                  ? calculateAge(children.dob) // Calculate age dynamically
                                  : masterFields.includes(field.key)
                                    ? getMasterValue(children[field.key], field.key)
                                    : children[field.key] || ""
                                }
                              </dd>

                            </div>
                          </div>
                        ))}
                        <div className="border-gray-100 px-3 py-3 sm:col-span-2 sm:px-0">
                          <button 
                            type="button" 
                            className="float-right inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-indigo-500 hover:ring-indigo-500 px-2.5 py-1.5 text-sm font-semibold text-gray-500"
                            onClick={() => handleEdit(children)} >
                
                            Edit <PencilSquareIcon aria-hidden="true" className="-mr-0.5 size-5" />
                          </button>
                        </div>
                      </div>
                          ))
                        ) : (
                          <p className="text-gray-500">No dependent details available.</p>
                        )}
                  </dl>
                </div>
              </div>
            </div>
          </div>
    
          {/* Pass the current children to edit in the modal */}
          <ModalChildrenDetails
            open={isModalOpen}
            setOpen={setModalOpen}
            childrenDetails={selectedChild}  // Pass the selected child details to the modal
            onSave={handleSave}
            masterData={masterData}
          />
       

        </>
      );
    }
    