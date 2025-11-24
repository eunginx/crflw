import React from 'react';

interface AestheticScoreCardProps {
  score: number;
  strengths: string[];
  improvements: string[];
  assessment: string;
}

const AestheticScoreCard: React.FC<AestheticScoreCardProps> = ({
  score,
  strengths,
  improvements,
  assessment
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 55) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <span className="text-indigo-600 text-lg">🎨</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Aesthetic Score</h3>
      </div>

      {/* Score Display */}
      <div className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreColor(score)} mb-3`}>
          <span className="text-3xl font-bold">{score}</span>
        </div>
        <div className="text-lg font-medium text-gray-900 mb-1">{getScoreLabel(score)}</div>
        <div className="text-sm text-gray-500">Visual design assessment</div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              score >= 85 ? 'bg-green-500' : 
              score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Assessment */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-gray-600 text-sm">📊</span>
          <h4 className="font-medium text-gray-900">Assessment</h4>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{assessment}</p>
      </div>

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-600 text-sm">✅</span>
            <h4 className="font-medium text-gray-900">Strengths</h4>
          </div>
          <div className="space-y-2">
            {strengths.map((strength, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-500 text-xs mt-1">•</span>
                <span>{strength}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvements */}
      {improvements.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-yellow-600 text-sm">⚠️</span>
            <h4 className="font-medium text-gray-900">Areas for Improvement</h4>
          </div>
          <div className="space-y-2">
            {improvements.map((improvement, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-yellow-500 text-xs mt-1">•</span>
                <span>{improvement}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {strengths.length === 0 && improvements.length === 0 && (
        <div className="text-center py-4">
          <span className="text-gray-400 text-2xl">📊</span>
          <p className="text-gray-500 text-sm mt-2">No detailed analysis available</p>
        </div>
      )}
    </div>
  );
};

export default AestheticScoreCard;
