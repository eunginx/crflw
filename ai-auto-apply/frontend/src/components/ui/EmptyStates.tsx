import React from 'react';
import { 
  DocumentTextIcon, 
  BriefcaseIcon, 
  UserCircleIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  FolderIcon,
  InboxIcon,
  CogIcon,
  AcademicCapIcon,
  MapPinIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

// Empty State Props
interface EmptyStateProps {
  type: 'no-data' | 'no-results' | 'error' | 'loading' | 'success' | 'info';
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Icon configurations
const iconMap = {
  document: <DocumentTextIcon className="w-12 h-12" />,
  briefcase: <BriefcaseIcon className="w-12 h-12" />,
  user: <UserCircleIcon className="w-12 h-12" />,
  chart: <ChartBarIcon className="w-12 h-12" />,
  search: <MagnifyingGlassIcon className="w-12 h-12" />,
  filter: <FunnelIcon className="w-12 h-12" />,
  warning: <ExclamationTriangleIcon className="w-12 h-12" />,
  lightbulb: <LightBulbIcon className="w-12 h-12" />,
  sparkles: <SparklesIcon className="w-12 h-12" />,
  clock: <ClockIcon className="w-12 h-12" />,
  check: <CheckCircleIcon className="w-12 h-12" />,
  refresh: <ArrowPathIcon className="w-12 h-12" />,
  plus: <PlusIcon className="w-12 h-12" />,
  folder: <FolderIcon className="w-12 h-12" />,
  inbox: <InboxIcon className="w-12 h-12" />,
  settings: <CogIcon className="w-12 h-12" />,
  academic: <AcademicCapIcon className="w-12 h-12" />,
  location: <MapPinIcon className="w-12 h-12" />,
  currency: <CurrencyDollarIcon className="w-12 h-12" />
};

// Color configurations
const colorMap = {
  primary: 'text-blue-600',
  secondary: 'text-gray-400',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
  info: 'text-blue-600'
};

// Background color configurations
const bgMap = {
  primary: 'bg-blue-50',
  secondary: 'bg-gray-50',
  success: 'bg-green-50',
  warning: 'bg-yellow-50',
  error: 'bg-red-50',
  info: 'bg-blue-50'
};

const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  icon,
  actions,
  size = 'md',
  className = ''
}) => {
  // Get default icon and colors based on type
  const getDefaultConfig = () => {
    switch (type) {
      case 'no-data':
        return {
          icon: icon || iconMap.inbox,
          color: colorMap.secondary,
          bgColor: bgMap.secondary
        };
      case 'no-results':
        return {
          icon: icon || iconMap.search,
          color: colorMap.secondary,
          bgColor: bgMap.secondary
        };
      case 'error':
        return {
          icon: icon || iconMap.warning,
          color: colorMap.error,
          bgColor: bgMap.error
        };
      case 'loading':
        return {
          icon: icon || iconMap.clock,
          color: colorMap.primary,
          bgColor: bgMap.primary
        };
      case 'success':
        return {
          icon: icon || iconMap.check,
          color: colorMap.success,
          bgColor: bgMap.success
        };
      case 'info':
        return {
          icon: icon || iconMap.lightbulb,
          color: colorMap.info,
          bgColor: bgMap.info
        };
      default:
        return {
          icon: icon || iconMap.folder,
          color: colorMap.secondary,
          bgColor: bgMap.secondary
        };
    }
  };

  const config = getDefaultConfig();

  // Size configurations
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'py-8',
          icon: 'w-8 h-8',
          title: 'text-base font-medium',
          description: 'text-sm',
          actions: 'text-sm'
        };
      case 'lg':
        return {
          container: 'py-16',
          icon: 'w-16 h-16',
          title: 'text-xl font-semibold',
          description: 'text-base',
          actions: 'text-base'
        };
      default:
        return {
          container: 'py-12',
          icon: 'w-12 h-12',
          title: 'text-lg font-medium',
          description: 'text-sm',
          actions: 'text-sm'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`flex flex-col items-center justify-center text-center ${sizeClasses.container} ${className}`}>
      <div className={`${config.bgColor} rounded-full p-4 mb-4`}>
        <div className={`${config.color} ${sizeClasses.icon}`}>
          {config.icon}
        </div>
      </div>
      
      <h3 className={`${sizeClasses.title} text-gray-900 mb-2`}>
        {title}
      </h3>
      
      {description && (
        <p className={`${sizeClasses.description} text-gray-600 mb-6 max-w-md`}>
          {description}
        </p>
      )}
      
      {actions && (
        <div className={`${sizeClasses.actions}`}>
          {actions}
        </div>
      )}
    </div>
  );
};

// Specialized Empty State Components

// No Data Empty State
interface NoDataEmptyStateProps extends Omit<EmptyStateProps, 'type' | 'icon'> {
  dataType?: 'jobs' | 'applications' | 'resumes' | 'documents' | 'profiles' | 'settings';
  onAction?: () => void;
  actionText?: string;
}

