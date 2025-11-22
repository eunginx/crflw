// Email-based Settings Context
// This context manages user settings using email as the primary identifier

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useEmailUser } from './EmailUserContext';
import { emailSettingsAPI } from '../services/apiService';

interface EmailSettings {
  id: string;
  email: string;
  keywords: string;
  locations: string;
  salaryMin: number;
  salaryMax: number;
  enableAutoApply: boolean;
  generateCoverLetters: boolean;
  applyRemoteOnly: boolean;
  maxApplicationsPerDay: number;
  jobTypes: string[];
  industries: string[];
  companySizes: string[];
  createdAt: string;
  updatedAt: string;
}

interface EmailSettingsForm {
  keywords: string;
  locations: string;
  salaryMin: string;
  salaryMax: string;
  enableAutoApply: boolean;
  generateCoverLetters: boolean;
  applyRemoteOnly: boolean;
  maxApplicationsPerDay: number;
}

interface EmailSettingsContextType {
  settings: EmailSettings | null;
  form: EmailSettingsForm;
  loading: boolean;
  saving: boolean;
  error: string | null;
  status: { type: 'success' | 'error'; message: string } | null;
  // Form methods
  updateForm: (field: keyof EmailSettingsForm, value: any) => void;
  resetForm: () => void;
  saveSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
  // Status methods
  clearStatus: () => void;
  clearError: () => void;
}

const EmailSettingsContext = createContext<EmailSettingsContextType | undefined>(undefined);

export const useEmailSettings = () => {
  const context = useContext(EmailSettingsContext);
  if (context === undefined) {
    throw new Error('useEmailSettings must be used within an EmailSettingsProvider');
  }
  return context;
};

interface EmailSettingsProviderProps {
  children: ReactNode;
}

const defaultForm: EmailSettingsForm = {
  keywords: '',
  locations: '',
  salaryMin: '',
  salaryMax: '',
  enableAutoApply: true,
  generateCoverLetters: true,
  applyRemoteOnly: false,
  maxApplicationsPerDay: 50,
};

export const EmailSettingsProvider: React.FC<EmailSettingsProviderProps> = ({ children }) => {
  const { currentUser } = useEmailUser();
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [form, setForm] = useState<EmailSettingsForm>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Clear status and error methods
  const clearStatus = () => setStatus(null);
  const clearError = () => setError(null);

  // Update form field
  const updateForm = (field: keyof EmailSettingsForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    clearStatus();
  };

  // Reset form to default or current settings
  const resetForm = () => {
    if (settings) {
      setForm({
        keywords: settings.keywords || '',
        locations: settings.locations || '',
        salaryMin: settings.salaryMin?.toString() || '',
        salaryMax: settings.salaryMax?.toString() || '',
        enableAutoApply: settings.enableAutoApply ?? true,
        generateCoverLetters: settings.generateCoverLetters ?? true,
        applyRemoteOnly: settings.applyRemoteOnly ?? false,
        maxApplicationsPerDay: settings.maxApplicationsPerDay || 50,
      });
    } else {
      setForm(defaultForm);
    }
    clearStatus();
  };

  // Load settings from email-based API
  const loadSettings = async () => {
    if (!currentUser?.email) {
      console.log('[EMAIL-SETTINGS] No current user, skipping settings load');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[EMAIL-SETTINGS] Loading settings for email:', currentUser.email);
      const settingsData = await emailSettingsAPI.getSettings(currentUser.email);
      
      if (settingsData) {
        setSettings(settingsData);
        setForm({
          keywords: settingsData.keywords || '',
          locations: settingsData.locations || '',
          salaryMin: settingsData.salaryMin?.toString() || '',
          salaryMax: settingsData.salaryMax?.toString() || '',
          enableAutoApply: settingsData.enableAutoApply ?? true,
          generateCoverLetters: settingsData.generateCoverLetters ?? true,
          applyRemoteOnly: settingsData.applyRemoteOnly ?? false,
          maxApplicationsPerDay: settingsData.maxApplicationsPerDay || 50,
        });
        console.log('[EMAIL-SETTINGS] Settings loaded successfully');
      } else {
        console.log('[EMAIL-SETTINGS] No settings found for user (new user)');
        setSettings(null);
        setForm(defaultForm);
      }
    } catch (error: any) {
      console.error('[EMAIL-SETTINGS] Failed to load settings:', error);
      setError(error.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Save settings to email-based API
  const saveSettings = async () => {
    if (!currentUser?.email) {
      setError('No authenticated user found');
      return;
    }

    setSaving(true);
    setError(null);
    clearStatus();

    try {
      console.log('[EMAIL-SETTINGS] Saving settings for email:', currentUser.email);
      
      const settingsData = {
        keywords: form.keywords,
        locations: form.locations,
        salaryMin: form.salaryMin ? parseInt(form.salaryMin) : null,
        salaryMax: form.salaryMax ? parseInt(form.salaryMax) : null,
        enableAutoApply: form.enableAutoApply,
        generateCoverLetters: form.generateCoverLetters,
        applyRemoteOnly: form.applyRemoteOnly,
        maxApplicationsPerDay: form.maxApplicationsPerDay,
      };

      const savedSettings = await emailSettingsAPI.updateSettings(currentUser.email, settingsData);
      
      setSettings(savedSettings);
      setStatus({ type: 'success', message: 'Settings saved successfully!' });
      console.log('[EMAIL-SETTINGS] Settings saved successfully');
    } catch (error: any) {
      console.error('[EMAIL-SETTINGS] Failed to save settings:', error);
      setError(error.message || 'Failed to save settings');
      setStatus({ type: 'error', message: error.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  // Load settings when current user changes
  useEffect(() => {
    if (currentUser?.email) {
      loadSettings();
    } else {
      setSettings(null);
      setForm(defaultForm);
      setLoading(false);
    }
  }, [currentUser]);

  const value: EmailSettingsContextType = {
    settings,
    form,
    loading,
    saving,
    error,
    status,
    updateForm,
    resetForm,
    saveSettings,
    loadSettings,
    clearStatus,
    clearError,
  };

  return (
    <EmailSettingsContext.Provider value={value}>
      {children}
    </EmailSettingsContext.Provider>
  );
};

export default EmailSettingsContext;
