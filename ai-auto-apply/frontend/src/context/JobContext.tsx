import { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

interface Job {
  id: string;
  title: string;
  company: string;
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';
  appliedDate?: Date;
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

  useEffect(() => {
    if (!currentUser) {
      setJobs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      jobsQuery,
      (snapshot) => {
        const jobsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Job[];
        setJobs(jobsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching jobs:', error);
        setError('Failed to fetch jobs');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const addJob = async (job: Omit<Job, 'id'>) => {
    // Implementation for adding a job
    console.log('Adding job:', job);
  };

  const updateJob = async (id: string, updates: Partial<Job>) => {
    // Implementation for updating a job
    console.log('Updating job:', id, updates);
  };

  const deleteJob = async (id: string) => {
    // Implementation for deleting a job
    console.log('Deleting job:', id);
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
