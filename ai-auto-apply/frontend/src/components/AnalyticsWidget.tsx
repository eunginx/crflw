interface AnalyticsData {
  appliedThisWeek: number;
  interviewsScheduled: number;
  savedRoles: number;
  offersReceived: number;
  rejectionRate: number;
  averageResponseTime: number;
}

interface AnalyticsWidgetProps {
  jobs: any[];
  className?: string;
}

const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({ 
  jobs, 
  className = '' 
}) => {
  const calculateAnalytics = (): AnalyticsData => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const appliedThisWeek = jobs.filter(job => 
      job.status === 'applied' && 
      job.appliedDate && 
      job.appliedDate >= weekAgo
    ).length;
    
    const interviewsScheduled = jobs.filter(job => 
      job.status === 'interview'
    ).length;
    
    const savedRoles = jobs.filter(job => 
      job.status === 'saved'
    ).length;
    
    const offersReceived = jobs.filter(job => 
      job.status === 'offer'
    ).length;
    
    const totalProcessed = jobs.filter(job => 
      ['applied', 'interview', 'offer', 'rejected'].includes(job.status)
    ).length;
    
    const rejections = jobs.filter(job => 
      job.status === 'rejected'
    ).length;
    
    const rejectionRate = totalProcessed > 0 ? (rejections / totalProcessed) * 100 : 0;
    
    // Mock average response time (in real app, this would be calculated from actual data)
    const averageResponseTime = 5.2; // days

    return {
      appliedThisWeek,
      interviewsScheduled,
      savedRoles,
      offersReceived,
      rejectionRate,
      averageResponseTime
    };
  };

  const analytics = calculateAnalytics();

  const stats = [
    {
      label: 'Applied This Week',
      value: analytics.appliedThisWeek,
      icon: '📤',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      trend: (analytics.appliedThisWeek > 0 ? 'up' : 'neutral') as 'up' | 'neutral' | 'down'
    },
    {
      label: 'Interviews Scheduled',
      value: analytics.interviewsScheduled,
      icon: '📅',
      color: 'bg-green-50 text-green-700 border-green-200',
      trend: (analytics.interviewsScheduled > 0 ? 'up' : 'neutral') as 'up' | 'neutral' | 'down'
    },
    {
      label: 'Saved Roles',
      value: analytics.savedRoles,
      icon: '⭐',
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      trend: 'neutral' as 'up' | 'neutral' | 'down'
    },
    {
      label: 'Offers Received',
      value: analytics.offersReceived,
      icon: '🎉',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      trend: (analytics.offersReceived > 0 ? 'up' : 'neutral') as 'up' | 'neutral' | 'down'
    }
  ];

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">📊 Your Job Search Analytics</h3>
        <p className="text-sm text-gray-500">Track your job search progress</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className={`p-3 rounded-lg border ${stat.color}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-2xl">{stat.icon}</span>
              {stat.trend !== 'neutral' && (
                <span className="text-xs">{getTrendIcon(stat.trend)}</span>
              )}
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs opacity-75">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Additional Metrics */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Rejection Rate</span>
          <span className={`text-sm font-semibold ${
            analytics.rejectionRate > 50 ? 'text-red-600' : 
            analytics.rejectionRate > 25 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {analytics.rejectionRate.toFixed(1)}%
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Avg. Response Time</span>
          <span className="text-sm font-semibold text-gray-900">
            {analytics.averageResponseTime} days
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Applications</span>
          <span className="text-sm font-semibold text-gray-900">
            {jobs.filter(job => job.status === 'applied').length}
          </span>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <span className="text-blue-600 mt-0.5">💡</span>
          <div className="text-sm text-blue-800">
            {analytics.interviewsScheduled > 2 ? 
              "Great! You have multiple interviews scheduled. Keep preparing!" :
              analytics.appliedThisWeek > 5 ?
                "Excellent application activity this week!" :
                "Consider increasing your application rate for better results."
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsWidget;
