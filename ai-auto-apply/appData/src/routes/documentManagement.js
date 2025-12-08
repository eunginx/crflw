import multer from 'multer';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';
import userResumeStateService from '../services/userResumeStateService.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents');
    await fsPromises.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
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

// const pdfService = new PDFParseCLIService();
// const resumeProcessor = new ResumeProcessingService(); // Temporarily disabled

// Upload document
async function uploadDocument(req, res) {
  const client = await pool.connect();
  
  try {
    const { userId, userEmail, documentType = 'resume' } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Store document metadata
    const documentId = await client.query(
      'SELECT store_document($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) as document_id',
      [
        userId,
        userEmail,
        file.originalname,
        file.filename,
        file.path,
        file.size,
        file.mimetype,
        'application/pdf',
        documentType,
        'local',
        `/uploads/documents/${file.filename}`
      ]
    );

    // Add to processing queue
    await client.query(
      'SELECT queue_document_for_processing($1, $2, $3)',
      [
        documentId.rows[0].document_id,
        JSON.stringify(req.body.processingOptions || {}),
        req.body.priority || 5
      ]
    );

    res.json({
      success: true,
      documentId: documentId.rows[0].document_id,
      filename: file.filename,
      originalFilename: file.originalname,
      size: file.size,
      message: 'Document uploaded and queued for processing'
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      error: 'Failed to upload document',
      details: error.message
    });
  } finally {
    client.release();
  }
}

// Get user's documents
async function getUserDocuments(req, res) {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT d.*, dpr.processed_at, dpr.text_length, dpr.word_count, dpr.pdf_total_pages
       FROM documents d
       LEFT JOIN document_processing_results dpr ON d.id = dpr.document_id
       WHERE d.user_id = $1 
         AND d.deleted_at IS NULL
       ORDER BY d.uploaded_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error getting user documents:', error);
    res.status(500).json({
      error: 'Failed to get user documents',
      details: error.message
    });
  }
}

