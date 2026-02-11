// components/ExecutiveDashboard/RecentActivities.jsx
import { motion, AnimatePresence } from "framer-motion";
import { BellIcon } from "@heroicons/react/24/outline";

export const RecentActivities = ({ notifications = [] }) => {
  return (
    <motion.div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <BellIcon className="w-5 h-5 mr-2 text-orange-600" />
          Recent Notifications
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {notifications.filter(n => n.unread).length} unread
        </span>
      </div>
      <div className="space-y-4 max-h-64 overflow-y-auto">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`p-4 rounded-xl border-l-4 ${
                notification.unread 
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-400' 
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-300'
              } cursor-pointer hover:shadow-md transition-shadow`}
            >
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {notification.message}
                </p>
                {notification.unread && (
                  <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1"></span>
                )}
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  notification.type === 'meeting' 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    : notification.type === 'deadline'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                  {notification.type}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {notification.time}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};


