import { 
  UnifiedResumeResult, 
  ResumeProcessingOptions, 
  ResumeStats, 
  ResumeExtractedInfo, 
  PdfMetadata 
} from '../types/resume';
import { PDFProcessingService } from './pdfProcessingService';
import { ResumeAnalysisService } from './resumeAnalysisService';

export class UnifiedResumeProcessor {
  
  /**
   * Process a resume document using the unified pipeline
   * This method normalizes different processing methods into a single result format
   */
  static async process(
    file: File,
    method: 'cli' | 'pdfv2' | 'hybrid' = 'hybrid',
    options?: ResumeProcessingOptions
  ): Promise<UnifiedResumeResult> {
    const startTime = Date.now();

    try {
      switch (method) {
        case 'cli':
          return await this.processWithCLI('document-id', options);
        case 'pdfv2':
          return await this.processWithPDFv2(file as File);
        case 'hybrid':
          return await this.processWithHybrid(file, options);
        default:
          throw new Error(`Unknown processing method: ${method}`);
      }
    } catch (error) {
      const processingTime = Date.now() - startTime;
      return this.createErrorResult(error as Error, processingTime);
    }
  }

  /**
   * Process using CLI-based method (DocumentManagementService)
   */
  private static async processWithCLI(
    documentId: string, 
    options?: ResumeProcessingOptions
  ): Promise<UnifiedResumeResult> {
    // This would integrate with the existing CLI processing
    // For now, we'll use the orchestrator service which handles this
    const { ResumeOrchestratorService } = await import('./resumeOrchestratorService');
    return await ResumeOrchestratorService.processDocumentUnified(documentId);
  }

  /**
   * Process using PDF v2 API
   */
  private static async processWithPDFv2(file: File): Promise<UnifiedResumeResult> {
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

    return {
      text: result.text,
      metadata,
      previewImage: result.previewImageBase64,
      stats,
      extractedInfo,
      success: true,
      processingTime: 0 // Would be calculated by the caller
    };
  }

  /**
   * Process using hybrid method (tries CLI first, falls back to PDF v2)
   */
  private static async processWithHybrid(
    file: File,
    options?: ResumeProcessingOptions
  ): Promise<UnifiedResumeResult> {
    try {
      // Try CLI processing first by uploading
      const { ResumeOrchestratorService } = await import('./resumeOrchestratorService');
      // For hybrid processing, we'll use PDF v2 directly for now
      return await this.processWithPDFv2(file);
    } catch (cliError) {
      console.warn('CLI processing failed, falling back to PDF v2:', cliError);
      
      // Fallback to PDF v2
      return await this.processWithPDFv2(file);
    }
  }

