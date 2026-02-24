'use client'


import { useState, useRef, useEffect } from 'react';
import { PlusIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/20/solid'; 
import styles from '../masterpage.module.css';
import Image from 'next/image';
type ServicesCardProps = {
  title: string;
  imageSrc: string;
  links?: string[]; // Optional array of strings
  navigateTo?: string; // Optional string
};

const ServicesCard: React.FC<ServicesCardProps> = ({ title, imageSrc, links = [], navigateTo = '#' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const listRef = useRef<HTMLUListElement | null>(null);

  const toggleExpand = () => {
    if (links.length > 0) {
      setIsExpanded(!isExpanded);
    }
  };

  useEffect(() => {
    if (isExpanded && listRef.current) {
      listRef.current.scrollTop = 0; // TypeScript will now know `scrollTop` exists
    }
  }, [isExpanded]);

  return (
    <div className="rounded-xl border overflow-hidden mb-3 relative bg-primary-500 dark:bg-neutral-700 dark:border-neutral-700">

     
      <div>
      <Image
        className="w-full h-52 object-cover rounded-t-lg"
        src={imageSrc}
        alt="Card Image"
        width={372} height={208}
       />
      </div>
      <div
        className={`absolute left-0 w-full pt-5 bg-primary-500 dark:bg-neutral-700 transition-transform duration-500 ease-in-out ${
          isExpanded ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        {/* Icon container */}
        <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-neutral-400 flex items-center justify-center rounded-full transition-transform duration-500 border-2 border-primary-500 dark:border-neutral-800 cursor-pointer`}
        >
          {links.length > 0 ? (
            <div onClick={toggleExpand}>
              {isExpanded ? (
                <XMarkIcon className="w-5 h-5 text-primary-500 dark:text-neutral-800" />
              ) : (
                <PlusIcon className="w-5 h-5 text-primary-500 dark:text-neutral-800" />
              )}
            </div>
          ) : (
            <a href={navigateTo} rel="noopener noreferrer">
              <ChevronRightIcon className="w-5 h-5 text-primary-500 dark:text-neutral-800" />
            </a>
          )}
        </div>

        {/* Links */}
        {links.length > 0 && (
          <ul ref={listRef} className={`${styles['custom-scrollbar']} space-y-2 px-2 me-1 overflow-y-auto h-40`}>
            {links.map((link, index) => (
              <li key={index} className="flex items-center mt-2">
                <a href="#" className="w-full p-3 text-gray-900 bg-gray-200 hover:bg-indigo-200 hover:text-indigo-900 rounded-lg text-xs shadow-sm transition-all duration-300">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Title */}
      <div className="mt-5 relative">
        <div className="flex items-center justify-center bg-primary-500 dark:bg-neutral-700">
          <h2 className="text-md text-white dark:text-neutral-400 font-bold px-2 py-3 mb-2">{title}</h2>
        </div>
      </div>
    </div>
  );
};
const StaffingAndRoles = () => {
  return (
    <>
   
                

                  

                  {/* Staffing And Roles */}
                  <ServicesCard
                      title="Administrative Department"
                      imageSrc="/images/services/administrative-department.svg"
                      links={[]}
                      navigateTo="/master-controls/administrative-department"
                    
                    />
                    <ServicesCard
                      title="Ministry"
                      imageSrc="/images/services/ministry.svg"
                      links={[]}
                      navigateTo="/master-controls/ministry"
                    
                    />
                    <ServicesCard
                      title="Implementing Agency"
                      imageSrc="/images/services/implementing-agency.svg"
                      links={[]}
                      navigateTo="/master-controls/implementing-agency"
                      
                    />
                    {/* <ServicesCard
                      title="State"
                      imageSrc="/images/services/state.svg"
                      links={[]}
                      navigateTo="/master-controls/state"
                      
                    /> */}
                    {/* <ServicesCard
                      title="District"
                      imageSrc="/images/services/district.svg"
                      links={[]}
                      navigateTo="/master-controls/district"
                      
                    /> */}

                    {/* <ServicesCard
                      title="Country"
                      imageSrc="/images/services/state.svg"
                      links={[]}
                      navigateTo="/master-controls/country"
                      
                    /> */}
                    {/* Staffing And Roles */}
  </>
  );
};

export default StaffingAndRoles;
