// components/ExecutiveDashboard/StatsOverview.jsx
import { motion } from "framer-motion";
import { 
  BuildingOfficeIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon
} from "@heroicons/react/24/outline";

export const StatsOverview = ({ stats = {} }) => {
  const statItems = [
    { 
      label: "Service Years", 
      value: stats.serviceYears, 
      icon: BuildingOfficeIcon, 
      color: "indigo",
      trend: "+2.5%",
      description: "Years in service"
    },
    { 
      label: "Pending Tasks", 
      value: stats.pendingTasks, 
      icon: DocumentTextIcon, 
      color: "orange",
      trend: "-1.2%",
      description: "Require attention"
    },
    { 
      label: "Completed Cases", 
      value: stats.completedCases, 
      icon: ShieldCheckIcon, 
      color: "green",
      trend: "+15%",
      description: "This month"
    },
    { 
      label: "Upcoming Meetings", 
      value: stats.upcomingMeetings, 
      icon: CalendarIcon, 
      color: "purple",
      trend: "+3",
      description: "Next 7 days"
    },
    { 
      label: "Monthly Allowances", 
      value: `₹${stats.totalAllowances?.toLocaleString()}`, 
      icon: CurrencyRupeeIcon, 
      color: "emerald",
      trend: "+8%",
      description: "Total benefits"
    }, 
    { 
      label: "Team Size", 
      value: stats.teamSize, 
      icon: UserGroupIcon, 
      color: "indigo",
      trend: "+2",
      description: "Staff members"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statItems.map((stat, index) => (
        <motion.div
          key={index}
          whileHover={{ y: -5, scale: 1.02 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 relative overflow-hidden group cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">{stat.trend}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{stat.description}</span>
              </div>
            </div>
            <div className={`p-3 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900 group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-indigo-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
        </motion.div>
      ))}
    </div>
  );
};