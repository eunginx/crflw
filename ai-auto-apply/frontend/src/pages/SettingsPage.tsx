import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { JobPreferenceFields, AutoApplySettingsFields, JobPreferenceFormData, AutoApplySettingsFormData } from '../components/shared';

interface SettingsForm {
  jobPreferences: JobPreferenceFormData;
  autoApplySettings: AutoApplySettingsFormData;
}

const DEFAULT_FORM: SettingsForm = {
  jobPreferences: {
    keywords: '',
    locations: '',
    salaryMin: '',
    salaryMax: '',
  },
  autoApplySettings: {
    enableAutoApply: true,
    generateCoverLetters: true,
    applyRemoteOnly: false,
    maxApplicationsPerDay: 50,
  },
};

const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    preferences,
    autoApplySettings,
    loading,
    error,
    savePreferences,
    saveAutoApplySettings
  } = useUser();

  const [form, setForm] = useState<SettingsForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<
    | { type: 'success'; message: string }
    | { type: 'error'; message: string }
    | null
  >(null);

  // Populate form when user data loads from context
  useEffect(() => {
    if (preferences || autoApplySettings) {
      const formData = {
        jobPreferences: {
          keywords: preferences?.keywords || '',
          locations: preferences?.locations || '',
          salaryMin: preferences?.salaryMin?.toString() || '',
          salaryMax: preferences?.salaryMax?.toString() || '',
        },
        autoApplySettings: {
          enableAutoApply: autoApplySettings?.enableAutoApply ?? true,
          generateCoverLetters: autoApplySettings?.generateCoverLetters ?? true,
          applyRemoteOnly: autoApplySettings?.applyRemoteOnly ?? false,
          maxApplicationsPerDay: autoApplySettings?.maxApplicationsPerDay || 50,
        },
      };
      setForm(formData);
    }
  }, [preferences, autoApplySettings]);

  // Show error from context if any
  useEffect(() => {
    if (error) {
      setStatus({
        type: 'error',
        message: error
      });
    }
  }, [error]);

  const handleChange = (
    section: 'jobPreferences' | 'autoApplySettings',
    field: string,
    value: string | number | boolean,
  ) => {
    console.log('[SETTINGS][CHANGE] Form field changed:', section, field, 'to:', value);
    setForm((prev) => {
      const newForm = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      };
      console.log('[SETTINGS][CHANGE] New form state:', newForm);
      return newForm;
    });
  };

  const validateForm = () => {
    const { jobPreferences, autoApplySettings } = form;

    // Validate salary range
    if (jobPreferences.salaryMin && jobPreferences.salaryMax) {
      const min = Number(jobPreferences.salaryMin);
      const max = Number(jobPreferences.salaryMax);
      if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < 0) {
        return 'Salary values must be positive numbers';
      }
      if (min > max) {
        return 'Minimum salary cannot be greater than maximum salary';
      }
    }

    // Validate auto-apply settings
    if (autoApplySettings.maxApplicationsPerDay < 1 || autoApplySettings.maxApplicationsPerDay > 100) {
      return 'Max applications per day must be between 1 and 100';
    }

    return null;
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);

    // Check if user is logged in
    if (!currentUser?.email) {
      setStatus({
        type: 'error',
        message: 'Please log in to save your settings'
      });
      setSaving(false);
      return;
    }

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setStatus({
        type: 'error',
        message: validationError
      });
      setSaving(false);
      return;
    }

    try {
      console.log('[SETTINGS][SAVE] Saving settings for user:', currentUser.email);

      // Use UserContext save methods
      await Promise.all([
        savePreferences({
          keywords: form.jobPreferences.keywords,
          locations: form.jobPreferences.locations,
          salaryMin: form.jobPreferences.salaryMin ? Number(form.jobPreferences.salaryMin) : undefined,
          salaryMax: form.jobPreferences.salaryMax ? Number(form.jobPreferences.salaryMax) : undefined,
        }),
        saveAutoApplySettings({
          enableAutoApply: form.autoApplySettings.enableAutoApply,
          generateCoverLetters: form.autoApplySettings.generateCoverLetters,
          applyRemoteOnly: form.autoApplySettings.applyRemoteOnly,
          maxApplicationsPerDay: form.autoApplySettings.maxApplicationsPerDay,
        })
      ]);

      console.log('[SETTINGS][SAVE] Settings saved successfully');
      setStatus({
        type: 'success',
        message: 'Your settings have been saved successfully!'
      });
    } catch (error) {
      console.error('[SETTINGS][SAVE] Error saving settings:', error);
      setStatus({
        type: 'error',
        message: 'Failed to save your settings. Please try again or contact support if the issue persists.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Application Settings</h3>
            {loading && (
              <div className="mt-4 rounded-md bg-blue-50 p-4 text-blue-800">
                Loading your settings...
              </div>
            )}
            <div className="mt-5 space-y-6">
              {status && (
                <div
                  className={
                    status.type === 'success'
                      ? 'rounded-md bg-green-50 p-4 text-green-800'
                      : 'rounded-md bg-red-50 p-4 text-red-800'
                  }
                >
                  <div className="flex justify-between items-center">
                    <div>{status.message}</div>
                    {status.message?.includes('email-based') && (
                      <button
                        onClick={() => window.location.href = '/email-settings'}
                        className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Try Email Settings
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="block text-sm font-medium text-gray-700">
                  Job Preferences
                </h3>
                <div className="mt-2">
                  <JobPreferenceFields
                    data={form.jobPreferences}
                    onChange={(field, value) => handleChange('jobPreferences', field, value)}
                    disabled={loading || saving}
                  />
                </div>
              </div>

              <div>
                <h3 className="block text-sm font-medium text-gray-700">
                  Auto-Apply Settings
                </h3>
                <div className="mt-2">
                  <AutoApplySettingsFields
                    data={form.autoApplySettings}
                    onChange={(field, value) => handleChange('autoApplySettings', field, value)}
                    disabled={loading || saving}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
