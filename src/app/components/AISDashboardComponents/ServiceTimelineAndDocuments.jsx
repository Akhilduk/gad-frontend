// components/ExecutiveDashboard/ServiceTimelineAndDocuments.jsx
import { motion } from "framer-motion";
import { BuildingOfficeIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

export const ServiceTimelineAndDocuments = () => {
  const postings = [
    { year: "2023-Present", position: "District Collector", location: "Mumbai District", department: "Revenue Department" },
    { year: "2020-2023", position: "Deputy Secretary", location: "State Secretariat", department: "Finance Department" },
    { year: "2018-2020", position: "SDM", location: "Pune Division", department: "Administration" }
  ];

  const documents = [
    { name: "Service Book", status: "Updated", date: "15 Jan 2024", priority: "high", size: "2.4 MB" },
    { name: "Annual Confidential Report", status: "Pending", date: "Due 30 Jan", priority: "high", size: "1.8 MB" },
    { name: "Asset Declaration", status: "Completed", date: "10 Dec 2023", priority: "medium", size: "3.1 MB" },
    { name: "Training Certificates", status: "Updated", date: "05 Jan 2024", priority: "low", size: "4.2 MB" }
  ];

  return (
    <motion.div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Service Timeline & Important Documents
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Timeline */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BuildingOfficeIcon className="w-5 h-5 mr-2 text-indigo-700" />
            Recent Postings
          </h4>
          <div className="space-y-4">
            {postings.map((posting, index) => (
              <motion.div 
                key={index}
                whileHover={{ scale: 1.02 }}
                className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-indigo-50 dark:from-gray-700 dark:to-indigo-900/20 border border-gray-200 dark:border-gray-600 cursor-pointer"
              >
                <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xs text-center leading-tight flex-shrink-0">
                  {posting.year}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{posting.position}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{posting.location}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{posting.department}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <DocumentTextIcon className="w-5 h-5 mr-2 text-green-600" />
            Important Documents
          </h4>
          <div className="space-y-4">
            {documents.map((doc, index) => (
              <motion.div 
                key={index}
                whileHover={{ x: 5 }}
                className="flex justify-between items-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{doc.name}</p>
                    <span className={`w-2 h-2 rounded-full ${
                      doc.priority === 'high' ? 'bg-red-500' : 
                      doc.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>{doc.date}</span>
                    <span>{doc.size}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  doc.status === 'Completed' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : doc.status === 'Pending'
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                }`}>
                  {doc.status}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};