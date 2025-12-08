import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// === CONFIGURATION ===
const API_KEY = process.env.OLLAMA_API_KEY;
const API_URL = process.env.API_URL || "https://ollama.com/api/chat";
const MODEL = process.env.MODEL || "qwen3-vl:235b";

/**
 * OCR Service using Ollama Cloud API
 * Performs OCR on images and extracts structured information in JSON format
 */

/**
 * Convert image file to base64
 * @param {string} imagePath - Path to image file
 * @returns {string} Base64 encoded image
 */
function imageToBase64(imagePath) {
  try {
    const imgBytes = fs.readFileSync(imagePath);
    return imgBytes.toString("base64");
  } catch (error) {
    console.error('❌ Error reading image file:', error.message);
    throw new Error(`Failed to read image file: ${error.message}`);
  }
}

/**
 * Perform OCR on an image with custom extraction schema
 * @param {string} imagePath - Path to image file
 * @param {Object} extractionSchema - JSON schema for extraction
 * @param {string} customPrompt - Custom prompt for extraction
 * @returns {Object} Extracted structured data
 */
async function performOCR(imagePath, extractionSchema = null, customPrompt = null) {
  try {
    console.log('🔍 Starting OCR extraction for image:', imagePath);
    
    // Validate inputs
    if (!API_KEY) {
      throw new Error('OLLAMA_API_KEY not configured in environment variables');
    }
    
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    // Convert image to base64
    const imgB64 = imageToBase64(imagePath);
    console.log('📷 Image converted to base64, size:', imgB64.length);

    // Default extraction schema for resumes
    const defaultPrompt = `You are an expert OCR and information extraction assistant for resumes and documents.
Analyze the attached image, extract only the structured information, and return a valid JSON object.

Default schema for resumes:
{
  "personal_info": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": ""
  },
  "professional_summary": {
    "title": "",
    "summary": "",
    "years_experience": 0
  },
  "skills": {
    "technical_skills": [],
    "soft_skills": [],
    "tools": [],
    "certifications": []
  },
  "experience": [
    {
      "title": "",
      "company": "",
      "duration": "",
      "description": ""
    }
  ],
  "education": [
    {
      "degree": "",
      "institution": "",
      "year": ""
    }
  ]
}

If a value is missing, leave it as an empty string or empty array. Do not include any text outside the JSON.`;

    // Use custom prompt if provided
    const prompt = customPrompt || defaultPrompt;

    // === REQUEST PAYLOAD ===
    const payload = {
      model: MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
          images: [imgB64],
        },
      ],
      stream: false,
    };

    // === HEADERS ===
    const headers = {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    };

    console.log('🌐 Calling Ollama Cloud API for OCR...');
    
    // === API REQUEST ===
    const response = await axios.post(API_URL, payload, { 
      headers, 
      timeout: 120000 // 2 minute timeout for OCR
    });

    const data = response.data;
    const raw = data?.message?.content || "";

    console.log('🧾 Raw OCR output length:', raw.length);

    // === CLEAN JSON ===
    const cleaned = raw
      .replace("```json", "")
      .replace("```", "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      console.log('✅ OCR JSON parsed successfully');
      console.log('📊 Extracted keys:', Object.keys(parsed));
      return parsed;
    } catch (err) {
      console.error('⚠️ Failed to parse OCR JSON output');
      console.error('Raw output:', raw.substring(0, 500) + '...');
      
      // Return raw text as fallback
      return {
        error: "Failed to parse JSON",
        raw_text: raw,
        extraction_failed: true
      };
    }
  } catch (err) {
    console.error('❌ Error during OCR extraction:', err.response?.data || err.message);
    
    if (err.code === 'ECONNREFUSED') {
      throw new Error('Failed to connect to Ollama Cloud API');
    } else if (err.code === 'ETIMEDOUT') {
      throw new Error('OCR extraction timed out');
    } else if (err.response?.status === 401) {
      throw new Error('Invalid Ollama API key');
    } else if (err.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    throw new Error(`OCR extraction failed: ${err.message}`);
  }
}

/**
 * Perform OCR on resume screenshot with resume-specific schema
 * @param {string} screenshotPath - Path to resume screenshot
 * @returns {Object} Structured resume data
 */
