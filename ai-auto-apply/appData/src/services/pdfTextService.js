import fs from 'fs';
import { PDFParse } from 'pdf-parse';

async function extractPdfText(filePath) {
  const buffer = fs.readFileSync(filePath);
  
  // Use correct v2.4.5 class-based API
  const parser = new PDFParse();
  const result = await parser.parse(buffer);

  return {
    text: result.text || '',
    numPages: result.numpages || 0,
    info: result.info || {},
    metadata: result.metadata || {},
  };
}

export { extractPdfText };
