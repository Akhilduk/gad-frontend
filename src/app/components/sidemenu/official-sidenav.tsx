'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { UserPlusIcon } from '@heroicons/react/24/outline';

type NavigationItem = {
  name: string;
  href: string;
  current: boolean;
  icon: React.ElementType;
};

const OnboardingSideNav = () => {
  // ✅ Wrap navItems in useMemo to prevent recreation on every render
  const navItems = useMemo((): Omit<NavigationItem, 'current'>[] => [
    { name: 'Dashboard', href: '/official/dashboard', icon: UserPlusIcon },
    { name: 'AIS Officer Onboarding', href: '/official', icon: UserPlusIcon },
    // { name: 'Verified Profiles', href: '/official/verified', icon: UserPlusIcon },
    // { name: 'Profiles Awaiting Verification', href: '/official/pending', icon: UserPlusIcon },
  ], []); // Empty dependency array means this only runs once

  const [navigation, setNavigation] = useState<NavigationItem[]>([]);

  useEffect(() => {
    const storedName = sessionStorage.getItem('onboarding_active_nav');
    const updatedNav = navItems.map((item) => ({
      ...item,
      current: item.name === storedName || (!storedName && item.name === 'Dashboard'),
    }));
    setNavigation(updatedNav);
  }, [navItems]); // Now navItems is stable due to useMemo

  const handleNavigationClick = (name: string) => {
    sessionStorage.setItem('onboarding_active_nav', name);
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
    <nav className="w-full mt-3">
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

export default OnboardingSideNav;