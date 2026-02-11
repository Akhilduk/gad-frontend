// contexts/ProfileStatusContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const ProfileStatusContext = createContext();

export const ProfileStatusProvider = ({ children }) => {
  const [profileStatus, setProfileStatus] = useState('1');

  // Initialize from sessionStorage on mount
  useEffect(() => {
    const storedStatus = sessionStorage.getItem('profile_status') || '1';
    setProfileStatus(storedStatus);
  }, []);

  // Update both state and sessionStorage
  const updateProfileStatus = (newStatus) => {
    setProfileStatus(newStatus);
    sessionStorage.setItem('profile_status', newStatus);
  };

  return (
    <ProfileStatusContext.Provider value={{ profileStatus, updateProfileStatus }}>
      {children}
    </ProfileStatusContext.Provider>
  );
};

export const useProfileStatus = () => {
  const context = useContext(ProfileStatusContext);
  if (!context) {
    throw new Error('useProfileStatus must be used within a ProfileStatusProvider');
  }
  return context;
};