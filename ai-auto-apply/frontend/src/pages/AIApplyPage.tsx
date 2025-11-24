import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAIApplyManager } from '../hooks/useAIApplyManager';
import {
  ResumeUpload,
  PDFProcessingCard,
  ResumePreview,
  ExtractedTextCard,
  ResumeAnalysisCard,
  HowAIWorks,
  CurrentStatus
} from '../components/AIApply';
import ResumeList from '../components/resume/ResumeList';

const AIApplyPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Use the new AI Apply manager hook
  const aiApplyManager = useAIApplyManager(currentUser?.uid);

  // Debug: Check what functions are available (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 AIApplyPage Debug v5:', {
      currentUser: !!currentUser,
      userId: currentUser?.uid,
      userEmail: currentUser?.email,
      resumeCount: aiApplyManager.resumes.length,
      loading: aiApplyManager.loading,
      status: aiApplyManager.status,
      hasActiveResume: !!aiApplyManager.activeResume,
      hasResults: !!aiApplyManager.processingResults,
      uploading: aiApplyManager.uploading
    });
  }

  const handleApplyToJobs = async () => {
    if (!currentUser) return;
    
    setIsProcessing(true);
    try {
      // TODO: Implement AI apply logic using the hook
      if (process.env.NODE_ENV === 'development') {
        console.log('AI Apply functionality to be implemented');
        console.log('Active resume:', aiApplyManager.activeResume);
        console.log('Processing results:', aiApplyManager.processingResults);
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
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Apply</h1>
        <p className="text-lg text-gray-600">
          Transform your resume into a powerful job application tool with AI-powered insights
        </p>
      </div>

      {/* Current Status */}
      <CurrentStatus />

      {/* Resume Upload Section */}
      {!aiApplyManager.activeResume && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Your Resume</h2>
          <ResumeUpload
            uploading={aiApplyManager.uploading}
            onUpload={aiApplyManager.uploadResume}
            userEmail={currentUser?.email || undefined}
            disabled={!currentUser}
          />
        </div>
      )}

      {/* Resume Management Section */}
      {aiApplyManager.loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Resumes</h2>
          <p className="text-gray-600">Loading your resumes...</p>
        </div>
      )}
      
      {!aiApplyManager.loading && aiApplyManager.resumes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Resumes</h2>
          <ResumeList
            resumes={aiApplyManager.resumes}
            activeResume={aiApplyManager.activeResume}
            onSetActive={aiApplyManager.setActiveResume}
            onDelete={aiApplyManager.deleteResume}
            onProcess={aiApplyManager.processResume}
            loading={aiApplyManager.loading}
            processing={aiApplyManager.processing}
          />
        </div>
      )}
      
      {!aiApplyManager.loading && aiApplyManager.resumes.length === 0 && currentUser && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Resumes</h2>
          <p className="text-gray-600">No resumes found. Upload your first resume to get started!</p>
        </div>
      )}
      
      {!currentUser && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Resumes</h2>
          <p className="text-gray-600">Please sign in to view and manage your resumes.</p>
        </div>
      )}

      {/* Process Active Resume Button */}
      {aiApplyManager.activeResume && !aiApplyManager.processingResults && (
        <PDFProcessingCard
          processing={aiApplyManager.processing}
          processedResume={null}
          onProcess={() => aiApplyManager.processResume(aiApplyManager.activeResume?.id)}
        />
      )}

      {/* PDF Processing Results */}
      {aiApplyManager.processing && (
        <PDFProcessingCard
          processing={true}
          processedResume={null}
        />
      )}

      {aiApplyManager.processingResults && (
        <PDFProcessingCard
          processing={false}
          processedResume={{
            text: aiApplyManager.processingResults.extracted_text || '',
            textLength: aiApplyManager.processingResults.text_length || 0,
            filename: aiApplyManager.activeResume?.original_filename || 'Resume',
            processedAt: aiApplyManager.processingResults.processed_at || new Date().toISOString(),
            metadata: {
              totalPages: aiApplyManager.processingResults.num_pages || 0,
              title: aiApplyManager.processingResults.pdf_title,
              author: aiApplyManager.processingResults.pdf_author,
              creator: aiApplyManager.processingResults.pdf_creator,
              producer: aiApplyManager.processingResults.pdf_producer
            }
          }}
        />
      )}

      {/* Resume Preview */}
      {aiApplyManager.processingResults && (
        <ResumePreview
          screenshotUrl={aiApplyManager.getScreenshotUrl(aiApplyManager.processingResults.screenshot_path)}
          filename={aiApplyManager.activeResume?.original_filename}
          totalPages={aiApplyManager.processingResults.num_pages}
        />
      )}

      {/* Extracted Text */}
      {aiApplyManager.processingResults && (
        <ExtractedTextCard
          text={aiApplyManager.processingResults.extracted_text}
          textLength={aiApplyManager.processingResults.text_length}
          filename={aiApplyManager.activeResume?.original_filename}
        />
      )}

      {/* Resume Analysis */}
      {aiApplyManager.processingResults?.analysis && (
        <ResumeAnalysisCard analysis={aiApplyManager.processingResults.analysis} />
      )}

      {/* How AI Works */}
      <HowAIWorks />

      {/* Development Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Debug Information</h3>
          <p>Current user: {currentUser?.email}</p>
          <p>Active resume: {aiApplyManager.activeResume ? 'Yes' : 'No'}</p>
          <p>Resumes count: {aiApplyManager.resumes.length}</p>
          <p>Processing results: {aiApplyManager.processingResults ? 'Yes' : 'No'}</p>
          <p>Status: {aiApplyManager.status}</p>
          <p>Uploading: {aiApplyManager.uploading ? 'Yes' : 'No'}</p>
          <p>Processing: {aiApplyManager.processing ? 'Yes' : 'No'}</p>
          <p>Screenshot available: {aiApplyManager.processingResults?.screenshot_path ? 'Yes' : 'No'}</p>
          <button 
            onClick={handleApplyToJobs}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Test AI Apply
          </button>
        </div>
      )}
    </div>
  );
};

export default AIApplyPage;
