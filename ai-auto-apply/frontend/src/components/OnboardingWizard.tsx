import { useState } from 'react';
import { useOnboarding } from '../context/OnboardingContext';
import { useUnifiedResumeManager } from '../hooks/useUnifiedResumeManager';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ProfileFields, JobPreferenceFields, AutoApplySettingsFields, ProfileFormData, JobPreferenceFormData, AutoApplySettingsFormData } from '../components/shared';

const OnboardingWizard = () => {
  const { currentStep, onboardingData, updateStep, updateOnboardingData, markOnboardingComplete } = useOnboarding();
  const { uploadResumeForOnboarding, getResumeForOnboarding, uploading, resumeUploaded, resumeCount, canUploadMore } = useUnifiedResumeManager();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<{
    email: string;
    profileInfo: ProfileFormData;
    jobPreferences: JobPreferenceFormData;
    autoApplySettings: AutoApplySettingsFormData;
  }>({
    email: '',
    profileInfo: {
      firstName: '',
      lastName: '',
      phone: '',
      location: '',
      headline: '',
      summary: '',
    },
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
  });

  const totalSteps = 6;

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      // Save current step data
      saveStepData();
      updateStep(currentStep + 1);
    } else {
      // Complete onboarding
      saveStepData();
      await markOnboardingComplete();
      // Navigate to homepage after completion
      navigate('/');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      saveStepData();
      updateStep(currentStep - 1);
    }
  };

  const saveStepData = () => {
    switch (currentStep) {
      case 1: // Email verification
        updateOnboardingData({ emailVerified: true });
        break;
      case 2: // Resume upload - check unified resume manager
        updateOnboardingData({ resumeUploaded: resumeUploaded });
        break;
      case 3: // Profile info
        updateOnboardingData({
          profileComplete: true,
          profileInfo: formData.profileInfo,
        });
        break;
      case 4: // Job preferences
        updateOnboardingData({
          settingsComplete: true,
          settingsData: {
            ...formData.jobPreferences,
            salaryMin: formData.jobPreferences.salaryMin ? Number(formData.jobPreferences.salaryMin) : null,
            salaryMax: formData.jobPreferences.salaryMax ? Number(formData.jobPreferences.salaryMax) : null,
            ...formData.autoApplySettings,
          },
        });
        break;
    }
  };

  const updateFormData = (section: string, field: string, value: any) => {
    if (section === 'profileInfo') {
      setFormData(prev => ({
        ...prev,
        profileInfo: {
          ...prev.profileInfo,
          [field]: value,
        },
      }));
    } else if (section === 'jobPreferences') {
      setFormData(prev => ({
        ...prev,
        jobPreferences: {
          ...prev.jobPreferences,
          [field]: value,
        },
      }));
    } else if (section === 'autoApplySettings') {
      setFormData(prev => ({
        ...prev,
        autoApplySettings: {
          ...prev.autoApplySettings,
          [field]: value,
        },
      }));
    } else {
      // For email only (resume is handled by unified manager)
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Verify your email</h2>
              <p className="mt-2 text-gray-600">We've sent a verification link to your email. Please check your inbox and click the link to continue.</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>Next steps:</strong> After verifying your email, click "Next" to continue with resume upload.
              </p>
            </div>
          </div>
        );

      case 2:
        const currentResume = getResumeForOnboarding();
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Upload your resume</h2>
              <p className="mt-2 text-gray-600">Upload your resume to help us find the best job matches for you. This resume will be used across all features.</p>
            </div>
            
            {/* Show current resume if exists */}
            {currentResume && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Current Resume:</p>
                    <p className="text-sm text-green-600">{currentResume.original_filename}</p>
                    <p className="text-xs text-green-500">Uploaded: {new Date(currentResume.upload_date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-green-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Upload area - show if no resume or allow replacement */}
            {!canUploadMore && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">
                  ⚠️ Resume limit reached ({resumeCount}/3). Please delete an existing resume before uploading a new one.
                </p>
              </div>
            )}
            <div className={`border-2 border-dashed ${uploading ? 'border-gray-400 bg-gray-50' : 'border-gray-300'} rounded-lg p-6 text-center`}>
              <div className="space-y-2">
                <div className={`${uploading ? 'text-gray-400' : 'text-gray-400'}`}>
                  {uploading ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
                  ) : (
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {!uploading && (
                    <label htmlFor="resume-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                      <span>{currentResume ? 'Upload a new resume' : 'Upload a file'}</span>
                      <input 
                        id="resume-upload" 
                        type="file" 
                        className="sr-only" 
                        accept=".pdf,.doc,.docx" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              await uploadResumeForOnboarding(file);
                              // Clear the file input
                              e.target.value = '';
                            } catch (error) {
                              console.error('Upload failed:', error);
                            }
                          }
                        }} 
                        disabled={uploading || !canUploadMore}
                      />
                    </label>
                  )}
                  <p className="pl-1">{uploading ? 'Uploading...' : 'or drag and drop'}</p>
                </div>
                <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
              </div>
            </div>

            {/* Resume uploaded confirmation */}
            {resumeUploaded && (
              <div className="mt-4 text-sm text-green-600 bg-green-50 rounded-md p-3">
                ✅ Resume uploaded successfully! This resume will be available in AI-Apply and all other features.
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Complete your profile</h2>
              <p className="mt-2 text-gray-600">Tell us about yourself to personalize your job search experience.</p>
            </div>
            <ProfileFields
              data={formData.profileInfo}
              onChange={(field, value) => updateFormData('profileInfo', field, value)}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Set your job preferences</h2>
              <p className="mt-2 text-gray-600">Configure your job search criteria to find the perfect matches.</p>
            </div>
            <JobPreferenceFields
              data={formData.jobPreferences}
              onChange={(field, value) => updateFormData('jobPreferences', field, value)}
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Auto-Apply Settings</h2>
              <p className="mt-2 text-gray-600">Configure how AI Auto Apply should work for you.</p>
            </div>
            <AutoApplySettingsFields
              data={formData.autoApplySettings}
              onChange={(field, value) => updateFormData('autoApplySettings', field, value)}
            />
          </div>
        );

      case 6:
        const reviewResume = getResumeForOnboarding();
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Review your information</h2>
              <p className="mt-2 text-gray-600">Please review all the information you've provided before completing setup.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 space-y-6">
              {/* Resume Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900">Resume</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  {reviewResume ? (
                    <>
                      <p><strong>File:</strong> {reviewResume.original_filename}</p>
                      <p><strong>Uploaded:</strong> {new Date(reviewResume.upload_date).toLocaleDateString()}</p>
                      <p><strong>Status:</strong> <span className="text-green-600">✅ Ready for AI analysis</span></p>
                    </>
                  ) : (
                    <p className="text-red-600">No resume uploaded</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p><strong>Name:</strong> {formData.profileInfo.firstName} {formData.profileInfo.lastName}</p>
                  <p><strong>Location:</strong> {formData.profileInfo.location}</p>
                  <p><strong>Headline:</strong> {formData.profileInfo.headline}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Job Preferences</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p><strong>Keywords:</strong> {formData.jobPreferences.keywords}</p>
                  <p><strong>Locations:</strong> {formData.jobPreferences.locations}</p>
                  <p><strong>Salary Range:</strong> {formData.jobPreferences.salaryMin && formData.jobPreferences.salaryMax ? `$${formData.jobPreferences.salaryMin} - $${formData.jobPreferences.salaryMax}` : 'Not specified'}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Auto-Apply Settings</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p><strong>Auto-Apply Enabled:</strong> {formData.autoApplySettings.enableAutoApply ? 'Yes' : 'No'}</p>
                  <p><strong>Cover Letters:</strong> {formData.autoApplySettings.generateCoverLetters ? 'Auto-generate' : 'No'}</p>
                  <p><strong>Remote Only:</strong> {formData.autoApplySettings.applyRemoteOnly ? 'Yes' : 'No'}</p>
                  <p><strong>Max Applications/Day:</strong> {formData.autoApplySettings.maxApplicationsPerDay}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-800">
                <strong>🎉 Ready to start!</strong> Your resume will be available across all features including AI-Apply, Jobs, and Profile pages.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white shadow sm:rounded-lg">
          {/* Progress Bar */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-500">Step {currentStep} of {totalSteps}</span>
              </div>
              <div className="flex-1 mx-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="px-6 py-8">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Previous
            </button>
            <button
              onClick={handleNext}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {currentStep === totalSteps ? 'Complete Setup' : 'Next'}
              <ChevronRightIcon className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
