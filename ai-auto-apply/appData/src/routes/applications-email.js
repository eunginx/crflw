// Email-based Job Applications API Routes
const express = require('express');
const UserEmail = require('../models/UserEmail');
const JobApplicationEmail = require('../models/JobApplicationEmail');
const router = express.Router();

// Get all applications for a user by email
router.get('/applications/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Ensure user exists
    const user = await UserEmail.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found for this email' });
    }
    
    const applications = await JobApplicationEmail.findByEmail(email);
    res.json(applications);
  } catch (error) {
    console.error('Error getting applications by email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get applications by status for a user by email
router.get('/applications/:email/status/:status', async (req, res) => {
  try {
    const { email, status } = req.params;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate status
    const validStatuses = ['saved', 'applied', 'interview', 'offer', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Ensure user exists
    const user = await UserEmail.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found for this email' });
    }
    
    const applications = await JobApplicationEmail.findByEmailAndStatus(email, status);
    res.json(applications);
  } catch (error) {
    console.error('Error getting applications by status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get application statistics for a user by email
router.get('/applications/:email/stats', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Ensure user exists
    const user = await UserEmail.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found for this email' });
    }
    
    const stats = await JobApplicationEmail.getStatsByEmail(email);
    res.json(stats);
  } catch (error) {
    console.error('Error getting application stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get application by ID for a user by email
router.get('/applications/:email/:id', async (req, res) => {
  try {
    const { email, id } = req.params;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid application ID' });
    }
    
    const application = await JobApplicationEmail.findByIdAndEmail(id, email);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Error getting application by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new application by email
router.post('/applications/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const applicationData = req.body;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate required fields
    const { title, company } = applicationData;
    if (!title || !company) {
      return res.status(400).json({ error: 'Title and company are required' });
    }
    
    // Ensure user exists
    let user = await UserEmail.findByEmail(email);
    if (!user) {
      // Create user if doesn't exist
      user = await UserEmail.createOrUpdate(email, { email_verified: false });
    }
    
    const application = await JobApplicationEmail.create(email, applicationData);
    res.status(201).json(application);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update application by ID and email
router.put('/applications/:email/:id', async (req, res) => {
  try {
    const { email, id } = req.params;
    const updateData = req.body;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid application ID' });
    }
    
    const application = await JobApplicationEmail.update(id, email, updateData);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update application status
router.patch('/applications/:email/:id/status', async (req, res) => {
  try {
    const { email, id } = req.params;
    const { status } = req.body;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate status
    const validStatuses = ['saved', 'applied', 'interview', 'offer', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const application = await JobApplicationEmail.updateStatus(id, email, status);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete application by ID and email
router.delete('/applications/:email/:id', async (req, res) => {
  try {
    const { email, id } = req.params;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid application ID' });
    }
    
    const deleted = await JobApplicationEmail.delete(id, email);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search applications for a user by email
router.get('/applications/:email/search', async (req, res) => {
  try {
    const { email } = req.params;
    const { q: searchTerm } = req.query;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }
    
    // Ensure user exists
    const user = await UserEmail.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found for this email' });
    }
    
    const applications = await JobApplicationEmail.searchByEmail(email, searchTerm);
    res.json(applications);
  } catch (error) {
    console.error('Error searching applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent applications for a user by email
router.get('/applications/:email/recent', async (req, res) => {
  try {
    const { email } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Ensure user exists
    const user = await UserEmail.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found for this email' });
    }
    
    const applications = await JobApplicationEmail.getRecentByEmail(email, limit);
    res.json(applications);
  } catch (error) {
    console.error('Error getting recent applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get applications by company for a user by email
router.get('/applications/:email/company/:company', async (req, res) => {
  try {
    const { email, company } = req.params;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Ensure user exists
    const user = await UserEmail.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found for this email' });
    }
    
    const applications = await JobApplicationEmail.findByEmailAndCompany(email, company);
    res.json(applications);
  } catch (error) {
    console.error('Error getting applications by company:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