async function extractResumeFromScreenshot(screenshotPath) {
  const resumePrompt = `You are an expert resume analyzer and OCR specialist.
Extract comprehensive information from this resume image and return a valid JSON object.

Schema:
{
  "contact": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": "",
    "portfolio": ""
  },
  "professional_summary": {
    "headline": "",
    "summary_text": "",
    "years_experience": 0,
    "career_level": ""
  },
  "skills_analysis": {
    "technical_skills": [],
    "soft_skills": [],
    "tools_technologies": [],
    "certifications": [],
    "languages": []
  },
  "work_experience": [
    {
      "title": "",
      "company": "",
      "location": "",
      "duration": "",
      "description": "",
      "achievements": []
    }
  ],
  "education": [
    {
      "degree": "",
      "institution": "",
      "location": "",
      "graduation_year": "",
      "gpa": ""
    }
  ],
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": [],
      "duration": ""
    }
  ],
  "sections_detected": [],
  "layout_analysis": {
    "format_quality": "",
    "readability_score": 0,
    "organization": "",
    "visual_hierarchy": ""
  }
}

Extract ALL visible information accurately. If a section is not visible, use empty arrays/strings.
Return ONLY valid JSON, no additional text.`;

  return await performOCR(screenshotPath, null, resumePrompt);
}

/**
 * Perform OCR on document image with custom fields
 * @param {string} imagePath - Path to document image
 * @param {Array} fields - Array of field names to extract
 * @returns {Object} Extracted field data
 */
async function extractFieldsFromDocument(imagePath, fields = []) {
  const fieldsPrompt = `You are an expert OCR and data extraction specialist.
Extract the following fields from this document image and return a valid JSON object.

Fields to extract: ${fields.join(', ')}

Schema:
{
${fields.map(field => `  "${field}": "",`).join('\n')}
}

Extract information accurately. If a field is not found, leave it as empty string.
Return ONLY valid JSON, no additional text.`;

  return await performOCR(imagePath, null, fieldsPrompt);
}

/**
 * Batch OCR processing for multiple images
 * @param {Array} imagePaths - Array of image file paths
 * @param {Function} progressCallback - Progress callback function
 * @returns {Array} Array of extraction results
 */
async function batchOCR(imagePaths, progressCallback = null) {
  const results = [];
  
  for (let i = 0; i < imagePaths.length; i++) {
    const imagePath = imagePaths[i];
    
    try {
      console.log(`📷 Processing image ${i + 1}/${imagePaths.length}: ${imagePath}`);
      
      const result = await performOCR(imagePath);
      results.push({
        imagePath,
        success: true,
        data: result
      });
      
      if (progressCallback) {
        progressCallback(i + 1, imagePaths.length, imagePath, result);
      }
      
    } catch (error) {
      console.error(`❌ Failed to process image ${imagePath}:`, error.message);
      results.push({
        imagePath,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Generate screenshot from PDF and perform OCR
 * @param {string} pdfPath - Path to PDF file
 * @param {number} pageNumber - Page number to extract (default: 1)
 * @returns {Object} OCR results from PDF screenshot
 */
async function extractTextFromPDFScreenshot(pdfPath, pageNumber = 1) {
  try {
    console.log('📄 Generating PDF screenshot for OCR...');
    
    // Generate screenshot using existing PDF service
    const { PDFParse } = await import('pdf-parse');
    const dataBuffer = fs.readFileSync(pdfPath);
    
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
    const screenshotPath = pdfPath.replace('.pdf', `_page_${pageNumber}.png`);
    const screenshotData = screenshotResult.pages[0].data;
    
    // Convert base64 to buffer and save
    const imageBuffer = Buffer.from(screenshotData, 'base64');
    fs.writeFileSync(screenshotPath, imageBuffer);
    
    console.log('🖼️ PDF screenshot generated:', screenshotPath);
    
    // Perform OCR on the screenshot
    const ocrResult = await extractResumeFromScreenshot(screenshotPath);
    
    // Clean up temporary file
    try {
      fs.unlinkSync(screenshotPath);
      console.log('🧹 Temporary screenshot cleaned up');
    } catch (cleanupError) {
      console.warn('⚠️ Failed to cleanup temporary file:', cleanupError.message);
    }
    
    return ocrResult;
    
  } catch (error) {
    console.error('❌ Failed to extract text from PDF screenshot:', error.message);
    throw new Error(`PDF OCR extraction failed: ${error.message}`);
  }
}

export {
  performOCR,
  extractResumeFromScreenshot,
  extractFieldsFromDocument,
  batchOCR,
  extractTextFromPDFScreenshot,
  imageToBase64
};
