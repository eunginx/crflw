import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  DocumentTextIcon,
  EyeIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

// Types for auto-apply history
interface AutoApplyEntry {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  status: 'pending' | 'applied' | 'successful' | 'failed' | 'blocked';
  appliedAt: string;
  completedAt?: string;
  matchScore: number;
  personalizedScore: number;
  resumeUsed: string;
  coverLetterGenerated: boolean;
  applicationMethod: 'automatic' | 'manual' | 'dry-run';
  blockedReason?: string;
  errorMessage?: string;
  applicationId?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  notes?: string;
}

interface AutoApplyStats {
  totalApplications: number;
  successfulApplications: number;
  failedApplications: number;
  pendingApplications: number;
  blockedApplications: number;
  averageMatchScore: number;
  averagePersonalizedScore: number;
  totalCoverLetters: number;
  applicationsThisWeek: number;
  applicationsThisMonth: number;
}

const AutoApplyHistoryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { profile, preferences } = useUser();
  const [entries, setEntries] = useState<AutoApplyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('month');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const mockEntries: AutoApplyEntry[] = [
      {
        id: '1',
        jobId: 'job-1',
        jobTitle: 'Senior Frontend Developer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        status: 'successful',
        appliedAt: '2024-01-15T10:30:00Z',
        completedAt: '2024-01-15T10:35:00Z',
        matchScore: 85,
        personalizedScore: 92,
        resumeUsed: 'resume_v2.pdf',
        coverLetterGenerated: true,
        applicationMethod: 'automatic',
        applicationId: 'app-123',
        followUpRequired: true,
        followUpDate: '2024-01-22T10:00:00Z',
        notes: 'Strong match for React skills. Follow up recommended.'
      },
      {
        id: '2',
        jobId: 'job-2',
        jobTitle: 'Full Stack Engineer',
        company: 'StartupXYZ',
        location: 'Remote',
        status: 'failed',
        appliedAt: '2024-01-14T14:20:00Z',
        completedAt: '2024-01-14T14:25:00Z',
        matchScore: 72,
        personalizedScore: 68,
        resumeUsed: 'resume_v2.pdf',
        coverLetterGenerated: true,
        applicationMethod: 'automatic',
        errorMessage: 'Application form validation failed',
        followUpRequired: false,
        notes: 'Form validation issues with required fields.'
      },
      {
        id: '3',
        jobId: 'job-3',
        jobTitle: 'React Developer',
        company: 'InnovateCo',
        location: 'New York, NY',
        status: 'blocked',
        appliedAt: '2024-01-13T09:15:00Z',
        matchScore: 45,
        personalizedScore: 38,
        resumeUsed: 'resume_v2.pdf',
        coverLetterGenerated: false,
        applicationMethod: 'dry-run',
        blockedReason: 'Below minimum match score threshold (50%)',
        followUpRequired: false,
        notes: 'Low match score - consider updating skills or preferences.'
      },
      {
        id: '4',
        jobId: 'job-4',
        jobTitle: 'JavaScript Developer',
        company: 'WebSolutions',
        location: 'Austin, TX',
        status: 'pending',
        appliedAt: '2024-01-16T16:45:00Z',
        matchScore: 78,
        personalizedScore: 82,
        resumeUsed: 'resume_v2.pdf',
        coverLetterGenerated: true,
        applicationMethod: 'automatic',
        followUpRequired: false,
        notes: 'Currently processing application...'
      }
    ];

    setTimeout(() => {
      setEntries(mockEntries);
      setLoading(false);
    }, 1000);
  }, [currentUser?.email]);

  // Calculate statistics
  const stats: AutoApplyStats = useMemo(() => {
    const total = entries.length;
    const successful = entries.filter(e => e.status === 'successful').length;
    const failed = entries.filter(e => e.status === 'failed').length;
    const pending = entries.filter(e => e.status === 'pending').length;
    const blocked = entries.filter(e => e.status === 'blocked').length;
    
    const avgMatch = total > 0 ? entries.reduce((sum, e) => sum + e.matchScore, 0) / total : 0;
    const avgPersonalized = total > 0 ? entries.reduce((sum, e) => sum + e.personalizedScore, 0) / total : 0;
    
    const totalCoverLetters = entries.filter(e => e.coverLetterGenerated).length;
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const applicationsThisWeek = entries.filter(e => new Date(e.appliedAt) > weekAgo).length;
    const applicationsThisMonth = entries.filter(e => new Date(e.appliedAt) > monthAgo).length;

    return {
      totalApplications: total,
      successfulApplications: successful,
      failedApplications: failed,
      pendingApplications: pending,
      blockedApplications: blocked,
      averageMatchScore: Math.round(avgMatch),
      averagePersonalizedScore: Math.round(avgPersonalized),
      totalCoverLetters,
      applicationsThisWeek,
      applicationsThisMonth
    };
  }, [entries]);

  // Filter entries based on selected filters
  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(entry => entry.status === selectedStatus);
    }

    // Date range filter
    const now = new Date();
    let cutoffDate: Date;
    switch (dateRange) {
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(0);
    }
    filtered = filtered.filter(entry => new Date(entry.appliedAt) > cutoffDate);

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.jobTitle.toLowerCase().includes(searchLower) ||
        entry.company.toLowerCase().includes(searchLower) ||
        entry.location.toLowerCase().includes(searchLower)
      );
    }

    return filtered.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  }, [entries, selectedStatus, dateRange, searchTerm]);

  const getStatusIcon = (status: AutoApplyEntry['status']) => {
    switch (status) {
      case 'successful': return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'failed': return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case 'blocked': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      case 'pending': return <ClockIcon className="w-5 h-5 text-blue-600" />;
      default: return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: AutoApplyEntry['status']) => {
    switch (status) {
      case 'successful': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'blocked': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Auto-Apply History</h1>
        <p className="text-gray-600">
          Track and manage all your automated job applications
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
            </div>
            <DocumentTextIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.totalApplications > 0 
                  ? Math.round((stats.successfulApplications / stats.totalApplications) * 100)
                  : 0}%
              </p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Match Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(stats.averageMatchScore)}`}>
                {stats.averageMatchScore}%
              </p>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">{stats.averageMatchScore}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-blue-600">{stats.applicationsThisMonth}</p>
            </div>
            <ClockIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row gap-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="successful">Successful</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="blocked">Blocked</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as 'week' | 'month' | 'all')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="all">All Time</option>
            </select>

            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedStatus !== 'all' || dateRange !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Start your first auto-apply to see your application history here.'}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(entry.status)}
                      <h3 className="text-lg font-semibold text-gray-900">{entry.jobTitle}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Company:</strong> {entry.company}</div>
                      <div><strong>Location:</strong> {entry.location}</div>
                      <div><strong>Applied:</strong> {formatDate(entry.appliedAt)}</div>
                      {entry.completedAt && (
                        <div><strong>Completed:</strong> {formatDate(entry.completedAt)}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Match Score</div>
                      <div className={`text-lg font-bold ${getScoreColor(entry.matchScore)}`}>
                        {entry.matchScore}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Personalized</div>
                      <div className={`text-lg font-bold ${getScoreColor(entry.personalizedScore)}`}>
                        {entry.personalizedScore}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <DocumentTextIcon className="w-4 h-4" />
                    {entry.resumeUsed}
                  </div>
                  {entry.coverLetterGenerated && (
                    <div className="flex items-center gap-1">
                      <span className="text-green-600">✓</span> Cover Letter Generated
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      entry.applicationMethod === 'automatic' ? 'bg-blue-100 text-blue-800' :
                      entry.applicationMethod === 'manual' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {entry.applicationMethod}
                    </span>
                  </div>
                </div>

                {/* Status-specific information */}
                {entry.blockedReason && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Blocked Reason:</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">{entry.blockedReason}</p>
                  </div>
                )}

                {entry.errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2">
                      <XCircleIcon className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Error:</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">{entry.errorMessage}</p>
                  </div>
                )}

                {entry.notes && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-800">Notes:</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{entry.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    {entry.applicationId && (
                      <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        <EyeIcon className="w-4 h-4" />
                        View Application
                      </button>
                    )}
                    {entry.followUpRequired && (
                      <div className="text-sm text-orange-600 flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        Follow up: {formatDate(entry.followUpDate!)}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setShowDetails(showDetails === entry.id ? null : entry.id)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    {showDetails === entry.id ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AutoApplyHistoryPage;
