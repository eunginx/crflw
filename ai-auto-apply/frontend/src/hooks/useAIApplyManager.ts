import React, { useState, useEffect, useCallback, useRef } from 'react';
import { aiApplyService, ResumeData, ResumeProcessingResults, StatusResponse, ResumeUploadResponse } from '../services/aiApplyService';
import { ResumeDocument } from '../types/resume';

type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

// Helper function to convert ResumeData to ResumeDocument
const convertToResumeDocument = (resume: ResumeData, userEmail: string): ResumeDocument => ({
  id: resume.id,
  user_id: userEmail, // Use email as user_id
  original_filename: resume.original_filename,
  upload_date: resume.upload_date, // Changed from uploaded_at to match API
  is_active: resume.is_active,
  processing_status: resume.processing_status as "completed" | "pending" | "error" | "processing",
  filename: resume.filename, // Use filename field
  file_size: resume.file_size,
  mime_type: resume.mime_type
});

// Helper function to convert upload response to ResumeDocument
const convertUploadResponseToResumeDocument = (response: ResumeUploadResponse['data'], userEmail: string): ResumeDocument => ({
  id: response.resumeId,
  user_id: userEmail, // Use email as user_id
  original_filename: response.originalFilename,
  upload_date: response.uploadDate, // Changed from uploaded_at to match interface
  is_active: true, // New uploads are active by default
  processing_status: 'pending', // New uploads start as pending
  filename: response.filename,
  file_size: response.size,
  mime_type: 'application/pdf' // Default for resumes
});

interface UseAIApplyManagerReturn {
  // State
  resumes: ResumeDocument[];
  activeResume: ResumeDocument | null;
  processingResults: ResumeProcessingResults | null;
  status: ProcessingStatus;
  error: string | null;
  loading: boolean;
  uploading: boolean;
  processing: boolean;
  
  // Actions
  uploadResume: (file: File, userEmail?: string, userId?: string) => Promise<void>;
  loadResumes: () => Promise<void>;
  setActiveResume: (resumeId: string) => Promise<void>;
  processResume: (resumeId: string) => Promise<void>;
  deleteResume: (resumeId: string) => Promise<void>;
  refreshResults: (resumeId: string) => Promise<void>;
  loadStatus: () => Promise<void>;
  checkIfNeedsProcessing: (userEmail: string) => Promise<any>;
  
  // AI Analysis Actions
  analyzeAestheticScore: (resumeText: string, resumeContent: string) => Promise<any>;
  analyzeSkills: (resumeText: string) => Promise<any>;
  generateRecommendations: (resumeText: string, resumeSections: any[], currentSkills: any) => Promise<any>;
  runAIAnalysis: (resumeText: string, resumeContent: string, resumeSections: any[]) => Promise<any>;
  startAIAnalysis: (resumeId: string) => Promise<void>;
  
  // AI Apply Pipeline Actions
  getJobMatches: (resumeId: string, userEmail: string, preferences?: any) => Promise<any>;
  generateCoverLetter: (resumeId: string, userEmail: string, jobId: string, jobDetails?: any) => Promise<any>;
  autoFillApplication: (resumeId: string, userEmail: string, jobId: string, applicationForm?: any) => Promise<any>;
  submitApplication: (resumeId: string, userEmail: string, jobId: string, applicationData: any, coverLetterId?: string) => Promise<any>;
  getApplicationStatus: (userEmail: string) => Promise<any>;
  
  // Helper
  getScreenshotUrl: (screenshotPath?: string) => string | null;
}

