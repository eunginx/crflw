// Email-based Applications Context
// This context manages job applications using email as the primary identifier

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useEmailUser } from './EmailUserContext';
import { emailApplicationsAPI } from '../services/apiService';

interface EmailJobApplication {
  id: string;
  email: string;
  title: string;
  company: string;
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';
  appliedDate?: string;
  jobUrl?: string;
  description?: string;
  salaryMin?: number;
  salaryMax?: number;
  location?: string;
  notes?: string;
  source?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

interface EmailApplicationStats {
  total_applications: number;
  saved: number;
  applied: number;
  interviews: number;
  offers: number;
  rejected: number;
  with_applied_date: number;
}

interface EmailApplicationsContextType {
  applications: EmailJobApplication[];
  stats: EmailApplicationStats | null;
  loading: boolean;
  error: string | null;
  status: { type: 'success' | 'error'; message: string } | null;
  // Application methods
  loadApplications: () => Promise<void>;
  createApplication: (applicationData: Partial<EmailJobApplication>) => Promise<void>;
  updateApplication: (id: string, updates: Partial<EmailJobApplication>) => Promise<void>;
  updateApplicationStatus: (id: string, status: string) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  // Filter methods
  getApplicationsByStatus: (status: string) => EmailJobApplication[];
  searchApplications: (searchTerm: string) => Promise<EmailJobApplication[]>;
  getApplicationsByCompany: (company: string) => Promise<EmailJobApplication[]>;
  // Status methods
  clearStatus: () => void;
  clearError: () => void;
}

const EmailApplicationsContext = createContext<EmailApplicationsContextType | undefined>(undefined);

export const useEmailApplications = () => {
  const context = useContext(EmailApplicationsContext);
  if (context === undefined) {
    throw new Error('useEmailApplications must be used within an EmailApplicationsProvider');
  }
  return context;
};

interface EmailApplicationsProviderProps {
  children: ReactNode;
}

export const EmailApplicationsProvider: React.FC<EmailApplicationsProviderProps> = ({ children }) => {
  const { currentUser } = useEmailUser();
  const [applications, setApplications] = useState<EmailJobApplication[]>([]);
  const [stats, setStats] = useState<EmailApplicationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Clear status and error methods
  const clearStatus = () => setStatus(null);
  const clearError = () => setError(null);

  // Load all applications for the current user
  const loadApplications = async () => {
    if (!currentUser?.email) {
      console.log('[EMAIL-APPLICATIONS] No current user, skipping applications load');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[EMAIL-APPLICATIONS] Loading applications for email:', currentUser.email);
      const [applicationsData, statsData] = await Promise.all([
        emailApplicationsAPI.getApplications(currentUser.email),
        emailApplicationsAPI.getStats(currentUser.email)
      ]);

      setApplications(applicationsData || []);
      setStats(statsData);
      console.log('[EMAIL-APPLICATIONS] Loaded', applicationsData?.length || 0, 'applications');
    } catch (error: any) {
      console.error('[EMAIL-APPLICATIONS] Failed to load applications:', error);
      setError(error.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  // Create a new application
  const createApplication = async (applicationData: Partial<EmailJobApplication>) => {
    if (!currentUser?.email) {
      setError('No authenticated user found');
      return;
    }

    try {
      console.log('[EMAIL-APPLICATIONS] Creating application for email:', currentUser.email);
      const newApplication = await emailApplicationsAPI.createApplication(currentUser.email, applicationData);
      
      setApplications(prev => [newApplication, ...prev]);
      setStatus({ type: 'success', message: 'Application created successfully!' });
      console.log('[EMAIL-APPLICATIONS] Application created successfully');
      
      // Refresh stats
      loadApplications();
    } catch (error: any) {
      console.error('[EMAIL-APPLICATIONS] Failed to create application:', error);
      setError(error.message || 'Failed to create application');
      setStatus({ type: 'error', message: error.message || 'Failed to create application' });
    }
  };

  // Update an existing application
  const updateApplication = async (id: string, updates: Partial<EmailJobApplication>) => {
    if (!currentUser?.email) {
      setError('No authenticated user found');
      return;
    }

    try {
      console.log('[EMAIL-APPLICATIONS] Updating application:', id);
      const updatedApplication = await emailApplicationsAPI.updateApplication(currentUser.email, id, updates);
      
      setApplications(prev => prev.map(app => 
        app.id === id ? updatedApplication : app
      ));
      setStatus({ type: 'success', message: 'Application updated successfully!' });
      console.log('[EMAIL-APPLICATIONS] Application updated successfully');
      
      // Refresh stats if status changed
      if (updates.status) {
        loadApplications();
      }
    } catch (error: any) {
      console.error('[EMAIL-APPLICATIONS] Failed to update application:', error);
      setError(error.message || 'Failed to update application');
      setStatus({ type: 'error', message: error.message || 'Failed to update application' });
    }
  };

  // Update application status
  const updateApplicationStatus = async (id: string, newStatus: string) => {
    if (!currentUser?.email) {
      setError('No authenticated user found');
      return;
    }

    try {
      console.log('[EMAIL-APPLICATIONS] Updating application status:', id, 'to', newStatus);
      const updatedApplication = await emailApplicationsAPI.updateApplicationStatus(currentUser.email, id, newStatus);
      
      setApplications(prev => prev.map(app => 
        app.id === id ? updatedApplication : app
      ));
      setStatus({ type: 'success', message: 'Application status updated successfully!' });
      console.log('[EMAIL-APPLICATIONS] Application status updated successfully');
      
      // Refresh stats
      loadApplications();
    } catch (error: any) {
      console.error('[EMAIL-APPLICATIONS] Failed to update application status:', error);
      setError(error.message || 'Failed to update application status');
      setStatus({ type: 'error', message: error.message || 'Failed to update application status' });
    }
  };

  // Delete an application
  const deleteApplication = async (id: string) => {
    if (!currentUser?.email) {
      setError('No authenticated user found');
      return;
    }

    try {
      console.log('[EMAIL-APPLICATIONS] Deleting application:', id);
      await emailApplicationsAPI.deleteApplication(currentUser.email, id);
      
      setApplications(prev => prev.filter(app => app.id !== id));
      setStatus({ type: 'success', message: 'Application deleted successfully!' });
      console.log('[EMAIL-APPLICATIONS] Application deleted successfully');
      
      // Refresh stats
      loadApplications();
    } catch (error: any) {
      console.error('[EMAIL-APPLICATIONS] Failed to delete application:', error);
      setError(error.message || 'Failed to delete application');
      setStatus({ type: 'error', message: error.message || 'Failed to delete application' });
    }
  };

  // Get applications by status (client-side filter)
  const getApplicationsByStatus = (status: string): EmailJobApplication[] => {
    return applications.filter(app => app.status === status);
  };

  // Search applications
  const searchApplications = async (searchTerm: string): Promise<EmailJobApplication[]> => {
    if (!currentUser?.email) {
      return [];
    }

    try {
      console.log('[EMAIL-APPLICATIONS] Searching applications for:', searchTerm);
      const searchResults = await emailApplicationsAPI.searchApplications(currentUser.email, searchTerm);
      return searchResults || [];
    } catch (error: any) {
      console.error('[EMAIL-APPLICATIONS] Failed to search applications:', error);
      setError(error.message || 'Failed to search applications');
      return [];
    }
  };

  // Get applications by company
  const getApplicationsByCompany = async (company: string): Promise<EmailJobApplication[]> => {
    if (!currentUser?.email) {
      return [];
    }

    try {
      console.log('[EMAIL-APPLICATIONS] Getting applications for company:', company);
      const companyApplications = await emailApplicationsAPI.getApplicationsByCompany(currentUser.email, company);
      return companyApplications || [];
    } catch (error: any) {
      console.error('[EMAIL-APPLICATIONS] Failed to get applications by company:', error);
      setError(error.message || 'Failed to get applications by company');
      return [];
    }
  };

  // Load applications when current user changes
  useEffect(() => {
    if (currentUser?.email) {
      loadApplications();
    } else {
      setApplications([]);
      setStats(null);
      setLoading(false);
    }
  }, [currentUser]);

  const value: EmailApplicationsContextType = {
    applications,
    stats,
    loading,
    error,
    status,
    loadApplications,
    createApplication,
    updateApplication,
    updateApplicationStatus,
    deleteApplication,
    getApplicationsByStatus,
    searchApplications,
    getApplicationsByCompany,
    clearStatus,
    clearError,
  };

  return (
    <EmailApplicationsContext.Provider value={value}>
      {children}
    </EmailApplicationsContext.Provider>
  );
};

export default EmailApplicationsContext;
