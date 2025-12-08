import { Router } from 'express';
import {
  analyzeResume,
  chat,
  generateCoverLetter,
  matchJobs,
  analyzeAestheticScore,
  analyzeSkills,
  generateRecommendations,
  callModel,
} from '../services/ollamaService';
import {
  ChatRequest,
  CoverLetterRequest,
  JobMatchRequest,
  ResumeAnalysisRequest,
  AestheticScoreRequest,
  SkillsAnalysisRequest,
  AIRecommendationsRequest,
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

// AI Analysis Routes for Resume Processing

router.post('/analyze-aesthetic-score', async (req, res) => {
  try {
    const payload: AestheticScoreRequest = req.body;
    if (!payload?.resumeText || !payload?.resumeContent) {
      return res.status(400).json({ error: 'resumeText and resumeContent are required' });
    }

    const result = await analyzeAestheticScore(payload);
    res.json(result);
  } catch (error) {
    console.error('Error analyzing aesthetic score', error);
    res.status(500).json({ error: 'Failed to analyze aesthetic score' });
  }
});

router.post('/analyze-skills', async (req, res) => {
  try {
    const payload: SkillsAnalysisRequest = req.body;
    if (!payload?.resumeText) {
      return res.status(400).json({ error: 'resumeText is required' });
    }

    const result = await analyzeSkills(payload);
    res.json(result);
  } catch (error) {
    console.error('Error analyzing skills', error);
    res.status(500).json({ error: 'Failed to analyze skills' });
  }
});

router.post('/generate-recommendations', async (req, res) => {
  try {
    const payload: AIRecommendationsRequest = req.body;
    if (!payload?.resumeText) {
      return res.status(400).json({ error: 'resumeText is required' });
    }

    const result = await generateRecommendations(payload);
    res.json(result);
  } catch (error) {
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
      const response = await callModel(prompt);
      
      // Send the response in chunks
      const chunkSize = 100;
      for (let i = 0; i < response.length; i += chunkSize) {
        const chunk = response.slice(i, i + chunkSize);
        res.write(chunk);
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      res.end();
    } else {
      // Non-streaming response
      const response = await callModel(prompt);
      res.json({ response });
    }
  } catch (error) {
    console.error('Error in Ollama generate endpoint', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

export default router;
