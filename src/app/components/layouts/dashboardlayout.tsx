'use client';

import React, { useState, ReactNode, useEffect } from 'react';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react';
import { BellIcon, Bars3Icon, XMarkIcon, KeyIcon, ArrowRightOnRectangleIcon, Cog6ToothIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { AccessibilityToolbar } from '@/app/components/accessibility';
import { ThemeToggle } from '@/app/components/theme-toggle';
import { Footer } from '../../components/footer';
import DashboardNavigation from '../dashboard-navigation';
import UserNav from '../user-nav';
import ChangePasswordModal from '@/app/(auth)/change-password/change-password-modal';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NotificationModal from '@/app/components/notifications';
import axiosInstance from '@/utils/apiClient';
import useAuth from '@/utils/useAuth';

interface Notification {
  id: number;
  title: string;
  body: string;
  created_at: string;
  is_read: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
  action_url?: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isLoading } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<number | null>(null);
  const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isPasswordExpired, setIsPasswordExpired] = useState(false);
  const [isNotificationModalOpen, setNotificationModalOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const storedRole = Number(sessionStorage.getItem('role_id'));
    const uid = sessionStorage.getItem('user_id');
    setRole(storedRole);

    const firstLogin = sessionStorage.getItem('is_first_login') === 'true';
    const passwordExpired = sessionStorage.getItem('is_password_expired') === 'true';

    setIsFirstLogin(firstLogin);
    setIsPasswordExpired(passwordExpired);

    if (firstLogin || passwordExpired) {
      setChangePasswordModalOpen(true);
    }
    setUserId(uid);
  }, []);

  // Helper function for action icons
  const getActionIcon = (action: string) => {
    const iconClass = "h-4 w-4 text-indigo-600 dark:text-indigo-300";
    
    switch (action) {
      case 'changePassword':
        return <KeyIcon className={iconClass} />;
      case 'signOut':
        return <ArrowRightOnRectangleIcon className={iconClass} />;
      default:
        return <Cog6ToothIcon className={iconClass} />;
    }
  };

  // Helper function for href icons
  const getHrefIcon = (href: string) => {
    const iconClass = "h-4 w-4 text-indigo-600 dark:text-indigo-300";
    
    if (href?.includes('profile')) {
      return <UserCircleIcon className={iconClass} />;
    }
    return <Cog6ToothIcon className={iconClass} />;
  };

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      try {
        const res = await axiosInstance.get<Notification[]>(`/notifications/${userId}`);
        const apiNotifications = res.data || [];
        setNotifications(apiNotifications);
        const unread = apiNotifications.filter((n) => !n.is_read).length;
        setNotificationCount(unread);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setNotificationCount(0);
        setNotifications([]);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await axiosInstance.put(`/notifications/${id}`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setNotificationCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.is_read);
    if (unreadNotifications.length === 0) return;

    try {
      await Promise.all(
        unreadNotifications.map((n) => axiosInstance.put(`/notifications/${n.id}`))
      );
      setNotifications((prev) =>
        prev.map((n) => (n.is_read ? n : { ...n, is_read: true }))
      );
      setNotificationCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const handleMenuAction = (action: string) => {
    if (action === 'changePassword') {
      setChangePasswordModalOpen(true);
    } else if (action === 'signOut') {
      signOut();
    }
  };

  const signOut = async () => {
    try {
      sessionStorage.clear();
      router.push('/login');
    } catch (err) {
      console.error('Error during sign-out:', err);
    }
  };

  const userNavigation = [
    { name: 'Your Profile', href: '/er-profile', role: [2] },
    { name: 'Settings', href: '#' },
    { name: 'Change Password', action: 'changePassword' },
    { name: 'Sign out', action: 'signOut' },
  ];

  const filteredNavigation = role !== null
    ? userNavigation.filter((item) => (item.role ? item.role.includes(role) : true))
    : [];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg font-medium text-gray-700">Loading…</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col relative">
        {/* ==== TOP BAR – KARMASRI ONLY ==== */}
        <Disclosure as="nav" className="border-b border-neutral-200 bg-primary-500 text-white dark:bg-neutral-800 dark:border-neutral-900 relative z-50">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-12 items-center justify-between">
              <div className="flex-1 flex justify-center sm:justify-start">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter leading-none relative">
                  <span className="absolute inset-0" style={{ color: 'rgba(30,58,138,0.3)', transform: 'translate(1px,2px)', filter: 'blur(1px)' }}>KARMASRI</span>
                  <span className="absolute inset-0" style={{ color: 'rgba(30,58,138,0.2)', transform: 'translate(2px,4px)', filter: 'blur(2px)' }}>KARMASRI</span>
                  <span className="absolute inset-0" style={{ color: 'rgba(0,0,0,0.15)', transform: 'translate(3px,6px)', filter: 'blur(3px)' }}>KARMASRI</span>
                  <span className="absolute inset-0" style={{ color: '#fff', WebkitTextStroke: '1px #1e3a8a' }}>KARMASRI</span>
                  <span
                    className="relative"
                    style={{
                      color: 'transparent',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextStroke: '1px #1e3a8a',
                    }}
                  >
                    KARMASRI
                  </span>
                </h1>
              </div>
              <div className="flex items-center">
                <AccessibilityToolbar />
              </div>
            </div>
          </div>
        </Disclosure>

        {/* ==== MAIN NAVIGATION BAR ==== */}
        <Disclosure as="nav" className="bg-white dark:bg-neutral-700 xl:border-b border-neutral-300 dark:border-neutral-800 relative z-100">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Image
                  src="/images/logos/logo-en-white.png"
                  alt="Logo"
                  width={140}
                  height={40}
                  className="h-10 w-auto dark:hidden"
                  priority
                />
                <Image
                  src="/images/logos/logo-en-white-w.png"
                  alt="Logo"
                  width={140}
                  height={40}
                  className="h-10 w-auto hidden dark:block"
                  priority
                />
              </div>

              {/* Desktop Navigation */}
              <div className="hidden xl:flex md:items-center md:space-x-4 flex-1 justify-center">
                <DashboardNavigation />
              </div>

              {/* Right Side Icons (Desktop) */}
              <div className="hidden xl:flex items-center space-x-4">
                <div className="text-right">
                  <UserNav />
                </div>
                <button
                  onClick={() => setNotificationModalOpen(true)}
                  className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <BellIcon className="h-6 w-6" />
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center z-50">
                      {notificationCount}
                    </span>
                  )}
                </button>
                <ThemeToggle />
                <Menu as="div" className="relative">
                  <MenuButton className="flex items-center rounded-full bg-gray-200 p-1 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <Image src="/images/user.png" alt="User" width={32} height={32} className="rounded-full" />
                  </MenuButton>
                  <MenuItems className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5">
                    {filteredNavigation.map((item) =>
                      item.action ? (
                        <MenuItem key={item.name}>
                          <button
                            onClick={() => handleMenuAction(item.action)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {item.name}
                          </button>
                        </MenuItem>
                      ) : (
                        <MenuItem key={item.name}>
                          <Link href={item.href ?? "#"} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            {item.name}
                          </Link>
                        </MenuItem>
                      )
                    )}
                  </MenuItems>
                </Menu>
              </div>

              {/* Mobile Menu Button */}
              <div className="flex xl:hidden">
                <DisclosureButton className="inline-flex items-center justify-center p-2 rounded-b-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-600 transition-colors duration-200">
                  <Bars3Icon className="h-6 w-6 block group-data-[open]:hidden" />
                  <XMarkIcon className="h-6 w-6 hidden group-data-[open]:block" />
                </DisclosureButton>
              </div>
            </div>

            {/* Mobile Menu Panel */}
            <DisclosurePanel className="xl:hidden bg-white rounded-b-2xl dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg absolute top-full left-0 right-0 z-50">
              <div className="px-4 pt-4 pb-3 space-y-4">
              

                {/* User Info Section */}
                <div className="border-b border-gray-200 dark:border-neutral-700 pb-4">
                  <div className="flex items-start space-x-3 px-2">
                    <div className="flex-shrink-0">
                      <Image 
                        src="/images/user.png" 
                        alt="User" 
                        width={44} 
                        height={44} 
                        className="rounded-full border-2 border-gray-200 dark:border-neutral-600"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <UserNav />
                    </div>
                  </div>
                </div>

                  {/* Navigation Section */}
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 mb-2">
                    Navigation
                  </h3>
                  <DashboardNavigation />
                </div>

                {/* Quick Actions Section */}
                <div className="border-t border-gray-200 dark:border-neutral-700 pt-3">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 mb-2">
                      Quick Actions
                    </h3>
                    
                    {/* Notifications */}
                    <button
                      onClick={() => setNotificationModalOpen(true)}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-lg transition-colors duration-150 group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30">
                          <BellIcon className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span>Notifications</span>
                      </div>
                      {notificationCount > 0 && (
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium z-10">
                          {notificationCount}
                        </span>
                      )}
                    </button>

                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-lg transition-colors duration-150 group">
                      <div className="flex items-center space-x-3">
                        
                       <ThemeToggle />
                    
                        <span>Theme</span>
                      </div>
                     
                    </div>
                  </div>
                </div>

                {/* Account Section */}
                <div className="border-t border-gray-200 dark:border-neutral-700 pt-3">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 mb-2">
                      Account
                    </h3>
                    
                    {filteredNavigation.map((item) =>
                      item.action ? (
                        <button
                          key={item.name}
                          onClick={() => handleMenuAction(item.action)}
                          className="flex w-full items-center px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-lg transition-colors duration-150 group"
                        >
                          <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-neutral-700 group-hover:bg-indigo-200 dark:group-hover:bg-neutral-600 mr-3">
                            {getActionIcon(item.action)}
                          </div>
                          {item.name}
                        </button>
                      ) : (
                       <Link
                      key={item.name}
                      href={item.href ?? "#"}
                      className="flex items-center px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-lg transition-colors duration-150 group"
                    >
                      <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-neutral-700 group-hover:bg-indigo-200 dark:group-hover:bg-neutral-600 mr-3">
                        {getHrefIcon(item.href ?? "#")}
                      </div>
                      {item.name}
                    </Link>
                      )
                    )}
                  </div>
                </div>
              </div>
            </DisclosurePanel>
          </div>
        </Disclosure>

        {/* ==== MAIN CONTENT ==== */}
        <main className="flex-1 bg-neutral-50 dark:bg-neutral-900 relative z-10">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        <Footer />

        {isChangePasswordModalOpen && (
          <ChangePasswordModal
            closeModal={() => setChangePasswordModalOpen(false)}
            isFirstLogin={isFirstLogin}
            isPasswordExpired={isPasswordExpired}
          />
        )}

        {isNotificationModalOpen && (
          <NotificationModal
            isOpen={isNotificationModalOpen}
            onClose={() => setNotificationModalOpen(false)}
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
          />
        )}
      </div>
    </>
  );
}