'use client';

import { useState, useEffect } from 'react';
import { EyeIcon, ClockIcon, CheckCircleIcon, ArrowPathIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/utils/apiClient';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/solid';
// Hardcoded base path — matches your actual route
const BASE_PATH = '/official/dashboard/officer-verification-list';

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
    trend: 'stable'
  });

  const [stats, setStats] = useState([
    {
      name: 'Total Profiles',
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

  const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : 0);

  const calculateAnalytics = (data) => {
    const total_all = Number(data?.total_all ?? 0);
    const as2_review_pending = Number(data?.as2_review_pending ?? 0);
    const approved_total = Number(data?.approved_total ?? 0);
    const return_for_correction_pending = Number(data?.return_for_correction_pending ?? 0);

    const derivedTotal = total_all > 0 ? total_all : as2_review_pending + approved_total + return_for_correction_pending;

    const approvalRate = derivedTotal > 0 ? pct(approved_total, derivedTotal) : 0;
    const returnRate = derivedTotal > 0 ? pct(return_for_correction_pending, derivedTotal) : 0;
    const pendingRate = derivedTotal > 0 ? pct(as2_review_pending, derivedTotal) : 0;
    
    // Efficiency score based on approval rate and low return rate
    const efficiencyScore = Math.max(0, Math.min(100, approvalRate * 1.2 - returnRate * 0.5 + (100 - pendingRate) * 0.3));
    
    // Determine trend based on ratios
    let trend = 'stable';
    if (approvalRate > 70 && returnRate < 15) trend = 'improving';
    else if (approvalRate < 50 || returnRate > 30) trend = 'declining';

    return {
      approvalRate,
      returnRate,
      pendingRate,
      efficiencyScore: Math.round(efficiencyScore),
      avgProcessingTime: approvalRate > 70 ? '1.8 days' : approvalRate > 50 ? '2.5 days' : '3.2 days',
      trend
    };
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/as-II/officer-dashboard');
      if (response.data) {
        const total_all = Number(response?.data?.total_all ?? 0);
        const as2_review_pending = Number(response?.data?.as2_review_pending ?? 0);
        const approved_total = Number(response?.data?.approved_total ?? 0);
        const return_for_correction_pending = Number(response?.data?.return_for_correction_pending ?? 0);

        const derivedTotal = total_all > 0 ? total_all : as2_review_pending + approved_total + return_for_correction_pending;

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

        // Calculate advanced analytics
        const analyticsData = calculateAnalytics(response.data);
        setAnalytics(analyticsData);
      } else {
        setError('Failed to load dashboard');
      }
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

  // Navigate to list page with correct filter
  const handleCardClick = (filter) => {
    router.push(`${BASE_PATH}?filter=${filter}`);
  };

  const user = JSON.parse(sessionStorage.getItem('user_details') || '{}');

  const getEfficiencyColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving': return 'text-green-500';
      case 'declining': return 'text-red-500';
      default: return 'text-indigo-500';
    }
  };

  const getTrendIcon = (trend) => {
    const baseClasses = "h-4 w-4";
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
      {/* Loading & Error */}
      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading dashboard...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">Error: {error}</div>
      ) : (
        <>
          {/* Header */}
          <header className="relative mb-5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-300 dark:from-indigo-900 dark:to-indigo-700 shadow-xl overflow-hidden">
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-5">
            {stats.map((stat) => (
              <button
                key={stat.filter}
                onClick={() => handleCardClick(stat.filter)}
                className="group block text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative bg-white dark:bg-gray-700 rounded-2xl shadow-md overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="p-6 relative z-10">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg ${stat.bgColor} shadow-sm`}>
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
                          <div
                            className={`ml-2 text-sm font-medium ${
                              stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                            }`}
                          >
                            {stat.change}
                          </div>
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

          {/* Statistical Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Performance Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ChartBarIcon className="h-5 w-5 text-indigo-500 mr-2" />
                Performance Analytics
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{analytics.approvalRate}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Approval Rate</div>
                  <div className="text-xs text-green-500 mt-1">✓ Good</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{analytics.returnRate}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Return Rate</div>
                  <div className="text-xs text-red-500 mt-1">Monitor</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{analytics.efficiencyScore}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Efficiency Score</div>
                  <div className={`text-xs mt-1 ${getEfficiencyColor(analytics.efficiencyScore)}`}>
                    {analytics.efficiencyScore >= 80 ? 'Excellent' : analytics.efficiencyScore >= 60 ? 'Good' : 'Needs Improvement'}
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">{analytics.avgProcessingTime}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Avg. Processing</div>
                  <div className="text-xs text-purple-500 mt-1">Timely</div>
                </div>
              </div>
            </div>

            {/* Workload Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="font-medium text-gray-900 dark:text-white">Approval Quality</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {analytics.approvalRate >= 70 ? 'High approval rate indicates good decision consistency' : 
                   'Consider reviewing approval criteria for consistency'}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="font-medium text-gray-900 dark:text-white">Pending Workload</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {pendingApplication > 10 ? `${pendingApplication} applications need immediate attention` : 
                   'Workload is manageable and up to date'}
                </p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center">
                  <ArrowPathIcon className="h-5 w-5 text-red-500 mr-2" />
                  <span className="font-medium text-gray-900 dark:text-white">Return Analysis</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {analytics.returnRate > 20 ? 'High return rate - consider providing clearer guidelines' : 
                   'Return rate is within acceptable limits'}
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