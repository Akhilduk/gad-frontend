'use client';

import { useState, useEffect, useMemo } from 'react';
import { EyeIcon } from '@heroicons/react/16/solid';
import axiosInstance from '@/utils/apiClient';
import { useRouter } from 'next/navigation';
import {
  SearchBar,
  ExportButtons,
  PaginationControls,
  exportToCSV,
  exportToPDF,
  exportToExcel,
} from '@/app/components/dataTableControls';

const BASE_PATH = '/official/dashboard/officer-verification-list';

export default function OfficerVerificationLayout() {
  const router = useRouter();

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('total');

  const itemsPerPage = 50;

  // Sync filter from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlFilter = params.get('filter');
    const validFilters = ['total', 'pending', 'approved', 'returned'];
    const newFilter = validFilters.includes(urlFilter) ? urlFilter : 'total';

    setFilter(newFilter);
    setCurrentPage(1);

    const expected = `${BASE_PATH}?filter=${newFilter}`;
    if (window.location.pathname + window.location.search !== expected) {
      router.replace(expected, { scroll: false });
    }
  }, [router]);

  const updateFilter = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
    router.replace(`${BASE_PATH}?filter=${newFilter}`, { scroll: false });
  };

  // Fetch data
  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get('/as-II/all-submitted-profiles');
        if (response.data.success) {
          const profileData = JSON.parse(response.data.data.pending_profiles);
          if (Array.isArray(profileData)) {
            setProfiles(profileData);
          } else {
            throw new Error('Invalid data');
          }
        } else {
          setError(response.data.detail || 'Failed to fetch');
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [filter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const stageMap = {
    ACT02: 'Pending for Approval',
    ACT03: 'Returned for Correction',
    ACT04: 'Approved',
  };

  const titleMap = {
    total: 'All Profiles',
    pending: 'Pending Profile List',
    approved: 'Approved Profiles',
    returned: 'Returned for Correction Profiles',
  };

  const title = titleMap[filter] || 'Profile List';

  const handleViewProfile = (id) => {
    sessionStorage.setItem('selected_profile_id', id);
    router.push('/official/preview-profile');
  };

  const filteredProfiles = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let filtered = profiles.filter((p) =>
      `${p.fullname ?? ''} ${p.pen_number ?? ''}`.toLowerCase().includes(q)
    );

    if (filter !== 'total') {
      const stage = { pending: 'ACT02', approved: 'ACT04', returned: 'ACT03' }[filter];
      if (stage) filtered = filtered.filter(p => p.stage_code === stage);
    }

    return filtered;
  }, [profiles, searchTerm, filter]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentProfiles = filteredProfiles.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);

  // Fixed export data preparation
  const exportData = useMemo(() => {
    if (filteredProfiles.length === 0) return [];
    
    return filteredProfiles.map((p, i) => ({
      'Sl. No': i + 1,
      'Name': p.fullname || 'N/A',
      'PEN': p.pen_number || 'N/A',
      'Status': stageMap[p.stage_code] || 'N/A',
    }));
  }, [filteredProfiles]);

  // Fixed export handlers
  // In your OfficerVerificationLayout component, update the export handlers:

const handleExportCSV = () => {
  if (exportData.length === 0) {
    alert('No data to export');
    return;
  }
  exportToCSV(`${filter}-profiles.csv`, exportData);
};

const handleExportPDF = () => {
  if (exportData.length === 0) {
    alert('No data to export');
    return;
  }
  exportToPDF(title, exportData, `${filter}-profiles.pdf`);
};

const handleExportExcel = () => {
  if (exportData.length === 0) {
    alert('No data to export');
    return;
  }
  exportToExcel(title, exportData, `${filter}-profiles.xlsx`);
};

  const hasData = filteredProfiles.length > 0;
  const showTable = !loading && !error && hasData;

  return (
    <div className="p-4 max-w-full ">
      {/* Glassmorphic Card */}
      <div className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">
                {title} <span className="text-sm font-medium text-gray-600 dark:text-gray-400">({filteredProfiles.length})</span>
              </h3>

              {/* Tabs */}
              <div className="flex gap-1 mt-4 -mb-px flex-wrap">
                {Object.entries(titleMap).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => updateFilter(key)}
                    className={`relative px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all duration-200 ease-out
                      ${filter === key
                        ? 'text-white bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-md'
                        : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                      }`}
                  >
                    {label}
                    {filter === key && (
                      <span className="absolute inset-x-0 bottom-0 h-1 bg-indigo-400 rounded-t-full"></span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="mt-5">
                <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search by Name / PEN"
                  className="max-w-md"
                />
              </div>
            </div>

            {/* Export Buttons - Only show when there's data */}
            {hasData && (
              <ExportButtons
                onCSV={handleExportCSV}
                onPDF={handleExportPDF}
                onExcel={handleExportExcel}
              />
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-3 text-gray-600 dark:text-gray-400">Loading profiles...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-12 text-center">
            <p className="text-red-600 dark:text-red-400 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !hasData && (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No {filter} profiles found.</p>
          </div>
        )}

        {/* Table - Only show when there's data */}
        {showTable && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 text-left text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                    <th className="px-6 py-4">Sl. No</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">PEN</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {currentProfiles.map((profile, index) => (
                    <tr
                      key={profile.item_id}
                      className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {indexOfFirst + index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {profile.fullname ?? 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-indigo-600 dark:text-indigo-400 font-mono">
                        {profile.pen_number ?? 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold
                            ${profile.stage_code === 'ACT02' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              profile.stage_code === 'ACT03' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                              profile.stage_code === 'ACT04' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                        >
                          {stageMap[profile.stage_code] ?? 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewProfile(profile.item_id)}
                          className="inline-flex items-center justify-center p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md transform hover:scale-105 transition-all duration-200"
                          title="View Profile"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPrevious={() => setCurrentPage(p => Math.max(p - 1, 1))}
                onNext={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}