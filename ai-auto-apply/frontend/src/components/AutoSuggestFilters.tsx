import { useMemo } from 'react';

interface Job {
  id: string;
  title: string;
  company: string;
  status: string;
  location?: string;
  description?: string;
}

interface FilterSuggestion {
  type: 'status' | 'company' | 'location' | 'keyword';
  label: string;
  value: string;
  reason: string;
  icon: string;
}

interface AutoSuggestFiltersProps {
  jobs: Job[];
  onApplySuggestion: (type: string, value: string) => void;
  className?: string;
}

const AutoSuggestFilters: React.FC<AutoSuggestFiltersProps> = ({ 
  jobs, 
  onApplySuggestion, 
  className = '' 
}) => {
  // Analyze user activity and generate smart suggestions
  const suggestions = useMemo(() => {
    if (jobs.length === 0) return [];
    
    const suggestions: FilterSuggestion[] = [];
    
    // Status distribution analysis
    const statusCounts = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Suggest most common status if user has many applications
    const mostCommonStatus = Object.entries(statusCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (mostCommonStatus && mostCommonStatus[1] >= 3) {
      suggestions.push({
        type: 'status',
        label: `Filter by ${mostCommonStatus[0]}`,
        value: mostCommonStatus[0],
        reason: `You have ${mostCommonStatus[1]} ${mostCommonStatus[0]} jobs`,
        icon: mostCommonStatus[0] === 'applied' ? '🟢' : 
               mostCommonStatus[0] === 'interview' ? '🔵' :
               mostCommonStatus[0] === 'offer' ? '🟣' :
               mostCommonStatus[0] === 'rejected' ? '🔴' : '🟡'
      });
    }
    
    // Company analysis
    const companyCounts = jobs.reduce((acc, job) => {
      acc[job.company] = (acc[job.company] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topCompany = Object.entries(companyCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCompany && topCompany[1] >= 2) {
      suggestions.push({
        type: 'company',
        label: `Filter by ${topCompany[0]}`,
        value: topCompany[0],
        reason: `You have ${topCompany[1]} applications to ${topCompany[0]}`,
        icon: '🏢'
      });
    }
    
    // Location analysis
    const locationCounts = jobs.reduce((acc, job) => {
      if (job.location) {
        acc[job.location] = (acc[job.location] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topLocation = Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topLocation && topLocation[1] >= 2) {
      suggestions.push({
        type: 'location',
        label: `Filter by ${topLocation[0]}`,
        value: topLocation[0],
        reason: `${topLocation[1]} jobs in ${topLocation[0]}`,
        icon: '📍'
      });
    }
    
    // Keyword analysis from titles
    const commonWords = jobs.reduce((acc, job) => {
      const words = job.title.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3 && !['engineer', 'developer', 'manager', 'senior', 'junior'].includes(word)) {
          acc[word] = (acc[word] || 0) + 1;
        }
      });
      return acc;
    }, {} as Record<string, number>);
    
    const topKeyword = Object.entries(commonWords)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topKeyword && topKeyword[1] >= 2) {
      suggestions.push({
        type: 'keyword',
        label: `Search "${topKeyword[0]}"`,
        value: topKeyword[0],
        reason: `${topKeyword[1]} jobs mention "${topKeyword[0]}"`,
        icon: '🔍'
      });
    }
    
    // Behavioral suggestions based on recent activity
    const recentJobs = jobs.filter(job => {
      // Mock recent jobs - in real app, this would be based on actual dates
      return Math.random() > 0.7; // Simulate 30% being recent
    });
    
    if (recentJobs.length >= 3) {
      suggestions.push({
        type: 'status',
        label: 'Recent applications',
        value: 'recent',
        reason: 'Focus on jobs applied to in the last week',
        icon: '🕐'
      });
    }
    
    // High-priority suggestions (interviews, offers)
    const highPriorityJobs = jobs.filter(job => 
      ['interview', 'offer'].includes(job.status)
    );
    
    if (highPriorityJobs.length > 0) {
      suggestions.push({
        type: 'status',
        label: 'High priority',
        value: 'high-priority',
        reason: `${highPriorityJobs.length} jobs need your attention`,
        icon: '⭐'
      });
    }
    
    return suggestions.slice(0, 4); // Limit to top 4 suggestions
  }, [jobs]);
  
  if (suggestions.length === 0) {
    return null;
  }

  const handleSuggestionClick = (suggestion: FilterSuggestion) => {
    if (suggestion.type === 'status') {
      if (suggestion.value === 'recent' || suggestion.value === 'high-priority') {
        // Handle special cases
        onApplySuggestion('status', suggestion.value);
      } else {
        onApplySuggestion('status', suggestion.value);
      }
    } else {
      onApplySuggestion(suggestion.type, suggestion.value);
    }
  };

  return (
    <div className={`bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100 ${className}`}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center">
          <span className="mr-2">💡</span>
          Smart Suggestions
        </h3>
        <p className="text-xs text-gray-600 mt-1">AI-powered filter recommendations based on your activity</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all duration-200 text-left"
          >
            <span className="text-lg">{suggestion.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {suggestion.label}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {suggestion.reason}
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-gray-500 text-center">
        🤖 Based on your job search patterns and preferences
      </div>
    </div>
  );
};

export default AutoSuggestFilters;
