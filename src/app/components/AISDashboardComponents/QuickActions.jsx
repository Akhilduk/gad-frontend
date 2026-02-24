// components/ExecutiveDashboard/QuickActions.jsx
import { motion } from "framer-motion";
import { 
  DocumentTextIcon, 
  CurrencyRupeeIcon,
  CalendarIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";

export const QuickActions = () => {
  const actions = [
    { icon: DocumentTextIcon, label: "Service Record", color: "indigo", href: "/service-record" },
    { icon: CurrencyRupeeIcon, label: "Allowances", color: "green", href: "/allowances" },
    { icon: CalendarIcon, label: "Meeting Schedule", color: "purple", href: "/schedule" },
    { icon: UserGroupIcon, label: "Team Management", color: "orange", href: "/team" }
  ];

  return (
    <motion.div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
        <DocumentTextIcon className="w-5 h-5 mr-2 text-indigo-700" />
        Quick Actions
      </h3>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <motion.button
            key={index}
            whileHover={{ x: 5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-400 transition-all duration-200 group"
          >
            <div className={`p-2 rounded-lg bg-${action.color}-100 dark:bg-${action.color}-900 group-hover:bg-${action.color}-200 dark:group-hover:bg-${action.color}-800 mr-3`}>
              <action.icon className={`w-4 h-4 text-${action.color}-600 dark:text-${action.color}-400`} />
            </div>
            <span className="font-medium">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};