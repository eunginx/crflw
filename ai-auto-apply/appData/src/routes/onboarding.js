import express from 'express';
import User from '../models/User.js';
import OnboardingProgress from '../models/OnboardingProgress.js';
const router = express.Router();

// Get onboarding progress
router.get('/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    
    const user = await User.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const progress = await OnboardingProgress.findByUserId(user.id);
    
    res.json(progress);
  } catch (error) {
    console.error('Error getting onboarding progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update onboarding progress
router.put('/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const progressData = req.body;
    
    const user = await User.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const progress = await OnboardingProgress.createOrUpdate(user.id, progressData);
    
    res.json(progress);
  } catch (error) {
    console.error('Error updating onboarding progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update onboarding step
router.put('/:firebaseUid/step', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { step } = req.body;
    
    const user = await User.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const progress = await OnboardingProgress.updateStep(user.id, step);
    
    res.json(progress);
  } catch (error) {
    console.error('Error updating onboarding step:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete onboarding
router.post('/:firebaseUid/complete', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    
    const user = await User.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const progress = await OnboardingProgress.markComplete(user.id);
    
    res.json(progress);
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
