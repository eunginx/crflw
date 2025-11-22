// Programmatic API base URL configuration with environment detection
const getApiBaseUrl = () => {
  const env = process.env.REACT_APP_ENV || 'local';
  const backendPort = process.env.REACT_APP_BACKEND_PORT || '6001';
  
  if (env === 'docker') {
    return `http://localhost:8100/api`;
  }
  
  return `http://localhost:${backendPort}/api`;
};

const API_BASE_URL = getApiBaseUrl();
console.log("[API] Environment:", process.env.REACT_APP_ENV);
console.log("[API] Using base URL:", API_BASE_URL);

// Base API call function with improved error handling
const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
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
    console.error('[API] Error:', error);
    
    // Attach error to window for debugging
    (window as any).__LAST_API_ERROR__ = error;
    
    // Rethrow with more context
    const enhancedError = new Error(error.message || 'API request failed');
    Object.assign(enhancedError, error);
    throw enhancedError;
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
    console.log('[API][SETTINGS] Getting settings for Firebase UID:', firebaseUid);
    try {
      const endpoint = `/settings/${firebaseUid}`;
      console.log('[API][SETTINGS] Making API call to:', endpoint);
      
      const result = await apiCall(endpoint);
      console.log('[API][SETTINGS] Settings retrieved successfully:', result);
      return result;
    } catch (error: any) {
      console.error('[API][SETTINGS] Error getting settings:', error);
      console.error('[API][SETTINGS] Error details:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        stack: error.stack
      });
      
      // Handle different error types
      if (error.status === 404) {
        console.log('[API][SETTINGS] User not found (404), this is normal for new users');
        return null; // Return null for new users
      } else if (error.status === 500) {
        console.error('[API][SETTINGS] Server error (500)');
        throw new Error('Server error when loading settings');
      } else if (error.status === 0) {
        console.error('[API][SETTINGS] Network error or API unavailable');
        throw new Error('Network error - unable to connect to server');
      } else {
        console.error('[API][SETTINGS] Unknown error:', error);
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
    console.log('[API] Connection test successful:', data);
    return true;
  } catch (error) {
    console.error('[API] Connection test failed:', error);
    return false;
  }
};

