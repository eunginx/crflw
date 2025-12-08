import React from 'react';
import { 
  SparklesIcon, 
  DocumentTextIcon, 
  UserCircleIcon,
  ChartBarIcon,
  CogIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// Section Header Props
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'default' | 'compact' | 'featured' | 'minimal' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Predefined icon configurations
const iconMap = {
  sparkles: <SparklesIcon className="w-5 h-5" />,
  document: <DocumentTextIcon className="w-5 h-5" />,
  user: <UserCircleIcon className="w-5 h-5" />,
  chart: <ChartBarIcon className="w-5 h-5" />,
  settings: <CogIcon className="w-5 h-5" />,
  briefcase: <BriefcaseIcon className="w-5 h-5" />,
  academic: <AcademicCapIcon className="w-5 h-5" />,
  location: <MapPinIcon className="w-5 h-5" />,
  currency: <CurrencyDollarIcon className="w-5 h-5" />,
  clock: <ClockIcon className="w-5 h-5" />,
  check: <CheckCircleIcon className="w-5 h-5" />,
  warning: <ExclamationTriangleIcon className="w-5 h-5" />,
  lightbulb: <LightBulbIcon className="w-5 h-5" />,
  trending: <ArrowTrendingUpIcon className="w-5 h-5" />,
  filter: <FunnelIcon className="w-5 h-5" />,
  eye: <EyeIcon className="w-5 h-5" />,
  pencil: <PencilIcon className="w-5 h-5" />,
  info: <InformationCircleIcon className="w-5 h-5" />
};

// Icon color configurations
const iconColors = {
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
  info: 'text-blue-600'
};

// Background color configurations
const bgColors = {
  primary: 'bg-blue-50',
  secondary: 'bg-gray-50',
  success: 'bg-green-50',
  warning: 'bg-yellow-50',
  error: 'bg-red-50',
  info: 'bg-blue-50',
  none: ''
};

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  description,
  icon,
  badge,
  actions,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  // Determine icon and colors based on variant
  const getIconConfig = () => {
    if (typeof icon === 'string' && iconMap[icon as keyof typeof iconMap]) {
      return iconMap[icon as keyof typeof iconMap];
    }
    return icon;
  };

  const getIconColor = () => {
    switch (variant) {
      case 'featured':
        return iconColors.primary;
      case 'success':
        return iconColors.success;
      case 'warning':
        return iconColors.warning;
      case 'error':
        return iconColors.error;
      default:
        return iconColors.secondary;
    }
  };

  const getBgColor = () => {
    switch (variant) {
      case 'featured':
        return bgColors.primary;
      case 'success':
        return bgColors.success;
      case 'warning':
        return bgColors.warning;
      case 'error':
        return bgColors.error;
      default:
        return bgColors.none;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          title: 'text-base font-semibold',
          subtitle: 'text-sm',
          description: 'text-xs',
          icon: 'w-4 h-4',
          padding: 'p-3'
        };
      case 'lg':
        return {
          title: 'text-2xl font-bold',
          subtitle: 'text-lg',
          description: 'text-base',
          icon: 'w-6 h-6',
          padding: 'p-6'
        };
      default:
        return {
          title: 'text-lg font-semibold',
          subtitle: 'text-sm',
          description: 'text-sm',
          icon: 'w-5 h-5',
          padding: 'p-4'
        };
    }
  };

  const sizeClasses = getSizeClasses();
  const iconConfig = getIconConfig();
  const iconColor = getIconColor();
  const bgColor = getBgColor();

  // Render different variants
  const renderDefaultVariant = () => (
    <div className={`flex items-center justify-between ${sizeClasses.padding} ${bgColor} ${className}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {iconConfig && (
          <div className={`flex-shrink-0 ${iconColor}`}>
            {iconConfig}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className={`${sizeClasses.title} text-gray-900 truncate`}>
              {title}
            </h2>
            {badge}
          </div>
          
          {subtitle && (
            <p className={`${sizeClasses.subtitle} text-gray-600 truncate`}>
              {subtitle}
            </p>
          )}
          
          {description && (
            <p className={`${sizeClasses.description} text-gray-500 mt-1`}>
              {description}
            </p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex-shrink-0 ml-4">
          {actions}
        </div>
      )}
    </div>
  );

  const renderCompactVariant = () => (
    <div className={`flex items-center gap-2 ${sizeClasses.padding} ${className}`}>
      {iconConfig && (
        <div className={`flex-shrink-0 ${iconColor}`}>
          {iconConfig}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className={`${sizeClasses.title} text-gray-900 truncate`}>
            {title}
          </h2>
          {badge}
        </div>
        
        {subtitle && (
          <p className={`${sizeClasses.subtitle} text-gray-600 truncate`}>
            {subtitle}
          </p>
        )}
      </div>
      
      {actions && (
        <div className="flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );

  const renderFeaturedVariant = () => (
    <div className={`border border-blue-200 rounded-lg ${sizeClasses.padding} ${bgColor} ${className}`}>
      <div className="flex items-start gap-4">
        {iconConfig && (
          <div className={`flex-shrink-0 p-2 bg-white rounded-lg ${iconColor}`}>
            {iconConfig}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h2 className={`${sizeClasses.title} text-blue-900`}>
              {title}
            </h2>
            {badge}
          </div>
          
          {subtitle && (
            <p className={`${sizeClasses.subtitle} text-blue-700`}>
              {subtitle}
            </p>
          )}
          
          {description && (
            <p className={`${sizeClasses.description} text-blue-600 mt-2`}>
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );

  const renderMinimalVariant = () => (
    <div className={`border-b border-gray-200 pb-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {iconConfig && (
            <div className={`flex-shrink-0 ${iconColor}`}>
              {iconConfig}
            </div>
          )}
          
          <h2 className={`${sizeClasses.title} text-gray-900`}>
            {title}
          </h2>
          {badge}
        </div>
        
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
      
      {subtitle && (
        <p className={`${sizeClasses.subtitle} text-gray-600 mt-1 ml-7`}>
          {subtitle}
        </p>
      )}
    </div>
  );

  switch (variant) {
    case 'compact':
      return renderCompactVariant();
    case 'featured':
      return renderFeaturedVariant();
    case 'minimal':
      return renderMinimalVariant();
    default:
      return renderDefaultVariant();
  }
};

