'use client'

import { useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from "react-toastify";
import {
  ChevronDownIcon,
  UserIcon,
  GlobeAmericasIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  PresentationChartBarIcon,
  TrophyIcon,
  HandRaisedIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline'
import { PersonalDetails } from '../er-profile/view/personal-details'
import { DependentDetails } from '../er-profile/view/dependent-details'
import { CentralDeputationDetails } from '../er-profile/view/central-deputation-details'
import { EducationalQualifications } from '../er-profile/view/educational-qualifications'
import { ServiceDetails } from '../er-profile/view/service-details'
import { AwardsAndPublications } from '../er-profile/view/awards-and-publications'
import { DisabilityDetails } from '../er-profile/view/officer-disability-details'
import { CareerTrainingDetails } from '../er-profile/view/career-training-details'
import { SuspensionDetails} from '../er-profile/view/suspension details'

// Create a mapping for section titles
const SECTION_INDEX_MAP = {
  0: 'Officer Details',
  1: 'Educational Qualifications',
  2: 'Service Details',
  3: 'Deputation Details',
  4: 'Training Details',
  5: 'Awards and Publications',
  6: 'Disability Details',
  7: 'Disciplinary Details',
};

export function ProfileAccordion({ openIndices, toggleAccordion, profileData, sectionRefs, activeSection }) {
  const items = [
    {
      icon: UserIcon,
      title: 'Officer Details',
      content: (
        <div>
          <PersonalDetails profileData={profileData} />
          <DependentDetails profileData={profileData} />
        </div>
      ),
    },
    {
      icon: AcademicCapIcon,
      title: 'Educational Qualifications',
      content: <EducationalQualifications profileData={profileData} />,
    },
    {
      icon: BriefcaseIcon,
      title: 'Service Details',
      content: <ServiceDetails profileData={profileData} />,
    },
    {
      icon: GlobeAmericasIcon,
      title: 'Deputation Details',
      content: <CentralDeputationDetails profileData={profileData} />,
    },
    {
      icon: PresentationChartBarIcon,
      title: 'Training Details',
      content: <CareerTrainingDetails profileData={profileData} />,
    },
    {
      icon: TrophyIcon,  
      title: 'Awards and Publications',
      content: <AwardsAndPublications profileData={profileData} />,
    },
    {
      icon: HandRaisedIcon,
      title: 'Disability Details',
      content: <DisabilityDetails profileData={profileData} />,
    },
    {
      icon: NoSymbolIcon,
      title: 'Disciplinary Details',
      content: <SuspensionDetails profileData={profileData} />,
    },
  ];

  // Check if current section is active
  const isSectionActive = (index) => {
    return SECTION_INDEX_MAP[index] === activeSection;
  };

  return (
    <div className="w-full space-y-4 mb-6 relative z-0">
      {items.map((item, index) => {
        const isActive = isSectionActive(index);
        const isOpen = openIndices.has(index);
  
        return (
          <div
            key={index}
            ref={el => sectionRefs.current[index] = el}
            id={`section-${index}`}
            className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${isActive && isOpen ? 'border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-900' : 'border-white dark:border-gray-700'} overflow-hidden transition-all duration-200 z-0`}
          >
            <button
              className={`flex w-full items-center px-4 py-2 text-left text-base font-semibold text-gray-900 dark:text-gray-100 ${isActive && isOpen ? 'bg-indigo-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors duration-200 relative z-0`}
              onClick={() => toggleAccordion(index)}
              aria-expanded={isOpen}
              aria-controls={`accordion-content-${index}`}
            >
              <div className="flex items-center gap-4">
                <item.icon
                  aria-hidden="true"
                  className={`h-5 w-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'} shrink-0`}
                  strokeWidth={2}
                />
                <span className={isActive ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''}>
                  {item.title}
                </span>
              </div>
              <span className="ml-auto">
                <ChevronDownIcon
                  aria-hidden="true" 
                  className={`h-4 w-4 transition-transform duration-200 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'} ${isOpen ? 'rotate-180' : ''}`}
                  strokeWidth={2}
                />
              </span>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  id={`accordion-content-${index}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden relative z-0"
                >
                  <div className="px-2 py-2 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default function Page({ profileData }) {
  const [openIndices, setOpenIndices] = useState(new Set([0, 1, 2, 3, 4, 5, 6, 7]));

  const toggleAccordion = (index) => {
    setOpenIndices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen relative z-0"> {/* Parent with very low z-index */}
      <ProfileAccordion
        openIndices={openIndices}
        toggleAccordion={toggleAccordion}
        profileData={profileData}
      />
    </div> 
  );
}
 