import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';

export async function parseResume(filePath) {
  const fileBuffer = fs.readFileSync(filePath);

  try {
    // Use correct v2.4.5 class-based API with data parameter
    const parser = new PDFParse({ data: fileBuffer });
    
    // Get text and info using modern methods
    const textResult = await parser.getText();
    const infoResult = await parser.getInfo({ parsePageInfo: true });
    
    // Generate screenshot for the first page
    let screenshotBase64 = null;
    try {
      console.log('📸 Generating screenshot...');
      const screenshotResult = await parser.getScreenshot({ 
        scale: 1.5, 
        pages: [0] // First page only
      });
      
      if (screenshotResult && screenshotResult.pages && screenshotResult.pages[0]) {
        screenshotBase64 = screenshotResult.pages[0].data;
        console.log('✅ Screenshot generated successfully');
      }
    } catch (screenshotError) {
      console.warn('⚠️ Screenshot generation failed:', screenshotError.message);
    }
    
    // Clean up parser to prevent memory leaks
    await parser.destroy();

    return {
      text: textResult.text || '',
      numPages: infoResult.total || 0,
      info: infoResult.info || {},
      pages: infoResult.pages || [],
      previewImageBase64: screenshotBase64,
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
}
