import React from 'react';
import { useJobStatuses, JobStatusType } from '../context/JobStatusContext';

interface StatusChipProps {
  status: string | JobStatusType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
  className?: string;
  animation?: boolean;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  size = 'md',
  showLabel = true,
  showIcon = true,
  className = '',
  animation = true,
}) => {
  const { getStatusByKey } = useJobStatuses();
  
  const statusData = typeof status === 'string' ? getStatusByKey(status) : status;
  
  if (!statusData) {
    return (
      <span className={`px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full ${className}`}>
        Unknown Status
      </span>
    );
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const animationClass = animation && statusData.animation !== 'none' 
    ? `animate-${statusData.animation}` 
    : '';

  const chipClasses = `
    ${sizeClasses[size]}
    ${statusData.ui_classes?.chip || 'rounded-full'}
    ${statusData.ui_classes?.bg || 'bg-gray-100'}
    ${statusData.ui_classes?.text || 'text-gray-800'}
    inline-flex items-center gap-1.5 font-medium
    ${animationClass}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <span className={chipClasses} title={statusData.description}>
      {showIcon && <span>{statusData.icon}</span>}
      {showLabel && <span>{statusData.label}</span>}
    </span>
  );
};

interface StatusIconProps {
  status: string | JobStatusType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

export const StatusIcon: React.FC<StatusIconProps> = ({
  status,
  size = 'md',
  className = '',
  showTooltip = true,
}) => {
  const { getStatusByKey } = useJobStatuses();
  
  const statusData = typeof status === 'string' ? getStatusByKey(status) : status;
  
  if (!statusData) {
    return <span className={`text-gray-400 ${className}`}>❓</span>;
  }

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  const iconClasses = `
    ${sizeClasses[size]}
    ${className}
  `.trim();

  const iconElement = <span className={iconClasses}>{statusData.icon}</span>;

  if (showTooltip && statusData.description) {
    return (
      <div className="relative group inline-block">
        {iconElement}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
          {statusData.description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      </div>
    );
  }

  return iconElement;
};

interface StatusTimelineIconProps {
  status: string | JobStatusType;
  isActive?: boolean;
  isCompleted?: boolean;
  className?: string;
}

export const StatusTimelineIcon: React.FC<StatusTimelineIconProps> = ({
  status,
  isActive = false,
  isCompleted = false,
  className = '',
}) => {
  const { getStatusByKey } = useJobStatuses();
  
  const statusData = typeof status === 'string' ? getStatusByKey(status) : status;
  
  if (!statusData) {
    return <div className={`w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center ${className}`}>❓</div>;
  }

  const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200';
  const statusClasses = statusData.ui_classes?.bg || 'bg-gray-100';
  const textClasses = statusData.ui_classes?.text || 'text-gray-800';
  
  let stateClasses = '';
  if (isActive) {
    stateClasses = 'ring-2 ring-blue-500 ring-offset-2';
  } else if (isCompleted) {
    stateClasses = 'opacity-75';
  }

  const icon = statusData.timeline_icon || statusData.icon;

  return (
    <div className={`${baseClasses} ${statusClasses} ${textClasses} ${stateClasses} ${className}`}>
      <span className="text-sm">{icon}</span>
    </div>
  );
};

interface StatusBadgeProps {
  status: string | JobStatusType;
  count?: number;
  showCount?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  count = 0,
  showCount = true,
  className = '',
}) => {
  const { getStatusByKey } = useJobStatuses();
  
  const statusData = typeof status === 'string' ? getStatusByKey(status) : status;
  
  if (!statusData) {
    return null;
  }

  const badgeClasses = `
    inline-flex items-center gap-1.5
    ${statusData.ui_classes?.bg || 'bg-gray-100'}
    ${statusData.ui_classes?.text || 'text-gray-800'}
    px-2.5 py-1 rounded-md text-sm font-medium
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={badgeClasses}>
      <span>{statusData.icon}</span>
      <span>{statusData.label}</span>
      {showCount && count > 0 && (
        <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs font-bold">
          {count}
        </span>
      )}
    </div>
  );
};

interface StatusSelectProps {
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const StatusSelect: React.FC<StatusSelectProps> = ({
  value,
  onChange,
  options,
  className = '',
  placeholder = 'Select status...',
  disabled = false,
}) => {
  const { statusOptions } = useJobStatuses();

  const selectOptions = options 
    ? statusOptions.filter(opt => options.includes(opt.value))
    : statusOptions;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`
        block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        disabled:bg-gray-100 disabled:text-gray-500
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      <option value="">{placeholder}</option>
      {selectOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.icon} {option.label}
        </option>
      ))}
    </select>
  );
};

interface StatusProgressProps {
  currentStatus: string;
  showLabels?: boolean;
  className?: string;
}

export const StatusProgress: React.FC<StatusProgressProps> = ({
  currentStatus,
  showLabels = true,
  className = '',
}) => {
  const { enhancedStatuses } = useJobStatuses();

  // Define the typical progression order
  const progressionOrder = ['saved', 'applied', 'interview', 'offer'];
  
  const currentStatusIndex = progressionOrder.indexOf(currentStatus);
  const progressPercentage = ((currentStatusIndex + 1) / progressionOrder.length) * 100;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        {progressionOrder.map((statusKey, index) => {
          const statusData = enhancedStatuses.find(s => s.key === statusKey);
          if (!statusData) return null;

          const isCompleted = index <= currentStatusIndex;
          const isCurrent = index === currentStatusIndex;

          return (
            <div key={statusKey} className="flex flex-col items-center flex-1">
              <StatusTimelineIcon
                status={statusData}
                isActive={isCurrent}
                isCompleted={isCompleted}
                className={isCurrent ? 'scale-110' : ''}
              />
              {showLabels && (
                <span className={`text-xs mt-1 ${isCurrent ? 'font-bold' : ''}`}>
                  {statusData.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};

interface StatusGridProps {
  onStatusSelect?: (status: JobStatusType) => void;
  selectedStatus?: string;
  className?: string;
}

export const StatusGrid: React.FC<StatusGridProps> = ({
  onStatusSelect,
  selectedStatus,
  className = '',
}) => {
  const { statusGroups } = useJobStatuses();

  return (
    <div className={`space-y-6 ${className}`}>
      {statusGroups.map((group) => (
        <div key={group.group_label}>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 capitalize">
            {group.group_label}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {group.statuses.map((status) => (
              <button
                key={status.key}
                onClick={() => onStatusSelect?.(status)}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200
                  ${selectedStatus === status.key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-2xl">{status.icon}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {status.label}
                  </span>
                  {status.experimental && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                      Experimental
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
