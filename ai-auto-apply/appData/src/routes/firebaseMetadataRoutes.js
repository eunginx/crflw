import express from 'express';
const router = express.Router();
import {
  storeFirebaseFileMetadata,
  storeFirebaseProcessedResume,
  getUserFirebaseFiles,
  getActiveFirebaseResume,
  setActiveFirebaseResume,
  getProcessedFirebaseResume,
  softDeleteFirebaseFile,
  getFirebaseProcessingStatistics,
  getFirebaseResumeSummary
} from './firebaseMetadata.js';

// Store Firebase file metadata
router.post('/firebase/metadata', async (req, res) => {
  await storeFirebaseFileMetadata(req, res);
});

// Store processed Firebase resume data
router.post('/firebase/resumes/:metadataId/process', async (req, res) => {
  await storeFirebaseProcessedResume(req, res);
});

// Get all Firebase files for a user
router.get('/firebase/users/:userId/files', async (req, res) => {
  await getUserFirebaseFiles(req, res);
});

// Get active Firebase resume for a user
router.get('/firebase/users/:userId/active-resume', async (req, res) => {
  await getActiveFirebaseResume(req, res);
});

// Set active Firebase resume for a user
router.post('/firebase/users/:userId/active-resume', async (req, res) => {
  await setActiveFirebaseResume(req, res);
});

// Get processed Firebase resume data
router.get('/firebase/resumes/:metadataId/processed', async (req, res) => {
  await getProcessedFirebaseResume(req, res);
});

// Soft delete Firebase file metadata
router.delete('/firebase/metadata/:metadataId', async (req, res) => {
  await softDeleteFirebaseFile(req, res);
});

// Get Firebase processing statistics
router.get('/firebase/statistics', async (req, res) => {
  await getFirebaseProcessingStatistics(req, res);
});

// Get Firebase resume summary
router.get('/firebase/summary', async (req, res) => {
  await getFirebaseResumeSummary(req, res);
});

// Health check endpoint
router.get('/firebase/health', (req, res) => {
  res.json({ 
    service: 'Firebase Metadata Service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
