export interface Document {
  id: string;
  user_id: string;
  user_email?: string;
  original_filename: string;
  file_size_bytes: number;
  file_type: string;
  document_type: string;
  is_active: boolean;
  processing_status: string;
  uploaded_at: string;
  processed_at?: string;
  text_length?: number;
  word_count?: number;
  pdf_total_pages?: number;
  processing_time_ms?: number;
}

export interface DocumentProcessingResults {
  processingResultId: string;
  processedAt: string;
  extractedText: string;
  textLength: number;
  wordCount: number;
  lineCount: number;
  estimatedPages: number;
  pdfTitle?: string;
  pdfAuthor?: string;
  pdfCreator?: string;
  pdfProducer?: string;
  pdfTotalPages?: number;
  cliVersion: string;
  cliCommand?: string;
  cliOutput?: any;
  processingTimeMs?: number;
  assetsCount?: number;
  screenshotPath?: string;
  textFilePath?: string;
}

export interface DocumentAsset {
  id: string;
  documentId: string;
  assetType: string;
  assetFormat: string;
  filePath?: string;
  fileSizeBytes?: number;
  pageNumber?: number;
  assetIndex?: number;
  width?: number;
  height?: number;
  generatedBy: string;
  generationCommand?: string;
  generationTimeMs?: number;
  createdAt: string;
}

export interface ProcessingOptions {
  text?: {
    pages?: number[];
    first?: number;
    last?: number;
    password?: string;
    verbosity?: string;
  };
  info?: {
    parsePageInfo?: boolean;
    password?: string;
  };
  screenshots?: {
    scale?: number;
    desiredWidth?: number;
    pages?: number[];
    first?: number;
    last?: number;
    imageDataUrl?: boolean;
    imageBuffer?: boolean;
  };
  images?: {
    imageThreshold?: number;
    pages?: number[];
    imageDataUrl?: boolean;
    imageBuffer?: boolean;
  };
  tables?: {
    pages?: number[];
    format?: string;
  };
}

export class DocumentManagementService {
  private static readonly API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  /**
   * Upload a document
   */
  static async uploadDocument(
    file: File, 
    userId: string, 
    userEmail?: string, 
    documentType: string = 'resume',
    processingOptions?: ProcessingOptions
  ): Promise<{ documentId: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('userEmail', userEmail || '');
    formData.append('documentType', documentType);
    if (processingOptions) {
      formData.append('processingOptions', JSON.stringify(processingOptions));
    }

    const response = await fetch(`${this.API_BASE_URL}/api/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload document');
    }

    const result = await response.json();
    return {
      documentId: result.documentId,
      filename: result.filename
    };
  }

  /**
   * Get user's documents
   */
  static async getUserDocuments(userId: string): Promise<Document[]> {
    const response = await fetch(`${this.API_BASE_URL}/api/documents/users/${userId}/documents`);

    if (response.status === 404) {
      // No documents found - return empty array instead of throwing error
      return [];
    }

    if (!response.ok) {
      throw new Error('Failed to get user documents');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get active document for a user
   */
  static async getActiveDocument(userId: string): Promise<Document | null> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/documents/users/${userId}/active`);

      if (response.status === 404) {
        // Expected for first-time users - no error logging needed
        return null;
      }

      if (!response.ok) {
        throw new Error('Failed to get active document');
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      // Only log unexpected errors, not network failures for expected 404s
      if (error instanceof Error && error.message !== 'Failed to get active document') {
        console.warn('Document check failed (expected for new users):', error.message);
      }
      return null;
    }
  }

