import React from 'react';
import { useJobStatuses, JobStatusType } from '../context/JobStatusContext';

interface StatusAnalyticsCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  className?: string;
}

export const StatusAnalyticsCard: React.FC<StatusAnalyticsCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
  className = '',
}) => {
  const colorClasses = {
    green: 'bg-green-50 text-green-800 border-green-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
    red: 'bg-red-50 text-red-800 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    gray: 'bg-gray-50 text-gray-800 border-gray-200',
  };

  const trendIcon = {
    up: '📈',
    down: '📉',
    neutral: '➡️',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]} ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-sm">
              <span>{trendIcon[trend.direction]}</span>
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
        <div className="text-3xl opacity-60">{icon}</div>
      </div>
    </div>
  );
};

interface StatusDistributionChartProps {
  data: Array<{ status: string; count: number; percentage?: number }>;
  className?: string;
}

export const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({
  data,
  className = '',
}) => {
  const { getStatusByKey } = useJobStatuses();

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
      
      <div className="space-y-3">
        {data.map((item) => {
          const statusData = getStatusByKey(item.status);
          const percentage = total > 0 ? (item.count / total) * 100 : 0;
          
          return (
            <div key={item.status} className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-lg">{statusData?.icon || '📄'}</span>
                <span className="text-sm font-medium text-gray-900">
                  {statusData?.label || item.status}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      statusData?.ui_classes?.bg?.replace('bg-', 'bg-') || 'bg-gray-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                <div className="text-right min-w-[60px]">
                  <div className="text-sm font-medium text-gray-900">{item.count}</div>
                  <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface StatusFunnelChartProps {
  data: Array<{ status: string; count: number; conversionRate?: number }>;
  className?: string;
}

export const StatusFunnelChart: React.FC<StatusFunnelChartProps> = ({
  data,
  className = '',
}) => {
  const { getStatusByKey } = useJobStatuses();

  if (data.length === 0) return null;

  const maxCount = Math.max(...data.map(item => item.count));

  return (
    <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Funnel</h3>
      
      <div className="space-y-2">
        {data.map((item, index) => {
          const statusData = getStatusByKey(item.status);
          const widthPercentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          
          return (
            <div key={item.status} className="relative">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-lg">{statusData?.icon || '📄'}</span>
                <span className="text-sm font-medium text-gray-900">
                  {statusData?.label || item.status}
                </span>
                <span className="text-sm text-gray-500">({item.count})</span>
                {item.conversionRate && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {item.conversionRate.toFixed(1)}%
                  </span>
                )}
              </div>
              
              <div className="relative bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                    statusData?.ui_classes?.bg?.replace('bg-', 'bg-') || 'bg-gray-500'
                  }`}
                  style={{ 
                    width: `${widthPercentage}%`,
                    marginLeft: `${(100 - widthPercentage) / 2}%`
                  }}
                />
              </div>
              
              {index < data.length - 1 && (
                <div className="flex justify-center my-1">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-gray-400"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface StatusTimelineProps {
  events: Array<{
    id: string;
    status: string;
    date: string;
    title?: string;
    description?: string;
  }>;
  className?: string;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  events,
  className = '',
}) => {
  const { getStatusByKey } = useJobStatuses();

  return (
    <div className={`space-y-4 ${className}`}>
      {events.map((event, index) => {
        const statusData = getStatusByKey(event.status);
        
        return (
          <div key={event.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                statusData?.ui_classes?.bg || 'bg-gray-100'
              } ${statusData?.ui_classes?.text || 'text-gray-800'}`}>
                <span>{statusData?.timeline_icon || statusData?.icon || '📄'}</span>
              </div>
              {index < events.length - 1 && (
                <div className="w-0.5 h-16 bg-gray-300 mt-2"></div>
              )}
            </div>
            
            <div className="flex-1 pb-8">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900">
                  {event.title || statusData?.label || event.status}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(event.date).toLocaleDateString()}
                </span>
              </div>
              
              {event.description && (
                <p className="text-sm text-gray-600">{event.description}</p>
              )}
              
              {statusData?.ai_advice && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-800">
                    💡 {statusData.ai_advice}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface StatusInsightsProps {
  applications: Array<{ status: string; applied_date?: string }>;
  className?: string;
}

export const StatusInsights: React.FC<StatusInsightsProps> = ({
  applications,
  className = '',
}) => {
  const { getPositiveStatuses, getNegativeStatuses, getStatusByKey } = useJobStatuses();

  const positiveStatuses = getPositiveStatuses();
  const negativeStatuses = getNegativeStatuses();

  // Calculate metrics
  const totalApplications = applications.length;
  const positiveCount = applications.filter(app => 
    positiveStatuses.some(status => status.key === app.status)
  ).length;
  
  const negativeCount = applications.filter(app => 
    negativeStatuses.some(status => status.key === app.status)
  ).length;

  const successRate = totalApplications > 0 ? (positiveCount / totalApplications) * 100 : 0;
  const rejectionRate = totalApplications > 0 ? (negativeCount / totalApplications) * 100 : 0;

  // Find most common status
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCommonStatus = Object.entries(statusCounts)
    .sort(([, a], [, b]) => b - a)[0];

  const mostCommonStatusData = mostCommonStatus ? getStatusByKey(mostCommonStatus[0]) : null;

  // Find applications needing follow-up
  const followUpCandidates = applications.filter(app => {
    const statusData = getStatusByKey(app.status);
    if (!statusData?.ai_next_step_action || !app.applied_date) return false;
    
    const daysSinceApplied = Math.floor(
      (Date.now() - new Date(app.applied_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceApplied > 7; // Older than 7 days
  });

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusAnalyticsCard
          title="Total Applications"
          value={totalApplications}
          icon="📊"
          color="blue"
        />
        
        <StatusAnalyticsCard
          title="Success Rate"
          value={`${successRate.toFixed(1)}%`}
          icon="🎯"
          color="green"
          trend={{
            value: 5.2,
            direction: 'up'
          }}
        />
        
        <StatusAnalyticsCard
          title="Rejection Rate"
          value={`${rejectionRate.toFixed(1)}%`}
          icon="📉"
          color="red"
        />
        
        <StatusAnalyticsCard
          title="Need Follow-up"
          value={followUpCandidates.length}
          icon="⏰"
          color="yellow"
        />
      </div>

      {mostCommonStatusData && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Most Common Status</h3>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{mostCommonStatusData.icon}</span>
            <div>
              <p className="font-medium text-gray-900">{mostCommonStatusData.label}</p>
              <p className="text-sm text-gray-500">
                {mostCommonStatus[1]} applications ({((mostCommonStatus[1] / totalApplications) * 100).toFixed(1)}%)
              </p>
            </div>
          </div>
          
          {mostCommonStatusData.ai_advice && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                💡 <strong>AI Insight:</strong> {mostCommonStatusData.ai_advice}
              </p>
            </div>
          )}
        </div>
      )}

      {followUpCandidates.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            ⏰ Applications Needing Follow-up
          </h3>
          <p className="text-sm text-yellow-700 mb-3">
            {followUpCandidates.length} applications haven't been updated in over 7 days.
          </p>
          <div className="space-y-2">
            {followUpCandidates.slice(0, 3).map((app, index) => {
              const statusData = getStatusByKey(app.status);
              return (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-yellow-800">
                    {statusData?.icon} {statusData?.label}
                  </span>
                  <span className="text-yellow-600">
                    {app.applied_date && new Date(app.applied_date).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
            {followUpCandidates.length > 3 && (
              <p className="text-xs text-yellow-600">
                ...and {followUpCandidates.length - 3} more
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
