import { 
  ResumeDocument, 
  UnifiedResumeResult, 
  ProcessedResume,
  ParsedResume,
  ResumeStats,
  ResumeExtractedInfo,
  PdfMetadata
} from '../types/resume';
import { DocumentManagementService, ProcessingOptions } from './documentManagementService';
import { PDFProcessingService } from './pdfProcessingService';
import { ResumeAnalysisService } from './resumeAnalysisService';

export class ResumeOrchestratorService {
  private static readonly API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  /**
   * Upload and process a resume document with unified workflow
   */
  static async uploadAndProcessResume(
    file: File,
    userId: string,
    userEmail?: string,
    options?: ProcessingOptions
  ): Promise<{ document: ResumeDocument; processed: UnifiedResumeResult }> {
    try {
      // Step 1: Upload document
      const uploadResult = await DocumentManagementService.uploadDocument(
        file,
        userId,
        userEmail,
        'resume',
        options || {
          text: {},
          info: { parsePageInfo: true },
          screenshots: { scale: 1.5, first: 1 },
          images: { imageThreshold: 50 },
          tables: { format: 'json' }
        }
      );

      // Step 2: Get document info (create a basic document object from upload result)
      const document: ResumeDocument = {
        id: uploadResult.documentId,
        user_id: userId,
        original_filename: file.name,
        uploaded_at: new Date().toISOString(),
        is_active: false,
        status: 'pending'
      };

      // Step 3: Process document and get unified result
      const processed = await this.processDocumentUnified(document.id);

      return { document, processed };
    } catch (error) {
      console.error('Error in uploadAndProcessResume:', error);
      throw error;
    }
  }

