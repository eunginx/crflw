import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useUnifiedResumeManager } from '../hooks/useUnifiedResumeManager';
import { ProfileFields, ProfileFormData } from '../components/shared';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const { profile, loading, error, saveProfile } = useUser();
  const { hasResume, activeResume, uploadResume, uploading, resumeCount, canUploadMore } = useUnifiedResumeManager();

  const [form, setForm] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    headline: '',
    summary: '',
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<
    | { type: 'success'; message: string }
    | { type: 'error'; message: string }
    | null
  >(null);

  // Populate form when profile loads from context
  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        location: profile.location || '',
        headline: profile.headline || '',
        summary: profile.summary || '',
      });
    }
  }, [profile]);

  // Show error from context if any
  useEffect(() => {
    if (error) {
      setStatus({
        type: 'error',
        message: error
      });
    }
  }, [error]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);

    try {
      await saveProfile(form);
      setStatus({
        type: 'success',
        message: 'Profile updated successfully!'
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      setStatus({
        type: 'error',
        message: 'Failed to save profile. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (file: File) => {
    try {
      await uploadResume(file);
      alert('Resume uploaded successfully! It is now available across all features.');
    } catch (error) {
      console.error('Resume upload failed:', error);
      alert('Failed to upload resume: ' + (error as Error).message);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>

            {loading && (
              <div className="mt-4 rounded-md bg-blue-50 p-4 text-blue-800">
                Loading your profile...
              </div>
            )}

            {status && (
              <div
                className={
                  status.type === 'success'
                    ? 'mt-4 rounded-md bg-green-50 p-4 text-green-800'
                    : 'mt-4 rounded-md bg-red-50 p-4 text-red-800'
                }
              >
                {status.message}
              </div>
            )}

            <div className="mt-5 space-y-6">
              {/* Email Display (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {currentUser?.email}
                </div>
              </div>

              {/* Profile Fields */}
              <ProfileFields
                data={form}
                onChange={handleChange}
                disabled={loading || saving}
              />

              {/* User ID and Email Verified (Read-only) */}
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      User ID
                    </label>
                    <div className="mt-1 text-sm text-gray-900">
                      {currentUser?.uid}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Email verified
                    </label>
                    <div className="mt-1 text-sm text-gray-900">
                      {currentUser?.emailVerified ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Resume Information</h3>
            <div className="mt-5 border-t border-gray-200 pt-5">
              {/* Resume Limit Info */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Resume Storage:</span> {resumeCount}/3 resumes used
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${canUploadMore ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {canUploadMore ? 'Can upload more' : 'Limit reached'}
                  </span>
                </div>
              </div>

              {!canUploadMore && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">
                    ⚠️ Resume limit reached (3/3). Please delete an existing resume before uploading a new one.
                  </p>
                </div>
              )}

              {hasResume && activeResume ? (
                <div className="space-y-4">
                  {/* Current Resume Display */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="text-sm font-medium text-green-900">
                          Active Resume: {activeResume.original_filename}
                        </div>
                        <div className="mt-1 text-sm text-green-600">
                          <p>Uploaded: {new Date(activeResume.upload_date).toLocaleDateString()}</p>
                          <p>Status: Ready for AI analysis and job matching</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resume Actions */}
                  <div className="flex justify-center space-x-3">
                    <label htmlFor="profile-resume-replace" className={`cursor-pointer ${!canUploadMore ? 'cursor-not-allowed' : ''}`}>
                      <span className={`inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md ${canUploadMore ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50' : 'border-gray-200 text-gray-500 bg-gray-100 cursor-not-allowed'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {canUploadMore ? 'Replace Resume' : 'Limit Reached (3/3)'}
                      </span>
                      <input
                        id="profile-resume-replace"
                        name="profile-resume-replace"
                        type="file"
                        className="sr-only"
                        accept=".pdf,.doc,.docx"
                        disabled={uploading || !canUploadMore}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleResumeUpload(file);
                        }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="mt-4">
                    <label htmlFor="profile-resume-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Upload your resume
                      </span>
                      <span className="mt-1 block text-sm text-gray-500">
                        PDF, DOC, DOCX up to 10MB
                      </span>
                    </label>
                    <input
                      id="profile-resume-upload"
                      name="profile-resume-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf,.doc,.docx"
                      disabled={uploading || !canUploadMore}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleResumeUpload(file);
                      }}
                    />
                  </div>
                  {uploading ? (
                    <div className="mt-4">
                      <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 opacity-75 cursor-not-allowed">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <label htmlFor="profile-resume-upload" className={`cursor-pointer ${!canUploadMore ? 'cursor-not-allowed' : ''}`}>
                        <span className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md ${canUploadMore ? 'text-white bg-blue-600 hover:bg-blue-700' : 'text-gray-500 bg-gray-300 cursor-not-allowed'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}>
                          {canUploadMore ? 'Upload Resume' : 'Limit Reached (3/3)'}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
