import { Router } from 'express';
import { generateCoverLetter } from '../services/coverLetterService';
import { CoverLetterRequest } from '../types/ai';

const router = Router();

// Dedicated cover letter generation endpoint
router.post('/generate-cover-letter', async (req, res) => {
  try {
    const payload: CoverLetterRequest = req.body;
    if (!payload?.resumeText || !payload?.jobDescription) {
      return res
        .status(400)
        .json({ error: 'resumeText and jobDescription are required' });
    }

    console.log('📝 Cover letter generation request received:', {
      hasResumeText: !!payload.resumeText,
      resumeTextLength: payload.resumeText.length,
      hasJobDescription: !!payload.jobDescription,
      jobDescriptionLength: payload.jobDescription.length,
      companyName: payload.companyName,
      roleTitle: payload.roleTitle
    });

    const coverLetter = await generateCoverLetter(payload);
    
    console.log('📝 Cover letter generated successfully:', {
      length: coverLetter.length,
      preview: coverLetter.substring(0, 100) + (coverLetter.length > 100 ? '...' : '')
    });
    
    // Return plain text directly, not wrapped in JSON
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(coverLetter);
    
  } catch (error) {
    console.error('📝 Error generating cover letter', error);
    res.status(500).json({ error: 'Failed to generate cover letter' });
  }
});

export default router;
