'use client'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  UserPlusIcon,
  ShieldCheckIcon,
  BuildingLibraryIcon,
    
} from '@heroicons/react/24/outline';

type NavigationItem = {
  name: string;
  href: string;
  current: boolean;
  icon: React.ElementType;
};

  const navItems: Omit<NavigationItem, 'current'>[] = [
    { name: 'Add Section Officer', href: '/add-section-officer', icon: UserPlusIcon },
    { name: 'Add Office', href: '/add-office', icon: BuildingLibraryIcon },
    { name: 'Add Post', href: '/add-post', icon: ShieldCheckIcon },
    { name: 'Add Officer', href: '/add-officer', icon: UserPlusIcon },

  ];

const AdminOfficeControlsSidenav = () => {


  const [navigation, setNavigation] = useState<NavigationItem[]>([]);
 
   useEffect(() => {
   
    const storedName = sessionStorage.getItem('admin_active_nav');
    const updatedNav = navItems.map((item) => ({
      ...item,
      current: item.name === storedName || (!storedName && item.name === 'Add Section Officer'),
    }));
    setNavigation(updatedNav);
  }, []);

  const handleNavigationClick = (name: string) => {
    sessionStorage.setItem('admin_active_nav', name);
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
    <nav className="w-full">
      <ul role="list" className="flex flex-col items-center space-y-1">
        {navigation.map((item) => (
          <li key={item.name} className="w-full">
            <Link
              href={item.href}
              className={classNames(
                item.current
                  ? 'bg-primary-500 text-white'
                  : 'text-neutral-500 border hover:bg-primary-700 hover:text-white dark:bg-neutral-800 bg-white',
                'group flex flex-col items-center gap-y-1 rounded-md p-3 text-sm font-regular text-center dark:border-neutral-800'
              )}
              onClick={() => handleNavigationClick(item.name)}
            >
              <item.icon
                aria-hidden="true"
                className={classNames(
                  item.current ? 'text-white' : 'text-neutral-400 group-hover:text-white',
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

export default AdminOfficeControlsSidenav;
