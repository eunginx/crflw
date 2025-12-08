import express from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { pool } from '../db.js';
import {
  performOCR,
  extractResumeFromScreenshot,
  extractFieldsFromDocument,
  batchOCR,
  extractTextFromPDFScreenshot
} from '../services/ocrService.js';

const router = express.Router();

/**
 * ================================
 *  OCR ENDPOINT FOR IMAGE FILES
 * ================================
 * Expects:
 *    imagePath: Path to image file
 *    extractionSchema: Optional custom schema
 *    customPrompt: Optional custom prompt
 */
router.post("/extract-from-image", async (req, res) => {
  console.log('🔍 === OCR IMAGE EXTRACTION DEBUG START ===');
  console.log('🔍 Request body:', req.body);
  
  try {
    const { imagePath, extractionSchema, customPrompt } = req.body;

    if (!imagePath) {
      console.log('🔍 ERROR: Image path is required');
      return res.status(400).json({ error: "Image path is required" });
    }

    console.log('🔍 Starting OCR extraction for image:', imagePath);

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.log('🔍 ERROR: Image file not found:', imagePath);
      return res.status(404).json({ error: 'Image file not found' });
    }

    // Perform OCR extraction
    const result = await performOCR(imagePath, extractionSchema, customPrompt);
    
    console.log('🎉 OCR extraction completed successfully');
    console.log('🔍 Extracted keys:', Object.keys(result));
    console.log('🔍 === OCR IMAGE EXTRACTION DEBUG END ===');
    
    return res.status(200).json({
      success: true,
      imagePath: imagePath,
      extracted_data: result,
      processed_at: new Date().toISOString()
    });
    
  } catch (err) {
    console.error("❌ OCR Image Extraction Error:", err.message);
    console.error("🔍 Full error:", err);
    console.error("🔍 Error stack:", err.stack);
    console.log('🔍 === OCR IMAGE EXTRACTION ERROR END ===');
    return res.status(500).json({ 
      error: "OCR image extraction failed", 
      details: err.message 
    });
  }
});

/**
 * ================================
 *  OCR ENDPOINT FOR PDF SCREENSHOTS
 * ================================
 * Expects:
 *    documentId: ID of stored PDF document
 *    pageNumber: Page number to extract (default: 1)
 */
router.post("/extract-from-pdf", async (req, res) => {
  console.log('📄 === OCR PDF EXTRACTION DEBUG START ===');
  console.log('📄 Request body:', req.body);
  
  try {
    const { documentId, pageNumber = 1 } = req.body;

    if (!documentId) {
      console.log('📄 ERROR: Document ID is required');
      return res.status(400).json({ error: "Document ID is required" });
    }

    console.log('📄 Starting OCR PDF extraction for document:', documentId, 'page:', pageNumber);

    // Get document file path from database
    const client = await pool.connect();
    let filePath;
    try {
      const result = await client.query(
        'SELECT file_path FROM documents WHERE id = $1',
        [documentId]
      );
      
      if (result.rows.length === 0) {
        console.log('📄 ERROR: Document not found in database');
        return res.status(404).json({ error: 'Document not found' });
      }
      
      filePath = result.rows[0].file_path;
      console.log('📄 Document file path:', filePath);
    } finally {
      client.release();
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('📄 ERROR: PDF file not found on disk');
      return res.status(404).json({ error: 'PDF file not found on disk' });
    }

    // Perform OCR on PDF screenshot
    const result = await extractTextFromPDFScreenshot(filePath, pageNumber);
    
    console.log('🎉 OCR PDF extraction completed successfully');
    console.log('📄 Extracted keys:', Object.keys(result));
    console.log('📄 === OCR PDF EXTRACTION DEBUG END ===');
    
    return res.status(200).json({
      success: true,
      documentId: documentId,
      pageNumber: pageNumber,
      extracted_data: result,
      processed_at: new Date().toISOString()
    });
    
  } catch (err) {
    console.error("❌ OCR PDF Extraction Error:", err.message);
    console.error("📄 Full error:", err);
    console.error("📄 Error stack:", err.stack);
    console.log('📄 === OCR PDF EXTRACTION ERROR END ===');
    return res.status(500).json({ 
      error: "OCR PDF extraction failed", 
      details: err.message 
    });
  }
});

