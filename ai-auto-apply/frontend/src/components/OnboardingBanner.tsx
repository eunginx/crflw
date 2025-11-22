import { Link, useNavigate } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface OnboardingBannerProps {
  onClose: () => void;
}

export default function OnboardingBanner({ onClose }: OnboardingBannerProps) {
  const navigate = useNavigate();

  const handleCompleteSetup = () => {
    navigate('/onboarding');
    onClose();
  };

  return (
    <div className="bg-blue-50 border-b border-blue-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <span className="text-blue-600 text-lg">🚀</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Complete your setup!</span> Go through our quick onboarding process to start using AI Auto Apply.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCompleteSetup}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Start Onboarding
              </button>
              <button
                onClick={onClose}
                className="flex-shrink-0 p-1 rounded text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
