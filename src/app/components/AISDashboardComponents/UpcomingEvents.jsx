// components/ExecutiveDashboard/UpcomingEvents.jsx
import { motion } from "framer-motion";
import { CalendarIcon } from "@heroicons/react/24/outline";

export const UpcomingEvents = () => {
  const events = [
    { time: "10:00 AM", event: "District Review Meeting", type: "meeting", location: "Collectorate", duration: "2h" },
    { time: "2:00 PM", event: "Public Grievance Hearing", type: "public", location: "District Office", duration: "1.5h" },
    { time: "4:30 PM", event: "Policy Discussion", type: "discussion", location: "Video Conference", duration: "1h" }
  ];

  return (
    <motion.div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <CalendarIcon className="w-5 h-5 mr-2 text-green-600" />
        Today's Schedule
      </h3>
      <div className="space-y-4">
        {events.map((event, index) => (
          <motion.div 
            key={index}
            whileHover={{ scale: 1.02, y: -2 }}
            className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 cursor-pointer group border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <span className="text-xs font-bold text-white text-center leading-tight">
                {event.time}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                {event.event}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{event.type}</span>
                <span className="text-xs text-gray-500 dark:text-gray-500">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-500">{event.duration}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1">{event.location}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};