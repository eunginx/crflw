import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const AI_SERVICE_BASE_URL = process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:9000';

export interface ResumeUploadResponse {
  success: boolean;
  data: {
    resumeId: string;
    filename: string;
    originalFilename: string;
    size: number;
    uploadDate: string;
    processingStatus: string;
  };
}

export interface ResumeData {
  id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  upload_date: string; // Changed from uploaded_at to match API
  is_active: boolean;
  updated_at?: string;
  processingStatus?: string;
}

export interface ResumeListResponse {
  success: boolean;
  data: ResumeData[];
}

export interface ResumeProcessingResults {
  message?: string;
  extractedText?: string;
  textLength?: number;
  numPages?: number;
  info?: {
    Title?: string;
    Author?: string;
    Creator?: string;
    Producer?: string;
  };
  pdfTotalPages?: number;
  pdfTitle?: string;
  pdfAuthor?: string;
  pdfCreator?: string;
  pdfProducer?: string;
  // New mapped fields for persistent results
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  filename?: string;
  file_size?: number;
  upload_date?: string;
  screenshotPaths?: string[]; // Array of screenshot paths for all pages
  textFilePath?: string;
  processedAt?: string;
  processingStatus?: string;
  wordCount?: number;
  lineCount?: number;
  analysis?: {
    contactInfo: {
      name?: string;
      email?: string;
      phone?: string;
      linkedin?: string;
      github?: string;
      portfolio?: string;
    };
    sections: {
      summary?: boolean;
      experience?: boolean;
      education?: boolean;
      skills?: boolean;
      projects?: boolean;
      certifications?: boolean;
      awards?: boolean;
      languages?: boolean;
      references?: boolean;
    };
    skills: string[];
    qualityScore: {
      overall: number;
      structure: number;
      content: number;
      formatting: number;
    };
    recommendations: string[];
  };
}

export interface ResumeResultsResponse {
  success: boolean;
  data: ResumeProcessingResults | null;
}

export interface AIApplyStatus {
  current: string;
  message: string;
  features: {
    upload: boolean;
    processing: boolean;
    analysis: boolean;
    autoApply: boolean;
  };
  estimatedLaunch?: string;
}

export interface StatusResponse {
  success: boolean;
  data: AIApplyStatus;
}

