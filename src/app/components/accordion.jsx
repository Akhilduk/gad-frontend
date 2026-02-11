'use client';

import { useState } from 'react';
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  InformationCircleIcon,
} from '@heroicons/react/20/solid';
import { useProfileCompletion } from '@/contexts/Profile-completion-context';

export function Accordion({ onSectionSelect, activeSection }) {
  const { sectionProgress } = useProfileCompletion();
  const [openIndex, setOpenIndex] = useState(null);

  const sectionMap = {
    'Officer Details': 'personal',
    'Educational Qualifications': 'education',
    'Service Details': 'service',
    'Deputation Details': 'central_deputation',
    'Training Details': 'training',
    'Awards and Publications': 'awards',
    'Disability Details': 'disability',
    'Disciplinary Details': 'disciplinary',
  };

  const cardSections = [
    'Educational Qualifications',
    'Service Details',
    'Deputation Details',
    'Training Details',
    'Awards and Publications',
    'Disability Details',
    'Disciplinary Details',
  ];

  const sections = [
    {
      title: 'Officer Details',
      key: 'personal',
    },
    {
      title: 'Educational Qualifications',
      key: 'education',
    },
    {
      title: 'Service Details',
      key: 'service',
    },
    {
      title: 'Deputation Details',
      key: 'central_deputation',
    },
    {
      title: 'Training Details',
      key: 'training',
    },
    {
      title: 'Awards and Publications',
      key: 'awards',
    },
    {
      title: 'Disability Details',
      key: 'disability',
    },
    {
      title: 'Disciplinary Details',
      key: 'disciplinary',
    },
  ];

  const handleSectionClick = (sectionTitle, index) => {
    // Toggle open/close for the accordion
    setOpenIndex(openIndex === index ? null : index);
    
    // Notify parent about section selection
    if (onSectionSelect) {
      onSectionSelect(sectionTitle);
    }
  };

  return (
    <div className="w-full mx-auto space-y-3 mt-6 mb-6">
      {sections.map((section, index) => {
        const secName = sectionMap[section.title];
        const prog = sectionProgress[secName] || { completed: 0, total: 0 };
        const isComplete = prog.completed === prog.total && prog.total >= 0;
        const isEmptySection = prog.completed === 0 && prog.total === 0;
        
        // Determine which icon to show
        let Icon;
        let iconColor;
        
        if (isEmptySection) {
          // indigo information icon for 0/0 sections
          Icon = InformationCircleIcon;
          iconColor = 'text-indigo-500 dark:text-indigo-400';
        } else if (isComplete) {
          // Green check icon for complete sections
          Icon = CheckCircleIcon;
          iconColor = 'text-green-500 dark:text-green-400';
        } else {
          // Red warning icon for incomplete sections
          Icon = ExclamationCircleIcon;
          iconColor = 'text-red-500 dark:text-red-400';
        }

        let displayTitle = section.title;
        let count = '';
        if (cardSections.includes(section.title)) { 
          count = ` (${prog.completed}/${prog.total})`;
          displayTitle += count;
        }

        const isActive = activeSection === section.title;
        const isOpen = openIndex === index;

        return (
          <div
            key={index}
            className={`rounded-xl border ${isActive ? 'border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-900' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800 shadow-sm transition-all`}
          >
            <button
              onClick={() => handleSectionClick(section.title, index)}
              className="flex w-full p-2 items-center rounded-xl text-left text-sm text-gray-900 dark:text-gray-100 bg-gradient-to-r from-white to-white dark:from-gray-800 dark:to-gray-800 hover:bg-gradient-to-r hover:from-indigo-300 hover:to-indigo-300 hover:border border-indigo-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon
                  aria-hidden="true"
                  className={`h-7 w-7 shrink-0 ${iconColor}`}
                />
                <span className={`${isActive ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-900 dark:text-gray-100'}`}>
                  {displayTitle}
                </span>
              </div>
              <span
                className={`ml-auto transform transition-transform ${isOpen ? 'rotate-180' : ''
                  }`}
              >
                <ChevronDownIcon
                  aria-hidden="true"
                  className="h-6 w-6 text-gray-500 dark:text-gray-400"
                />
              </span>
            </button>
            {isOpen && (
              <div className="px-5 py-3 text-base text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-b-xl">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {isEmptySection ? 'ℹ No information added yet' : 
                   isComplete ? '✓ All information complete' : '⚠ Some information missing'}
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {isEmptySection ? 'You can add information if needed' : `${prog.completed} of ${prog.total} completed`}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}