import React from 'react';

interface Section {
  type: string;
  present: boolean;
  completeness: number;
  recommendations?: string[];
}

interface SectionsCardProps {
  sections: Section[];
}

const SectionsCard: React.FC<SectionsCardProps> = ({ sections }) => {
  const getSectionIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'summary': '📝',
      'experience': '💼',
      'education': '🎓',
      'skills': '💡',
      'projects': '🚀',
      'certifications': '🏆',
      'awards': '🌟',
      'languages': '🌍',
      'references': '👥'
    };
    return icons[type.toLowerCase()] || '📄';
  };

  const getCompletenessColor = (completeness: number) => {
    if (completeness >= 80) return 'text-green-600 bg-green-50';
    if (completeness >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getCompletenessLabel = (completeness: number) => {
    if (completeness >= 80) return 'Complete';
    if (completeness >= 60) return 'Partial';
    return 'Missing';
  };

  const presentSections = sections.filter(s => s.present).length;
  const totalSections = sections.length;
  const overallCompleteness = sections.reduce((sum, s) => sum + s.completeness, 0) / totalSections;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-orange-50 rounded-lg">
          <span className="text-orange-600 text-lg">📋</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Resume Sections</h3>
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
          {presentSections}/{totalSections}
        </span>
      </div>

      {/* Overall Progress */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Completeness</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCompletenessColor(overallCompleteness)}`}>
            {Math.round(overallCompleteness)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-orange-500 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${overallCompleteness}%` }}
          />
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-3">
        {sections.map((section, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">{getSectionIcon(section.type)}</span>
                <h4 className="font-medium text-gray-900 capitalize">{section.type}</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  section.present ? getCompletenessColor(section.completeness) : 'text-gray-600 bg-gray-100'
                }`}>
                  {section.present ? getCompletenessLabel(section.completeness) : 'Missing'}
                </span>
              </div>
            </div>

            {section.present && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Completeness</span>
                  <span>{section.completeness}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      section.completeness >= 80 ? 'bg-green-500' : 
                      section.completeness >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${section.completeness}%` }}
                  />
                </div>
              </div>
            )}

            {section.recommendations && section.recommendations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-yellow-600 text-xs">💡</span>
                  <span className="text-xs font-medium text-gray-700">Recommendations</span>
                </div>
                <div className="space-y-1">
                  {section.recommendations.map((rec, recIndex) => (
                    <div key={recIndex} className="text-xs text-gray-600 flex items-start gap-1">
                      <span className="text-gray-400">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {sections.length === 0 && (
        <div className="text-center py-8">
          <span className="text-gray-400 text-4xl">📋</span>
          <p className="text-gray-500 text-sm mt-2">No sections analyzed</p>
          <p className="text-gray-400 text-xs mt-1">Resume sections will be detected automatically</p>
        </div>
      )}

      {/* Summary */}
      {presentSections > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Resume Quality</span>
            <span className="font-medium text-gray-900">
              {overallCompleteness >= 80 ? 'Professional' : 
               overallCompleteness >= 60 ? 'Good' : 'Needs Work'}
            </span>
          </div>
          {overallCompleteness >= 80 && (
            <div className="mt-2 text-xs text-green-600">
              • Great job! Your resume has a comprehensive structure
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SectionsCard;