// Specialized Section Header Components

// AI Section Header
interface AISectionHeaderProps extends Omit<SectionHeaderProps, 'icon' | 'variant'> {
  showBadge?: boolean;
  badgeText?: string;
}

export const AISectionHeader: React.FC<AISectionHeaderProps> = ({
  showBadge = true,
  badgeText = 'AI-Powered',
  ...props
}) => {
  const badge = showBadge ? (
    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
      {badgeText}
    </span>
  ) : undefined;

  return (
    <SectionHeader
      icon="sparkles"
      badge={badge}
      variant="featured"
      {...props}
    />
  );
};

// Analytics Section Header
export const AnalyticsSectionHeader: React.FC<SectionHeaderProps> = (props) => {
  return (
    <SectionHeader
      icon="chart"
      variant="default"
      {...props}
    />
  );
};

// Settings Section Header
export const SettingsSectionHeader: React.FC<SectionHeaderProps> = (props) => {
  return (
    <SectionHeader
      icon="settings"
      variant="minimal"
      {...props}
    />
  );
};

// Profile Section Header
export const ProfileSectionHeader: React.FC<SectionHeaderProps> = (props) => {
  return (
    <SectionHeader
      icon="user"
      variant="default"
      {...props}
    />
  );
};

// Jobs Section Header
export const JobsSectionHeader: React.FC<SectionHeaderProps> = (props) => {
  return (
    <SectionHeader
      icon="briefcase"
      variant="featured"
      {...props}
    />
  );
};

// Skills Section Header
export const SkillsSectionHeader: React.FC<SectionHeaderProps> = (props) => {
  return (
    <SectionHeader
      icon="academic"
      variant="default"
      {...props}
    />
  );
};

// Location Section Header
export const LocationSectionHeader: React.FC<SectionHeaderProps> = (props) => {
  return (
    <SectionHeader
      icon="location"
      variant="default"
      {...props}
    />
  );
};

// Salary Section Header
export const SalarySectionHeader: React.FC<SectionHeaderProps> = (props) => {
  return (
    <SectionHeader
      icon="currency"
      variant="default"
      {...props}
    />
  );
};

// Status Section Header
interface StatusSectionHeaderProps extends Omit<SectionHeaderProps, 'variant'> {
  status: 'success' | 'warning' | 'error' | 'info';
}

export const StatusSectionHeader: React.FC<StatusSectionHeaderProps> = ({
  status,
  icon,
  ...props
}) => {
  const statusIcons = {
    success: 'check',
    warning: 'warning',
    error: 'warning',
    info: 'info'
  };

  return (
    <SectionHeader
      icon={icon || statusIcons[status]}
      variant={status}
      {...props}
    />
  );
};

// Progress Section Header
interface ProgressSectionHeaderProps extends Omit<SectionHeaderProps, 'icon' | 'actions'> {
  progress: number;
  showPercentage?: boolean;
}

export const ProgressSectionHeader: React.FC<ProgressSectionHeaderProps> = ({
  progress,
  showPercentage = true,
  ...props
}) => {
  const actions = (
    <div className="flex items-center gap-2">
      {showPercentage && (
        <span className="text-sm font-medium text-gray-600">
          {progress}%
        </span>
      )}
      <div className="w-16 bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );

  return (
    <SectionHeader
      icon="trending"
      actions={actions}
      {...props}
    />
  );
};

// Collapsible Section Header
interface CollapsibleSectionHeaderProps extends SectionHeaderProps {
  isExpanded: boolean;
  onToggle: () => void;
  toggleIcon?: React.ReactNode;
}

export const CollapsibleSectionHeader: React.FC<CollapsibleSectionHeaderProps> = ({
  isExpanded,
  onToggle,
  toggleIcon,
  ...props
}) => {
  const defaultToggleIcon = (
    <svg
      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
        isExpanded ? 'rotate-180' : ''
      }`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  const actions = (
    <button
      onClick={onToggle}
      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
    >
      {toggleIcon || defaultToggleIcon}
    </button>
  );

  return (
    <SectionHeader
      actions={actions}
      variant="minimal"
      {...props}
    />
  );
};

// Export all section header components
export const SectionHeaders = {
  SectionHeader,
  AISectionHeader,
  AnalyticsSectionHeader,
  SettingsSectionHeader,
  ProfileSectionHeader,
  JobsSectionHeader,
  SkillsSectionHeader,
  LocationSectionHeader,
  SalarySectionHeader,
  StatusSectionHeader,
  ProgressSectionHeader,
  CollapsibleSectionHeader
};

export default SectionHeader;
