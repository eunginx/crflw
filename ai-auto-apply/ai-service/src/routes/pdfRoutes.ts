import { Router, Request, Response } from "express";
import { parsePdfFile, parsePdfDetailed, parsePdfBuffer, parsePdfBufferDetailed, extractResumeInfo } from "../services/pdfParseService";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory for buffer parsing
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

const router = Router();

/**
 * Parse PDF from uploaded file and return extracted text
 */
router.post("/parse-pdf", upload.single("pdfFile"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required" });
    }

    console.log(`Parsing PDF file: ${req.file.originalname}, size: ${req.file.size} bytes`);
    
    // Parse PDF from buffer
    const text = await parsePdfBuffer(req.file.buffer);
    
    res.json({ 
      success: true,
      filename: req.file.originalname,
      text,
      textLength: text.length
    });
  } catch (error) {
    console.error('Error parsing PDF:', error);
    res.status(500).json({ 
      error: (error as Error).message,
      success: false
    });
  }
});

/**
 * Parse PDF from uploaded file and return detailed information
 */
router.post("/parse-pdf-detailed", upload.single("pdfFile"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required" });
    }

    console.log(`Parsing PDF file in detail: ${req.file.originalname}, size: ${req.file.size} bytes`);
    
    // Parse PDF from buffer with detailed info
    const result = await parsePdfBufferDetailed(req.file.buffer);
    
    res.json({ 
      success: true,
      filename: req.file.originalname,
      ...result
    });
  } catch (error) {
    console.error('Error parsing PDF in detail:', error);
    res.status(500).json({ 
      error: (error as Error).message,
      success: false
    });
  }
});

/**
 * Parse PDF from uploaded file and extract resume information
 */
router.post("/parse-resume", upload.single("pdfFile"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required" });
    }

    console.log(`Parsing resume PDF: ${req.file.originalname}, size: ${req.file.size} bytes`);
    
    // Parse PDF from buffer
    const text = await parsePdfBuffer(req.file.buffer);
    
    // Extract structured resume information
    const resumeInfo = extractResumeInfo(text);
    
    res.json({ 
      success: true,
      filename: req.file.originalname,
      text,
      textLength: text.length,
      resumeInfo
    });
  } catch (error) {
    console.error('Error parsing resume PDF:', error);
    res.status(500).json({ 
      error: (error as Error).message,
      success: false
    });
  }
});

/**
 * Parse PDF from file path and return extracted text
 * For server-side file processing
 */
router.post("/parse-pdf-path", async (req: Request, res: Response) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: "File path is required" });
    }

    console.log(`Parsing PDF file from path: ${filePath}`);
    
    // Parse PDF from file path
    const text = await parsePdfFile(filePath);
    
    res.json({ 
      success: true,
      filePath,
      text,
      textLength: text.length
    });
  } catch (error) {
    console.error('Error parsing PDF from path:', error);
    res.status(500).json({ 
      error: (error as Error).message,
      success: false
    });
  }
});

/**
 * Parse PDF from file path and return detailed information
 */
router.post("/parse-pdf-path-detailed", async (req: Request, res: Response) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: "File path is required" });
    }

    console.log(`Parsing PDF file from path in detail: ${filePath}`);
    
    // Parse PDF from file path with detailed info
    const result = await parsePdfDetailed(filePath);
    
    res.json({ 
      success: true,
      filePath,
      ...result
    });
  } catch (error) {
    console.error('Error parsing PDF from path in detail:', error);
    res.status(500).json({ 
      error: (error as Error).message,
      success: false
    });
  }
});

/**
 * Health check endpoint for PDF parsing service
 */
router.get("/health", (req: Request, res: Response) => {
  res.json({ 
    service: "PDF Parse Service",
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

/**
 * Get supported file types and limits
 */
router.get("/info", (req: Request, res: Response) => {
  res.json({ 
    service: "PDF Parse Service",
    supportedTypes: ["application/pdf"],
    maxFileSize: "10MB",
    features: [
      "Text extraction",
      "Metadata extraction", 
      "Resume information extraction",
      "File upload parsing",
      "File path parsing"
    ]
  });
});

// Error handling middleware for multer
router.use((error: any, req: Request, res: Response, next: any) => {
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

export default router;
