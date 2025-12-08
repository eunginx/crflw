import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import ResumeIntelligenceService, { ResumeIntelligence } from '../../services/resumeIntelligenceService';
import { CheckCircleIcon, XMarkIcon, SparklesIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

interface ResumeIntelligenceCardProps {
  resumeText: string;
  resumeId?: string; // Add resumeId for tracking
  onIntelligenceApplied?: (intelligence: ResumeIntelligence) => void;
}

const ResumeIntelligenceCard: React.FC<ResumeIntelligenceCardProps> = ({ 
  resumeText, 
  resumeId,
  onIntelligenceApplied 
}) => {
  const { profile, saveProfile, savePreferences } = useUser();
  const [intelligence, setIntelligence] = useState<ResumeIntelligence | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [analyzedResumeId, setAnalyzedResumeId] = useState<string | null>(null); // Track which resume was analyzed
  const [selectedSuggestions, setSelectedSuggestions] = useState({
    headline: true,
    summary: true,
    keywords: true,
    salary: true,
    skills: true
  });

  // Clear intelligence only if resume changed (different text or different ID)
  useEffect(() => {
    if (analyzedResumeId && resumeId && analyzedResumeId !== resumeId) {
      console.log('🔄 Resume changed, clearing intelligence data');
      setIntelligence(null);
      setAnalyzedResumeId(null);
    }
  }, [resumeId, analyzedResumeId]);

  const handleAnalyzeResume = async () => {
    if (!resumeText.trim()) {
      console.log('No resume text to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log('🔍 Starting resume intelligence analysis...');
      const analysis = await ResumeIntelligenceService.analyzeResumeIntelligence(resumeText);
      console.log('✅ Resume intelligence analysis completed:', analysis);
      setIntelligence(analysis);
      setAnalyzedResumeId(resumeId || null); // Track which resume was analyzed
    } catch (error) {
      console.error('❌ Error analyzing resume intelligence:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyIntelligence = async () => {
    if (!intelligence || !profile?.email) return;

    setIsApplying(true);
    try {
      const promises: Promise<any>[] = [];

      // Apply profile updates if selected
      if (selectedSuggestions.headline || selectedSuggestions.summary || selectedSuggestions.skills) {
        const profileUpdates: any = {};
        
        if (selectedSuggestions.headline) {
          profileUpdates.headline = intelligence.suggestedHeadline;
        }
        if (selectedSuggestions.summary) {
          profileUpdates.summary = intelligence.suggestedSummary;
        }
        if (selectedSuggestions.skills) {
          profileUpdates.skills = intelligence.extractedSkills;
        }

        promises.push(saveProfile(profileUpdates));
      }

      // Apply preference updates if selected
      if (selectedSuggestions.keywords || selectedSuggestions.salary) {
        const preferencesUpdates: any = {};
        
        if (selectedSuggestions.keywords) {
          preferencesUpdates.keywords = intelligence.suggestedKeywords.join(', ');
        }
        if (selectedSuggestions.salary) {
          preferencesUpdates.salaryMin = intelligence.industryInsights.averageSalary.min;
          preferencesUpdates.salaryMax = intelligence.industryInsights.averageSalary.max;
        }

        promises.push(savePreferences(preferencesUpdates));
      }

      await Promise.all(promises);
      
      console.log('✅ Resume intelligence applied successfully');
      onIntelligenceApplied?.(intelligence);
    } catch (error) {
      console.error('Error applying resume intelligence:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const toggleSuggestion = (type: keyof typeof selectedSuggestions) => {
    setSelectedSuggestions(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const getExperienceLevelColor = (level: string) => {
    switch (level) {
      case 'lead': return 'bg-purple-100 text-purple-800';
      case 'senior': return 'bg-blue-100 text-blue-800';
      case 'mid': return 'bg-green-100 text-green-800';
      case 'entry': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExperienceLevelText = (level: string) => {
    switch (level) {
      case 'lead': return 'Lead Level';
      case 'senior': return 'Senior Level';
      case 'mid': return 'Mid-Level';
      case 'entry': return 'Entry Level';
      default: return 'Professional';
    }
  };

  if (!intelligence) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-50 rounded-lg">
            <SparklesIcon className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Resume Intelligence</h3>
        </div>

        <div className="text-center py-8">
          <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Unlock AI-powered insights from your resume</p>
          <p className="text-gray-500 text-sm mb-6">
            Get personalized suggestions for your profile and job preferences
          </p>
          <button
            onClick={handleAnalyzeResume}
            disabled={isAnalyzing || !resumeText}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-50 rounded-lg">
          <SparklesIcon className="w-5 h-5 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Resume Intelligence</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getExperienceLevelColor(intelligence.experienceLevel)}`}>
          {getExperienceLevelText(intelligence.experienceLevel)}
        </span>
      </div>

      {/* Intelligence Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{intelligence.extractedSkills.length}</div>
          <div className="text-xs text-gray-500">Skills Found</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{intelligence.suggestedKeywords.length}</div>
          <div className="text-xs text-gray-500">Job Keywords</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{intelligence.recommendedRoles.length}</div>
          <div className="text-xs text-gray-500">Recommended Roles</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            ₹{Math.round(intelligence.industryInsights.averageSalary.min/100000)}L
          </div>
          <div className="text-xs text-gray-500">Avg. Salary</div>
        </div>
      </div>

      {/* Suggestions Selection */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <ArrowTrendingUpIcon className="w-4 h-4" />
          Apply Suggestions
        </h4>

        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedSuggestions.headline}
              onChange={() => toggleSuggestion('headline')}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Professional Headline</div>
              <div className="text-sm text-gray-600">{intelligence.suggestedHeadline}</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedSuggestions.summary}
              onChange={() => toggleSuggestion('summary')}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Professional Summary</div>
              <div className="text-sm text-gray-600 line-clamp-2">{intelligence.suggestedSummary}</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedSuggestions.keywords}
              onChange={() => toggleSuggestion('keywords')}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Job Search Keywords</div>
              <div className="text-sm text-gray-600">
                {intelligence.suggestedKeywords.slice(0, 3).join(', ')}
                {intelligence.suggestedKeywords.length > 3 && ` +${intelligence.suggestedKeywords.length - 3} more`}
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedSuggestions.salary}
              onChange={() => toggleSuggestion('salary')}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Salary Range</div>
              <div className="text-sm text-gray-600">
                ₹{Math.round(intelligence.industryInsights.averageSalary.min/100000)}L - ₹{Math.round(intelligence.industryInsights.averageSalary.max/100000)}L
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedSuggestions.skills}
              onChange={() => toggleSuggestion('skills')}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Skills Profile</div>
              <div className="text-sm text-gray-600">
                {intelligence.extractedSkills.slice(0, 5).join(', ')}
                {intelligence.extractedSkills.length > 5 && ` +${intelligence.extractedSkills.length - 5} more`}
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Industry Insights */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Industry Insights</h4>
        <div className="text-sm text-blue-800">
          <div className="mb-1">
            <strong>Industry:</strong> {intelligence.industryInsights.industry}
          </div>
          <div className="mb-1">
            <strong>Top Skills:</strong> {intelligence.industryInsights.commonSkills.join(', ')}
          </div>
          <div>
            <strong>Recommended Roles:</strong> {intelligence.recommendedRoles.slice(0, 3).join(', ')}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={applyIntelligence}
          disabled={isApplying || !Object.values(selectedSuggestions).some(v => v)}
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isApplying ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Applying...
            </>
          ) : (
            <>
              <CheckCircleIcon className="w-4 h-4" />
              Apply Selected
            </>
          )}
        </button>
        
        <button
          onClick={() => {
            setIntelligence(null);
            setAnalyzedResumeId(null);
          }}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <XMarkIcon className="w-4 h-4" />
          Clear
        </button>
      </div>
    </div>
  );
};

export default ResumeIntelligenceCard;
