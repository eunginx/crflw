import { useState } from 'react';

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

const SettingsPage = () => {
  const [form, setForm] = useState<SettingsForm>(() => {
    const saved = localStorage.getItem('cf-settings');
    return saved ? { ...DEFAULT_FORM, ...JSON.parse(saved) } : DEFAULT_FORM;
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<
    | { type: 'success'; message: string }
    | { type: 'error'; message: string }
    | null
  >(null);

  const handleChange = (
    field: keyof SettingsForm,
    value: SettingsForm[keyof SettingsForm],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
    setStatus(null);
    const validationError = validateForm();
    if (validationError) {
      setStatus({ type: 'error', message: validationError });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
      };

      console.log('[SETTINGS][SAVE]', payload);
      localStorage.setItem('cf-settings', JSON.stringify(payload));

      const response = await fetch('http://localhost:5000/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to persist settings');
      }

      setStatus({ type: 'success', message: 'Settings saved successfully!' });
    } catch (error: unknown) {
      console.error('[SETTINGS][ERROR]', error);
      setStatus({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Unexpected error occurred',
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
            <div className="mt-5 space-y-6">
              {status && (
                <div
                  className={
                    status.type === 'success'
                      ? 'rounded-md bg-green-50 p-4 text-green-800'
                      : 'rounded-md bg-red-50 p-4 text-red-800'
                  }
                >
                  {status.message}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Job Preferences
                </label>
                <div className="mt-2 space-y-2">
                  <div>
                    <label className="block text-sm text-gray-600">Keywords</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., Software Engineer, React, TypeScript"
                      value={form.keywords}
                      onChange={handleInputChange('keywords')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Locations</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., San Francisco, Remote, New York"
                      value={form.locations}
                      onChange={handleInputChange('locations')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Salary Range</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Min salary"
                        value={form.salaryMin}
                        onChange={handleInputChange('salaryMin')}
                      />
                      <input
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

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Auto-Apply Settings
                </label>
                <div className="mt-2 space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={form.enableAutoApply}
                      onChange={handleCheckboxChange('enableAutoApply')}
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Enable auto-apply
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={form.generateCoverLetters}
                      onChange={handleCheckboxChange('generateCoverLetters')}
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Generate custom cover letters
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={form.applyRemoteOnly}
                      onChange={handleCheckboxChange('applyRemoteOnly')}
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Apply to remote-only jobs
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Max applications per day</label>
                    <input
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