export const NoDataEmptyState: React.FC<NoDataEmptyStateProps> = ({
  dataType = 'data',
  onAction,
  actionText = 'Get Started',
  ...props
}) => {
  const dataTypeConfig = {
    jobs: {
      icon: iconMap.briefcase,
      title: 'No jobs found',
      description: 'Start by adding some job applications or adjusting your search criteria.',
      actionText: actionText || 'Add Jobs'
    },
    applications: {
      icon: iconMap.document,
      title: 'No applications yet',
      description: 'Your job applications will appear here once you start applying.',
      actionText: actionText || 'Start Applying'
    },
    resumes: {
      icon: iconMap.document,
      title: 'No resumes uploaded',
      description: 'Upload your resume to get personalized job recommendations and insights.',
      actionText: actionText || 'Upload Resume'
    },
    documents: {
      icon: iconMap.folder,
      title: 'No documents found',
      description: 'Upload documents to analyze and process them with AI.',
      actionText: actionText || 'Upload Documents'
    },
    profiles: {
      icon: iconMap.user,
      title: 'No profile data',
      description: 'Complete your profile to get personalized job matching.',
      actionText: actionText || 'Complete Profile'
    },
    settings: {
      icon: iconMap.settings,
      title: 'No settings configured',
      description: 'Configure your preferences to personalize your experience.',
      actionText: actionText || 'Configure Settings'
    }
  };

  const config = dataTypeConfig[dataType as keyof typeof dataTypeConfig] || dataTypeConfig.jobs;

  const actions = onAction ? (
    <button
      onClick={onAction}
      className="btn btn-primary"
    >
      {config.actionText}
    </button>
  ) : undefined;

  return (
    <EmptyState
      type="no-data"
      icon={config.icon}
      description={config.description}
      actions={actions}
      {...props}
    />
  );
};

// No Results Empty State
interface NoResultsEmptyStateProps extends Omit<EmptyStateProps, 'type' | 'icon' | 'actions'> {
  onClearFilters?: () => void;
  onClearSearch?: () => void;
  hasFilters?: boolean;
  hasSearch?: boolean;
}

export const NoResultsEmptyState: React.FC<NoResultsEmptyStateProps> = ({
  onClearFilters,
  onClearSearch,
  hasFilters = false,
  hasSearch = false,
  ...props
}) => {
  const title = 'No results found';
  let description = 'Try adjusting your search terms or filters to find what you\'re looking for.';
  
  if (hasFilters && hasSearch) {
    description = 'No results match your search terms and filters. Try adjusting one or both.';
  } else if (hasFilters) {
    description = 'No results match your current filters. Try adjusting or clearing your filters.';
  } else if (hasSearch) {
    description = 'No results match your search terms. Try different keywords or check spelling.';
  }

  const actions = (
    <div className="flex gap-3 justify-center">
      {hasSearch && onClearSearch && (
        <button
          onClick={onClearSearch}
          className="btn btn-secondary"
        >
          Clear Search
        </button>
      )}
      {hasFilters && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="btn btn-secondary"
        >
          Clear Filters
        </button>
      )}
    </div>
  );

  return (
    <EmptyState
      type="no-results"
      icon={iconMap.search}
      title={title}
      description={description}
      actions={actions}
    />
  );
};

// Error Empty State
interface ErrorEmptyStateProps extends Omit<EmptyStateProps, 'type' | 'icon' | 'actions'> {
  onRetry?: () => void;
  error?: string;
}

export const ErrorEmptyState: React.FC<ErrorEmptyStateProps> = ({
  onRetry,
  error,
  ...props
}) => {
  const title = 'Something went wrong';
  const description = error || 'An unexpected error occurred. Please try again or contact support if the problem persists.';

  const actions = onRetry ? (
    <button
      onClick={onRetry}
      className="btn btn-primary"
    >
      Try Again
    </button>
  ) : undefined;

  return (
    <EmptyState
      type="error"
      icon={iconMap.warning}
      title={title}
      description={description}
      actions={actions}
    />
  );
};

// Loading Empty State
interface LoadingEmptyStateProps {
  message?: string;
  showSpinner?: boolean;
}

export const LoadingEmptyState: React.FC<LoadingEmptyStateProps> = ({
  message = 'Loading...',
  showSpinner = true
}) => {
  const icon = showSpinner ? (
    <div className="animate-spin">
      {iconMap.refresh}
    </div>
  ) : iconMap.clock;

  return (
    <EmptyState
      type="loading"
      icon={icon}
      title={message}
      description="Please wait while we process your request."
    />
  );
};

// Success Empty State
interface SuccessEmptyStateProps extends Omit<EmptyStateProps, 'type' | 'icon' | 'actions'> {
  onAction?: () => void;
  actionText?: string;
}

export const SuccessEmptyState: React.FC<SuccessEmptyStateProps> = ({
  onAction,
  actionText = 'Continue',
  ...props
}) => {
  const actions = onAction ? (
    <button
      onClick={onAction}
      className="btn btn-primary"
    >
      {actionText}
    </button>
  ) : undefined;

  return (
    <EmptyState
      type="success"
      icon={iconMap.check}
      actions={actions}
      {...props}
    />
  );
};

