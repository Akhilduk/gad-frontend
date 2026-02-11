// components/ExecutiveDashboard/PerformanceChart.jsx
import { motion } from "framer-motion";
import { ChartBarIcon } from "@heroicons/react/24/outline";

export const PerformanceChart = () => {
  return (
    <motion.div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <ChartBarIcon className="w-5 h-5 mr-2 text-indigo-700" />
          Performance Metrics
        </h3>
        <select className="text-sm bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1 border-0 focus:ring-2 focus:ring-indigo-500">
          <option>This Month</option>
          <option>Last Month</option>
          <option>This Quarter</option>
        </select>
      </div>
      <div className="h-64 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center">
        <div className="text-center p-4">
          <div className="w-16 h-16 bg-indigo-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Performance Analytics</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Case resolution rate: 94%</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Public satisfaction: 88%</p>
        </div>
      </div>
    </motion.div>
  );
};