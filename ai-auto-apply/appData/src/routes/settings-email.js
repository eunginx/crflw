// Email-based User Settings API Routes
const express = require('express');
const UserEmail = require('../models/UserEmail');
const UserSettingsEmail = require('../models/UserSettingsEmail');
const router = express.Router();

// Get user settings by email
router.get('/settings/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const settings = await UserSettingsEmail.findByEmail(email);
    
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found for this email' });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error getting settings by email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update user settings by email
router.put('/settings/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const settingsData = req.body;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Ensure user exists
    let user = await UserEmail.findByEmail(email);
    if (!user) {
      // Create user if doesn't exist
      user = await UserEmail.createOrUpdate(email, { email_verified: false });
    }
    
    const settings = await UserSettingsEmail.createOrUpdate(email, settingsData);
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings by email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update specific settings fields by email
router.patch('/settings/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const fields = req.body;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (!fields || Object.keys(fields).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const settings = await UserSettingsEmail.updateFields(email, fields);
    
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found for this email' });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error patching settings by email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete settings by email
router.delete('/settings/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const deleted = await UserSettingsEmail.deleteByEmail(email);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Settings not found for this email' });
    }
    
    res.json({ message: 'Settings deleted successfully' });
  } catch (error) {
    console.error('Error deleting settings by email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get settings analytics (admin endpoint)
router.get('/settings/analytics/salary', async (req, res) => {
  try {
    const stats = await UserSettingsEmail.getSalaryStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting salary analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get popular locations
router.get('/settings/analytics/locations', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const locations = await UserSettingsEmail.getPopularLocations(limit);
    res.json(locations);
  } catch (error) {
    console.error('Error getting popular locations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get popular keywords
router.get('/settings/analytics/keywords', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const keywords = await UserSettingsEmail.getPopularKeywords(limit);
    res.json(keywords);
  } catch (error) {
    console.error('Error getting popular keywords:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get users by specific setting
router.get('/settings/analytics/users/:setting/:value', async (req, res) => {
  try {
    const { setting, value } = req.params;
    const users = await UserSettingsEmail.getUsersBySetting(setting, value);
    res.json(users);
  } catch (error) {
    console.error('Error getting users by setting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
