'use client';

import { useState, useRef, useEffect } from 'react';
import {
  PlusIcon,
  XMarkIcon,
  ChevronRightIcon,
} from '@heroicons/react/20/solid';
import styles from '../servicepage.module.css';
import Image from 'next/image';

type ServicesCardProps = {
  title: string;
  imageSrc: string;
  links?: string[];
  navigateTo?: string;
};

const ServicesCard: React.FC<ServicesCardProps> = ({
  title,
  imageSrc,
  links = [],
  navigateTo = '#',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const listRef = useRef<HTMLUListElement | null>(null);

  const toggleExpand = () => {
    if (links.length > 0) {
      setIsExpanded((prev) => !prev);
    }
  };

  useEffect(() => {
    if (isExpanded && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [isExpanded]);

  const isComingSoon = !navigateTo || navigateTo === '#';

  return (
    <div className="rounded-xl border overflow-hidden mb-3 relative bg-primary-500 dark:bg-neutral-700 dark:border-neutral-700">
      {/* Image */}
      <div>
        <Image
          className="w-full h-52 object-cover rounded-t-lg"
          src={imageSrc}
          alt={`${title} image`}
          width={372}
          height={208}
          loading="lazy"
        />
      </div>

      {/* Overlay */}
      <div
        className={`absolute left-0 w-full pt-5 bg-primary-500 dark:bg-neutral-700
        transition-transform duration-500 ease-in-out
        ${isExpanded ? '-translate-y-full' : 'translate-y-0'}`}
      >
        {/* Icon */}
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                     w-10 h-10 bg-white dark:bg-neutral-400 flex items-center
                     justify-center rounded-full border-2 border-primary-500
                     dark:border-neutral-800 group"
        >
          {links.length > 0 ? (
            <button onClick={toggleExpand}>
              {isExpanded ? (
                <XMarkIcon className="w-5 h-5 text-primary-500 dark:text-neutral-800" />
              ) : (
                <PlusIcon className="w-5 h-5 text-primary-500 dark:text-neutral-800" />
              )}
            </button>
          ) : (
            <>
              <a
                href={isComingSoon ? undefined : navigateTo}
                onClick={(e) => isComingSoon && e.preventDefault()}
                className={`flex items-center justify-center w-full h-full
                  ${isComingSoon ? 'cursor-not-allowed' : ''}`}
              >
                <ChevronRightIcon
                  className={`w-5 h-5 ${
                    isComingSoon
                      ? 'text-gray-400'
                      : 'text-primary-500 dark:text-neutral-800'
                  }`}
                />
              </a>

              {/* Tooltip */}
              {isComingSoon && (
                <span
                  className="absolute -top-8 left-1/2 -translate-x-1/2
                             opacity-0 group-hover:opacity-100 transition
                             bg-black text-white text-[10px]
                             px-2 py-1 rounded-full whitespace-nowrap"
                >
                  Coming Soon!
                </span>
              )}
            </>
          )}
        </div>

        {/* Links (not used, kept for consistency) */}
        {links.length > 0 && (
          <ul
            ref={listRef}
            className={`${styles['custom-scrollbar']}
              space-y-2 px-2 me-1 overflow-y-auto h-40`}
          >
            {links.map((link, index) => (
              <li key={index} className="flex items-center mt-2">
                <span className="w-full p-3 rounded-lg text-xs shadow-sm bg-gray-300 text-gray-500 cursor-not-allowed">
                  {link}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Title */}
      <div className="mt-5 relative">
        <div className="flex items-center justify-center bg-primary-500 dark:bg-neutral-700">
          <h2 className="text-md text-white dark:text-neutral-400 font-bold px-2 py-3 mb-2">
            {title}
          </h2>
        </div>
      </div>
    </div>
  );
};

const Submissions = () => {
  return (
    <>
      <ServicesCard
        title="RTC"
        imageSrc="/images/services/rtc.svg"
        navigateTo="#"
      />

      <ServicesCard
        title="CVC Proforma"
        imageSrc="/images/services/cvc.svg"
        navigateTo="#"
      />

      <ServicesCard
        title="Property Intimation Report"
        imageSrc="/images/services/property-intimation.svg"
        navigateTo="#"
      />

      <ServicesCard
        title="Other"
        imageSrc="/images/services/other.svg"
        navigateTo="#"
      />
    </>
  );
};

export default Submissions;
