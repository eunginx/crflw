import React from 'react';

interface OnboardingBannerProps {
  isCompleted: boolean;
}

const OnboardingBanner: React.FC<OnboardingBannerProps> = ({ isCompleted }) => {
  const steps = [
    { title: 'Upload Resume', description: 'Add your resume for analysis', completed: true },
    { title: 'AI Analysis', description: 'Get comprehensive resume insights', completed: false },
    { title: 'Apply to Jobs', description: 'AI-powered job applications', completed: false }
  ];

  const completedSteps = steps.filter(step => step.completed).length;

  if (isCompleted) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <span className="text-green-600 text-lg">🎉</span>
          </div>
          <h3 className="text-lg font-semibold text-green-900">Onboarding Complete!</h3>
        </div>
        <p className="text-green-700 mb-4">
          You're all set to use AI Apply. Your resume has been analyzed and you can start applying to jobs with AI assistance.
        </p>
        <div className="flex items-center gap-2 text-sm text-green-600">
          <span className="text-lg">✅</span>
          <span>Ready to use AI Apply features</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <span className="text-blue-600 text-lg">🚀</span>
        </div>
        <h3 className="text-lg font-semibold text-blue-900">Get Started with AI Apply</h3>
      </div>
      
      <p className="text-blue-700 mb-6">
        Complete these steps to unlock AI-powered job applications and resume analysis.
      </p>

      {/* Progress Steps */}
      <div className="space-y-4 mb-6">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step.completed 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-500'
            }`}>
              {step.completed ? '✓' : index + 1}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{step.title}</h4>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>
            {step.completed && (
              <span className="text-green-500 text-sm">✅</span>
            )}
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-900">{completedSteps}/{steps.length} steps</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(completedSteps / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Call to Action */}
      <div className="flex items-center gap-3">
        <span className="text-blue-600 text-sm">→</span>
        <span className="text-sm text-blue-700 font-medium">
          {completedSteps === 0 ? 'Upload your resume to get started' : 
           completedSteps === 1 ? 'Process your resume for AI analysis' : 
           'Start applying to jobs with AI assistance'}
        </span>
      </div>
    </div>
  );
};

export default OnboardingBanner;
