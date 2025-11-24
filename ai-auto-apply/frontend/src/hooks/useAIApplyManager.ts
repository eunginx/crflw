import { useState, useEffect, useCallback, useRef } from 'react';
import { aiApplyService, ResumeData, ResumeProcessingResults, StatusResponse, ResumeUploadResponse } from '../services/aiApplyService';
import { ResumeDocument } from '../types/resume';

type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

// Helper function to convert ResumeData to ResumeDocument
const convertToResumeDocument = (resume: ResumeData, userId: string): ResumeDocument => ({
  id: resume.id,
  user_id: userId,
  original_filename: resume.original_filename,
  uploaded_at: resume.upload_date,
  is_active: resume.is_active,
  status: resume.processing_status === 'completed' ? 'processed' : 
         resume.processing_status === 'processing' ? 'pending' : 
         resume.processing_status === 'error' ? 'error' : 'pending',
  file_path: resume.filename, // Use filename as file_path
  file_size: resume.file_size,
  mime_type: resume.mime_type
});

// Helper function to convert upload response to ResumeDocument
const convertUploadResponseToResumeDocument = (response: ResumeUploadResponse['data'], userId: string): ResumeDocument => ({
  id: response.resumeId,
  user_id: userId,
  original_filename: response.originalFilename,
  uploaded_at: response.uploadDate,
  is_active: true, // New uploads are active by default
  status: 'pending', // New uploads start as pending
  file_path: response.filename,
  file_size: response.size,
  mime_type: 'application/pdf' // Default for resumes
});

interface UseAIApplyManagerReturn {
  // State
  resumes: ResumeDocument[];
  activeResume: ResumeDocument | null;
  processingResults: ResumeProcessingResults | null;
  status: ProcessingStatus;
  currentStatus: StatusResponse['data'] | null;
  
  // Loading states
  loading: boolean;
  uploading: boolean;
  processing: boolean;
  
  // Actions
  loadResumes: () => Promise<void>;
  uploadResume: (file: File, userEmail?: string) => Promise<void>;
  setActiveResume: (resumeId: string) => Promise<void>;
  processResume: (resumeId?: string) => Promise<void>;
  deleteResume: (resumeId: string) => Promise<void>;
  refreshResults: (resumeId?: string) => Promise<void>;
  loadStatus: () => Promise<void>;
  
  // Helper
  getScreenshotUrl: (screenshotPath?: string) => string | null;
}