// Get active document for user
async function getActiveDocument(req, res) {
  const { userId } = req.params;

  try {
    // First try to get explicitly active document
    let result = await pool.query(
      `SELECT d.*, dpr.processed_at, dpr.text_length, dpr.word_count, dpr.pdf_total_pages
       FROM documents d
       LEFT JOIN document_processing_results dpr ON d.id = dpr.document_id
       WHERE d.user_id = $1 
         AND d.document_type = 'resume' 
         AND d.is_active = TRUE 
         AND d.deleted_at IS NULL
       LIMIT 1`,
      [userId]
    );

    // If no explicitly active document, get the most recent resume
    if (result.rows.length === 0) {
      result = await pool.query(
        `SELECT d.*, dpr.processed_at, dpr.text_length, dpr.word_count, dpr.pdf_total_pages
         FROM documents d
         LEFT JOIN document_processing_results dpr ON d.id = dpr.document_id
         WHERE d.user_id = $1 
           AND d.document_type = 'resume' 
           AND d.deleted_at IS NULL
         ORDER BY d.uploaded_at DESC
         LIMIT 1`,
        [userId]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No resume document found for this user',
        suggestion: 'Upload a resume document first'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error getting active document:', error);
    res.status(500).json({
      error: 'Failed to get active document',
      details: error.message
    });
  }
}

// Set active document for user
async function setActiveDocument(req, res) {
  const { userId } = req.params;
  const { documentId } = req.body;

  try {
    const result = await pool.query(
      'SELECT set_active_document($1, $2) as success',
      [userId, documentId]
    );

    const success = result.rows[0].success;

    if (!success) {
      return res.status(404).json({
        error: 'Failed to set active document - document not found or not owned by user'
      });
    }

    res.json({
      success: true,
      message: 'Active document set successfully'
    });

  } catch (error) {
    console.error('Error setting active document:', error);
    res.status(500).json({
      error: 'Failed to set active document',
      details: error.message
    });
  }
}

// Get document processing results
async function getDocumentProcessingResults(req, res) {
  const { documentId } = req.params;

  try {
    // Get document with user info
    const documentResult = await pool.query(
      'SELECT d.*, d.user_id FROM documents d WHERE d.id = $1',
      [documentId]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    const document = documentResult.rows[0];

    if (!document.user_id) {
      return res.status(400).json({
        error: 'Document not associated with a user'
      });
    }

    // Get actual processing results from database
    const processingResult = await pool.query(
      `SELECT dpr.*, d.original_filename
       FROM document_processing_results dpr
       JOIN documents d ON dpr.document_id = d.id
       WHERE dpr.document_id = $1`,
      [documentId]
    );

    if (processingResult.rows.length === 0) {
      return res.status(404).json({
        error: 'No processing results found for this document'
      });
    }

    const result = processingResult.rows[0];

    // Get AI analysis if available
    let analysisData = null;
    try {
      const analysisResult = await pool.query(
        'SELECT * FROM resume_analysis WHERE document_id = $1',
        [documentId]
      );
      
      if (analysisResult.rows.length > 0) {
        const analysis = analysisResult.rows[0];
        analysisData = {
          contactInfo: analysis.contact_info,
          sections: analysis.sections_detected,
          skills: analysis.skills,
          qualityScore: analysis.quality_score,
          recommendations: analysis.recommendations
        };
      }
    } catch (analysisError) {
      console.warn('Warning: Could not fetch AI analysis:', analysisError.message);
      // Continue without analysis data
    }

    // Format response to match expected frontend structure
    const responseData = {
      extractedText: result.extracted_text || '',
      textLength: result.text_length || 0,
      processedAt: result.processed_at,
      filename: result.original_filename || document.original_filename,
      pdfTotalPages: result.pdf_total_pages || 0,
      pdfTitle: result.pdf_title,
      pdfAuthor: result.pdf_author,
      pdfCreator: result.pdf_creator,
      pdfProducer: result.pdf_producer,
      screenshotPath: result.screenshot_path,
      textFilePath: null, // TODO: Implement text file export
      analysis: analysisData
    };

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error getting document processing results:', error);
    res.status(500).json({
      error: 'Failed to get document processing results',
      details: error.message
    });
  }
}

// Process document manually (trigger immediate processing)
async function processDocument(req, res) {
  const { documentId } = req.params;
  const processingOptions = req.body;

  console.log("🚀 [Process Document] Starting document processing");
  console.log("📋 [Process Document] Document ID:", documentId);
  console.log("⚙️ [Process Document] Processing options:", processingOptions);

  try {
    // Get document info with user details
    console.log("🔍 [Process Document] Fetching document from database...");
    const documentResult = await pool.query(
      'SELECT d.*, d.user_id FROM documents d WHERE d.id = $1',
      [documentId]
    );

    if (documentResult.rows.length === 0) {
      console.error("❌ [Process Document] Document not found in database");
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    const document = documentResult.rows[0];
    console.log("✅ [Process Document] Document found:", {
      id: document.id,
      filename: document.filename,
      originalName: document.original_filename,
      userId: document.user_id
    });

    if (!document.user_id) {
      console.error("❌ [Process Document] Document not associated with a user");
      return res.status(400).json({
        error: 'Document not associated with a user'
      });
    }

    // Check if file exists using robust path resolution
    let actualFilePath = document.file_path;
    
    // If the stored path is relative, make it absolute
    if (!path.isAbsolute(document.file_path)) {
      actualFilePath = path.join(process.cwd(), 'appData', document.file_path);
    }
    
    console.log("📁 [Process Document] Path resolution:");
    console.log("   Original DB path:", document.file_path);
    console.log("   Resolved absolute path:", actualFilePath);
    
    // Check if file exists
    try {
      await fsPromises.access(actualFilePath);
      console.log("✅ [Process Document] File exists and is accessible");
    } catch (fileError) {
      console.error("❌ [Process Document] File access error:", fileError);
      console.error("❌ [Process Document] Attempted path:", actualFilePath);
      
      // Try alternative path resolution
      const alternativePath = path.join(__dirname, '../../uploads/documents', path.basename(document.file_path));
      console.log("🔄 [Process Document] Trying alternative path:", alternativePath);
      
      try {
        await fsPromises.access(alternativePath);
        console.log("✅ [Process Document] File found at alternative path");
        actualFilePath = alternativePath;
      } catch (altError) {
        console.error("❌ [Process Document] Alternative path also failed");
        return res.status(404).json({
          error: 'Document file not found on disk',
          details: fileError.message,
          originalPath: document.file_path,
          attemptedPath: actualFilePath,
          alternativePath: alternativePath
        });
      }
    }
    
    // Use our new PDF parser service
    console.log("📖 [Process Document] Starting PDF parsing with new service...");
    const { parsePDF } = await import('../services/pdfParser.js');
    
    const pdfResult = await parsePDF(actualFilePath);
    console.log("✅ [Process Document] PDF parsing completed successfully");
    console.log("📊 [Process Document] Parsing results:", {
      pages: pdfResult.num_pages,
      textLength: pdfResult.text_length,
      hasTitle: !!pdfResult.pdf_title,
      hasAuthor: !!pdfResult.pdf_author
    });
    
    // Skip screenshot generation for now (our new parser doesn't support it yet)
    let screenshotPath = null;
    console.log("⚠️ [Process Document] Screenshot generation skipped (not implemented in v1.x parser)");
    
    // Store processing results in database
    console.log("💾 [Process Document] Updating document status in database...");
    await pool.query(
      `UPDATE documents 
       SET processing_status = 'completed', 
           processed_at = NOW()
       WHERE id = $1`,
      [documentId]
    );
    console.log("✅ [Process Document] Document status updated to 'completed'");
    
    // Extract PDF metadata from our new parser structure
    const pdfTitle = pdfResult.pdf_title || null;
    const pdfAuthor = pdfResult.pdf_author || null;
    const pdfCreator = pdfResult.pdf_creator || null;
    const pdfProducer = pdfResult.pdf_producer || null;
    
    console.log('📋 [Process Document] PDF Metadata extracted:', {
      title: pdfTitle,
      author: pdfAuthor,
      creator: pdfCreator,
      producer: pdfProducer
    });

    // Store detailed processing results
    console.log("💾 [Process Document] Storing processing results in database...");
    const existingResult = await pool.query(
      'SELECT id FROM document_processing_results WHERE document_id = $1',
      [documentId]
    );
    
    // Calculate word count
    const wordCount = pdfResult.text?.split(/\s+/).filter(word => word.length > 0).length || 0;
    
    if (existingResult.rows.length > 0) {
      console.log("🔄 [Process Document] Updating existing processing results...");
      // Update existing record
      await pool.query(
        `UPDATE document_processing_results 
         SET extracted_text = $1, text_length = $2, word_count = $3, pdf_total_pages = $4, 
             pdf_title = $5, pdf_author = $6, pdf_creator = $7, pdf_producer = $8, 
             screenshot_path = $9, processed_at = NOW(), analysis_status = 'completed'
         WHERE document_id = $10`,
        [
          pdfResult.text || '',
          pdfResult.text_length || 0,
          wordCount,
          pdfResult.num_pages || 0,
          pdfTitle,
          pdfAuthor,
          pdfCreator,
          pdfProducer,
          screenshotPath,
          documentId
        ]
      );
    } else {
      console.log("➕ [Process Document] Inserting new processing results...");
      // Insert new record
      await pool.query(
        `INSERT INTO document_processing_results (
          document_id, 
          extracted_text,
          text_length, 
          word_count, 
          pdf_total_pages,
          pdf_title,
          pdf_author,
          pdf_creator,
          pdf_producer,
          screenshot_path,
          processed_at,
          analysis_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), 'completed')`,
        [
          documentId,
          pdfResult.text || '',
          pdfResult.text_length || 0,
          wordCount,
          pdfResult.num_pages || 0,
          pdfTitle,
          pdfAuthor,
          pdfCreator,
          pdfProducer,
          screenshotPath
        ]
      );
    }
    console.log("✅ [Process Document] Processing results stored successfully");

    // Perform AI analysis if text was extracted
    if (pdfResult.text && pdfResult.text.length > 100) {
      try {
        console.log('🤖 Starting Ollama AI analysis...');
        
        // 1. Aesthetic Analysis using screenshot
        let aestheticScore = 75; // Default score
        if (screenshotPath) {
          try {
            const fullScreenshotPath = path.join(__dirname, '..', '..', screenshotPath);
            const aestheticResponse = await fetch('http://localhost:8000/api/ai/aesthetic', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ imagePath: fullScreenshotPath })
            });
            
            if (aestheticResponse.ok) {
              const aestheticResult = await aestheticResponse.json();
              aestheticScore = aestheticResult.data.aestheticScore;
              console.log('✅ Aesthetic analysis completed, score:', aestheticScore);
            }
          } catch (aestheticError) {
            console.error('❌ Aesthetic analysis failed:', aestheticError);
          }
        }
        
        // 2. Comprehensive Resume Analysis
        try {
          const fullScreenshotPath = screenshotPath ? path.join(__dirname, '..', '..', screenshotPath) : null;
          const analysisResponse = await fetch('http://localhost:8000/api/ai/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              documentId,
              extractedText: pdfResult.text,
              imagePath: fullScreenshotPath
            })
          });
          
          if (analysisResponse.ok) {
            const analysisResult = await analysisResponse.json();
            console.log('✅ Comprehensive AI analysis completed');
          }
        } catch (analysisError) {
          console.error('❌ Comprehensive analysis failed:', analysisError);
        }
        
        // 3. Store aesthetic score in processing results
        await pool.query(
          `UPDATE document_processing_results 
           SET aesthetic_score = $1 
           WHERE document_id = $2`,
          [aestheticScore, documentId]
        );
        
        console.log('✅ AI analysis pipeline completed for document:', documentId);
      } catch (analysisError) {
        console.error('❌ AI analysis pipeline failed:', analysisError);
        // Don't fail the entire processing if analysis fails
      }
    }
    
    const result = {
      data: {
        message: "Resume processed successfully",
        extractedText: pdfResult.text || '',
        textLength: pdfResult.text_length || 0,
        numPages: pdfResult.num_pages || 0,
        info: {
          Title: pdfResult.pdf_title,
          Author: pdfResult.pdf_author,
          Creator: pdfResult.pdf_creator,
          Producer: pdfResult.pdf_producer
        },
        pdfTotalPages: pdfResult.num_pages || 0,
        pdfTitle: pdfResult.pdf_title,
        pdfAuthor: pdfResult.pdf_author,
        pdfCreator: pdfResult.pdf_creator,
        pdfProducer: pdfResult.pdf_producer,
        screenshotPath: screenshotPath,
        processedAt: pdfResult.processed_at
      }
    };

    console.log("🎉 [Process Document] Document processing completed successfully!");
    console.log("📤 [Process Document] Sending response to frontend:", {
      success: true,
      pages: result.data.numPages,
      textLength: result.data.textLength,
      hasScreenshot: !!result.data.screenshotPath
    });

    // Update persistent state for user if this is a resume
    if (document.document_type === 'resume' && document.user_email) {
      try {
        console.log("🔄 [Process Document] Updating persistent resume state for user:", document.user_email);
        await userResumeStateService.updateUserResumeState(document.user_email, documentId);
        console.log("✅ [Process Document] Persistent state updated successfully");
      } catch (stateError) {
        console.error("❌ [Process Document] Error updating persistent state:", stateError);
        // Don't fail the request, just log the error
      }
    }

    res.json({
      success: true,
      message: 'Resume processed successfully',
      data: result.data
    });

  } catch (error) {
    console.error('❌ [Process Document] Error processing resume:', error);
    console.error('🔍 [Process Document] Error details:', {
      message: error.message,
      stack: error.stack,
      documentId: req.params.documentId
    });
    res.status(500).json({
      error: 'Failed to process resume',
      details: error.message
    });
  }
}

