'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  UsersIcon,
  FolderIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  role?: number[];
};

const DashboardNavigation = () => {
  const pathname = usePathname();
  const [role, setRole] = useState<number | null>(null);

  useEffect(() => {
    const storedRole = Number(sessionStorage.getItem('role_id'));
    setRole(storedRole);
  }, []);

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/services/entitlement-claims', icon: HomeIcon, role: [2] },
    { name: 'e-Services', href: '/services/requests', icon: UsersIcon, role: [2] },
    { name: 'My Applications', href: '/applications', icon: FolderIcon, role: [2] },
    { name: 'My Documents', href: '/documents', icon: CalendarIcon, role: [2] },
    { name: 'My Profile', href: '/er-profile', icon: UserIcon, role: [2] },
  ];

  const filteredNavigation =
    role !== null
      ? navigation.filter((item) =>
          item.role ? item.role.includes(role) : true
        )
      : [];

  function classNames(...classes: (string | false | null | undefined)[]) {
    return classes.filter(Boolean).join(' ');
  }

  return (
    <nav>
      {filteredNavigation.map((item) => {
        const isActive =
          pathname === item.href ||
          pathname.startsWith(item.href + '/');

        return (
          <Link
            key={item.name}
            href={item.href}
            className={classNames(
              isActive
                ? 'border-indigo-600 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700',
              'inline-flex flex-col items-center border-b-2 px-2 pt-1 text-sm font-medium mt-3 mx-2 dark:bg-neutral-700 dark:border-neutral-800 dark:text-white'
            )}
          >
            <item.icon
              className={classNames(
                isActive ? 'text-indigo-600' : 'text-neutral-400',
                'h-5 w-5 mb-1'
              )}
              aria-hidden="true"
            />
            <p className="mb-1">{item.name}</p>
          </Link>
        );
      })}
    </nav>
  );
};

export default DashboardNavigation;
