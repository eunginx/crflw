import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Types for user data
export interface UserProfile {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  resumeUploaded?: boolean;
  resumeFilename?: string;
  skills?: string[];
  experienceYears?: number;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobPreferences {
  keywords?: string;
  locations?: string;
  salaryMin?: number;
  salaryMax?: number;
  jobTypes?: string[];
  industries?: string[];
  companySizes?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AutoApplySettings {
  enableAutoApply?: boolean;
  generateCoverLetters?: boolean;
  applyRemoteOnly?: boolean;
  maxApplicationsPerDay?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OnboardingData {
  emailVerified?: boolean;
  resumeUploaded?: boolean;
  profileComplete?: boolean;
  settingsComplete?: boolean;
  currentStep?: number;
  completedAt?: string;
}

export interface UserData {
  profile?: UserProfile;
  preferences?: JobPreferences;
  autoApplySettings?: AutoApplySettings;
  onboarding?: OnboardingData;
}

class UserService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // ===== PROFILE METHODS =====

  async getProfile(email: string): Promise<UserProfile> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/user/profile/${encodeURIComponent(email)}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      throw new Error(error.response?.data?.error || 'Failed to load profile');
    }
  }

  async updateProfile(email: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/user/profile/${encodeURIComponent(email)}`,
        profileData,
        { headers: this.getAuthHeaders() }
      );
      return response.data.profile;
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      throw new Error(error.response?.data?.error || 'Failed to update profile');
    }
  }

  // ===== JOB PREFERENCES METHODS =====

  async getJobPreferences(email: string): Promise<JobPreferences> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/user/preferences/${encodeURIComponent(email)}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching job preferences:', error);
      throw new Error(error.response?.data?.error || 'Failed to load preferences');
    }
  }

  async updateJobPreferences(email: string, preferencesData: Partial<JobPreferences>): Promise<JobPreferences> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/user/preferences/${encodeURIComponent(email)}`,
        preferencesData,
        { headers: this.getAuthHeaders() }
      );
      return response.data.preferences;
    } catch (error: any) {
      console.error('Error updating job preferences:', error);
      throw new Error(error.response?.data?.error || 'Failed to update preferences');
    }
  }

  // ===== AUTO-APPLY SETTINGS METHODS =====

  async getAutoApplySettings(email: string): Promise<AutoApplySettings> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/user/autoapply/${encodeURIComponent(email)}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching auto-apply settings:', error);
      throw new Error(error.response?.data?.error || 'Failed to load auto-apply settings');
    }
  }

  async updateAutoApplySettings(email: string, settingsData: Partial<AutoApplySettings>): Promise<AutoApplySettings> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/user/autoapply/${encodeURIComponent(email)}`,
        settingsData,
        { headers: this.getAuthHeaders() }
      );
      return response.data.autoApplySettings;
    } catch (error: any) {
      console.error('Error updating auto-apply settings:', error);
      throw new Error(error.response?.data?.error || 'Failed to update auto-apply settings');
    }
  }

  // ===== SYNC METHODS =====

  async syncUserData(email: string, data: {
    profile?: Partial<UserProfile>;
    preferences?: Partial<JobPreferences>;
    autoApplySettings?: Partial<AutoApplySettings>;
    onboarding?: Partial<OnboardingData>;
  }): Promise<{ success: boolean; synced: any; completeData: any }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/user/sync/${encodeURIComponent(email)}`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error syncing user data:', error);
      throw new Error(error.response?.data?.error || 'Failed to sync user data');
    }
  }

  // ===== COMPREHENSIVE DATA METHODS =====

  async getAllUserData(email: string): Promise<UserData> {
    try {
      const [profile, preferences, autoApplySettings] = await Promise.all([
        this.getProfile(email).catch(() => null),
        this.getJobPreferences(email).catch(() => null),
        this.getAutoApplySettings(email).catch(() => null),
      ]);

      return {
        profile: profile || undefined,
        preferences: preferences || undefined,
        autoApplySettings: autoApplySettings || undefined,
      };
    } catch (error) {
      console.error('Error loading user data:', error);
      throw error;
    }
  }

  async updateAllUserData(email: string, data: UserData): Promise<UserData> {
    try {
      const result = await this.syncUserData(email, data);
      return result.completeData;
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  // ===== UTILITY METHODS =====

  async createOrUpdateUser(email: string, userData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<UserProfile> {
    return this.updateProfile(email, userData);
  }

  async ensureUserExists(email: string): Promise<void> {
    try {
      await this.getProfile(email);
    } catch (error) {
      // If user doesn't exist, create them
      await this.createOrUpdateUser(email, {});
    }
  }
}

// Create singleton instance
const userService = new UserService();

export default userService;
