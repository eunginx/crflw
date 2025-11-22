const express = require('express');
const User = require('../models/User');
const JobApplication = require('../models/JobApplication');
const router = express.Router();

// Get all job applications for a user
router.get('/applications/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    
    const user = await User.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const applications = await JobApplication.findByUserId(user.id);
    
    res.json(applications);
  } catch (error) {
    console.error('Error getting job applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new job application
router.post('/applications/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const applicationData = req.body;
    
    const user = await User.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const application = await JobApplication.create(user.id, applicationData);
    
    res.status(201).json(application);
  } catch (error) {
    console.error('Error creating job application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update job application
router.put('/applications/:firebaseUid/:applicationId', async (req, res) => {
  try {
    const { firebaseUid, applicationId } = req.params;
    const updates = req.body;
    
    const user = await User.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const application = await JobApplication.update(applicationId, updates);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Error updating job application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete job application
router.delete('/applications/:firebaseUid/:applicationId', async (req, res) => {
  try {
    const { firebaseUid, applicationId } = req.params;
    
    const user = await User.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const application = await JobApplication.delete(applicationId);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting job application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get applications by status
router.get('/applications/:firebaseUid/status/:status', async (req, res) => {
  try {
    const { firebaseUid, status } = req.params;
    
    const user = await User.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const applications = await JobApplication.findByStatus(user.id, status);
    
    res.json(applications);
  } catch (error) {
    console.error('Error getting applications by status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
