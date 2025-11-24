import express from "express";
import axios from "axios";
import fs from "fs";
import { parseResume } from "../services/pdfParserService.js";
import dotenv from "dotenv";
import { pool } from '../db.js';

dotenv.config();

const router = express.Router();

const API_KEY = process.env.OLLAMA_API_KEY;
const API_URL = process.env.API_URL || "https://ollama.com/api/chat";
const MODEL = process.env.MODEL || "qwen3-vl:235b";

/**
 * ================================
 *  AI RESUME ANALYSIS ENDPOINT
 * ================================
 * Expects:
 *    filePath: path to stored PDF
 *  
 * Returns:
 *    Structured JSON describing resume
 */
router.post("/analyze-resume", async (req, res) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: "Document ID is required" });
    }

    console.log('🧠 Starting AI resume analysis for document:', documentId);

    // === Get document file path from database ===
    const client = await pool.connect();
    let filePath;
    try {
      const result = await client.query(
        'SELECT file_path FROM documents WHERE id = $1',
        [documentId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      filePath = result.rows[0].file_path;
      console.log('📁 Document file path:', filePath);
    } finally {
      client.release();
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ error: "PDF file not found on disk" });
    }

    // === Use existing PDF parser to get text and screenshot ===
    const pdfResult = await parseResume(filePath);
    console.log('📄 PDF parsed successfully');

    const extractedText = pdfResult.text || "";
    const numPages = pdfResult.numPages || 1;
    const base64Image = pdfResult.previewImageBase64;

    if (!base64Image) {
      console.warn('⚠️ No screenshot generated, proceeding with text only');
    }

    // === PROMPT: Resume Analysis ===
    const content = `
You are a resume analysis assistant.

Analyze the following resume (image + extracted text). 
Return ONLY a JSON object, with NO extra text.

Extract:
{
  "contact": {
    "name": "",
    "email": "",
    "phone": "",
    "linkedin": "",
    "location": ""
  },
  "summary": "",
  "skills": [],
  "experience": [],
  "education": [],
  "projects": [],
  "sections_detected": [],
  "word_count": 0,
  "quality_score": 0,
  "ats_score": 0,
  "aesthetic_score": 0,
  "recommendations": []
}

Rules:
- Do NOT include \`\`\`json fences.
- If something is missing, return an empty field.
`;

    // === Prepare Ollama Cloud API call ===
    const messages = [
      {
        role: "user",
        content,
        ...(base64Image ? { images: [base64Image] } : {})
      },
      {
        role: "user",
        content: `Extracted text:\n${extractedText}` 
      }
    ];

    const payload = {
      model: MODEL,
      messages,
      stream: false
    };

    const headers = {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    };

    console.log('🌐 Calling Ollama Cloud API...');
    // === Call Ollama Cloud ===
    const responseAI = await axios.post(API_URL, payload, { headers, timeout: 60000 });
    let raw = responseAI?.data?.message?.content || "";

    console.log('🤖 AI response received, parsing JSON...');
    // Clean JSON fences
    raw = raw.replace("```json", "").replace("```", "").trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
      console.log('✅ JSON parsed successfully');
    } catch (e) {
      console.error('❌ Failed to parse AI JSON response:', e);
      return res.status(200).json({
        error: "AI returned invalid JSON",
        raw
      });
    }

    // === Store analysis in database ===
    console.log('💾 Storing analysis in database...');
    const analysisClient = await pool.connect();
    try {
      await analysisClient.query(
        `INSERT INTO resume_analysis 
         (document_id, contact_info, sections_detected, skills, quality_score, ats_score, aesthetic_score, recommendations, analyzed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
         ON CONFLICT (document_id) DO UPDATE SET
         contact_info = EXCLUDED.contact_info,
         sections_detected = EXCLUDED.sections_detected,
         skills = EXCLUDED.skills,
         quality_score = EXCLUDED.quality_score,
         ats_score = EXCLUDED.ats_score,
         aesthetic_score = EXCLUDED.aesthetic_score,
         recommendations = EXCLUDED.recommendations,
         analyzed_at = CURRENT_TIMESTAMP`,
        [
          documentId,
          JSON.stringify(parsed.contact || {}),
          JSON.stringify(parsed.sections_detected || []),
          JSON.stringify(parsed.skills || {}),
          parsed.quality_score || 0,
          parsed.ats_score || 0,
          parsed.aesthetic_score || 0,
          JSON.stringify(parsed.recommendations || [])
        ]
      );
      console.log('✅ Analysis stored in database');
    } finally {
      analysisClient.release();
    }

    console.log('🎉 Resume analysis completed successfully');
    return res.status(200).json({
      analysis: parsed,
      extracted_text: extractedText,
      text_length: extractedText.length,
      num_pages: numPages,
      screenshot_available: !!base64Image
    });
  } catch (err) {
    console.error("❌ Resume Analysis Error:", err.message);
    return res.status(500).json({ error: "Resume analysis failed", details: err.message });
  }
});

// Legacy endpoint for compatibility
router.post("/analyze", async (req, res) => {
  try {
    const { documentId } = req.body;
    
    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    // Get document file path from database
    const client = await pool.connect();
    let filePath;
    try {
      const result = await client.query(
        'SELECT file_path FROM documents WHERE id = $1',
        [documentId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      filePath = result.rows[0].file_path;
    } finally {
      client.release();
    }

    // Forward to the new analyze-resume endpoint
    const analysisResult = await axios.post(`${req.protocol}://${req.get('host')}/api/ai/analyze-resume`, {
      filePath
    });

    res.json(analysisResult.data);
  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze resume',
      details: error.message
    });
  }
});

// Check Ollama Cloud service health
router.get('/health', async (req, res) => {
  try {
    if (!API_KEY) {
      return res.json({
        success: false,
        data: {
          status: 'unhealthy',
          error: 'OLLAMA_API_KEY not configured'
        }
      });
    }

    // Test API connectivity with a minimal request
    const testPayload = {
      model: MODEL,
      messages: [{ role: "user", content: "test" }],
      stream: false
    };

    const headers = {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    };

    const response = await axios.post(API_URL, testPayload, { 
      headers, 
      timeout: 5000,
      validateStatus: () => true // Don't throw on non-2xx responses
    });

    const isHealthy = response.status >= 200 && response.status < 300;

    res.json({
      success: isHealthy,
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        service: 'Ollama Cloud',
        model: MODEL,
        api_url: API_URL,
        ...(isHealthy ? {} : { 
          error: `API returned status ${response.status}`,
          details: response.data 
        })
      }
    });
  } catch (error) {
    res.json({
      success: false,
      data: {
        status: 'unhealthy',
        error: error.message,
        service: 'Ollama Cloud'
      }
    });
  }
});

export default router;
