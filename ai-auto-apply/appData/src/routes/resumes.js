const express = require('express');
const User = require('../models/User');
const ResumeFile = require('../models/ResumeFile');
const router = express.Router();

// Get all resume files for a user
router.get('/resumes/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    
    const user = await User.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resumes = await ResumeFile.findByUserId(user.id);
    
    res.json(resumes);
  } catch (error) {
    console.error('Error getting resume files:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active resume for a user
router.get('/resumes/:firebaseUid/active', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    
    const user = await User.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resume = await ResumeFile.getActiveResume(user.id);
    
    res.json(resume);
  } catch (error) {
    console.error('Error getting active resume:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload new resume file
router.post('/resumes/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const fileData = req.body;
    
    const user = await User.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resume = await ResumeFile.create(user.id, fileData);
    
    res.status(201).json(resume);
  } catch (error) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deactivate resume file
router.delete('/resumes/:firebaseUid/:resumeId', async (req, res) => {
  try {
    const { firebaseUid, resumeId } = req.params;
    
    const user = await User.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resume = await ResumeFile.deactivate(resumeId);
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    res.json({ message: 'Resume deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating resume:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
