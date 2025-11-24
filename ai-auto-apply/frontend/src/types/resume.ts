export interface ResumeDocument {
  id: string;
  user_id: string;
  original_filename: string;
  uploaded_at: string;
  is_active: boolean;
  status?: "processed" | "pending" | "error";
  file_path?: string;
  file_size?: number;
  mime_type?: string;
}

export interface PdfMetadata {
  totalPages: number;
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  subject?: string;
  keywords?: string;
  creationDate?: string;
  modificationDate?: string;
}

export interface ResumeStats {
  wordCount: number;
  lineCount: number;
  pageCount: number;
  characterCount: number;
  paragraphCount: number;
}

export interface ResumeExtractedInfo {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  location?: string;
  skills: string[];
  experience?: string[];
  education?: string[];
  sections?: {
    summary?: boolean;
    experience?: boolean;
    education?: boolean;
    skills?: boolean;
    projects?: boolean;
    certifications?: boolean;
  };
}

export interface UnifiedResumeResult {
  text: string;
  metadata: PdfMetadata;
  previewImage: string;
  stats: ResumeStats;
  extractedInfo: ResumeExtractedInfo;
  processingTime?: number;
  success: boolean;
  error?: string;
  // PDF metadata from backend
  pdfTotalPages?: number;
  pdfTitle?: string | null;
  pdfAuthor?: string | null;
  pdfCreator?: string | null;
  pdfProducer?: string | null;
}

export interface ProcessedResume {
  text: string;
  textLength: number;
  filename: string;
  processedAt: string;
  screenshotPath?: string;
  textFilePath?: string;
  metadata?: PdfMetadata;
  stats?: ResumeStats;
  extractedInfo?: ResumeExtractedInfo;
  // PDF metadata from backend
  pdfTotalPages?: number;
  pdfTitle?: string | null;
  pdfAuthor?: string | null;
  pdfCreator?: string | null;
  pdfProducer?: string | null;
}

export interface ParsedResume {
  success: boolean;
  text: string;
  numPages: number;
  info: any;
  pages: any;
  previewImageBase64: string;
  error?: string;
}

export interface ResumeProcessingOptions {
  text?: {
    preserveLayout?: boolean;
    lineBreaks?: boolean;
  };
  info?: {
    parsePageInfo?: boolean;
    extractMetadata?: boolean;
  };
  screenshots?: {
    scale?: number;
    first?: number;
    last?: number;
    all?: boolean;
  };
  images?: {
    imageThreshold?: number;
    extractAll?: boolean;
  };
  tables?: {
    format?: 'json' | 'csv' | 'markdown';
  };
}
