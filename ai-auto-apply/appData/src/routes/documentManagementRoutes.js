const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const {
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
  upload
} = require('./documentManagement');

// Upload document (with file)
router.post('/upload', upload.single('file'), async (req, res) => {
  await uploadDocument(req, res);
});

// Get all documents for a user
router.get('/users/:userId/documents', async (req, res) => {
  await getUserDocuments(req, res);
});

// Get active document for a user
router.get('/users/:userId/active', async (req, res) => {
  await getActiveDocument(req, res);
});

// Set active document for a user
router.post('/users/:userId/active', async (req, res) => {
  await setActiveDocument(req, res);
});

// Get document processing results
router.get('/:documentId/processing', async (req, res) => {
  await getDocumentProcessingResults(req, res);
});

// Process document manually
router.post('/:documentId/process', async (req, res) => {
  await processDocument(req, res);
});

// Get document assets (previews, images, etc.)
router.get('/:documentId/assets', async (req, res) => {
  await getDocumentAssets(req, res);
});

// Download document file
router.get('/:documentId/download', async (req, res) => {
  await downloadDocument(req, res);
});

// Delete document
router.delete('/:documentId', async (req, res) => {
  await deleteDocument(req, res);
});

// Get processing queue
router.get('/queue', async (req, res) => {
  await getProcessingQueue(req, res);
});

// Get document statistics
router.get('/statistics', async (req, res) => {
  await getDocumentStatistics(req, res);
});

// Get document summary
router.get('/summary', async (req, res) => {
  await getDocumentSummary(req, res);
});

// Download document asset
router.get('/assets/:assetId/download', async (req, res) => {
  try {
    const { assetId } = req.params;

    // Get asset info from database
    const assetResult = await pool.query(
      'SELECT * FROM document_assets WHERE id = $1',
      [assetId]
    );

    if (assetResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Asset not found'
      });
    }

    const asset = assetResult.rows[0];

    if (!asset.file_path) {
      return res.status(404).json({
        error: 'Asset file not found'
      });
    }

    // Check if file exists
    try {
      await fs.access(asset.file_path);
    } catch (fileError) {
      return res.status(404).json({
        error: 'Asset file not found on disk'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', `image/${asset.asset_format}`);
    res.setHeader('Content-Disposition', `inline; filename="asset_${asset.id}.${asset.asset_format}"`);

    // Stream file to response
    const fileStream = require('fs').createReadStream(asset.file_path);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error downloading asset:', error);
    res.status(500).json({
      error: 'Failed to download asset',
      details: error.message
    });
  }
});

// Get resume screenshot
router.get('/resume/screenshot', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    // const ResumeProcessingService = require('../services/resumeProcessingService');
    // const resumeProcessor = new ResumeProcessingService();
    
    // const screenshotBase64 = await resumeProcessor.getScreenshotBase64(userId);
    
    // For now, return a placeholder image
    const screenshotBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg==";
    
    if (!screenshotBase64) {
      return res.status(404).json({
        error: 'Screenshot not found'
      });
    }

    // Convert base64 to image buffer
    const imageBuffer = Buffer.from(screenshotBase64, 'base64');
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="resume_screenshot.png"');
    res.send(imageBuffer);

  } catch (error) {
    console.error('Error getting resume screenshot:', error);
    res.status(500).json({
      error: 'Failed to get resume screenshot',
      details: error.message
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    service: 'Document Management Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    features: {
      upload: true,
      processing: true,
      cli: true,
      queue: true,
      assets: true
    }
  });
});

// CLI endpoints for direct pdf-parse usage

// Get PDF header info
router.post('/cli/header', async (req, res) => {
  try {
    const { filePath } = req.body;
    const PDFParseCLIService = require('../services/pdfParseCLIService');
    const pdfService = new PDFParseCLIService();
    
    const result = await pdfService.getHeader(filePath);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get PDF header',
      details: error.message
    });
  }
});

// Extract text using CLI
router.post('/cli/text', async (req, res) => {
  try {
    const { filePath, options = {} } = req.body;
    const PDFParseCLIService = require('../services/pdfParseCLIService');
    const pdfService = new PDFParseCLIService();
    
    const result = await pdfService.getText(filePath, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to extract text',
      details: error.message
    });
  }
});

// Get PDF info using CLI
router.post('/cli/info', async (req, res) => {
  try {
    const { filePath, options = {} } = req.body;
    const PDFParseCLIService = require('../services/pdfParseCLIService');
    const pdfService = new PDFParseCLIService();
    
    const result = await pdfService.getInfo(filePath, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get PDF info',
      details: error.message
    });
  }
});

// Generate screenshots using CLI
router.post('/cli/screenshot', async (req, res) => {
  try {
    const { filePath, outputPath, options = {} } = req.body;
    const PDFParseCLIService = require('../services/pdfParseCLIService');
    const pdfService = new PDFParseCLIService();
    
    const result = await pdfService.getScreenshot(filePath, outputPath, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate screenshots',
      details: error.message
    });
  }
});

// Extract images using CLI
router.post('/cli/images', async (req, res) => {
  try {
    const { filePath, outputPath, options = {} } = req.body;
    const PDFParseCLIService = require('../services/pdfParseCLIService');
    const pdfService = new PDFParseCLIService();
    
    const result = await pdfService.getImages(filePath, outputPath, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to extract images',
      details: error.message
    });
  }
});

// Extract tables using CLI
router.post('/cli/tables', async (req, res) => {
  try {
    const { filePath, outputPath, options = {} } = req.body;
    const PDFParseCLIService = require('../services/pdfParseCLIService');
    const pdfService = new PDFParseCLIService();
    
    const result = await pdfService.getTables(filePath, outputPath, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to extract tables',
      details: error.message
    });
  }
});

module.exports = router;
