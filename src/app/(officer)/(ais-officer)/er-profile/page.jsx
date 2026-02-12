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

// Backward-compatibility guard for older cached bundles during hot reload.
// (Some environments may still reference this symbol from previous iterations.)
const HELP_PANEL_STORAGE_KEY = 'er_profile_help_panel_dismissed';

const FLOW_STEPS = [
  { title: 'Start with Spark Profile', description: 'For a new session, click Spark Profile first and review the preview data that will be used in this system.' },
  { title: 'Plan before editing', description: 'Use Spark preview to understand mandatory fields, take a print if needed, and collect all required details before data entry.' },
  { title: 'Open section and edit', description: 'After reviewing Spark data, start from Officer Details. Use the left section list, open a section, then click Edit.' },
  { title: 'Officer Details flow', description: 'Inside Officer Details, first complete Personal Information and use Edit button there, then continue to Dependent Details tree and add/update family members.' },
  { title: 'Save every form/card', description: 'For Education/Service type sections, edit and save each card item separately.' },
  { title: 'Final preview and submit', description: 'After 100% completion, open Profile Preview, review all details, then click Submit at the bottom for OTP and e-sign to send it to AS-II for approval.' },
];

const GUIDED_MODE_STORAGE_KEY = 'er_profile_guided_mode';

