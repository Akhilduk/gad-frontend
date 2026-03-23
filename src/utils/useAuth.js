'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Define route access rules by role
const roleBasedRoutes = {
  '1': [ // Admin
    '/add-section-officer',
    '/add-office',
    '/add/officer',
    '/add-post',
    '/lists',
    
  ],
  '2': [ // ais Officer
    '/dashboard',
    '/er-profile',
    '/documents',
    '/reports',
    '/services',
   
  ],
  '3': [ // section officer
    '/master',
    '/master-controls',
    '/officer-profile',
   
    
  ],
  // Add more roles as needed
};

// Publicly accessible routes
const publicRoutes = ['/', '/login', '/faqs', '/user-agreement', '/privacy-policy', '/cookie-policy','/official/'];

export default function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
   
  useEffect(() => {
    
    const checkSession = () => {
      const token = sessionStorage.getItem('token');
      const roleId = sessionStorage.getItem('role_id');
      const currentPath = window.location.pathname;

      // Redirect unauthenticated users away from protected routes
      if (!token) {
        if (!publicRoutes.includes(currentPath)) {
          router.push('/login');
        }
        return;
      }

      // Session timeout
      const lastActivity = sessionStorage.getItem('lastActivity');
      const currentTime = Date.now();

      if (lastActivity && currentTime - parseInt(lastActivity) > SESSION_TIMEOUT) {
        handleLogout();
        return;
      }

      // Role-based route validation
      if (roleId && roleBasedRoutes[roleId]) {
        const allowedRoutes = roleBasedRoutes[roleId];
        const isAllowed = allowedRoutes.some(route => currentPath.startsWith(route));
        console.log("isAllowed",isAllowed)
        if (!isAllowed && !publicRoutes.includes(currentPath)) {
          console.log("currentPath",currentPath)
          router.push('/unauthorized'); // Optional: custom unauthorized page
          return;
        }
      }

      // Update activity timestamp
      sessionStorage.setItem('lastActivity', currentTime.toString());
      setIsLoading(false);
    };

    checkSession();

    // Activity listeners
    const updateLastActivity = () =>
      sessionStorage.setItem('lastActivity', Date.now().toString());

    window.addEventListener('mousemove', updateLastActivity);
    window.addEventListener('keydown', updateLastActivity);
    window.addEventListener('click', updateLastActivity);

    return () => {
      window.removeEventListener('mousemove', updateLastActivity);
      window.removeEventListener('keydown', updateLastActivity);
      window.removeEventListener('click', updateLastActivity);
    };
  } );

   const handleLogout = () => {
    sessionStorage.clear();
    router.push('/login');
  };

  return { isLoading };
}
