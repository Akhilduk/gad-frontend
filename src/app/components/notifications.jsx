'use client';

import { useState } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { XMarkIcon, BellIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
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
  
  // For dates older than 30 days, return in dd mm yyyy format
  return date.format('DD MM YYYY');
};

const getNotificationColor = (type = 'info') => {
  const colors = {
    info: 'bg-indigo-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500'
  };
  return colors[type];
};

export default function NotificationModal({ 
  isOpen, 
  onClose, 
  notifications, 
  onMarkAsRead,
  onMarkAllAsRead 
}) {
  const [expanded, setExpanded] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const compactMaxHeight = Math.min(notifications.length * 80 + 250, 600); // Increase base to 250px

  const handleNotificationClick = (notification) => {
    console.log('Notification clicked:', notification);
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleHideClick = (e, id) => {
    e.stopPropagation();
    // TODO: Implement hide logic (e.g., API call to delete/hide notification)
    console.log('Hide notification:', id);
  };

  const handleActionClick = (e, url) => {
    e.stopPropagation();
    if (url) {
      window.location.href = url;
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* No backdrop for blending */}
      
      <motion.div
        layout
        initial={false}
        className="fixed top-24 right-32"
        style={{ maxHeight: `calc(100vh - 4rem)`, minHeight: '300px' }}
        animate={{ 
          width: expanded ? "clamp(24rem, 90vw, 32rem)" : "clamp(20rem, 80vw, 24rem)",
          maxHeight: expanded ? "calc(100vh - 4rem)" : `${compactMaxHeight}px`
        }}
        transition={{ 
          type: "spring", 
          damping: 35, 
          stiffness: 250,
          duration: 0.4,
          ease: "easeOut"
        }}
      >
        <DialogPanel
          as={motion.div}
          layout
          initial={{ opacity: 0 }} // Remove scale
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            type: "tween", 
            duration: 0.25,
            ease: "easeOut"
          }}
          className="h-full rounded-2xl bg-white/10 dark:bg-neutral-900/10 backdrop-blur-xl shadow-xl border border-white/20 dark:border-neutral-800/40 overflow-hidden ring-1 ring-white/10 dark:ring-neutral-800/40"
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          <motion.div 
            layout
            className="p-3 sm:p-4 border-b border-white/10 dark:border-neutral-800/40 bg-white/5 dark:bg-neutral-900/5 backdrop-blur-sm sticky top-0 z-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              type: "tween", 
              duration: 0.25, 
              ease: "easeOut" 
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {expanded ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setExpanded(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-neutral-800/20 transition-colors"
                  >
                    <ChevronLeftIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </motion.button>
                ) : (
                  <motion.div 
                    className="relative flex-shrink-0"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-full flex items-center justify-center shadow-md">
                      <BellIcon className="h-4 w-4 text-white" />
                    </div>
                    {unreadCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg border-2 border-white"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </motion.div>
                    )}
                  </motion.div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                    Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hidden sm:block">
                      {unreadCount} new
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {!expanded && unreadCount > 0 && onMarkAllAsRead && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={onMarkAllAsRead}
                    className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium px-2 py-1 rounded-md hover:bg-indigo-500/10 dark:hover:bg-indigo-400/20 transition-colors whitespace-nowrap"
                  >
                    Mark all read
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-neutral-800/20 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Notifications List - Card-like with minimal space and borders */}
          <motion.div 
            layout
            className={`flex-1 ${notifications.length > 0 ? 'overflow-y-auto' : 'overflow-hidden'}`} // Conditional overflow
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ 
              type: "spring", 
              damping: 35, 
              stiffness: 300,
              duration: 0.4
            }}
          >
            <AnimatePresence mode="popLayout">
              {notifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }} // Remove y and scale
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    type: "spring", 
                    damping: 30, 
                    stiffness: 400,
                    duration: 0.3
                  }}
                  className="flex flex-col items-center justify-center p-6 sm:p-8 text-center min-h-[180px]" // Add min-height
                >
                  <motion.div 
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 dark:bg-neutral-700/30 flex items-center justify-center mb-3 sm:mb-4 backdrop-blur-sm shadow-md"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <BellIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  </motion.div>
                  <motion.h3 
                    className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white mb-1"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    No notifications
                  </motion.h3>
                  <motion.p 
                    className="text-xs sm:text-sm text-gray-500 dark:text-gray-400"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    You're all caught up
                  </motion.p>
                </motion.div>
              ) : (
                notifications.map((notif, index) => (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, height: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, height: "auto", y: 0, scale: 1 }}
                    exit={{ opacity: 0, height: 0, y: -20, scale: 0.95 }}
                    transition={{ 
                      type: "tween", 
                      duration: 0.25, 
                      ease: "easeOut",
                      delay: index * 0.05 // Slightly reduced delay for smoother stagger
                    }}
                    className={`mx-2 sm:mx-3 first:rounded-t-lg last:rounded-b-lg transition-all duration-200 group cursor-pointer hover:shadow-md hover:border-white/20 dark:hover:border-neutral-800/40 ${
                      !notif.is_read 
                        ? 'bg-white/5 dark:bg-neutral-800/10 border-l-2 border-indigo-400/50' 
                        : 'bg-white/0 dark:bg-neutral-900/0'
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="p-2.5 sm:p-3 flex gap-3">
                      {/* Avatar/Icon - Compact */}
                      <motion.div 
                        className="flex-shrink-0"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ 
                          delay: index * 0.06 + 0.1,
                          type: "spring",
                          stiffness: 400
                        }}
                      >
                        <div className={`w-2 h-2 sm:w-3 sm:h-3 mt-1.5 rounded-full ${getNotificationColor(notif.type)}/80 shadow-sm ${
                          notif.is_read ? 'opacity-50' : ''
                        }`} />
                      </motion.div>
                      
                      {/* Content - Optimized readability with minimal space */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <motion.div 
                          initial={{ x: -15, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ 
                            delay: index * 0.06 + 0.15,
                            type: "spring",
                            stiffness: 350
                          }}
                          className="flex items-start justify-between gap-2"
                        >
                          <p className={`text-sm font-semibold leading-tight truncate pr-2 ${
                            notif.is_read 
                              ? 'text-gray-700 dark:text-gray-300' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {notif.title}
                          </p>
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                            {getTimeAgo(notif.created_at)}
                          </span>
                        </motion.div>
                        <motion.p 
                          initial={{ x: -15, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ 
                            delay: index * 0.06 + 0.2,
                            type: "spring",
                            stiffness: 350
                          }}
                          className="text-sm text-gray-600 dark:text-gray-400 leading-tight line-clamp-2"
                        >
                          {notif.body}
                        </motion.p>
                        
                        {/* Action Button - Compact */}
                        {notif.action_url && (
                          <motion.div 
                            initial={{ x: -15, opacity: 0, y: 10 }}
                            animate={{ x: 0, opacity: 1, y: 0 }}
                            transition={{ 
                              delay: index * 0.06 + 0.25,
                              type: "spring",
                              stiffness: 300
                            }}
                          >
                            <motion.button 
                              whileHover={{ scale: 1.02 }}
                              onClick={(e) => handleActionClick(e, notif.action_url)}
                              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium px-2.5 py-1 rounded-md bg-white/10 dark:bg-neutral-700/20 hover:bg-indigo-500/10 dark:hover:bg-indigo-400/20 transition-colors"
                            >
                              View details
                            </motion.button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </motion.div>

          {/* Footer - Compact */}
          {!expanded && notifications.length > 0 && (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                type: "spring", 
                damping: 30, 
                stiffness: 400,
                duration: 0.3
              }}
              className="p-2 sm:p-3 border-t border-white/10 dark:border-neutral-800/40 bg-white/5 dark:bg-neutral-900/5 backdrop-blur-sm"
            >
              <div className="text-center">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setExpanded(true)}
                  className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium px-3 py-1.5 rounded-md hover:bg-indigo-500/10 dark:hover:bg-indigo-400/20 transition-colors"
                >
                  See all notifications
                </motion.button>
              </div>
            </motion.div>
          )}
        </DialogPanel>
      </motion.div>
    </Dialog>
  );
}