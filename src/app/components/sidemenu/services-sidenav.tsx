'use client'
import { useEffect, useState } from 'react';
import Link from 'next/link';

import {
  HomeIcon,
  UsersIcon,
  FolderIcon,
  CalendarIcon,
  DocumentDuplicateIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';

type NavigationItem = {
  name: string;
  href: string;
  current: boolean;
  icon: React.ElementType;
};

const navItems: Omit<NavigationItem, 'current'>[] = [
    { name: 'Entitlement Claims', href: '/services/entitlement-claims', icon: HomeIcon },
    { name: 'Requests', href: '/services/requests', icon: UsersIcon },
    { name: 'Permissions', href: '/services/permissions', icon: FolderIcon },
    { name: 'Submissions', href: '/services/submissions', icon: CalendarIcon },
    // { name: 'Documents', href: '/documents', icon: DocumentDuplicateIcon },
    // { name: 'Reports', href: '#', icon: ChartPieIcon },
  ];

const ServicesSideNav = () => {

 const [navigation, setNavigation] = useState<NavigationItem[]>([]);

  useEffect(() => {
    const storedName = sessionStorage.getItem('services_active_nav');
    const updatedNav = navItems.map((item) => ({
      ...item,
      current: item.name === storedName || (!storedName && item.name === 'Entitlement Claims'),
    }));
    setNavigation(updatedNav);
  }, []);

  const handleNavigationClick = (name: string) => {
    sessionStorage.setItem('services_active_nav', name);
    setNavigation((prevNavigation) =>
      prevNavigation.map((item) =>
        item.name === name ? { ...item, current: true } : { ...item, current: false }
      )
    );
  };
  function classNames(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ');
  }

  return (
    <nav className="w-full mt-1">
      <ul role="list" className="flex flex-col items-center space-y-1">
        {navigation.map((item) => (
          <li key={item.name} className="w-full">
            <Link
              href={item.href}
              className={classNames(
                item.current
                  ? 'bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900 text-white border-indigo-300 shadow-md'
                  : 'text-neutral-600 border border-indigo-200 bg-white hover:bg-gradient-to-r hover:from-indigo-700 hover:to-indigo-500 hover:text-white dark:bg-neutral-800',
                'group flex flex-col items-center gap-y-1 rounded-lg p-3 text-sm font-regular text-center transition-all'
              )}
              onClick={() => handleNavigationClick(item.name)}
            >
              <item.icon
                aria-hidden="true"
                className={classNames(
                  item.current ? 'text-white' : 'text-indigo-500 group-hover:text-white',
                  'size-10 shrink-0'
                )}
              />
              <span className="text-xs">{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default ServicesSideNav;
