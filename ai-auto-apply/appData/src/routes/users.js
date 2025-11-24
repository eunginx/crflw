import express from 'express';
import User from '../models/User.js';
const router = express.Router();

// Get or create user from Firebase UID
router.post('/', async (req, res) => {
  try {
    const { firebaseUid, email } = req.body;
    
    if (!firebaseUid || !email) {
      return res.status(400).json({ error: 'Firebase UID and email are required' });
    }

    let user = await User.findByFirebaseUid(firebaseUid);
    
    if (!user) {
      user = await User.create(firebaseUid, email);
    }

    res.json(user);
  } catch (error) {
    console.error('Error in user route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update email verification status
router.put('/email-verified', async (req, res) => {
  try {
    const { firebaseUid, verified } = req.body;
    
    if (!firebaseUid || typeof verified !== 'boolean') {
      return res.status(400).json({ error: 'Firebase UID and verified status are required' });
    }

    const user = await User.updateEmailVerified(firebaseUid, verified);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating email verification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
