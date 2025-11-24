import express from 'express';
import User from '../models/User.js';
import UserProfile from '../models/UserProfile.js';
const router = express.Router();

// Get user profile
router.get('/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    
    const user = await User.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = await UserProfile.findByUserId(user.id);
    
    res.json({
      user,
      profile
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const profileData = req.body;
    
    const user = await User.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = await UserProfile.createOrUpdate(user.id, profileData);
    
    res.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update resume status
router.put('/:firebaseUid/resume', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { uploaded, filename, path } = req.body;
    
    const user = await User.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = await UserProfile.updateResumeStatus(user.id, uploaded, filename, path);
    
    res.json(profile);
  } catch (error) {
    console.error('Error updating resume status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
