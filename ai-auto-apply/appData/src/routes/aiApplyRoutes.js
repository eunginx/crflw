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

    console.log("🚀 [AI Apply] Starting resume processing");
    console.log("📋 [AI Apply] Resume ID:", resumeId);
    console.log("⚙️ [AI Apply] Processing options:", processingOptions);

    // Get resume details and validate it's active
    const resumeResult = await pool.query(
      'SELECT * FROM documents WHERE id = $1 AND document_type = \'resume\' AND is_active = true',
      [resumeId]
    );

    if (resumeResult.rows.length === 0) {
      console.error("❌ [AI Apply] Resume not found or not active");
      return res.status(404).json({ 
        error: 'Resume not found or not active',
        details: 'Only active resumes can be processed. Please set a resume as active first.'
      });
    }

    const resume = resumeResult.rows[0];
    console.log("✅ [AI Apply] Resume found:", {
      id: resume.id,
      filename: resume.original_filename,
      userEmail: resume.user_email
    });

    // Check if file exists using robust path resolution
    let actualFilePath = resume.file_path;
    
    // If the stored path is relative, make it absolute
    if (!path.isAbsolute(resume.file_path)) {
      actualFilePath = path.join(process.cwd(), 'appData', resume.file_path);
    }
    
    console.log("📁 [AI Apply] Path resolution:");
    console.log("   Original DB path:", resume.file_path);
    console.log("   Resolved absolute path:", actualFilePath);
    
    // Check if file exists
    try {
      await fs.access(actualFilePath);
      console.log("✅ [AI Apply] File exists and is accessible");
    } catch (fileError) {
      console.error("❌ [AI Apply] File access error:", fileError);
      
      // Try alternative path resolution
      const alternativePath = path.join(__dirname, '../../uploads/documents', path.basename(resume.file_path));
      console.log("🔄 [AI Apply] Trying alternative path:", alternativePath);
      
      try {
        await fs.access(alternativePath);
        console.log("✅ [AI Apply] File found at alternative path");
        actualFilePath = alternativePath;
      } catch (altError) {
        console.error("❌ [AI Apply] Alternative path also failed");
        return res.status(404).json({
          error: 'Document file not found on disk',
          details: fileError.message,
          originalPath: resume.file_path,
          attemptedPath: actualFilePath,
          alternativePath: alternativePath
        });
      }
    }

    // Process the PDF using pdf-parse v2.4.5
    console.log("📖 [AI Apply] Starting PDF parsing...");
    const { PDFParse } = await import('pdf-parse');
    
    // Read file buffer
    const fileBuffer = await fs.readFile(actualFilePath);
    console.log("📊 [AI Apply] File size:", fileBuffer.length, "bytes");
    
    // Create parser instance
    const parser = new PDFParse({ data: fileBuffer });
    
    // Extract text
    const textResult = await parser.getText();
    console.log("✅ [AI Apply] Text extraction completed");
    
    // Get metadata
    const infoResult = await parser.getInfo({ parsePageInfo: true });
    console.log("✅ [AI Apply] Metadata extraction completed");
    
    // Generate screenshots for all pages
    let screenshotPaths = [];
    try {
      console.log("🖼️ [AI Apply] Generating screenshots for all pages...");
      const screenshotResult = await parser.getScreenshot({ scale: 1.5 });
      
      if (screenshotResult.pages && screenshotResult.pages.length > 0) {
        // Create assets directory if it doesn't exist
        const assetsDir = path.join(__dirname, '../../assets/screenshots');
        await fs.mkdir(assetsDir, { recursive: true });
        
        // Generate unique filename base
        const timestamp = Date.now();
        const filenameBase = `resume_${path.basename(actualFilePath, '.pdf')}_${timestamp}`;
        
        // Save each page as a separate screenshot
        for (let i = 0; i < screenshotResult.pages.length; i++) {
          const screenshotBuffer = Buffer.from(screenshotResult.pages[i].data);
          const screenshotFilename = `${filenameBase}_page_${i + 1}.png`;
          const screenshotPath = path.join(assetsDir, screenshotFilename);
          
          await fs.writeFile(screenshotPath, screenshotBuffer);
          screenshotPaths.push(screenshotPath);
          
          console.log(`✅ [AI Apply] Screenshot saved for page ${i + 1}:`, screenshotPath);
        }
        
        console.log(`✅ [AI Apply] Generated ${screenshotPaths.length} screenshots`);
      }
    } catch (screenshotError) {
      console.warn("⚠️ [AI Apply] Screenshot generation failed:", screenshotError.message);
      // Continue without screenshots
    }
    
    // Clean up parser
    await parser.destroy();
    
    const extractedText = textResult.text;
    const numPages = infoResult.pages?.length || 0;
    const pdfInfo = infoResult.info || {};
    
    console.log("📊 [AI Apply] Processing results:", {
      textLength: extractedText.length,
      numPages: numPages,
      hasTitle: !!pdfInfo.Title,
      hasAuthor: !!pdfInfo.Author
    });

    // Store processing results in database
    console.log("💾 [AI Apply] Storing processing results...");
    await pool.query(
      `UPDATE documents 
       SET processing_status = 'completed', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [resumeId]
    );

    // Delete any existing results and insert new ones
    await pool.query(
      'DELETE FROM document_processing_results WHERE document_id = $1',
      [resumeId]
    );

    await pool.query(
      `INSERT INTO document_processing_results 
       (document_id, extracted_text, text_length, pdf_total_pages, pdf_title, pdf_author, pdf_creator, pdf_producer, screenshot_path, processed_at, word_count, line_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, $10, $11)`,
      [
        resumeId,
        extractedText,
        extractedText.length,
        numPages,
        pdfInfo.Title || null,
        pdfInfo.Author || null,
        pdfInfo.Creator || null,
        pdfInfo.Producer || null,
        JSON.stringify(screenshotPaths), // Store as JSON array of all screenshot paths
        extractedText.split(/\s+/).filter(word => word.length > 0).length, // word count
        extractedText.split('\n').filter(line => line.trim().length > 0).length // line count
      ]
    );

    console.log("✅ [AI Apply] Processing completed successfully");

    // Update persistent state for user
    try {
      console.log("🔄 [AI Apply] Updating persistent resume state for user:", resume.user_email);
      await userResumeStateService.updateUserResumeState(resume.user_email, resumeId);
      console.log("✅ [AI Apply] Persistent state updated successfully");
    } catch (stateError) {
      console.error("❌ [AI Apply] Error updating persistent state:", stateError);
      // Don't fail the request, just log the error
    }

    res.json({
      success: true,
      message: 'Resume processed successfully',
      resumeId,
      results: {
        textLength: extractedText.length,
        numPages,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [AI Apply] Error processing resume:', error);
    
    // Update document status to failed
    try {
      await pool.query(
        `UPDATE documents 
         SET processing_status = 'failed', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [req.params.resumeId]
      );
    } catch (updateError) {
      console.error('Failed to update document status:', updateError);
    }
    
    res.status(500).json({
      error: 'Failed to process resume',
      details: error.message,
      stack: error.stack
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

    // Transform to match frontend expectations (camelCase)
    const transformedResults = {
      extractedText: results.extracted_text,
      textLength: results.text_length,
      numPages: results.num_pages,
      pdfTitle: results.pdf_title,
      pdfAuthor: results.pdf_author,
      pdfCreator: results.pdf_creator,
      pdfProducer: results.pdf_producer,
      screenshotPaths: results.screenshot_path ? JSON.parse(results.screenshot_path) : [], // Parse JSON array
      processedAt: results.processed_at,
      wordCount: results.word_count,
      lineCount: results.line_count,
      processingStatus: results.processing_status // Convert to camelCase for frontend
    };

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
        ...transformedResults,
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

// Delete resume - always performs hard delete
router.delete('/resumes/:resumeId', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { resumeId } = req.params;
    const { userEmail, userId } = req.body;

    console.log('🗑️ HARD DELETE request received:', { resumeId, userEmail, userId });

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
    console.log('🔥 HARD DELETING resume:', { id: resume.id, filename: resume.original_filename });

    // ALWAYS perform hard delete - permanently remove all files
    console.log('🔥 HARD DELETE: Permanently removing all files and data');
    
    // Delete resume file from filesystem
    if (resume.file_path) {
      try {
        // Check if file exists before trying to delete
        await fs.access(resume.file_path);
        await fs.unlink(resume.file_path);
        console.log('🔥 HARD DELETED resume file:', resume.file_path);
      } catch (fileError) {
        if (fileError.code === 'ENOENT') {
          console.log('🔥 Resume file not found, skipping:', resume.file_path);
        } else {
          console.warn('🔥 Failed to hard delete resume file:', fileError);
        }
      }
    }

    // Delete screenshot file if exists
    if (resume.screenshot_path) {
      try {
        // Check if file exists before trying to delete
        await fs.access(resume.screenshot_path);
        await fs.unlink(resume.screenshot_path);
        console.log('🔥 HARD DELETED screenshot file:', resume.screenshot_path);
      } catch (fileError) {
        if (fileError.code === 'ENOENT') {
          console.log('🔥 Screenshot file not found, skipping:', resume.screenshot_path);
        } else {
          console.warn('🔥 Failed to hard delete screenshot file:', fileError);
        }
      }
    }

    // Delete all associated generated files (text files, additional screenshots, etc.)
    const possiblePaths = [
      `/Users/kapilh/crflw/ai-auto-apply/appData/assets/texts/resume_${resume.id}_extracted.txt`,
      `/Users/kapilh/crflw/ai-auto-apply/appData/assets/screenshots/resume_${resume.id}_page1.png`,
      `/Users/kapilh/crflw/ai-auto-apply/appData/uploads/documents/${resume.id}_*.png`,
      `/Users/kapilh/crflw/ai-auto-apply/appData/uploads/documents/text_${resume.id}.txt`
    ];

    for (const possiblePath of possiblePaths) {
      if (possiblePath) {
        try {
          // Handle wildcard paths using fs.readdir and filtering
          if (possiblePath.includes('*')) {
            const dir = possiblePath.substring(0, possiblePath.lastIndexOf('/'));
            const prefix = possiblePath.split('/').pop().replace('*', '');
            const files = await fs.readdir(dir);
            const matchingFiles = files.filter(file => file.startsWith(prefix));
            
            for (const file of matchingFiles) {
              const fullPath = path.join(dir, file);
              await fs.access(fullPath);
              await fs.unlink(fullPath);
              console.log('🔥 HARD DELETED glob-matched file:', fullPath);
            }
          } else {
            await fs.access(possiblePath);
            await fs.unlink(possiblePath);
            console.log('🔥 HARD DELETED related file:', possiblePath);
          }
        } catch (fileError) {
          if (fileError.code === 'ENOENT') {
            console.log('🔥 Related file not found, skipping:', possiblePath);
          } else {
            console.warn('🔥 Failed to delete related file:', fileError);
          }
        }
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
      console.log('🗑️ Attempting to clear persistent state...');
      // await userResumeStateService.clearUserResumeState(userEmail);
      console.log('🗑️ Skipping persistent state clearing temporarily to debug timeout');
    } catch (stateError) {
      console.error('🗑️ Error clearing persistent state:', stateError);
      console.log('🗑️ Continuing without clearing persistent state - this should not fail the delete operation');
      // Don't fail the request, just log the error and continue
    }

    console.log('🗑️ About to commit transaction...');
    await client.query('COMMIT');
    console.log('🗑️ Delete transaction completed successfully');

    res.json({
      success: true,
      message: 'Resume and all associated data permanently deleted from system (hard delete)',
      hardDelete: true
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
