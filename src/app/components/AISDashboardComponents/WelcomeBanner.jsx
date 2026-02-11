// components/ExecutiveDashboard/WelcomeBanner.jsx
import { motion } from "framer-motion";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { FloatingBubbles } from "./FloatingBubbles";
import moment from 'moment'; // Import moment

export const WelcomeBanner = ({ stats = {} }) => {
  // Format the current date using moment.js
  const currentDate = moment().format('DD MM YYYY'); // Format: 25 12 2023
  
  // Alternative format options:
  // const currentDate = moment().format('DD MMMM YYYY'); // 25 December 2023
  // const currentDate = moment().format('dddd, DD MMMM YYYY'); // Monday, 25 December 2023
  // const currentDate = moment().format('DD/MM/YYYY'); // 25/12/2023

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-3 mt-3 relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900 shadow-2xl"
    >
      <FloatingBubbles />

      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <motion.div 
          className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
      </div>
      
      <div className="relative z-10 px-10 py-12 ">
        <div className="flex items-center justify-between">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold text-white mb-3 drop-shadow-lg"
            >
              Welcome Back, <span className="text-cyan-300">Officer</span> 
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-indigo-100 text-lg max-w-2xl drop-shadow"
            >
              Here's your executive dashboard overview for {currentDate}
            </motion.p>
            
            {/* Quick Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center space-x-6 mt-6"
            >
              <div className="flex items-center space-x-2 backdrop-blur-sm bg-white/10 rounded-full px-4 py-2">
                <motion.div 
                  className="w-3 h-3 bg-green-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-indigo-100 text-sm font-medium">System Online</span>
              </div>
              <div className="flex items-center space-x-2 backdrop-blur-sm bg-white/10 rounded-full px-4 py-2">
                <motion.div 
                  className="w-2 h-2 bg-cyan-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-indigo-100 text-sm font-medium">{stats.pendingTasks || 0} Priority Tasks</span>
              </div>
              <div className="flex items-center space-x-2 backdrop-blur-sm bg-white/10 rounded-full px-4 py-2">
                <motion.div 
                  className="w-2 h-2 bg-yellow-400 rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
                <span className="text-indigo-100 text-sm font-medium">{stats.upcomingMeetings || 0} Meetings Today</span>
              </div>
            </motion.div>
          </div>

          {/* Decorative Elements */}
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="hidden lg:block relative"
          >
            <motion.div 
              className="w-32 h-32 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center justify-center"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <ShieldCheckIcon className="w-16 h-16 text-white/80" />
            </motion.div>
            
            {/* Floating particles around shield */}
            <motion.div
              className="absolute -top-2 -right-2 w-4 h-4 bg-cyan-400 rounded-full opacity-60"
              animate={{ 
                y: [0, -8, 0],
                x: [0, 4, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            />
            <motion.div
              className="absolute -bottom-2 -left-2 w-3 h-3 bg-purple-400 rounded-full opacity-60"
              animate={{ 
                y: [0, 6, 0],
                x: [0, -3, 0],
                scale: [1, 1.3, 1]
              }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            />
          </motion.div>
        </div>

        {/* Animated bottom border */}
        <motion.div 
          className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        />
      </div>
    </motion.div>
  );
};