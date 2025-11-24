import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ResumeDocument, 
  UnifiedResumeResult, 
  ProcessedResume,
  ParsedResume
} from '../types/resume';
import { ProcessingOptions } from '../services/documentManagementService';
import { ResumeOrchestratorService } from '../services/resumeOrchestratorService';
import { PDFProcessingService } from '../services/pdfProcessingService';
import { ResumeAnalysisService } from '../services/resumeAnalysisService';

interface UseResumeManagerReturn {
  // State
  resumes: ResumeDocument[];
  activeResume: ResumeDocument | null;
  processedResume: ProcessedResume | null;
  parsedResume: ParsedResume | null;
  analysis: ReturnType<typeof ResumeAnalysisService.extractResumeInfo> | null;
  screenshotUrl: string | null;
  unifiedResult: UnifiedResumeResult | null;
  
  // Loading states
  loading: boolean;
  uploading: boolean;
  processing: boolean;
  pdfProcessing: boolean;
  
  // Actions
  loadResumes: () => Promise<void>;
  uploadResume: (file: File, userEmail?: string, options?: ProcessingOptions) => Promise<void>;
  setResumeActive: (documentId: string) => Promise<void>;
  deleteResume: (documentId: string) => Promise<void>;
  processResume: (documentId?: string) => Promise<void>;
  processResumePDFv2: (file: File) => Promise<void>;
  loadScreenshot: () => Promise<void>;
  refreshActiveResume: () => Promise<void>;
}

