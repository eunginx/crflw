import { useState, useCallback } from 'react';
import { buildCoverLetterPrompt, CoverLetterPromptData } from '../CoverLetter/coverLetterPrompt';

export interface CoverLetterState {
  content: string;
  isGenerating: boolean;
  error: string | null;
  tone: 'professional' | 'enthusiastic' | 'technical' | 'concise';
}

export interface UseCoverLetterOptions {
  resumeIntelligence?: any;
  selectedJob?: any;
  ollamaBaseUrl?: string;
  extractedText?: string; // Add access to actual resume text
}

export function useCoverLetter(options: UseCoverLetterOptions = {}) {
  const { resumeIntelligence, selectedJob, ollamaBaseUrl = 'http://localhost:9000', extractedText } = options;
  
  const [state, setState] = useState<CoverLetterState>({
    content: '',
    isGenerating: false,
    error: null,
    tone: 'professional'
  });

  const generateCoverLetter = useCallback(async (tone: CoverLetterState['tone'] = 'professional') => {
    if (!resumeIntelligence || !selectedJob) {
      setState(prev => ({
        ...prev,
        error: 'Resume intelligence and job selection are required'
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
      tone
    }));

    try {
      // Build prompt from resume + job intelligence
      const promptData: CoverLetterPromptData = {
        // Resume data
        resumeSummary: resumeIntelligence.suggestedSummary || '',
        resumeSkills: resumeIntelligence.extractedSkills || [],
        resumeSeniority: resumeIntelligence.suggestedHeadline || '',
        resumeExperienceLevel: resumeIntelligence.experienceLevel || '',
        
        // Job data
        jobTitle: selectedJob.title || '',
        company: selectedJob.company || '',
        jobKeywords: selectedJob.keywords || [],
        jobResponsibilities: selectedJob.responsibilities || [],
        jobRequirements: selectedJob.requirements || [],
        
        // Style
        tone
      };

      const prompt = buildCoverLetterPrompt(promptData);

      console.log('🤖 Generating cover letter with dedicated cover letter service...');
      console.log('Prompt length:', prompt.length, 'characters');

      // Call dedicated cover letter service that returns plain text
      const response = await fetch(`${ollamaBaseUrl}/api/cover-letter/generate-cover-letter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText: extractedText || promptData.resumeSummary || '', // Use actual extracted text first, fallback to summary
          jobDescription: `Position: ${promptData.jobTitle || ''}\nCompany: ${promptData.company || ''}\nResponsibilities: ${(promptData.jobResponsibilities || []).join(', ')}\nRequirements: ${(promptData.jobRequirements || []).join(', ')}`,
          companyName: promptData.company || '',
          roleTitle: promptData.jobTitle || ''
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      // Handle plain text response (no streaming)
      const coverLetterText = await response.text();
      
      setState(prev => ({ 
        ...prev, 
        content: coverLetterText 
      }));

      console.log('✅ Cover letter generation completed');

    } catch (error) {
      console.error('❌ Error generating cover letter:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate cover letter',
        isGenerating: false
      }));
    } finally {
      setState(prev => ({
        ...prev,
        isGenerating: false
      }));
    }
  }, [resumeIntelligence, selectedJob, ollamaBaseUrl]);

  const regenerateCoverLetter = useCallback(() => {
    generateCoverLetter(state.tone);
  }, [generateCoverLetter, state.tone]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(state.content);
      console.log('✅ Cover letter copied to clipboard');
    } catch (error) {
      console.error('❌ Failed to copy to clipboard:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to copy to clipboard'
      }));
    }
  }, [state.content]);

  const downloadAsText = useCallback(() => {
    if (!state.content || !selectedJob) return;

    const blob = new Blob([state.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cover_Letter_${selectedJob.company}_${selectedJob.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('✅ Cover letter downloaded');
  }, [state.content, selectedJob]);

  const clearContent = useCallback(() => {
    setState(prev => ({
      ...prev,
      content: '',
      error: null
    }));
  }, []);

  const setTone = useCallback((tone: CoverLetterState['tone']) => {
    setState(prev => ({
      ...prev,
      tone
    }));
  }, []);

  return {
    // State
    content: state.content,
    isGenerating: state.isGenerating,
    error: state.error,
    tone: state.tone,
    
    // Actions
    generateCoverLetter,
    regenerateCoverLetter,
    copyToClipboard,
    downloadAsText,
    clearContent,
    setTone,
    
    // Derived state
    hasContent: state.content.length > 0,
    canGenerate: !!(resumeIntelligence && selectedJob)
  };
}
