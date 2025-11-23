import { useState, useRef, useEffect } from 'react';
import { JobMatchAnalysis, MatchReason } from '../utils/jobMatchingUtils';

interface MatchReasonsPopoverProps {
  analysis: JobMatchAnalysis;
  className?: string;
}

const MatchReasonsPopover: React.FC<MatchReasonsPopoverProps> = ({ 
  analysis, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getReasonIcon = (reason: MatchReason) => {
    switch (reason.type) {
      case 'skill': return reason.matched ? '✅' : '❌';
      case 'location': return '📍';
      case 'seniority': return '🎯';
      case 'certification': return '🏆';
      default: return '📋';
    }
  };
  
  const getReasonColor = (reason: MatchReason) => {
    if (reason.matched) return 'text-green-600';
    return 'text-red-600';
  };

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
        title="View match details"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-80 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg right-0 top-full">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">Match Analysis</h4>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                analysis.score >= 80 ? 'bg-green-100 text-green-800 border-green-200' :
                analysis.score >= 60 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                'bg-red-100 text-red-800 border-red-200'
              }`}>
                {analysis.score}% Match
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Confidence: {analysis.confidence}
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {analysis.reasons.map((reason, index) => (
              <div key={index} className="flex items-start space-x-2 text-sm">
                <span className={`mt-0.5 ${getReasonColor(reason)}`}>
                  {getReasonIcon(reason)}
                </span>
                <span className="text-gray-700 flex-1">{reason.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              AI-powered matching based on your skills and preferences
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchReasonsPopover;