export const useAIApplyManager = (userEmail?: string): UseAIApplyManagerReturn => {
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [activeResume, setActiveResumeState] = useState<ResumeDocument | null>(null);
  const [processingResults, setProcessingResults] = useState<ResumeProcessingResults | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [currentStatus, setCurrentStatus] = useState<StatusResponse['data'] | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs to prevent duplicate requests
  const loadingRef = useRef(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Load all resumes for the user
  const loadResumes = useCallback(async () => {
    // Fallback for development/testing when no authenticated user
    const effectiveUserEmail = userEmail || 'test@example.com';
    
    if (!effectiveUserEmail || loadingRef.current) {
      return;
    }
    
    try {
      loadingRef.current = true;
      setLoading(true);
      
      const response = await aiApplyService.getUserResumes(effectiveUserEmail);
      
      // Convert ResumeData to ResumeDocument and remove duplicates
      const convertedResumes = response.data
        .map(resume => convertToResumeDocument(resume, effectiveUserEmail))
        .filter((resume, index, self) => 
          index === self.findIndex(r => r.id === resume.id)
        );
      
      setResumes(convertedResumes);
      
      // Find active resume
      const active = convertedResumes.find(resume => resume.is_active);
      if (active) {
        setActiveResumeState(active);
        
        // Always try to load persistent results first
        try {
          const persistentResults = await aiApplyService.getPersistentProcessingResults(effectiveUserEmail);
          console.log('🔍 Loaded persistent results:', persistentResults.data);
          
          if (persistentResults.data) {
            // Use persistent results if available
            setProcessingResults(persistentResults.data);
            setStatus('completed');
            setProcessing(false);
            console.log('🔍 Using persistent processing results');
          } else {
            // No persistent results, check if we need to process
            const processingStatus = await aiApplyService.checkIfNeedsProcessing(effectiveUserEmail);
            console.log('🔍 Processing status check:', processingStatus.data);
            
            if (processingStatus.data.needsProcessing) {
              console.log('🔍 Resume needs processing, no results to show');
              // Don't load anything, let user click "Parse PDF"
            } else {
              // Try to load regular results as fallback
              refreshResults(active.id).catch(console.error);
            }
          }
        } catch (statusError) {
          console.error('Error loading persistent results:', statusError);
          // Fallback to regular results
          refreshResults(active.id).catch(console.error);
        }
      } else {
        setActiveResumeState(null);
      }
      
    } catch (error) {
      console.error('Error loading resumes:', error);
      // Don't show alert for first-time users
      if (resumes.length > 0) {
        alert('Failed to load resumes. Please try again.');
      }
    } finally {
      // Always clear loading state
      setLoading(false);
      loadingRef.current = false;
    }
  }, [userEmail, resumes.length]);

  // Set a resume as active
  const setActiveResume = useCallback(async (resumeId: string) => {
    console.log('🔍 setActiveResume called:', { resumeId, userEmail });
    
    // Fallback for development/testing when no authenticated user
    const effectiveUserEmail = userEmail || 'test@example.com';
    
    if (!effectiveUserEmail) {
      console.log('🔍 setActiveResume early return: no userEmail');
      return;
    }

    try {
      console.log('🔍 setActiveResume calling API...');
      await aiApplyService.setActiveResume(resumeId, effectiveUserEmail);
      console.log('🔍 setActiveResume API call successful');
      
      if (mountedRef.current) {
        console.log('🔍 setActiveResume updating local state...');
        // Update local state
        setResumes(prev => prev.map(resume => ({
          ...resume,
          is_active: resume.id === resumeId
        })));
        
        const active = resumes.find(resume => resume.id === resumeId);
        if (active) {
          setActiveResumeState(active);
          console.log('🔍 setActiveResume local state updated');
        }
      }
    } catch (error) {
      console.error('🔍 setActiveResume error:', error);
      if (mountedRef.current) {
        alert('Failed to set active resume: ' + (error as Error).message);
      }
      throw error;
    }
  }, [userEmail, resumes]);

  // Upload a new resume
  const uploadResume = useCallback(async (file: File, userEmail?: string, userId?: string) => {
    console.log('🔍 uploadResume called:', { file: file.name, userEmail });
    
    // Use provided userEmail or fall back to context userEmail or test user
    const effectiveUserEmail = userEmail || userEmail || 'test@example.com';
    
    if (!effectiveUserEmail) {
      console.log('🔍 uploadResume early return: no userEmail');
      return;
    }

    try {
      console.log('🔍 uploadResume starting upload...');
      setUploading(true);
      setStatus('uploading');
      
      console.log('🔍 uploadResume calling aiApplyService.uploadResume...');
      const response = await aiApplyService.uploadResume(file, effectiveUserEmail, effectiveUserEmail);
      console.log('🔍 uploadResume upload response:', response);
      
      console.log('🔍 uploadResume updating state...');
      // Convert upload response to ResumeDocument and add to local state
      const newResume = convertUploadResponseToResumeDocument(response.data, effectiveUserEmail);
      setResumes(prev => [...prev, newResume]);
      
      // Check if this is the first resume (backend sets it as active automatically)
      const currentResumes = await aiApplyService.getUserResumes(effectiveUserEmail);
      const activeResumeData = currentResumes.data.find((r: ResumeData) => r.is_active);
      
      if (activeResumeData && activeResumeData.id === response.data.resumeId) {
        // This resume was set as active automatically (first resume)
        const activeResume = convertToResumeDocument(activeResumeData, effectiveUserEmail);
        setActiveResumeState(activeResume);
        console.log('🔍 uploadResume first resume set as active automatically');
      } else {
        // This resume was not set as active (user already has resumes)
        console.log('🔍 uploadResume resume added but not set as active');
      }
      
      setStatus('idle');
      alert(`Resume "${file.name}" uploaded successfully! ${activeResumeData?.id === response.data.resumeId ? 'Set as active and ready for processing.' : 'Please set it as active to enable processing.'}`);
      console.log('🔍 uploadResume completed successfully');
    } catch (error) {
      console.error('🔍 uploadResume error:', error);
      if (mountedRef.current) {
        setStatus('error');
        alert('Failed to upload resume: ' + (error as Error).message);
      }
      throw error;
    } finally {
      console.log('🔍 uploadResume finally block');
      if (mountedRef.current) {
        setUploading(false);
        console.log('🔍 uploadResume uploading state cleared');
      }
    }
  }, [userEmail, setActiveResume]);

  // Start polling for processing results
  const startPolling = useCallback((resumeId: string) => {
    console.log('🔍 startPolling called:', { resumeId });
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        console.log('🔍 polling for results...');
        const response = await aiApplyService.getResumeResults(resumeId);
        console.log('🔍 polling response:', response);
        
        setProcessingResults(response.data);
        
        // Stop polling if processing is complete
        if (response.data?.processing_status === 'completed') {
          console.log('🔍 polling completed, stopping...');
          setStatus('completed');
          setProcessing(false); // Clear processing state
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        // Stop polling on error
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    }, 2000); // Poll every 2 seconds
  }, []);

  // Process a resume (only active resumes can be processed)
  const processResume = useCallback(async (resumeId?: string) => {
    console.log('🔍 processResume called:', { resumeId, activeResumeId: activeResume?.id });
    const targetId = resumeId || activeResume?.id;
    if (!targetId) {
      console.log('🔍 processResume early return: no targetId');
      alert('Please select an active resume first');
      return;
    }

    // Verify the resume is active
    const targetResume = resumes.find(r => r.id === targetId);
    if (!targetResume || !targetResume.is_active) {
      console.log('🔍 processResume early return: resume not active');
      alert('Only active resumes can be processed. Please set this resume as active first.');
      return;
    }

    try {
      console.log('🔍 processResume starting processing...');
      setProcessing(true);
      setStatus('processing');
      
      console.log('🔍 processResume calling API...');
      await aiApplyService.processResume(targetId);
      console.log('🔍 processResume API call successful');
      
      // Start polling for results
      startPolling(targetId);
      console.log('🔍 processResume polling started');
    } catch (error) {
      console.error('🔍 processResume error:', error);
      setProcessing(false);
      setStatus('error');
      alert('Failed to process resume: ' + (error as Error).message);
    }
  }, [activeResume?.id, startPolling]);

  // Delete a resume
  const deleteResume = useCallback(async (resumeId: string) => {
    console.log('🔍 deleteResume called:', { resumeId, userEmail });
    
    // Fallback for development/testing when no authenticated user
    const effectiveUserEmail = userEmail || 'test@example.com';
    
    if (!effectiveUserEmail) {
      console.log('🔍 deleteResume early return: no userEmail');
      return;
    }

    // Confirm deletion
    const confirmed = window.confirm('Are you sure you want to delete this resume? This action cannot be undone.');
    if (!confirmed) {
      console.log('🔍 deleteResume cancelled by user');
      return;
    }

    try {
      console.log('🔍 deleteResume calling API...');
      await aiApplyService.deleteResume(resumeId, effectiveUserEmail);
      console.log('🔍 deleteResume API call successful');
      
      console.log('🔍 deleteResume updating local state...');
      console.log('🔍 deleteResume current resumes before:', resumes.length, resumes.map(r => r.id));
      
      // Remove from local state immediately with functional update
      setResumes(prev => {
        const newResumes = prev.filter(resume => resume.id !== resumeId);
        console.log('🔍 deleteResume filtered resumes:', { before: prev.length, after: newResumes.length });
        console.log('🔍 deleteResume new resumes after:', newResumes.map(r => r.id));
        return [...newResumes]; // Ensure new array reference for re-render
      });
      
      // Force a re-render by updating with a small delay
      setTimeout(() => {
        setResumes(prev => [...prev]); // Force re-render with same array
      }, 100);
      
      console.log('🔍 deleteResume state updated, checking re-render...');
      
      // Clear active resume if it was the deleted one
      if (activeResume?.id === resumeId) {
        setActiveResumeState(null);
        setProcessingResults(null);
        setStatus('idle');
        console.log('🔍 deleteResume cleared active resume');
      }
      
      // Show success message
      alert('Resume deleted successfully!');
      console.log('🔍 deleteResume completed');
    } catch (error) {
      console.error('🔍 deleteResume error:', error);
      alert('Failed to delete resume: ' + (error as Error).message);
      // Don't throw error - let the component handle the cleanup
    }
  }, [resumes, activeResume, userEmail]);

  // Refresh processing results
  const refreshResults = useCallback(async (resumeId?: string) => {
    const targetId = resumeId || activeResume?.id;
    if (!targetId) return;

    try {
      const response = await aiApplyService.getResumeResults(targetId);
      
      if (mountedRef.current) {
        setProcessingResults(response.data);
        
        // Update status based on processing results
        if (response.data?.processing_status === 'completed') {
          setStatus('completed');
          setProcessing(false); // Clear processing state
        } else if (response.data?.processing_status === 'processing') {
          setStatus('processing');
          setProcessing(true); // Ensure processing state is set
        }
      }
    } catch (error) {
      console.error('Error refreshing results:', error);
      // Don't show error for missing results (normal for unprocessed resumes)
    }
  }, [activeResume]);

  // Load AI Apply status
  const loadStatus = useCallback(async () => {
    try {
      const response = await aiApplyService.getStatus();
      
      if (mountedRef.current) {
        setCurrentStatus(response.data);
      }
    } catch (error) {
      console.error('Error loading status:', error);
    }
  }, []);

  // Load data on mount and when userEmail changes
  useEffect(() => {
    if (userEmail && mountedRef.current) {
      loadResumes();
      loadStatus();
    }
  }, [userEmail, loadResumes, loadStatus]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // Get screenshot URL helper
  const getScreenshotUrl = useCallback((screenshotPath?: string) => {
    if (!screenshotPath) return null;
    return aiApplyService.getScreenshotUrl(screenshotPath);
  }, []);

  // AI Apply Pipeline Methods
  const getJobMatches = useCallback(async (resumeId: string, userEmail: string, preferences?: any) => {
    try {
      return await aiApplyService.getJobMatches(resumeId, userEmail, preferences);
    } catch (error) {
      console.error('Error getting job matches:', error);
      throw error;
    }
  }, []);

  const generateCoverLetter = useCallback(async (resumeId: string, userEmail: string, jobId: string, jobDetails?: any) => {
    try {
      return await aiApplyService.generateCoverLetter(resumeId, userEmail, jobId, jobDetails);
    } catch (error) {
      console.error('Error generating cover letter:', error);
      throw error;
    }
  }, []);

  const autoFillApplication = useCallback(async (resumeId: string, userEmail: string, jobId: string, applicationForm?: any) => {
    try {
      return await aiApplyService.autoFillApplication(resumeId, userEmail, jobId, applicationForm);
    } catch (error) {
      console.error('Error auto-filling application:', error);
      throw error;
    }
  }, []);

  const submitApplication = useCallback(async (resumeId: string, userEmail: string, jobId: string, applicationData: any, coverLetterId?: string) => {
    try {
      return await aiApplyService.submitApplication(resumeId, userEmail, jobId, applicationData, coverLetterId);
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  }, []);

  const getApplicationStatus = useCallback(async (userEmail: string) => {
    try {
      return await aiApplyService.getApplicationStatus(userEmail);
    } catch (error) {
      console.error('Error getting application status:', error);
      throw error;
    }
  }, []);

  // AI Analysis Methods
  const analyzeAestheticScore = useCallback(async (resumeText: string, resumeContent: string) => {
    try {
      return await aiApplyService.analyzeAestheticScore(resumeText, resumeContent);
    } catch (error) {
      console.error('Error analyzing aesthetic score:', error);
      throw error;
    }
  }, []);

  const analyzeSkills = useCallback(async (resumeText: string) => {
    try {
      return await aiApplyService.analyzeSkills(resumeText);
    } catch (error) {
      console.error('Error analyzing skills:', error);
      throw error;
    }
  }, []);

  const generateRecommendations = useCallback(async (resumeText: string, resumeSections: any[], currentSkills: any) => {
    try {
      return await aiApplyService.generateRecommendations(resumeText, resumeSections, currentSkills);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }, []);

  const runAIAnalysis = useCallback(async (resumeText: string, resumeContent: string, resumeSections: any[]) => {
    try {
      const [aestheticResult, skillsResult, recommendationsResult] = await Promise.all([
        analyzeAestheticScore(resumeText, resumeContent),
        analyzeSkills(resumeText),
        generateRecommendations(resumeText, resumeSections, {})
      ]);

      return {
        aesthetic: aestheticResult,
        skills: skillsResult,
        recommendations: recommendationsResult
      };
    } catch (error) {
      console.error('Error running AI analysis:', error);
      throw error;
    }
  }, [analyzeAestheticScore, analyzeSkills, generateRecommendations]);

  const startAIAnalysis = useCallback(async (resumeId: string) => {
    // Fallback for development/testing when no authenticated user
    const effectiveUserEmail = userEmail || 'test@example.com';
    
    if (!effectiveUserEmail) {
      throw new Error('User email required for AI analysis');
    }

    // Verify the resume is active
    const targetResume = resumes.find(r => r.id === resumeId);
    if (!targetResume || !targetResume.is_active) {
      console.log('🧠 startAIAnalysis early return: resume not active');
      alert('Only active resumes can be analyzed. Please set this resume as active first.');
      return;
    }

    try {
      console.log('🧠 startAIAnalysis called:', { resumeId, effectiveUserEmail });
      
      // Start AI analysis
      const result = await aiApplyService.startAIAnalysis(resumeId);
      console.log('🧠 startAIAnalysis result:', result);
      
      // Refresh results to get AI analysis data
      await refreshResults(resumeId);
      
      return result;
    } catch (error) {
      console.error('Error starting AI analysis:', error);
      throw error;
    }
  }, [userEmail, refreshResults]);

  const checkIfNeedsProcessing = useCallback(async (userEmailParam: string) => {
    try {
      const result = await aiApplyService.checkIfNeedsProcessing(userEmailParam);
      return result;
    } catch (error) {
      console.error('Error checking if needs processing:', error);
      throw error;
    }
  }, []);

  // Load resumes when userEmail changes
  useEffect(() => {
    if (userEmail) {
      loadResumes();
    }
  }, [userEmail, loadResumes]);

  return {
    // State
    resumes,
    activeResume,
    processingResults,
    status,
    error,
    
    // Loading states
    loading,
    uploading,
    processing,
    
    // Actions
    loadResumes,
    uploadResume,
    setActiveResume,
    processResume,
    deleteResume,
    refreshResults,
    loadStatus,
    startAIAnalysis,
    checkIfNeedsProcessing,
    
    // AI Analysis Actions
    analyzeAestheticScore,
    analyzeSkills,
    generateRecommendations,
    runAIAnalysis,
    
    // AI Apply Pipeline Actions
    getJobMatches,
    generateCoverLetter,
    autoFillApplication,
    submitApplication,
    getApplicationStatus,
    
    // Helper
    getScreenshotUrl,
  };
};
