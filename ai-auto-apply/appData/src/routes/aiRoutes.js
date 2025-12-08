import express from "express";
import axios from "axios";
import fs from "fs";
// import { parseResume } from "../services/pdfParserService.js";
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
  console.log('🧠 === BACKEND AI ANALYSIS DEBUG START ===');
  console.log('🧠 Request body:', req.body);
  console.log('🧠 Request headers:', req.headers);
  
  try {
    const { documentId } = req.body;

    if (!documentId) {
      console.log('🧠 ERROR: Document ID is required');
      return res.status(400).json({ error: "Document ID is required" });
    }

    console.log('🧠 Starting AI resume analysis for document:', documentId);
    console.log('🧠 Environment variables check:');
    console.log('🧠 - OLLAMA_API_KEY exists:', !!process.env.OLLAMA_API_KEY);
    console.log('🧠 - API_URL:', process.env.API_URL);
    console.log('🧠 - MODEL:', process.env.MODEL);

    // === Get pre-extracted text from database ===
    console.log('🧠 Getting pre-extracted text from database...');
    const client = await pool.connect();
    let extractedText = '';
    let numPages = 1;
    let metadata = {};
    
    try {
      const result = await client.query(
        `SELECT extracted_text, text_length, estimated_pages
         FROM document_processing_results 
         WHERE document_id = $1 AND extracted_text IS NOT NULL AND extracted_text != ''`,
        [documentId]
      );
      
      console.log('🧠 Text extraction query result:', {
        rowCount: result.rowCount,
        hasText: result.rows.length > 0 && !!result.rows[0].extracted_text
      });
      
      if (result.rows.length === 0 || !result.rows[0].extracted_text) {
        console.log('🧠 ERROR: No extracted text found. Document must be processed first.');
        return res.status(400).json({ 
          error: 'Document text not found. Please process the document first.',
          suggestion: 'Call POST /api/pdf-processing/extract-text first'
        });
      }
      
      extractedText = result.rows[0].extracted_text;
      numPages = result.rows[0].estimated_pages || 1;
      
      console.log('🧠 Retrieved pre-extracted text:', {
        textLength: extractedText.length,
        numPages: numPages
      });
    } finally {
      client.release();
    }

    // === Check Ollama Cloud API configuration ===
    if (!API_KEY) {
      console.log('🧠 ERROR: OLLAMA_API_KEY not configured');
      return res.status(500).json({ 
        error: "AI service not configured",
        details: "OLLAMA_API_KEY environment variable is missing"
      });
    }

    // === ENHANCED PROMPT: Comprehensive Resume Analysis ===
    console.log('🧠 Preparing AI analysis prompt...');
    const content = `
You are an expert resume analyst and career coach with deep expertise in recruiting, ATS systems, and professional branding.

Analyze the following resume text to provide comprehensive insights.
Return ONLY a JSON object, with NO extra text or markdown fences.

Extract and analyze:
{
  "contact": {
    "name": "",
    "email": "",
    "phone": "",
    "linkedin": "",
    "github": "",
    "portfolio": "",
    "location": ""
  },
  "professional_summary": {
    "summary_text": "",
    "years_experience": 0,
    "career_level": "",
    "industry_focus": ""
  },
  "skills_analysis": {
    "technical_skills": [],
    "soft_skills": [],
    "tools_technologies": [],
    "certifications": [],
    "skills_gaps": [],
    "in_demand_skills": []
  },
  "experience_analysis": {
    "total_positions": 0,
    "companies_count": 0,
    "career_progression": "",
    "achievements_highlighted": [],
    "quantifiable_metrics": [],
    "responsibilities_vs_achievements": ""
  },
  "education_analysis": {
    "highest_degree": "",
    "institutions": [],
    "graduation_years": [],
    "education_relevance": "",
    "continuous_learning": ""
  },
  "content_analysis": {
    "word_count": 0,
    "action_verbs_used": [],
    "buzzwords_detected": [],
    "clarity_score": 0,
    "conciseness_score": 0,
    "professional_tone": ""
  },
  "ats_optimization": {
    "ats_score": 0,
    "keyword_optimization": "",
    "format_compatibility": "",
    "section_standardization": "",
    "missing_keywords": []
  },
  "strengths": [],
  "improvement_areas": [],
  "recommendations": {
    "immediate_actions": [],
    "content_improvements": [],
    "formatting_suggestions": [],
    "skill_enhancements": []
  },
  "overall_scores": {
    "quality_score": 0,
    "impact_score": 0,
    "completeness_score": 0,
    "professionalism_score": 0
  },
  "sections_detected": []
}

ANALYSIS GUIDELINES:
1. Use text analysis for comprehensive insights
2. Evaluate content quality: action verbs, achievements, quantifiable results
3. Analyze ATS compatibility and optimization
4. Provide specific, actionable recommendations
5. Score each aspect objectively (0-100)
6. Identify both strengths and areas for improvement
7. Consider industry standards and best practices

Focus on providing actionable insights that will help the candidate improve their resume and job search success.`;

    // === Prepare Ollama Cloud API call ===
    console.log('🧠 Preparing Ollama Cloud API call...');
    const messages = [
      {
        role: "user",
        content,
      },
      {
        role: "user",
        content: `Resume text:\n${extractedText}` 
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

    console.log('🧠 API call details:', {
      url: API_URL,
      model: MODEL,
      messageCount: messages.length,
      textLength: extractedText.length,
      timeout: 60000
    });

    console.log('🌐 Calling Ollama Cloud API...');
    // === Call Ollama Cloud ===
    const responseAI = await axios.post(API_URL, payload, { headers, timeout: 60000 });
    
    console.log('🧠 Ollama API response:', {
      status: responseAI.status,
      statusText: responseAI.statusText,
      hasData: !!responseAI.data,
      hasMessage: !!responseAI.data?.message,
      hasContent: !!responseAI.data?.message?.content,
      contentLength: responseAI.data?.message?.content?.length
    });
    
    let raw = responseAI?.data?.message?.content || "";
    console.log('🧠 Raw AI response length:', raw.length);

    console.log('🤖 AI response received, parsing JSON...');
    // Clean JSON fences
    raw = raw.replace("```json", "").replace("```", "").trim();

    let parsed;
    try {
      console.log('🧠 Attempting to parse JSON response...');
      parsed = JSON.parse(raw);
      console.log('✅ JSON parsed successfully');
      console.log('🧠 Parsed analysis keys:', Object.keys(parsed));
    } catch (e) {
      console.error('❌ Failed to parse AI JSON response:', e);
      console.error('🧠 Raw response that failed to parse:', raw.substring(0, 500) + '...');
      return res.status(200).json({
        error: "AI returned invalid JSON",
        raw: raw.substring(0, 1000) // Return first 1000 chars for debugging
      });
    }

    // === Store enhanced analysis in database ===
    console.log('💾 Storing comprehensive analysis in database...');
    const analysisClient = await pool.connect();
    try {
      const insertResult = await analysisClient.query(
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
          JSON.stringify(parsed.skills_analysis || parsed.skills || {}),
          parsed.overall_scores?.quality_score || parsed.quality_score || 0,
          parsed.ats_optimization?.ats_score || parsed.ats_score || 0,
          parsed.content_analysis?.clarity_score || parsed.aesthetic_score || 0,
          JSON.stringify({
            strengths: parsed.strengths || [],
            improvement_areas: parsed.improvement_areas || [],
            recommendations: parsed.recommendations || [],
            skills_analysis: parsed.skills_analysis || {},
            experience_analysis: parsed.experience_analysis || {},
            content_analysis: parsed.content_analysis || {},
            overall_scores: parsed.overall_scores || {}
          })
        ]
      );
      console.log('✅ Analysis stored in database');
      console.log('🧠 Insert result:', insertResult.rowCount);
    } catch (dbError) {
      console.error('🧠 ERROR: Failed to store analysis in database:', dbError);
      // Don't fail the whole request if DB storage fails
    } finally {
      analysisClient.release();
    }

    console.log('🎉 Resume analysis completed successfully');
    const finalResponse = {
      analysis: parsed,
      extracted_text: extractedText,
      text_length: extractedText.length,
      num_pages: numPages,
      screenshot_available: false // No screenshot in text-only mode
    };
    console.log('🧠 Final response structure:', Object.keys(finalResponse));
    console.log('🧠 === BACKEND AI ANALYSIS DEBUG END ===');
    
    return res.status(200).json(finalResponse);
  } catch (err) {
    console.error("❌ Resume Analysis Error:", err.message);
    console.error("🧠 Full error:", err);
    console.error("🧠 Error stack:", err.stack);
    console.log('🧠 === BACKEND AI ANALYSIS ERROR END ===');
    return res.status(500).json({ 
      error: "Resume analysis failed", 
      details: err.message 
    });
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
