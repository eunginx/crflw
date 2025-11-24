import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  upload_date: string;
  is_active: boolean;
  updated_at: string;
  processing_status?: string;
}

export interface ResumeListResponse {
  success: boolean;
  data: ResumeData[];
}

export interface ResumeProcessingResults {
  extracted_text?: string;
  text_length?: number;
  num_pages?: number;
  pdf_title?: string;
  pdf_author?: string;
  pdf_creator?: string;
  pdf_producer?: string;
  screenshot_path?: string;
  text_file_path?: string;
  processing_status?: string;
  processed_at?: string;
  word_count?: number;
  line_count?: number;
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
        `${API_BASE_URL}/api/ai-apply/resumes/users/${userId}`
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
   * Delete a resume
   */
  async deleteResume(resumeId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/ai-apply/resumes/${resumeId}`,
        { data: { userId } }
      );

      return response.data;
    } catch (error) {
      console.error('Error deleting resume:', error);
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
    if (!screenshotPath) return '';
    
    // Extract filename from path
    const filename = screenshotPath.split('/').pop();
    return `${API_BASE_URL}/api/documents/screenshots/${filename}`;
  }

  /**
   * Check if the service is healthy
   */
  async healthCheck(): Promise<{ service: string; status: string; timestamp: string }> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/ai-apply/health`
      );

      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('Service unavailable');
    }
  }
}

// Create a singleton instance
export const aiApplyService = new AIApplyService();

export default aiApplyService;
