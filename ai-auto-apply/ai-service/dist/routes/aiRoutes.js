"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ollamaService_1 = require("../services/ollamaService");
const router = (0, express_1.Router)();
router.post('/analyze-resume', async (req, res) => {
    try {
        const { documentId } = req.body;
        if (!documentId) {
            return res.status(400).json({ error: 'documentId is required' });
        }
        console.log('🧠 Vision Analysis Request - Document ID:', documentId);
        // Import vision analysis service
        const { analyzeResumeWithVision } = await Promise.resolve().then(() => __importStar(require('../services/visionAnalysisService')));
        // Fetch screenshot paths and extracted text from PDF processing service
        const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || 'http://localhost:8000';
        // Get text results
        const axios = (await Promise.resolve().then(() => __importStar(require('axios')))).default;
        const textResponse = await axios.get(`${PDF_SERVICE_URL}/api/pdf-processing/${documentId}/text-results`, { timeout: 30000 });
        if (!textResponse.data?.success || !textResponse.data?.data?.extracted_text) {
            return res.status(400).json({
                error: 'Resume text not extracted yet. Please process the resume first.'
            });
        }
        const extractedText = textResponse.data.data.extracted_text;
        const screenshotPathsJson = textResponse.data.data.screenshot_path;
        console.log('🧠 DEBUG - Raw response from PDF service:', {
            hasData: !!textResponse.data,
            hasDataData: !!textResponse.data?.data,
            extractedTextLength: extractedText?.length,
            screenshotPathsJson: screenshotPathsJson,
            screenshotPathsJsonType: typeof screenshotPathsJson,
            screenshotPathsJsonLength: screenshotPathsJson?.length,
            allDataKeys: Object.keys(textResponse.data?.data || {})
        });
        // Parse screenshot paths from JSON string
        let screenshotPaths = [];
        if (screenshotPathsJson) {
            try {
                screenshotPaths = JSON.parse(screenshotPathsJson);
                console.log('🧠 Successfully parsed screenshot paths:', screenshotPaths);
            }
            catch (error) {
                console.warn('Failed to parse screenshot paths:', error);
                console.warn('Raw value that failed to parse:', screenshotPathsJson);
            }
        }
        else {
            console.warn('🧠 screenshot_path is null/undefined, checking for alternative fields...');
            // Check for alternative field names
            const data = textResponse.data.data;
            if (data.screenshotPaths) {
                console.log('🧠 Found screenshotPaths field (camelCase)');
                screenshotPaths = Array.isArray(data.screenshotPaths) ? data.screenshotPaths : JSON.parse(data.screenshotPaths);
            }
            else if (data.screenshot_paths) {
                console.log('🧠 Found screenshot_paths field (snake_case plural)');
                screenshotPaths = Array.isArray(data.screenshot_paths) ? data.screenshot_paths : JSON.parse(data.screenshot_paths);
            }
        }
        console.log('🧠 Extracted text length:', extractedText.length);
        console.log('🧠 Screenshot paths:', screenshotPaths);
        // Perform vision analysis
        const analysis = await analyzeResumeWithVision(screenshotPaths, extractedText);
        res.json({
            success: true,
            data: analysis
        });
    }
    catch (error) {
        console.error('Error analyzing resume with vision:', error);
        if (error.code === 'ECONNABORTED') {
            return res.status(500).json({
                error: 'Resume analysis failed',
                details: 'timeout of 60000ms exceeded'
            });
        }
        res.status(500).json({
            error: 'Failed to analyze resume',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// OLD COVER LETTER ENDPOINT - DISABLED
// Use the new dedicated cover letter service at /api/cover-letter/generate-cover-letter instead
// router.post('/generate-cover-letter', async (req, res) => {
//   try {
//     const payload: CoverLetterRequest = req.body;
//     if (!payload?.resumeText || !payload?.jobDescription) {
//       return res
//         .status(400)
//         .json({ error: 'resumeText and jobDescription are required' });
//     }
//     const coverLetter = await generateCoverLetter(payload);
//     res.json({ coverLetter });
//   } catch (error) {
//     console.error('Error generating cover letter', error);
//     res.status(500).json({ error: 'Failed to generate cover letter' });
//   }
// });
router.post('/match-jobs', async (req, res) => {
    try {
        const payload = req.body;
        if (!payload?.resumeText || !payload?.jobDescription) {
            return res
                .status(400)
                .json({ error: 'resumeText and jobDescription are required' });
        }
        const result = await (0, ollamaService_1.matchJobs)(payload);
        res.json(result);
    }
    catch (error) {
        console.error('Error matching jobs', error);
        res.status(500).json({ error: 'Failed to match jobs' });
    }
});
router.post('/chat', async (req, res) => {
    try {
        const payload = req.body;
        if (!payload?.message) {
            return res.status(400).json({ error: 'message is required' });
        }
        const response = await (0, ollamaService_1.chat)(payload);
        res.json(response);
    }
    catch (error) {
        console.error('Error chatting', error);
        res.status(500).json({ error: 'Failed to process chat request' });
    }
});
// AI Analysis Routes for Resume Processing
router.post('/analyze-aesthetic-score', async (req, res) => {
    try {
        const payload = req.body;
        if (!payload?.resumeText || !payload?.resumeContent) {
            return res.status(400).json({ error: 'resumeText and resumeContent are required' });
        }
        const result = await (0, ollamaService_1.analyzeAestheticScore)(payload);
        res.json(result);
    }
    catch (error) {
        console.error('Error analyzing aesthetic score', error);
        res.status(500).json({ error: 'Failed to analyze aesthetic score' });
    }
});
router.post('/analyze-skills', async (req, res) => {
    try {
        const payload = req.body;
        if (!payload?.resumeText) {
            return res.status(400).json({ error: 'resumeText is required' });
        }
        const result = await (0, ollamaService_1.analyzeSkills)(payload);
        res.json(result);
    }
    catch (error) {
        console.error('Error analyzing skills', error);
        res.status(500).json({ error: 'Failed to analyze skills' });
    }
});
router.post('/generate-recommendations', async (req, res) => {
    try {
        const payload = req.body;
        if (!payload?.resumeText) {
            return res.status(400).json({ error: 'resumeText is required' });
        }
        const result = await (0, ollamaService_1.generateRecommendations)(payload);
        res.json(result);
    }
    catch (error) {
        console.error('Error generating recommendations', error);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
});
// Unified streaming endpoint for cover letter generation
router.post('/ollama/generate', async (req, res) => {
    try {
        const { model, prompt, stream } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'prompt is required' });
        }
        // Set headers for streaming
        if (stream) {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Transfer-Encoding', 'chunked');
        }
        // Import the callModel function from ollamaService
        // callModel is now imported directly at the top of the file
        if (stream) {
            // For streaming, we'll implement a simple chunked response
            // Note: This is a basic implementation - you might want to enhance this based on your streaming needs
            const response = await (0, ollamaService_1.callModel)(prompt);
            // Send the response in chunks
            const chunkSize = 100;
            for (let i = 0; i < response.length; i += chunkSize) {
                const chunk = response.slice(i, i + chunkSize);
                res.write(chunk);
                // Small delay to simulate streaming
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            res.end();
        }
        else {
            // Non-streaming response
            const response = await (0, ollamaService_1.callModel)(prompt);
            res.json({ response });
        }
    }
    catch (error) {
        console.error('Error in Ollama generate endpoint', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});
exports.default = router;
