import React from 'react';
import { 
  CpuChipIcon, 
  DocumentTextIcon, 
  SparklesIcon, 
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const HowAIWorks: React.FC = () => {
  const steps = [
    {
      icon: DocumentTextIcon,
      title: 'Upload Resume',
      description: 'Upload your PDF resume to our secure platform',
      color: 'blue'
    },
    {
      icon: CpuChipIcon,
      title: 'AI Processing',
      description: 'Our AI extracts text, analyzes structure, and identifies key information',
      color: 'purple'
    },
    {
      icon: SparklesIcon,
      title: 'Smart Analysis',
      description: 'Get insights on quality, skills, sections, and improvement recommendations',
      color: 'green'
    }
  ];

  const features = [
    'Automatic text extraction from PDF files',
    'Contact information detection and validation',
    'Resume structure analysis',
    'Skills extraction and categorization',
    'Quality scoring with detailed metrics',
    'Personalized improvement recommendations',
    'Professional preview generation',
    'Secure cloud storage'
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">How AI Apply Works</h3>
        <p className="text-gray-600">
          Our intelligent resume processing system helps you optimize your resume for job applications with AI-powered insights.
        </p>
      </div>

      {/* Process Steps */}
      <div className="mb-8">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Simple 3-Step Process</h4>
        <div className="space-y-6">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            const colorClasses = {
              blue: 'bg-blue-100 text-blue-600',
              purple: 'bg-purple-100 text-purple-600',
              green: 'bg-green-100 text-green-600'
            };
            
            return (
              <div key={index} className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[step.color as keyof typeof colorClasses]}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 mb-1">{step.title}</h5>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-shrink-0 flex items-center justify-center h-12">
                    <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Grid */}
      <div className="mb-8">
        <h4 className="text-lg font-medium text-gray-900 mb-4">AI-Powered Features</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-3">
              <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Stack */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-900 mb-3">Powered by Advanced AI</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600">PDF</div>
            <div className="text-sm text-gray-600">Processing</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">NLP</div>
            <div className="text-sm text-gray-600">Analysis</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">ML</div>
            <div className="text-sm text-gray-600">Scoring</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-600">AI</div>
            <div className="text-sm text-gray-600">Insights</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowAIWorks;