const GUIDED_SECTION_ORDER = [
  'Officer Details',
  'Educational Qualifications',
  'Service Details',
  'Deputation Details',
  'Training Details',
  'Awards and Publications',
  'Disability Details',
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
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [showHelpBadge, setShowHelpBadge] = useState(false);
  const [guidedModeEnabled, setGuidedModeEnabled] = useState(false);
  const [skippedZeroInfoSections, setSkippedZeroInfoSections] = useState(new Set());
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
    const hideHelpBadge = localStorage.getItem(HELP_PANEL_STORAGE_KEY);
    if (hideHelpBadge !== 'true') {
      setShowHelpBadge(true);
    }

    const storedGuidedMode = localStorage.getItem(GUIDED_MODE_STORAGE_KEY);
    if (storedGuidedMode === 'true') {
      setGuidedModeEnabled(true);
    }

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

  const getCurrentGuidedIndex = () => {
    const index = GUIDED_SECTION_ORDER.indexOf(activeSection);
    return index === -1 ? 0 : index;
  };

  const currentGuidedIndex = getCurrentGuidedIndex();
  const currentStep = currentGuidedIndex + 1;
  const totalGuidedSteps = GUIDED_SECTION_ORDER.length;
  const previousGuidedSection = currentGuidedIndex > 0 ? GUIDED_SECTION_ORDER[currentGuidedIndex - 1] : null;
  const nextGuidedSection = currentGuidedIndex < totalGuidedSteps - 1 ? GUIDED_SECTION_ORDER[currentGuidedIndex + 1] : null;

  const orderedSections = [
    { title: 'Officer Details', key: 'personal' },
    { title: 'Educational Qualifications', key: 'education' },
    { title: 'Service Details', key: 'service' },
    { title: 'Deputation Details', key: 'central_deputation' },
    { title: 'Training Details', key: 'training' },
    { title: 'Awards and Publications', key: 'awards' },
    { title: 'Disability Details', key: 'disability' },
  ];

  const getProgressBySectionTitle = (sectionTitle) => {
    const sectionMeta = orderedSections.find((section) => section.title === sectionTitle);
    if (!sectionMeta) return { completed: 0, total: 0 };
    return sectionProgress[sectionMeta.key] || { completed: 0, total: 0 };
  };

  const isZeroInfoSection = (sectionTitle) => {
    const progress = getProgressBySectionTitle(sectionTitle);
    return progress.completed === 0 && progress.total === 0;
  };

  const getNextPendingSection = (skippedSections = skippedZeroInfoSections) => {
    return orderedSections.find(({ title, key }) => {
      const progress = sectionProgress[key] || { completed: 0, total: 0 };
      const isIncomplete = progress.total > 0 && progress.completed < progress.total;
      const isZeroInfo = progress.completed === 0 && progress.total === 0;

      if (isZeroInfo && skippedSections.has(title)) {
        return false;
      }

      return isIncomplete || isZeroInfo;
    });
  };

  const pendingSection = getNextPendingSection();
  const activeSectionIsZeroInfo = isZeroInfoSection(activeSection);
  const officerDetailsProgress = sectionProgress.personal || { completed: 0, total: 0 };
  const isOfficerDetailsCompleted = officerDetailsProgress.total > 0 && officerDetailsProgress.completed === officerDetailsProgress.total;
  const shouldHighlightSparkButton = guidedModeEnabled && !isOfficerDetailsCompleted;
  const shouldHighlightProfileButton = guidedModeEnabled && !pendingSection;

  const getGuidedStartSection = () => {
    if (!isOfficerDetailsCompleted) {
      return 'Officer Details';
    }

    return pendingSection?.title || activeSection || 'Officer Details';
  };

  const guidedGhostButtonClass = 'inline-flex h-9 w-full items-center justify-center rounded-md border px-3 py-2 text-xs font-semibold shadow-sm transition-colors sm:h-8 sm:w-auto sm:py-1.5';
  const guidedSolidButtonClass = 'inline-flex h-9 w-full items-center justify-center rounded-md border px-3 py-2 text-xs font-semibold shadow-sm transition-colors sm:h-8 sm:w-auto sm:py-1.5';

  const handleSkipZeroInfoSection = () => {
    if (!activeSectionIsZeroInfo) return;

    const updatedSkippedSections = new Set(skippedZeroInfoSections);
    updatedSkippedSections.add(activeSection);
    setSkippedZeroInfoSections(updatedSkippedSections);

    const nextSection = getNextPendingSection(updatedSkippedSections);
    if (nextSection?.title) {
      handleGoToGuidedSection(nextSection.title);
      return;
    }

    if (nextGuidedSection) {
      handleGoToGuidedSection(nextGuidedSection);
    }
  };

  const handleOpenHelp = () => {
    localStorage.setItem(HELP_PANEL_STORAGE_KEY, 'true');
    setShowHelpBadge(false);
    setShowHelpPanel(true);
  };

  const toggleGuidedMode = () => {
    setGuidedModeEnabled((prev) => {
      const nextValue = !prev;
      localStorage.setItem(GUIDED_MODE_STORAGE_KEY, String(nextValue));
      if (nextValue) {
        setSkippedZeroInfoSections(new Set());
        handleSectionSelect(getGuidedStartSection());
      }
      return nextValue;
    });
  };

  const handleGoToGuidedSection = (sectionTitle) => {
    if (!sectionTitle) return;
    handleSectionSelect(sectionTitle);
  };

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
      <Breadcrumb
        rightContent={(
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleOpenHelp}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50 dark:border-indigo-700 dark:bg-gray-800 dark:text-indigo-200 dark:hover:bg-indigo-950/40"
            >
              Help: How to complete profile
              {showHelpBadge && <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] text-white">New</span>}
            </button>

            <button
              type="button"
              onClick={toggleGuidedMode}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold shadow-sm transition-colors ${guidedModeEnabled
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200'
                : 'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:bg-gray-800 dark:text-indigo-200 dark:hover:bg-indigo-950/40'
                }`}
            >
              {guidedModeEnabled ? 'Guided Mode: On' : 'Start Guided Mode'}
            </button>
          </div>
        )}
      />

      {guidedModeEnabled && (
        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 sm:px-4 dark:border-emerald-700 dark:bg-emerald-950/30">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Guided completion</p>
              <p className="text-sm text-emerald-900 dark:text-emerald-100">
                Step {currentStep} of {totalGuidedSteps}: <span className="font-semibold">{activeSection}</span>
              </p>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={() => handleGoToGuidedSection(previousGuidedSection)}
                disabled={!previousGuidedSection}
                className={`${guidedGhostButtonClass} border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-600 dark:bg-gray-900 dark:text-emerald-200`}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => handleGoToGuidedSection(pendingSection?.title || nextGuidedSection)}
                className="rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-600 dark:bg-gray-900 dark:text-emerald-200"
              >
                Open Next Pending
              </button>
              <button
                type="button"
                onClick={handleSkipZeroInfoSection}
                disabled={!activeSectionIsZeroInfo}
                className={`${guidedGhostButtonClass} border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-sky-700 dark:bg-sky-950/30 dark:text-sky-200`}
              >
                Skip
              </button>
              <button
                type="button"
                onClick={toggleGuidedMode}
                className={`${guidedSolidButtonClass} border-transparent bg-emerald-600 text-white hover:bg-emerald-700`}
              >
                Exit Guided Mode
              </button>
            </div>
          </div>
        </div>
      )}

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
              {profileData && (
                <CompactProfileSection
                  highlightSparkButton={shouldHighlightSparkButton}
                  highlightProfileButton={shouldHighlightProfileButton}
                />
              )}
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
                    guidedModeEnabled={guidedModeEnabled}
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
                  <ProfileSection
                    compactMode={false}
                    highlightSparkButton={shouldHighlightSparkButton}
                    highlightProfileButton={shouldHighlightProfileButton}
                  />
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
                  guidedModeEnabled={guidedModeEnabled}
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


      {showHelpPanel && (
        <div className="fixed inset-0 z-[95] bg-black/40 backdrop-blur-[1px]">
          <div
            className="absolute inset-0 w-full overflow-y-auto border-gray-200 bg-white shadow-2xl sm:inset-y-10 sm:right-0 sm:left-auto sm:max-w-2xl sm:rounded-l-2xl sm:border-l dark:border-gray-700 dark:bg-gray-900"
            role="dialog"
            aria-modal="true"
            aria-label="Profile completion help"
          >
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4 sm:px-5 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile completion help</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Quick reference for Spark preview, section edit flow, card saves, and OTP submission.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelpPanel(false)}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-5 p-4 sm:p-5">
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setShowHelpPanel(false);
                  }}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-left text-sm text-indigo-900 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-200"
                >
                  <p className="font-semibold">Where is Spark Preview?</p>
                  <p className="mt-1 leading-6">Top-left profile card → click Spark Profile.</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (pendingSection) {
                      handleSectionSelect(pendingSection.title);
                    }
                    setShowHelpPanel(false);
                  }}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-left text-sm text-indigo-900 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-200"
                  disabled={!pendingSection}
                >
                  <p className="font-semibold">Where to edit next?</p>
                  <p className="mt-1 leading-6">{pendingSection ? `Open ${pendingSection.title}` : 'All trackable sections completed'}</p>
                </button>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <h4 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">4-step completion flow</h4>
                <ol className="space-y-3">
                  {FLOW_STEPS.map((step, index) => (
                    <li key={step.title} className="rounded-lg bg-white p-3 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                      <p className="font-semibold text-indigo-700 dark:text-indigo-300">Step {index + 1}: {step.title}</p>
                      <p className="mt-1 leading-6">{step.description}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
                <p className="font-semibold">Important save rule</p>
                <p className="mt-1 leading-6">Section becomes complete only after Save succeeds. In card sections (Education/Service/etc.), each card must be saved separately.</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                <p className="font-semibold text-gray-900 dark:text-gray-100">Where is OTP action?</p>
                <p className="mt-1 leading-6">After completion reaches 100%, open Profile Preview from left card and use Submit for approval (AS-2) with OTP e-sign.</p>
              </div>


            </div>
          </div>
        </div>
      )}

      {guidedModeEnabled && (
        <div className="fixed inset-x-2 bottom-2 z-[90] rounded-xl border border-emerald-200 bg-white/95 p-3 shadow-xl backdrop-blur sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[min(28rem,calc(100vw-2rem))] sm:p-4 dark:border-emerald-700 dark:bg-gray-900/95">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Guidance Coach</p>
          <p className="mt-1 text-sm text-gray-800 dark:text-gray-100">
            You are on <span className="font-semibold">{activeSection}</span>. Complete edits and save this section, then continue.
          </p>
          {shouldHighlightSparkButton && (
            <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-300">
              New user flow: click the slowly pulsating <span className="font-semibold">Spark Profile</span> button first, review preview data, note mandatory fields, and then start editing from <span className="font-semibold">Officer Details</span>.
            </p>
          )}
          {activeSection === 'Disciplinary Details' && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              Disciplinary Details are updated by <span className="font-semibold">AS-II officer</span>. No save or edit action is required for AIS officer in this section.
            </p>
          )}
          {activeSection === 'Officer Details' && (
            <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-300">
              Officer Details order: complete <span className="font-semibold">Personal Information</span> first (Edit button inside that card), then continue with the <span className="font-semibold">Dependent Details</span> tree.
            </p>
          )}
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            {pendingSection ? `Next pending: ${pendingSection.title}` : 'All tracked sections are complete. Please go to Profile Preview and submit.'}
          </p>
          {shouldHighlightProfileButton && (
            <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-300">
              Completion flow: click the slowly pulsating <span className="font-semibold">Profile</span> button, review the full data, then use the <span className="font-semibold">Submit</span> action at the bottom for OTP + e-sign. Final submission goes to <span className="font-semibold">AS-II</span> for approval.
            </p>
          )}
          {activeSectionIsZeroInfo && (
            <p className="mt-1 text-xs text-sky-700 dark:text-sky-300">
              This section has no information yet (0/0). Use the Add button to create records, or click "Skip" to continue to the next section.
            </p>
          )}
          {activeSectionIsZeroInfo && pendingSection?.title === activeSection && (
            <p className="mt-1 text-xs text-sky-700 dark:text-sky-300">
              You are currently on the next pending section.
            </p>
          )}
          <div className="mt-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={() => handleGoToGuidedSection(previousGuidedSection)}
              disabled={!previousGuidedSection}
              className={`${guidedGhostButtonClass} border-gray-200 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800`}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => handleGoToGuidedSection(pendingSection?.title || nextGuidedSection)}
              className={`${guidedGhostButtonClass} border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200`}
            >
              Open Next
            </button>
            <button
              type="button"
              onClick={handleSkipZeroInfoSection}
              disabled={!activeSectionIsZeroInfo}
              className={`${guidedGhostButtonClass} border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-sky-700 dark:bg-sky-950/30 dark:text-sky-200`}
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`${guidedGhostButtonClass} border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200`}
            >
             Move to top
            </button>
          </div>
        </div>
      )}

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
