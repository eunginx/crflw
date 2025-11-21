import { Router } from 'express';
import {
  analyzeResume,
  chat,
  generateCoverLetter,
  matchJobs,
} from '../services/ollamaService';
import {
  ChatRequest,
  CoverLetterRequest,
  JobMatchRequest,
  ResumeAnalysisRequest,
} from '../types/ai';

const router = Router();

router.post('/analyze-resume', async (req, res) => {
  try {
    const payload: ResumeAnalysisRequest = req.body;
    if (!payload?.resumeText) {
      return res.status(400).json({ error: 'resumeText is required' });
    }

    const analysis = await analyzeResume(payload);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing resume', error);
    res.status(500).json({ error: 'Failed to analyze resume' });
  }
});

router.post('/generate-cover-letter', async (req, res) => {
  try {
    const payload: CoverLetterRequest = req.body;
    if (!payload?.resumeText || !payload?.jobDescription) {
      return res
        .status(400)
        .json({ error: 'resumeText and jobDescription are required' });
    }

    const coverLetter = await generateCoverLetter(payload);
    res.json({ coverLetter });
  } catch (error) {
    console.error('Error generating cover letter', error);
    res.status(500).json({ error: 'Failed to generate cover letter' });
  }
});

router.post('/match-jobs', async (req, res) => {
  try {
    const payload: JobMatchRequest = req.body;
    if (!payload?.resumeText || !payload?.jobDescription) {
      return res
        .status(400)
        .json({ error: 'resumeText and jobDescription are required' });
    }

    const result = await matchJobs(payload);
    res.json(result);
  } catch (error) {
    console.error('Error matching jobs', error);
    res.status(500).json({ error: 'Failed to match jobs' });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const payload: ChatRequest = req.body;
    if (!payload?.message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const response = await chat(payload);
    res.json(response);
  } catch (error) {
    console.error('Error chatting', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

export default router;
