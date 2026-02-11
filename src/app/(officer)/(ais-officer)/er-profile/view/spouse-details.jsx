'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilSquareIcon } from '@heroicons/react/20/solid'
import { ModalSpouseDetails } from '../modal/spouse-details'
import { toast } from 'react-toastify';
import axiosInstance from "@/utils/apiClient";



export function SpouseDetails() {
  const [isModalOpen, setModalOpen] = useState(false)
  const [spouseDetails, setSpouseDetails] = useState([]);
  const [selectedSpouse, setSelectedSpouse] = useState(null);
  const [error, setError] = useState(null);
  
  const [masterData, setMasterData] = useState({
    gender: [],
  });

  const fields = [
    { label: "Name", key: "name" },
    { label: "Reference Number", key: "reference_number" },
    { label: "Gender", key: "gender_id" },
    { label: "Email", key: "email_id" },
    { label: "Mobile Number", key: "mobile_no" },
    { label: "Place of Domicile", key: "place_of_domicile" },
    // { label: "Mother Tongue", key: "mother_tongue" },
    // { label: "PAN Number", key: "PAN_no" },
  ];

  const masterFields = ['gender_id'];

  useEffect(() => {

  const fetchSpouseDetails = async () => {
    const userId = sessionStorage.getItem('user_id');
    if (!userId) {
      setError('User not logged in');
      return;
    }

    try {
      const response = await axiosInstance.get(`/officer/spouse`);

      if (response.data.success) {
        setSpouseDetails(response.data.data.spouse || []);
      } else {
        setError('Failed to fetch spouse details');
      }
    } catch (err) {
      setError('Failed to fetch spouse details');
      console.error(err);
    }
  };

  const fetchMasterData = async () => {
    try {
      const genderResponse = await axiosInstance.get('/masters/gender');
      setMasterData({
        gender: genderResponse.data.data.gender || [],
      });
    } catch (err) {
      setError('Failed to fetch master data');
      console.error(err);
    }
  };

  fetchSpouseDetails();
   fetchMasterData();
   }, []);
   


  const handleSave = async (updatedSpouse) => {
  try {
    const response = await axiosInstance.post('/officer/spouse', updatedSpouse);
   
    if (response.data.success) {
      setSpouseDetails((prevSpouse = []) => {
        if (updatedSpouse.id) {
          return prevSpouse.map((spouse) =>
            spouse.id === updatedSpouse.id ? response.data.data.spouse : spouse
          );
        } else {
          return [...prevSpouse, response.data.data.spouse];
        }
      });
      setModalOpen(false);
      setSelectedSpouse(null);
      
      toast.success('Spouse details saved successfully');  // Success toast on successful save
    } else {
      toast.error('Failed to save spouse details');  // Error toast on failed save
    }
  } catch (err) {
    setError('Failed to save spouse details');
    console.error(err);
  }
};

  
  const handleEdit = (spouse) => {
    setSelectedSpouse(spouse);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedSpouse(null);
    setModalOpen(true);
  };

  const getMasterValue = (id, key) => {
    if (!id) return '';

    if (masterFields.includes(key)) {
      if (key === "gender_id") {
        const match = masterData.gender.find(item => item.id === id);
        return match ? match.gender : '';
      }
    }

    return '';
  };


  return (
    <>
      <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white rounded-xl border w-full mb-3">
        <div className="p-3 sm:p-3">
          <div>
            <div className="px-4 sm:px-0 flex justify-between items-center">
              <div>
                <h3 className="text-base/7 font-semibold text-gray-900">Spouse Details</h3>
                <p className="max-w-2xl text-sm/6 text-gray-500">Spouse details of Officer.</p>
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
              {error ? (
                       <p className="text-red-500 sr-only">Failed to fetch data</p>
              ):spouseDetails.length > 0 ?(spouseDetails.map((spouse, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-2 rounded-lg bg-white rounded-xl border px-3">
                    {fields.map((field) => (
                      <div key={field.key} className="border-b border-gray-100 px-3 py-3 sm:col-span-1 sm:px-0">
                        <div className="sm:col-span-2">
                          <dt className="font-medium text-gray-900">{field.label}</dt>
                          <dd className="mt-1 text-gray-500">
                            {masterFields.includes(field.key)
                              ? getMasterValue(spouse[field.key], field.key)
                              : spouse[field.key] || ""}
                          </dd>
                        </div>
                      </div>
                    ))}
                    <div className="border-gray-100 px-3 py-3 sm:col-span-2 sm:px-0">
                      <button 
                        type="button" 
                        className="float-right inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-indigo-500 hover:ring-indigo-500 px-2.5 py-1.5 text-sm font-semibold text-gray-500"
                        onClick={() => handleEdit(spouse)} >
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

      <ModalSpouseDetails
        open={isModalOpen}
        setOpen={setModalOpen}
        spouseDetails={selectedSpouse}
        onSave={handleSave}
        masterData={masterData}
      />
   

    </>
    
  );
}
