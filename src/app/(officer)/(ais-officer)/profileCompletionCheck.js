'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ProfileCompletionModal from '../../components/profileCompletionModal';
import axiosInstance from "@/utils/apiClient";

export default function ProfileCheck() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState('incomplete');
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetchedStatus = useRef(false);
  const isFetching = useRef(false);
  const lastPathname = useRef(pathname);
  const abortControllerRef = useRef(null);

  //  Add debug ref to track modal state changes
  const modalActionRef = useRef({ lastAction: null, timestamp: null });

  const fetchProfileStatus = useCallback(async (isInitial = false) => {
    // Prevent multiple simultaneous calls
    if (isFetching.current) {
      console.log("DEBUG >>> API call already in progress, skipping");
      return;
    }

    const role_id = sessionStorage.getItem('role_id');
    const ais_per_id = sessionStorage.getItem('ais_per_id');
    
    console.log("DEBUG >>> Fetching profile status for role:", role_id, "ais_per_id:", ais_per_id, "isInitial:", isInitial);

    if (role_id === '2' && ais_per_id) {
      try {
        isFetching.current = true;
        if (isInitial) {
          setIsLoading(true);
        }
        
        // Create abort controller for cleanup
        abortControllerRef.current = new AbortController();
        
        const statusResponse = await axiosInstance.post("/officer/profile-submit-status", {
          ais_per_id: String(ais_per_id),
        }, {
          signal: abortControllerRef.current.signal
        });
        
        console.log("DEBUG >>> Profile status API response:", statusResponse);
        
        // Access the profile_status array from the nested data structure
        const { profile_status: timeline } = statusResponse.data.data;
        
        let profileStatus;
        let newModalType = 'incomplete'; // Default modal type
        
        console.log("DEBUG >>> Timeline data:", timeline);
        
        if (!timeline || timeline.length === 0) {
          // No data: incomplete
          profileStatus = '1';
          newModalType = 'incomplete';
        } else {
          // Find the current status (with is_current: true) or get the last one
          const latestStatus = timeline.find(status => status.is_current) || timeline[timeline.length - 1];
          console.log("DEBUG >>> Latest status:", latestStatus);
          
          switch (latestStatus.action_key) {
            case 'approve':
              profileStatus = '3'; // approved, no modal
              newModalType = null;
              break;
            case 'submit':
              profileStatus = '2'; // submitted, pending review
              newModalType = 'submitted';
              break;
            case 'resubmit':
              profileStatus = '2'; // resubmitted, pending review  
              newModalType = 'resubmitted';
              break;
            case 'return_for_correction':
              profileStatus = '1'; // needs correction
              newModalType = 'correction';
              break;
            default:
              profileStatus = '1'; // fallback
              newModalType = 'incomplete';
          }
        }
        
        // Check if status has actually changed to avoid unnecessary updates
        const currentStatus = sessionStorage.getItem('profile_status');
        const currentModalType = sessionStorage.getItem('profile_modal_type');
        
        if (currentStatus !== profileStatus || currentModalType !== newModalType) {
          console.log("DEBUG >>> Profile status changed - updating storage");
          // Store both status and modal type
          sessionStorage.setItem('profile_status', profileStatus);
          sessionStorage.setItem('profile_modal_type', newModalType);
        } else {
          console.log("DEBUG >>> Profile status unchanged");
        }
        
        if (isInitial) {
          hasFetchedStatus.current = true;
        }
        
      } catch (error) {
        // Don't log if it's an abort error
        if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
          console.error('Error fetching profile status:', error);
          sessionStorage.setItem('profile_status', '1');
          sessionStorage.setItem('profile_modal_type', 'incomplete');
        }
      } finally {
        isFetching.current = false;
        if (isInitial) {
          setIsLoading(false);
        }
        abortControllerRef.current = null;
      }
    } else {
      if (isInitial) {
        setIsLoading(false);
      }
      isFetching.current = false;
    }
  }, []);

  const checkAndShowModal = useCallback(() => {
    const normalizedPathname = pathname.replace(/\/$/, '');
    const role = sessionStorage.getItem('role_id');
    const statusCode = sessionStorage.getItem('profile_status');
    const modalTypeFromStorage = sessionStorage.getItem('profile_modal_type');

    console.log(" DEBUG >>> checkAndShowModal FIRED");
    console.log(" DEBUG >>> pathname:", pathname, "normalized:", normalizedPathname);
    console.log(" DEBUG >>> role:", role, "statusCode:", statusCode);
    console.log(" DEBUG >>> modalTypeFromStorage:", modalTypeFromStorage);
    console.log(" DEBUG >>> current modal state - isOpen:", isOpen, "shouldShowModal:", shouldShowModal);
    console.log(" DEBUG >>> last modal action:", modalActionRef.current);

    // 🆕 CRITICAL FIX: If we're on er-profile routes, NEVER show modal
    if (normalizedPathname === '/er-profile' || normalizedPathname === '/preview-profile' || normalizedPathname === '/er-profile/preview-profile2'|| normalizedPathname === '/preview-profile2' || normalizedPathname === '/er-profile/preview-profile' ||normalizedPathname === '/er-profile/spark-preview') {
      
      console.log("✅ DEBUG >>> On er-profile route - FORCING modal close");
      setShouldShowModal(false);
      setIsOpen(false);
      return;
    }

    // 🆕 If we recently navigated to profile, don't show modal
    if (modalActionRef.current.lastAction === 'NAVIGATING_TO_PROFILE') {
      console.log("✅ DEBUG >>> Recently navigated to profile - suppressing modal");
      return;
    }

    // Officer role & not approved
    if (role === '2' && statusCode !== '3') {
      console.log(" DEBUG >>> Showing modal - blocking access to:", pathname);
      setModalType(modalTypeFromStorage || 'incomplete');
      setShouldShowModal(true);
      setIsOpen(true);
    } else {
      console.log("✅ DEBUG >>> Approved or not officer - no modal needed");
      setShouldShowModal(false);
      setIsOpen(false);
    }
  }, [pathname, isOpen, shouldShowModal]);

  const handleGoToProfile = useCallback(() => {
    console.log("🔄 DEBUG >>> handleGoToProfile called - Starting navigation to /er-profile");
    
    // 🆕 Clear any existing timeouts and close modal immediately
    setIsOpen(false);
    setShouldShowModal(false);
    
    modalActionRef.current = {
      lastAction: 'NAVIGATING_TO_PROFILE',
      timestamp: Date.now()
    };
    
    console.log("🔄 DEBUG >>> Modal closed, now pushing route...");
     router.push('/er-profile');
  }, [router]);

  const refreshProfileStatus = useCallback(async () => {
    console.log("DEBUG >>> Manual profile status refresh triggered");
    hasFetchedStatus.current = false;
    await fetchProfileStatus(true);
    checkAndShowModal();
  }, [fetchProfileStatus, checkAndShowModal]);

  // Initial setup
  useEffect(() => {
    console.log(" DEBUG >>> ProfileCheck mounted");
    
    const initializeProfileCheck = async () => {
      if (!hasFetchedStatus.current && !isFetching.current) {
        await fetchProfileStatus(true);
      }
      checkAndShowModal();
    };

    initializeProfileCheck();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchProfileStatus, checkAndShowModal]);

  // Navigation effect
  useEffect(() => {
    const normalizedPathname = pathname.replace(/\/$/, '');
    console.log(" DEBUG >>> Navigation effect - pathname changed to:", pathname, "normalized:", normalizedPathname);
    console.log(" DEBUG >>> Previous pathname was:", lastPathname.current);

    //  Reset navigation flag after successful navigation
    if (modalActionRef.current.lastAction === 'NAVIGATING_TO_PROFILE' && (normalizedPathname === '/er-profile' || normalizedPathname === '/preview-profile' || normalizedPathname === '/er-profile/preview-profile')) {
      console.log("✅ DEBUG >>> Navigation to er-profile completed successfully");
      modalActionRef.current.lastAction = 'NAVIGATION_COMPLETE';
    }

    //  Use timeout to ensure we check after React state updates
    const timer = setTimeout(async () => {
      await fetchProfileStatus(false);
      checkAndShowModal();
    }, 50);

    lastPathname.current = pathname;

    return () => {
      clearTimeout(timer);
    };
  }, [pathname, fetchProfileStatus, checkAndShowModal]);

   // 🆕 Reset navigation flag after 2 seconds (safety net)
  useEffect(() => {
    if (modalActionRef.current.lastAction === 'NAVIGATING_TO_PROFILE') {
      const safetyTimer = setTimeout(() => {
        console.log(" DEBUG >>> Safety timer - resetting navigation flag");
        modalActionRef.current.lastAction = 'NAVIGATION_COMPLETE';
      }, 2000);

      return () => clearTimeout(safetyTimer);
    }
  }, [modalActionRef.current.lastAction]);

  // Listen for custom events to trigger refresh (called from other components)
  useEffect(() => {
    const handleRefreshEvent = () => {
      console.log("DEBUG >>> Refresh event received");
      refreshProfileStatus();
    };

    // Listen for custom event
    window.addEventListener('refreshProfileStatus', handleRefreshEvent);
    
    return () => {
      window.removeEventListener('refreshProfileStatus', handleRefreshEvent);
    };
  }, [refreshProfileStatus]);

  // Expose refresh function for other components (optional)
  useEffect(() => {
    window.refreshProfileStatus = refreshProfileStatus;
    return () => {
      delete window.refreshProfileStatus;
    };
  }, [refreshProfileStatus]);

 if (isLoading) {
    return null;
  }

  console.log(" DEBUG >>> RENDERING - isOpen:", isOpen, "shouldShowModal:", shouldShowModal, "pathname:", pathname);

  return (
    <ProfileCompletionModal 
      isOpen={isOpen && shouldShowModal} 
      setIsOpen={setIsOpen} 
      onNavigate={handleGoToProfile}
      modalType={modalType}
      canClose={false}
    />
  );
}