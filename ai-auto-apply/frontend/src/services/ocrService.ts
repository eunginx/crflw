import axios from 'axios';

export interface OCRResult {
  success: boolean;
  extracted_data?: any;
  error?: string;
  details?: string;
  processed_at?: string;
}

export interface OCRImageRequest {
  imagePath: string;
  extractionSchema?: any;
  customPrompt?: string;
}

export interface OCRPDFRequest {
  documentId: string;
  pageNumber?: number;
}

export interface OCRFieldRequest {
  imagePath: string;
  fields: string[];
}

export class OCRService {
  private static readonly API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  /**
   * Perform OCR on an image file
   */
  static async extractFromImage(request: OCRImageRequest): Promise<OCRResult> {
    console.log('🔍 === FRONTEND OCR IMAGE EXTRACTION DEBUG START ===');
    console.log('🔍 Request:', request);
    console.log('🔍 API Base URL:', this.API_BASE_URL);
    
    try {
      const endpoint = `${this.API_BASE_URL}/api/ocr/extract-from-image`;
      console.log('🔍 Endpoint:', endpoint);
      
      const response = await axios.post(endpoint, request, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 2 minutes
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response data:', response.data);
      console.log('🔍 === FRONTEND OCR IMAGE EXTRACTION DEBUG END ===');

      return response.data;
    } catch (error: any) {
      console.error('❌ Frontend OCR Image Error:', error);
      
      // Detailed error logging
      if (error.response) {
        console.error('🔍 Error Response Data:', error.response.data);
        console.error('🔍 Error Response Status:', error.response.status);
        console.error('🔍 Error Response Headers:', error.response.headers);
      } else if (error.request) {
        console.error('🔍 Error Request (no response):', error.request);
      } else {
        console.error('🔍 Error Message:', error.message);
      }
      
      console.error('🔍 Error Config:', error.config);
      console.error('🔍 === FRONTEND OCR IMAGE EXTRACTION ERROR END ===');

      if (error.response?.data) {
        return error.response.data;
      } else {
        return {
          success: false,
          error: "OCR image extraction failed",
          details: error.message || 'Unknown error'
        };
      }
    }
  }

  /**
   * Perform OCR on a PDF document
   */
  static async extractFromPDF(request: OCRPDFRequest): Promise<OCRResult> {
    console.log('📄 === FRONTEND OCR PDF EXTRACTION DEBUG START ===');
    console.log('📄 Request:', request);
    console.log('📄 API Base URL:', this.API_BASE_URL);
    
    try {
      const endpoint = `${this.API_BASE_URL}/api/ocr/extract-from-pdf`;
      console.log('📄 Endpoint:', endpoint);
      
      const response = await axios.post(endpoint, request, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 2 minutes
      });

      console.log('📄 Response status:', response.status);
      console.log('📄 Response data:', response.data);
      console.log('📄 === FRONTEND OCR PDF EXTRACTION DEBUG END ===');

      return response.data;
    } catch (error: any) {
      console.error('❌ Frontend OCR PDF Error:', error);
      
      // Detailed error logging
      if (error.response) {
        console.error('📄 Error Response Data:', error.response.data);
        console.error('📄 Error Response Status:', error.response.status);
        console.error('📄 Error Response Headers:', error.response.headers);
      } else if (error.request) {
        console.error('📄 Error Request (no response):', error.request);
      } else {
        console.error('📄 Error Message:', error.message);
      }
      
      console.error('📄 Error Config:', error.config);
      console.error('📄 === FRONTEND OCR PDF EXTRACTION ERROR END ===');

      if (error.response?.data) {
        return error.response.data;
      } else {
        return {
          success: false,
          error: "OCR PDF extraction failed",
          details: error.message || 'Unknown error'
        };
      }
    }
  }

