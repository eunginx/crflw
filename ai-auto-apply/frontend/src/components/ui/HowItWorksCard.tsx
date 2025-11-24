import React from 'react';
import {
  SparklesIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const HowItWorksCard: React.FC = () => {
  const steps = [
    {
      number: '1',
      icon: <SparklesIcon className="w-8 h-8 text-white" />, 
      title: 'Upload Resume',
      description: 'Upload your PDF resume and we\'ll extract your details automatically',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      number: '2',
      icon: <MagnifyingGlassIcon className="w-8 h-8 text-white" />,
      title: 'AI Analysis',
      description: 'Our AI analyzes your skills and finds matching job opportunities',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      number: '3',
      icon: <DocumentTextIcon className="w-8 h-8 text-white" />,
      title: 'Auto-Apply',
      description: 'AI creates personalized applications and submits them for you',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-100'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">How AI Apply Works</h2>
        <div className="hidden md:block">
          <ArrowRightIcon className="w-6 h-6 text-gray-400" />
        </div>
      </div>
      
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center space-x-4">
            {/* Step Number Circle */}
            <div className="relative flex-shrink-0">
              <div className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
                {step.number}
              </div>
              {index < steps.length - 1 && (
                <div className="absolute top-12 left-6 w-0.5 h-8 bg-gray-300 -z-10" />
              )}
            </div>
            
            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div className={`${step.bgColor} rounded-lg p-4 border border-gray-200`}>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <a
          href="#"
          className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          onClick={(e) => {
            e.preventDefault();
            // TODO: Navigate to documentation or onboarding
            console.log('Navigate to learn more');
          }}
        >
          <span>Learn more about AI Apply</span>
          <ArrowRightIcon className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default HowItWorksCard;
