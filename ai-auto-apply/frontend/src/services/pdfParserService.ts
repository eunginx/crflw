// Use pdf-parse v2.2.2 with named export
import { pdf } from 'pdf-parse';

export interface ResumeData {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  is_active: boolean;
  uploaded_at: string;
}

export interface ProcessedResume {
  text: string;
  textLength: number;
  filename: string;
  processedAt: string;
  pngPreview?: string; // Base64 PNG data - not available in v1
  metadata?: {
    totalPages: number;
    title?: string;
    author?: string;
    creator?: string;
    producer?: string;
  };
}

export class PDFParserService {
  /**
   * Extract text from a PDF buffer using pdf-parse v1
   */
  static async extractText(buffer: Uint8Array): Promise<string> {
    try {
      console.log('Extracting text from PDF using v1 API...');
      const result = await pdf(buffer);
      console.log('Text extracted:', result.text?.length || 0, 'characters');
      return result.text || '';
    } catch (error) {
      console.error('PDF text extraction failed:', error);
      throw new Error('Failed to extract text from PDF: ' + (error as Error).message);
    }
  }

  /**
   * Generate PNG preview - not available in v1 API
   */
  static async generatePNGPreview(buffer: Uint8Array, scale: number = 1.5): Promise<string | undefined> {
    console.log('PNG generation not available in v2 API - skipping');
    return undefined;
  }

  /**
   * Extract PDF metadata using v1 API
   */
  static async extractMetadata(buffer: Uint8Array): Promise<{
    totalPages: number;
    title?: string;
    author?: string;
    creator?: string;
    producer?: string;
  }> {
    try {
      console.log('Extracting PDF metadata using v1 API...');
      
      const result = await pdf(buffer);
      
      // v1 API has limited metadata - estimate pages from text
      const words = result.text.trim().split(/\s+/).filter((word: string) => word.length > 0);
      const estimatedPages = Math.ceil(words.length / 500);
      
      const metadata = {
        totalPages: estimatedPages,
        title: undefined, // Not available in v1
        author: undefined, // Not available in v1
        creator: undefined, // Not available in v1
        producer: undefined // Not available in v1
      };
      
      console.log('Metadata extracted:', metadata);
      return metadata;
    } catch (error) {
      console.warn('Metadata extraction failed:', error);
      // Return basic metadata
      return { totalPages: 0 };
    }
  }

  /**
   * Process a resume file from the database using pdf-parse v1
   */
  static async processResume(resume: ResumeData, downloadFunction: (id: string) => Promise<Blob>): Promise<ProcessedResume> {
    if (!resume) {
      throw new Error('Resume data is required');
    }

    console.log('Processing resume:', resume.filename);
    
    try {
      // Download the resume file
      const blob = await downloadFunction(resume.id);
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      // Extract text and metadata in parallel
      const [text, pngPreview, metadata] = await Promise.all([
        this.extractText(buffer),
        this.generatePNGPreview(buffer),
        this.extractMetadata(buffer)
      ]);

      return {
        text,
        textLength: text.length,
        filename: resume.filename,
        processedAt: new Date().toISOString(),
        pngPreview,
        metadata
      };

    } catch (error) {
      console.error('Error processing resume:', error);
      throw new Error('Failed to process resume: ' + (error as Error).message);
    }
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
   * Extract key information from resume text
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
   * Get resume statistics
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

  /**
   * Extract tables from PDF - not available in v1 API
   */
  static async extractTables(buffer: Uint8Array): Promise<any[]> {
    console.log('Table extraction not available in v1 API');
    return [];
  }

  /**
   * Extract images from PDF - not available in v1 API
   */
  static async extractImages(buffer: Uint8Array): Promise<string[]> {
    console.log('Image extraction not available in v1 API');
    return [];
  }
}
