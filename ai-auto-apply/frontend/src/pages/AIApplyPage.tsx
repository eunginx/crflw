import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useResumeManager } from '../hooks/useResumeManager';
import ResumeUploadBox from '../components/resume/ResumeUploadBox';
import ResumeList from '../components/resume/ResumeList';
import EnhancedProcessResults from '../components/resume/EnhancedProcessResults';

const AIApplyPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Use the custom hook to manage all resume-related state and operations
  const resumeManager = useResumeManager(currentUser?.uid);

  // Debug: Check what functions are available (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 AIApplyPage Debug:', {
      currentUser: !!currentUser,
      userId: currentUser?.uid,
      userEmail: currentUser?.email,
      resumeCount: resumeManager.resumes.length,
      loading: resumeManager.loading
    });
  }

  const handleApplyToJobs = async () => {
    if (!currentUser) return;
    
    setIsProcessing(true);
    try {
      // TODO: Implement AI apply logic using the hook
      if (process.env.NODE_ENV === 'development') {
        console.log('AI Apply functionality to be implemented');
        console.log('Active resume:', resumeManager.activeResume);
        console.log('Unified result:', resumeManager.unifiedResult);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in AI Apply:', error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">AI Apply</h1>
      <p>Upload your resume to get started with AI applications.</p>
      
      {/* Resume Upload Section */}
      {!resumeManager.activeResume && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Resume</h2>
          <ResumeUploadBox
            uploading={resumeManager.uploading}
            onUpload={resumeManager.uploadResume}
            userEmail={currentUser?.email || undefined}
            disabled={!currentUser}
          />
        </div>
      )}

      {/* Resume List - CRUD Operations */}
      {resumeManager.loading && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Resumes</h2>
          <p className="text-gray-600">Loading your resumes...</p>
        </div>
      )}
      
      {!resumeManager.loading && resumeManager.resumes.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Resumes</h2>
          <ResumeList
            resumes={resumeManager.resumes}
            activeResume={resumeManager.activeResume}
            onSetActive={resumeManager.setResumeActive || (() => Promise.resolve())}
            onDelete={resumeManager.deleteResume || (() => Promise.resolve())}
            onProcess={resumeManager.processResume || (() => Promise.resolve())}
            loading={resumeManager.loading}
            processing={resumeManager.processing}
          />
        </div>
      )}
      
      {!resumeManager.loading && resumeManager.resumes.length === 0 && currentUser && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Resumes</h2>
          <p className="text-gray-600">No resumes found. Upload your first resume to get started!</p>
        </div>
      )}
      
      {!currentUser && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Resumes</h2>
          <p className="text-gray-600">Please sign in to view and manage your resumes.</p>
        </div>
      )}

      {/* Process Active Resume Button */}
      {resumeManager.activeResume && !resumeManager.processedResume && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Process Active Resume</h2>
          <p className="text-gray-600 mb-4">
            Extract text and generate preview from your active resume: <strong>{resumeManager.activeResume.original_filename}</strong>
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Only the active resume will be processed. Other resumes in your list will remain unprocessed until you set them as active.
            </p>
          </div>
          <button
            onClick={() => resumeManager.processResume?.(resumeManager.activeResume?.id)}
            disabled={resumeManager.processing}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {resumeManager.processing ? 'Processing...' : 'Process Active Resume'}
          </button>
        </div>
      )}

      {/* Processed Results - Only for Active Resume */}
      {(() => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 UI Debug - processedResume exists:', !!resumeManager.processedResume);
          console.log('🔍 UI Debug - activeResume exists:', !!resumeManager.activeResume);
          console.log('🔍 UI Debug - processedResume text length:', resumeManager.processedResume?.textLength);
        }
        return resumeManager.processedResume && resumeManager.activeResume;
      })() && (
        <div className="mt-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Active Resume Processed: {resumeManager.activeResume?.original_filename}
            </h3>
            <p className="text-sm text-green-700">
              Your active resume has been successfully processed. The extracted text and analysis below are for this resume only.
            </p>
          </div>
          <EnhancedProcessResults
            processedResume={resumeManager.processedResume}
            unifiedResult={resumeManager.unifiedResult}
            screenshotUrl={resumeManager.screenshotUrl}
            activeResume={resumeManager.activeResume}
          />
        </div>
      )}

      {/* Debug info */}
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <p>Current user: {currentUser?.email}</p>
        <p>Active resume: {resumeManager.activeResume ? 'Yes' : 'No'}</p>
        <p>Resumes count: {resumeManager.resumes.length}</p>
        <p>Processed resume: {resumeManager.processedResume ? 'Yes' : 'No'}</p>
        <p>Uploading: {resumeManager.uploading ? 'Yes' : 'No'}</p>
        <p>Processing: {resumeManager.processing ? 'Yes' : 'No'}</p>
        <p>Screenshot URL: {resumeManager.screenshotUrl ? 'Available' : 'Not available'}</p>
        <button 
          onClick={handleApplyToJobs}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Test AI Apply
        </button>
      </div>
    </div>
  );
};

export default AIApplyPage;