  /**
   * Set active document for a user
   */
  static async setActiveDocument(userId: string, documentId: string): Promise<boolean> {
    const response = await fetch(`${this.API_BASE_URL}/api/documents/users/${userId}/active`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documentId }),
    });

    if (!response.ok) {
      throw new Error('Failed to set active document');
    }

    const result = await response.json();
    return result.success;
  }

  /**
   * Get document processing results
   */
  static async getDocumentProcessingResults(documentId: string): Promise<DocumentProcessingResults | null> {
    const response = await fetch(`${this.API_BASE_URL}/api/documents/${documentId}/processing`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to get document processing results');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Process document manually
   */
  static async processDocument(documentId: string, processingOptions?: ProcessingOptions): Promise<any> {
    const response = await fetch(`${this.API_BASE_URL}/api/documents/${documentId}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(processingOptions || {}),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process document');
    }

    const result = await response.json();
    return result;
  }

  /**
   * Get document assets (previews, images, etc.)
   */
  static async getDocumentAssets(documentId: string, assetType?: string): Promise<DocumentAsset[]> {
    const url = new URL(`${this.API_BASE_URL}/api/documents/${documentId}/assets`);
    if (assetType) {
      url.searchParams.append('assetType', assetType);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error('Failed to get document assets');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Download document file
   */
  static async downloadDocument(documentId: string): Promise<Blob> {
    const response = await fetch(`${this.API_BASE_URL}/api/documents/${documentId}/download`);

    if (!response.ok) {
      throw new Error('Failed to download document');
    }

    return response.blob();
  }

  /**
   * Delete document
   */
  static async deleteDocument(documentId: string): Promise<boolean> {
    const response = await fetch(`${this.API_BASE_URL}/api/documents/${documentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete document');
    }

    const result = await response.json();
    return result.success;
  }

  /**
   * Get processing queue
   */
  static async getProcessingQueue(limit: number = 50): Promise<any[]> {
    const response = await fetch(`${this.API_BASE_URL}/api/documents/queue?limit=${limit}`);

    if (!response.ok) {
      throw new Error('Failed to get processing queue');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get document statistics
   */
  static async getDocumentStatistics(): Promise<any> {
    const response = await fetch(`${this.API_BASE_URL}/api/documents/statistics`);

    if (!response.ok) {
      throw new Error('Failed to get document statistics');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get document summary
   */
  static async getDocumentSummary(limit: number = 50, userId?: string): Promise<any[]> {
    const url = new URL(`${this.API_BASE_URL}/api/documents/summary`);
    url.searchParams.append('limit', limit.toString());
    if (userId) {
      url.searchParams.append('userId', userId);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error('Failed to get document summary');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * CLI Methods - Direct access to pdf-parse CLI features
   */

  /**
   * Get PDF header information
   */
  static async getPDFHeader(filePath: string): Promise<any> {
    const response = await fetch(`${this.API_BASE_URL}/api/documents/cli/header`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath }),
    });

    if (!response.ok) {
      throw new Error('Failed to get PDF header');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Extract text using CLI
   */
  static async extractTextCLI(filePath: string, options?: any): Promise<any> {
    const response = await fetch(`${this.API_BASE_URL}/api/documents/cli/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath, options }),
    });

    if (!response.ok) {
      throw new Error('Failed to extract text');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get PDF info using CLI
   */
  static async getPDFInfoCLI(filePath: string, options?: any): Promise<any> {
    const response = await fetch(`${this.API_BASE_URL}/api/documents/cli/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath, options }),
    });

    if (!response.ok) {
      throw new Error('Failed to get PDF info');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Generate screenshots using CLI
   */
  static async generateScreenshotsCLI(filePath: string, outputPath: string, options?: any): Promise<any> {
    const response = await fetch(`${this.API_BASE_URL}/api/documents/cli/screenshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath, outputPath, options }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate screenshots');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Extract images using CLI
   */
  static async extractImagesCLI(filePath: string, outputPath: string, options?: any): Promise<any> {
    const response = await fetch(`${this.API_BASE_URL}/api/documents/cli/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath, outputPath, options }),
    });

    if (!response.ok) {
      throw new Error('Failed to extract images');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Extract tables using CLI
   */
  static async extractTablesCLI(filePath: string, outputPath: string, options?: any): Promise<any> {
    const response = await fetch(`${this.API_BASE_URL}/api/documents/cli/tables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath, outputPath, options }),
    });

    if (!response.ok) {
      throw new Error('Failed to extract tables');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Validate PDF file
   */
  static validatePDFFile(file: File): boolean {
    // Check file type
    if (file.type !== 'application/pdf') {
      throw new Error('Only PDF files are accepted');
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB');
    }

    return true;
  }

  /**
   * Extract key information from text (same as before)
   */
  static extractResumeInfo(text: string): {
    email?: string;
    phone?: string;
    name?: string;
    skills: string[];
    experience: string[];
    education: string[];
  } {
    const result = {
      email: undefined as string | undefined,
      phone: undefined as string | undefined,
      name: undefined as string | undefined,
      skills: [] as string[],
      experience: [] as string[],
      education: [] as string[]
    };

    // Extract email
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) {
      result.email = emailMatch[0];
    }

    // Extract phone number (basic pattern)
    const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
      result.phone = phoneMatch[0];
    }

    // Extract name (simplified - usually at the beginning of resume)
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length < 50 && /^[A-Za-z\s]+$/.test(firstLine)) {
        result.name = firstLine;
      }
    }

    // Extract skills (common technical skills)
    const commonSkills = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#',
      'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes',
      'Git', 'Linux', 'Angular', 'Vue.js', 'Express', 'Django', 'Flask', 'Spring Boot'
    ];

    result.skills = commonSkills.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );

    // Extract experience (look for "experience" section)
    const experienceSection = text.toLowerCase().split('experience')[1]?.split('education')[0];
    if (experienceSection) {
      const experienceLines = experienceSection.split('\n').filter(line => line.trim().length > 20);
      result.experience = experienceLines.slice(0, 5); // Top 5 experience lines
    }

    // Extract education (look for "education" section)
    const educationSection = text.toLowerCase().split('education')[1]?.split('experience')[0];
    if (educationSection) {
      const educationLines = educationSection.split('\n').filter(line => line.trim().length > 10);
      result.education = educationLines.slice(0, 3); // Top 3 education lines
    }

    return result;
  }

  /**
   * Get resume statistics (same as before)
   */
  static getResumeStats(text: string): {
    wordCount: number;
    characterCount: number;
    lineCount: number;
    pageCount: number;
  } {
    const words = text.trim().split(/\s+/).filter((word: string) => word.length > 0);
    const lines = text.split('\n').filter((line: string) => line.trim().length > 0);
    
    // Estimate page count (rough approximation: ~500 words per page)
    const pageCount = Math.ceil(words.length / 500);

    return {
      wordCount: words.length,
      characterCount: text.length,
      lineCount: lines.length,
      pageCount
    };
  }
}
