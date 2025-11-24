import React from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

const CurrentStatus: React.FC = () => {
  const status = 'coming_soon'; // This could be fetched from database/settings
  
  if (status === 'coming_soon') {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-start space-x-3">
          <ClockIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Apply Status</h3>
            <p className="text-gray-700 mb-4">
              The AI Apply feature is currently under development and coming soon. We're working hard to bring you intelligent job application automation.
            </p>
            
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">What's Coming:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Automatic job application submission</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>AI-powered resume customization for each job</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Smart cover letter generation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Application tracking and analytics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Interview scheduling automation</span>
                </li>
              </ul>
            </div>
            
            <div className="mt-4 flex items-center space-x-2 text-sm text-blue-600">
              <InformationCircleIcon className="h-4 w-4" />
              <span>Resume processing and analysis features are already available!</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'beta') {
    return (
      <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
        <div className="flex items-start space-x-3">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Beta Testing</h3>
            <p className="text-gray-700">
              AI Apply is currently in beta testing. Limited features are available for early testers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'active') {
    return (
      <div className="bg-green-50 rounded-xl border border-green-200 p-6">
        <div className="flex items-start space-x-3">
          <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fully Active</h3>
            <p className="text-gray-700">
              All AI Apply features are now available! Start automating your job applications today.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
      <div className="flex items-start space-x-3">
        <InformationCircleIcon className="h-6 w-6 text-gray-600 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Status Unknown</h3>
          <p className="text-gray-700">
            Unable to determine the current status of AI Apply features.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CurrentStatus;
