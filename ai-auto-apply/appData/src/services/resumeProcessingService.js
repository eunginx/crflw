import fs from 'fs/promises';
import path from 'path';
import { pool } from '../db.js';
import { PDFParse } from 'pdf-parse';

class ResumeProcessingService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
    this.assetsDir = path.join(__dirname, '../../assets');
    this.ensureDirectories();
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      await fs.mkdir(this.assetsDir, { recursive: true });
      await fs.mkdir(path.join(this.assetsDir, 'screenshots'), { recursive: true });
      await fs.mkdir(path.join(this.assetsDir, 'texts'), { recursive: true });
    } catch (error) {
      console.error('Failed to create directories:', error);
    }
  }

  /**
   * Process resume PDF and extract text and generate screenshot
   * Only one processed output per user regardless of multiple uploads
   */
  async processResume(userId, documentId, filePath) {
    try {
      console.log(`Processing resume for user ${userId}, document ${documentId}`);

      // Check if user already has processed resume data
      const existingResult = await pool.query(
        'SELECT * FROM user_resume_data WHERE user_id = $1',
        [userId]
      );

      // Read PDF file
      const dataBuffer = await fs.readFile(filePath);
      
      // Parse PDF to extract text using correct v2.4.5 API
      const parser = new PDFParse({ data: dataBuffer });
      const pdfData = await parser.getText();
      const pdfInfo = await parser.getInfo({ parsePageInfo: true });
      await parser.destroy();

      // Generate screenshot (first page as image)
      const screenshotPath = await this.generateScreenshot(documentId, filePath);

      // Save text to file
      const textFilePath = await this.saveTextFile(documentId, pdfData.text);

      // Store in database (update if exists, insert if new)
      let result;
      if (existingResult.rows.length > 0) {
        // Update existing record
        result = await pool.query(`
          UPDATE user_resume_data 
          SET document_id = $1, 
              extracted_text = $2, 
              text_file_path = $3,
              screenshot_path = $4,
              total_pages = $5,
              pdf_info = $6,
              processed_at = CURRENT_TIMESTAMP,
              filename = $7
          WHERE user_id = $8
          RETURNING *
        `, [
          documentId,
          pdfData.text,
          textFilePath,
          screenshotPath,
          pdfInfo.total || 0,
          pdfInfo.info || {},
          path.basename(filePath),
          userId
        ]);
      } else {
        // Insert new record
        result = await pool.query(`
          INSERT INTO user_resume_data 
          (user_id, document_id, extracted_text, text_file_path, screenshot_path, total_pages, pdf_info, filename)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [
          userId,
          documentId,
          pdfData.text,
          textFilePath,
          screenshotPath,
          pdfInfo.total || 0,
          pdfInfo.info || {},
          path.basename(filePath)
        ]);
      }

      // Update document processing status
      await pool.query(
        `UPDATE documents 
         SET processing_status = 'completed', 
             processed_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [documentId]
      );

      return {
        success: true,
        data: {
          id: result.rows[0].id,
          userId,
          documentId,
          extractedText: pdfData.text,
          textLength: pdfData.text.length,
          totalPages: pdfInfo.total || 0,
          screenshotPath,
          textFilePath,
          processedAt: result.rows[0].processed_at,
          filename: path.basename(filePath),
          pdfInfo: pdfInfo.info
        }
      };

    } catch (error) {
      console.error('Error processing resume:', error);
      
      // Update document processing status to failed
      await pool.query(
        `UPDATE documents 
         SET processing_status = 'failed', 
             processing_error = $1 
         WHERE id = $2`,
        [error.message, documentId]
      );

      throw error;
    }
  }

  /**
   * Generate screenshot of PDF first page using pdf-parse v2.4.5
   */
  async generateScreenshot(documentId, filePath) {
    try {
      const screenshotFileName = `resume_${documentId}_page1.png`;
      const screenshotPath = path.join(this.assetsDir, 'screenshots', screenshotFileName);

      // Read PDF file
      const dataBuffer = await fs.readFile(filePath);
      
      console.log(`🖼️ Generating screenshot for document ${documentId}, PDF size: ${dataBuffer.length} bytes`);
      
      // Generate screenshot using pdf-parse v2.4.5 API
      const parser = new PDFParse({ data: dataBuffer });
      const screenshotResult = await parser.getScreenshot({ 
        scale: 1.5,
        imageDataUrl: false, // Only get buffer, no base64
        imageBuffer: true    // Ensure we get binary buffer
      });
      await parser.destroy();

      // Verify we have the screenshot data
      if (!screenshotResult.pages || screenshotResult.pages.length === 0) {
        throw new Error('No pages returned from screenshot generation');
      }

      // Save the first page screenshot - result.pages[0].data should be a Buffer
      const imageBuffer = screenshotResult.pages[0].data;
      
      if (!Buffer.isBuffer(imageBuffer)) {
        console.error('❌ Screenshot data is not a buffer:', typeof imageBuffer);
        throw new Error('Screenshot data is not a buffer');
      }
      
      await fs.writeFile(screenshotPath, imageBuffer);
      
      console.log(`✅ Screenshot generated successfully at: ${screenshotPath} (${imageBuffer.length} bytes)`);
      return screenshotPath;
    } catch (error) {
      console.error('❌ Error generating screenshot:', error);
      console.error('🔧 Screenshot error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Fallback to placeholder if screenshot generation fails
      const screenshotFileName = `resume_${documentId}_page1.png`;
      const screenshotPath = path.join(this.assetsDir, 'screenshots', screenshotFileName);
      // Create a minimal 1x1 transparent PNG as placeholder
      const placeholderBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg==', 'base64');
      await fs.writeFile(screenshotPath, placeholderBuffer);
      console.log(`🔄 Using placeholder screenshot at: ${screenshotPath}`);
      return screenshotPath;
    }
  }

  /**
   * Save extracted text to file
   */
  async saveTextFile(documentId, text) {
    try {
      const textFileName = `resume_${documentId}_extracted.txt`;
      const textFilePath = path.join(this.assetsDir, 'texts', textFileName);
      
      await fs.writeFile(textFilePath, text, 'utf8');
      console.log(`Text file saved at: ${textFilePath}`);
      return textFilePath;
    } catch (error) {
      console.error('Error saving text file:', error);
      throw error;
    }
  }

  /**
   * Get processed resume data for user
   */
  async getResumeData(userId) {
    try {
      const result = await pool.query(
        'SELECT * FROM user_resume_data WHERE user_id = $1 ORDER BY processed_at DESC LIMIT 1',
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const resumeData = result.rows[0];
      
      // Read text file content
      let textContent = '';
      try {
        textContent = await fs.readFile(resumeData.text_file_path, 'utf8');
      } catch (fileError) {
        console.error('Error reading text file:', fileError);
        textContent = resumeData.extracted_text || '';
      }

      return {
        id: resumeData.id,
        userId: resumeData.user_id,
        documentId: resumeData.document_id,
        extractedText: textContent,
        textLength: textContent.length,
        totalPages: resumeData.total_pages,
        screenshotPath: resumeData.screenshot_path,
        textFilePath: resumeData.text_file_path,
        processedAt: resumeData.processed_at,
        filename: resumeData.filename,
        pdfInfo: resumeData.pdf_info
      };
    } catch (error) {
      console.error('Error getting resume data:', error);
      throw error;
    }
  }

  /**
   * Get screenshot file as base64 for frontend display
   */
  async getScreenshotBase64(userId) {
    try {
      const resumeData = await this.getResumeData(userId);
      if (!resumeData || !resumeData.screenshotPath) {
        return null;
      }

      const imageBuffer = await fs.readFile(resumeData.screenshotPath);
      return imageBuffer.toString('base64');
    } catch (error) {
      console.error('Error getting screenshot:', error);
      return null;
    }
  }
}

export default ResumeProcessingService;
