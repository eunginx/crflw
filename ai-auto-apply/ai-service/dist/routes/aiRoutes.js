"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ollamaService_1 = require("../services/ollamaService");
const router = (0, express_1.Router)();
router.post('/analyze-resume', async (req, res) => {
    try {
        const payload = req.body;
        if (!payload?.resumeText) {
            return res.status(400).json({ error: 'resumeText is required' });
        }
        const analysis = await (0, ollamaService_1.analyzeResume)(payload);
        res.json(analysis);
    }
    catch (error) {
        console.error('Error analyzing resume', error);
        res.status(500).json({ error: 'Failed to analyze resume' });
    }
});
router.post('/generate-cover-letter', async (req, res) => {
    try {
        const payload = req.body;
        if (!payload?.resumeText || !payload?.jobDescription) {
            return res
                .status(400)
                .json({ error: 'resumeText and jobDescription are required' });
        }
        const coverLetter = await (0, ollamaService_1.generateCoverLetter)(payload);
        res.json({ coverLetter });
    }
    catch (error) {
        console.error('Error generating cover letter', error);
        res.status(500).json({ error: 'Failed to generate cover letter' });
    }
});
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
exports.default = router;
