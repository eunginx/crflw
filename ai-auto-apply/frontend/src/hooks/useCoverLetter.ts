import { useState, useCallback } from 'react';
import CoverLetterService from '../services/coverLetterService';
import ResumeIntelligenceService from '../services/resumeIntelligenceService';
import { CoverLetterContent } from '../services/coverLetterService';

export const useCoverLetter = () => {
  const [coverLetter, setCoverLetter] = useState<CoverLetterContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate cover letter using the enhanced service
  const generateCoverLetter = useCallback(async (
    job: any,
    resumeAnalysis: any,
    useAI: boolean = false
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      let coverLetterContent: CoverLetterContent;

      if (useAI) {
        // Generate enhanced prompt for AI
        const prompt = CoverLetterService.generateEnhancedPrompt(job, resumeAnalysis);
        
        // Call AI service (this would be implemented based on your AI service)
        const aiResponse = await callAIService(prompt);
        
        // Process AI response to ensure proper formatting
        coverLetterContent = CoverLetterService.processAIGeneratedText(aiResponse);
      } else {
        // Generate cover letter directly
        coverLetterContent = CoverLetterService.generateCoverLetter(job, resumeAnalysis);
      }

      setCoverLetter(coverLetterContent);
      return coverLetterContent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate cover letter';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get clean formatted text for copy-paste
  const getFormattedText = useCallback(() => {
    if (!coverLetter) return '';
    
    return CoverLetterService.generateCleanText(coverLetter);
  }, [coverLetter]);

  // Get email-optimized format
  const getEmailFormat = useCallback(() => {
    if (!coverLetter) return '';
    
    return CoverLetterService.generateEmailFormat(coverLetter);
  }, [coverLetter]);

  // Process raw AI-generated text
  const processAIGeneratedText = useCallback((aiText: string) => {
    try {
      const processed = CoverLetterService.processAIGeneratedText(aiText);
      setCoverLetter(processed);
      return processed;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process AI text';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Clear cover letter
  const clearCoverLetter = useCallback(() => {
    setCoverLetter(null);
    setError(null);
  }, []);

  return {
    coverLetter,
    isLoading,
    error,
    generateCoverLetter,
    getFormattedText,
    getEmailFormat,
    processAIGeneratedText,
    clearCoverLetter
  };
};

// Mock AI service call - replace with your actual AI service
async function callAIService(prompt: string): Promise<string> {
  // This would be your actual AI service call
  // For now, return a mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`I am excited to apply for the Full Stack Engineer position at StartupXYZ. With over a decade of experience delivering AI, IoT, and cloud‑native solutions for Fortune‑500 enterprises, I have repeatedly designed and shipped end‑to‑end applications that combine responsive front‑ends with resilient back‑ends.

My recent work leading a multi‑cloud DevSecOps program involved building React‑driven user interfaces that consumed Node.js micro‑services backed by MongoDB, achieving a 45% reduction in page‑load latency while supporting GDPR‑compliant data pipelines.

I bring a deep technical toolkit that aligns directly with StartupXYZ's stack: expert‑level proficiency in React, server‑side JavaScript (Node.js), and MongoDB schema design; strong command of cloud platforms (AWS, Kubernetes, Docker) for building and operating production‑grade services; and a disciplined Agile/Scrum methodology that drives rapid iteration while maintaining high quality.

I am eager to leverage my full‑stack experience and cloud expertise to help StartupXYZ accelerate product delivery, improve system reliability, and innovate at speed. Thank you for considering my application.`);
    }, 1000);
  });
}
