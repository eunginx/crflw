import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../context/OnboardingContext';
import { emailUserDataAPI } from '../services/apiService';

interface ProfileData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
}

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const { onboardingData } = useOnboarding();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      if (currentUser?.email) {
        try {
          const userData = await emailUserDataAPI.getUserData(currentUser.email);
          setProfileData(userData?.profile || null);
        } catch (error) {
          console.error('Failed to load profile data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadProfileData();
  }, [currentUser]);

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
            <div className="mt-5 border-t border-gray-200">
              <dl className="divide-y divide-gray-200">
                <div className="py-4">
                  <dt className="text-sm font-medium text-gray-500">Email address</dt>
                  <dd className="mt-1 text-sm text-gray-900">{currentUser?.email}</dd>
                </div>
                <div className="py-4">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profileData?.first_name && profileData?.last_name 
                      ? `${profileData.first_name} ${profileData.last_name}`
                      : onboardingData.profileInfo?.firstName && onboardingData.profileInfo?.lastName
                      ? `${onboardingData.profileInfo.firstName} ${onboardingData.profileInfo.lastName}`
                      : 'Not set'}
                  </dd>
                </div>
                <div className="py-4">
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profileData?.phone || onboardingData.profileInfo?.phone || 'Not set'}
                  </dd>
                </div>
                <div className="py-4">
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profileData?.location || onboardingData.profileInfo?.location || 'Not set'}
                  </dd>
                </div>
                <div className="py-4">
                  <dt className="text-sm font-medium text-gray-500">Professional Headline</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profileData?.headline || onboardingData.profileInfo?.headline || 'Not set'}
                  </dd>
                </div>
                <div className="py-4">
                  <dt className="text-sm font-medium text-gray-500">Summary</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profileData?.summary || onboardingData.profileInfo?.summary || 'Not set'}
                  </dd>
                </div>
                <div className="py-4">
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{currentUser?.uid}</dd>
                </div>
                <div className="py-4">
                  <dt className="text-sm font-medium text-gray-500">Email verified</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {currentUser?.emailVerified || onboardingData.emailVerified ? 'Yes' : 'No'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Resume Information</h3>
            <div className="mt-5 border-t border-gray-200 pt-5">
              {onboardingData.resumeUploaded ? (
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm font-medium text-gray-900">Resume uploaded</span>
                    <p className="mt-1 text-sm text-gray-500">
                      Your resume has been uploaded and is ready for job matching.
                    </p>
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
                    <label htmlFor="resume-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Upload your resume
                      </span>
                      <span className="mt-1 block text-sm text-gray-500">
                        PDF, DOC, DOCX up to 10MB
                      </span>
                    </label>
                    <input
                      id="resume-upload"
                      name="resume-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf,.doc,.docx"
                    />
                  </div>
                  <button
                    type="button"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Upload Resume
                  </button>
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
