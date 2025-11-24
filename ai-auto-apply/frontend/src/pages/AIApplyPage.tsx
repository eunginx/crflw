import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAIApplyManager } from '../hooks/useAIApplyManager';
import ResumeUpload from '../components/AIApply/ResumeUpload';
import ResumeList from '../components/AIApply/ResumeList';
import DocumentInfoCard from '../components/AIApply/DocumentInfoCard';
import PDFMetadataCard from '../components/AIApply/PDFMetadataCard';
import ExtractedTextCard from '../components/AIApply/ExtractedTextCard';
import AestheticScoreCard from '../components/AIApply/AestheticScoreCard';
import SkillsCard from '../components/AIApply/SkillsCard';
import SectionsCard from '../components/AIApply/SectionsCard';
import RecommendationsCard from '../components/AIApply/RecommendationsCard';
import OnboardingBanner from '../components/AIApply/OnboardingBanner';
import { ProcessingSkeleton, AnalysisSkeleton, ResumeListSkeleton } from '../components/AIApply/LoadingSkeletons';
import CurrentStatus from '../components/AIApply/CurrentStatus';

const AIApplyPage: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [needsProcessing, setNeedsProcessing] = useState(true); // Default to true for safety
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false); // Default to false - requires user action
  const [analysisCompleted, setAnalysisCompleted] = useState(false); // Track if analysis was done for current resume

  // Use the new AI Apply manager hook (must be called before early returns)
  const aiApplyManager = useAIApplyManager(currentUser?.email || '');

  // Check if user needs to process resume
  useEffect(() => {
    const checkProcessingStatus = async () => {
      if (currentUser?.email && aiApplyManager.activeResume) {
        try {
          const status = await aiApplyManager.checkIfNeedsProcessing(currentUser.email);
          setNeedsProcessing(status.data.needsProcessing);
          console.log('🔍 Processing status updated:', status.data);
        } catch (error) {
          console.error('Error checking processing status:', error);
          // If there are processing results, assume no processing needed
          setNeedsProcessing(!aiApplyManager.processingResults);
        }
      }
    };

    checkProcessingStatus();
  }, [currentUser, aiApplyManager.activeResume, aiApplyManager.processingResults]);

  // Manual AI analysis function
  const handleAnalyzeResume = async () => {
    if (!aiApplyManager.processingResults) {
      setError('Please process your resume first before analyzing.');
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log('🧠 Starting AI analysis...');
      const analysisResults = await aiApplyManager.runAIAnalysis(
        aiApplyManager.processingResults.extracted_text || '',
        JSON.stringify(aiApplyManager.processingResults),
        [] // Resume sections would be extracted from processing results
      );
      setAiAnalysis(analysisResults);
      setAnalysisCompleted(true);
      console.log('🧠 AI analysis completed:', analysisResults);
    } catch (error) {
      console.error('Error running AI analysis:', error);
      setError('Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset analysis state when resume changes
  useEffect(() => {
    setAiAnalysis(null);
    setAnalysisCompleted(false);
    setIsAnalyzing(false);
  }, [aiApplyManager.activeResume?.id]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);

  // Check onboarding status
  useEffect(() => {
    if (currentUser) {
      // TODO: Check actual onboarding status from user profile
      setOnboardingCompleted(false); // Set to true once onboarding is implemented
    }
  }, [currentUser]);

  // Clear error when processing completes
  useEffect(() => {
    if (!aiApplyManager.processing && !aiApplyManager.uploading) {
      setError(null);
    }
  }, [aiApplyManager.processing, aiApplyManager.uploading]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!currentUser) {
    return null;
  }

  const handleApplyToJobs = async () => {
    if (!aiApplyManager.activeResume) {
      setError('Please select an active resume first');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      console.log('🚀 Starting AI Apply pipeline...');
      
      // Step 1: Get job matches
      const jobMatchesResponse = await aiApplyManager.getJobMatches(
        aiApplyManager.activeResume.id,
        currentUser?.email || '',
        {}
      );
      
      if (!jobMatchesResponse.success) {
        throw new Error('Failed to get job matches');
      }
      
      console.log(`✅ Found ${jobMatchesResponse.data.totalMatches} job matches`);
      
      // Step 2: For each top match, generate cover letter and submit application
      const topJobs = jobMatchesResponse.data.jobs.slice(0, 3); // Top 3 matches
      const applications = [];
      
      for (const job of topJobs) {
        try {
          // Generate cover letter
          const coverLetterResponse = await aiApplyManager.generateCoverLetter(
            aiApplyManager.activeResume.id,
            currentUser?.email || '',
            job.id,
            job
          );
          
          // Auto-fill application data
          const autoFillResponse = await aiApplyManager.autoFillApplication(
            aiApplyManager.activeResume.id,
            currentUser?.email || '',
            job.id
          );
          
          // Submit application
          const submitResponse = await aiApplyManager.submitApplication(
            aiApplyManager.activeResume.id,
            currentUser?.email || '',
            job.id,
            autoFillResponse.data.autoFillData,
            coverLetterResponse.data.id
          );
          
          applications.push({
            job: job.title,
            company: job.company,
            status: submitResponse.data.status,
            applicationId: submitResponse.data.applicationId
          });
          
          console.log(`✅ Applied to ${job.title} at ${job.company}`);
          
        } catch (jobError) {
          console.error(`❌ Failed to apply to ${job.title}:`, jobError);
          // Continue with other jobs even if one fails
        }
      }
      
      // Show success message
      const successMessage = `Successfully submitted ${applications.length} applications!`;
      setError(null);
      
      // You could show a success modal or update UI here
      alert(successMessage);
      
      console.log('🎉 AI Apply pipeline completed:', applications);
      
    } catch (error) {
      setError('Failed to complete AI Apply process. Please try again.');
      console.error('AI Apply error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Apply</h1>
        <p className="text-lg text-gray-600">
          Transform your resume into a powerful job application tool with AI-powered insights
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Onboarding Banner */}
      <OnboardingBanner 
        isCompleted={onboardingCompleted}
      />

      {/* Current Status */}
      <CurrentStatus />

      {/* Your Resume Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Resume</h2>
          {aiApplyManager.activeResume && (
            <button
              onClick={() => document.getElementById('resume-upload-input')?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Upload New Resume
            </button>
          )}
        </div>

        {/* Resume Upload Section */}
        {!aiApplyManager.activeResume && (
          <ResumeUpload
            uploading={aiApplyManager.uploading}
            onUpload={aiApplyManager.uploadResume}
            userEmail={currentUser?.email || ''}
            disabled={false}
          />
        )}

        {/* Resume Management Section */}
        {aiApplyManager.loading && <ResumeListSkeleton />}
        
        {!aiApplyManager.loading && aiApplyManager.resumes.length > 0 && (
          <ResumeList
            resumes={aiApplyManager.resumes}
            activeResume={aiApplyManager.activeResume}
            onSetActive={aiApplyManager.setActiveResume}
            onDelete={aiApplyManager.deleteResume}
            onProcess={aiApplyManager.processResume}
            onAIAnalysis={aiApplyManager.startAIAnalysis}
            loading={aiApplyManager.loading}
            processing={aiApplyManager.processing}
          />
        )}
        
        {!aiApplyManager.loading && aiApplyManager.resumes.length === 0 && currentUser && (
          <div className="text-center py-8 text-gray-500">
            <p>No resumes found. Upload your first resume to get started!</p>
          </div>
        )}
        
        {!currentUser && (
          <div className="text-center py-8 text-gray-500">
            <p>Please sign in to view and manage your resumes.</p>
          </div>
        )}
      </div>

      {/* PDF Processing Section */}
      {aiApplyManager.activeResume && !aiApplyManager.processingResults && needsProcessing && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resume Processing</h3>
          <p className="text-gray-600 mb-4">Click "Parse PDF" to extract text and metadata from your resume.</p>
          <button
            onClick={() => aiApplyManager.processResume(aiApplyManager.activeResume?.id || '')}
            disabled={aiApplyManager.processing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiApplyManager.processing ? 'Processing...' : 'Parse PDF'}
          </button>
        </div>
      )}

      {/* Show when processing is up to date */}
      {aiApplyManager.activeResume && !needsProcessing && !aiApplyManager.processingResults && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resume Processing</h3>
          <div className="flex items-center gap-3 text-green-600">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-medium">Resume Already Processed</p>
              <p className="text-sm text-gray-600">Your resume has been parsed and is ready to use.</p>
            </div>
          </div>
          <button
            onClick={() => aiApplyManager.processResume(aiApplyManager.activeResume?.id || '')}
            disabled={aiApplyManager.processing}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {aiApplyManager.processing ? 'Processing...' : 'Re-parse PDF'}
          </button>
        </div>
      )}

      {aiApplyManager.processing && <ProcessingSkeleton />}

      {/* Processing Results Section */}
      {aiApplyManager.processingResults && (
        <div className="space-y-8">
          {/* Document Info & Metadata */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DocumentInfoCard
              filename={aiApplyManager.activeResume?.file_path || ''}
              uploadedAt={aiApplyManager.activeResume?.upload_date || ''}
              fileSize={aiApplyManager.activeResume?.file_size || 0}
              originalFilename={aiApplyManager.activeResume?.original_filename || ''}
            />
            <PDFMetadataCard
              title={aiApplyManager.processingResults.pdf_title}
              author={aiApplyManager.processingResults.pdf_author}
              creator={aiApplyManager.processingResults.pdf_creator}
              producer={aiApplyManager.processingResults.pdf_producer}
              totalPages={aiApplyManager.processingResults.num_pages || 0}
              processedAt={aiApplyManager.processingResults.processed_at || ''}
            />
          </div>

          {/* Extracted Text & Resume Sections Grouped */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ExtractedTextCard
              text={aiApplyManager.processingResults.extracted_text}
              textLength={aiApplyManager.processingResults.text_length}
              filename={aiApplyManager.activeResume?.original_filename}
            />
            <SectionsCard
              sections={[
                { type: 'summary', present: true, completeness: 85 },
                { type: 'experience', present: true, completeness: 90 },
                { type: 'education', present: true, completeness: 80 },
                { type: 'skills', present: true, completeness: 75 }
              ]}
            />
          </div>

          {/* AI Analysis Section - Only show after processing is complete */}
          {aiApplyManager.processingResults && (
            <div className="space-y-8">
              {/* Analyze Button - Only show if analysis hasn't been completed for this resume */}
              {!analysisCompleted && (
                <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ready to Analyze Your Resume</h3>
                  <p className="text-gray-600 mb-6">
                    Get AI-powered insights about your resume's aesthetic appeal, skills, and receive personalized recommendations.
                  </p>
                  <button
                    onClick={handleAnalyzeResume}
                    disabled={isAnalyzing}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyzing Resume...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Analyze Resume
                      </>
                    )}
                  </button>
                  {error && (
                    <div className="mt-4 text-sm text-red-600">
                      {error}
                    </div>
                  )}
                </div>
              )}

              {/* AI Analysis Results - Only show after analysis is completed */}
              {analysisCompleted && aiAnalysis && (
                <>
                {/* Aesthetic Score */}
                {aiAnalysis?.aesthetic && (
                <AestheticScoreCard
                  score={aiAnalysis.aesthetic.score}
                  strengths={aiAnalysis.aesthetic.strengths}
                  improvements={aiAnalysis.aesthetic.improvements}
                  assessment={aiAnalysis.aesthetic.assessment}
                />
              )}

              {/* Skills */}
              {aiAnalysis?.skills && (
                <SkillsCard
                  skills={aiAnalysis.skills}
                />
              )}

              {/* Recommendations */}
              {aiAnalysis?.recommendations && (
                (aiAnalysis.recommendations.recommendations?.length > 0 || 
                 aiAnalysis.recommendations.strengths?.length > 0 || 
                 aiAnalysis.recommendations.improvements?.length > 0) && (
                  <RecommendationsCard
                    recommendations={aiAnalysis.recommendations.recommendations || []}
                    strengths={aiAnalysis.recommendations.strengths || []}
                    improvements={aiAnalysis.recommendations.improvements || []}
                  />
                )
              )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* AI Apply Action Button */}
      {aiApplyManager.processingResults && (
        <div className="text-center">
          <button
            onClick={handleApplyToJobs}
            disabled={isProcessing || !aiApplyManager.processingResults}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            {isProcessing ? 'Processing...' : 'Start AI Apply'}
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Automatically apply to jobs with AI-powered matching and customization
          </p>
        </div>
      )}

      {/* Development Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Debug Information</h3>
          <div className="text-xs space-y-1">
            <p>Current user: {currentUser?.email}</p>
            <p>Active resume: {aiApplyManager.activeResume ? 'Yes' : 'No'}</p>
            <p>Resumes count: {aiApplyManager.resumes.length}</p>
            <p>Processing results: {aiApplyManager.processingResults ? 'Yes' : 'No'}</p>
            <p>Status: {aiApplyManager.status}</p>
            <p>Uploading: {aiApplyManager.uploading ? 'Yes' : 'No'}</p>
            <p>Processing: {aiApplyManager.processing ? 'Yes' : 'No'}</p>
            <p>Screenshot available: {aiApplyManager.processingResults?.screenshot_path ? 'Yes' : 'No'}</p>
            <p>Aesthetic score: N/A (using mock data)</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIApplyPage;
