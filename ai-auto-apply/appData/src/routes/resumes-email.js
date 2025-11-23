const express = require('express');
const multer = require('multer');
const { UserEmail } = require('../models/UserEmail');
const router = express.Router();

// Configure multer for file upload (in memory storage for database storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Get all resume files for a user by email
router.get('/email/resumes/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Validate email parameter
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const query = 'SELECT * FROM list_user_resumes($1)';
    const result = await UserEmail.query(query, [email]);
    
    // Format the response
    const resumes = result.rows.map(row => ({
      id: row.id,
      filename: row.filename,
      original_filename: row.original_filename,
      file_size: row.file_size,
      file_type: row.file_type,
      is_active: row.is_active,
      uploaded_at: row.upload_date,
      storage_type: row.storage_type
    }));
    
    res.json(resumes);
  } catch (error) {
    console.error('Error getting resume files:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active resume for a user by email
router.get('/email/resumes/:email/active', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Validate email parameter
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const query = 'SELECT * FROM get_active_resume_file($1)';
    const result = await UserEmail.query(query, [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active resume found' });
    }
    
    const resume = result.rows[0];
    
    // Return metadata without file data
    const response = {
      id: resume.id,
      filename: resume.filename,
      original_filename: resume.original_filename,
      file_size: resume.file_size,
      file_type: resume.file_type,
      uploaded_at: resume.upload_date
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error getting active resume:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download resume file by ID
router.get('/email/resumes/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    const query = 'SELECT * FROM get_resume_file_data($1)';
    const result = await UserEmail.query(query, [fileId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resume file not found' });
    }
    
    const file = result.rows[0];
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_filename}"`);
    res.setHeader('Content-Length', file.file_size);
    
    // Send the file data
    res.send(file.file_data);
  } catch (error) {
    console.error('Error downloading resume file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload new resume file (supports multipart/form-data)
router.post('/email/resumes/:email', upload.single('file'), async (req, res) => {
  try {
    const { email } = req.params;
    
    // Validate email parameter
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if user exists
    const userCheck = await UserEmail.findByEmail(email);
    if (!userCheck) {
      // Create user if not exists
      await UserEmail.create({ email });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${email.replace(/[@.]/g, '_')}_resume_${timestamp}.pdf`;
    
    // Store file in database using the function
    const query = 'SELECT * FROM store_resume_file($1, $2, $3, $4, $5, $6, $7)';
    const values = [
      email,
      filename,
      req.file.originalname,
      req.file.buffer,
      req.file.size,
      req.file.mimetype,
      true // is_active
    ];
    
    const result = await UserEmail.query(query, values);
    const newResume = result.rows[0];
    
    // Return response without file data
    const response = {
      id: newResume.id,
      filename: newResume.filename,
      original_filename: newResume.original_filename,
      file_size: newResume.file_size,
      file_type: newResume.file_type,
      is_active: newResume.is_active,
      uploaded_at: newResume.upload_date,
      storage_type: newResume.storage_type
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error uploading resume:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(409).json({ error: 'File with this name already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Set active resume
router.put('/email/resumes/:email/:fileId/active', async (req, res) => {
  try {
    const { email, fileId } = req.params;
    
    // Validate parameters
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    const query = 'SELECT set_active_resume($1, $2)';
    const result = await UserEmail.query(query, [email, fileId]);
    
    if (result.rows[0].set_active_resume === false) {
      return res.status(404).json({ error: 'Resume not found or does not belong to user' });
    }
    
    res.json({ message: 'Resume set as active successfully' });
  } catch (error) {
    console.error('Error setting active resume:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete resume file
router.delete('/email/resumes/:email/:fileId', async (req, res) => {
  try {
    const { email, fileId } = req.params;
    
    // Validate parameters
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    const query = 'SELECT delete_resume_file($1, $2)';
    const result = await UserEmail.query(query, [email, fileId]);
    
    if (result.rows[0].delete_resume_file === false) {
      return res.status(404).json({ error: 'Resume not found or does not belong to user' });
    }
    
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files uploaded.' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  if (error.message === 'Only PDF files are allowed') {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
});

module.exports = router;
