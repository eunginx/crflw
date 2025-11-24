import { PDFParse } from 'pdf-parse';
import fs from 'fs';

export async function parseResume(filePath) {
  try {
    console.log("🔍 [PDF Parser Service] Using pdf-parse v2.x with Node 20");
    
    // Read file buffer
    const dataBuffer = fs.readFileSync(filePath);
    console.log("📊 [PDF Parser Service] File size:", dataBuffer.length);
    
    // Use modern pdf-parse v2.x API
    const parser = new PDFParse({ data: dataBuffer });
    
    // Get text and metadata
    const textResult = await parser.getText();
    const infoResult = await parser.getInfo({ parsePageInfo: true });
    
    // Clean up parser
    await parser.destroy();
    
    console.log("✅ [PDF Parser Service] PDF parsed successfully");
    console.log(`📄 [PDF Parser Service] Pages: ${infoResult.pages?.length || 0}, Text length: ${textResult.text?.length || 0}`);
    
    // Convert to format expected by existing code
    return {
      text: textResult.text,
      info: infoResult.info || {},
      metadata: infoResult.metadata || {},
      numpages: infoResult.pages?.length || 0,
      numrender: infoResult.pages?.length || 0,
      version: infoResult.version || '2.x'
    };
  } catch (error) {
    console.error("❌ [PDF Parser Service] Error parsing PDF:", error);
    throw error;
  }
}
