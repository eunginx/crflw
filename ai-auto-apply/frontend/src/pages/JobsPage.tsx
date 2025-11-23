import { useState, useEffect, useRef, useMemo } from 'react';
import { useJobs } from '../context/JobContext';
import { analyzeJobMatch, getScoreColor, getScoreIcon } from '../utils/jobMatchingUtils';
import { SearchFilters, filterJobsBySearch, getSearchSuggestions } from '../utils/searchUtils';
import MatchReasonsPopover from '../components/MatchReasonsPopover';
import JobCardSkeleton from '../components/JobCardSkeleton';
import EmptyState from '../components/EmptyState';
import AnalyticsWidget from '../components/AnalyticsWidget';
import JobClustering from '../components/JobClustering';
import AutoSuggestFilters from '../components/AutoSuggestFilters';

const JobsPage = () => {
  const { jobs, loading, error, updateJob } = useJobs();
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['all']);
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    searchBy: 'all'
  });
  const [sortBy, setSortBy] = useState<'date' | 'relevance' | 'title' | 'company'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showClustering, setShowClustering] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const jobsPerPage = 10;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle scroll detection for sticky filter bar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate job matches with AI analysis
  const jobsWithAnalysis = useMemo(() => {
    return jobs.map(job => ({
      ...job,
      analysis: analyzeJobMatch(job)
    }));
  }, [jobs]);

  // Multi-select status filtering
  const filteredJobs = useMemo(() => {
    let filtered = jobsWithAnalysis;

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
  }, [jobsWithAnalysis, selectedStatuses, companyFilter, searchFilters, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + jobsPerPage);

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

  // Reset page when filters change and scroll to top
  useEffect(() => {
    setCurrentPage(1);
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
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

      {/* Sticky Filter Section with Scroll Effects */}
      <div 
        ref={scrollRef}
        className={`sticky top-[70px] bg-white z-30 transition-all duration-300 mb-6 rounded-2xl ${
          isScrolled ? 'shadow-md' : 'shadow-sm'
        }`}
      >
        <div className={`transition-all duration-300 p-4 ${
          isScrolled ? 'py-3' : 'py-6'
        }`}>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Filter Jobs</h3>
          </div>
          
          {/* Search Bar */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by title, company, location, or keywords..."
                    value={searchFilters.query}
                    onChange={(e) => setSearchFilters({ ...searchFilters, query: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchFilters.query && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Search Suggestions */}
                {searchSuggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setSearchFilters({ ...searchFilters, query: suggestion })}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Search By Dropdown */}
              <select
                value={searchFilters.searchBy}
                onChange={(e) => setSearchFilters({ ...searchFilters, searchBy: e.target.value as any })}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Fields</option>
                <option value="title">Title</option>
                <option value="company">Company</option>
                <option value="location">Location</option>
                <option value="keywords">Keywords</option>
              </select>
            </div>
          </div>
          
          {/* Multi-Select Status Filter Chips */}
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-700 mb-3">Status Filters (Multi-select)</div>
            <div className="flex flex-wrap gap-3">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusToggle(option.value)}
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200 hover:shadow-md cursor-pointer ${
                    selectedStatuses.includes(option.value)
                      ? `${option.color} shadow-md`
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <span className="mr-2 text-sm">{getStatusIcon(option.value)}</span>
                  {option.label}
                  {selectedStatuses.includes(option.value) && (
                    <span className="ml-1 text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Filters and Sorting */}
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Company
                </label>
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Companies</option>
                  {uniqueCompanies.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>
              
              <div className="min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="date">Date</option>
                  <option value="relevance">Relevance Score</option>
                  <option value="title">Title</option>
                  <option value="company">Company</option>
                </select>
              </div>
              
              <div className="min-w-[120px]">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={clearAllFilters}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium text-sm"
              >
                Clear All Filters
              </button>
            </div>
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