/**
 * ================================
 *  OCR ENDPOINT FOR RESUME SCREENSHOTS
 * ================================
 * Expects:
 *    documentId: ID of stored resume document
 *    pageNumber: Page number to extract (default: 1)
 */
router.post("/extract-resume", async (req, res) => {
  console.log('📄 === OCR RESUME EXTRACTION DEBUG START ===');
  console.log('📄 Request body:', req.body);
  
  try {
    const { documentId, pageNumber = 1 } = req.body;

    if (!documentId) {
      console.log('📄 ERROR: Document ID is required');
      return res.status(400).json({ error: "Document ID is required" });
    }

    console.log('📄 Starting OCR resume extraction for document:', documentId, 'page:', pageNumber);

    // Get document file path from database
    const client = await pool.connect();
    let filePath;
    try {
      const result = await client.query(
        'SELECT file_path FROM documents WHERE id = $1',
        [documentId]
      );
      
      if (result.rows.length === 0) {
        console.log('📄 ERROR: Document not found in database');
        return res.status(404).json({ error: 'Document not found' });
      }
      
      filePath = result.rows[0].file_path;
      console.log('📄 Document file path:', filePath);
    } finally {
      client.release();
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('📄 ERROR: PDF file not found on disk');
      return res.status(404).json({ error: 'PDF file not found on disk' });
    }

    // Generate screenshot and perform resume-specific OCR
    console.log('📄 Generating PDF screenshot for resume OCR...');
    const { PDFParse } = await import('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    
    const parser = new PDFParse({ data: dataBuffer });
    const screenshotResult = await parser.getScreenshot({ 
      scale: 2.0,
      page: pageNumber
    });
    await parser.destroy();
    
    if (!screenshotResult.pages || screenshotResult.pages.length === 0) {
      throw new Error('Failed to generate PDF screenshot');
    }
    
    // Save screenshot temporarily
    const screenshotPath = filePath.replace('.pdf', `_ocr_page_${pageNumber}.png`);
    const screenshotData = screenshotResult.pages[0].data;
    
    // Convert base64 to buffer and save
    const imageBuffer = Buffer.from(screenshotData, 'base64');
    fs.writeFileSync(screenshotPath, imageBuffer);
    
    console.log('🖼️ PDF screenshot generated for OCR:', screenshotPath);
    
    // Perform resume-specific OCR
    const result = await extractResumeFromScreenshot(screenshotPath);
    
    // Clean up temporary file
    try {
      fs.unlinkSync(screenshotPath);
      console.log('🧹 Temporary screenshot cleaned up');
    } catch (cleanupError) {
      console.warn('⚠️ Failed to cleanup temporary file:', cleanupError.message);
    }
    
    // Store OCR results in database
    console.log('💾 Storing OCR results in database...');
    const ocrClient = await pool.connect();
    try {
      const insertResult = await ocrClient.query(
        `INSERT INTO document_processing_results 
         (document_id, extracted_text, text_length, estimated_pages, processed_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (document_id) DO UPDATE SET
         extracted_text = EXCLUDED.extracted_text,
         text_length = EXCLUDED.text_length,
         estimated_pages = EXCLUDED.estimated_pages,
         processed_at = CURRENT_TIMESTAMP`,
        [
          documentId,
          JSON.stringify(result),
          JSON.stringify(result).length,
          pageNumber
        ]
      );
      console.log('✅ OCR results stored in database');
    } catch (dbError) {
      console.error('📄 ERROR: Failed to store OCR results:', dbError);
      // Don't fail the whole request if DB storage fails
    } finally {
      ocrClient.release();
    }
    
    console.log('🎉 OCR resume extraction completed successfully');
    console.log('📄 === OCR RESUME EXTRACTION DEBUG END ===');
    
    return res.status(200).json({
      success: true,
      documentId: documentId,
      pageNumber: pageNumber,
      extracted_data: result,
      processed_at: new Date().toISOString()
    });
    
  } catch (err) {
    console.error("❌ OCR Resume Extraction Error:", err.message);
    console.error("📄 Full error:", err);
    console.error("📄 Error stack:", err.stack);
    console.log('📄 === OCR RESUME EXTRACTION ERROR END ===');
    return res.status(500).json({ 
      error: "OCR resume extraction failed", 
      details: err.message 
    });
  }
});

/**
 * ================================
 *  OCR ENDPOINT FOR CUSTOM FIELD EXTRACTION
 * ================================
 * Expects:
 *    imagePath: Path to image file
 *    fields: Array of field names to extract
 */
router.post("/extract-fields", async (req, res) => {
  console.log('🔍 === OCR FIELD EXTRACTION DEBUG START ===');
  console.log('🔍 Request body:', req.body);
  
  try {
    const { imagePath, fields } = req.body;

    if (!imagePath) {
      console.log('🔍 ERROR: Image path is required');
      return res.status(400).json({ error: "Image path is required" });
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      console.log('🔍 ERROR: Fields array is required');
      return res.status(400).json({ error: "Fields array is required" });
    }

    console.log('🔍 Starting OCR field extraction for image:', imagePath);
    console.log('🔍 Fields to extract:', fields);

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.log('🔍 ERROR: Image file not found:', imagePath);
      return res.status(404).json({ error: 'Image file not found' });
    }

    // Perform field extraction
    const result = await extractFieldsFromDocument(imagePath, fields);
    
    console.log('🎉 OCR field extraction completed successfully');
    console.log('🔍 Extracted fields:', Object.keys(result));
    console.log('🔍 === OCR FIELD EXTRACTION DEBUG END ===');
    
    return res.status(200).json({
      success: true,
      imagePath: imagePath,
      fields: fields,
      extracted_data: result,
      processed_at: new Date().toISOString()
    });
    
  } catch (err) {
    console.error("❌ OCR Field Extraction Error:", err.message);
    console.error("🔍 Full error:", err);
    console.error("🔍 Error stack:", err.stack);
    console.log('🔍 === OCR FIELD EXTRACTION ERROR END ===');
    return res.status(500).json({ 
      error: "OCR field extraction failed", 
      details: err.message 
    });
  }
});

