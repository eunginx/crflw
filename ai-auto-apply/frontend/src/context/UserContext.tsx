import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import userService, { UserProfile, JobPreferences, AutoApplySettings, OnboardingData } from '../services/userService';

// Types for the context state
interface UserState {
  profile: UserProfile | null;
  preferences: JobPreferences | null;
  autoApplySettings: AutoApplySettings | null;
  onboarding: OnboardingData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Types for actions
type UserAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROFILE'; payload: UserProfile | null }
  | { type: 'SET_PREFERENCES'; payload: JobPreferences | null }
  | { type: 'SET_AUTO_APPLY_SETTINGS'; payload: AutoApplySettings | null }
  | { type: 'SET_ONBOARDING'; payload: OnboardingData | null }
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<JobPreferences> }
  | { type: 'UPDATE_AUTO_APPLY_SETTINGS'; payload: Partial<AutoApplySettings> }
  | { type: 'UPDATE_ONBOARDING'; payload: Partial<OnboardingData> }
  | { type: 'CLEAR_DATA' }
  | { type: 'REFRESH_DATA'; payload: UserState };

// Initial state
const initialState: UserState = {
  profile: null,
  preferences: null,
  autoApplySettings: null,
  onboarding: null,
  loading: false,
  error: null,
  lastUpdated: null,
};

// Reducer function
const userReducer = (state: UserState, action: UserAction): UserState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_PROFILE':
      return { 
        ...state, 
        profile: action.payload, 
        loading: false, 
        error: null,
        lastUpdated: new Date()
      };
    
    case 'SET_PREFERENCES':
      return { 
        ...state, 
        preferences: action.payload, 
        loading: false, 
        error: null,
        lastUpdated: new Date()
      };
    
    case 'SET_AUTO_APPLY_SETTINGS':
      return { 
        ...state, 
        autoApplySettings: action.payload, 
        loading: false, 
        error: null,
        lastUpdated: new Date()
      };
    
    case 'SET_ONBOARDING':
      return { 
        ...state, 
        onboarding: action.payload, 
        loading: false, 
        error: null,
        lastUpdated: new Date()
      };
    
    case 'UPDATE_PROFILE':
      return { 
        ...state, 
        profile: state.profile ? { ...state.profile, ...action.payload } : null,
        lastUpdated: new Date()
      };
    
    case 'UPDATE_PREFERENCES':
      return { 
        ...state, 
        preferences: state.preferences ? { ...state.preferences, ...action.payload } : null,
        lastUpdated: new Date()
      };
    
    case 'UPDATE_AUTO_APPLY_SETTINGS':
      return { 
        ...state, 
        autoApplySettings: state.autoApplySettings ? { ...state.autoApplySettings, ...action.payload } : null,
        lastUpdated: new Date()
      };
    
    case 'UPDATE_ONBOARDING':
      return { 
        ...state, 
        onboarding: state.onboarding ? { ...state.onboarding, ...action.payload } : null,
        lastUpdated: new Date()
      };
    
    case 'CLEAR_DATA':
      return { ...initialState };
    
    case 'REFRESH_DATA':
      return { ...action.payload, loading: false, error: null };
    
    default:
      return state;
  }
};

// Context interface
interface UserContextType extends UserState {
  // Load methods
  loadUserData: () => Promise<void>;
  loadProfile: () => Promise<void>;
  loadPreferences: () => Promise<void>;
  loadAutoApplySettings: () => Promise<void>;
  loadOnboarding: () => Promise<void>;
  
  // Save methods
  saveProfile: (data: Partial<UserProfile>) => Promise<void>;
  savePreferences: (data: Partial<JobPreferences>) => Promise<void>;
  saveAutoApplySettings: (data: Partial<AutoApplySettings>) => Promise<void>;
  saveOnboarding: (data: Partial<OnboardingData>) => Promise<void>;
  
  // Sync methods
  syncAllData: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  
  // Utility methods
  clearUserData: () => void;
  isDataLoaded: () => boolean;
  isOnboardingComplete: () => boolean;
}

