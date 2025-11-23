import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { applicationsAPI, emailApplicationsAPI } from '../services/apiService';

interface JobApplicationData {
  id: string;
  title: string;
  company: string;
  status: string; // Now dynamic - any valid status from database
  applied_date?: string;
  job_url?: string;
  description?: string;
  salary_min?: number;
  salary_max?: number;
  location?: string;
  notes?: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  status: string; // Now dynamic - any valid status from database
  appliedDate?: Date;
  jobUrl?: string;
  description?: string;
  salaryMin?: number;
  salaryMax?: number;
  location?: string;
  notes?: string;
}

interface JobContextType {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  addJob: (job: Omit<Job, 'id'>) => Promise<void>;
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const loadJobs = useCallback(async () => {
    if (!currentUser?.email) {
      setJobs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('[JOBS][LOAD] Loading jobs from PostgreSQL...');
      const applications = await emailApplicationsAPI.getApplications(currentUser.email);
      console.log('[JOBS][LOAD] Applications loaded:', applications);
      
      const jobsData = (applications || []).map((app: JobApplicationData) => ({
        id: app.id,
        title: app.title,
        company: app.company,
        status: app.status,
        appliedDate: app.applied_date ? new Date(app.applied_date) : undefined,
        jobUrl: app.job_url,
        description: app.description,
        salaryMin: app.salary_min,
        salaryMax: app.salary_max,
        location: app.location,
        notes: app.notes,
      }));
      
      setJobs(jobsData);
    } catch (err) {
      console.error('[JOBS][ERROR] Failed to load jobs:', err);
      setError('Failed to load job applications');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadJobs();
  }, [currentUser, loadJobs]);

  const addJob = async (job: Omit<Job, 'id'>) => {
    if (!currentUser?.email) return;

    try {
      console.log('[JOBS][ADD] Adding new job:', job);
      const applicationData = {
        title: job.title,
        company: job.company,
        status: job.status,
        appliedDate: job.appliedDate,
      };
      
      const newApplication = await emailApplicationsAPI.createApplication(currentUser.email, applicationData);
      console.log('[JOBS][ADD] Job added successfully:', newApplication);
      
      // Reload jobs to get the latest data
      await loadJobs();
    } catch (err) {
      console.error('[JOBS][ERROR] Failed to add job:', err);
      setError('Failed to add job application');
    }
  };

  const updateJob = async (id: string, updates: Partial<Job>) => {
    if (!currentUser?.email) return;

    try {
      console.log('[JOBS][UPDATE] Updating job:', id, updates);
      
      const applicationUpdates = {
        title: updates.title,
        company: updates.company,
        status: updates.status,
        appliedDate: updates.appliedDate,
      };
      
      await emailApplicationsAPI.updateApplication(currentUser.email, id, applicationUpdates);
      console.log('[JOBS][UPDATE] Job updated successfully');
      
      // Reload jobs to get the latest data
      await loadJobs();
    } catch (err) {
      console.error('[JOBS][ERROR] Failed to update job:', err);
      setError('Failed to update job application');
    }
  };

  const deleteJob = async (id: string) => {
    if (!currentUser?.email) return;

    try {
      console.log('[JOBS][DELETE] Deleting job:', id);
      await emailApplicationsAPI.deleteApplication(currentUser.email, id);
      console.log('[JOBS][DELETE] Job deleted successfully');
      
      // Reload jobs to get the latest data
      await loadJobs();
    } catch (err) {
      console.error('[JOBS][ERROR] Failed to delete job:', err);
      setError('Failed to delete job application');
    }
  };

  const value = {
    jobs,
    loading,
    error,
    addJob,
    updateJob,
    deleteJob,
  };

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};

export const useJobs = () => {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error('useJobs must be used within a JobProvider');
  }
  return context;
};