  /**
   * Perform OCR on a resume document with resume-specific schema
   */
  static async extractResume(request: OCRPDFRequest): Promise<OCRResult> {
    console.log('📄 === FRONTEND OCR RESUME EXTRACTION DEBUG START ===');
    console.log('📄 Request:', request);
    console.log('📄 API Base URL:', this.API_BASE_URL);
    
    try {
      const endpoint = `${this.API_BASE_URL}/api/ocr/extract-resume`;
      console.log('📄 Endpoint:', endpoint);
      
      const response = await axios.post(endpoint, request, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 2 minutes
      });

      console.log('📄 Response status:', response.status);
      console.log('📄 Response data:', response.data);
      console.log('📄 === FRONTEND OCR RESUME EXTRACTION DEBUG END ===');

      return response.data;
    } catch (error: any) {
      console.error('❌ Frontend OCR Resume Error:', error);
      
      // Detailed error logging
      if (error.response) {
        console.error('📄 Error Response Data:', error.response.data);
        console.error('📄 Error Response Status:', error.response.status);
        console.error('📄 Error Response Headers:', error.response.headers);
      } else if (error.request) {
        console.error('📄 Error Request (no response):', error.request);
      } else {
        console.error('📄 Error Message:', error.message);
      }
      
      console.error('📄 Error Config:', error.config);
      console.error('📄 === FRONTEND OCR RESUME EXTRACTION ERROR END ===');

      if (error.response?.data) {
        return error.response.data;
      } else {
        return {
          success: false,
          error: "OCR resume extraction failed",
          details: error.message || 'Unknown error'
        };
      }
    }
  }

  /**
   * Extract specific fields from a document
   */
  static async extractFields(request: OCRFieldRequest): Promise<OCRResult> {
    console.log('🔍 === FRONTEND OCR FIELD EXTRACTION DEBUG START ===');
    console.log('🔍 Request:', request);
    console.log('🔍 API Base URL:', this.API_BASE_URL);
    
    try {
      const endpoint = `${this.API_BASE_URL}/api/ocr/extract-fields`;
      console.log('🔍 Endpoint:', endpoint);
      
      const response = await axios.post(endpoint, request, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 2 minutes
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response data:', response.data);
      console.log('🔍 === FRONTEND OCR FIELD EXTRACTION DEBUG END ===');

      return response.data;
    } catch (error: any) {
      console.error('❌ Frontend OCR Field Error:', error);
      
      // Detailed error logging
      if (error.response) {
        console.error('🔍 Error Response Data:', error.response.data);
        console.error('🔍 Error Response Status:', error.response.status);
        console.error('🔍 Error Response Headers:', error.response.headers);
      } else if (error.request) {
        console.error('🔍 Error Request (no response):', error.request);
      } else {
        console.error('🔍 Error Message:', error.message);
      }
      
      console.error('🔍 Error Config:', error.config);
      console.error('🔍 === FRONTEND OCR FIELD EXTRACTION ERROR END ===');

      if (error.response?.data) {
        return error.response.data;
      } else {
        return {
          success: false,
          error: "OCR field extraction failed",
          details: error.message || 'Unknown error'
        };
      }
    }
  }

  /**
   * Check OCR service health
   */
  static async checkHealth(): Promise<any> {
    console.log('🔍 === FRONTEND OCR HEALTH CHECK DEBUG START ===');
    console.log('🔍 API Base URL:', this.API_BASE_URL);
    
    try {
      const endpoint = `${this.API_BASE_URL}/api/ocr/health`;
      console.log('🔍 Endpoint:', endpoint);
      
      const response = await axios.get(endpoint, {
        timeout: 10000, // 10 seconds
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response data:', response.data);
      console.log('🔍 === FRONTEND OCR HEALTH CHECK DEBUG END ===');

      return response.data;
    } catch (error: any) {
      console.error('❌ Frontend OCR Health Check Error:', error);
      
      // Detailed error logging
      if (error.response) {
        console.error('🔍 Error Response Data:', error.response.data);
        console.error('🔍 Error Response Status:', error.response.status);
        console.error('🔍 Error Response Headers:', error.response.headers);
      } else if (error.request) {
        console.error('🔍 Error Request (no response):', error.request);
      } else {
        console.error('🔍 Error Message:', error.message);
      }
      
      console.error('🔍 Error Config:', error.config);
      console.error('🔍 === FRONTEND OCR HEALTH CHECK ERROR END ===');

      if (error.response?.data) {
        return error.response.data;
      } else {
        return {
          status: "unhealthy",
          error: "OCR service health check failed",
          details: error.message || 'Unknown error'
        };
      }
    }
  }

  /**
   * Test OCR service with a simple request
   */
  static async testOCR(): Promise<{ success: boolean; message: string; details?: any }> {
    console.log('🧪 === FRONTEND OCR TEST DEBUG START ===');
    
    try {
      // First check health
      const health = await this.checkHealth();
      console.log('🧪 Health check result:', health);
      
      if (health.status !== 'healthy') {
        return {
          success: false,
          message: 'OCR service is not healthy',
          details: health
        };
      }

      // Test with a simple field extraction request
      const testResult = await this.extractFields({
        imagePath: '/test/path/image.jpg', // This will fail but test the endpoint
        fields: ['test_field']
      });

      console.log('🧪 Test result:', testResult);
      console.log('🧪 === FRONTEND OCR TEST DEBUG END ===');

      return {
        success: true,
        message: 'OCR service is reachable',
        details: { health, testResult }
      };
      
    } catch (error: any) {
      console.error('❌ Frontend OCR Test Error:', error);
      console.error('🧪 === FRONTEND OCR TEST ERROR END ===');

      return {
        success: false,
        message: 'OCR service test failed',
        details: error.message
      };
    }
  }
}
