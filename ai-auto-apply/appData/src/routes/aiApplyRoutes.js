import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/resumes');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `resume-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

const router = express.Router();

// Upload resume with database integration
router.post('/resumes/upload', upload.single('file'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { userId, userEmail } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Start transaction
    await client.query('BEGIN');

    // Insert resume record into database
    const resumeResult = await client.query(
      `INSERT INTO documents 
       (user_id, user_email, stored_filename, original_filename, file_path, file_size_bytes, mime_type, file_type, document_type, uploaded_at, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'resume', 'resume', CURRENT_TIMESTAMP, true) 
       RETURNING *`,
      [
        userId,
        userEmail || null,
        file.filename,
        file.originalname,
        file.path,
        file.size,
        file.mimetype
      ]
    );

    const resume = resumeResult.rows[0];

    // Set as active if it's the first resume
    const resumeCount = await client.query(
      'SELECT COUNT(*) FROM documents WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (parseInt(resumeCount.rows[0].count) === 1) {
      await client.query(
        'UPDATE documents SET is_active = true WHERE id = $1',
        [resume.id]
      );
    }

    // Queue for processing
    await client.query(
      `INSERT INTO document_processing_queue 
       (document_id, queue_status, priority, processing_options, created_at) 
       VALUES ($1, 'queued', 5, $2, CURRENT_TIMESTAMP)`,
      [
        resume.id,
        JSON.stringify({
          text: {},
          info: { parsePageInfo: true },
          screenshots: { scale: 1.5, first: 1 },
          images: { imageThreshold: 50 },
          tables: { format: 'json' }
        })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        resumeId: resume.id,
        filename: file.filename,
        originalFilename: file.originalname,
        size: file.size,
        uploadDate: resume.upload_date,
        processingStatus: 'pending'
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error uploading resume:', error);
    res.status(500).json({
      error: 'Failed to upload resume',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// Get all resumes for a user
router.get('/resumes/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT 
        d.id, d.stored_filename as filename, d.original_filename, d.file_size_bytes as file_size, d.mime_type, 
        d.uploaded_at as upload_date, d.is_active, d.updated_at,
        dpr.processed_at,
        CASE 
          WHEN dpr.processed_at IS NOT NULL THEN 'completed'
          WHEN EXISTS(SELECT 1 FROM document_processing_queue dpq WHERE dpq.document_id = d.id AND dpq.queue_status = 'processing') THEN 'processing'
          WHEN EXISTS(SELECT 1 FROM document_processing_queue dpq WHERE dpq.document_id = d.id AND dpq.queue_status = 'queued') THEN 'pending'
          ELSE 'pending'
        END as processing_status
       FROM documents d
       LEFT JOIN document_processing_results dpr ON d.id = dpr.document_id
       WHERE d.user_id = $1 AND d.is_active = true AND d.document_type = 'resume'
       ORDER BY d.uploaded_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error getting user resumes:', error);
    res.status(500).json({
      error: 'Failed to get resumes',
      details: error.message
    });
  }
});

// Get active resume for a user
router.get('/resumes/users/:userId/active', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT 
        d.id, d.stored_filename as filename, d.original_filename, d.file_size_bytes as file_size, d.mime_type, 
        d.uploaded_at as upload_date, d.is_active, d.updated_at,
        dpr.processed_at,
        CASE 
          WHEN dpr.processed_at IS NOT NULL THEN 'completed'
          WHEN EXISTS(SELECT 1 FROM document_processing_queue dpq WHERE dpq.document_id = d.id AND dpq.queue_status = 'processing') THEN 'processing'
          WHEN EXISTS(SELECT 1 FROM document_processing_queue dpq WHERE dpq.document_id = d.id AND dpq.queue_status = 'queued') THEN 'pending'
          ELSE 'pending'
        END as processing_status
       FROM documents d
       LEFT JOIN document_processing_results dpr ON d.id = dpr.document_id
       WHERE d.user_id = $1 AND d.is_active = true AND d.document_type = 'resume'
       ORDER BY d.uploaded_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No active resume found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error getting active resume:', error);
    res.status(500).json({
      error: 'Failed to get active resume',
      details: error.message
    });
  }
});

// Set active resume
router.post('/resumes/:resumeId/set-active', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { resumeId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await client.query('BEGIN');

    // Deactivate all other resumes for this user
    await client.query(
      'UPDATE documents SET is_active = false WHERE user_id = $1 AND id != $2',
      [userId, resumeId]
    );

    // Activate the selected resume
    await client.query(
      'UPDATE documents SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2',
      [resumeId, userId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Resume set as active'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting active resume:', error);
    res.status(500).json({
      error: 'Failed to set active resume',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// Process resume
router.post('/resumes/:resumeId/process', async (req, res) => {
  try {
    const { resumeId } = req.params;
    const processingOptions = req.body.processingOptions || {
      text: {},
      info: { parsePageInfo: true },
      screenshots: { scale: 1.5, first: 1 },
      images: { imageThreshold: 50 },
      tables: { format: 'json' }
    };

    // Get resume details
    const resumeResult = await pool.query(
      'SELECT * FROM documents WHERE id = $1',
      [resumeId]
    );

    if (resumeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const resume = resumeResult.rows[0];

    // Add to processing queue
    await pool.query(
      `INSERT INTO document_processing_queue 
       (document_id, queue_status, priority, processing_options, created_at) 
       VALUES ($1, 'queued', 5, $2, CURRENT_TIMESTAMP)`,
      [
        resumeId,
        JSON.stringify(processingOptions)
      ]
    );

    res.json({
      success: true,
      message: 'Resume queued for processing',
      resumeId
    });

  } catch (error) {
    console.error('Error processing resume:', error);
    res.status(500).json({
      error: 'Failed to process resume',
      details: error.message
    });
  }
});

// Get resume processing results
router.get('/resumes/:resumeId/results', async (req, res) => {
  try {
    const { resumeId } = req.params;

    // Get processing results
    const resultsResult = await pool.query(
      `SELECT 
        extracted_text, text_length, pdf_total_pages as num_pages,
        pdf_title, pdf_author, pdf_creator, pdf_producer,
        screenshot_path,
        processed_at,
        word_count, line_count,
        CASE 
          WHEN processed_at IS NOT NULL THEN 'completed'
          ELSE 'pending'
        END as processing_status
       FROM document_processing_results 
       WHERE document_id = $1`,
      [resumeId]
    );

    if (resultsResult.rows.length === 0) {
      return res.json({
        success: true,
        data: null
      });
    }

    const results = resultsResult.rows[0];

    // Get AI analysis if available
    const analysisResult = await pool.query(
      `SELECT 
        contact_info, sections_detected, skills,
        quality_score, recommendations
       FROM resume_analysis 
       WHERE document_id = $1`,
      [resumeId]
    );

    const analysis = analysisResult.rows[0] || null;

    res.json({
      success: true,
      data: {
        ...results,
        analysis
      }
    });

  } catch (error) {
    console.error('Error getting resume results:', error);
    res.status(500).json({
      error: 'Failed to get resume results',
      details: error.message
    });
  }
});

// Delete resume
router.delete('/resumes/:resumeId', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { resumeId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await client.query('BEGIN');

    // Soft delete resume
    await client.query(
      'UPDATE documents SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2',
      [resumeId, userId]
    );

    // Clean up processing results
    await client.query(
      'DELETE FROM document_processing_results WHERE document_id = $1',
      [resumeId]
    );

    await client.query(
      'DELETE FROM resume_analysis WHERE document_id = $1',
      [resumeId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting resume:', error);
    res.status(500).json({
      error: 'Failed to delete resume',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// Get AI Apply status
router.get('/status', async (req, res) => {
  try {
    // This could be stored in a settings table
    const status = {
      current: 'coming_soon',
      message: 'AI Apply features are under development',
      features: {
        upload: true,
        processing: true,
        analysis: true,
        autoApply: false
      },
      estimatedLaunch: 'Q1 2024'
    };

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({
      error: 'Failed to get status',
      details: error.message
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    service: 'AI Apply Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    features: {
      upload: true,
      processing: true,
      analysis: true,
      database: true
    }
  });
});

export default router;
