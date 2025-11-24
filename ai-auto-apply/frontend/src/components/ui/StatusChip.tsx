import React from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  CloudArrowUpIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface StatusChipProps {
  status: 'idle' | 'uploading' | 'processing' | 'completed';
}

const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  const getStatusConfig = (): {
    icon: React.ReactNode;
    text: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
  } => {
    switch (status) {
      case 'idle':
        return {
          icon: <ClockIcon className="w-4 h-4" />,
          text: 'Ready',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-300'
        };
      case 'uploading':
        return {
          icon: <CloudArrowUpIcon className="w-4 h-4 animate-pulse" />,
          text: 'Uploading',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-300'
        };
      case 'processing':
        return {
          icon: <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />,
          text: 'Processing',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-300'
        };
      case 'completed':
        return {
          icon: <CheckCircleIcon className="w-4 h-4" />,
          text: 'Completed',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-300'
        };
      default:
        return getStatusConfig();
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
      {config.icon}
      <span className="text-sm font-medium">{config.text}</span>
    </div>
  );
};

export default StatusChip;
