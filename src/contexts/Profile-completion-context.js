import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const ProfileCompletionContext = createContext();
export const useProfileCompletion = () => useContext(ProfileCompletionContext);

const REQUIRED_SECTIONS = [
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

export const ProfileCompletionProvider = ({ children }) => {
  const [sectionProgress, setSectionProgress] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('profile_completion');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  
  const [sectionLoaded, setSectionLoaded] = useState({});
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Save to session storage when progress changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('profile_completion', JSON.stringify(sectionProgress));
    }
  }, [sectionProgress]);

  // Log initial state
  useEffect(() => {
    console.log('=== ProfileCompletionProvider Initial State ===');
    console.log('sectionProgress:', JSON.stringify(sectionProgress, null, 2));
    console.log('sectionLoaded:', JSON.stringify(sectionLoaded, null, 2));
    console.log('initialLoadComplete:', initialLoadComplete);
    console.log('REQUIRED_SECTIONS:', REQUIRED_SECTIONS);
    console.log('=============================================\n');
  }, []);

  // Mark a section as loaded (even if it has 0 fields)
  const markSectionLoaded = useCallback((sectionName) => {
    console.log(`📌 markSectionLoaded called for: "${sectionName}"`);
    setSectionLoaded((prev) => {
      const newState = {
        ...prev,
        [sectionName]: true,
      };
      console.log(`✅ Section "${sectionName}" marked as loaded. Current loaded sections:`, 
        Object.keys(newState).filter(key => newState[key]));
      return newState;
    });
  }, []);

  const updateSectionProgress = useCallback((sectionName, completed, total) => {
    console.log(`\n=== updateSectionProgress called ===`);
    console.log(`📊 Section: "${sectionName}"`);
    console.log(`✅ Completed: ${completed} of ${total}`);
    console.log(`📈 Previous progress for this section:`, sectionProgress[sectionName]);
    
    setSectionProgress((prev) => {
      if (
        prev[sectionName]?.completed === completed &&
        prev[sectionName]?.total === total
      ) {
        console.log(`⚡ No change detected for "${sectionName}", skipping update`);
        return prev;
      }
      
      const newState = {
        ...prev,
        [sectionName]: { 
          completed, 
          total,
          lastUpdated: Date.now(),
          completionPercentage: total > 0 ? (completed / total) * 100 : 0
        },
      };
      
      console.log(`✅ Updated progress for "${sectionName}":`, newState[sectionName]);
      console.log(`📋 Full sectionProgress after update:`, JSON.stringify(newState, null, 2));
      
      return newState;
    });
    
    // Mark this section as loaded
    markSectionLoaded(sectionName);
  }, [sectionProgress, markSectionLoaded]);

  const removeSectionProgress = useCallback((sectionName) => {
    console.log(`🗑️ Removing progress for section: "${sectionName}"`);
    setSectionProgress((prev) => {
      const updated = { ...prev };
      delete updated[sectionName];
      console.log(`✅ Section "${sectionName}" removed. Remaining sections:`, Object.keys(updated));
      return updated;
    });
  }, []);

  const resetSectionProgress = useCallback(() => {
    console.log('🔄 Resetting all progress');
    setSectionProgress({});
    setSectionLoaded({});
    setInitialLoadComplete(false);
  }, []);

  const markInitialLoadComplete = useCallback(() => {
    console.log('🏁 Marking initial load as complete');
    setInitialLoadComplete(true);
  }, []);

  // Log when sectionProgress changes
  useEffect(() => {
    if (Object.keys(sectionProgress).length > 0) {
      console.log('\n=== sectionProgress Updated ===');
      console.log('Current sectionProgress:', JSON.stringify(sectionProgress, null, 2));
      console.log('Total sections with data:', Object.keys(sectionProgress).length);
      
      // Calculate and log each section's completion
      REQUIRED_SECTIONS.forEach(section => {
        const data = sectionProgress[section];
        if (data) {
          console.log(`${section}: ${data.completed}/${data.total} = ${data.completionPercentage || ((data.completed/data.total)*100).toFixed(1)}%`);
        } else {
          console.log(`${section}: NO DATA`);
        }
      });
      console.log('==============================\n');
    }
  }, [sectionProgress]);

  // Log when sectionLoaded changes
  useEffect(() => {
    if (Object.keys(sectionLoaded).length > 0) {
      console.log('\n=== sectionLoaded Status ===');
      const loadedSections = REQUIRED_SECTIONS.filter(section => sectionLoaded[section]);
      const notLoadedSections = REQUIRED_SECTIONS.filter(section => !sectionLoaded[section]);
      console.log(`✅ Loaded (${loadedSections.length}):`, loadedSections);
      console.log(`❌ Not loaded (${notLoadedSections.length}):`, notLoadedSections);
      console.log('===========================\n');
    }
  }, [sectionLoaded]);

  // Get overall progress with fallback for unloaded sections
  const overallProgress = useCallback(() => {
    console.log('\n=== overallProgress Calculation ===');
    let totalFields = 0;
    let completedFields = 0;
    let loadedSectionsCount = 0;

    for (const section of REQUIRED_SECTIONS) {
      const sec = sectionProgress[section];
      
      if (sec) {
        // Section is loaded and reported progress
        console.log(`📊 ${section}: ${sec.completed || 0}/${sec.total || 0}`);
        completedFields += sec.completed || 0;
        totalFields += sec.total || 0;
        loadedSectionsCount++;
      } else if (sectionLoaded[section]) {
        // Section was loaded but has 0 fields (empty section)
        console.log(`📊 ${section}: Loaded but no data (0/0)`);
        loadedSectionsCount++;
      } else {
        console.log(`📊 ${section}: Not loaded yet`);
      }
    }

    console.log(`📈 Loaded sections: ${loadedSectionsCount}/${REQUIRED_SECTIONS.length}`);
    console.log(`🔢 Total fields: ${totalFields}`);
    console.log(`✅ Completed fields: ${completedFields}`);

    // Don't calculate progress until all sections are loaded at least once
    if (loadedSectionsCount < REQUIRED_SECTIONS.length) {
      console.log(`⚠️ Not all sections loaded. Returning 0%`);
      return 0;
    }

    const percentage = totalFields === 0 ? 0 : Math.round((completedFields / totalFields) * 100);
    console.log(`🎯 Calculated percentage: ${percentage}% (${completedFields}/${totalFields})`);
    console.log('===================================\n');
    
    return percentage;
  }, [sectionProgress, sectionLoaded]);

  // Alternative: Progressive loading that doesn't jump dramatically
  const overallProgressStable = useCallback(() => {
    console.log('\n=== overallProgressStable Calculation ===');
    const allProgress = {};
    
    for (const section of REQUIRED_SECTIONS) {
      const sec = sectionProgress[section];
      if (sec) {
        allProgress[section] = sec;
        console.log(`📊 ${section}: ${sec.completed}/${sec.total}`);
      } else {
        // For sections not yet loaded, use default values
        // This prevents jumps when sections load
        allProgress[section] = { completed: 0, total: 1 };
        console.log(`📊 ${section}: NOT LOADED (using 0/1)`);
      }
    }

    let totalFields = 0;
    let completedFields = 0;

    Object.values(allProgress).forEach((sec) => {
      completedFields += sec.completed || 0;
      totalFields += sec.total || 0;
    });

    const percentage = totalFields === 0 ? 0 : Math.round((completedFields / totalFields) * 100);
    console.log(`🔢 Total fields: ${totalFields}`);
    console.log(`✅ Completed fields: ${completedFields}`);
    console.log(`🎯 Calculated percentage: ${percentage}% (${completedFields}/${totalFields})`);
    console.log('==========================================\n');
    
    return percentage;
  }, [sectionProgress]);

  // Check if all sections have been loaded at least once
  const isLoaded = useMemo(() => {
    const loaded = REQUIRED_SECTIONS.every((sec) => {
      return sectionLoaded[sec] || sectionProgress[sec];
    });
    
    console.log(`\n🔍 isLoaded check: ${loaded}`);
    console.log('REQUIRED_SECTIONS:', REQUIRED_SECTIONS);
    console.log('sectionLoaded keys:', Object.keys(sectionLoaded));
    console.log('sectionProgress keys:', Object.keys(sectionProgress));
    
    REQUIRED_SECTIONS.forEach(sec => {
      console.log(`${sec}: loaded=${sectionLoaded[sec]}, progress=${sectionProgress[sec] ? 'YES' : 'NO'}`);
    });
    
    return loaded;
  }, [sectionProgress, sectionLoaded]);

  // Initialize all sections as "pending" on first load
  useEffect(() => {
    if (!initialLoadComplete && Object.keys(sectionLoaded).length === 0) {
      console.log('🔧 Initializing sectionLoaded state');
      const initialLoaded = {};
      REQUIRED_SECTIONS.forEach(section => {
        initialLoaded[section] = false;
      });
      setSectionLoaded(initialLoaded);
      console.log('✅ Initialized sectionLoaded:', initialLoaded);
    }
  }, [initialLoadComplete, sectionLoaded]);

  // Provide a consistent progress value that doesn't jump
  const getConsistentProgress = useCallback(() => {
    console.log('\n=== getConsistentProgress called ===');
    console.log(`initialLoadComplete: ${initialLoadComplete}`);
    
    // Wait for initial load to complete
    if (!initialLoadComplete) {
      console.log('⏳ initialLoadComplete is false, returning 0%');
      return 0;
    }
    
    // Use the stable calculation
    const progress = overallProgressStable();
    console.log(`🎯 Returning consistent progress: ${progress}%`);
    console.log('===========================================\n');
    
    return progress;
  }, [initialLoadComplete, overallProgressStable]);

  // Log the final progress value whenever it changes
  useEffect(() => {
    const progress = getConsistentProgress();
    console.log(`\n🎉 FINAL PROGRESS VALUE: ${progress}%`);
    console.log('================================\n');
  }, [getConsistentProgress]);

  return (
    <ProfileCompletionContext.Provider
      value={{
        sectionProgress,
        sectionLoaded,
        updateSectionProgress,
        removeSectionProgress,
        resetSectionProgress,
        markSectionLoaded,
        overallProgress: getConsistentProgress, // Use consistent progress
        isLoaded,
        initialLoadComplete,
        markInitialLoadComplete,
      }}
    >
      {children}
    </ProfileCompletionContext.Provider>
  );
};