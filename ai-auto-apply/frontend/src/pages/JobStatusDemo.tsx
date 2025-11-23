import React, { useState } from 'react';
import { 
  StatusChip, 
  StatusIcon, 
  StatusBadge, 
  StatusSelect, 
  StatusProgress, 
  StatusGrid,
  StatusTimelineIcon
} from '../components/StatusComponents';
import { 
  StatusAnalyticsCard,
  StatusDistributionChart,
  StatusFunnelChart,
  StatusTimeline,
  StatusInsights
} from '../components/StatusAnalytics';
import { useJobStatuses } from '../context/JobStatusContext';

const JobStatusDemo: React.FC = () => {
  const { 
    statuses, 
    enhancedStatuses, 
    statusGroups, 
    analyticsData,
    getPositiveStatuses,
    getNegativeStatuses,
    getNeutralStatuses,
    getSystemStatuses
  } = useJobStatuses();

  const [selectedStatus, setSelectedStatus] = useState('applied');
  const [gridSelectedStatus, setGridSelectedStatus] = useState<string | undefined>(undefined);

  // Sample data for analytics
  const sampleApplications = [
    { status: 'saved', applied_date: '2024-01-15' },
    { status: 'applied', applied_date: '2024-01-10' },
    { status: 'applied', applied_date: '2024-01-08' },
    { status: 'interview', applied_date: '2024-01-05' },
    { status: 'offer', applied_date: '2024-01-01' },
    { status: 'rejected', applied_date: '2024-01-12' },
  ];

  const sampleDistribution = [
    { status: 'saved', count: 15 },
    { status: 'applied', count: 23 },
    { status: 'interview', count: 8 },
    { status: 'offer', count: 3 },
    { status: 'rejected', count: 12 },
  ];

  const sampleFunnel = [
    { status: 'saved', count: 50, conversionRate: 100 },
    { status: 'applied', count: 35, conversionRate: 70 },
    { status: 'interview', count: 15, conversionRate: 42.9 },
    { status: 'offer', count: 5, conversionRate: 33.3 },
  ];

  const sampleTimeline = [
    {
      id: '1',
      status: 'saved',
      date: '2024-01-15',
      title: 'Job Saved',
      description: 'Found interesting position at Tech Corp'
    },
    {
      id: '2',
      status: 'applied',
      date: '2024-01-16',
      title: 'Application Submitted',
      description: 'Submitted resume and cover letter'
    },
    {
      id: '3',
      status: 'interview',
      date: '2024-01-20',
      title: 'Interview Scheduled',
      description: 'Technical interview with hiring manager'
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Job Status System Demo</h1>
        <p className="text-lg text-gray-600">
          Comprehensive demonstration of the enhanced job status system with database-driven configuration,
          improved icons, analytics, and AI insights.
        </p>
      </div>

      {/* Status Chips Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Status Chips</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">All Statuses</h3>
            <div className="flex flex-wrap gap-3">
              {statuses.map((status) => (
                <StatusChip key={status.key} status={status} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Different Sizes</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-16">Small:</span>
                <StatusChip status="applied" size="sm" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-16">Medium:</span>
                <StatusChip status="interview" size="md" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-16">Large:</span>
                <StatusChip status="offer" size="lg" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Variations</h3>
            <div className="flex flex-wrap gap-3">
              <StatusChip status="applied" showLabel={false} />
              <StatusChip status="interview" showIcon={false} />
              <StatusChip status="offer" animation={false} />
            </div>
          </div>
        </div>
      </section>

      {/* Status Icons Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Status Icons</h2>
        <div className="flex flex-wrap gap-4">
          {statuses.map((status) => (
            <div key={status.key} className="text-center">
              <StatusIcon status={status} size="lg" className="mb-2" />
              <p className="text-xs text-gray-600">{status.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline Icons */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Timeline Icons</h2>
        <div className="flex gap-6">
          <StatusTimelineIcon status="saved" isCompleted={true} />
          <StatusTimelineIcon status="applied" isCompleted={true} />
          <StatusTimelineIcon status="interview" isActive={true} />
          <StatusTimelineIcon status="offer" />
          <StatusTimelineIcon status="rejected" />
        </div>
      </section>

      {/* Status Badges */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Status Badges</h2>
        <div className="flex flex-wrap gap-3">
          <StatusBadge status="applied" count={23} />
          <StatusBadge status="interview" count={8} />
          <StatusBadge status="offer" count={3} />
          <StatusBadge status="rejected" count={12} showCount={false} />
        </div>
      </section>

      {/* Status Select */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Status Selection</h2>
        <div className="max-w-sm">
          <StatusSelect
            value={selectedStatus}
            onChange={setSelectedStatus}
            placeholder="Select a status..."
          />
          <p className="mt-3 text-sm text-gray-600">
            Selected: <StatusChip status={selectedStatus} size="sm" />
          </p>
        </div>
      </section>

      {/* Status Progress */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Application Progress</h2>
        <StatusProgress currentStatus="interview" />
      </section>

      {/* Status Grid */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Interactive Status Grid</h2>
        <StatusGrid
          selectedStatus={gridSelectedStatus}
          onStatusSelect={(status) => setGridSelectedStatus(status.key)}
        />
        {gridSelectedStatus && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              Selected: <strong>{gridSelectedStatus}</strong>
            </p>
          </div>
        )}
      </section>

      {/* Analytics Cards */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Analytics Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusAnalyticsCard
            title="Total Applications"
            value={61}
            icon="📊"
            color="blue"
          />
          <StatusAnalyticsCard
            title="Success Rate"
            value="18.0%"
            icon="🎯"
            color="green"
            trend={{ value: 5.2, direction: 'up' }}
          />
          <StatusAnalyticsCard
            title="Rejection Rate"
            value="19.7%"
            icon="📉"
            color="red"
          />
          <StatusAnalyticsCard
            title="Need Follow-up"
            value={7}
            icon="⏰"
            color="yellow"
          />
        </div>
      </section>

      {/* Distribution Chart */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Status Distribution</h2>
        <StatusDistributionChart data={sampleDistribution} />
      </section>

      {/* Funnel Chart */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Application Funnel</h2>
        <StatusFunnelChart data={sampleFunnel} />
      </section>

      {/* Timeline */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Application Timeline</h2>
        <StatusTimeline events={sampleTimeline} />
      </section>

      {/* Status Insights */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">AI-Powered Insights</h2>
        <StatusInsights applications={sampleApplications} />
      </section>

      {/* Status Categories */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Status Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <h3 className="text-lg font-medium text-green-800 mb-3">Positive</h3>
            <div className="space-y-2">
              {getPositiveStatuses().map((status) => (
                <StatusChip key={status.key} status={status} size="sm" />
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-red-800 mb-3">Negative</h3>
            <div className="space-y-2">
              {getNegativeStatuses().map((status) => (
                <StatusChip key={status.key} status={status} size="sm" />
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Neutral</h3>
            <div className="space-y-2">
              {getNeutralStatuses().map((status) => (
                <StatusChip key={status.key} status={status} size="sm" />
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-blue-800 mb-3">System</h3>
            <div className="space-y-2">
              {getSystemStatuses().map((status) => (
                <StatusChip key={status.key} status={status} size="sm" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Status Data */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Enhanced Status Features</h2>
        <div className="bg-gray-50 p-6 rounded-lg">
          <pre className="text-sm overflow-auto">
            {JSON.stringify(enhancedStatuses.slice(0, 3), null, 2)}
          </pre>
        </div>
      </section>

      {/* Status Groups */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Status Groups</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {statusGroups.map((group) => (
            <div key={group.group_label} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                {group.group_label}
              </h3>
              <div className="space-y-2">
                {group.statuses.map((status) => (
                  <div key={status.key} className="flex items-center justify-between">
                    <StatusChip status={status} size="sm" />
                    <span className="text-xs text-gray-500">Order: {status.sort_order}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default JobStatusDemo;
