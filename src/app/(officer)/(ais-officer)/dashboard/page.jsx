// app/dashboard/executive/page.jsx
'use client';
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { WelcomeBanner } from "@/app/components/AISDashboardComponents/WelcomeBanner";
import { ProfileSection } from "@/app/components/AISDashboardComponents/ProfileSection";
import { QuickActions } from "@/app/components/AISDashboardComponents/QuickActions";
import { UpcomingEvents } from "@/app/components/AISDashboardComponents/UpcomingEvents";
import { StatsOverview } from "@/app/components/AISDashboardComponents/StatsOverview";
import { PerformanceChart } from "@/app/components/AISDashboardComponents/PerformanceChart";
import { RecentActivities } from "@/app/components/AISDashboardComponents/RecentActivities";
import { ServiceTimelineAndDocuments } from "@/app/components/AISDashboardComponents/ServiceTimelineAndDocuments";
import { useProfileCompletion } from "@/contexts/Profile-completion-context";

export default function AISDashboard() {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({});
 // Add context hook
  const { markInitialLoadComplete, sectionProgress } = useProfileCompletion();
  // Mock data - replace with actual API calls
  useEffect(() => {
    setStats({
      serviceYears: 12,
      pendingTasks: 8,
      completedCases: 245,
      upcomingMeetings: 3,
      totalAllowances: 185000,
      teamSize: 24
    });

    setNotifications([
      { id: 1, type: "meeting", message: "District Review Meeting at 3:00 PM", time: "2 hours ago", unread: true },
      { id: 2, type: "deadline", message: "Monthly Report Submission Due", time: "1 day ago", unread: true },
      { id: 3, type: "allowance", message: "Travel Allowance Processed", time: "2 days ago", unread: false }
    ]);
  }, []);
  useEffect(() => {
    // Optional: Wait for any initial section progress (if you load some here)
    const timer = setTimeout(() => {
      // Set a default progress for profile_photo if needed (e.g., if image exists)
      // updateSectionProgress("profile_photo", 1, 1); // Uncomment if you fetch/check image status

      markInitialLoadComplete(); // This flips initialLoadComplete to true
    }, 500); // Short delay to let userDetails/image load

    return () => clearTimeout(timer);
  }, [markInitialLoadComplete /*, updateSectionProgress */]);
  

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen rounded-xl dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 mb-3 hidden">
      <div className="mx-auto">
        <WelcomeBanner stats={stats} />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-12 gap-6"
        >
          {/* Left Sidebar - Profile & Quick Actions */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-6">
            <motion.div variants={itemVariants}>
              <ProfileSection />
            </motion.div>

            <motion.div variants={itemVariants}>
              <QuickActions />
            </motion.div>

            <motion.div variants={itemVariants}>
              <UpcomingEvents />
            </motion.div>
          </div>

          {/* Main Content Area */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-6">
            <motion.div variants={itemVariants}>
              <StatsOverview stats={stats} />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={itemVariants}>
                <PerformanceChart />
              </motion.div>

              <motion.div variants={itemVariants}>
                <RecentActivities notifications={notifications} />
              </motion.div>
            </div>

            <motion.div variants={itemVariants}>
              <ServiceTimelineAndDocuments />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}