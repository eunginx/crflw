import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jobStatusesAPI } from '../services/apiService';

// Types for job status system
export interface JobStatusType {
  id: number;
  key: string;
  label: string;
  icon: string;
  color: string;
  description?: string;
  sort_order: number;
  ui_classes: {
    chip?: string;
    bg?: string;
    text?: string;
    border?: string;
  };
  category?: 'positive' | 'negative' | 'neutral' | 'system';
  counts_towards: string[];
  ai_advice?: string;
  ai_next_step_action?: string;
  timeline_icon?: string;
  animation: 'pulse' | 'bounce' | 'none';
  hidden: boolean;
  experimental: boolean;
  group_label?: string;
  created_at: string;
  updated_at: string;
}

export interface EnhancedJobStatusType extends JobStatusType {
  full_chip_class?: string;
  lifecycle_stage?: 'progressing' | 'closed' | 'pre_application' | 'active';
  dashboard_priority?: number;
}

export interface JobStatusGroup {
  group_label: string;
  statuses: JobStatusType[];
}

export interface JobStatusAnalytics {
  category: string;
  statuses: JobStatusType[];
}

interface JobStatusContextType {
  statuses: JobStatusType[];
  enhancedStatuses: EnhancedJobStatusType[];
  statusGroups: JobStatusGroup[];
  analyticsData: JobStatusAnalytics[];
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshStatuses: () => Promise<void>;
  getStatusByKey: (key: string) => JobStatusType | undefined;
  getStatusesByCategory: (category: string) => JobStatusType[];
  getStatusesByGroup: (groupLabel: string) => JobStatusType[];
  getPositiveStatuses: () => JobStatusType[];
  getNegativeStatuses: () => JobStatusType[];
  getNeutralStatuses: () => JobStatusType[];
  getSystemStatuses: () => JobStatusType[];
  
  // Computed properties
  statusOptions: { value: string; label: string; icon: string; color: string }[];
  statusKeyToLabelMap: Record<string, string>;
  statusKeyToIconMap: Record<string, string>;
  statusKeyToColorMap: Record<string, string>;
}

const JobStatusContext = createContext<JobStatusContextType | undefined>(undefined);

export const JobStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [statuses, setStatuses] = useState<JobStatusType[]>([]);
  const [enhancedStatuses, setEnhancedStatuses] = useState<EnhancedJobStatusType[]>([]);
  const [statusGroups, setStatusGroups] = useState<JobStatusGroup[]>([]);
  const [analyticsData, setAnalyticsData] = useState<JobStatusAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatuses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[JOB-STATUS][CONTEXT] Loading job statuses...');
      
      // Load all status data in parallel
      const [statusesData, enhancedData, groupsData, analyticsData] = await Promise.all([
        jobStatusesAPI.getStatuses(),
        jobStatusesAPI.getEnhancedStatuses(),
        jobStatusesAPI.getStatusGroups(),
        jobStatusesAPI.getAnalyticsData(),
      ]);
      
      console.log('[JOB-STATUS][CONTEXT] Statuses loaded:', { 
        statuses: statusesData.length,
        enhanced: enhancedData.length,
        groups: groupsData.length,
        analytics: analyticsData.length 
      });
      
      setStatuses(statusesData);
      setEnhancedStatuses(enhancedData);
      setStatusGroups(groupsData);
      setAnalyticsData(analyticsData);
    } catch (err: any) {
      console.error('[JOB-STATUS][CONTEXT] Failed to load statuses:', err);
      setError(err.message || 'Failed to load job statuses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  // Helper functions
  const getStatusByKey = useCallback((key: string) => {
    return statuses.find(status => status.key === key);
  }, [statuses]);

  const getStatusesByCategory = useCallback((category: string) => {
    return statuses.filter(status => status.category === category);
  }, [statuses]);

  const getStatusesByGroup = useCallback((groupLabel: string) => {
    return statuses.filter(status => status.group_label === groupLabel);
  }, [statuses]);

  const getPositiveStatuses = useCallback(() => {
    return statuses.filter(status => status.category === 'positive');
  }, [statuses]);

  const getNegativeStatuses = useCallback(() => {
    return statuses.filter(status => status.category === 'negative');
  }, [statuses]);

  const getNeutralStatuses = useCallback(() => {
    return statuses.filter(status => status.category === 'neutral');
  }, [statuses]);

  const getSystemStatuses = useCallback(() => {
    return statuses.filter(status => status.category === 'system');
  }, [statuses]);

  // Computed properties
  const statusOptions = statuses.map(status => ({
    value: status.key,
    label: status.label,
    icon: status.icon,
    color: status.color,
  }));

  const statusKeyToLabelMap = statuses.reduce((acc, status) => {
    acc[status.key] = status.label;
    return acc;
  }, {} as Record<string, string>);

  const statusKeyToIconMap = statuses.reduce((acc, status) => {
    acc[status.key] = status.icon;
    return acc;
  }, {} as Record<string, string>);

  const statusKeyToColorMap = statuses.reduce((acc, status) => {
    acc[status.key] = status.color;
    return acc;
  }, {} as Record<string, string>);

  const value: JobStatusContextType = {
    statuses,
    enhancedStatuses,
    statusGroups,
    analyticsData,
    loading,
    error,
    refreshStatuses: loadStatuses,
    getStatusByKey,
    getStatusesByCategory,
    getStatusesByGroup,
    getPositiveStatuses,
    getNegativeStatuses,
    getNeutralStatuses,
    getSystemStatuses,
    statusOptions,
    statusKeyToLabelMap,
    statusKeyToIconMap,
    statusKeyToColorMap,
  };

  return (
    <JobStatusContext.Provider value={value}>
      {children}
    </JobStatusContext.Provider>
  );
};

export const useJobStatuses = () => {
  const context = useContext(JobStatusContext);
  if (context === undefined) {
    throw new Error('useJobStatuses must be used within a JobStatusProvider');
  }
  return context;
};

// Utility hooks for specific use cases
export const useStatusOptions = () => {
  const { statusOptions } = useJobStatuses();
  return statusOptions;
};

export const useStatusByKey = (key: string) => {
  const { getStatusByKey } = useJobStatuses();
  return getStatusByKey(key);
};

export const useStatusesByCategory = (category: string) => {
  const { getStatusesByCategory } = useJobStatuses();
  return getStatusesByCategory(category);
};

export const usePositiveStatuses = () => {
  const { getPositiveStatuses } = useJobStatuses();
  return getPositiveStatuses();
};

export const useNegativeStatuses = () => {
  const { getNegativeStatuses } = useJobStatuses();
  return getNegativeStatuses();
};
