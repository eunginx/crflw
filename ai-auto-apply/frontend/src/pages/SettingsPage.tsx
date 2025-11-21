const SettingsPage = () => {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Application Settings</h3>
            <div className="mt-5 space-y-6">
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Locations</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., San Francisco, Remote, New York"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Salary Range</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Min salary"
                      />
                      <input
                        type="number"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Max salary"
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
                      defaultChecked
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Enable auto-apply
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      defaultChecked
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Generate custom cover letters
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
                      defaultValue="50"
                      min="1"
                      max="100"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save Settings
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