// Get document assets (previews, images, etc.)
async function getDocumentAssets(req, res) {
  const { documentId } = req.params;
  const { assetType } = req.query;

  try {
    let query = `
      SELECT * FROM document_assets 
      WHERE document_id = $1
    `;
    const params = [documentId];

    if (assetType) {
      query += ' AND asset_type = $2';
      params.push(assetType);
    }

    query += ' ORDER BY page_number ASC, asset_index ASC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error getting document assets:', error);
    res.status(500).json({
      error: 'Failed to get document assets',
      details: error.message
    });
  }
}

// Download document file
async function downloadDocument(req, res) {
  const { documentId } = req.params;

  try {
    const documentResult = await pool.query(
      'SELECT * FROM documents WHERE id = $1 AND deleted_at IS NULL',
      [documentId]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    const document = documentResult.rows[0];

    // Check if file exists
    try {
      await fs.access(document.file_path);
    } catch (fileError) {
      return res.status(404).json({
        error: 'Document file not found on disk'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', document.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${document.original_filename}"`);

    // Stream file to response
    const fileStream = require('fs').createReadStream(document.file_path);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      error: 'Failed to download document',
      details: error.message
    });
  }
}

// Delete document (soft delete)
async function deleteDocument(req, res) {
  const { documentId } = req.params;

  try {
    const result = await pool.query(
      'SELECT soft_delete_document($1) as success',
      [documentId]
    );

    const success = result.rows[0].success;

    if (!success) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      error: 'Failed to delete document',
      details: error.message
    });
  }
}

