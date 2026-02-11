'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '@/utils/apiClient';

const OfficerProfileContext = createContext();

export const useOfficerProfile = () => {
  const context = useContext(OfficerProfileContext);
  if (!context) {
    throw new Error('useOfficerProfile must be used within an OfficerProfileProvider');
  }
  return context;
};

export const OfficerProfileProvider = ({ children }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check for cached profile data in sessionStorage
      const cachedData = sessionStorage.getItem('profileData');
      if (cachedData) {
        setProfileData(JSON.parse(cachedData));
        setInfoMessage('Using cached profile data');
      }

      const response = await axiosInstance.get('/officer/officer');
      const responseData = response.data.data || {};
      
      setProfileData(responseData);
      sessionStorage.setItem('profileData', JSON.stringify(responseData));

      if (response.data.success) {
        setInfoMessage(response.data.message);
      } else {
        setError(response.data.detail || 'Failed to fetch profile data');
      }
    } catch (err) {
      const status = err.response?.status;
      const responseData = err.response?.data?.data || {};
      
      // Set fallback data even on error
      setProfileData(responseData);
      sessionStorage.setItem('profileData', JSON.stringify(responseData));

      let errorMessage = 'Failed to fetch profile data. Please try again later.';
      if (status === 404) {
        errorMessage = 'Profile not found. Please verify your account details.';
      } else if (status === 400) {
        errorMessage = err.response?.data?.detail || 'Invalid profile data provided.';
      } else if (status === 502 || status === 503) {
        errorMessage = err.response?.data?.detail || 'Profile service is temporarily unavailable. Please try again later.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refetchProfileData = () => {
    fetchProfileData();
  };

  const updateProfileData = (newData) => {
    setProfileData(prev => ({ ...prev, ...newData }));
    // Update sessionStorage as well
    const updatedData = { ...profileData, ...newData };
    sessionStorage.setItem('profileData', JSON.stringify(updatedData));
  };

  const clearProfileData = () => {
    setProfileData(null);
    setError(null);
    setInfoMessage(null);
    sessionStorage.removeItem('profileData');
  };

  // Fetch data on mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  const value = {
    profileData,
    loading,
    error,
    infoMessage,
    refetchProfileData,
    updateProfileData,
    clearProfileData,
    setError,
    setInfoMessage
  };

  return (
    <OfficerProfileContext.Provider value={value}>
      {children}
    </OfficerProfileContext.Provider>
  );
};