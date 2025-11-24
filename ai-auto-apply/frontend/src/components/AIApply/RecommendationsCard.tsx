import React from 'react';

interface Recommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  examples?: string[];
}

interface RecommendationsCardProps {
  recommendations: Recommendation[];
  strengths: string[];
  improvements: string[];
}

const RecommendationsCard: React.FC<RecommendationsCardProps> = ({
  recommendations,
  strengths,
  improvements
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'low':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔥';
      case 'medium':
        return '⚡';
      case 'low':
        return '💡';
      default:
        return '📝';
    }
  };

  const allRecommendations = [
    ...recommendations.map(rec => ({
      type: 'recommendation' as const,
      title: rec.category,
      description: rec.description,
      priority: rec.priority,
      icon: getPriorityIcon(rec.priority),
      color: getPriorityColor(rec.priority),
      examples: rec.examples
    })),
    ...strengths.slice(0, 3).map((strength, index) => ({
      type: 'strength' as const,
      title: 'Strength',
      description: strength,
      priority: 'low' as const,
      icon: '✅',
      color: 'bg-green-50 text-green-600 border-green-200',
      examples: undefined
    })),
    ...improvements.slice(0, 3).map((improvement, index) => ({
      type: 'improvement' as const,
      title: 'Improvement',
      description: improvement,
      priority: 'medium' as const,
      icon: '🔧',
      color: 'bg-orange-50 text-orange-600 border-orange-200',
      examples: undefined
    }))
  ];

  const highPriorityCount = allRecommendations.filter(r => r.priority === 'high').length;
  const mediumPriorityCount = allRecommendations.filter(r => r.priority === 'medium').length;
  const lowPriorityCount = allRecommendations.filter(r => r.priority === 'low').length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-yellow-50 rounded-lg">
          <span className="text-yellow-600 text-lg">💡</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
        {allRecommendations.length > 0 && (
          <div className="flex gap-1">
            {highPriorityCount > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                {highPriorityCount} high
              </span>
            )}
            {mediumPriorityCount > 0 && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-600 text-xs rounded-full">
                {mediumPriorityCount} medium
              </span>
            )}
            {lowPriorityCount > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                {lowPriorityCount} low
              </span>
            )}
          </div>
        )}
      </div>

      {allRecommendations.length > 0 ? (
        <div className="space-y-4">
          {allRecommendations.map((item, index) => (
            <div key={index} className={`border rounded-lg p-4 ${item.color}`}>
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{item.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-2">
                    {item.description}
                  </p>
                  {item.examples && item.examples.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 border-opacity-20">
                      <div className="text-xs font-medium text-gray-700 mb-2">Examples:</div>
                      <div className="space-y-1">
                        {item.examples.map((example, exIndex) => (
                          <div key={exIndex} className="text-xs text-gray-600 flex items-start gap-1">
                            <span className="text-gray-400">•</span>
                            <span>{example}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <span className="text-gray-400 text-4xl">💡</span>
          <p className="text-gray-500 text-sm mt-2">No recommendations available</p>
          <p className="text-gray-400 text-xs mt-1">Upload and process your resume to get AI-powered recommendations</p>
        </div>
      )}

      {/* Summary */}
      {allRecommendations.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-red-600">{highPriorityCount}</div>
              <div className="text-xs text-gray-600">High Priority</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-yellow-600">{mediumPriorityCount}</div>
              <div className="text-xs text-gray-600">Medium Priority</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">{lowPriorityCount}</div>
              <div className="text-xs text-gray-600">Low Priority</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationsCard;
