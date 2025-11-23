import { useState } from 'react';
import { useOnboarding } from '../context/OnboardingContext';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const OnboardingWizard = () => {
  const { currentStep, onboardingData, updateStep, updateOnboardingData, markOnboardingComplete } = useOnboarding();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    headline: '',
    summary: '',
    resume: null as File | null,
    keywords: '',
    locations: '',
    salaryMin: '',
    salaryMax: '',
    enableAutoApply: true,
    generateCoverLetters: true,
    applyRemoteOnly: false,
    maxApplicationsPerDay: 50,
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
      case 2: // Resume upload
        updateOnboardingData({ resumeUploaded: true });
        break;
      case 3: // Profile info
        updateOnboardingData({
          profileComplete: true,
          profileInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            location: formData.location,
            headline: formData.headline,
            summary: formData.summary,
          }
        });
        break;
      case 4: // Settings preferences
        updateOnboardingData({
          settingsComplete: true,
          settingsData: {
            keywords: formData.keywords,
            locations: formData.locations,
            salaryMin: formData.salaryMin ? Number(formData.salaryMin) : null,
            salaryMax: formData.salaryMax ? Number(formData.salaryMax) : null,
            enableAutoApply: formData.enableAutoApply,
            generateCoverLetters: formData.generateCoverLetters,
            applyRemoteOnly: formData.applyRemoteOnly,
            maxApplicationsPerDay: formData.maxApplicationsPerDay,
          }
        });
        break;
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Upload your resume</h2>
              <p className="mt-2 text-gray-600">Upload your resume to help us find the best job matches for you.</p>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="space-y-2">
                <div className="text-gray-400">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-sm text-gray-600">
                  <label htmlFor="resume-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                    <span>Upload a file</span>
                    <input id="resume-upload" type="file" className="sr-only" accept=".pdf,.doc,.docx" onChange={(e) => updateFormData('resume', e.target.files?.[0])} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
              </div>
              {formData.resume && (
                <div className="mt-4 text-sm text-green-600">
                  ✅ {formData.resume.name} uploaded
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Complete your profile</h2>
              <p className="mt-2 text-gray-600">Tell us about yourself to personalize your job search experience.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">First Name</label>
                <input 
                  id="first-name"
                  name="first-name"
                  type="text" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                  value={formData.firstName} 
                  onChange={(e) => updateFormData('firstName', e.target.value)} 
                />
              </div>
              <div>
                <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">Last Name</label>
                <input 
                  id="last-name"
                  name="last-name"
                  type="text" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                  value={formData.lastName} 
                  onChange={(e) => updateFormData('lastName', e.target.value)} 
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                <input 
                  id="phone"
                  name="phone"
                  type="tel" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                  value={formData.phone} 
                  onChange={(e) => updateFormData('phone', e.target.value)} 
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                <input 
                  id="location"
                  name="location"
                  type="text" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                  value={formData.location} 
                  onChange={(e) => updateFormData('location', e.target.value)} 
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="headline" className="block text-sm font-medium text-gray-700">Professional Headline</label>
                <input 
                  id="headline"
                  name="headline"
                  type="text" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                  placeholder="e.g., Senior Software Engineer" 
                  value={formData.headline} 
                  onChange={(e) => updateFormData('headline', e.target.value)} 
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="summary" className="block text-sm font-medium text-gray-700">Summary</label>
                <textarea 
                  id="summary"
                  name="summary"
                  rows={4} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                  value={formData.summary} 
                  onChange={(e) => updateFormData('summary', e.target.value)} 
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Set your job preferences</h2>
              <p className="mt-2 text-gray-600">Configure your job search criteria to find the perfect matches.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="keywords" className="block text-sm font-medium text-gray-700">Keywords</label>
                <input 
                  id="keywords"
                  name="keywords"
                  type="text" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                  placeholder="e.g., Software Engineer, React, TypeScript" 
                  value={formData.keywords} 
                  onChange={(e) => updateFormData('keywords', e.target.value)} 
                />
              </div>
              <div>
                <label htmlFor="locations" className="block text-sm font-medium text-gray-700">Locations</label>
                <input 
                  id="locations"
                  name="locations"
                  type="text" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                  placeholder="e.g., San Francisco, Remote, New York" 
                  value={formData.locations} 
                  onChange={(e) => updateFormData('locations', e.target.value)} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="salary-min" className="block text-sm font-medium text-gray-700">Min Salary</label>
                  <input 
                    id="salary-min"
                    name="salary-min"
                    type="number" 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                    value={formData.salaryMin} 
                    onChange={(e) => updateFormData('salaryMin', e.target.value)} 
                  />
                </div>
                <div>
                  <label htmlFor="salary-max" className="block text-sm font-medium text-gray-700">Max Salary</label>
                  <input 
                    id="salary-max"
                    name="salary-max"
                    type="number" 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                    value={formData.salaryMax} 
                    onChange={(e) => updateFormData('salaryMax', e.target.value)} 
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Auto-Apply Settings</h2>
              <p className="mt-2 text-gray-600">Configure how AI Auto Apply should work for you.</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <input 
                  id="enable-auto-apply"
                  name="enable-auto-apply"
                  type="checkbox" 
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                  checked={formData.enableAutoApply} 
                  onChange={(e) => updateFormData('enableAutoApply', e.target.checked)} 
                />
                <label htmlFor="enable-auto-apply" className="ml-2 block text-sm text-gray-900">Enable auto-apply</label>
              </div>
              <div className="flex items-center">
                <input 
                  id="generate-cover-letters"
                  name="generate-cover-letters"
                  type="checkbox" 
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                  checked={formData.generateCoverLetters} 
                  onChange={(e) => updateFormData('generateCoverLetters', e.target.checked)} 
                />
                <label htmlFor="generate-cover-letters" className="ml-2 block text-sm text-gray-900">Generate custom cover letters</label>
              </div>
              <div className="flex items-center">
                <input 
                  id="apply-remote-only"
                  name="apply-remote-only"
                  type="checkbox" 
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                  checked={formData.applyRemoteOnly} 
                  onChange={(e) => updateFormData('applyRemoteOnly', e.target.checked)} 
                />
                <label htmlFor="apply-remote-only" className="ml-2 block text-sm text-gray-900">Apply to remote-only jobs</label>
              </div>
              <div>
                <label htmlFor="max-applications-per-day" className="block text-sm font-medium text-gray-700">Max applications per day</label>
                <input 
                  id="max-applications-per-day"
                  name="max-applications-per-day"
                  type="number" 
                  min={1} 
                  max={100} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                  value={formData.maxApplicationsPerDay} 
                  onChange={(e) => updateFormData('maxApplicationsPerDay', Number(e.target.value))} 
                />
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Review your information</h2>
              <p className="mt-2 text-gray-600">Please review all the information you've provided before completing setup.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                  <p><strong>Location:</strong> {formData.location}</p>
                  <p><strong>Headline:</strong> {formData.headline}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Job Preferences</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p><strong>Keywords:</strong> {formData.keywords}</p>
                  <p><strong>Locations:</strong> {formData.locations}</p>
                  <p><strong>Salary Range:</strong> {formData.salaryMin && formData.salaryMax ? `$${formData.salaryMin} - $${formData.salaryMax}` : 'Not specified'}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Auto-Apply Settings</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p><strong>Auto-Apply Enabled:</strong> {formData.enableAutoApply ? 'Yes' : 'No'}</p>
                  <p><strong>Cover Letters:</strong> {formData.generateCoverLetters ? 'Auto-generate' : 'No'}</p>
                  <p><strong>Remote Only:</strong> {formData.applyRemoteOnly ? 'Yes' : 'No'}</p>
                  <p><strong>Max Applications/Day:</strong> {formData.maxApplicationsPerDay}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-800">
                <strong>🎉 Ready to start!</strong> Once you complete this step, you'll be able to find and apply to jobs automatically.
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