/**
 * ================================
 *  OCR HEALTH CHECK ENDPOINT
 * ================================
 */
router.get("/health", async (req, res) => {
  try {
    console.log('🔍 OCR Health Check');
    
    // Check Ollama API configuration
    const API_KEY = process.env.OLLAMA_API_KEY;
    const API_URL = process.env.API_URL || "https://ollama.com/api/chat";
    const MODEL = process.env.MODEL || "qwen3-vl:235b";
    
    if (!API_KEY) {
      return res.status(500).json({
        status: "unhealthy",
        error: "OLLAMA_API_KEY not configured"
      });
    }
    
    // Test API connectivity with a minimal request
    try {
      const testPayload = {
        model: MODEL,
        messages: [
          {
            role: "user",
            content: "Respond with 'OK' for health check",
          },
        ],
        stream: false,
      };

      const headers = {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      };

      const response = await axios.post(API_URL, testPayload, { 
        headers, 
        timeout: 10000 
      });

      if (response.status === 200) {
        return res.status(200).json({
          status: "healthy",
          service: "ocr-service",
          api_url: API_URL,
          model: MODEL,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error(`API returned status ${response.status}`);
      }
      
    } catch (apiError) {
      console.error('OCR API Health Check Failed:', apiError.message);
      return res.status(500).json({
        status: "unhealthy",
        error: "Failed to connect to Ollama API",
        details: apiError.message
      });
    }
    
  } catch (err) {
    console.error("❌ OCR Health Check Error:", err.message);
    return res.status(500).json({ 
      status: "unhealthy",
      error: "OCR service health check failed", 
      details: err.message 
    });
  }
});

export default router;
