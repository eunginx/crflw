// Email-based Settings Page
// This component uses the new email-based API for settings management

import React, { useState } from 'react';
import { useEmailSettings, useEmailUser } from '../context';

const EmailSettingsPage: React.FC = () => {
  const { form, loading, saving, error, status, updateForm, saveSettings, clearStatus } = useEmailSettings();
  const { currentUser } = useEmailUser();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (
    field: keyof typeof form,
    value: string | boolean | number
  ) => {
    updateForm(field, value);
  };

  const handleSave = async () => {
    await saveSettings();
  };

  const validateForm = () => {
    if (!form.keywords.trim()) {
      return false;
    }
    if (!form.locations.trim()) {
      return false;
    }
    if (form.salaryMin && form.salaryMax && parseInt(form.salaryMin) > parseInt(form.salaryMax)) {
      return false;
    }
    return true;
  };

  const isFormValid = validateForm();

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access your settings</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your job search preferences and application settings
            </p>
          </div>

          <div className="px-6 py-6">
            {/* Status Messages */}
            {status && (
              <div
                className={`mb-6 p-4 rounded-md ${
                  status.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {status.message}
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-800 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading settings...</span>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                {/* Basic Settings */}
                <div className="space-y-6">
                  <div>
                    <label htmlFor="keywords" className="block text-sm font-medium text-gray-700">
                      Job Keywords *
                    </label>
                    <input
                      type="text"
                      id="keywords"
                      name="keywords"
                      value={form.keywords}
                      onChange={(e) => handleInputChange('keywords', e.target.value)}
                      placeholder="e.g., React Developer, Full Stack, TypeScript"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Separate multiple keywords with commas
                    </p>
                  </div>

                  <div>
                    <label htmlFor="locations" className="block text-sm font-medium text-gray-700">
                      Preferred Locations *
                    </label>
                    <input
                      type="text"
                      id="locations"
                      name="locations"
                      value={form.locations}
                      onChange={(e) => handleInputChange('locations', e.target.value)}
                      placeholder="e.g., San Francisco, Remote, New York"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Separate multiple locations with commas
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700">
                        Minimum Salary ($)
                      </label>
                      <input
                        type="number"
                        id="salaryMin"
                        name="salaryMin"
                        value={form.salaryMin}
                        onChange={(e) => handleInputChange('salaryMin', e.target.value)}
                        placeholder="e.g., 80000"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700">
                        Maximum Salary ($)
                      </label>
                      <input
                        type="number"
                        id="salaryMax"
                        name="salaryMax"
                        value={form.salaryMax}
                        onChange={(e) => handleInputChange('salaryMax', e.target.value)}
                        placeholder="e.g., 150000"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Application Settings */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Application Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="enableAutoApply"
                          name="enableAutoApply"
                          checked={form.enableAutoApply}
                          onChange={(e) => handleInputChange('enableAutoApply', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="enableAutoApply" className="ml-2 block text-sm text-gray-700">
                          Enable automatic job applications
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="generateCoverLetters"
                          name="generateCoverLetters"
                          checked={form.generateCoverLetters}
                          onChange={(e) => handleInputChange('generateCoverLetters', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="generateCoverLetters" className="ml-2 block text-sm text-gray-700">
                          Generate cover letters automatically
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="applyRemoteOnly"
                          name="applyRemoteOnly"
                          checked={form.applyRemoteOnly}
                          onChange={(e) => handleInputChange('applyRemoteOnly', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="applyRemoteOnly" className="ml-2 block text-sm text-gray-700">
                          Apply to remote positions only
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Settings */}
                  <div className="border-t pt-6">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
                    </button>

                    {showAdvanced && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="maxApplicationsPerDay" className="block text-sm font-medium text-gray-700">
                            Maximum Applications Per Day
                          </label>
                          <select
                            id="maxApplicationsPerDay"
                            name="maxApplicationsPerDay"
                            value={form.maxApplicationsPerDay}
                            onChange={(e) => handleInputChange('maxApplicationsPerDay', parseInt(e.target.value))}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value={10}>10 applications</option>
                            <option value={25}>25 applications</option>
                            <option value={50}>50 applications</option>
                            <option value={75}>75 applications</option>
                            <option value={100}>100 applications</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Info Display */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-600">
                        <strong>Email:</strong> {currentUser.email}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Email Verified:</strong> {currentUser.emailVerified ? 'Yes' : 'No'}
                      </p>
                      {currentUser.firstName && (
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Name:</strong> {currentUser.firstName} {currentUser.lastName || ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid || saving}
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isFormValid && !saving
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSettingsPage;
