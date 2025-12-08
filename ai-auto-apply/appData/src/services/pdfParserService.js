// Using Node.js v20 with pdf-parse v2.4.5 - full screenshot support available
console.log(`🔧 [PDF Parser Service] Node.js v20 with pdf-parse v2.4.5 - Full screenshot support enabled`);

import { PDFParse } from 'pdf-parse';
import fs from 'fs/promises';
import path from 'path';

export async function parseResume(filePath, options = {}) {
  try {
    console.log("🔍 [PDF Parser Service] Using pdf-parse v2.4.5 with Node.js v20");
    
    // Read file buffer
    const dataBuffer = await fs.readFile(filePath);
    console.log("📊 [PDF Parser Service] File size:", dataBuffer.length);
    
    // Use modern pdf-parse v2.4.5 API
    const parser = new PDFParse({ data: dataBuffer });
    
    // Get text and metadata
    const textResult = await parser.getText();
    const infoResult = await parser.getInfo({ parsePageInfo: true });
    
    let screenshotPath = null;
    let previewImageBase64 = null;
    
    // Generate real screenshot if requested
    if (options.generateScreenshot !== false) {
      try {
        console.log("🖼️ [PDF Parser Service] Generating screenshot...");
        const screenshotResult = await parser.getScreenshot({ 
          scale: 1.5,
          imageDataUrl: false, // Don't generate base64 URL for performance
          imageBuffer: true    // Get binary buffer
        });
        
        console.log("🔍 [PDF Parser Service] Screenshot result structure:", {
          hasPages: !!screenshotResult.pages,
          pagesLength: screenshotResult.pages?.length,
          firstPageDataType: typeof screenshotResult.pages?.[0]?.data,
          firstPageDataLength: screenshotResult.pages?.[0]?.data?.length || 0
        });
        
        if (screenshotResult.pages && screenshotResult.pages.length > 0) {
          // Create screenshots directory if it doesn't exist
          const screenshotsDir = path.join(process.cwd(), 'assets', 'screenshots');
          await fs.mkdir(screenshotsDir, { recursive: true });
          
          // Generate filename based on original file
          const originalName = path.basename(filePath, '.pdf');
          const screenshotFileName = `resume_${originalName}_${Date.now()}.png`;
          screenshotPath = path.join(screenshotsDir, screenshotFileName);
          
          // Get the image data
          let imageData = screenshotResult.pages[0].data;
          
          // Convert to buffer if needed
          if (!Buffer.isBuffer(imageData)) {
            if (typeof imageData === 'string') {
              // If it's a base64 string, convert to buffer
              if (imageData.startsWith('data:image/')) {
                // Remove data URL prefix
                const base64Data = imageData.split(',')[1];
                imageData = Buffer.from(base64Data, 'base64');
              } else {
                // Assume it's plain base64
                imageData = Buffer.from(imageData, 'base64');
              }
            } else if (imageData instanceof Uint8Array) {
              // Convert Uint8Array to Buffer
              imageData = Buffer.from(imageData);
            } else {
              console.error("❌ [PDF Parser Service] Unknown image data type:", typeof imageData);
              throw new Error(`Unsupported image data type: ${typeof imageData}`);
            }
          }
          
          console.log("✅ [PDF Parser Service] Image data converted to buffer, size:", imageData.length, "bytes");
          
          // Save screenshot
          await fs.writeFile(screenshotPath, imageData);
          console.log(`✅ [PDF Parser Service] Screenshot saved: ${screenshotPath} (${imageData.length} bytes)`);
          
          // Convert to base64 for frontend
          previewImageBase64 = `data:image/png;base64,${imageData.toString('base64')}`;
        }
      } catch (screenshotError) {
        console.warn("⚠️ [PDF Parser Service] Screenshot generation failed:", screenshotError.message);
        console.warn("🔧 [PDF Parser Service] Error details:", screenshotError.stack);
        // Continue without screenshot - text processing still works
      }
    }
    
    // Clean up parser
    await parser.destroy();
    
    console.log("✅ [PDF Parser Service] PDF parsed successfully");
    console.log(`📄 [PDF Parser Service] Pages: ${infoResult.pages?.length || 0}, Text length: ${textResult.text?.length || 0}`);
    
    // Convert to format expected by existing code
    return {
      text: textResult.text || '',
      info: infoResult.info || {},
      metadata: infoResult.metadata || {},
      numpages: infoResult.pages?.length || 0,
      numrender: infoResult.pages?.length || 0,
      version: infoResult.version || '2.4.5',
      screenshotPath: screenshotPath,
      previewImageBase64: previewImageBase64
    };
  } catch (error) {
    console.error("❌ [PDF Parser Service] Error parsing PDF:", error);
    throw error;
  }
}
