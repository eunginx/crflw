import React, { useState, useMemo } from 'react';
import { useUser } from '../../context/UserContext';
import PersonalizedJobService from '../../services/personalizedJobService';
import { 
  ExclamationTriangleIcon, 
  LightBulbIcon, 
  ArrowTrendingUpIcon, 
  DocumentTextIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Types for blocked job analysis
interface BlockedJobReason {
  id: string;
  type: 'score' | 'location' | 'salary' | 'skills' | 'experience' | 'remote' | 'other';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedJobs: number;
  improvementActions: string[];
  estimatedImpact: string;
}

interface ImprovementSuggestion {
  id: string;
  category: 'profile' | 'preferences' | 'skills' | 'resume';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actions: string[];
  estimatedTimeToImplement: string;
  expectedIncrease: string;
  difficulty: 'easy' | 'moderate' | 'hard';
}

const BlockedJobReasons: React.FC = () => {
  const { profile, preferences } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Mock blocked jobs data - in real app, this would come from API
  const blockedJobs = useMemo(() => {
    if (!profile || !preferences) return [];

    return [
      {
        id: 'job-1',
        title: 'Senior Frontend Developer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        salaryMin: 120000,
        salaryMax: 180000,
        matchScore: 45,
        personalizedScore: 38,
        blockedReasons: ['score', 'skills', 'experience']
      },
      {
        id: 'job-2',
        title: 'Full Stack Engineer',
        company: 'StartupXYZ',
        location: 'New York, NY',
        salaryMin: 100000,
        salaryMax: 150000,
        matchScore: 52,
        personalizedScore: 48,
        blockedReasons: ['location', 'score']
      },
      {
        id: 'job-3',
        title: 'React Developer',
        company: 'InnovateCo',
        location: 'Remote',
        salaryMin: 80000,
        salaryMax: 120000,
        matchScore: 58,
        personalizedScore: 42,
        blockedReasons: ['score', 'skills']
      }
    ];
  }, [profile, preferences]);

  // Analyze blocked job reasons
  const blockedReasons: BlockedJobReason[] = useMemo(() => {
    if (blockedJobs.length === 0) return [];

    const reasons: BlockedJobReason[] = [];

    // Score threshold issues
    const lowScoreJobs = blockedJobs.filter(job => 
      job.personalizedScore < 50 || job.matchScore < 60
    );
    if (lowScoreJobs.length > 0) {
      reasons.push({
        id: 'score',
        type: 'score',
        severity: 'high',
        title: 'Low Match Scores',
        description: 'Jobs are being blocked due to low match or personalized scores below thresholds',
        affectedJobs: lowScoreJobs.length,
        improvementActions: [
          'Update skills and experience in profile',
          'Adjust job preferences for better alignment',
          'Improve resume content and keywords'
        ],
        estimatedImpact: 'Could unlock 60-80% more applications'
      });
    }

    // Location mismatches
    const locationIssues = blockedJobs.filter(job => 
      job.blockedReasons.includes('location')
    );
    if (locationIssues.length > 0) {
      reasons.push({
        id: 'location',
        type: 'location',
        severity: 'medium',
        title: 'Location Preferences',
        description: 'Jobs are blocked due to location preference restrictions',
        affectedJobs: locationIssues.length,
        improvementActions: [
          'Add more locations to preferences',
          'Consider remote work options',
          'Expand geographic radius'
        ],
        estimatedImpact: 'Could unlock 30-50% more applications'
      });
    }

    // Skills gaps
    const skillsIssues = blockedJobs.filter(job => 
      job.blockedReasons.includes('skills')
    );
    if (skillsIssues.length > 0) {
      reasons.push({
        id: 'skills',
        type: 'skills',
        severity: 'high',
        title: 'Skills Mismatch',
        description: 'Missing key skills required for target positions',
        affectedJobs: skillsIssues.length,
        improvementActions: [
          'Acquire in-demand technical skills',
          'Update skills section in profile',
          'Highlight transferable skills'
        ],
        estimatedImpact: 'Could unlock 40-60% more applications'
      });
    }

    // Experience level mismatches
    const experienceIssues = blockedJobs.filter(job => 
      job.blockedReasons.includes('experience')
    );
    if (experienceIssues.length > 0) {
      reasons.push({
        id: 'experience',
        type: 'experience',
        severity: 'medium',
        title: 'Experience Level',
        description: 'Experience level expectations do not match job requirements',
        affectedJobs: experienceIssues.length,
        improvementActions: [
          'Update experience level in profile',
          'Consider junior/senior level positions',
          'Highlight relevant project experience'
        ],
        estimatedImpact: 'Could unlock 25-40% more applications'
      });
    }

    return reasons.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }, [blockedJobs]);

  // Generate improvement suggestions
  const improvementSuggestions: ImprovementSuggestion[] = useMemo(() => {
    if (!profile || !preferences) return [];

    const suggestions: ImprovementSuggestion[] = [];

    // Profile improvements
    if (!profile.headline || !profile.summary) {
      suggestions.push({
        id: 'profile-headline',
        category: 'profile',
        priority: 'high',
        title: 'Complete Profile Headline & Summary',
        description: 'Add a compelling headline and professional summary to improve matching',
        actions: [
          'Write a clear, concise headline (3-5 words)',
          'Create a 2-3 sentence summary highlighting key strengths',
          'Include years of experience and main technologies'
        ],
        estimatedTimeToImplement: '15 minutes',
        expectedIncrease: '+15-25% match score',
        difficulty: 'easy'
      });
    }

    // Skills improvements
    if (!profile.skills || profile.skills.length < 5) {
      suggestions.push({
        id: 'skills-expansion',
        category: 'skills',
        priority: 'high',
        title: 'Expand Skills Section',
        description: 'Add more relevant technical and soft skills to improve job matching',
        actions: [
          'List all programming languages and frameworks',
          'Include tools and technologies you\'ve used',
          'Add soft skills like communication and leadership'
        ],
        estimatedTimeToImplement: '10 minutes',
        expectedIncrease: '+20-30% match score',
        difficulty: 'easy'
      });
    }

    // Preference improvements
    if (!preferences.keywords || preferences.keywords.split(',').length < 3) {
      suggestions.push({
        id: 'keywords-expansion',
        category: 'preferences',
        priority: 'medium',
        title: 'Add More Job Keywords',
        description: 'Expand your job search keywords to find more relevant positions',
        actions: [
          'Add alternative job titles (e.g., "Frontend", "UI Developer")',
          'Include specific technologies you want to work with',
          'Add industry-specific terms'
        ],
        estimatedTimeToImplement: '5 minutes',
        expectedIncrease: '+25-40% job matches',
        difficulty: 'easy'
      });
    }

    // Location flexibility
    if (!preferences.locations || preferences.locations.split(',').length < 2) {
      suggestions.push({
        id: 'location-flexibility',
        category: 'preferences',
        priority: 'medium',
        title: 'Expand Location Preferences',
        description: 'Consider more locations or remote options to increase opportunities',
        actions: [
          'Add nearby cities or metropolitan areas',
          'Consider fully remote positions',
          'Add locations you\'d be willing to relocate to'
        ],
        estimatedTimeToImplement: '5 minutes',
        expectedIncrease: '+30-50% job matches',
        difficulty: 'easy'
      });
    }

    // Salary expectations
    if (!preferences.salaryMin || !preferences.salaryMax) {
      suggestions.push({
        id: 'salary-range',
        category: 'preferences',
        priority: 'low',
        title: 'Set Salary Expectations',
        description: 'Define your salary range to filter for appropriate positions',
        actions: [
          'Research market rates for your role and experience',
          'Set a realistic minimum salary',
          'Define your maximum salary expectations'
        ],
        estimatedTimeToImplement: '10 minutes',
        expectedIncrease: '+10-20% application quality',
        difficulty: 'moderate'
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [profile, preferences]);

  const getReasonIcon = (type: BlockedJobReason['type']) => {
    switch (type) {
      case 'score': return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case 'location': return <MapPinIcon className="w-5 h-5 text-yellow-600" />;
      case 'salary': return <CurrencyDollarIcon className="w-5 h-5 text-yellow-600" />;
      case 'skills': return <AcademicCapIcon className="w-5 h-5 text-red-600" />;
      case 'experience': return <DocumentTextIcon className="w-5 h-5 text-orange-600" />;
      case 'remote': return <MapPinIcon className="w-5 h-5 text-blue-600" />;
      default: return <ExclamationTriangleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: BlockedJobReason['severity']) => {
    switch (severity) {
      case 'high': return 'bg-red-50 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-50 text-blue-800 border-blue-200';
      default: return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: ImprovementSuggestion['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: ImprovementSuggestion['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredReasons = selectedCategory === 'all' 
    ? blockedReasons 
    : blockedReasons.filter(reason => reason.type === selectedCategory);

  if (!profile || !preferences) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <LightBulbIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Complete Your Profile First</h3>
          <p className="text-gray-600">
            Set up your profile and preferences to see blocked job analysis
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-50 rounded-lg">
          <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Blocked Job Analysis</h3>
        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
          {blockedJobs.length} Jobs Blocked
        </span>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            <div>
              <div className="text-2xl font-bold text-red-900">{blockedJobs.length}</div>
              <div className="text-sm text-red-700">Jobs Blocked</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <LightBulbIcon className="w-6 h-6 text-yellow-600" />
            <div>
              <div className="text-2xl font-bold text-yellow-900">{improvementSuggestions.length}</div>
              <div className="text-sm text-yellow-700">Improvement Suggestions</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-900">+65%</div>
              <div className="text-sm text-green-700">Potential Increase</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm font-medium text-gray-700">Filter by:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              selectedCategory === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({blockedReasons.length})
          </button>
          {blockedReasons.map(reason => (
            <button
              key={reason.id}
              onClick={() => setSelectedCategory(reason.type)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                selectedCategory === reason.type
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {reason.title} ({reason.affectedJobs})
            </button>
          ))}
        </div>
      </div>

      {/* Blocked Reasons */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-gray-900">Blocking Reasons</h4>
        {filteredReasons.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No blocked jobs found for the selected category
          </div>
        ) : (
          filteredReasons.map(reason => (
            <div key={reason.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getReasonIcon(reason.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-medium text-gray-900">{reason.title}</h5>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(reason.severity)}`}>
                      {reason.severity}
                    </span>
                    <span className="text-sm text-gray-500">
                      {reason.affectedJobs} job{reason.affectedJobs !== 1 ? 's' : ''} affected
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{reason.description}</p>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-700 mb-2">Improvement Actions:</div>
                    <ul className="space-y-1">
                      {reason.improvementActions.map((action, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <CheckCircleIcon className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-3 text-sm">
                    <span className="font-medium text-green-700">Potential Impact: </span>
                    <span className="text-gray-600">{reason.estimatedImpact}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Improvement Suggestions */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Improvement Suggestions</h4>
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showSuggestions ? 'Hide' : 'Show'} Suggestions
          </button>
        </div>

        {showSuggestions && (
          <div className="space-y-4">
            {improvementSuggestions.map(suggestion => (
              <div key={suggestion.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <LightBulbIcon className="w-5 h-5 text-yellow-600 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-medium text-gray-900">{suggestion.title}</h5>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(suggestion.priority)}`}>
                        {suggestion.priority} priority
                      </span>
                      <span className={`text-sm ${getDifficultyColor(suggestion.difficulty)}`}>
                        {suggestion.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Time to implement:</span>
                        <div className="text-gray-600">{suggestion.estimatedTimeToImplement}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Expected increase:</span>
                        <div className="text-green-600 font-medium">{suggestion.expectedIncrease}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Category:</span>
                        <div className="text-gray-600 capitalize">{suggestion.category}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">Actions:</div>
                      <ul className="space-y-1">
                        {suggestion.actions.map((action, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <CheckCircleIcon className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockedJobReasons;
