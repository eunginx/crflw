import React from 'react';
import {
  ArrowTrendingUpIcon,
  ClockIcon,
  DocumentTextIcon,
  TagIcon
} from '@heroicons/react/24/outline';

interface UserAnalyticsCardProps {
  processedResume: any;
  unifiedResult: any;
}

const UserAnalyticsCard: React.FC<UserAnalyticsCardProps> = ({ processedResume, unifiedResult }) => {
  const getLastProcessedTime = () => {
    if (processedResume?.processedAt) {
      const processedDate = new Date(processedResume.processedAt);
      const now = new Date();
      const diffMs = now.getTime() - processedDate.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours} hours ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    }
    return 'Never';
  };

  const getResumeScore = () => {
    if (!unifiedResult) return 0;
    
    let score = 0;
    
    // Text content (30 points)
    if (unifiedResult.text && unifiedResult.text.length > 500) {
      score += 30;
    } else if (unifiedResult.text && unifiedResult.text.length > 200) {
      score += 15;
    }
    
    // Extracted info (40 points)
    if (unifiedResult.extractedInfo) {
      if (unifiedResult.extractedInfo.name) score += 10;
      if (unifiedResult.extractedInfo.email) score += 10;
      if (unifiedResult.extractedInfo.phone) score += 10;
      if (unifiedResult.extractedInfo.skills && unifiedResult.extractedInfo.skills.length > 0) score += 10;
    }
    
    // Metadata (20 points)
    if (unifiedResult.metadata) {
      score += 20;
    }
    
    // Stats (10 points)
    if (unifiedResult.stats) {
      score += 10;
    }
    
    return Math.min(score, 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const resumeScore = getResumeScore();
  const lastProcessed = getLastProcessedTime();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center space-x-2 mb-4">
        <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Your Analytics</h2>
      </div>
      
      {/* Compact Chips View */}
      <div className="flex flex-wrap gap-2">
        {/* Resume Score Chip */}
        <div className={`px-3 py-2 rounded-lg border ${getScoreColor(resumeScore)} bg-opacity-10 border-current`}>
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium">Score</span>
            <span className="text-xs font-bold">{resumeScore}/100</span>
          </div>
        </div>

        {/* Word Count Chip */}
        {unifiedResult?.stats && (
          <div className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-1">
              <DocumentTextIcon className="w-3 h-3 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">
                {unifiedResult.stats.wordCount?.toLocaleString() || 0} words
              </span>
            </div>
          </div>
        )}

        {/* Skills Count Chip */}
        {unifiedResult?.extractedInfo?.skills && (
          <div className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-1">
              <TagIcon className="w-3 h-3 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">
                {unifiedResult.extractedInfo.skills.length} skills
              </span>
            </div>
          </div>
        )}

        {/* Last Processed Chip */}
        <div className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-1">
            <ClockIcon className="w-3 h-3 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">{lastProcessed}</span>
          </div>
        </div>

        {/* Applications Chip (Placeholder) */}
        <div className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-1">
            <TagIcon className="w-3 h-3 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">0 apps</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAnalyticsCard;
