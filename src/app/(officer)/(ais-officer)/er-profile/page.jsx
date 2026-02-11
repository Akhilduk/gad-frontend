'use client';

import { useState, useEffect, useRef } from 'react';
import { Breadcrumb } from '@/app/components/breadcrumb';
import { ProfileSection } from '@/app/components/AISDashboardComponents/ProfileSection';
import { CompactProfileSection } from '@/app/components/AISDashboardComponents/CompactProfileSection';
import { Accordion } from '@/app/components/accordion';
import { ProfileCompletionProvider, useProfileCompletion } from '@/contexts/Profile-completion-context';
import { ProfileAccordion } from './profile-accordion';
import axiosInstance from '@/utils/apiClient';

// Create a mapping between section titles and indices
const SECTION_MAPPING = {
  'Officer Details': 0,
  'Educational Qualifications': 1,
  'Service Details': 2,
  'Deputation Details': 3,
  'Training Details': 4,
  'Awards and Publications': 5,
  'Disability Details': 6,
  'Disciplinary Details': 7,
};

// Define all required sections for progress tracking
const ALL_REQUIRED_SECTIONS = [
  'personal',
  'profile_photo',
  'education',
  'service',
  'central_deputation',
  'training',
  'awards',
  'disability',
  'disciplinary',
];