// Get processing queue
async function getProcessingQueue(req, res) {
  const { limit = 50 } = req.query;

  try {
    const result = await pool.query(
      `SELECT 
          dpq.id,
          dpq.document_id,
          d.user_id,
          d.original_filename,
          dpq.queue_status,
          dpq.priority,
          dpq.processing_options,
          dpq.retry_count,
          dpq.created_at
       FROM document_processing_queue dpq
       JOIN documents d ON dpq.document_id = d.id
       WHERE dpq.queue_status IN ('queued', 'processing')
       ORDER BY dpq.priority ASC, dpq.created_at ASC
       LIMIT $1`,
      [parseInt(limit)]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error getting processing queue:', error);
    res.status(500).json({
      error: 'Failed to get processing queue',
      details: error.message
    });
  }
}

// Get document management statistics
async function getDocumentStatistics(req, res) {
  try {
    const result = await pool.query(
      `SELECT 
          COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_documents,
          COUNT(*) FILTER (WHERE processing_status = 'completed' AND deleted_at IS NULL) as processed_documents,
          COUNT(*) FILTER (WHERE processing_status = 'pending' AND deleted_at IS NULL) as pending_documents,
          COUNT(*) FILTER (WHERE processing_status = 'failed' AND deleted_at IS NULL) as failed_documents,
          COUNT(DISTINCT user_id) FILTER (WHERE deleted_at IS NULL) as total_users,
          AVG(dpr.processing_time_ms) as avg_processing_time_ms,
          SUM(dpr.text_length) as total_text_extracted,
          (SELECT COUNT(*) FROM document_assets) as total_assets_generated,
          (SELECT COUNT(*) FROM document_processing_queue WHERE queue_status IN ('queued', 'processing')) as queue_size,
          MAX(dpr.processed_at) as last_processed_at
       FROM documents d
       LEFT JOIN document_processing_results dpr ON d.id = dpr.document_id`
    );

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error getting document statistics:', error);
    res.status(500).json({
      error: 'Failed to get document statistics',
      details: error.message
    });
  }
}

// Get document summary
async function getDocumentSummary(req, res) {
  try {
    const { limit = 50, userId } = req.query;

    let query = 'SELECT * FROM document_summary WHERE 1=1';
    const params = [];

    if (userId) {
      query += ' AND user_id = $' + (params.length + 1);
      params.push(userId);
    }

    query += ' ORDER BY uploaded_at DESC LIMIT $' + (params.length + 1);
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error getting document summary:', error);
    res.status(500).json({
      error: 'Failed to get document summary',
      details: error.message
    });
  }
}

// Background processor for processing queue
async function processQueue() {
  console.log('Starting document processing queue...');

  try {
    const queueResult = await pool.query(
      'SELECT * FROM get_processing_queue($1)',
      [10] // Process up to 10 items at once
    );

    for (const queueItem of queueResult.rows) {
      try {
        console.log(`Processing queue item ${queueItem.queue_id} for document ${queueItem.document_id}`);

        // Update queue status to processing
        await pool.query(
          'SELECT update_queue_status($1, $2)',
          [queueItem.queue_id, 'processing']
        );

        // Get document info
        const documentResult = await pool.query(
          'SELECT * FROM documents WHERE id = $1',
          [queueItem.document_id]
        );

        if (documentResult.rows.length === 0) {
          throw new Error('Document not found');
        }

        const document = documentResult.rows[0];

        // Process document with options from queue
        const processingOptions = queueItem.processing_options || {};
        console.log('🔍 Processing document:', queueItem.document_id, 'file_path:', document.file_path);
        
        // Use dynamic import to avoid DOMMatrix error during startup
        const { parseResume } = await import('../services/pdfParserService.js');
        const results = await parseResume(document.file_path);
        
        console.log('🔍 PDF processing results:', {
          textLength: results.text?.length || 0,
          numPages: results.numpages || 0,
          hasScreenshot: !!results.previewImageBase64
        });

        // Store processing results in database
        const client = await pool.connect();
        try {
          await client.query(
            `INSERT INTO document_processing_results 
             (document_id, extracted_text, text_length, pdf_total_pages, pdf_title, pdf_author, pdf_creator, pdf_producer, screenshot_path, processed_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
            [
              queueItem.document_id,
              results.text || '',
              results.text?.length || 0,
              results.numpages || 0,
              results.info?.Title || '',
              results.info?.Author || '',
              results.info?.Creator || '',
              results.info?.Producer || '',
              results.screenshotPath || null
            ]
          );

          // Update document status to processed
          await client.query(
            'UPDATE documents SET processing_status = $2 WHERE id = $1',
            [queueItem.document_id, 'completed']
          );

          console.log('🔍 Processing results stored in database');
        } finally {
          client.release();
        }

        // Update queue status to completed
        await pool.query(
          'SELECT update_queue_status($1, $2)',
          [queueItem.queue_id, 'completed']
        );

        console.log(`Successfully processed document ${queueItem.document_id}`);

      } catch (processingError) {
        console.error(`Failed to process document ${queueItem.document_id}:`, processingError);

        // Update queue status to failed
        await pool.query(
          'SELECT update_queue_status($1, $2, $3)',
          [queueItem.queue_id, 'failed', processingError.message]
        );
      }
    }

  } catch (error) {
    console.error('Error in processing queue:', error);
  }
}

// Start background queue processor
setInterval(processQueue, 30000); // Process queue every 30 seconds}

export {
  uploadDocument,
  getUserDocuments,
  getActiveDocument,
  setActiveDocument,
  getDocumentProcessingResults,
  processDocument,
  getDocumentAssets,
  downloadDocument,
  deleteDocument,
  getProcessingQueue,
  getDocumentStatistics,
  getDocumentSummary,
  upload // multer middleware for file uploads
};