  /**
   * Process a document using unified pipeline
   */
  static async processDocumentUnified(documentId: string): Promise<UnifiedResumeResult> {
    try {
      // Get processing results
      const processingResults = await DocumentManagementService.getDocumentProcessingResults(documentId);
      
      if (!processingResults) {
        throw new Error('No processing results found for document');
      }

      // Extract metadata
      const metadata: PdfMetadata = {
        totalPages: processingResults.pdfTotalPages || 0,
        title: processingResults.pdfTitle,
        author: processingResults.pdfAuthor,
        creator: processingResults.pdfCreator,
        producer: processingResults.pdfProducer
      };

      // Calculate stats
      const stats: ResumeStats = {
        wordCount: processingResults.wordCount || 0,
        lineCount: processingResults.lineCount || 0,
        pageCount: processingResults.estimatedPages || 1,
        characterCount: processingResults.textLength || 0,
        paragraphCount: Math.ceil((processingResults.lineCount || 0) / 3) // Rough estimate
      };

      // Extract information
      const extractedInfo = DocumentManagementService.extractResumeInfo(processingResults.extractedText);

      // Get screenshot
      let previewImage = '';
      if (processingResults.screenshotPath) {
        previewImage = await this.getScreenshotBase64(documentId);
      }

      return {
        text: processingResults.extractedText,
        metadata,
        previewImage,
        stats,
        extractedInfo,
        success: true
      };
    } catch (error) {
      console.error('Error processing document:', error);
      return {
        text: '',
        metadata: { totalPages: 0 },
        previewImage: '',
        stats: { wordCount: 0, lineCount: 0, pageCount: 0, characterCount: 0, paragraphCount: 0 },
        extractedInfo: { skills: [] },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process resume using PDF v2 API
   */
  static async processResumePDFv2(file: File): Promise<UnifiedResumeResult> {
    try {
      const startTime = Date.now();
      
      const result = await PDFProcessingService.processResume(file);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to process PDF');
      }

      // Extract metadata from PDF info
      const metadata: PdfMetadata = {
        totalPages: result.numPages,
        title: result.info?.Title,
        author: result.info?.Author,
        creator: result.info?.Creator,
        producer: result.info?.Producer,
        subject: result.info?.Subject,
        keywords: result.info?.Keywords,
        creationDate: result.info?.CreationDate,
        modificationDate: result.info?.ModDate
      };

      // Calculate stats
      const stats = this.calculateStats(result.text);

      // Extract information
      const extractedInfo = ResumeAnalysisService.extractResumeInfo(result.text);

      const processingTime = Date.now() - startTime;

      return {
        text: result.text,
        metadata,
        previewImage: result.previewImageBase64,
        stats,
        extractedInfo,
        processingTime,
        success: true
      };
    } catch (error) {
      console.error('Error processing resume with PDF v2:', error);
      return {
        text: '',
        metadata: { totalPages: 0 },
        previewImage: '',
        stats: { wordCount: 0, lineCount: 0, pageCount: 0, characterCount: 0, paragraphCount: 0 },
        extractedInfo: { skills: [] },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all user documents with their processing status
   */
  static async getUserResumesWithStatus(userId: string): Promise<Array<ResumeDocument & { processed?: UnifiedResumeResult }>> {
    try {
      const documents = await DocumentManagementService.getUserDocuments(userId);
      
      const documentsWithStatus = await Promise.all(
        documents.map(async (doc) => {
          let processed: UnifiedResumeResult | undefined;
          
          // Use processing_status to determine if processed
          if (doc.processing_status === 'completed') {
            try {
              processed = await this.processDocumentUnified(doc.id);
            } catch (error) {
              console.error(`Error getting processed data for document ${doc.id}:`, error);
            }
          }
          
          return { 
            ...doc, 
            status: doc.processing_status === 'completed' ? 'processed' : 
                   doc.processing_status === 'failed' ? 'error' : 'pending' as "processed" | "pending" | "error",
            processed 
          };
        })
      );

      return documentsWithStatus;
    } catch (error) {
      console.error('Error getting user resumes with status:', error);
      throw error;
    }
  }

  /**
   * Set document as active
   */
  static async setActiveResume(userId: string, documentId: string): Promise<boolean> {
    return await DocumentManagementService.setActiveDocument(userId, documentId);
  }

  /**
   * Delete resume document
   */
  static async deleteResume(documentId: string): Promise<boolean> {
    return await DocumentManagementService.deleteDocument(documentId);
  }

  /**
   * Get screenshot as base64
   */
  private static async getScreenshotBase64(documentId: string): Promise<string> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/documents/resume/screenshot?documentId=${documentId}`);
      if (response.ok) {
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      return '';
    } catch (error) {
      console.error('Error getting screenshot:', error);
      return '';
    }
  }

  /**
   * Calculate resume statistics
   */
  private static calculateStats(text: string): ResumeStats {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const lines = text.split('\n');
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    // Estimate pages (rough calculation: ~250 words per page)
    const pageCount = Math.ceil(words.length / 250);

    return {
      wordCount: words.length,
      lineCount: lines.length,
      pageCount,
      characterCount: text.length,
      paragraphCount: paragraphs.length
    };
  }

  /**
   * Get active resume for user
   */
  static async getActiveResume(userId: string): Promise<ResumeDocument | null> {
    return await DocumentManagementService.getActiveDocument(userId);
  }

  /**
   * Get processing results for a document
   */
  static async getProcessingResults(documentId: string): Promise<ProcessedResume | null> {
    try {
      const results = await DocumentManagementService.getDocumentProcessingResults(documentId);
      
      if (!results) return null;

      const metadata: PdfMetadata = {
        totalPages: results.pdfTotalPages || 0,
        title: results.pdfTitle,
        author: results.pdfAuthor,
        creator: results.pdfCreator,
        producer: results.pdfProducer
      };

      return {
        text: results.extractedText,
        textLength: results.textLength,
        filename: results.processingResultId || 'Unknown',
        processedAt: results.processedAt,
        screenshotPath: results.screenshotPath,
        textFilePath: results.textFilePath,
        metadata
      };
    } catch (error) {
      console.error('Error getting processing results:', error);
      return null;
    }
  }
}
