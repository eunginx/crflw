import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { healthAPI, emailUserDataAPI } from '../services/apiService';
import { log } from '../utils/logger';
import { checkMigrationNeeded, migrateToPostgreSQL } from '../utils/migration';

interface SettingsForm {
  keywords: string;
  locations: string;
  salaryMin: string;
  salaryMax: string;
  enableAutoApply: boolean;
  generateCoverLetters: boolean;
  applyRemoteOnly: boolean;
  maxApplicationsPerDay: number;
}

const DEFAULT_FORM: SettingsForm = {
  keywords: '',
  locations: '',
  salaryMin: '',
  salaryMax: '',
  enableAutoApply: true,
  generateCoverLetters: true,
  applyRemoteOnly: false,
  maxApplicationsPerDay: 50,
};

const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [form, setForm] = useState<SettingsForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<
    | { type: 'success'; message: string }
    | { type: 'error'; message: string }
    | null
  >(null);

  // Check for migration on component mount
  useEffect(() => {
    if (checkMigrationNeeded()) {
      migrateToPostgreSQL();
    }
  }, []);

  // Load user data from API when user is available
  useEffect(() => {
    const loadUserData = async () => {
      console.log('[SETTINGS][LOAD] Current user:', currentUser?.email);
      console.log('[SETTINGS][LOAD] Current user object:', currentUser);
      console.log('[SETTINGS][LOAD] Current user UID:', currentUser?.uid);
      
      if (currentUser?.email) {
        setLoading(true);
        setStatus(null);
        try {
          log.info('[SETTINGS] Loading user data...');
          console.log('[SETTINGS][LOAD] Making API call for email:', currentUser.email);
          const userData = await emailUserDataAPI.getUserData(currentUser.email);
          console.log('[SETTINGS][LOAD] Raw API response:', userData);
          log.info('[SETTINGS] User data loaded:', userData);
          
          if (userData?.settings) {
            console.log('[SETTINGS][LOAD] Found settings in response:', userData.settings);
            const settings = userData.settings;
            const formData = {
              keywords: settings.keywords || '',
              locations: settings.locations || '',
              salaryMin: settings.salary_min?.toString() || '',
              salaryMax: settings.salary_max?.toString() || '',
              enableAutoApply: settings.enable_auto_apply ?? true,
              generateCoverLetters: settings.generate_cover_letters ?? true,
              applyRemoteOnly: settings.apply_remote_only ?? false,
              maxApplicationsPerDay: settings.max_applications_per_day || 50,
            };
            console.log('[SETTINGS][LOAD] Form data to set:', formData);
            console.log('[SETTINGS][LOAD] Current form state before set:', form);
            setForm(formData);
            console.log('[SETTINGS][LOAD] Form data set successfully');
            
            log.info('[SETTINGS] Settings loaded successfully');
          } else {
            console.log('[SETTINGS][LOAD] No settings found in user data. User data structure:', Object.keys(userData || {}));
            log.info('[SETTINGS] No user data found, using defaults');
            console.log('[SETTINGS][LOAD] Setting form to defaults:', DEFAULT_FORM);
            // Set default form values
            setForm(DEFAULT_FORM);
          }
        } catch (error: any) {
          console.error('[SETTINGS][ERROR] Failed to load settings:', error);
          console.error('[SETTINGS][ERROR] Error details:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            stack: error.stack
          });
          log.error('[SETTINGS] Failed to load settings:', error);
          
          const message =
            error.status === 404 ? "User not found" :
            error.status === 400 ? "Invalid email address" :
            error.status === 0   ? "Network error – backend unavailable" :
            error.message || "Unknown error";
          
          setStatus({ type: 'error', message });
        } finally {
          setLoading(false);
        }
      } else {
        log.info('[SETTINGS] No current user, showing login prompt');
        setStatus({
          type: 'error',
          message: 'Please sign in to access your settings. Click the Sign In button in the navigation.'
        });
      }
    };

    loadUserData();
  }, [currentUser?.email]); // Reload when email changes

  const handleChange = (
    field: keyof SettingsForm,
    value: SettingsForm[keyof SettingsForm],
  ) => {
    console.log('[SETTINGS][CHANGE] Form field changed:', field, 'to:', value);
    setForm((prev) => {
      const newForm = { ...prev, [field]: value };
      console.log('[SETTINGS][CHANGE] New form state:', newForm);
      return newForm;
    });
  };

  const handleNumberChange = (field: keyof SettingsForm) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(field, Number(event.target.value));
    };

  const handleInputChange = (field: keyof SettingsForm) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(field, event.target.value);
    };

  const handleCheckboxChange = (field: keyof SettingsForm) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(field, event.target.checked);
    };

  const validateForm = () => {
    if (form.salaryMin && form.salaryMax) {
      const min = Number(form.salaryMin);
      const max = Number(form.salaryMax);
      if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < 0) {
        return 'Salary values must be positive numbers';
      }
      if (min > max) {
        return 'Minimum salary cannot be greater than maximum salary';
      }
    }

    if (form.maxApplicationsPerDay < 1 || form.maxApplicationsPerDay > 100) {
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

    try {
      console.log('[SETTINGS][SAVE] Saving settings for user:', currentUser.email);

      // Prepare the settings data for the unified API
      const settingsData = {
        keywords: form.keywords,
        locations: form.locations,
        salary_min: form.salaryMin ? Number(form.salaryMin) : null,
        salary_max: form.salaryMax ? Number(form.salaryMax) : null,
        enable_auto_apply: form.enableAutoApply,
        generate_cover_letters: form.generateCoverLetters,
        apply_remote_only: form.applyRemoteOnly,
        max_applications_per_day: form.maxApplicationsPerDay,
      };

      console.log('[SETTINGS][SAVE] Form data:', form);
      console.log('[SETTINGS][SAVE] Settings data being sent:', settingsData);
      console.log('[SETTINGS][SAVE] Updating settings via unified API');

      // Update settings using the unified API
      await emailUserDataAPI.updateUserData(currentUser.email, {
        settings: settingsData,
        onboarding: {
          settings_complete: true
        }
      });
      
      console.log('[SETTINGS][SAVE] Settings saved, reloading from API...');
      
      // Reload the data to verify it was saved correctly
      const refreshedData = await emailUserDataAPI.getUserData(currentUser.email);
      console.log('[SETTINGS][SAVE] Refreshed data after save:', refreshedData);

      setStatus({
        type: 'success',
        message: 'Settings saved successfully!',
      });
    } catch (error: unknown) {
      console.error('[SETTINGS][ERROR]', error);
      setStatus({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Failed to save settings',
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
                <div className="mt-2 space-y-2">
                  <div>
                    <label htmlFor="keywords" className="block text-sm text-gray-600">Keywords</label>
                    <input
                      id="keywords"
                      name="keywords"
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., Software Engineer, React, TypeScript"
                      value={form.keywords}
                      onChange={handleInputChange('keywords')}
                    />
                  </div>
                  <div>
                    <label htmlFor="locations" className="block text-sm text-gray-600">Locations</label>
                    <input
                      id="locations"
                      name="locations"
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., San Francisco, Remote, New York"
                      value={form.locations}
                      onChange={handleInputChange('locations')}
                    />
                  </div>
                  <div>
                    <span className="block text-sm text-gray-600">Salary Range</span>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <label htmlFor="salaryMin" className="sr-only">Min salary</label>
                        <input
                          id="salaryMin"
                          name="salaryMin"
                          type="number"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Min salary"
                          value={form.salaryMin}
                          onChange={handleInputChange('salaryMin')}
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="salaryMax" className="sr-only">Max salary</label>
                        <input
                          id="salaryMax"
                          name="salaryMax"
                          type="number"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Max salary"
                          value={form.salaryMax}
                          onChange={handleInputChange('salaryMax')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="block text-sm font-medium text-gray-700">
                  Auto-Apply Settings
                </h3>
                <div className="mt-2 space-y-4">
                  <div className="flex items-center">
                    <input
                      id="enableAutoApply"
                      name="enableAutoApply"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={form.enableAutoApply}
                      onChange={handleCheckboxChange('enableAutoApply')}
                    />
                    <label htmlFor="enableAutoApply" className="ml-2 block text-sm text-gray-900">
                      Enable auto-apply
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="generateCoverLetters"
                      name="generateCoverLetters"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={form.generateCoverLetters}
                      onChange={handleCheckboxChange('generateCoverLetters')}
                    />
                    <label htmlFor="generateCoverLetters" className="ml-2 block text-sm text-gray-900">
                      Generate custom cover letters
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="applyRemoteOnly"
                      name="applyRemoteOnly"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={form.applyRemoteOnly}
                      onChange={handleCheckboxChange('applyRemoteOnly')}
                    />
                    <label htmlFor="applyRemoteOnly" className="ml-2 block text-sm text-gray-900">
                      Apply to remote-only jobs
                    </label>
                  </div>
                  <div>
                    <label htmlFor="maxApplicationsPerDay" className="block text-sm text-gray-600">Max applications per day</label>
                    <input
                      id="maxApplicationsPerDay"
                      name="maxApplicationsPerDay"
                      type="number"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={form.maxApplicationsPerDay}
                      min={1}
                      max={100}
                      onChange={handleNumberChange('maxApplicationsPerDay')}
                    />
                  </div>
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