// Create context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);
  const { currentUser } = useAuth();

  // Load all user data
  const loadUserData = async (): Promise<void> => {
    if (!currentUser?.email) {
      dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const userData = await userService.getAllUserData(currentUser.email);
      
      dispatch({ type: 'SET_PROFILE', payload: userData.profile || null });
      dispatch({ type: 'SET_PREFERENCES', payload: userData.preferences || null });
      dispatch({ type: 'SET_AUTO_APPLY_SETTINGS', payload: userData.autoApplySettings || null });
      dispatch({ type: 'SET_ONBOARDING', payload: userData.onboarding || null });
    } catch (error) {
      console.error('Error loading user data:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load user data' });
    }
  };

  // Load individual data sections
  const loadProfile = async (): Promise<void> => {
    if (!currentUser?.email) {
      dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const profile = await userService.getProfile(currentUser.email);
      dispatch({ type: 'SET_PROFILE', payload: profile });
    } catch (error) {
      console.error('Error loading profile:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load profile' });
    }
  };

  const loadPreferences = async (): Promise<void> => {
    if (!currentUser?.email) {
      dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const preferences = await userService.getJobPreferences(currentUser.email);
      dispatch({ type: 'SET_PREFERENCES', payload: preferences });
    } catch (error) {
      console.error('Error loading preferences:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load preferences' });
    }
  };

  const loadAutoApplySettings = async (): Promise<void> => {
    if (!currentUser?.email) {
      dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const settings = await userService.getAutoApplySettings(currentUser.email);
      dispatch({ type: 'SET_AUTO_APPLY_SETTINGS', payload: settings });
    } catch (error) {
      console.error('Error loading auto-apply settings:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load auto-apply settings' });
    }
  };

  const loadOnboarding = async (): Promise<void> => {
    if (!currentUser?.email) {
      dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      // Note: onboarding data would need to be added to userService
      // For now, we'll keep the existing onboarding context
      dispatch({ type: 'SET_ONBOARDING', payload: null });
    } catch (error) {
      console.error('Error loading onboarding data:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load onboarding data' });
    }
  };

  // Save methods
  const saveProfile = async (data: Partial<UserProfile>): Promise<void> => {
    if (!currentUser?.email) {
      dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedProfile = await userService.updateProfile(currentUser.email, data);
      dispatch({ type: 'SET_PROFILE', payload: updatedProfile });
    } catch (error) {
      console.error('Error saving profile:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to save profile' });
    }
  };

  const savePreferences = async (data: Partial<JobPreferences>): Promise<void> => {
    if (!currentUser?.email) {
      dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedPreferences = await userService.updateJobPreferences(currentUser.email, data);
      dispatch({ type: 'SET_PREFERENCES', payload: updatedPreferences });
    } catch (error) {
      console.error('Error saving preferences:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to save preferences' });
    }
  };

  const saveAutoApplySettings = async (data: Partial<AutoApplySettings>): Promise<void> => {
    if (!currentUser?.email) {
      dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedSettings = await userService.updateAutoApplySettings(currentUser.email, data);
      dispatch({ type: 'SET_AUTO_APPLY_SETTINGS', payload: updatedSettings });
    } catch (error) {
      console.error('Error saving auto-apply settings:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to save auto-apply settings' });
    }
  };

  const saveOnboarding = async (data: Partial<OnboardingData>): Promise<void> => {
    if (!currentUser?.email) {
      dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      // Note: onboarding save would need to be added to userService
      // For now, we'll just update the local state
      dispatch({ type: 'UPDATE_ONBOARDING', payload: data });
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to save onboarding data' });
    }
  };

  // Sync methods
  const syncAllData = async (): Promise<void> => {
    if (!currentUser?.email) {
      dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const syncData = {
        profile: state.profile || undefined,
        preferences: state.preferences || undefined,
        autoApplySettings: state.autoApplySettings || undefined,
        onboarding: state.onboarding || undefined,
      };

      const result = await userService.syncUserData(currentUser.email, syncData);
      const completeData = result.completeData;

      dispatch({ type: 'SET_PROFILE', payload: completeData.profile || null });
      dispatch({ type: 'SET_PREFERENCES', payload: completeData.settings || null });
      dispatch({ type: 'SET_AUTO_APPLY_SETTINGS', payload: completeData.settings || null });
      dispatch({ type: 'SET_ONBOARDING', payload: completeData.onboarding || null });
    } catch (error) {
      console.error('Error syncing user data:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to sync user data' });
    }
  };

  const refreshUserData = async (): Promise<void> => {
    await loadUserData();
  };

  // Utility methods
  const clearUserData = (): void => {
    dispatch({ type: 'CLEAR_DATA' });
  };

  const isDataLoaded = (): boolean => {
    return !!(state.profile || state.preferences || state.autoApplySettings);
  };

  const isOnboardingComplete = (): boolean => {
    return !!(
      state.onboarding?.emailVerified &&
      state.onboarding?.profileComplete &&
      state.onboarding?.settingsComplete
    );
  };

  // Auto-load data when user changes
  useEffect(() => {
    if (currentUser?.email) {
      loadUserData();
    } else {
      clearUserData();
    }
  }, [currentUser?.email]);

  const value: UserContextType = {
    ...state,
    loadUserData,
    loadProfile,
    loadPreferences,
    loadAutoApplySettings,
    loadOnboarding,
    saveProfile,
    savePreferences,
    saveAutoApplySettings,
    saveOnboarding,
    syncAllData,
    refreshUserData,
    clearUserData,
    isDataLoaded,
    isOnboardingComplete,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Hook to use the context
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
