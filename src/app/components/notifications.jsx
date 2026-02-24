'use client';

import { useState } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { XMarkIcon, BellIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';

const getTimeAgo = (dateString) => {
  const now = moment();
  const date = moment(dateString);
  const diffInSeconds = now.diff(date, 'seconds');

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
  return date.format('DD MMM YYYY');
};

const getNotificationColor = (type = 'info') => {
  const colors = {
    info: 'bg-indigo-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
  };
  return colors[type];
};

export default function NotificationModal({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}) {
  const [expanded, setExpanded] = useState(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = (notification) => {
    // Mark as read when clicking the whole notification (optional)
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleMarkAsReadClick = (e, id) => {
    e.stopPropagation(); // Prevent triggering the parent click
    if (onMarkAsRead) {
      onMarkAsRead(id);
    }
  };

  const handleActionClick = (e, url) => {
    e.stopPropagation();
    if (url) window.location.href = url;
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/10 backdrop-blur-sm" aria-hidden="true" />

      <motion.div
        layout
        initial={false}
        className="fixed inset-0 flex items-start justify-end p-4 pt-20 sm:pt-24"
        style={{ pointerEvents: 'none' }}
      >
        <motion.div
          layout
          className="w-full max-w-md pointer-events-auto"
          animate={{
            scale: expanded ? 1 : 0.98,
            y: expanded ? 0 : 4,
          }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        >
          <DialogPanel
            as={motion.div}
            layout
            className="h-full max-h-[calc(100vh-6rem)] overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-neutral-200/70 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-full flex items-center justify-center shadow-md">
                    <BellIcon className="h-4 w-4 text-white" />
                  </div>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg ring-2 ring-white dark:ring-neutral-900">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                    Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">
                      {unreadCount} unread
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!expanded && unreadCount > 0 && onMarkAllAsRead && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-2 py-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Notifications list */}
            <div
              className={`overflow-y-auto ${
                expanded ? 'h-[calc(100%-73px)]' : 'max-h-[500px]'
              }`}
            >
              <AnimatePresence initial={false}>
                {notifications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16 px-4 text-center"
                  >
                    <div className="w-16 h-16 mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                      <BellIcon className="h-6 w-6 text-neutral-400 dark:text-neutral-500" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-1">
                      No notifications
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      You're all caught up
                    </p>
                  </motion.div>
                ) : (
                  notifications.map((notification, idx) => (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`
                        group relative flex gap-3 p-4 border-b border-neutral-100 dark:border-neutral-800/60 
                        cursor-pointer transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800
                        ${!notification.is_read ? 'bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-950' : ''}
                      `}
                    >
                      {/* Unread indicator – vertical bar */}
                      {!notification.is_read && (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r"
                          aria-hidden="true"
                        />
                      )}

                      {/* Type dot */}
                      <div className="flex-shrink-0 mt-1">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${getNotificationColor(
                            notification.type
                          )} shadow-sm`}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className={`
                              text-sm font-medium break-words whitespace-normal pr-2
                              ${
                                notification.is_read
                                  ? 'text-neutral-700 dark:text-neutral-300'
                                  : 'text-neutral-900 dark:text-white'
                              }
                            `}
                          >
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Mark as read button – only show for unread notifications */}
                            {!notification.is_read && (
                              <button
                                onClick={(e) => handleMarkAsReadClick(e, notification.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                                aria-label="Mark as read"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </button>
                            )}
                            <time className="text-xs whitespace-nowrap text-neutral-500 dark:text-neutral-400">
                              {getTimeAgo(notification.created_at)}
                            </time>
                          </div>
                        </div>

                        <p className="text-sm text-neutral-600 dark:text-neutral-400 break-words whitespace-pre-wrap">
                          {notification.body}
                        </p>

                        {notification.action_url && (
                          <div className="pt-1">
                            <button
                              onClick={(e) =>
                                handleActionClick(e, notification.action_url)
                              }
                              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-colors"
                            >
                              View details
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Footer – expand toggle */}
            {!expanded && notifications.length > 0 && (
              <div className="sticky bottom-0 p-3 border-t border-neutral-200/70 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm">
                <button
                  onClick={() => setExpanded(true)}
                  className="w-full py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                >
                  See all notifications
                </button>
              </div>
            )}
          </DialogPanel>
        </motion.div>
      </motion.div>
    </Dialog>
  );
}