function ProfileContent() {
  const [openIndices, setOpenIndices] = useState(new Set([]));
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [showInitLoader, setShowInitLoader] = useState(false);
  const [activeSection, setActiveSection] = useState('Officer Details');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAllCollapsed, setIsAllCollapsed] = useState(true);
  const [layoutTransition, setLayoutTransition] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const sectionRefs = useRef([]);
  const contentContainerRef = useRef(null);
  const { sectionProgress, markInitialLoadComplete, initialLoadComplete } = useProfileCompletion();

  // Initialize refs for each section
  useEffect(() => {
    sectionRefs.current = sectionRefs.current.slice(0, 8);
  }, []);

  // Handle modal state from CompactProfileSection
  useEffect(() => {
    const handleModalStateChange = (event) => {
      if (event.detail && typeof event.detail.isOpen !== 'undefined') {
        setModalOpen(event.detail.isOpen);
      }
    };

    window.addEventListener('modal-state-change', handleModalStateChange);
    
    return () => {
      window.removeEventListener('modal-state-change', handleModalStateChange);
    };
  }, []);

  // Check if all sections are closed
  useEffect(() => {
    const allClosed = openIndices.size === 0;
    setIsAllCollapsed(allClosed);
    
    // Add transition class when state changes
    if (allClosed || openIndices.size > 0) {
      setLayoutTransition(true);
      const timer = setTimeout(() => {
        setLayoutTransition(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [openIndices]);

  // Handle section selection from left sidebar
  const handleSectionSelect = (sectionTitle) => {
    setActiveSection(sectionTitle);
    
    // Get the index from mapping
    const sectionIndex = SECTION_MAPPING[sectionTitle];
    if (sectionIndex === undefined) return;
    
    // Open the accordion section
    setOpenIndices(new Set([sectionIndex]));
    
    // Scroll to the section after a small delay to allow DOM update
    setTimeout(() => {
      if (sectionRefs.current[sectionIndex]) {
        sectionRefs.current[sectionIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 100);
  };

  // Toggle accordion (with scroll support)
  const toggleAccordion = (index) => {
    setOpenIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
    
    // Update active section
    const sectionTitle = Object.keys(SECTION_MAPPING).find(
      key => SECTION_MAPPING[key] === index
    );
    if (sectionTitle) {
      setActiveSection(sectionTitle);
      
      // Scroll to section when opening
      if (!openIndices.has(index)) {
        setTimeout(() => {
          if (sectionRefs.current[index]) {
            sectionRefs.current[index].scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }
        }, 100);
      }
    }
  };

  // Check if all sections have loaded their data
  const checkAllSectionsLoaded = () => {
    return ALL_REQUIRED_SECTIONS.every(section => {
      const progress = sectionProgress[section];
      return progress && typeof progress.completed === 'number' && typeof progress.total === 'number';
    });
  };

  // Initialize all sections temporarily for progress calculation
  useEffect(() => {
    if (profileData && !initialLoadComplete && !isInitializing) {
      console.log('Starting initialization - opening all sections');
      setIsInitializing(true);
      setShowInitLoader(true);
      
      // Open ALL sections temporarily
      const allIndices = new Set([0, 1, 2, 3, 4, 5, 6, 7]);
      setOpenIndices(allIndices);
    }
  }, [profileData, initialLoadComplete, isInitializing]);

  // Monitor when all sections have loaded
  useEffect(() => {
    if (isInitializing) {
      console.log('Checking if all sections loaded...', sectionProgress);
      
      const allSectionsLoaded = checkAllSectionsLoaded();
      
      if (allSectionsLoaded) {
        console.log('All sections loaded! Proceeding to finalize...');
        
        // Give a small delay for UI to settle and ensure all data is rendered
        const timer = setTimeout(() => {
          // Close all sections and open only the first one
          setOpenIndices(new Set([0]));
          setActiveSection('Officer Details');
          
          // Hide loader after animation completes
          setTimeout(() => {
            setShowInitLoader(false);
            markInitialLoadComplete();
            setIsInitializing(false);
            console.log('Initialization complete!');
          }, 500);
        }, 1000);
        
        return () => clearTimeout(timer);
      } else {
        const checkTimer = setTimeout(() => {
          if (isInitializing) {
            console.log('Sections still loading, checking again...');
            const loaded = checkAllSectionsLoaded();
            if (!loaded) {
              console.log('Some sections still not loaded:', 
                ALL_REQUIRED_SECTIONS.filter(s => !sectionProgress[s] || 
                  typeof sectionProgress[s].completed !== 'number'));
            }
          }
        }, 2000);
        
        return () => clearTimeout(checkTimer);
      }
    }
  }, [isInitializing, sectionProgress, markInitialLoadComplete]);

  // Fallback timeout in case sections don't load properly
  useEffect(() => {
    if (isInitializing) {
      const fallbackTimer = setTimeout(() => {
        console.log('Fallback: Initialization taking too long, forcing completion');
        setOpenIndices(new Set([0]));
        setActiveSection('Officer Details');
        setShowInitLoader(false);
        markInitialLoadComplete();
        setIsInitializing(false);
      }, 10000);
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [isInitializing, markInitialLoadComplete]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const cachedData = sessionStorage.getItem('profileData');
        if (cachedData) {
          setProfileData(JSON.parse(cachedData));
          setInfoMessage('Using cached profile data');
        }

        const response = await axiosInstance.get('/officer/officer');
        const responseData = response.data.data;
        setProfileData(responseData);
        sessionStorage.setItem('profileData', JSON.stringify(responseData));

        // SPARK check
        const spark = responseData?.spark_data?.data?.personal_details;
        
        // Officer info array
        const officerInfo = responseData?.officer_data?.get_all_officer_info_by_user_id?.officer_info?.[0];
        const fields = officerInfo?.fields;
        
        // AIS & GAD
        const ais = fields?.AIS_OFFICER;
        const gad = fields?.GAD_OFFICER;
        
        const sparkDOJ = spark?.date_of_joining || null;
        const sparkRetirement = spark?.retirement_date || null;

       // STEP 2 → From AIS
       const aisDOJ = ais?.date_of_joining || null;

       // STEP 3 → From GAD
       const gadRetirement = gad?.retirement_date || null;

       // FINAL VALUES
       const finalDOJ = sparkDOJ ?? aisDOJ ?? null;
       const finalRetirement = sparkRetirement ?? gadRetirement ?? null;

       // STORE
       sessionStorage.setItem("date_of_joining", finalDOJ);
       sessionStorage.setItem("retirement_date", finalRetirement);

        console.log('Final Date of Joining--------------------------------------------:', finalDOJ);
        console.log('Final Retirement Date:', finalRetirement);
       

        if (response.data.success) {
          setInfoMessage(response.data.message);
          setError(null);
        } else {
          setError(response.data.detail || 'Failed to fetch profile data');
        }
      } catch (err) {
        const status = err.response?.status;
        const responseData = err.response?.data?.data;
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

    fetchProfileData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="flex flex-col items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <div>Loading profile data...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb />

      {/* Info Message */}
      {infoMessage && (
        <div className="p-4 text-center">
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg max-w-lg mx-auto">
            <p className="font-bold">Information</p>
            <p>{infoMessage}</p>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 dark:bg-gray-800 dark:text-gray-100">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Error Loading Profile</h3>
                <p className="mt-2 text-sm text-gray-600">{error}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                onClick={() => setError(null)}
              >
                Close
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div 
        ref={contentContainerRef}
        className={`profile-layout-container relative isolate z-0 ${layoutTransition ? 'transition-all duration-300 ease-in-out' : ''} ${modalOpen ? 'overflow-hidden' : ''}`}
      >
        {/* When all collapsed - Horizontal compact ProfileSection at top */}
          {isAllCollapsed ? (
          <div className="space-y-3 py-2">
            {/* Compact Horizontal ProfileSection at top */}
            <div className={`w-full transform transition-all duration-300 relative z-10 ${layoutTransition ? 'scale-[0.98] opacity-90' : ''}`}>
              {profileData && <CompactProfileSection />}
            </div>
            
            {/* Main content area with sidebar and accordions */}
            <div className={`grid grid-cols-1 lg:grid-cols-12 gap-3 mt-4 relative z-0 ${modalOpen ? 'blur-sm pointer-events-none' : ''}`}>
              {/* Sidebar */}
              <div className="lg:col-span-3 relative z-0">
                {profileData && (
                  <Accordion 
                    onSectionSelect={handleSectionSelect}
                    activeSection={activeSection}
                  />
                )}
              </div>
              
              {/* ProfileAccordion */}
              <div className="lg:col-span-9 relative z-0">
                {profileData ? (
                  <ProfileAccordion
                    openIndices={openIndices}
                    toggleAccordion={toggleAccordion}
                    profileData={profileData}
                    sectionRefs={sectionRefs}
                    activeSection={activeSection}
                  />
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No profile data available to display sections.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Normal layout - ProfileSection in sidebar */
          <div className={`grid grid-cols-1 lg:grid-cols-12 gap-3 py-2 transition-all duration-300 relative z-0 ${layoutTransition ? 'opacity-90' : ''} ${modalOpen ? 'blur-sm pointer-events-none' : ''}`}>
            {/* Sidebar with ProfileSection */}
            <div className="lg:col-span-3 space-y-3 relative z-0">
              {profileData && (
                <>
                  <ProfileSection compactMode={false} />
                  <Accordion 
                    onSectionSelect={handleSectionSelect}
                    activeSection={activeSection}
                  />
                </>
              )}
            </div>
            
            {/* ProfileAccordion */}
            <div className="lg:col-span-9 relative z-0">
              {profileData ? (
                <ProfileAccordion
                  openIndices={openIndices}
                  toggleAccordion={toggleAccordion}
                  profileData={profileData}
                  sectionRefs={sectionRefs}
                  activeSection={activeSection}
                />
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No profile data available to display sections.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Blur overlay when modal is open */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-10 z-40 pointer-events-none"></div>
        )}
      </div>

      {/* Initial Loading Modal */}
      {showInitLoader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center max-w-sm dark:bg-gray-800 dark:text-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <div className="text-lg font-medium">Initializing profile sections...</div>
            <div className="text-sm text-gray-500 mt-2 text-center">
              Loading all section data to calculate accurate progress
              <div className="mt-1 text-xs">
                {Object.keys(sectionProgress).length} of {ALL_REQUIRED_SECTIONS.length} sections loaded
              </div>
            </div>
          </div>
        </div>
      )}


    </>
  );
}

export default function UpdateProfile() {
  return (
    <ProfileCompletionProvider>
      <ProfileContent />
    </ProfileCompletionProvider>
  );
}
