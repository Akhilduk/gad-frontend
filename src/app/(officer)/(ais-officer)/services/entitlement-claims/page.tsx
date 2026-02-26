'use client';

import { useState, useRef, useEffect } from 'react';
import { PlusIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import styles from '../servicepage.module.css';
import Image from 'next/image';
import Link from 'next/link';

type ServicesCardProps = {
  title: string;
  imageSrc: string;
  links?: { label: string; url: string; isNew?: boolean }[];
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
    <div className="relative mb-3 overflow-hidden rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900 dark:border-neutral-700 dark:bg-none dark:bg-neutral-800">
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/10 blur-2xl dark:hidden" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 h-24 w-24 rounded-full bg-indigo-200/30 blur-2xl dark:hidden" />
      {/* Image */}
      <div className="relative">
        <Image
          className="h-52 w-full rounded-t-lg object-cover transition dark:brightness-90 dark:contrast-110"
          src={imageSrc}
          alt={`${title} image`}
          width={372}
          height={208}
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 rounded-t-lg ring-1 ring-black/10 dark:ring-white/35" />
      </div>

      {/* Expandable section */}
      <div
        className={`absolute left-0 w-full pt-5 bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900 dark:bg-none dark:bg-neutral-800 transition-transform duration-500 ease-in-out ${
          isExpanded ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        {/* Icon */}
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-neutral-400 flex items-center justify-center rounded-full transition-transform duration-500 border-2 border-indigo-500 dark:border-neutral-800 cursor-pointer"
          onClick={() => {
            if (links.length > 0) toggleExpand();
          }}
        >
          {links.length > 0 ? (
            isExpanded ? (
              <XMarkIcon className="w-5 h-5 text-indigo-600 dark:text-neutral-800" />
            ) : (
              <PlusIcon className="w-5 h-5 text-indigo-600 dark:text-neutral-800" />
            )
          ) : (
            <a
              href={navigateTo}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center w-full h-full"
            >
              <ChevronRightIcon className="w-5 h-5 text-indigo-600 dark:text-neutral-800" />
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
                  <Link
                    href={isComingSoon ? '#' : link.url}
                    onClick={(e) => isComingSoon && e.preventDefault()}
                    className={`w-full p-3 rounded-lg text-xs shadow-sm transition-all duration-300
                      ${
                        isComingSoon
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-900 hover:bg-indigo-200 hover:text-indigo-900'
                      }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {link.label}
                      {link.isNew && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                          New
                        </span>
                      )}
                    </span>
                  </Link>

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
        <div className="flex items-center justify-center bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900 dark:bg-none dark:bg-neutral-800">
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
          { label: 'Medical Reimbursement', url: '/reimbursement/medical', isNew: true },
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
