import React from 'react';
import { 
  SparklesIcon, 
  DocumentTextIcon, 
  UserCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Loading Skeleton Component
interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  height = 'h-4', 
  width = 'w-full',
  variant = 'rectangular',
  lines = 1
}) => {
  const baseClasses = 'skeleton animate-pulse';
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full'
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${variantClasses[variant]} ${height} ${
              i === lines - 1 ? 'w-3/4' : width
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${height} ${width} ${className}`}
    />
  );
};

// Loading Spinner Component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
  label
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const colorClasses = {
    primary: 'border-blue-600 border-t-transparent',
    secondary: 'border-gray-600 border-t-transparent',
    success: 'border-green-600 border-t-transparent',
    warning: 'border-yellow-600 border-t-transparent',
    error: 'border-red-600 border-t-transparent'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`loading-spinner ${sizeClasses[size]} ${colorClasses[color]}`}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && (
        <span className="text-sm text-gray-600">{label}</span>
      )}
    </div>
  );
};

// Page Loading Component
interface PageLoadingProps {
  message?: string;
  icon?: 'sparkles' | 'document' | 'user' | 'refresh';
  showProgress?: boolean;
  progress?: number;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  message = 'Loading...',
  icon = 'sparkles',
  showProgress = false,
  progress = 0
}) => {
  const icons = {
    sparkles: <SparklesIcon className="w-12 h-12 text-blue-600" />,
    document: <DocumentTextIcon className="w-12 h-12 text-blue-600" />,
    user: <UserCircleIcon className="w-12 h-12 text-blue-600" />,
    refresh: <ArrowPathIcon className="w-12 h-12 text-blue-600 animate-spin" />
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="animate-pulse">
          {icons[icon]}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">{message}</h3>
          <p className="text-sm text-gray-600">
            Please wait while we process your request
          </p>
        </div>

        {showProgress && (
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <LoadingSpinner size="md" color="primary" />
      </div>
    </div>
  );
};

// Card Loading Component
interface CardLoadingProps {
  showHeader?: boolean;
  showContent?: boolean;
  showActions?: boolean;
  contentLines?: number;
}

export const CardLoading: React.FC<CardLoadingProps> = ({
  showHeader = true,
  showContent = true,
  showActions = true,
  contentLines = 3
}) => {
  return (
    <div className="card">
      {showHeader && (
        <div className="card-header">
          <div className="flex items-center gap-3">
            <Skeleton width="w-10" height="h-10" variant="circular" />
            <div className="flex-1 space-y-2">
              <Skeleton width="w-1/3" height="h-4" variant="text" />
              <Skeleton width="w-1/2" height="h-3" variant="text" />
            </div>
          </div>
        </div>
      )}

      {showContent && (
        <div className="space-y-3">
          <Skeleton lines={contentLines} height="h-4" variant="text" />
          <Skeleton width="w-2/3" height="h-4" variant="text" />
        </div>
      )}

      {showActions && (
        <div className="flex gap-2 mt-4">
          <Skeleton width="w-20" height="h-8" variant="rectangular" />
          <Skeleton width="w-16" height="h-8" variant="rectangular" />
        </div>
      )}
    </div>
  );
};

// Table Loading Component
interface TableLoadingProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export const TableLoading: React.FC<TableLoadingProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        {showHeader && (
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: columns }, (_, i) => (
                <th key={i} className="px-6 py-3">
                  <Skeleton height="h-4" variant="text" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }, (_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <Skeleton height="h-4" variant="text" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// List Loading Component
interface ListLoadingProps {
  items?: number;
  showAvatar?: boolean;
  showDescription?: boolean;
}

export const ListLoading: React.FC<ListLoadingProps> = ({
  items = 5,
  showAvatar = true,
  showDescription = true
}) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }, (_, i) => (
        <div key={i} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
          {showAvatar && (
            <Skeleton width="w-10" height="h-10" variant="circular" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton width="w-1/3" height="h-4" variant="text" />
            {showDescription && (
              <>
                <Skeleton width="w-full" height="h-3" variant="text" />
                <Skeleton width="w-2/3" height="h-3" variant="text" />
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Form Loading Component
interface FormLoadingProps {
  fields?: number;
  showButtons?: boolean;
}

export const FormLoading: React.FC<FormLoadingProps> = ({
  fields = 4,
  showButtons = true
}) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton width="w-1/4" height="h-3" variant="text" />
          <Skeleton height="h-10" variant="rectangular" />
        </div>
      ))}
      
      {showButtons && (
        <div className="flex gap-3 pt-4">
          <Skeleton width="w-24" height="h-10" variant="rectangular" />
          <Skeleton width="w-20" height="h-10" variant="rectangular" />
        </div>
      )}
    </div>
  );
};

// Chart Loading Component
interface ChartLoadingProps {
  type?: 'bar' | 'line' | 'pie';
  showLegend?: boolean;
}

export const ChartLoading: React.FC<ChartLoadingProps> = ({
  type = 'bar',
  showLegend = true
}) => {
  const renderChartSkeleton = () => {
    switch (type) {
      case 'bar':
        return (
          <div className="flex items-end gap-2 h-32">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton
                key={i}
                width="w-8"
                height={`h-${Math.floor(Math.random() * 20 + 8)}`}
                variant="rectangular"
                className="flex-1"
              />
            ))}
          </div>
        );
      case 'line':
        return (
          <div className="h-32 relative">
            <Skeleton height="h-full" variant="rectangular" />
          </div>
        );
      case 'pie':
        return (
          <div className="flex justify-center">
            <Skeleton width="w-32" height="h-32" variant="circular" />
          </div>
        );
      default:
        return <Skeleton height="h-32" variant="rectangular" />;
    }
  };

  return (
    <div className="space-y-4">
      {renderChartSkeleton()}
      
      {showLegend && (
        <div className="flex justify-center gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton width="w-3" height="h-3" variant="rectangular" />
              <Skeleton width="w-16" height="h-3" variant="text" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Loading Overlay Component
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  children
}) => {
  return (
    <div className="relative">
      {children}
      
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="lg" color="primary" />
            <span className="text-sm text-gray-600">{message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Empty State with Loading
interface EmptyStateLoadingProps {
  title?: string;
  description?: string;
  icon?: 'sparkles' | 'document' | 'user';
}

export const EmptyStateLoading: React.FC<EmptyStateLoadingProps> = ({
  title = 'Loading content...',
  description = 'Please wait while we fetch your data',
  icon = 'sparkles'
}) => {
  const icons = {
    sparkles: <SparklesIcon className="w-16 h-16 text-gray-400" />,
    document: <DocumentTextIcon className="w-16 h-16 text-gray-400" />,
    user: <UserCircleIcon className="w-16 h-16 text-gray-400" />
  };

  return (
    <div className="text-center py-12">
      <div className="animate-pulse">
        {icons[icon]}
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
      <div className="mt-6 flex justify-center">
        <LoadingSpinner size="md" color="primary" />
      </div>
    </div>
  );
};

// Export all loading components
export const LoadingStates = {
  Skeleton,
  LoadingSpinner,
  PageLoading,
  CardLoading,
  TableLoading,
  ListLoading,
  FormLoading,
  ChartLoading,
  LoadingOverlay,
  EmptyStateLoading
};

export default LoadingStates;
