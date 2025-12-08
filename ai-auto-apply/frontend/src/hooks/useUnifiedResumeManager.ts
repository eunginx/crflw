import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAIApplyManager } from './useAIApplyManager';
import { ResumeDocument } from '../types/resume';

interface UnifiedResumeManagerReturn {
  // Resume State
  resumes: ResumeDocument[];
  activeResume: ResumeDocument | null;
  hasResume: boolean;
  resumeUploaded: boolean;
  resumeCount: number;
  canUploadMore: boolean;
  
  // Loading States
  loading: boolean;
  uploading: boolean;
  
  // Actions
  uploadResume: (file: File) => Promise<void>;
  setActiveResume: (resumeId: string) => Promise<void>;
  deleteResume: (resumeId: string) => Promise<void>;
  
  // Convenience methods for onboarding
  uploadResumeForOnboarding: (file: File) => Promise<void>;
  getResumeForOnboarding: () => ResumeDocument | null;
  markResumeUploaded: () => void;
}

/**
 * Unified resume manager that works for both onboarding and AI-apply pages
 * Uses the same backend system (useAIApplyManager) but provides onboarding-specific methods
 */
export const useUnifiedResumeManager = (): UnifiedResumeManagerReturn => {
  const { currentUser } = useAuth();
  const userEmail = currentUser?.email || '';
  
  // Use the existing AI Apply manager as the base
  const aiApplyManager = useAIApplyManager(userEmail);
  
  // Onboarding-specific state
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const mountedRef = useRef(true);

  // Check if user has any resume
  const hasResume = aiApplyManager.resumes.length > 0 && !!aiApplyManager.activeResume;
  const resumeCount = aiApplyManager.resumes.length;
  const canUploadMore = resumeCount < 3;

  // Update resume uploaded status when resumes change
  useEffect(() => {
    if (mountedRef.current) {
      setResumeUploaded(hasResume);
    }
  }, [hasResume]);

  // Unified upload method that works for both pages
  const uploadResume = useCallback(async (file: File) => {
    if (!userEmail) {
      throw new Error('User must be authenticated to upload resume');
    }

    // Check resume limit (max 3 resumes per user)
    const currentResumes = aiApplyManager.resumes;
    if (currentResumes.length >= 3) {
      throw new Error(
        `Maximum resume limit reached (3). You have ${currentResumes.length} resumes. Please delete an existing resume before uploading a new one.`
      );
    }

    try {
      await aiApplyManager.uploadResume(file, userEmail);
      setResumeUploaded(true);
      console.log('✅ Resume uploaded successfully via unified manager');
    } catch (error) {
      console.error('❌ Failed to upload resume:', error);
      throw error;
    }
  }, [aiApplyManager, userEmail, aiApplyManager.resumes.length]);

  // Onboarding-specific upload method with additional feedback
  const uploadResumeForOnboarding = useCallback(async (file: File) => {
    try {
      await uploadResume(file);
      
      // Show onboarding-specific success message
      const resumeCount = aiApplyManager.resumes.length;
      const message = resumeCount === 1 
        ? 'Resume uploaded successfully! This is now your active resume for AI analysis.'
        : `Resume uploaded successfully! You now have ${resumeCount} resumes.`;
      
      alert(message);
      console.log('✅ Onboarding resume upload completed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload resume';
      alert(`Resume upload failed: ${errorMessage}`);
      throw error;
    }
  }, [uploadResume, aiApplyManager.resumes.length]);

  // Get resume for onboarding (returns the active resume or first available)
  const getResumeForOnboarding = useCallback((): ResumeDocument | null => {
    if (aiApplyManager.activeResume) {
      return aiApplyManager.activeResume;
    }
    
    // If no active resume, return the first one (for onboarding compatibility)
    if (aiApplyManager.resumes.length > 0) {
      return aiApplyManager.resumes[0];
    }
    
    return null;
  }, [aiApplyManager.activeResume, aiApplyManager.resumes]);

  // Mark resume as uploaded (for onboarding state management)
  const markResumeUploaded = useCallback(() => {
    setResumeUploaded(true);
  }, []);

  // Update resumeUploaded state when resumes change
  useEffect(() => {
    setResumeUploaded(aiApplyManager.resumes.length > 0);
  }, [aiApplyManager.resumes.length]);

  // Wrapper methods that maintain compatibility
  const setActiveResume = useCallback(async (resumeId: string) => {
    await aiApplyManager.setActiveResume(resumeId);
    
    // Reload resumes to ensure state is fresh and UI updates
    await aiApplyManager.loadResumes();
    console.log('✅ Unified resume manager: setActiveResume completed and reloaded');
  }, [aiApplyManager]);

  const deleteResume = useCallback(async (resumeId: string) => {
    try {
      await aiApplyManager.deleteResume(resumeId);
      console.log('✅ Unified resume manager: delete completed');
    } catch (error) {
      console.error('❌ Unified resume manager: delete failed', error);
      throw error;
    }
  }, [aiApplyManager]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    // Resume State
    resumes: aiApplyManager.resumes,
    activeResume: aiApplyManager.activeResume,
    hasResume,
    resumeUploaded,
    resumeCount,
    canUploadMore,
    
    // Loading States
    loading: aiApplyManager.loading,
    uploading: aiApplyManager.uploading,
    
    // Actions
    uploadResume,
    setActiveResume,
    deleteResume,
    
    // Convenience methods for onboarding
    uploadResumeForOnboarding,
    getResumeForOnboarding,
    markResumeUploaded,
  };
};
