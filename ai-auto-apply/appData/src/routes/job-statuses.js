import express from 'express';
const router = express.Router();
import JobStatusType from '../models/JobStatusType.js';

// GET /api/job-statuses - Get all job statuses
router.get('/', async (req, res) => {
  try {
    const { includeHidden = 'false', category, groupLabel } = req.query;
    
    const options = {
      includeHidden: includeHidden === 'true',
      category: category || null,
      groupLabel: groupLabel || null
    };
    
    const statuses = await JobStatusType.findAll(options);
    res.json(statuses);
  } catch (error) {
    console.error('Error fetching job statuses:', error);
    res.status(500).json({ error: 'Failed to fetch job statuses' });
  }
});

// GET /api/job-statuses/enhanced - Get enhanced statuses with computed fields
router.get('/enhanced', async (req, res) => {
  try {
    const { includeHidden = 'false' } = req.query;
    
    const options = {
      includeHidden: includeHidden === 'true'
    };
    
    const statuses = await JobStatusType.getEnhancedStatuses(options);
    res.json(statuses);
  } catch (error) {
    console.error('Error fetching enhanced job statuses:', error);
    res.status(500).json({ error: 'Failed to fetch enhanced job statuses' });
  }
});

// GET /api/job-statuses/groups - Get statuses grouped by category
router.get('/groups', async (req, res) => {
  try {
    const groups = await JobStatusType.getStatusesByGroup();
    res.json(groups);
  } catch (error) {
    console.error('Error fetching job status groups:', error);
    res.status(500).json({ error: 'Failed to fetch job status groups' });
  }
});

// GET /api/job-statuses/analytics - Get analytics data
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await JobStatusType.getAnalyticsData();
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// GET /api/job-statuses/:key - Get specific status by key
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const status = await JobStatusType.findByKey(key);
    
    if (!status) {
      return res.status(404).json({ error: 'Job status not found' });
    }
    
    res.json(status);
  } catch (error) {
    console.error('Error fetching job status:', error);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
});

// POST /api/job-statuses - Create new job status (admin only)
router.post('/', async (req, res) => {
  try {
    const statusData = req.body;
    
    // Validate required fields
    if (!statusData.key || !statusData.label || !statusData.icon || !statusData.color) {
      return res.status(400).json({ 
        error: 'Missing required fields: key, label, icon, color' 
      });
    }
    
    const newStatus = await JobStatusType.create(statusData);
    res.status(201).json(newStatus);
  } catch (error) {
    console.error('Error creating job status:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      res.status(409).json({ error: 'Job status with this key already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create job status' });
    }
  }
});

// PUT /api/job-statuses/:id - Update job status (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedStatus = await JobStatusType.update(id, updates);
    
    if (!updatedStatus) {
      return res.status(404).json({ error: 'Job status not found' });
    }
    
    res.json(updatedStatus);
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ error: 'Failed to update job status' });
  }
});

// DELETE /api/job-statuses/:id - Delete job status (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedStatus = await JobStatusType.delete(id);
    
    if (!deletedStatus) {
      return res.status(404).json({ error: 'Job status not found' });
    }
    
    res.json({ message: 'Job status deleted successfully', status: deletedStatus });
  } catch (error) {
    console.error('Error deleting job status:', error);
    res.status(500).json({ error: 'Failed to delete job status' });
  }
});

export default router;
