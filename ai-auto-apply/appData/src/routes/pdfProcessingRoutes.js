import express from 'express';
import fs from 'fs';
import { pool } from '../db.js';

const router = express.Router();

/**
 * ================================
 *  PDF TEXT PROCESSING ENDPOINT
 * ================================
 * Expects:
 *    documentId: ID of stored document
 *  
 * Returns:
 *    Extracted text and metadata without AI analysis
 */
router.post("/extract-text", async (req, res) => {
  console.log('📄 === PDF TEXT PROCESSING DEBUG START ===');
  console.log('📄 Request body:', req.body);

  try {
    const { documentId } = req.body;

    if (!documentId) {
      console.log('📄 ERROR: Document ID is required');
      return res.status(400).json({ error: "Document ID is required" });
    }

    console.log('📄 Starting PDF text extraction for document:', documentId);

    // === Get document file path from database ===
    console.log('📄 Querying database for document file path...');
    const client = await pool.connect();
    let filePath;
    try {
      const result = await client.query(
        'SELECT file_path FROM documents WHERE id = $1',
        [documentId]
      );

      console.log('📄 Database query result:', {
        rowCount: result.rowCount,
        rows: result.rows
      });

      if (result.rows.length === 0) {
        console.log('📄 ERROR: Document not found in database');
        return res.status(404).json({ error: 'Document not found' });
      }

      filePath = result.rows[0].file_path;
      console.log('📄 Document file path from database:', filePath);
    } finally {
      client.release();
    }

    // Check if file exists
    console.log('📄 Checking if file exists on disk:', filePath);
    const fileExists = fs.existsSync(filePath);
    console.log('📄 File exists on disk:', fileExists);

    if (!fileExists) {
      console.log('📄 ERROR: PDF file not found on disk');
      return res.status(400).json({ error: "PDF file not found on disk" });
    }

    // === Extract text using basic PDF parsing ===
    console.log('📄 Starting PDF text extraction...');
    let extractedText = '';
    let numPages = 1;
    let metadata = {};

    try {
      console.log('📄 Attempting basic PDF text extraction...');
      const { PDFParse } = await import('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);

      // Use most basic parsing approach
      const parser = new PDFParse({ data: dataBuffer });

      // Only get text - no metadata or screenshots that might trigger DOMMatrix
      const textResult = await parser.getText();
      await parser.destroy();

      extractedText = textResult.text || '';
      console.log('📄 Basic text extraction successful');
      console.log('📄 Extracted text length:', extractedText.length);

      // Try to get basic metadata if possible
      try {
        const parser2 = new PDFParse({ data: dataBuffer });
        const infoResult = await parser2.getInfo();
        await parser2.destroy();
        metadata = infoResult.info || {};
        numPages = infoResult.pages?.length || 1;
        console.log('📄 Basic metadata extraction successful');
      } catch (metadataError) {
        console.warn('📄 Metadata extraction failed, using defaults:', metadataError.message);
      }

    } catch (extractionError) {
      console.error('📄 ERROR: PDF text extraction failed:', extractionError);
      return res.status(500).json({
        error: "PDF text extraction failed",
        details: extractionError.message
      });
    }

    // === Store text extraction results in database ===
    console.log('💾 Storing text extraction results in database...');
    const analysisClient = await pool.connect();
    try {
      const insertResult = await analysisClient.query(
        `INSERT INTO document_processing_results 
         (document_id, extracted_text, text_length, estimated_pages, pdf_title, pdf_author, pdf_creator, pdf_producer, pdf_creation_date, pdf_modification_date, processed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
         ON CONFLICT (document_id) DO UPDATE SET
         extracted_text = EXCLUDED.extracted_text,
         text_length = EXCLUDED.text_length,
         estimated_pages = EXCLUDED.estimated_pages,
         pdf_title = EXCLUDED.pdf_title,
         pdf_author = EXCLUDED.pdf_author,
         pdf_creator = EXCLUDED.pdf_creator,
         pdf_producer = EXCLUDED.pdf_producer,
         pdf_creation_date = EXCLUDED.pdf_creation_date,
         pdf_modification_date = EXCLUDED.pdf_modification_date,
         processed_at = CURRENT_TIMESTAMP`,
        [
          documentId,
          extractedText,
          extractedText.length,
          numPages,
          metadata.Title || null,
          metadata.Author || null,
          metadata.Creator || null,
          metadata.Producer || null,
          metadata.CreationDate ? new Date(metadata.CreationDate) : null,
          metadata.ModDate ? new Date(metadata.ModDate) : null
        ]
      );
      console.log('✅ Text extraction results stored in database');
      console.log('📄 Insert result:', insertResult.rowCount);
    } catch (dbError) {
      console.error('📄 ERROR: Failed to store text extraction results:', dbError);
      // Don't fail the whole request if DB storage fails
    } finally {
      analysisClient.release();
    }

    console.log('🎉 PDF text extraction completed successfully');
    const finalResponse = {
      success: true,
      documentId: documentId,
      extracted_text: extractedText,
      text_length: extractedText.length,
      num_pages: numPages,
      metadata: {
        title: metadata.Title,
        author: metadata.Author,
        creator: metadata.Creator,
        producer: metadata.Producer,
        creationDate: metadata.CreationDate,
        modificationDate: metadata.ModDate
      },
      processed_at: new Date().toISOString()
    };
    console.log('📄 Final response structure:', Object.keys(finalResponse));
    console.log('📄 === PDF TEXT PROCESSING DEBUG END ===');

    return res.status(200).json(finalResponse);
  } catch (err) {
    console.error("❌ PDF Text Processing Error:", err.message);
    console.error("📄 Full error:", err);
    console.error("📄 Error stack:", err.stack);
    console.log('📄 === PDF TEXT PROCESSING ERROR END ===');
    return res.status(500).json({
      error: "PDF text extraction failed",
      details: err.message
    });
  }
});

/**
 * ================================
 *  GET TEXT PROCESSING RESULTS
 * ================================
 */
router.get("/:documentId/text-results", async (req, res) => {
  try {
    const { documentId } = req.params;

    console.log('📄 Getting text processing results for document:', documentId);

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT document_id, extracted_text, text_length, estimated_pages, screenshot_path, pdf_title, pdf_author, pdf_creator, pdf_producer, pdf_creation_date, pdf_modification_date, processed_at
         FROM document_processing_results 
         WHERE document_id = $1`,
        [documentId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Text processing results not found'
        });
      }

      const results = result.rows[0];
      return res.status(200).json({
        success: true,
        data: {
          documentId: results.document_id,
          extracted_text: results.extracted_text,
          text_length: results.text_length,
          num_pages: results.estimated_pages,
          screenshot_path: results.screenshot_path, // Added for vision analysis
          metadata: {
            title: results.pdf_title,
            author: results.pdf_author,
            creator: results.pdf_creator,
            producer: results.pdf_producer,
            creationDate: results.pdf_creation_date,
            modificationDate: results.pdf_modification_date
          },
          processed_at: results.processed_at
        }
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("❌ Get Text Results Error:", err.message);
    return res.status(500).json({
      error: "Failed to get text processing results",
      details: err.message
    });
  }
});

export default router;
