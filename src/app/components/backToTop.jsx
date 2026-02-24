'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronUp } from 'lucide-react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Show button when page is scrolled down
  const toggleVisibility = useCallback(() => {
    const scrolled = document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    
    if (scrolled > windowHeight * 0.5) {
      setIsVisible(true);
      
      // Calculate scroll progress for the circle
      const totalScroll = docHeight - windowHeight;
      const progress = (scrolled / totalScroll) * 100;
      setScrollProgress(Math.min(progress, 100));
    } else {
      setIsVisible(false);
      setScrollProgress(0);
    }
  }, []);

  // Smooth scroll to top
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    
    // Throttle the scroll event for better performance
    let ticking = false;
    const throttledToggleVisibility = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          toggleVisibility();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', throttledToggleVisibility);
    
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
      window.removeEventListener('scroll', throttledToggleVisibility);
    };
  }, [toggleVisibility]);

  return (
    <>
      {/* Floating Back to Top Button */}
      <button
        onClick={scrollToTop}
        aria-label="Back to top"
        className={`
          fixed right-6 bottom-24 z-50
          flex items-center justify-center
          w-12 h-12 rounded-full
          bg-gradient-to-r from-indigo-600 to-teal-600
          text-white shadow-lg shadow-indigo-500/30
          transition-all duration-300 ease-out
          hover:shadow-xl hover:shadow-indigo-500/40
          hover:scale-110 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
          group
          ${isVisible 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 translate-y-10 pointer-events-none'
          }
        `}
      >
        {/* Animated SVG Circle (Progress Indicator) */}
        <svg className="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
          {/* Background Circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
            fill="none"
          />
          {/* Progress Circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="white"
            strokeWidth="2"
            fill="none"
            strokeDasharray={`${scrollProgress * 2.83} 283`}
            className="transition-all duration-150"
          />
        </svg>
        
        {/* Icon with Animation */}
        <ChevronUp 
          className="w-6 h-6 relative 
            group-hover:-translate-y-1 
            transition-transform duration-300" 
        />
        
        {/* Tooltip on Hover */}
        <span className="
          absolute -top-8 right-1/2 translate-x-1/2
          bg-gray-900 text-white text-xs
          px-3 py-1.5 rounded-lg whitespace-nowrap
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300 pointer-events-none
          shadow-lg
        ">
          Back to top
        </span>
      </button>

 
    </>
  );
}