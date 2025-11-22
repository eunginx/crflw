const express = require('express');
const User = require('../models/User');
const UserSettings = require('../models/UserSettings');
const router = express.Router();

// Get user settings
router.get('/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    
    const user = await User.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const settings = await UserSettings.findByUserId(user.id);
    
    res.json(settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user settings
router.put('/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const settingsData = req.body;
    
    const user = await User.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const settings = await UserSettings.createOrUpdate(user.id, settingsData);
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Debug route to see all requests
router.use('*', (req, res, next) => {
  console.log('Settings router received:', req.method, req.originalUrl);
  next();
});

module.exports = router;
