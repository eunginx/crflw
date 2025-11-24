/**
 * PDF Parsing using pdf-parse v1.1.4 (Node 18 compatible)
 * Legacy API for Node 18 compatibility
 */

import { readFile } from "node:fs/promises";
import pdf from "pdf-parse";   // v1.x uses default import

export async function parsePDF(filePath) {
  console.log("🔍 [PDF Parser] Starting PDF parsing");
  console.log("📁 [PDF Parser] File path:", filePath);
  
  try {
    // Load buffer from file
    console.log("📖 [PDF Parser] Reading file...");
    const buffer = await readFile(filePath);
    console.log("📊 [PDF Parser] File size:", buffer.length, "bytes");
    
    if (buffer.length === 0) {
      console.error("❌ [PDF Parser] File is empty!");
      throw new Error("PDF file is empty");
    }

    // v1.x API - direct function call
    console.log("⚙️ [PDF Parser] Parsing PDF with pdf-parse v1.1.4...");
    const result = await pdf(buffer);
    console.log("✅ [PDF Parser] PDF parsed successfully");
    console.log("📄 [PDF Parser] Pages:", result.numpages);
    console.log("📝 [PDF Parser] Text length:", result.text?.length || 0);
    console.log("ℹ️ [PDF Parser] PDF Info:", result.info);

    const parsedData = {
      text: result.text || "",
      num_pages: result.numpages || 0,

      // metadata
      pdf_title: result.info?.Title || "",
      pdf_author: result.info?.Author || "",
      pdf_creator: result.info?.Creator || "",
      pdf_producer: result.info?.Producer || "",

      // extra
      text_length: result.text?.length || 0,
      processed_at: new Date().toISOString(),
    };

    console.log("🎯 [PDF Parser] Parsed data summary:", {
      pages: parsedData.num_pages,
      textLength: parsedData.text_length,
      hasTitle: !!parsedData.pdf_title,
      hasAuthor: !!parsedData.pdf_author
    });

    return parsedData;

  } catch (err) {
    console.error("❌ [PDF Parser] PDF parse failed:", err);
    console.error("🔍 [PDF Parser] Error details:", {
      message: err.message,
      stack: err.stack,
      filePath: filePath
    });
    throw err;
  }
}
