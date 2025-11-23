import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";

export interface PdfParseResult {
  text: string;
  info: any;
  metadata: any;
  numpages: number;
  numrender: number;
  version: string;
}

/**
 * Parse PDF file and return extracted text
 * @param filePath Path to the PDF file
 * @returns Promise<string> Extracted text content
 */
export async function parsePdfFile(filePath: string): Promise<string> {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file not found: ${filePath}`);
    }

    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  } catch (error) {
    console.error('Error parsing PDF file:', error);
    throw new Error(`Failed to parse PDF: ${(error as Error).message}`);
  }
}

/**
 * Parse PDF file and return detailed information including metadata
 * @param filePath Path to the PDF file
 * @returns Promise<PdfParseResult> Detailed PDF parsing result
 */
export async function parsePdfDetailed(filePath: string): Promise<PdfParseResult> {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file not found: ${filePath}`);
    }

    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    
    return {
      text: pdfData.text,
      info: pdfData.info,
      metadata: pdfData.metadata,
      numpages: pdfData.numpages,
      numrender: pdfData.numrender,
      version: pdfData.version
    };
  } catch (error) {
    console.error('Error parsing PDF file in detail:', error);
    throw new Error(`Failed to parse PDF: ${(error as Error).message}`);
  }
}

/**
 * Parse PDF file from buffer (useful for uploaded files)
 * @param buffer PDF file buffer
 * @returns Promise<string> Extracted text content
 */
export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  try {
    if (!Buffer.isBuffer(buffer)) {
      throw new Error('Invalid PDF buffer provided');
    }

    const pdfData = await pdfParse(buffer);
    return pdfData.text;
  } catch (error) {
    console.error('Error parsing PDF buffer:', error);
    throw new Error(`Failed to parse PDF buffer: ${(error as Error).message}`);
  }
}

/**
 * Parse PDF file from buffer with detailed information
 * @param buffer PDF file buffer
 * @returns Promise<PdfParseResult> Detailed PDF parsing result
 */
export async function parsePdfBufferDetailed(buffer: Buffer): Promise<PdfParseResult> {
  try {
    if (!Buffer.isBuffer(buffer)) {
      throw new Error('Invalid PDF buffer provided');
    }

    const pdfData = await pdfParse(buffer);
    
    return {
      text: pdfData.text,
      info: pdfData.info,
      metadata: pdfData.metadata,
      numpages: pdfData.numpages,
      numrender: pdfData.numrender,
      version: pdfData.version
    };
  } catch (error) {
    console.error('Error parsing PDF buffer in detail:', error);
    throw new Error(`Failed to parse PDF buffer: ${(error as Error).message}`);
  }
}

/**
 * Extract structured information from resume text
 * @param text Extracted text from PDF
 * @returns Object with structured resume information
 */
export function extractResumeInfo(text: string): {
  email?: string;
  phone?: string;
  name?: string;
  skills: string[];
  experience: string[];
  education: string[];
} {
  const result = {
    email: undefined as string | undefined,
    phone: undefined as string | undefined,
    name: undefined as string | undefined,
    skills: [] as string[],
    experience: [] as string[],
    education: [] as string[]
  };

  // Extract email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    result.email = emailMatch[0];
  }

  // Extract phone number (basic pattern)
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) {
    result.phone = phoneMatch[0];
  }

  // Extract name (simplified - usually at the beginning of resume)
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine.length < 50 && /^[A-Za-z\s]+$/.test(firstLine)) {
      result.name = firstLine;
    }
  }

  // Extract skills (common technical skills)
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#',
    'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes',
    'Git', 'Linux', 'Angular', 'Vue.js', 'Express', 'Django', 'Flask', 'Spring Boot'
  ];

  result.skills = commonSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );

  // Extract experience (look for "experience" section)
  const experienceSection = text.toLowerCase().split('experience')[1]?.split('education')[0];
  if (experienceSection) {
    const experienceLines = experienceSection.split('\n').filter(line => line.trim().length > 20);
    result.experience = experienceLines.slice(0, 5); // Top 5 experience lines
  }

  // Extract education (look for "education" section)
  const educationSection = text.toLowerCase().split('education')[1]?.split('experience')[0];
  if (educationSection) {
    const educationLines = educationSection.split('\n').filter(line => line.trim().length > 10);
    result.education = educationLines.slice(0, 3); // Top 3 education lines
  }

  return result;
}
