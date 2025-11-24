import React from 'react';

interface SkillsData {
  technical?: string[];
  soft?: string[];
  tools?: string[];
}

interface SkillsCardProps {
  skills: SkillsData;
}

const SkillsCard: React.FC<SkillsCardProps> = ({ skills }) => {
  const skillCategories = [
    {
      title: 'Technical Skills',
      items: skills.technical || [],
      icon: '💻',
      color: 'blue'
    },
    {
      title: 'Soft Skills',
      items: skills.soft || [],
      icon: '🤝',
      color: 'green'
    },
    {
      title: 'Tools & Technologies',
      items: skills.tools || [],
      icon: '🔧',
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'green':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'purple':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const totalSkills = skillCategories.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-50 rounded-lg">
          <span className="text-green-600 text-lg">💡</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Skills Analysis</h3>
        {totalSkills > 0 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            {totalSkills} skills
          </span>
        )}
      </div>

      {totalSkills > 0 ? (
        <div className="space-y-4">
          {skillCategories.map((category, index) => (
            category.items.length > 0 && (
              <div key={index}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-gray-600 text-sm">{category.icon}</span>
                  <h4 className="font-medium text-gray-900">{category.title}</h4>
                  <span className="text-xs text-gray-500">({category.items.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {category.items.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getColorClasses(category.color)}`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <span className="text-gray-400 text-4xl">💡</span>
          <p className="text-gray-500 text-sm mt-2">No skills detected</p>
          <p className="text-gray-400 text-xs mt-1">Skills will be extracted from your resume</p>
        </div>
      )}

      {/* Skill Level Indicator */}
      {totalSkills > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            {skillCategories.map((category, index) => (
              <div key={index} className="flex flex-col items-center gap-1">
                <span className="text-gray-400 text-sm">{category.icon}</span>
                <span className="text-lg font-semibold text-gray-900">
                  {category.items.length}
                </span>
                <span className="text-xs text-gray-500">{category.title.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillsCard;
