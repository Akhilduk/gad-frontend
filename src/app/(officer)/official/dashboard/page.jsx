'use client';

import { useState, useEffect } from 'react';
import {
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  UserIcon,
  UserPlusIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/utils/apiClient';

// Base paths for navigation
const VERIFICATION_LIST_PATH = '/official/dashboard/officer-verification-list';
const USER_LIST_PATH = '/official/dashboard/user-list';

const OfficialDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingApplication, setPendingApplication] = useState(0);
  const [analytics, setAnalytics] = useState({
    approvalRate: 0,
    returnRate: 0,
    pendingRate: 0,
    efficiencyScore: 0,
    avgProcessingTime: '2.5 days',
    trend: 'stable',
  });

  // Verification stats
  const [stats, setStats] = useState([
    {
      name: 'Total Profiles Submitted',
      value: 0,
      change: '+2%',
      icon: EyeIcon,
      filter: 'total',
      bgColor: 'bg-gradient-to-r from-indigo-500 to-indigo-700',
      textColor: 'text-white',
      progress: 100,
    },
    {
      name: 'Pending Verification',
      value: 0,
      change: '+12%',
      icon: ClockIcon,
      filter: 'pending',
      bgColor: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
      textColor: 'text-white',
      progress: 0,
    },
    {
      name: 'Approved',
      value: 0,
      change: '+5%',
      icon: CheckCircleIcon,
      filter: 'approved',
      bgColor: 'bg-gradient-to-r from-green-500 to-green-700',
      textColor: 'text-white',
      progress: 0,
    },
    {
      name: 'Returned for Correction',
      value: 0,
      change: '+8%',
      icon: ArrowPathIcon,
      filter: 'returned',
      bgColor: 'bg-gradient-to-r from-red-500 to-red-700',
      textColor: 'text-white',
      progress: 0,
    },
  ]);

  // Onboarding stats
  const [onboardingStats, setOnboardingStats] = useState([
    {
      name: 'Onboarded Officers List',
      value: 0,
      icon: UserIcon,
      filter: 'onboarded',
      bgColor: 'bg-gradient-to-r from-teal-500 to-teal-700',
      textColor: 'text-white',
    },
    {
      name: 'Login Activated Officers',
      value: 0,
      // change: '+8%',
      icon: UserPlusIcon,
      filter: 'first-login',
      bgColor: 'bg-gradient-to-r from-purple-500 to-purple-700',
      textColor: 'text-white',
    },
    {
      name: 'Profile Updation In Progress',
      value: 0,
      // change: '+3%',
      icon: DocumentTextIcon,
      filter: 'started-er',
      bgColor: 'bg-gradient-to-r from-pink-500 to-pink-700',
      textColor: 'text-white',
    },
    {
      name: 'Login Pending Officers',
      value: 0,
      // change: '+5%',
      icon: ClockIcon,
      filter: 'login-pendings',
      bgColor: 'bg-gradient-to-r from-orange-400 to-orange-600',
      textColor: 'text-white',
    },
    
  ]);

  const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : 0);

  const calculateAnalytics = (data) => {
    const total_all = Number(data?.total_all ?? 0);
    const as2_review_pending = Number(data?.as2_review_pending ?? 0);
    const approved_total = Number(data?.approved_total ?? 0);
    const return_for_correction_pending = Number(data?.return_for_correction_pending ?? 0);

    const derivedTotal =
      total_all > 0 ? total_all : as2_review_pending + approved_total + return_for_correction_pending;

    const approvalRate = derivedTotal > 0 ? pct(approved_total, derivedTotal) : 0;
    const returnRate = derivedTotal > 0 ? pct(return_for_correction_pending, derivedTotal) : 0;
    const pendingRate = derivedTotal > 0 ? pct(as2_review_pending, derivedTotal) : 0;

    const efficiencyScore = Math.max(
      0,
      Math.min(100, approvalRate * 1.2 - returnRate * 0.5 + (100 - pendingRate) * 0.3)
    );

    let trend = 'stable';
    if (approvalRate > 70 && returnRate < 15) trend = 'improving';
    else if (approvalRate < 50 || returnRate > 30) trend = 'declining';

    return {
      approvalRate,
      returnRate,
      pendingRate,
      efficiencyScore: Math.round(efficiencyScore),
      avgProcessingTime: approvalRate > 70 ? '1.8 days' : approvalRate > 50 ? '2.5 days' : '3.2 days',
      trend,
    };
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch verification stats
      const response = await axiosInstance.get('/as-II/officer-dashboard');
      if (response.data) {
        const total_all = Number(response?.data?.total_all ?? 0);
        const as2_review_pending = Number(response?.data?.as2_review_pending ?? 0);
        const approved_total = Number(response?.data?.approved_total ?? 0);
        const return_for_correction_pending = Number(response?.data?.return_for_correction_pending ?? 0);

        const derivedTotal =
          total_all > 0 ? total_all : as2_review_pending + approved_total + return_for_correction_pending;

        setPendingApplication(as2_review_pending);

        setStats([
          { ...stats[0], value: derivedTotal, progress: 100 },
          {
            ...stats[1],
            value: as2_review_pending,
            progress: pct(as2_review_pending, derivedTotal),
          },
          {
            ...stats[2],
            value: approved_total,
            progress: pct(approved_total, derivedTotal),
          },
          {
            ...stats[3],
            value: return_for_correction_pending,
            progress: pct(return_for_correction_pending, derivedTotal),
          },
        ]);

        setAnalytics(calculateAnalytics(response.data));
      }

      // Fetch first login completed officers
const firstLoginResponse = await axiosInstance.get(
  "/as-II/first-login-completed"
);

const firstLoginCount =
  firstLoginResponse?.data?.data?.officers?.length || 0;

const officersResponse = await axiosInstance.get("/as-II/officers");

const onboardedCount =
  officersResponse?.data?.data?.length || 0;

// Started ER Profiles
const startedERResponse = await axiosInstance.get(
  "/as-II/profile-saving-started"
);

const startedERCount =
  startedERResponse?.data?.data?.officers?.length || 0;

const pendingLoginCount = onboardedCount - firstLoginCount;

setOnboardingStats((prev) => [
  { ...prev[0], value: onboardedCount },
  { ...prev[1], value: firstLoginCount },
  { ...prev[2], value: startedERCount },
  { ...prev[3], value: pendingLoginCount }, // example pending login
]);
    } catch (err) {
      console.error('Dashboard API Error:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Navigation handlers
  const handleVerificationCardClick = (filter) => {
    router.push(`${VERIFICATION_LIST_PATH}?filter=${filter}`);
  };

  // Mapping for onboarding card navigation
  const onboardingPaths = {
    onboarded: '/official/',
    'first-login': '/official/dashboard/first-time-logins',
    'started-er': '/official/dashboard/started-er',
    'login-pendings': '/official/dashboard/login-pendings',
  };

  const handleOnboardingCardClick = (filter) => {
    const path = onboardingPaths[filter];
    if (path) {
      router.push(path);
    } else {
      router.push(`${USER_LIST_PATH}?filter=${filter}`);
    }
  };

  const user = JSON.parse(sessionStorage.getItem('user_details') || '{}');

  const getEfficiencyColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 dark:text-green-400';
      case 'declining':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-indigo-600 dark:text-indigo-400';
    }
  };

  const getTrendIcon = (trend) => {
    const baseClasses = 'h-4 w-4';
    switch (trend) {
      case 'improving':
        return <ArrowTrendingUpIcon className={`${baseClasses} text-green-500`} />;
      case 'declining':
        return <ArrowTrendingUpIcon className={`${baseClasses} text-red-500 transform rotate-180`} />;
      default:
        return <ChartBarIcon className={`${baseClasses} text-indigo-500`} />;
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 md:p-3 lg:p-3 mb-3">
      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading dashboard...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">Error: {error}</div>
      ) : (
        <>
          {/* Banner – unchanged */}
          <header className="relative mb-8 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-300 dark:from-indigo-900 dark:to-indigo-700 shadow-xl overflow-hidden">
            <div className="px-6 py-8 md:px-10 md:py-12">
              <h1 className="text-4xl font-bold text-white tracking-tight">
                Welcome, {user.first_name} {user.last_name || 'Officer'}
              </h1>
              <p className="mt-2 text-base text-indigo-100">
                You have{' '}
                <span className="font-bold text-yellow-300">{pendingApplication} applications</span>{' '}
                awaiting your review.
              </p>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-transparent" />
          </header>

          

          {/* ===== USER ONBOARDING STATS ===== */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-5 flex items-center">
              <UserIcon className="h-5 w-5 text-indigo-500 mr-2" />
              Officer Onboarding Activity
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {onboardingStats.map((stat) => (
                <button
                  key={stat.filter}
                  onClick={() => handleOnboardingCardClick(stat.filter)}
                  className="group block text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl rounded-2xl"
                >
                  <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                    {/* Left accent border with gradient */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${stat.bgColor}`} />
                    <div className="p-6 pl-7 relative z-10">
                      <div className="flex items-center">
                        <div className={`p-3 rounded-lg ${stat.bgColor} shadow-md`}>
                          <stat.icon className={`h-6 w-6 ${stat.textColor}`} aria-hidden="true" />
                        </div>
                        <div className="ml-4 flex-1">
                          <dt className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
                            {stat.name}
                          </dt>
                          <dd className="mt-1 flex items-baseline">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {stat.value}
                            </div>
                            {/* <div
                              className={`ml-2 text-sm font-medium ${
                                stat.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {stat.change}
                            </div> */}
                          </dd>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          {/* ===== APPLICATION VERIFICATION OVERVIEW ===== */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-5 flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-indigo-500 mr-2" />
              Application Verification Overview
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <button
                  key={stat.filter}
                  onClick={() => handleVerificationCardClick(stat.filter)}
                  className="group block text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl rounded-2xl"
                >
                  <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                    {/* Left accent border with gradient */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${stat.bgColor}`} />
                    <div className="p-6 pl-7 relative z-10">
                      <div className="flex items-center">
                        <div className={`p-3 rounded-lg ${stat.bgColor} shadow-md`}>
                          <stat.icon className={`h-6 w-6 ${stat.textColor}`} aria-hidden="true" />
                        </div>
                        <div className="ml-4 flex-1">
                          <dt className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
                            {stat.name}
                          </dt>
                          <dd className="mt-1 flex items-baseline">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {stat.value}
                            </div>
                            {/* <div
                              className={`ml-2 text-sm font-medium ${
                                stat.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {stat.change}
                            </div> */}
                          </dd>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`${stat.bgColor} h-1.5 rounded-full transition-all duration-700 ease-out`}
                            style={{ width: `${stat.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Statistical Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Performance Metrics */}
            <div className="bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-900/20 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ChartBarIcon className="h-5 w-5 text-indigo-500 mr-2" />
                Performance Analytics
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.approvalRate}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Approval Rate</div>
                  <div className="text-xs text-green-500 dark:text-green-400 mt-1">✓ Good</div>
                </div>
                <div className="text-center p-4 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{analytics.returnRate}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Return Rate</div>
                  <div className="text-xs text-red-500 dark:text-red-400 mt-1">Monitor</div>
                </div>
                <div className="text-center p-4 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{analytics.efficiencyScore}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Efficiency Score</div>
                  <div className={`text-xs mt-1 ${getEfficiencyColor(analytics.efficiencyScore)}`}>
                    {analytics.efficiencyScore >= 80
                      ? 'Excellent'
                      : analytics.efficiencyScore >= 60
                      ? 'Good'
                      : 'Needs Improvement'}
                  </div>
                </div>
                <div className="text-center p-4 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-lg shadow-sm">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{analytics.avgProcessingTime}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Avg. Processing</div>
                  <div className="text-xs text-purple-500 dark:text-purple-400 mt-1">Timely</div>
                </div>
              </div>
            </div>

            {/* Workload Distribution */}
            <div className="bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-900/20 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ArrowTrendingUpIcon className="h-5 w-5 text-indigo-500 mr-2" />
                Workload Distribution
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                    <span>Pending Review</span>
                    <span>{analytics.pendingRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-700"
                      style={{ width: `${analytics.pendingRate}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                    <span>Approved</span>
                    <span>{analytics.approvalRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-700"
                      style={{ width: `${analytics.approvalRate}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                    <span>Returned</span>
                    <span>{analytics.returnRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-700"
                      style={{ width: `${analytics.returnRate}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                <span className="text-sm text-gray-600 dark:text-gray-300">Performance Trend</span>
                <div className="flex items-center">
                  {getTrendIcon(analytics.trend)}
                  <span className={`ml-1 text-sm font-medium ${getTrendColor(analytics.trend)}`}>
                    {analytics.trend.charAt(0).toUpperCase() + analytics.trend.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-900/20 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-indigo-50/70 dark:bg-indigo-900/20 backdrop-blur-sm rounded-lg border border-indigo-100 dark:border-indigo-800">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="font-medium text-gray-900 dark:text-white">Approval Quality</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {analytics.approvalRate >= 70
                    ? 'High approval rate indicates good decision consistency'
                    : 'Consider reviewing approval criteria for consistency'}
                </p>
              </div>
              <div className="p-4 bg-yellow-50/70 dark:bg-yellow-900/20 backdrop-blur-sm rounded-lg border border-yellow-100 dark:border-yellow-800">
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="font-medium text-gray-900 dark:text-white">Pending Workload</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {pendingApplication > 10
                    ? `${pendingApplication} applications need immediate attention`
                    : 'Workload is manageable and up to date'}
                </p>
              </div>
              <div className="p-4 bg-red-50/70 dark:bg-red-900/20 backdrop-blur-sm rounded-lg border border-red-100 dark:border-red-800">
                <div className="flex items-center">
                  <ArrowPathIcon className="h-5 w-5 text-red-500 mr-2" />
                  <span className="font-medium text-gray-900 dark:text-white">Return Analysis</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {analytics.returnRate > 20
                    ? 'High return rate - consider providing clearer guidelines'
                    : 'Return rate is within acceptable limits'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OfficialDashboard;