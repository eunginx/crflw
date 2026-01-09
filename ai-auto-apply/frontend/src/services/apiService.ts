// Programmatic API base URL configuration with environment detection
const getApiBaseUrl = () => {
  const env = process.env.REACT_APP_ENV || 'local';
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  
  if (env === 'docker' && backendUrl) {
    return backendUrl; // Use Docker network URL when provided
  }
  
  const backendPort = process.env.REACT_APP_BACKEND_PORT || '6001'; // Updated to match appdata service
  
  if (env === 'docker') {
    return `http://appdata:6000/api`; // Use Docker service name
  }
  
  return `http://localhost:${backendPort}/api`;
};

const API_BASE_URL = getApiBaseUrl();

// Development logging helper
const devLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] ${message}`, data);
  }
};

// Global error handler
const handleApiError = (error: any, context?: string) => {
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[API] Error${context ? ` in ${context}` : ''}:`, error);
  }
  
  // Attach error to window for debugging (dev only)
  if (process.env.NODE_ENV === 'development') {
    (window as any).__LAST_API_ERROR__ = error;
  }
  
  // Return enhanced error without stack trace for production
  const enhancedError = new Error(error.message || 'API request failed');
  Object.assign(enhancedError, {
    status: error.status,
    statusText: error.statusText,
    context
  });
  
  return enhancedError;
};

// Backend status tracking
let backendStatus: 'online' | 'offline' | 'checking' = 'checking';
let backendStatusCheckPromise: Promise<boolean> | null = null;

// Check backend status with debouncing
const checkBackendStatus = async (forceCheck = false): Promise<boolean> => {
  if (backendStatus === 'online' && !forceCheck) {
    return true;
  }
  
  if (backendStatusCheckPromise && !forceCheck) {
    return backendStatusCheckPromise;
  }
  
  backendStatusCheckPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        credentials: 'include',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      backendStatus = response.ok ? 'online' : 'offline';
      return backendStatus === 'online';
    } catch (error) {
      backendStatus = 'offline';
      return false;
    } finally {
      backendStatusCheckPromise = null;
    }
  })();
  
  return backendStatusCheckPromise;
};

// Base API call function with improved error handling
const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  // Check backend status first
  const isBackendOnline = await checkBackendStatus();
  if (!isBackendOnline) {
    throw handleApiError(
      new Error('Backend is currently offline'),
      `apiCall(${endpoint})`
    );
  }
  
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      (error as any).statusText = response.statusText;
      throw error;
    }

    return await response.json();
  } catch (error: any) {
    throw handleApiError(error, `apiCall(${endpoint})`);
  }
};

// User API
export const userAPI = {
  // Create or get user by Firebase UID
  async getOrCreateUser(firebaseUid: string, email: string) {
    return apiCall('/user', {
      method: 'POST',
      body: JSON.stringify({ firebaseUid, email }),
    });
  },

  // Update email verification status
  async updateEmailVerified(firebaseUid: string, verified: boolean) {
    return apiCall('/user/email-verified', {
      method: 'PUT',
      body: JSON.stringify({ firebaseUid, verified }),
    });
  },
};