  /**
   * Calculate resume statistics
   */
  static calculateStats(text: string): ResumeStats {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const lines = text.split('\n');
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
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
   * Extract resume information using the analysis service
   */
  static extractResumeInfo(text: string): ResumeExtractedInfo {
    return ResumeAnalysisService.extractResumeInfo(text);
  }

  /**
   * Validate resume quality and provide recommendations
   */
  static validateResumeQuality(result: UnifiedResumeResult): {
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check for missing contact information
    if (!result.extractedInfo.email) {
      issues.push('Email address not found');
      score -= 20;
      recommendations.push('Add your email address to the resume');
    }

    if (!result.extractedInfo.phone) {
      issues.push('Phone number not found');
      score -= 15;
      recommendations.push('Add your phone number to the resume');
    }

    if (!result.extractedInfo.name) {
      issues.push('Name not found');
      score -= 25;
      recommendations.push('Add your full name to the resume');
    }

    // Check word count
    if (result.stats.wordCount < 200) {
      issues.push('Resume seems too short');
      score -= 15;
      recommendations.push('Consider adding more detail about your experience and skills');
    } else if (result.stats.wordCount > 1000) {
      issues.push('Resume might be too long');
      score -= 10;
      recommendations.push('Consider condensing your resume to 1-2 pages');
    }

    // Check for key sections
    const sections = result.extractedInfo.sections;
    if (!sections?.experience) {
      issues.push('Experience section not found');
      score -= 15;
      recommendations.push('Add an experience section with your work history');
    }

    if (!sections?.education) {
      issues.push('Education section not found');
      score -= 10;
      recommendations.push('Add an education section');
    }

    if (!sections?.skills || result.extractedInfo.skills.length < 5) {
      issues.push('Skills section missing or insufficient');
      score -= 10;
      recommendations.push('Add a comprehensive skills section');
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  /**
   * Compare two resumes and highlight differences
   */
  static compareResumes(
    resume1: UnifiedResumeResult,
    resume2: UnifiedResumeResult
  ): {
    textSimilarity: number;
    skillsOverlap: string[];
    skillsOnlyInResume1: string[];
    skillsOnlyInResume2: string[];
    metadataDifferences: Record<string, { old: any; new: any }>;
  } {
    // Simple text similarity (can be enhanced with more sophisticated algorithms)
    const words1 = new Set(resume1.text.toLowerCase().split(/\s+/));
    const words2 = new Set(resume2.text.toLowerCase().split(/\s+/));
    const intersection = new Set(Array.from(words1).filter(x => words2.has(x)));
    const union = new Set([...Array.from(words1), ...Array.from(words2)]);
    const textSimilarity = (intersection.size / union.size) * 100;

    // Skills comparison
    const skills1 = new Set(resume1.extractedInfo.skills.map(s => s.toLowerCase()));
    const skills2 = new Set(resume2.extractedInfo.skills.map(s => s.toLowerCase()));
    const skillsOverlap = Array.from(skills1).filter(x => skills2.has(x));
    const skillsOnlyInResume1 = Array.from(skills1).filter(x => !skills2.has(x));
    const skillsOnlyInResume2 = Array.from(skills2).filter(x => !skills1.has(x));

    // Metadata differences
    const metadataDifferences: Record<string, { old: any; new: any }> = {};
    const metadataKeys = ['title', 'author', 'creator', 'producer'];
    
    metadataKeys.forEach(key => {
      const val1 = resume1.metadata[key as keyof PdfMetadata];
      const val2 = resume2.metadata[key as keyof PdfMetadata];
      if (val1 !== val2) {
        metadataDifferences[key] = { old: val1, new: val2 };
      }
    });

    return {
      textSimilarity,
      skillsOverlap,
      skillsOnlyInResume1,
      skillsOnlyInResume2,
      metadataDifferences
    };
  }

  /**
   * Generate resume summary for quick overview
   */
  static generateSummary(result: UnifiedResumeResult): {
    overview: string;
    keyHighlights: string[];
    sections: string[];
  } {
    const highlights: string[] = [];
    const sections: string[] = [];

    // Add highlights based on extracted info
    if (result.extractedInfo.name) {
      highlights.push(`Name: ${result.extractedInfo.name}`);
    }
    if (result.extractedInfo.skills.length > 0) {
      highlights.push(`${result.extractedInfo.skills.length} skills identified`);
    }
    if (result.stats.wordCount > 0) {
      highlights.push(`${result.stats.wordCount} words, ~${result.stats.pageCount} pages`);
    }

    // Add detected sections
    const detectedSections = result.extractedInfo.sections;
    if (detectedSections) {
      Object.entries(detectedSections).forEach(([section, exists]) => {
        if (exists) {
          sections.push(section.charAt(0).toUpperCase() + section.slice(1));
        }
      });
    }

    // Generate overview
    const overview = `Resume contains ${result.stats.wordCount} words across ${result.stats.pageCount} estimated pages. 
      ${result.extractedInfo.skills.length} skills were identified. 
      ${sections.length > 0 ? `Sections detected: ${sections.join(', ')}.` : 'No clear sections identified.'}`;

    return {
      overview,
      keyHighlights: highlights,
      sections
    };
  }

  /**
   * Create error result
   */
  private static createErrorResult(error: Error, processingTime: number): UnifiedResumeResult {
    return {
      text: '',
      metadata: { totalPages: 0 },
      previewImage: '',
      stats: { 
        wordCount: 0, 
        lineCount: 0, 
        pageCount: 0, 
        characterCount: 0, 
        paragraphCount: 0 
      },
      extractedInfo: { skills: [] },
      success: false,
      error: error.message,
      processingTime
    };
  }
}
