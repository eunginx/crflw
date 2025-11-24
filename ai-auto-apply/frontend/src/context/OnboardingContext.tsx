import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { userAPI, profileAPI, settingsAPI, emailUserDataAPI } from '../services/apiService';
import { useAuth } from './AuthContext';
import { checkMigrationNeeded, migrateToPostgreSQL } from '../utils/migration';

interface OnboardingData {
  emailVerified: boolean;
  resumeUploaded: boolean;
  profileComplete: boolean;
  settingsComplete: boolean;
  profileInfo?: {
    firstName: string;
    lastName: string;
    phone: string;
    location: string;
    headline: string;
    summary: string;
  };
  settingsData?: {
    keywords: string;
    locations: string;
    salaryMin: number | null;
    salaryMax: number | null;
    enableAutoApply: boolean;
    generateCoverLetters: boolean;
    applyRemoteOnly: boolean;
    maxApplicationsPerDay: number;
  };
}

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  currentStep: number;
  onboardingData: OnboardingData;
  updateStep: (step: number) => void;
  updateOnboardingData: (data: Partial<OnboardingData>) => void;
  markOnboardingComplete: () => void;
  resetOnboarding: () => void;
  checkOnboardingStatus: () => void; // Keep for backward compatibility
}

const DEFAULT_ONBOARDING_DATA: OnboardingData = {
  emailVerified: false,
  resumeUploaded: false,
  profileComplete: false,
  settingsComplete: false,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(DEFAULT_ONBOARDING_DATA);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const firebaseUid = currentUser?.uid || null;
  const userEmail = currentUser?.email || null;
  
  // Prevent duplicate initialization
  const hasLoadedRef = useRef(false);
  const mountedRef = useRef(true);

  const updateStep = (step: number) => {
    setCurrentStep(step);
    // No longer need to update step via API since we're using email-based onboarding
    // The step is saved when completing onboarding
  };

  const updateOnboardingData = async (data: Partial<OnboardingData>) => {
    const newData = { ...onboardingData, ...data };
    setOnboardingData(newData);
    
    // Update API if we have user email
    if (userEmail) {
      try {
        await emailUserDataAPI.updateUserData(userEmail, {
          onboarding: {
            email_verified: newData.emailVerified,
            resume_uploaded: newData.resumeUploaded,
            profile_complete: newData.profileComplete,
            settings_complete: newData.settingsComplete,
            current_step: currentStep,
          }
        });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to update onboarding data:', error);
        }
      }
    }
  };

  const markOnboardingComplete = async () => {
    setIsOnboardingComplete(true);
    if (userEmail) {
      try {
        // Save all onboarding data including profile and settings
        await emailUserDataAPI.updateUserData(userEmail, {
          profile: onboardingData.profileInfo || {},
          settings: onboardingData.settingsData || {},
          onboarding: {
            email_verified: onboardingData.emailVerified,
            resume_uploaded: onboardingData.resumeUploaded,
            profile_complete: onboardingData.profileComplete,
            settings_complete: onboardingData.settingsComplete,
            onboarding_complete: true,
            current_step: currentStep,
            completed_at: new Date().toISOString(),
          }
        });
        console.log('[ONBOARDING] All onboarding data saved successfully');
      } catch (error) {
        console.error('Failed to complete onboarding:', error);
      }
    }
  };

  const resetOnboarding = () => {
    setCurrentStep(1);
    setOnboardingData(DEFAULT_ONBOARDING_DATA);
    setIsOnboardingComplete(false);
  };

  const checkOnboardingStatus = async () => {
    if (!userEmail || hasLoadedRef.current) {
      if (!userEmail && mountedRef.current) {
        setLoading(false);
      }
      return;
    }
    
    hasLoadedRef.current = true;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[ONBOARDING][CHECK] Checking onboarding status from PostgreSQL...');
    }
    
    // Check for migration and clean up localStorage if needed
    if (checkMigrationNeeded()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[ONBOARDING][CHECK] Migrating localStorage data to PostgreSQL...');
      }
      migrateToPostgreSQL();
    }

    // Load onboarding data from PostgreSQL API
    if (userEmail && mountedRef.current) {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('[ONBOARDING][CHECK] Loading data from API for user:', userEmail);
        }
        const userData = await emailUserDataAPI.getUserData(userEmail);

        // Update onboarding data from API
        if (userData?.onboarding && mountedRef.current) {
          const onboarding = userData.onboarding;
          setOnboardingData(prev => ({
            ...prev,
            emailVerified: onboarding.email_verified || prev.emailVerified,
            resumeUploaded: onboarding.resume_uploaded || prev.resumeUploaded,
            profileComplete: onboarding.profile_complete || prev.profileComplete,
            settingsComplete: onboarding.settings_complete || prev.settingsComplete,
          }));
          setCurrentStep(onboarding.current_step || 1);
        }

        // Check if onboarding is complete
        const allComplete = 
          (userData?.onboarding?.email_verified || false) &&
          (userData?.onboarding?.resume_uploaded || false) &&
          (userData?.onboarding?.profile_complete || false) &&
          (userData?.onboarding?.settings_complete || false);
        
        if (mountedRef.current) {
          setIsOnboardingComplete(allComplete);
          if (process.env.NODE_ENV === 'development') {
            console.log('[ONBOARDING][CHECK] Onboarding data loaded successfully');
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[ONBOARDING][CHECK] Failed to load onboarding data from API:', error);
        }
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('[ONBOARDING][CHECK] No user email, using defaults');
      }
    }
    
    if (mountedRef.current) {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mountedRef.current) {
      checkOnboardingStatus();
    }
  }, [userEmail]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingComplete,
        currentStep,
        onboardingData,
        updateStep,
        updateOnboardingData,
        markOnboardingComplete,
        resetOnboarding,
        checkOnboardingStatus,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};
