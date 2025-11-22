const express = require('express');
const User = require('../models/User');
const UserPreferences = require('../models/UserPreferences');
const router = express.Router();

// Get user preferences
router.get('/preferences/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    
    const user = await User.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const preferences = await UserPreferences.findByUserId(user.id);
    
    res.json(preferences);
  } catch (error) {
    console.error('Error getting user preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user preferences
router.put('/preferences/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const preferencesData = req.body;
    
    const user = await User.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const preferences = await UserPreferences.createOrUpdate(user.id, preferencesData);
    
    res.json(preferences);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