// Profile API
export const profileAPI = {
  // Get user profile
  async getProfile(firebaseUid: string) {
    return apiCall(`/profile/${firebaseUid}`);
  },

  // Update user profile
  async updateProfile(firebaseUid: string, profileData: any) {
    return apiCall(`/profile/${firebaseUid}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Update resume status
  async updateResumeStatus(firebaseUid: string, uploaded: boolean, filename?: string, path?: string) {
    return apiCall(`/profile/${firebaseUid}/resume`, {
      method: 'PUT',
      body: JSON.stringify({ uploaded, filename, path }),
    });
  },
};

// Settings API
export const settingsAPI = {
  // Get user settings
  async getSettings(firebaseUid: string) {
    devLog('Getting settings for Firebase UID', firebaseUid);
    try {
      const endpoint = `/settings/${firebaseUid}`;
      devLog('Making API call to', endpoint);
      
      const result = await apiCall(endpoint);
      devLog('Settings retrieved successfully', result);
      return result;
    } catch (error: any) {
      const enhancedError = handleApiError(error, 'getSettings');
      
      // Handle different error types
      if (error.status === 404) {
        devLog('User not found (404), this is normal for new users');
        return null; // Return null for new users
      } else if (error.status === 500) {
        throw new Error('Server error when loading settings');
      } else if (error.status === 0) {
        throw new Error('Network error - unable to connect to server');
      } else {
        throw new Error(`Failed to load settings from database: ${error.message || 'Unknown error'}`);
      }
    }
  },

  // Update user settings
  async updateSettings(firebaseUid: string, settingsData: any) {
    return apiCall(`/settings/${firebaseUid}`, {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  },
};

// Health check API
export const healthAPI = {
  async check() {
    return apiCall('/health');
  },
};

// Test connection function
export const testConnection = async () => {
  try {
    const data = await healthAPI.check();
    devLog('Connection test successful', data);
    return true;
  } catch (error) {
    devLog('Connection test failed', error);
    return false;
  }
};

// Job Applications API
export const applicationsAPI = {
  // Get all applications for a user
  async getApplications(email: string): Promise<any[]> {
    devLog('Getting applications for email', email);
    try {
      const result = await apiCall(`/email/applications/${email}`);
      devLog('Applications retrieved', result);
      return result || [];
    } catch (error) {
      throw handleApiError(error, 'getApplications');
    }
  },

  // Create new application
  async createApplication(email: string, applicationData: any) {
    return apiCall(`/email/applications/${email}`, {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  },

  // Update application
  async updateApplication(email: string, applicationId: string, updates: any) {
    return apiCall(`/email/applications/${email}/${applicationId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete application
  async deleteApplication(email: string, applicationId: string) {
    return apiCall(`/email/applications/${email}/${applicationId}`, {
      method: 'DELETE',
    });
  },

  // Get applications by status
  async getApplicationsByStatus(email: string, status: string) {
    return apiCall(`/email/applications/${email}/status/${status}`);
  },

  // Get application statistics
  async getApplicationStats(email: string) {
    return apiCall(`/email/applications/${email}/stats`);
  },

  // Get recent applications
  async getRecentApplications(email: string, limit: number = 10) {
    return apiCall(`/email/applications/${email}/recent?limit=${limit}`);
  },
};

// User Preferences API
export const preferencesAPI = {
  // Get user preferences
  async getPreferences(firebaseUid: string) {
    return apiCall(`/preferences/${firebaseUid}`);
  },

  // Update user preferences
  async updatePreferences(firebaseUid: string, preferencesData: any) {
    return apiCall(`/preferences/${firebaseUid}`, {
      method: 'PUT',
      body: JSON.stringify(preferencesData),
    });
  },
};

// Resume Files API (Email-based with file storage)
export const resumesEmailAPI = {
  // Get all resume files for a user by email
  async getResumes(email: string) {
    devLog('Getting resumes for email', email);
    try {
      const result = await apiCall(`/email/resumes/${encodeURIComponent(email)}`);
      devLog('Resumes retrieved', result);
      return result || [];
    } catch (error) {
      throw handleApiError(error, 'getResumes');
    }
  },

  // Get active resume for a user by email
  async getActiveResume(email: string) {
    devLog('Getting active resume for email', email);
    try {
      const result = await apiCall(`/email/resumes/${encodeURIComponent(email)}/active`);
      devLog('Active resume retrieved', result);
      return result;
    } catch (error: any) {
      if (error.status === 404) {
        devLog('No active resume found');
        return null;
      }
      throw handleApiError(error, 'getActiveResume');
    }
  },

  // Upload new resume file (supports FormData)
  async uploadResume(email: string, file: File) {
    devLog('Uploading resume', { email, fileName: file.name });
    
    const formData = new FormData();
    formData.append('file', file);
    
    const url = `${API_BASE_URL}/email/resumes/${encodeURIComponent(email)}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        (error as any).status = response.status;
        (error as any).statusText = response.statusText;
        throw error;
      }

      const result = await response.json();
      devLog('Resume uploaded successfully', result);
      return result;
    } catch (error: any) {
      throw handleApiError(error, 'uploadResume');
    }
  },

  // Set active resume
  async setActiveResume(email: string, resumeId: string) {
    devLog('Setting active resume', { email, resumeId });
    return apiCall(`/email/resumes/${encodeURIComponent(email)}/${resumeId}/active`, {
      method: 'PUT',
    });
  },

  // Delete resume file
  async deleteResume(email: string, resumeId: string) {
    devLog('Deleting resume', { email, resumeId });
    return apiCall(`/email/resumes/${encodeURIComponent(email)}/${resumeId}`, {
      method: 'DELETE',
    });
  },

  // Download resume file
  async downloadResume(resumeId: string): Promise<Blob> {
    devLog('Downloading resume', resumeId);
    
    const url = `${API_BASE_URL}/email/resumes/file/${resumeId}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        (error as any).status = response.status;
        (error as any).statusText = response.statusText;
        throw error;
      }

      return await response.blob();
    } catch (error: any) {
      throw handleApiError(error, 'downloadResume');
    }
  },
};

// Email-based Resume API
export const resumesAPI = resumesEmailAPI;
// This is the new unified API that provides all user data in a single endpoint

export const emailUserDataAPI = {
  // Get all user data by email
  async getUserData(email: string) {
    if (!email || email.trim() === '') {
      const error = new Error('Email parameter is required');
      (error as any).status = 400;
      throw error;
    }
    
    devLog('Getting user data for email', email);
    return apiCall(`/email/user-data/${encodeURIComponent(email)}`);
  },

  // Update user data by email
  async updateUserData(email: string, data: {
    profile?: any;
    settings?: any;
    onboarding?: any;
  }) {
    if (!email || email.trim() === '') {
      const error = new Error('Email parameter is required');
      (error as any).status = 400;
      throw error;
    }
    
    devLog('Updating user data for email', email);
    return apiCall(`/email/user-data/${encodeURIComponent(email)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ===== EMAIL-BASED API SERVICE =====
// This is the new email-based API service that treats email as primary identifier

// Email-based User API
export const emailUserAPI = {
  // Create or get user by email
  async getOrCreateUser(email: string, userData: any = {}) {
    devLog('Creating/updating user for email', email);
    return apiCall('/email/user', {
      method: 'POST',
      body: JSON.stringify({ email, ...userData }),
    });
  },

  // Find user by email
  async findByEmail(email: string) {
    devLog('Finding user by email', email);
    return apiCall(`/email/user/${email}`);
  },

  // Find user by Firebase UID (for compatibility)
  async findByFirebaseUid(firebaseUid: string) {
    devLog('Finding user by Firebase UID', firebaseUid);
    return apiCall(`/email/user/firebase/${firebaseUid}`);
  },
};

// Email-based Settings API
export const emailSettingsAPI = {
  // Get user settings by email
  async getSettings(email: string) {
    devLog('Getting settings for email', email);
    try {
      const result = await apiCall(`/email/settings/${email}`);
      devLog('Settings retrieved', result);
      return result;
    } catch (error: any) {
      const enhancedError = handleApiError(error, 'emailSettings.getSettings');
      
      // Handle different error types
      if (error.status === 404) {
        devLog('User not found (404), this is normal for new users');
        return null; // Return null for new users
      } else if (error.status === 500) {
        throw new Error('Server error when loading settings');
      } else {
        throw new Error('Failed to load settings from database');
      }
    }
  },

  // Update user settings by email
  async updateSettings(email: string, settingsData: any) {
    devLog('Updating settings for email', email);
    return apiCall(`/email/settings/${email}`, {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  },

  // Update specific settings fields
  async patchSettings(email: string, fields: any) {
    devLog('Patching settings for email', email);
    return apiCall(`/email/settings/${email}`, {
      method: 'PATCH',
      body: JSON.stringify(fields),
    });
  },

  // Delete settings by email
  async deleteSettings(email: string) {
    devLog('Deleting settings for email', email);
    return apiCall(`/email/settings/${email}`, {
      method: 'DELETE',
    });
  },
};

// Email-based Job Applications API
export const emailApplicationsAPI = {
  // Get all applications for a user by email
  async getApplications(email: string): Promise<any[]> {
    devLog('Getting applications for email', email);
    try {
      const result = await apiCall(`/email/applications/${email}`);
      devLog('Applications retrieved', result);
      return result || [];
    } catch (error) {
      throw handleApiError(error, 'emailApplications.getApplications');
    }
  },

  // Get applications by status for a user by email
  async getApplicationsByStatus(email: string, status: string) {
    devLog('Getting applications for email', { email, status });
    return apiCall(`/email/applications/${email}/status/${status}`);
  },

  // Get specific application by ID and email
  async getApplication(email: string, applicationId: string) {
    devLog('Getting application', { email, applicationId });
    return apiCall(`/email/applications/${email}/${applicationId}`);
  },

  // Create new application by email
  async createApplication(email: string, applicationData: any) {
    devLog('Creating application for email', email);
    return apiCall(`/email/applications/${email}`, {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  },

  // Update application by ID and email
  async updateApplication(email: string, applicationId: string, updates: any) {
    devLog('Updating application', { email, applicationId });
    return apiCall(`/email/applications/${email}/${applicationId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Update application status by ID and email
  async updateApplicationStatus(email: string, applicationId: string, status: string) {
    devLog('Updating application status', { applicationId, status });
    return apiCall(`/email/applications/${email}/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Delete application by ID and email
  async deleteApplication(email: string, applicationId: string) {
    devLog('Deleting application', { email, applicationId });
    return apiCall(`/email/applications/${email}/${applicationId}`, {
      method: 'DELETE',
    });
  },

  // Get application statistics for a user by email
  async getStats(email: string) {
    devLog('Getting stats for email', email);
    return apiCall(`/email/applications/${email}/stats`);
  },

  // Search applications for a user by email
  async searchApplications(email: string, searchTerm: string) {
    devLog('Searching applications', { email, searchTerm });
    return apiCall(`/email/applications/${email}/search?q=${encodeURIComponent(searchTerm)}`);
  },

  // Get recent applications for a user by email
  async getRecentApplications(email: string, limit: number = 10) {
    devLog('Getting recent applications', { email, limit });
    return apiCall(`/email/applications/${email}/recent?limit=${limit}`);
  },

  // Get applications by company for a user by email
  async getApplicationsByCompany(email: string, company: string) {
    devLog('Getting applications by company', { email, company });
    return apiCall(`/email/applications/${email}/company/${encodeURIComponent(company)}`);
  },
};

// Email-based Analytics API
export const emailAnalyticsAPI = {
  // Get salary statistics
  async getSalaryStats() {
    devLog('Getting salary statistics');
    return apiCall('/email/settings/analytics/salary');
  },

  // Get popular locations
  async getPopularLocations(limit: number = 10) {
    devLog('Getting popular locations', { limit });
    return apiCall(`/email/settings/analytics/locations?limit=${limit}`);
  },

  // Get popular keywords
  async getPopularKeywords(limit: number = 20) {
    devLog('Getting popular keywords', { limit });
    return apiCall(`/email/settings/analytics/keywords?limit=${limit}`);
  },

  // Get users by specific setting
  async getUsersBySetting(settingName: string, settingValue: any) {
    devLog('Getting users by setting', { settingName, settingValue });
    return apiCall(`/email/settings/analytics/users/${settingName}/${settingValue}`);
  },
};

// Job Statuses API
export const jobStatusesAPI = {
  // Get all job statuses
  async getStatuses(options?: { includeHidden?: boolean; category?: string; groupLabel?: string }) {
    devLog('Getting job statuses with options', options);
    const params = new URLSearchParams();
    if (options?.includeHidden) params.append('includeHidden', 'true');
    if (options?.category) params.append('category', options.category);
    if (options?.groupLabel) params.append('groupLabel', options.groupLabel);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/job-statuses${query}`);
  },

  // Get enhanced statuses with computed fields
  async getEnhancedStatuses(options?: { includeHidden?: boolean }) {
    devLog('Getting enhanced job statuses');
    const params = new URLSearchParams();
    if (options?.includeHidden) params.append('includeHidden', 'true');
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/job-statuses/enhanced${query}`);
  },

  // Get statuses grouped by category
  async getStatusGroups() {
    devLog('Getting job status groups');
    return apiCall('/job-statuses/groups');
  },

  // Get analytics data
  async getAnalyticsData() {
    devLog('Getting analytics data');
    return apiCall('/job-statuses/analytics');
  },

  // Get specific status by key
  async getStatus(key: string) {
    devLog('Getting status', key);
    return apiCall(`/job-statuses/${key}`);
  },

  // Create new status (admin only)
  async createStatus(statusData: any) {
    devLog('Creating new status');
    return apiCall('/job-statuses', {
      method: 'POST',
      body: JSON.stringify(statusData),
    });
  },

  // Update status (admin only)
  async updateStatus(id: string, updates: any) {
    devLog('Updating status', id);
    return apiCall(`/job-statuses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete status (admin only)
  async deleteStatus(id: string) {
    devLog('Deleting status', id);
    return apiCall(`/job-statuses/${id}`, {
      method: 'DELETE',
    });
  },
};
