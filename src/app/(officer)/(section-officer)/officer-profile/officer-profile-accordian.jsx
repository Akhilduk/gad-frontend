'use client';

import { useState } from 'react';
import {

  ChevronDownIcon,
 
} from '@heroicons/react/20/solid';

import {

  UserIcon,
  ShieldCheckIcon,
  StarIcon,
  NoSymbolIcon,

} from '@heroicons/react/24/outline';

import { OfficerPersonalDetails } from './view/officer-personal-details'

import { CentralDeputationDetails } from '../../(ais-officer)/er-profile/view/central-deputation-details'

import { ServiceDetails } from '../../(ais-officer)/er-profile/view/service-details'

import { SuspensionDetails } from '../../(ais-officer)/er-profile/view/suspension details'




export default function Page() {
  return (
    <div className="p-4">
      <OfficerProfileAccordion />
    </div>
  );
}

export function OfficerProfileAccordion() {
  const [openIndex, setOpenIndex] = useState(0); // Initialize to 0 for the first accordion to be open

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const items = [
    {
      icon: UserIcon,
      title: 'Personal Details',
      content: <div><OfficerPersonalDetails/></div>,
    },
    {
      icon: ShieldCheckIcon,
      title: 'Deputation Details',
      content: <CentralDeputationDetails/>,
    },
   
    {
      icon: StarIcon,
      title: 'Service Details',
      content: <div><ServiceDetails/></div>,
    },

    {
      icon: NoSymbolIcon,
      title: 'Suspension Details',
      content: <div><SuspensionDetails/></div>,
    },
    
    
  ];

  return (
    <div className="w-full space-y-2 my-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-900 bg-white">
          <button
            onClick={() => toggleAccordion(index)}
            className="flex w-full items-center rounded-lg px-4 py-2 text-left text-sm font-medium text-gray-900 bg-white hover:bg-gray-200 dark:bg-gray-800"
          >
            <div className="flex items-center gap-2">
              <item.icon aria-hidden="true" className="h-6 w-6 text-gray-400 shrink-0 dark:text-gray-100" />
              <span className="text-gray-400 dark:text-gray-100">{item.title}</span>
            </div>
            <span className={`ml-auto transform transition-transform ${ openIndex === index ? 'rotate-180' : '' }`}>
              <ChevronDownIcon aria-hidden="true" className="h-5 w-5 text-gray-400" />
            </span>
          </button>
          {openIndex === index && (
            <div className="px-4 py-2 text-sm text-gray-500">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}