export const useAIApplyManager = (userId?: string): UseAIApplyManagerReturn => {
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [activeResume, setActiveResumeState] = useState<ResumeDocument | null>(null);
  const [processingResults, setProcessingResults] = useState<ResumeProcessingResults | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [currentStatus, setCurrentStatus] = useState<StatusResponse['data'] | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Refs to prevent duplicate requests
  const loadingRef = useRef(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Load all resumes for the user
  const loadResumes = useCallback(async () => {
    if (!userId || loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setLoading(true);
      
      const response = await aiApplyService.getUserResumes(userId);
      
      // Convert ResumeData to ResumeDocument
      const convertedResumes = response.data.map(resume => 
        convertToResumeDocument(resume, userId)
      );
      
      if (mountedRef.current) {
        setResumes(convertedResumes);
        
        // Find active resume
        const active = convertedResumes.find(resume => resume.is_active);
        if (active) {
          setActiveResumeState(active);
          // Auto-load results for active resume (don't await to avoid blocking)
          refreshResults(active.id).catch(err => {
            console.log('Failed to load results for active resume:', err);
          });
        } else {
          setActiveResumeState(null);
          setProcessingResults(null);
        }
      }
    } catch (error) {
      console.error('Error loading resumes:', error);
      if (mountedRef.current) {
        // Don't show alert for first-time users
        if (resumes.length > 0) {
          alert('Failed to load resumes. Please try again.');
        }
      }
    } finally {
      // Always clear loading state, even if unmounted
      setLoading(false);
      loadingRef.current = false;
    }
  }, [userId]);

  // Set a resume as active
  const setActiveResume = useCallback(async (resumeId: string) => {
    console.log('🔍 setActiveResume called:', { resumeId, userId });
    if (!userId) {
      console.log('🔍 setActiveResume early return: no userId');
      return;
    }

    try {
      console.log('🔍 setActiveResume calling API...');
      await aiApplyService.setActiveResume(resumeId, userId);
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
  }, [userId, resumes]);

  // Upload a new resume
  const uploadResume = useCallback(async (file: File, userEmail?: string) => {
    console.log('🔍 uploadResume called:', { file: file.name, userId, userEmail });
    if (!userId) {
      console.log('🔍 uploadResume early return: no userId');
      return;
    }

    try {
      console.log('🔍 uploadResume starting upload...');
      setUploading(true);
      setStatus('uploading');
      
      console.log('🔍 uploadResume calling aiApplyService.uploadResume...');
      const response = await aiApplyService.uploadResume(file, userId, userEmail || '');
      console.log('🔍 uploadResume upload response:', response);
      
      console.log('🔍 uploadResume updating state...');
      // Convert upload response to ResumeDocument and add to local state
      const newResume = convertUploadResponseToResumeDocument(response.data, userId);
      setResumes(prev => [...prev, newResume]);
      
      // Set as active automatically
      await setActiveResume(response.data.resumeId);
      
      setStatus('idle');
      alert(`Resume "${file.name}" uploaded successfully! Processing will begin automatically.`);
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
  }, [userId, setActiveResume]);

  // Start polling for processing results
  const startPolling = useCallback((resumeId: string) => {
    console.log('🔍 startPolling called:', { resumeId });
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const response = await aiApplyService.getResumeResults(resumeId);
        
        if (mountedRef.current) {
          setProcessingResults(response.data);
          
          // Stop polling if processing is complete
          if (response.data?.processing_status === 'completed') {
            setStatus('completed');
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            console.log('🔍 startPolling processing completed');
          }
        }
      } catch (error) {
        console.error('Error polling results:', error);
      }
    }, 2000); // Poll every 2 seconds
  }, []);

  // Process a resume
  const processResume = useCallback(async (resumeId?: string) => {
    console.log('🔍 processResume called:', { resumeId, activeResumeId: activeResume?.id });
    const targetId = resumeId || activeResume?.id;
    if (!targetId) {
      console.log('🔍 processResume early return: no targetId');
      alert('Please select an active resume first');
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
    console.log('🔍 deleteResume called:', { resumeId, userId });
    if (!userId) {
      console.log('🔍 deleteResume early return: no userId');
      return;
    }

    try {
      console.log('🔍 deleteResume calling API...');
      await aiApplyService.deleteResume(resumeId, userId);
      console.log('🔍 deleteResume API call successful');
      
      if (mountedRef.current) {
        console.log('🔍 deleteResume updating local state...');
        // Remove from local state
        setResumes(prev => prev.filter(resume => resume.id !== resumeId));
        
        // Clear active resume if it was the deleted one
        if (activeResume?.id === resumeId) {
          setActiveResumeState(null);
          setProcessingResults(null);
          console.log('🔍 deleteResume cleared active resume');
        }
        console.log('🔍 deleteResume local state updated');
      }
    } catch (error) {
      console.error('🔍 deleteResume error:', error);
      alert('Failed to delete resume: ' + (error as Error).message);
      throw error;
    }
  }, [resumes, activeResume, userId]);

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
        } else if (response.data?.processing_status === 'processing') {
          setStatus('processing');
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

  // Load data on mount and when userId changes
  useEffect(() => {
    if (userId && mountedRef.current) {
      loadResumes();
      loadStatus();
    }
  }, [userId, loadResumes, loadStatus]);

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

  return {
    // State
    resumes,
    activeResume,
    processingResults,
    status,
    currentStatus,
    
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
    
    // Helper
    getScreenshotUrl,
  };
};