class AIApplyService {
  /**
   * Upload a resume file
   */
  async uploadResume(
    file: File,
    userId: string,
    userEmail?: string
  ): Promise<ResumeUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    if (userEmail) {
      formData.append('userEmail', userEmail);
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/ai-apply/resumes/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 seconds timeout for file upload
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error uploading resume:', error);
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || 'Failed to upload resume'
          : 'Network error during upload'
      );
    }
  }

  /**
   * Get all resumes for a user
   */
  async getUserResumes(userId: string): Promise<ResumeListResponse> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/ai-apply/resumes/users/${userId}?include_inactive=true`
      );

      return response.data;
    } catch (error) {
      console.error('Error getting user resumes:', error);
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || 'Failed to get resumes'
          : 'Network error while fetching resumes'
      );
    }
  }

  /**
   * Get active resume for a user
   */
  async getActiveResume(userId: string): Promise<{ success: boolean; data: ResumeData | null }> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/ai-apply/resumes/users/${userId}/active`
      );

      return response.data;
    } catch (error) {
      console.error('Error getting active resume:', error);
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || 'Failed to get active resume'
          : 'Network error while fetching active resume'
      );
    }
  }

  /**
   * Set a resume as active
   */
  async setActiveResume(resumeId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/ai-apply/resumes/${resumeId}/set-active`,
        { userId }
      );

      return response.data;
    } catch (error) {
      console.error('Error setting active resume:', error);
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || 'Failed to set active resume'
          : 'Network error while setting active resume'
      );
    }
  }

  /**
   * Process a resume
   */
  async processResume(
    resumeId: string,
    processingOptions?: any
  ): Promise<{ success: boolean; message: string; resumeId: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/ai-apply/resumes/${resumeId}/process`,
        { processingOptions }
      );

      return response.data;
    } catch (error) {
      console.error('Error processing resume:', error);
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || 'Failed to process resume'
          : 'Network error while processing resume'
      );
    }
  }

  /**
   * Get resume processing results including AI analysis
   */
  async getResumeResults(resumeId: string): Promise<ResumeResultsResponse> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/ai-apply/resumes/${resumeId}/results`
      );

      return response.data;
    } catch (error) {
      console.error('Error getting resume results:', error);
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || 'Failed to get resume results'
          : 'Network error while fetching resume results'
      );
    }
  }

  /**
   * Delete a resume - always performs hard delete
   */
  async deleteResume(resumeId: string, userEmail: string): Promise<{ success: boolean; message: string; hardDelete: boolean }> {
    try {
      console.log('🗑️ HARD DELETING resume:', { resumeId, userEmail });
      
      const response = await axios.delete(
        `${API_BASE_URL}/api/ai-apply/resumes/${resumeId}`,
        { data: { userEmail, hardDelete: true } } // Always hard delete
      );
      
      console.log('🗑️ Resume hard delete successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('🗑️ Error hard deleting resume:', error);
      if (axios.isAxiosError(error)) {
        console.error('🗑️ Delete error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || 'Failed to delete resume'
          : 'Network error while deleting resume'
      );
    }
  }

  /**
   * Get AI Apply status
   */
  async getStatus(): Promise<StatusResponse> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/ai-apply/status`
      );

      return response.data;
    } catch (error) {
      console.error('Error getting AI Apply status:', error);
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || 'Failed to get status'
          : 'Network error while fetching status'
      );
    }
  }

  /**
   * Get screenshot URL
   */
  getScreenshotUrl(screenshotPath: string): string {
    console.log('🖼️ getScreenshotUrl DEBUG - Input:', { 
      screenshotPath, 
      type: typeof screenshotPath,
      length: screenshotPath?.length,
      apiBaseUrl: API_BASE_URL
    });
    
    if (!screenshotPath) {
      console.log('🖼️ getScreenshotUrl DEBUG - No screenshotPath provided, returning empty string');
      return '';
    }
    
    // Extract filename from path
    const filename = screenshotPath.split('/').pop();
    const url = `${API_BASE_URL}/api/documents/screenshots/${filename}`;
    
    console.log('🖼️ getScreenshotUrl DEBUG - URL construction:', {
      originalPath: screenshotPath,
      extractedFilename: filename,
      finalUrl: url
    });
    
    return url;
  }

  /**
   * AI Apply Pipeline Methods
   */

  /**
   * Get job matches for a resume
   */
  async getJobMatches(resumeId: string, userId: string, preferences?: any): Promise<any> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/ai-apply-pipeline/job-matching`,
        { resumeId, userId, preferences }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting job matches:', error);
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || 'Failed to get job matches'
          : 'Network error while fetching job matches'
      );
    }
  }

  /**
   * Generate cover letter for a job
   */
  async generateCoverLetter(resumeId: string, userId: string, jobId: string, jobDetails?: any): Promise<any> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/ai-apply-pipeline/generate-cover-letter`,
        { resumeId, userId, jobId, jobDetails }
      );

      return response.data;
    } catch (error) {
      console.error('Error generating cover letter:', error);
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || 'Failed to generate cover letter'
          : 'Network error while generating cover letter'
      );
    }
  }

  /**
   * Auto-fill application data
   */
  async autoFillApplication(resumeId: string, userId: string, jobId: string, applicationForm?: any): Promise<any> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/ai-apply-pipeline/auto-fill-application`,
        { resumeId, userId, jobId, applicationForm }
      );

      return response.data;
    } catch (error) {
      console.error('Error auto-filling application:', error);
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || 'Failed to auto-fill application'
          : 'Network error while auto-filling application'
      );
    }
  }

  /**
   * Submit application
   */
  async submitApplication(resumeId: string, userId: string, jobId: string, applicationData: any, coverLetterId?: string): Promise<any> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/ai-apply-pipeline/submit-application`,
        { resumeId, userId, jobId, applicationData, coverLetterId }
      );

      return response.data;
    } catch (error) {
      console.error('Error submitting application:', error);
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || 'Failed to submit application'
          : 'Network error while submitting application'
      );
    }
  }

  /**
   * Get application status and history
   */
  async getApplicationStatus(userId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/ai-apply-pipeline/application-status/${userId}`
      );

      return response.data;
    } catch (error) {
      console.error('Error getting application status:', error);
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || 'Failed to get application status'
          : 'Network error while fetching application status'
      );
    }
  }

  /**
   * Start AI analysis for a processed resume
   */
  async startAIAnalysis(documentId: string): Promise<any> {
    try {
      // First get the resume processing results to extract the text
      const resultsResponse = await axios.get(
        `${API_BASE_URL}/api/ai-apply/resumes/${documentId}/results`
      );

      const processingResults = resultsResponse.data?.data;
      
      if (!processingResults) {
        throw new Error('No resume processing results found. Please ensure the resume has been processed first.');
      }

      if (!processingResults.extracted_text) {
        throw new Error('No resume text found for analysis. Please ensure the resume has been processed successfully.');
      }

      // Run comprehensive AI analysis
      const [aestheticResult, skillsResult, recommendationsResult] = await Promise.all([
        this.analyzeAestheticScore(processingResults.extracted_text, JSON.stringify(processingResults)),
        this.analyzeSkills(processingResults.extracted_text),
        this.generateRecommendations(processingResults.extracted_text, [], {})
      ]);

      return {
        aesthetic: aestheticResult,
        skills: skillsResult,
        recommendations: recommendationsResult
      };
    } catch (error) {
      console.error('Failed to start AI analysis:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to start AI analysis';
        throw new Error(errorMessage);
      }
      throw new Error('Network error while starting AI analysis');
    }
  }

  /**
   * Get user's persistent resume processing state
   */
  async getUserResumeState(userEmail: string): Promise<any> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/ai-apply/resumes/state/${encodeURIComponent(userEmail)}`
      );

      return response.data;
    } catch (error) {
      console.error('Error getting user resume state:', error);
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || 'Failed to get user resume state'
          : 'Network error while fetching user resume state'
      );
    }
  }

  /**
   * Get processing results from persistent state
   */
  async getPersistentProcessingResults(userEmail: string): Promise<any> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/ai-apply/resumes/results/persistent/${encodeURIComponent(userEmail)}`
      );

      return response.data;
    } catch (error) {
      console.error('Error getting persistent processing results:', error);
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || 'Failed to get processing results'
          : 'Network error while fetching processing results'
      );
    }
  }

  /**
   * Check if user needs to process their resume
   */
  async checkIfNeedsProcessing(userEmail: string): Promise<any> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/ai-apply/resumes/needs-processing/${encodeURIComponent(userEmail)}`
      );

      return response.data;
    } catch (error) {
      console.error('Error checking processing status:', error);
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || 'Failed to check processing status'
          : 'Network error while checking processing status'
      );
    }
  }

  /**
   * Analyze aesthetic score of resume
   */
  async analyzeAestheticScore(resumeText: string, resumeContent: string): Promise<any> {
    try {
      console.log('🎨 CALLING AI SERVICE FOR AESTHETIC SCORE');
      console.log('AI Service URL:', AI_SERVICE_BASE_URL);
      console.log('Resume Text Length:', resumeText?.length || 0);
      
      const response = await axios.post(
        `${AI_SERVICE_BASE_URL}/api/ai/analyze-aesthetic-score`,
        {
          resumeText,
          resumeContent
        }
      );
      
      console.log('🎨 AI SERVICE RESPONSE:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ AI SERVICE ERROR (Aesthetic Score):', error);
      if (axios.isAxiosError(error)) {
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        throw new Error(
          error.response?.data?.error || 'Failed to analyze aesthetic score'
        );
      }
      throw new Error('Network error while analyzing aesthetic score');
    }
  }

  /**
   * Analyze skills from resume text
   */
  async analyzeSkills(resumeText: string): Promise<any> {
    try {
      console.log('🔧 CALLING AI SERVICE FOR SKILLS ANALYSIS');
      console.log('AI Service URL:', AI_SERVICE_BASE_URL);
      console.log('Resume Text Length:', resumeText?.length || 0);
      
      const response = await axios.post(
        `${AI_SERVICE_BASE_URL}/api/ai/analyze-skills`,
        {
          resumeText
        }
      );
      
      console.log('🔧 AI SERVICE RESPONSE:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ AI SERVICE ERROR (Skills Analysis):', error);
      if (axios.isAxiosError(error)) {
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        throw new Error(
          error.response?.data?.error || 'Failed to analyze skills'
        );
      }
      throw new Error('Network error while analyzing skills');
    }
  }

  /**
   * Generate recommendations for resume improvement
   */
  async generateRecommendations(resumeText: string, resumeSections: any[], currentSkills: any): Promise<any> {
    try {
      console.log('💡 CALLING AI SERVICE FOR RECOMMENDATIONS');
      console.log('AI Service URL:', AI_SERVICE_BASE_URL);
      console.log('Resume Text Length:', resumeText?.length || 0);
      console.log('Resume Sections:', resumeSections);
      console.log('Current Skills:', currentSkills);
      
      const response = await axios.post(
        `${AI_SERVICE_BASE_URL}/api/ai/generate-recommendations`,
        {
          resumeText,
          resumeSections,
          currentSkills
        }
      );
      
      console.log('💡 AI SERVICE RESPONSE:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ AI SERVICE ERROR (Recommendations):', error);
      if (axios.isAxiosError(error)) {
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        throw new Error(
          error.response?.data?.error || 'Failed to generate recommendations'
        );
      }
      throw new Error('Network error while generating recommendations');
    }
  }
}

// Create a singleton instance
export const aiApplyService = new AIApplyService();

export default aiApplyService;
