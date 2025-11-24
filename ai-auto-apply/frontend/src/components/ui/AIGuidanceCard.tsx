import React, { useState } from 'react';
import {
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

interface AIGuidanceCardProps {
  activeResume: any;
  unifiedResult: any;
}

const AIGuidanceCard: React.FC<AIGuidanceCardProps> = ({ activeResume, unifiedResult }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getGuidanceMessages = () => {
    const messages = [];

    if (!activeResume) {
      messages.push({
        type: 'info',
        icon: <InformationCircleIcon className="w-5 h-5 text-blue-600" />,
        message: 'Upload a resume to get started with AI Apply'
      });
    } else if (unifiedResult) {
      // Check for resume quality issues
      if (unifiedResult.text && unifiedResult.text.length < 500) {
        messages.push({
          type: 'warning',
          icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />,
          message: 'Your resume text seems short—try uploading a full resume for better results'
        });
      }

      if (unifiedResult.extractedInfo) {
        if (!unifiedResult.extractedInfo.skills || unifiedResult.extractedInfo.skills.length === 0) {
          messages.push({
            type: 'warning',
            icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />,
            message: 'We couldn\'t detect any skills. Would you like help extracting them?'
          });
        } else if (unifiedResult.extractedInfo.skills.length < 5) {
          messages.push({
            type: 'suggestion',
            icon: <LightBulbIcon className="w-5 h-5 text-purple-600" />,
            message: `Found ${unifiedResult.extractedInfo.skills.length} skills. Consider adding more for better matching`
          });
        }

        if (!unifiedResult.extractedInfo.email) {
          messages.push({
            type: 'warning',
            icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />,
            message: 'No email detected in your resume. Add it for better contact options'
          });
        }
      }

      if (unifiedResult.stats && unifiedResult.stats.wordCount > 1000) {
        messages.push({
          type: 'success',
          icon: <CheckCircleIcon className="w-5 h-5 text-green-600" />,
          message: 'Great! Your resume has substantial content for AI analysis'
        });
      }
    }

    if (messages.length === 0) {
      messages.push({
        type: 'success',
        icon: <CheckCircleIcon className="w-5 h-5 text-green-600" />,
        message: 'Your resume looks good! Ready for AI processing'
      });
    }

    return messages;
  };

  const messages = getGuidanceMessages();

  const getMessageStyles = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'suggestion':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <LightBulbIcon className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">AI Guidance</h2>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </button>
        )}
      </div>
      
      {/* Compact Icon View */}
      {!isExpanded && (
        <div className="flex flex-wrap gap-2">
          {messages.slice(0, 3).map((msg, index) => (
            <div
              key={index}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${getMessageStyles(msg.type)} cursor-pointer hover:opacity-80 transition-opacity`}
              onClick={() => setIsExpanded(true)}
              title={msg.message}
            >
              <div className="flex-shrink-0">
                {msg.icon}
              </div>
              <span className="text-xs font-medium">
                {msg.type === 'warning' ? 'Warning' :
                 msg.type === 'success' ? 'Good' :
                 msg.type === 'suggestion' ? 'Tip' : 'Info'}
              </span>
            </div>
          ))}
          {messages.length > 3 && (
            <div className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs">
              <span>+{messages.length - 3} more</span>
            </div>
          )}
        </div>
      )}
      
      {/* Expanded View */}
      {isExpanded && (
        <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border flex items-start space-x-3 ${getMessageStyles(msg.type)}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {msg.icon}
              </div>
              <p className="text-sm leading-relaxed">{msg.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIGuidanceCard;
