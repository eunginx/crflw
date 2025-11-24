import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';
import userResumeStateService from '../services/userResumeStateService.js';

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
    const { userEmail, userId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Use email as primary identifier, fall back to userId for backward compatibility
    const primaryIdentifier = userEmail || userId;
    if (!primaryIdentifier) {
      return res.status(400).json({ error: 'User email or ID is required' });
    }

    // Check resume limit (max 3 resumes per user) - only count active resumes
    const resumeCount = await client.query(
      'SELECT COUNT(*) FROM documents WHERE user_email = $1 AND is_active = true AND document_type = \'resume\'',
      [userEmail]
    );

    if (parseInt(resumeCount.rows[0].count) >= 3) {
      return res.status(400).json({ 
        error: 'Maximum resume limit reached',
        details: 'You can only have a maximum of 3 resumes. Please delete an existing resume before uploading a new one.'
      });
    }

    await client.query('BEGIN');

    // Insert resume record into database (start as inactive)
    const resumeResult = await client.query(
      `INSERT INTO documents 
       (user_id, user_email, stored_filename, original_filename, file_path, file_size_bytes, mime_type, file_type, document_type, uploaded_at, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'resume', 'resume', CURRENT_TIMESTAMP, false) 
       RETURNING *`,
      [
        primaryIdentifier, // Store as user_id for backward compatibility
        userEmail, // Store email for primary identification
        file.filename,
        file.originalname,
        file.path,
        file.size,
        file.mimetype
      ]
    );

    const resume = resumeResult.rows[0];

    // Check if user has any existing active resumes
    const existingActiveResumes = await client.query(
      'SELECT COUNT(*) FROM documents WHERE user_email = $1 AND is_active = true AND document_type = \'resume\'',
      [userEmail]
    );

    // If no active resumes exist, set this one as active
    // Otherwise, keep it inactive (user must manually activate)
    if (parseInt(existingActiveResumes.rows[0].count) === 0) {
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
        uploadDate: resume.uploaded_at,
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

// Get all resumes for a user (including inactive if requested)
router.get('/resumes/users/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;
    const { include_inactive } = req.query;

    const result = await pool.query(
      `SELECT 
        d.id, d.stored_filename as filename, d.original_filename, d.file_size_bytes::integer as file_size, d.mime_type, 
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
       WHERE d.user_email = $1 AND d.document_type = 'resume' ${include_inactive === 'true' ? '' : 'AND d.is_active = true'}
       ORDER BY d.uploaded_at DESC`,
      [userEmail]
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
router.get('/resumes/users/:userEmail/active', async (req, res) => {
  try {
    const { userEmail } = req.params;

    const result = await pool.query(
      `SELECT 
        d.id, d.stored_filename as filename, d.original_filename, d.file_size_bytes::integer as file_size, d.mime_type, 
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
       WHERE d.user_email = $1 AND d.is_active = true AND d.document_type = 'resume'
       ORDER BY d.uploaded_at DESC 
       LIMIT 1`,
      [userEmail]
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
    const { userEmail, userId } = req.body;

    // Use email as primary identifier, fall back to userId for backward compatibility
    const primaryIdentifier = userEmail || userId;
    if (!primaryIdentifier) {
      return res.status(400).json({ error: 'User email or ID is required' });
    }

    await client.query('BEGIN');

    // Verify resume belongs to user and is active
    const resumeCheck = await client.query(
      'SELECT id FROM documents WHERE id = $1 AND user_email = $2 AND document_type = \'resume\'',
      [resumeId, userEmail]
    );

    if (resumeCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Deactivate all other resumes for this user (email-based)
    await client.query(
      `UPDATE documents SET is_active = false 
       WHERE user_email = $1 AND id != $2 AND document_type = 'resume'`,
      [userEmail, resumeId]
    );

    // Activate the selected resume
    await client.query(
      `UPDATE documents SET is_active = true, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_email = $2`,
      [resumeId, userEmail]
    );

    // Clear persistent state to force reprocessing with new active resume
    try {
      await userResumeStateService.clearUserResumeState(primaryIdentifier);
    } catch (stateError) {
      console.error('Error clearing persistent state:', stateError);
      // Don't fail the request, just log the error
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Resume set as active. AI analysis will be performed on this resume.'
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

    // Get resume details and validate it's active
    const resumeResult = await pool.query(
      'SELECT * FROM documents WHERE id = $1 AND document_type = \'resume\' AND is_active = true',
      [resumeId]
    );

    if (resumeResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Resume not found or not active',
        details: 'Only active resumes can be processed. Please set a resume as active first.'
      });
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

// Get resume processing results (only for active resumes)
router.get('/resumes/:resumeId/results', async (req, res) => {
  try {
    const { resumeId } = req.params;

    // Verify resume exists and is active
    const resumeCheck = await pool.query(
      'SELECT id FROM documents WHERE id = $1 AND document_type = \'resume\' AND is_active = true',
      [resumeId]
    );

    if (resumeCheck.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Resume not found or not active',
        details: 'Only active resumes can be accessed. Please set a resume as active first.'
      });
    }

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

    // Get user email to update persistent state
    const documentResult = await pool.query(
      'SELECT user_email FROM documents WHERE id = $1',
      [resumeId]
    );

    if (documentResult.rows.length > 0 && documentResult.rows[0].user_email) {
      // Update persistent state with processing results
      try {
        await userResumeStateService.updateUserResumeState(
          documentResult.rows[0].user_email,
          resumeId
        );
      } catch (stateError) {
        console.error('Error updating persistent state:', stateError);
        // Don't fail the request, just log the error
      }
    }

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
    const { userEmail, userId } = req.body;

    console.log('🗑️ Delete request received:', { resumeId, userEmail, userId });

    // Use email as primary identifier, fall back to userId for backward compatibility
    const primaryIdentifier = userEmail || userId;
    if (!primaryIdentifier) {
      return res.status(400).json({ error: 'User email or ID is required' });
    }

    await client.query('BEGIN');

    // Get resume details before deletion (for file cleanup)
    const resumeResult = await client.query(
      'SELECT * FROM documents WHERE id = $1 AND user_email = $2',
      [resumeId, userEmail]
    );

    console.log('🗑️ Resume query result:', { found: resumeResult.rows.length, rows: resumeResult.rows });

    if (resumeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Resume not found' });
    }

    const resume = resumeResult.rows[0];
    console.log('🗑️ Deleting resume:', { id: resume.id, filename: resume.original_filename });

    // Delete file from filesystem
    if (resume.file_path) {
      try {
        await fs.unlink(resume.file_path);
        console.log('🗑️ Deleted resume file:', resume.file_path);
      } catch (fileError) {
        console.warn('🗑️ Failed to delete resume file:', fileError);
        // Continue with database cleanup even if file deletion fails
      }
    }

    // Delete screenshot file if exists
    if (resume.screenshot_path) {
      try {
        await fs.unlink(resume.screenshot_path);
        console.log('🗑️ Deleted screenshot file:', resume.screenshot_path);
      } catch (fileError) {
        console.warn('🗑️ Failed to delete screenshot file:', fileError);
      }
    }

    console.log('🗑️ Starting database cleanup...');

    // Clean up all related data
    await client.query('DELETE FROM document_processing_queue WHERE document_id = $1', [resumeId]);
    console.log('🗑️ Deleted from document_processing_queue');
    
    await client.query('DELETE FROM document_processing_results WHERE document_id = $1', [resumeId]);
    console.log('🗑️ Deleted from document_processing_results');
    
    await client.query('DELETE FROM resume_analysis WHERE document_id = $1', [resumeId]);
    console.log('🗑️ Deleted from resume_analysis');
    
    // Hard delete the resume record
    const deleteResult = await client.query('DELETE FROM documents WHERE id = $1 AND user_email = $2', [resumeId, userEmail]);
    console.log('🗑️ Deleted from documents:', { rowCount: deleteResult.rowCount });

    // Clear persistent state if this was the active resume
    try {
      await userResumeStateService.clearUserResumeState(userEmail);
      console.log('🗑️ Cleared persistent state');
    } catch (stateError) {
      console.error('🗑️ Error clearing persistent state:', stateError);
      // Don't fail the request, just log the error
    }

    await client.query('COMMIT');
    console.log('🗑️ Delete transaction completed successfully');

    res.json({
      success: true,
      message: 'Resume and all associated data deleted successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('🗑️ Error deleting resume:', error);
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

// Get user's persistent resume processing state
router.get('/resumes/state/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;

    const state = await userResumeStateService.getUserResumeState(userEmail);
    
    res.json({
      success: true,
      data: state
    });

  } catch (error) {
    console.error('Error getting user resume state:', error);
    res.status(500).json({
      error: 'Failed to get user resume state',
      details: error.message
    });
  }
});

// Get processing results from persistent state
router.get('/resumes/results/persistent/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;

    const results = await userResumeStateService.getProcessingResults(userEmail);
    
    if (!results) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json(results);

  } catch (error) {
    console.error('Error getting persistent processing results:', error);
    res.status(500).json({
      error: 'Failed to get processing results',
      details: error.message
    });
  }
});

// Check if user needs to process resume
router.get('/resumes/needs-processing/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;

    const status = await userResumeStateService.needsProcessing(userEmail);
    
    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error checking processing status:', error);
    res.status(500).json({
      error: 'Failed to check processing status',
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
