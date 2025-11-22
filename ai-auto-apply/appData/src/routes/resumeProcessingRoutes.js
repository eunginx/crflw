const express = require('express');
const router = express.Router();
const {
  storeProcessedResume,
  getProcessedResume,
  getUserProcessedResumes,
  getSkillsStatistics,
  deleteProcessedResume,
  getResumeProcessingSummary
} = require('./resumeProcessing');

// Store processed resume data
router.post('/resumes/:resumeId/process', async (req, res) => {
  await storeProcessedResume(req, res);
});

// Get processed resume data
router.get('/resumes/:resumeId/processed', async (req, res) => {
  await getProcessedResume(req, res);
});

// Get all processed resumes for a user
router.get('/users/:email/processed-resumes', async (req, res) => {
  await getUserProcessedResumes(req, res);
});

// Get skills statistics
router.get('/skills/statistics', async (req, res) => {
  await getSkillsStatistics(req, res);
});

// Delete processed resume data
router.delete('/resumes/:resumeId/processed', async (req, res) => {
  await deleteProcessedResume(req, res);
});

// Get resume processing summary
router.get('/processing/summary', async (req, res) => {
  await getResumeProcessingSummary(req, res);
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    service: 'Resume Processing Service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