// Job Applications API
export const applicationsAPI = {
  // Get all applications for a user
  async getApplications(email: string): Promise<any[]> {
    console.log('[API][APPLICATIONS] Getting applications for email:', email);
    try {
      const result = await apiCall(`/email/applications/${email}`);
      console.log('[API][APPLICATIONS] Applications retrieved:', result);
      return result || [];
    } catch (error) {
      console.error('[API][APPLICATIONS] Error getting applications:', error);
      throw error;
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

// Resume Files API
export const resumesAPI = {
  // Get all resume files
  async getResumes(firebaseUid: string) {
    return apiCall(`/resumes/${firebaseUid}`);
  },

  // Get active resume
  async getActiveResume(firebaseUid: string) {
    return apiCall(`/resumes/${firebaseUid}/active`);
  },

  // Upload new resume
  async uploadResume(firebaseUid: string, fileData: any) {
    return apiCall(`/resumes/${firebaseUid}`, {
      method: 'POST',
      body: JSON.stringify(fileData),
    });
  },

  // Deactivate resume
  async deactivateResume(firebaseUid: string, resumeId: string) {
    return apiCall(`/resumes/${firebaseUid}/${resumeId}`, {
      method: 'DELETE',
    });
  },
};

// ===== UNIFIED USER DATA API =====
// This is the new unified API that provides all user data in a single endpoint

export const emailUserDataAPI = {
  // Get all user data by email
  async getUserData(email: string) {
    if (!email || email.trim() === '') {
      const error = new Error('Email parameter is required');
      (error as any).status = 400;
      throw error;
    }
    
    console.log('[API][EMAIL-USER-DATA] Getting user data for email:', email);
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
    
    console.log('[API][EMAIL-USER-DATA] Updating user data for email:', email);
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
    console.log('[API][EMAIL-USER] Creating/updating user for email:', email);
    return apiCall('/email/user', {
      method: 'POST',
      body: JSON.stringify({ email, ...userData }),
    });
  },

  // Find user by email
  async findByEmail(email: string) {
    console.log('[API][EMAIL-USER] Finding user by email:', email);
    return apiCall(`/email/user/${email}`);
  },

  // Find user by Firebase UID (for compatibility)
  async findByFirebaseUid(firebaseUid: string) {
    console.log('[API][EMAIL-USER] Finding user by Firebase UID:', firebaseUid);
    return apiCall(`/email/user/firebase/${firebaseUid}`);
  },
};

// Email-based Settings API
export const emailSettingsAPI = {
  // Get user settings by email
  async getSettings(email: string) {
    console.log('[API][EMAIL-SETTINGS] Getting settings for email:', email);
    try {
      const result = await apiCall(`/email/settings/${email}`);
      console.log('[API][EMAIL-SETTINGS] Settings retrieved:', result);
      return result;
    } catch (error: any) {
      console.error('[API][EMAIL-SETTINGS] Error getting settings:', error);
      
      // Handle different error types
      if (error.status === 404) {
        console.log('[API][EMAIL-SETTINGS] User not found (404), this is normal for new users');
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
    console.log('[API][EMAIL-SETTINGS] Updating settings for email:', email);
    return apiCall(`/email/settings/${email}`, {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  },

  // Update specific settings fields
  async patchSettings(email: string, fields: any) {
    console.log('[API][EMAIL-SETTINGS] Patching settings for email:', email);
    return apiCall(`/email/settings/${email}`, {
      method: 'PATCH',
      body: JSON.stringify(fields),
    });
  },

  // Delete settings by email
  async deleteSettings(email: string) {
    console.log('[API][EMAIL-SETTINGS] Deleting settings for email:', email);
    return apiCall(`/email/settings/${email}`, {
      method: 'DELETE',
    });
  },
};

// Email-based Job Applications API
export const emailApplicationsAPI = {
  // Get all applications for a user by email
  async getApplications(email: string): Promise<any[]> {
    console.log('[API][EMAIL-APPLICATIONS] Getting applications for email:', email);
    try {
      const result = await apiCall(`/email/applications/${email}`);
      console.log('[API][EMAIL-APPLICATIONS] Applications retrieved:', result);
      return result || [];
    } catch (error) {
      console.error('[API][EMAIL-APPLICATIONS] Error getting applications:', error);
      throw error;
    }
  },

  // Get applications by status for a user by email
  async getApplicationsByStatus(email: string, status: string) {
    console.log('[API][EMAIL-APPLICATIONS] Getting applications for email:', email, 'status:', status);
    return apiCall(`/email/applications/${email}/status/${status}`);
  },

  // Get specific application by ID and email
  async getApplication(email: string, applicationId: string) {
    console.log('[API][EMAIL-APPLICATIONS] Getting application:', applicationId, 'for email:', email);
    return apiCall(`/email/applications/${email}/${applicationId}`);
  },

  // Create new application by email
  async createApplication(email: string, applicationData: any) {
    console.log('[API][EMAIL-APPLICATIONS] Creating application for email:', email);
    return apiCall(`/email/applications/${email}`, {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  },

  // Update application by ID and email
  async updateApplication(email: string, applicationId: string, updates: any) {
    console.log('[API][EMAIL-APPLICATIONS] Updating application:', applicationId, 'for email:', email);
    return apiCall(`/email/applications/${email}/${applicationId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Update application status by ID and email
  async updateApplicationStatus(email: string, applicationId: string, status: string) {
    console.log('[API][EMAIL-APPLICATIONS] Updating status:', status, 'for application:', applicationId);
    return apiCall(`/email/applications/${email}/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Delete application by ID and email
  async deleteApplication(email: string, applicationId: string) {
    console.log('[API][EMAIL-APPLICATIONS] Deleting application:', applicationId, 'for email:', email);
    return apiCall(`/email/applications/${email}/${applicationId}`, {
      method: 'DELETE',
    });
  },

  // Get application statistics for a user by email
  async getStats(email: string) {
    console.log('[API][EMAIL-APPLICATIONS] Getting stats for email:', email);
    return apiCall(`/email/applications/${email}/stats`);
  },

  // Search applications for a user by email
  async searchApplications(email: string, searchTerm: string) {
    console.log('[API][EMAIL-APPLICATIONS] Searching applications for email:', email, 'term:', searchTerm);
    return apiCall(`/email/applications/${email}/search?q=${encodeURIComponent(searchTerm)}`);
  },

  // Get recent applications for a user by email
  async getRecentApplications(email: string, limit: number = 10) {
    console.log('[API][EMAIL-APPLICATIONS] Getting recent applications for email:', email);
    return apiCall(`/email/applications/${email}/recent?limit=${limit}`);
  },

  // Get applications by company for a user by email
  async getApplicationsByCompany(email: string, company: string) {
    console.log('[API][EMAIL-APPLICATIONS] Getting applications for email:', email, 'company:', company);
    return apiCall(`/email/applications/${email}/company/${encodeURIComponent(company)}`);
  },
};

// Email-based Analytics API
export const emailAnalyticsAPI = {
  // Get salary statistics
  async getSalaryStats() {
    console.log('[API][EMAIL-ANALYTICS] Getting salary statistics');
    return apiCall('/email/settings/analytics/salary');
  },

  // Get popular locations
  async getPopularLocations(limit: number = 10) {
    console.log('[API][EMAIL-ANALYTICS] Getting popular locations, limit:', limit);
    return apiCall(`/email/settings/analytics/locations?limit=${limit}`);
  },

  // Get popular keywords
  async getPopularKeywords(limit: number = 20) {
    console.log('[API][EMAIL-ANALYTICS] Getting popular keywords, limit:', limit);
    return apiCall(`/email/settings/analytics/keywords?limit=${limit}`);
  },

  // Get users by specific setting
  async getUsersBySetting(settingName: string, settingValue: any) {
    console.log('[API][EMAIL-ANALYTICS] Getting users by setting:', settingName, 'value:', settingValue);
    return apiCall(`/email/settings/analytics/users/${settingName}/${settingValue}`);
  },
};