// Info Empty State
interface InfoEmptyStateProps extends Omit<EmptyStateProps, 'type' | 'icon'> {
  onAction?: () => void;
  actionText?: string;
}

export const InfoEmptyState: React.FC<InfoEmptyStateProps> = ({
  onAction,
  actionText = 'Learn More',
  ...props
}) => {
  const actions = onAction ? (
    <button
      onClick={onAction}
      className="btn btn-secondary"
    >
      {actionText}
    </button>
  ) : undefined;

  return (
    <EmptyState
      type="info"
      icon={iconMap.lightbulb}
      actions={actions}
      {...props}
    />
  );
};

// Specialized Empty States for Specific Use Cases

// Jobs Empty State
export const JobsEmptyState: React.FC<{ onSearchJobs?: () => void }> = ({ onSearchJobs }) => {
  return (
    <NoDataEmptyState
      dataType="jobs"
      title="No jobs found"
      description="Start your job search by adding applications or adjusting your preferences."
      onAction={onSearchJobs}
      actionText="Search Jobs"
    />
  );
};

// Applications Empty State
export const ApplicationsEmptyState: React.FC<{ onApplyJobs?: () => void }> = ({ onApplyJobs }) => {
  return (
    <NoDataEmptyState
      dataType="applications"
      title="No applications yet"
      description="Your job applications will appear here once you start applying to positions."
      onAction={onApplyJobs}
      actionText="Start Applying"
    />
  );
};

// Resume Empty State
export const ResumeEmptyState: React.FC<{ onUploadResume?: () => void }> = ({ onUploadResume }) => {
  return (
    <NoDataEmptyState
      dataType="resumes"
      title="No resume uploaded"
      description="Upload your resume to get personalized job recommendations and AI-powered insights."
      onAction={onUploadResume}
      actionText="Upload Resume"
    />
  );
};

// Profile Empty State
export const ProfileEmptyState: React.FC<{ onCompleteProfile?: () => void }> = ({ onCompleteProfile }) => {
  return (
    <NoDataEmptyState
      dataType="profiles"
      title="Complete your profile"
      description="Add your information to get personalized job matching and better recommendations."
      onAction={onCompleteProfile}
      actionText="Complete Profile"
    />
  );
};

// Skills Empty State
export const SkillsEmptyState: React.FC<{ onAddSkills?: () => void }> = ({ onAddSkills }) => {
  return (
    <EmptyState
      type="no-data"
      icon={iconMap.academic}
      title="No skills added"
      description="Add your skills to improve job matching and get better recommendations."
      actions={
        onAddSkills ? (
          <button onClick={onAddSkills} className="btn btn-primary">
            Add Skills
          </button>
        ) : undefined
      }
    />
  );
};

// Location Empty State
export const LocationEmptyState: React.FC<{ onAddLocation?: () => void }> = ({ onAddLocation }) => {
  return (
    <EmptyState
      type="no-data"
      icon={iconMap.location}
      title="No locations specified"
      description="Add your preferred work locations to find relevant job opportunities."
      actions={
        onAddLocation ? (
          <button onClick={onAddLocation} className="btn btn-primary">
            Add Locations
          </button>
        ) : undefined
      }
    />
  );
};

// Salary Empty State
export const SalaryEmptyState: React.FC<{ onSetSalary?: () => void }> = ({ onSetSalary }) => {
  return (
    <EmptyState
      type="no-data"
      icon={iconMap.currency}
      title="No salary preferences set"
      description="Set your salary expectations to filter for appropriate positions."
      actions={
        onSetSalary ? (
          <button onClick={onSetSalary} className="btn btn-primary">
            Set Salary Range
          </button>
        ) : undefined
      }
    />
  );
};

// AI Processing Empty State
export const AIProcessingEmptyState: React.FC = () => {
  return (
    <LoadingEmptyState
      message="AI is processing your data"
      showSpinner={true}
    />
  );
};

// No Search Results Empty State
export const NoSearchResultsEmptyState: React.FC<{
  searchTerm: string;
  onClearSearch?: () => void;
}> = ({ searchTerm, onClearSearch }) => {
  return (
    <EmptyState
      type="no-results"
      icon={iconMap.search}
      title={`No results for "${searchTerm}"`}
      description="Try different keywords or check your spelling. You can also browse all available options."
      actions={
        onClearSearch ? (
          <button onClick={onClearSearch} className="btn btn-secondary">
            Clear Search
          </button>
        ) : undefined
      }
    />
  );
};

// Export all empty state components
export const EmptyStates = {
  EmptyState,
  NoDataEmptyState,
  NoResultsEmptyState,
  ErrorEmptyState,
  LoadingEmptyState,
  SuccessEmptyState,
  InfoEmptyState,
  JobsEmptyState,
  ApplicationsEmptyState,
  ResumeEmptyState,
  ProfileEmptyState,
  SkillsEmptyState,
  LocationEmptyState,
  SalaryEmptyState,
  AIProcessingEmptyState,
  NoSearchResultsEmptyState
};

export default EmptyState;
