'use client';

import { useState, useRef, useEffect } from 'react';
import { PlusIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import styles from '../servicepage.module.css';
import Image from 'next/image';

type ServicesCardProps = {
  title: string;
  imageSrc: string;
  links?: { label: string; url: string }[];
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
      setIsExpanded(!isExpanded);
    }
  };

  useEffect(() => {
    if (isExpanded && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [isExpanded]);

  return (
    <div className="rounded-xl border overflow-hidden mb-3 bg-primary-500 dark:bg-neutral-700 relative dark:border-neutral-700">
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

      {/* Expandable section */}
      <div
        className={`absolute left-0 w-full pt-5 bg-primary-500 dark:bg-neutral-700 transition-transform duration-500 ease-in-out ${
          isExpanded ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        {/* Icon */}
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-neutral-400 flex items-center justify-center rounded-full transition-transform duration-500 border-2 border-primary-500 dark:border-neutral-800 cursor-pointer"
          onClick={() => {
            if (links.length > 0) toggleExpand();
          }}
        >
          {links.length > 0 ? (
            isExpanded ? (
              <XMarkIcon className="w-5 h-5 text-primary-500 dark:text-neutral-800" />
            ) : (
              <PlusIcon className="w-5 h-5 text-primary-500 dark:text-neutral-800" />
            )
          ) : (
            <a
              href={navigateTo}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center w-full h-full"
            >
              <ChevronRightIcon className="w-5 h-5 text-primary-500 dark:text-neutral-800" />
            </a>
          )}
        </div>

        {/* Links */}
        {links.length > 0 && (
          <ul
            ref={listRef}
            className={`${styles['custom-scrollbar']} space-y-2 px-2 me-1 overflow-y-auto h-40`}
          >
            {links.map((link, index) => {
              const isComingSoon = !link.url || link.url === '#';

              return (
                <li
                  key={index}
                  className="relative group flex items-center mt-2"
                >
                  <a
                    href={isComingSoon ? undefined : link.url}
                    onClick={(e) => isComingSoon && e.preventDefault()}
                    className={`w-full p-3 rounded-lg text-xs shadow-sm transition-all duration-300
                      ${
                        isComingSoon
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-900 hover:bg-indigo-200 hover:text-indigo-900'
                      }`}
                  >
                    {link.label}
                  </a>

                  {/* Tooltip */}
                  {isComingSoon && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2
                      opacity-0 group-hover:opacity-100 transition
                      bg-black text-white text-[10px] px-2 py-1 rounded-full shadow-lg whitespace-nowrap">
                      Coming Soon!
                    </span>
                  )}
                </li>
              );
            })}
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

const EntitlementClaims = () => {
  return (
    <>
      <ServicesCard
        title="GENERAL PROVIDENT FUND"
        imageSrc="/images/services/provident-fund.svg"
        links={[
          { label: 'Temporary Advances', url: '#' },
          { label: 'Non-Refundable Withdrawal', url: '#' },
          { label: 'Conversion of Temporary Advances', url: '#' },
          { label: 'Closure of GPF', url: '#' },
        ]}
      />

      <ServicesCard
        title="REIMBURSEMENT"
        imageSrc="/images/services/reimbursement.svg"
        links={[
          { label: 'Medical Reimbursement', url: '#' },
          { label: 'Travel Reimbursement', url: '#' },
          { label: 'Miscellaneous Reimbursement', url: '#' },
        ]}
      />

      <ServicesCard
        title="LEAVE SURRENDER"
        imageSrc="/images/services/leave-surrender.svg"
        links={[
          { label: 'Terminal Leave Surrender', url: '#' },
          { label: 'Casual Leave', url: '#' },
          { label: 'Medical Leave', url: '#' },
          { label: 'Training Based Leave', url: '#' },
          { label: 'Maternity Leave', url: '#' },
          { label: 'Special Maternity Leave', url: '#' },
          { label: 'Outstation Duty', url: '#' },
          { label: 'Earned Leave', url: '#' },
          { label: 'Special Leave', url: '#' },
        ]}
      />

      <ServicesCard
        title="ALLOWANCES"
        imageSrc="/images/services/allowance.svg"
        links={[
          { label: 'House Rent', url: '#' },
          { label: 'Children Education', url: '#' },
          { label: 'Telephone / Broadband / Newspaper', url: '#' },
          { label: 'Composite Transfer Grant (CTC)', url: '#' },
          { label: 'Transfer Allowance', url: '#' },
        ]}
      />

      <ServicesCard
        title="INCENTIVES"
        imageSrc="/images/services/incentives.svg"
        links={[{ label: 'Acquiring Higher Education', url: '#' }]}
      />

      <ServicesCard
        title="ADVANCES"
        imageSrc="/images/services/advance.svg"
        links={[{ label: 'LTC Advance', url: '#' }]}
      />
    </>
  );
};

export default EntitlementClaims;
