import { useState, useEffect, useRef, useMemo } from 'react';
import { useJobs } from '../context/JobContext';
import { useUser } from '../context/UserContext';
import { useResumeIntelligence } from '../hooks/useResumeIntelligence';
import { analyzeJobMatch, getScoreColor, getScoreIcon } from '../utils/jobMatchingUtils';
import { SearchFilters, filterJobsBySearch, getSearchSuggestions } from '../utils/searchUtils';
import PersonalizedJobService from '../services/personalizedJobService';
import ResumeIntelligenceService from '../services/resumeIntelligenceService';
import MatchReasonsPopover from '../components/MatchReasonsPopover';
import PersonalizedJobCard from '../components/Jobs/PersonalizedJobCard';
import JobCardSkeleton from '../components/JobCardSkeleton';
import EmptyState from '../components/EmptyState';
import AnalyticsWidget from '../components/AnalyticsWidget';
import JobClustering from '../components/JobClustering';
import AutoSuggestFilters from '../components/AutoSuggestFilters';

const JobsPage = () => {
  const { jobs, loading, error, updateJob } = useJobs();
  const { profile, preferences } = useUser();
  const { resumeSkills, resumeAnalysis, loading: resumeLoading, hasResume } = useResumeIntelligence();
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['all']);
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    searchBy: 'all'
  });
  const [sortBy, setSortBy] = useState<'date' | 'relevance' | 'title' | 'company' | 'personalized'>('personalized');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showClustering, setShowClustering] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showPersonalization, setShowPersonalization] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const jobsPerPage = 10;

  // Get user data for personalization
  const user = useMemo(() => ({ profile, preferences }), [profile, preferences]);

  // Calculate job matches with real resume intelligence
  const jobsWithAnalysis = useMemo(() => {
    if (!hasResume || !resumeSkills) {
      // Fall back to basic analysis if no resume
      return jobs.map(job => ({
        ...job,
        analysis: analyzeJobMatch(job)
      }));
    }
    
    return jobs.map(job => ({
      ...job,
      analysis: analyzeJobMatch(job, resumeSkills),
      resumeAnalysis: resumeAnalysis ? ResumeIntelligenceService.analyzeJobMatchWithResume(job, resumeAnalysis) : null,
      coverLetterHighlights: resumeAnalysis ? ResumeIntelligenceService.generateCoverLetterHighlights(job, resumeAnalysis) : []
    }));
  }, [jobs, hasResume, resumeSkills, resumeAnalysis]);

  // Multi-select status filtering with personalization
  const filteredJobs = useMemo(() => {
    let filtered = jobsWithAnalysis;

    // Apply personalized filtering if user data is available
    if (profile && preferences && showPersonalization) {
      filtered = PersonalizedJobService.filterJobsByPreferences(filtered, user);
    }

    // Status filtering (multi-select)
    if (!selectedStatuses.includes('all') && selectedStatuses.length > 0) {
      filtered = filtered.filter(job => selectedStatuses.includes(job.status));
    }

    // Company filtering
    if (companyFilter) {
      filtered = filtered.filter(job => 
        job.company.toLowerCase().includes(companyFilter.toLowerCase())
      );
    }

    // Search filtering
    filtered = filterJobsBySearch(filtered, searchFilters);

    // Sorting
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          const dateA = a.appliedDate?.getTime() || 0;
          const dateB = b.appliedDate?.getTime() || 0;
          comparison = dateA - dateB;
          break;
        case 'relevance':
          comparison = a.analysis.score - b.analysis.score;
          break;
        case 'personalized':
          const personalizedScoreA = (a as any).personalizedAnalysis?.personalizedScore || a.analysis.score;
          const personalizedScoreB = (b as any).personalizedAnalysis?.personalizedScore || b.analysis.score;
          comparison = personalizedScoreA - personalizedScoreB;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'company':
          comparison = a.company.localeCompare(b.company);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [jobsWithAnalysis, selectedStatuses, companyFilter, searchFilters, sortBy, sortOrder, profile, preferences, showPersonalization, user]);

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + jobsPerPage);

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[JOBS][DEBUG] Raw jobs count:', jobs.length);
    console.log('[JOBS][DEBUG] Filtered jobs count:', filteredJobs.length);
    console.log('[JOBS][DEBUG] Paginated jobs count:', paginatedJobs.length);
    console.log('[JOBS][DEBUG] Selected statuses:', selectedStatuses);
    console.log('[JOBS][DEBUG] Loading:', loading);
    console.log('[JOBS][DEBUG] Error:', error);
  }

  // Get unique companies for filter dropdown
  const uniqueCompanies = useMemo(() => 
    Array.from(new Set(jobs.map(job => job.company))).sort(),
    [jobs]
  );

  // Get search suggestions
  const searchSuggestions = useMemo(() => 
    getSearchSuggestions(jobs, searchFilters.query),
    [jobs, searchFilters.query]
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatuses, companyFilter, searchFilters, sortBy, sortOrder]);

  // Simulate loading state for better UX
  useEffect(() => {
    if (loading) {
      setIsLoading(true);
    } else {
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);


  const statusOptions = [
    { value: 'all', label: 'All', color: 'bg-gray-100 text-gray-700 border-gray-300' },
    { value: 'saved', label: 'Saved', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { value: 'applied', label: 'Applied', color: 'bg-green-100 text-green-700 border-green-300' },
    { value: 'interview', label: 'Interview', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: 'offer', label: 'Offer', color: 'bg-purple-100 text-purple-700 border-purple-300' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-300' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'saved': return '🟡';
      case 'applied': return '🟢';
      case 'interview': return '🔵';
      case 'offer': return '🟣';
      case 'rejected': return '🔴';
      default: return '⚪';
    }
  };

  // Handle filter changes for compact filters
  const handleFilterChange = (type: string, value: string) => {
    if (type === 'status') {
      setSelectedStatuses(value === 'all' ? ['all'] : [value]);
    } else if (type === 'company') {
      setCompanyFilter(value);
    }
  };

  // Handle multi-select status filters
  const handleStatusToggle = (status: string) => {
    if (status === 'all') {
      setSelectedStatuses(['all']);
    } else {
      const newSelected = selectedStatuses.includes(status)
        ? selectedStatuses.filter(s => s !== status)
        : [...selectedStatuses.filter(s => s !== 'all'), status];
      
      setSelectedStatuses(newSelected.length > 0 ? newSelected : ['all']);
    }
  };

  // Handle save/unsave toggle
  const handleSaveToggle = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'saved' ? 'applied' : 'saved';
    await updateJob(jobId, { status: newStatus });
  };

  // Handle card expansion
  const toggleCardExpansion = (jobId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedStatuses(['all']);
    setCompanyFilter('');
    setSearchFilters({ query: '', searchBy: 'all' });
  };

  // Clear search only
  const clearSearch = () => {
    setSearchFilters({ query: '', searchBy: 'all' });
  };

  // Handle auto-suggest filter application
  const handleSuggestionApply = (type: string, value: string) => {
    switch (type) {
      case 'status':
        if (value === 'recent' || value === 'high-priority') {
          // Handle special cases
          if (value === 'high-priority') {
            setSelectedStatuses(['interview', 'offer']);
          }
        } else {
          setSelectedStatuses([value]);
        }
        break;
      case 'company':
        setCompanyFilter(value);
        break;
      case 'location':
        setSearchFilters({ ...searchFilters, query: value, searchBy: 'location' });
        break;
      case 'keyword':
        setSearchFilters({ ...searchFilters, query: value, searchBy: 'keywords' });
        break;
    }
    setShowSuggestions(false); // Hide suggestions after applying
  };

  if (loading || isLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">Error: {error}</div>
        </div>
      </div>
    );
  }

  // Determine empty state type
  const getEmptyStateType = (): 'no-jobs' | 'no-filters' | 'no-search' => {
    if (jobs.length === 0) return 'no-jobs';
    if (searchFilters.query) return 'no-search';
    if (!selectedStatuses.includes('all') || companyFilter) return 'no-filters';
    return 'no-jobs';
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Enhanced Page Header */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Jobs Page</h1>
            <p className="text-gray-600 text-lg">Browse and manage your job applications</p>
            <p className="text-sm text-gray-500 mt-2">
              Showing {filteredJobs.length} of {jobs.length} jobs
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{filteredJobs.length}</div>
              <div className="text-xs text-gray-500">Total Jobs</div>
            </div>
          </div>
        </div>
        
        {/* Analytics Toggle */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm border ${
              showAnalytics 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
            }`}
          >
            {showAnalytics ? 'Hide' : 'Show'} Analytics 📊
          </button>
          
          <button
            onClick={() => setShowClustering(!showClustering)}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm border ${
              showClustering 
                ? 'bg-purple-600 text-white border-purple-600' 
                : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'
            }`}
          >
            {showClustering ? 'Hide' : 'Show'} Clustering 🎯
          </button>
          
          {jobs.length > 2 && (
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm border ${
                showSuggestions 
                  ? 'bg-indigo-600 text-white border-indigo-600' 
                  : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'
              }`}
            >
              {showSuggestions ? 'Hide' : 'Show'} Suggestions 💡
            </button>
          )}
        </div>
      </div>

      {/* Analytics Widget */}
      {showAnalytics && (
        <div className="mb-8">
          <AnalyticsWidget jobs={jobs} />
        </div>
      )}

      {/* Auto-Suggest Filters */}
      {showSuggestions && jobs.length > 2 && (
        <div className="mb-8">
          <AutoSuggestFilters 
            jobs={jobs} 
            onApplySuggestion={handleSuggestionApply}
          />
        </div>
      )}

      {/* Job Clustering */}
      {showClustering && (
        <div className="mb-8">
          <JobClustering jobs={jobsWithAnalysis} />
        </div>
      )}

      {/* Personalization Toggle */}
      {(profile || preferences) && (
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">Personalized Job Matching</h3>
                  <p className="text-sm text-blue-700">
                    Jobs are filtered and ranked based on your profile, skills, and preferences
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPersonalization}
                  onChange={(e) => setShowPersonalization(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-blue-900">
                  {showPersonalization ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Compact Filter Section */}
      <div className="bg-white border-b border-gray-200 mb-6 py-3">
        <div className="px-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <label htmlFor="job-search" className="sr-only">Search jobs</label>
                <input
                  id="job-search"
                  name="job-search"
                  type="text"
                  placeholder="Search jobs..."
                  value={searchFilters.query}
                  onChange={(e) => setSearchFilters({ ...searchFilters, query: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchFilters.query && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="flex-shrink-0">
              <select
                value={selectedStatuses.includes('all') ? 'all' : selectedStatuses[0]}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            {/* Company Filter */}
            <div className="flex-shrink-0">
              <select
                value={companyFilter}
                onChange={(e) => handleFilterChange('company', e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Companies</option>
                {uniqueCompanies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>
            
            {/* Sort Options */}
            <div className="flex-shrink-0">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-');
                  setSortBy(sort as 'date' | 'relevance' | 'title' | 'company' | 'personalized');
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="personalized-desc">Best Match First</option>
                <option value="date-desc">Latest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="relevance-desc">Relevance High-Low</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="company-asc">Company A-Z</option>
                <option value="company-desc">Company Z-A</option>
              </select>
            </div>
            
            {/* Clear Filters */}
            {(selectedStatuses.length > 0 && !selectedStatuses.includes('all')) || companyFilter || searchFilters.query ? (
              <button
                onClick={clearAllFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear All
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="space-y-4">
        {paginatedJobs.length === 0 ? (
          <EmptyState 
            type={getEmptyStateType()} 
            onClearFilters={clearAllFilters}
            onClearSearch={clearSearch}
          />
        ) : (
          <>
            <div className="grid gap-4">
              {paginatedJobs.map((job) => {
                const isExpanded = expandedCards.has(job.id);
                const analysis = job.analysis;
                
                // Use PersonalizedJobCard if user data is available
                if (profile && preferences && showPersonalization) {
                  return (
                    <PersonalizedJobCard
                      key={job.id}
                      job={job}
                      user={user}
                      onApply={(job) => console.log('Apply to job:', job)}
                      onSave={(job) => handleSaveToggle(job.id, job.status)}
                      showInsights={true}
                    />
                  );
                }
                
                // Fallback to original job card
                return (
                  <div 
                    key={job.id} 
                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300 hover:-translate-y-1 group"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-3">
                            {/* Company Logo/Avatar */}
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mr-4 shadow-sm">
                              {job.company.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-xl text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                                {job.title}
                              </h3>
                              <p className="text-gray-600 font-medium">{job.company}</p>
                            </div>
                          </div>
                          
                          {/* AI Relevance Score Badge */}
                          <div className="mb-3">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getScoreColor(analysis.score)}`}>
                                <span className="mr-1">{getScoreIcon(analysis.score)}</span>
                                {analysis.score}% Match
                              </span>
                              <MatchReasonsPopover analysis={analysis} />
                            </div>
                          </div>
                          
                          {/* Job Details */}
                          <div className="space-y-2 mb-4">
                            {job.location && (
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="mr-2">📍</span>
                                {job.location}
                              </div>
                            )}
                            {job.description && (
                              <div className="text-sm text-gray-600">
                                <div className={`transition-all duration-300 ${
                                  isExpanded ? '' : 'line-clamp-2 overflow-hidden'
                                }`}>
                                  {job.description}
                                </div>
                                {job.description.length > 150 && (
                                  <button
                                    onClick={() => toggleCardExpansion(job.id)}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-1"
                                  >
                                    {isExpanded ? 'Show Less' : 'Show More'}
                                  </button>
                                )}
                              </div>
                            )}
                            {job.appliedDate && (
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="mr-2">📅</span>
                                Applied: {job.appliedDate.toLocaleDateString()}
                              </div>
                            )}
                          </div>

                          {/* Action Links */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {job.jobUrl && (
                                <a
                                  href={job.jobUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center"
                                >
                                  View Job →
                                </a>
                              )}
                            </div>
                            
                            {/* Save/Unsave Toggle */}
                            <button
                              onClick={() => handleSaveToggle(job.id, job.status)}
                              className={`p-2 rounded-lg transition-colors duration-200 ${
                                job.status === 'saved'
                                  ? 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50'
                                  : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                              }`}
                              title={job.status === 'saved' ? 'Unsave job' : 'Save job'}
                            >
                              <svg className="w-5 h-5" fill={job.status === 'saved' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className="ml-4">
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${
                            job.status === 'applied' ? 'bg-green-100 text-green-800 border-green-200' :
                            job.status === 'interview' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            job.status === 'offer' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                            job.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                            job.status === 'saved' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            <span className="mr-1">{getStatusIcon(job.status)}</span>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 py-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    const isCurrentPage = page === currentPage;
                    const isNearCurrent = Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages;
                    
                    if (!isNearCurrent && index > 0 && index < totalPages - 1) {
                      if (index === currentPage - 3 || index === currentPage + 3) {
                        return (
                          <span key={page} className="px-3 py-2 text-sm text-gray-500">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                          isCurrentPage
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default JobsPage;
