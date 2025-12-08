import React, { useState } from 'react';
import { ClockIcon, MapPinIcon, CurrencyDollarIcon, BuildingOfficeIcon, SparklesIcon, LightBulbIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import PersonalizedJobService, { PersonalizedMatch, JobInsight } from '../../services/personalizedJobService';
import { getScoreColor, getScoreIcon } from '../../utils/jobMatchingUtils';

interface PersonalizedJobCardProps {
  job: any;
  user: any;
  onApply?: (job: any) => void;
  onSave?: (job: any) => void;
  showInsights?: boolean;
}

const PersonalizedJobCard: React.FC<PersonalizedJobCardProps> = ({
  job,
  user,
  onApply,
  onSave,
  showInsights = true
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const personalizedMatch: PersonalizedMatch = PersonalizedJobService.analyzePersonalizedMatch(job, user);
  const scoreColor = getScoreColor(personalizedMatch.personalizedScore);
  const scoreIcon = getScoreIcon(personalizedMatch.personalizedScore);

  const formatSalary = (salary?: number) => {
    if (!salary) return '';
    return `$${salary.toLocaleString()}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInsightIcon = (type: JobInsight['type']) => {
    switch (type) {
      case 'strength': return <SparklesIcon className="w-4 h-4 text-green-600" />;
      case 'opportunity': return <LightBulbIcon className="w-4 h-4 text-blue-600" />;
      case 'warning': return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />;
      case 'gap': return <ExclamationTriangleIcon className="w-4 h-4 text-orange-600" />;
      default: return <LightBulbIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getInsightColor = (type: JobInsight['type']) => {
    switch (type) {
      case 'strength': return 'bg-green-50 border-green-200 text-green-800';
      case 'opportunity': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'gap': return 'bg-orange-50 border-orange-200 text-orange-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      {/* Header with Personalized Score */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{job.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <BuildingOfficeIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{job.company}</span>
              {job.status && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  job.status === 'applied' ? 'bg-green-100 text-green-800' :
                  job.status === 'saved' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {job.status}
                </span>
              )}
            </div>
          </div>
          
          {/* Personalized Match Score */}
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full border ${scoreColor}`}>
            <span className="text-sm font-bold">{personalizedMatch.personalizedScore}%</span>
            <span className="text-xs">{scoreIcon}</span>
          </div>
        </div>

        {/* Job Meta Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          {job.location && (
            <div className="flex items-center gap-1">
              <MapPinIcon className="w-4 h-4" />
              <span>{job.location}</span>
            </div>
          )}
          {(job.salaryMin || job.salaryMax) && (
            <div className="flex items-center gap-1">
              <CurrencyDollarIcon className="w-4 h-4" />
              <span>
                {job.salaryMin && formatSalary(job.salaryMin)}
                {job.salaryMin && job.salaryMax && ' - '}
                {job.salaryMax && formatSalary(job.salaryMax)}
              </span>
            </div>
          )}
          {job.postedDate && (
            <div className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4" />
              <span>{formatDate(job.postedDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Match Analysis Preview */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">Match Analysis</h4>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        </div>

        {/* Preference Match Bars */}
        <div className="space-y-2">
          {Object.entries(personalizedMatch.preferenceMatches).map(([key, value]) => {
            if (value === 0) return null;
            const labels = {
              keywords: 'Keywords',
              location: 'Location',
              salary: 'Salary',
              jobType: 'Job Type',
              industry: 'Industry',
              skills: 'Skills',
              experience: 'Experience'
            };
            
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-20">{labels[key as keyof typeof labels]}:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      value >= 70 ? 'bg-green-500' :
                      value >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-8">{Math.round(value)}%</span>
              </div>
            );
          })}
        </div>

        {/* Top Match Reasons */}
        {personalizedMatch.reasons.length > 0 && (
          <div className="mt-3">
            <div className="text-xs font-medium text-gray-700 mb-1">Key Matches:</div>
            <div className="flex flex-wrap gap-1">
              {personalizedMatch.reasons.slice(0, 3).map((reason, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 text-xs rounded-full border ${
                    reason.matched 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {reason.matched ? '✓' : '✗'} {reason.text}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Analysis (Collapsible) */}
      {showDetails && (
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Detailed Analysis</h4>
          
          {/* All Match Reasons */}
          {personalizedMatch.reasons.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-gray-700 mb-2">All Match Factors:</div>
              <div className="space-y-1">
                {personalizedMatch.reasons.map((reason, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full ${
                      reason.matched ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className={`${reason.matched ? 'text-green-700' : 'text-red-700'}`}>
                      {reason.text}
                    </span>
                    <span className="text-gray-500">({reason.importance})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvement Suggestions */}
          {personalizedMatch.improvementSuggestions.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-gray-700 mb-2">Improvement Suggestions:</div>
              <div className="space-y-1">
                {personalizedMatch.improvementSuggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    <LightBulbIcon className="w-3 h-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          {personalizedMatch.recommendedActions.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Recommended Actions:</div>
              <div className="space-y-1">
                {personalizedMatch.recommendedActions.map((action, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    <SparklesIcon className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Job Description Preview */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">Description</h4>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {expanded ? 'Show Less' : 'Read More'}
          </button>
        </div>
        <p className={`text-sm text-gray-600 ${expanded ? '' : 'line-clamp-3'}`}>
          {job.description || 'No description available.'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <div className="flex gap-2">
          <button
            onClick={() => onApply?.(job)}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Now
          </button>
          <button
            onClick={() => onSave?.(job)}
            className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedJobCard;
