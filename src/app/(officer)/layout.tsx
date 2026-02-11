'use client';

import { ReactNode, useEffect, useRef } from 'react';
import "@/app/globals.css";
import "../styles/style.css";
import 'react-toastify/dist/ReactToastify.css';
import { DashboardLayout } from '@/app/components/layouts/dashboardlayout';
import ProfileCheck from "@/app/(officer)/(ais-officer)/profileCompletionCheck";
import BackToTop from '@/app/components/backToTop'; // Adjust path as needed

// Import the Provider (adjust path as needed)
import { ProfileCompletionProvider } from '@/contexts/Profile-completion-context'; // e.g., wherever your context file is

export default function DashboardRootLayout({ children }: { children: ReactNode }) {
  
  const hasSetupRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || hasSetupRef.current) return;
    hasSetupRef.current = true;

    console.log('Setting up back button detection...');

    // Method 1: Direct popstate handler - most reliable
    const handlePopState = (event: PopStateEvent) => {
      console.log('🔄 Back/Forward button pressed - reloading page');
      event.preventDefault();
      event.stopPropagation();
      
      // Force immediate reload
      window.location.reload();
      return false;
    };

    // Method 2: Page show event (handles bfcache)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('🔄 Page loaded from cache - reloading');
        window.location.reload();
      }
    };

    // Method 3: Check navigation type on load
    const checkNavigationType = () => {
      try {
        const perfEntries = performance.getEntriesByType('navigation');
        if (perfEntries.length > 0) {
          const navEntry = perfEntries[0] as PerformanceNavigationTiming;
          if (navEntry.type === 'back_forward') {
            console.log('🔄 Back/Forward navigation detected via Performance API');
            window.location.reload();
          }
        }
      } catch (e) {
        console.warn('Performance API not available',e);
      }
    };

    // Add event listeners
    window.addEventListener('popstate', handlePopState, true); // Use capture phase
    window.addEventListener('pageshow', handlePageShow);
    
    // Check immediately
    setTimeout(checkNavigationType, 0);

    // Disable bfcache completely
    window.addEventListener('beforeunload', () => {
      // This prevents bfcache
    });

    // Add cache prevention headers
    const addNoStoreHeader = () => {
      try {
        const existingMeta = document.querySelector('meta[http-equiv="Cache-Control"]');
        if (!existingMeta) {
          const meta = document.createElement('meta');
          meta.setAttribute('http-equiv', 'Cache-Control');
          meta.setAttribute('content', 'no-store, no-cache, must-revalidate');
          document.head.appendChild(meta);
        }
      } catch (e) {
        console.warn('Could not add cache headers',e);
      }
    };

    addNoStoreHeader();

    console.log('✅ Back button detection setup complete');

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState, true);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  // if (isLoading) {
  //   return (
  //     <div className="flex justify-center items-center h-screen text-lg">
  //       Loading...
  //     </div>
  //   );
  // }

  return (
    
   <ProfileCompletionProvider>
      <DashboardLayout>
        {children}
        
        {/* Add BackToTop button here */}
        <BackToTop />
      </DashboardLayout>

      {/* Profile verification modal check */}
      <ProfileCheck />
    </ProfileCompletionProvider>
  );
}