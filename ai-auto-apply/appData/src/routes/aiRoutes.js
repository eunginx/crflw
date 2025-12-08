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
  console.log('🧠 === PROXY TO AI SERVICE FOR VISION ANALYSIS ===');
  console.log('🧠 Request body:', req.body);

  try {
    const { documentId } = req.body;

    if (!documentId) {
      console.log('🧠 ERROR: Document ID is required');
      return res.status(400).json({ error: "Document ID is required" });
    }

    console.log('🧠 Proxying to AI service for vision analysis...');
    console.log('🧠 Document ID:', documentId);

    // Proxy to AI service (port 9000) which has vision analysis capability
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:9000';
    const aiServiceEndpoint = `${AI_SERVICE_URL}/api/ai/analyze-resume`;

    console.log('🧠 AI Service URL:', aiServiceEndpoint);
    console.log('🧠 Forwarding request to AI service with 10-minute timeout...');

    const aiResponse = await axios.post(
      aiServiceEndpoint,
      { documentId },
      {
        timeout: 600000, // 10 minutes for vision processing
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ AI service responded successfully');
    console.log('🧠 Response status:', aiResponse.status);
    console.log('🧠 Response data keys:', Object.keys(aiResponse.data || {}));
    console.log('🧠 === PROXY COMPLETE ===');

    return res.status(200).json(aiResponse.data);
  } catch (err) {
    console.error("❌ Proxy to AI Service Error:", err.message);
    console.error("🧠 Full error:", err);

    if (axios.isAxiosError(err)) {
      console.error("🧠 Axios error details:", {
        code: err.code,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });

      // Forward the error from AI service
      if (err.response) {
        return res.status(err.response.status).json(err.response.data);
      }
    }

    console.log('🧠 === PROXY ERROR END ===');
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