export const useResumeManager = (userId?: string): UseResumeManagerReturn => {
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [activeResume, setActiveResume] = useState<ResumeDocument | null>(null);
  const [processedResume, setProcessedResume] = useState<ProcessedResume | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [analysis, setAnalysis] = useState<ReturnType<typeof ResumeAnalysisService.extractResumeInfo> | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [unifiedResult, setUnifiedResult] = useState<UnifiedResumeResult | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pdfProcessing, setPdfProcessing] = useState(false);

  // Prevent duplicate initialization
  const hasLoadedRef = useRef(false);
  const mountedRef = useRef(true);

  // Load all resumes for the user - simplified like the original
  const loadResumes = useCallback(async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📄 loadResumes called with userId:', userId);
      console.log('📄 hasLoadedRef.current:', hasLoadedRef.current);
    }
    
    if (!userId) {
      if (process.env.NODE_ENV === 'development') {
        console.log('📄 loadResumes early return - no userId');
      }
      return;
    }
    
    // Only prevent reloading if we've loaded for THIS specific user
    if (hasLoadedRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('📄 loadResumes early return - already loaded');
      }
      return;
    }
    
    hasLoadedRef.current = true;
    
    try {
      setLoading(true);
      if (process.env.NODE_ENV === 'development') {
        console.log('Loading resumes for user:', userId);
      }
      
      // Import aiApplyService for getting user resumes
      const { aiApplyService } = await import('../services/aiApplyService');
      
      // Get all resumes for the user
      const userResumes = await aiApplyService.getUserResumes(userId);
      
      if (userResumes.data.length === 0 && process.env.NODE_ENV === 'development') {
        console.log('No resumes found for user - this is normal for first-time users');
      }
      
      // Convert ResumeData to ResumeDocument format
      const convertedResumes = userResumes.data.map(resume => ({
        ...resume,
        processing_status: resume.processing_status as "completed" | "pending" | "error" | "processing",
        filename: resume.filename,
        file_size: resume.file_size
      }));
      
      setResumes(convertedResumes);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📄 Resumes loaded:', userResumes.data.length);
        console.log('📄 Resume data:', userResumes.data);
      }
      
      // Get active resume
      try {
        const activeResumeResponse = await aiApplyService.getActiveResume(userId);
        if (activeResumeResponse.data) {
          // Convert ResumeData to ResumeDocument format
          const convertedActiveResume = {
            ...activeResumeResponse.data,
            processing_status: activeResumeResponse.data.processing_status as "completed" | "pending" | "error" | "processing",
            filename: activeResumeResponse.data.filename,
            file_size: activeResumeResponse.data.file_size
          };
          
          setActiveResume(convertedActiveResume);
          
          // Get processing results for active resume
          const processingResults = await aiApplyService.getResumeResults(activeResumeResponse.data.id);
          if (processingResults.data) {
            const results = processingResults.data;
            setProcessedResume({
              text: results.extracted_text || '',
              textLength: results.text_length || 0,
              filename: activeResumeResponse.data.original_filename,
              processedAt: results.processed_at || '',
              screenshotPath: results.screenshot_path,
              textFilePath: results.text_file_path,
              metadata: {
                totalPages: results.num_pages || 0,
                title: results.pdf_title || undefined,
                author: results.pdf_author || undefined,
                creator: results.pdf_creator || undefined,
                producer: results.pdf_producer || undefined
              }
            });

            if (process.env.NODE_ENV === 'development') {
              console.log('📄 Processed resume set with screenshot path:', results.screenshot_path);
            }

            // Load screenshot if available
            if (results.screenshot_path) {
              await loadScreenshot();
            }
          } else {
            setProcessedResume(null);
            setScreenshotUrl(null);
          }
        }
      } catch (activeError) {
        // It's okay if there's no active resume
        if (process.env.NODE_ENV === 'development') {
          console.log('No active resume found:', activeError);
        }
        setActiveResume(null);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Resumes loaded:', userResumes.data.length);
        console.log('Active resume:', activeResume?.original_filename);
      }
      
    } catch (error) {
      // Combine error logging paths
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading resumes:', error);
      }
      
      // Don't show alert for first-time users - this is normal behavior
      if (error instanceof Error && !error.message.includes('404') && mountedRef.current) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Actual error loading resumes (not 404):', error);
        }
        alert('Unable to connect to resume service. Please check your connection and try again.');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [userId]);

  // Refresh active resume data
  const refreshActiveResume = useCallback(async () => {
    if (!userId) return;
    
    try {
      const active = await ResumeOrchestratorService.getActiveResume(userId);
      if (!active) return;

      // Get processing results
      const processingResults = await ResumeOrchestratorService.getProcessingResults(active.id);
      setProcessedResume(processingResults);

      // Load unified result
      const unified = await ResumeOrchestratorService.processDocumentUnified(active.id);
      setUnifiedResult(unified);

      // Load screenshot if available
      if (processingResults?.screenshotPath) {
        await loadScreenshot();
      }
    } catch (error) {
      console.error('Error refreshing active resume:', error);
      setProcessedResume(null);
      setUnifiedResult(null);
      setScreenshotUrl(null);
    }
  }, [userId]);

  // Upload a new resume - simplified like the original
  const uploadResume = useCallback(async (
    file: File, 
    userEmail?: string, 
    options?: ProcessingOptions
  ) => {
    if (!userId) throw new Error('User ID is required');

    setUploading(true);

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Uploading document:', file.name);
      }
      
      // Import aiApplyService for resume upload
      const { aiApplyService } = await import('../services/aiApplyService');
      
      // Validate PDF file
      if (file.type !== 'application/pdf') {
        throw new Error('Invalid PDF file');
      }

      // Upload resume using aiApplyService (which handles the 3-resume limit)
      const uploadResult = await aiApplyService.uploadResume(file, userId || '', userEmail);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Document uploaded successfully:', uploadResult.data.resumeId);
      }
      
      // Reset loading guard to allow refresh
      hasLoadedRef.current = false;
      // Reload documents to get the latest data
      await loadResumes();
      
      if (mountedRef.current) {
        alert('Resume uploaded successfully!');
      }
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error uploading resume:', error);
      }
      if (mountedRef.current) {
        const errorMessage = (error as Error).message;
        if (errorMessage.includes('Maximum resume limit reached')) {
          alert('You can only have a maximum of 3 resumes. Please delete an existing resume before uploading a new one.');
        } else {
          alert('Failed to upload resume: ' + errorMessage);
        }
      }
      throw error;
    } finally {
      if (mountedRef.current) {
        setUploading(false);
      }
    }
  }, [userId, loadResumes]);

  // Set a resume as active - simplified like the original
  const setResumeActive = useCallback(async (documentId: string) => {
    if (!userId) return;

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Setting active document:', documentId);
      }
      
      // Import aiApplyService for setting active resume
      const { aiApplyService } = await import('../services/aiApplyService');
      
      await aiApplyService.setActiveResume(documentId, userId || '');
      
      // Update local state
      const document = resumes.find(d => d.id === documentId);
      if (document) {
        setActiveResume(document);
        setResumes(resumes.map(d => ({ ...d, is_active: d.id === documentId })));
        if (process.env.NODE_ENV === 'development') {
          console.log('Active document set:', document.original_filename);
        }
        
        // Clear processed data to force reprocessing with new active resume
        setProcessedResume(null);
        setParsedResume(null);
        setScreenshotUrl(null);
        setUnifiedResult(null);
        
        if (mountedRef.current) {
          alert('Resume set as active. AI analysis will be performed on this resume.');
        }
      }
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error setting active document:', error);
      }
      if (mountedRef.current) {
        alert('Failed to set active document: ' + (error as Error).message);
      }
      throw error;
    }
  }, [userId, resumes]);

  // Delete a resume - simplified like the original
  const deleteResume = useCallback(async (documentId: string) => {
    const document = resumes.find(d => d.id === documentId);
    if (!document) return;

    const confirmed = window.confirm(`Are you sure you want to delete "${document.original_filename}"? This will permanently delete the resume file and all associated analysis data.`);
    if (!confirmed) return;

    try {
      console.log('Deleting document:', document.original_filename);
      
      // Import aiApplyService for resume deletion
      const { aiApplyService } = await import('../services/aiApplyService');
      
      await aiApplyService.deleteResume(documentId, userId || '');
      
      // Update local state
      setResumes(resumes.filter(d => d.id !== documentId));
      if (activeResume?.id === documentId) {
        setActiveResume(null);
        setProcessedResume(null);
        setParsedResume(null);
        setScreenshotUrl(null);
        setUnifiedResult(null);
      }
      console.log('Document deleted successfully');
      alert('Resume and all associated data deleted successfully!');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document: ' + (error as Error).message);
      throw error;
    }
  }, [resumes, activeResume, userId]);

  // Process a resume - simplified like the original
  const processResume = useCallback(async (documentId?: string) => {
    const targetId = documentId || activeResume?.id;
    if (!targetId) {
      alert('Please select an active resume first');
      return;
    }

    setProcessing(true);
    setProcessedResume(null);
    setUnifiedResult(null);

    try {
      console.log('Processing document:', targetId);
      
      // Import DocumentManagementService locally to avoid circular dependency
      const { DocumentManagementService } = await import('../services/documentManagementService');
      
      // Process document using the same approach as the original
      const result = await DocumentManagementService.processDocument(targetId, {
        text: {}, // Extract full text
        info: { parsePageInfo: true }, // Get metadata
        screenshots: { scale: 1.5, first: 1 }, // Generate preview
        images: { imageThreshold: 50 }, // Extract images
        tables: { format: 'json' } // Extract tables
      });
      
      console.log('Document processed successfully:', result);
      
      // Get the processing results
      const processingResults = await DocumentManagementService.getDocumentProcessingResults(targetId);
      
      console.log('📄 Processing results from backend:', processingResults);
      
      if (processingResults) {
        const processedData = {
          text: processingResults.extractedText,
          textLength: processingResults.textLength,
          filename: activeResume?.original_filename || 'Resume',
          processedAt: processingResults.processedAt,
          screenshotPath: processingResults.screenshotPath,
          textFilePath: processingResults.textFilePath,
          metadata: {
            totalPages: processingResults.pdfTotalPages || 0,
            title: processingResults.pdfTitle,
            author: processingResults.pdfAuthor,
            creator: processingResults.pdfCreator,
            producer: processingResults.pdfProducer
          }
        };
        
        console.log('📄 Setting processed resume data:', processedData);
        setProcessedResume(processedData);

        // Load screenshot if available
        if (processingResults.screenshotPath) {
          const screenshotUrl = `http://localhost:8000/api/documents${processingResults.screenshotPath}`;
          console.log('🖼️ Setting screenshot URL:', screenshotUrl);
          setScreenshotUrl(screenshotUrl);
        } else {
          setScreenshotUrl(null);
        }
      } else {
        console.log('❌ No processing results found');
      }

      // Reload documents to get updated status
      await loadResumes();
      
      alert('Document processed successfully!');

    } catch (error) {
      console.error('Error processing resume:', error);
      alert('Failed to process resume: ' + (error as Error).message);
    } finally {
      setProcessing(false);
    }
  }, [activeResume, loadResumes]);

  // Process resume using PDF v2 API
  const processResumePDFv2 = useCallback(async (file: File) => {
    try {
      // Validate PDF file
      PDFProcessingService.validatePDFFile(file);
    } catch (error) {
      alert((error as Error).message);
      return;
    }

    setPdfProcessing(true);
    setParsedResume(null);
    setAnalysis(null);

    try {
      console.log('Processing PDF with new API:', file.name);
      
      const result = await ResumeOrchestratorService.processResumePDFv2(file);
      
      if (result.success) {
        // Convert to ParsedResume format for compatibility
        setParsedResume({
          success: true,
          text: result.text,
          numPages: result.metadata.totalPages,
          info: {
            Title: result.metadata.title,
            Author: result.metadata.author,
            Creator: result.metadata.creator,
            Producer: result.metadata.producer,
            Subject: result.metadata.subject,
            Keywords: result.metadata.keywords,
            CreationDate: result.metadata.creationDate,
            ModDate: result.metadata.modificationDate
          },
          pages: {},
          previewImageBase64: result.previewImage
        });
        
        // Perform resume analysis
        const analysisResult = ResumeAnalysisService.extractResumeInfo(result.text);
        setAnalysis(analysisResult);
        
        console.log('PDF processed successfully:', result);
        console.log('Resume analysis:', analysisResult);
      } else {
        throw new Error(result.error || 'Failed to process PDF');
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      alert('Failed to process PDF: ' + (error as Error).message);
    } finally {
      setPdfProcessing(false);
    }
  }, []);

  // Load screenshot from backend
  const loadScreenshot = useCallback(async () => {
    if (!userId || !mountedRef.current) return;
    
    try {
      // Only processedResume has screenshotPath, not activeResume
      if (!processedResume?.screenshotPath) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🖼️ No screenshot path available in processed resume');
        }
        return;
      }
      
      // Extract filename from the screenshot path
      const filename = processedResume.screenshotPath.split('/').pop();
      const screenshotUrl = `http://localhost:8000/api/documents/screenshots/${filename}`;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🖼️ Loading screenshot from:', screenshotUrl);
      }
      
      const response = await fetch(screenshotUrl);
      if (response.ok && mountedRef.current) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setScreenshotUrl(url);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🖼️ Screenshot loaded successfully');
        }
      } else {
        console.warn('🖼️ Failed to load screenshot:', response.status);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('🖼️ Error loading screenshot:', error);
      }
    }
  }, [userId, processedResume]);

  // Load resumes on mount and when userId changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 useEffect triggered for loadResumes, userId:', userId);
      console.log('🔄 mountedRef.current:', mountedRef.current);
    }
    
    // Reset the loaded flag when userId changes
    if (userId) {
      hasLoadedRef.current = false;
    }
    
    if (mountedRef.current) {
      loadResumes();
    }
  }, [userId, loadResumes]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    // State
    resumes,
    activeResume,
    processedResume,
    parsedResume,
    analysis,
    screenshotUrl,
    unifiedResult,
    
    // Loading states
    loading,
    uploading,
    processing,
    pdfProcessing,
    
    // Actions
    loadResumes,
    uploadResume,
    setResumeActive,
    deleteResume,
    processResume,
    processResumePDFv2,
    loadScreenshot,
    refreshActiveResume
  };
};
