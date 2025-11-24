import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PDFParseCLIService {
  constructor() {
    this.cliPath = 'npx'; // Use npx to run pdf-parse without global installation
    this.tempDir = path.join(__dirname, '../../temp');
    this.ensureTempDir();
  }

  /**
   * Ensure temp directory exists
   */
  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  /**
   * Get PDF header information without full processing
   */
  async getHeader(filePath) {
    return new Promise((resolve, reject) => {
      const args = [
        'pdf-parse',
        'get-header',
        filePath,
        '--validate'
      ];

      const process = spawn(this.cliPath, args);
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseError) {
            reject(new Error(`Failed to parse CLI output: ${parseError.message}`));
          }
        } else {
          reject(new Error(`CLI failed with code ${code}: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Extract text from PDF using CLI
   */
  async getText(filePath, options = {}) {
    return new Promise((resolve, reject) => {
      const args = [
        'pdf-parse',
        'get-text',
        filePath
      ];

      // Add optional parameters
      if (options.pages) {
        args.push('--pages', options.pages.join(','));
      }
      if (options.first) {
        args.push('--first', options.first.toString());
      }
      if (options.last) {
        args.push('--last', options.last.toString());
      }
      if (options.password) {
        args.push('--password', options.password);
      }
      if (options.verbosity) {
        args.push('--verbosity', options.verbosity);
      }

      const startTime = Date.now();
      const process = spawn(this.cliPath, args);
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        const processingTime = Date.now() - startTime;
        
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            result.processingTime = processingTime;
            resolve(result);
          } catch (parseError) {
            reject(new Error(`Failed to parse CLI output: ${parseError.message}`));
          }
        } else {
          reject(new Error(`CLI failed with code ${code}: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Get PDF metadata and document information
   */
  async getInfo(filePath, options = {}) {
    return new Promise((resolve, reject) => {
      const args = [
        'pdf-parse',
        'get-info',
        filePath
      ];

      // Add optional parameters
      if (options.parsePageInfo) {
        args.push('--parse-page-info');
      }
      if (options.password) {
        args.push('--password', options.password);
      }

      const startTime = Date.now();
      const process = spawn(this.cliPath, args);
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        const processingTime = Date.now() - startTime;
        
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            result.processingTime = processingTime;
            resolve(result);
          } catch (parseError) {
            reject(new Error(`Failed to parse CLI output: ${parseError.message}`));
          }
        } else {
          reject(new Error(`CLI failed with code ${code}: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Generate PNG screenshots of PDF pages
   */
  async getScreenshot(filePath, outputPath, options = {}) {
    return new Promise((resolve, reject) => {
      const args = [
        'pdf-parse',
        'get-screenshot',
        filePath,
        '--output', outputPath
      ];

      // Add optional parameters
      if (options.scale) {
        args.push('--scale', options.scale.toString());
      }
      if (options.desiredWidth) {
        args.push('--width', options.desiredWidth.toString());
      }
      if (options.pages) {
        args.push('--pages', options.pages.join(','));
      }
      if (options.first) {
        args.push('--first', options.first.toString());
      }
      if (options.last) {
        args.push('--last', options.last.toString());
      }
      if (!options.imageDataUrl) {
        args.push('--no-data-url');
      }
      if (!options.imageBuffer) {
        args.push('--no-buffer');
      }

      const startTime = Date.now();
      const process = spawn(this.cliPath, args);
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        const processingTime = Date.now() - startTime;
        
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            result.processingTime = processingTime;
            resolve(result);
          } catch (parseError) {
            reject(new Error(`Failed to parse CLI output: ${parseError.message}`));
          }
        } else {
          reject(new Error(`CLI failed with code ${code}: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Extract embedded images from PDF
   */
  async getImages(filePath, outputPath, options = {}) {
    return new Promise((resolve, reject) => {
      const args = [
        'pdf-parse',
        'get-image',
        filePath,
        '--output', outputPath
      ];

      // Add optional parameters
      if (options.imageThreshold) {
        args.push('--threshold', options.imageThreshold.toString());
      }
      if (options.pages) {
        args.push('--pages', options.pages.join(','));
      }
      if (!options.imageDataUrl) {
        args.push('--no-data-url');
      }
      if (!options.imageBuffer) {
        args.push('--no-buffer');
      }

      const startTime = Date.now();
      const process = spawn(this.cliPath, args);
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        const processingTime = Date.now() - startTime;
        
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            result.processingTime = processingTime;
            resolve(result);
          } catch (parseError) {
            reject(new Error(`Failed to parse CLI output: ${parseError.message}`));
          }
        } else {
          reject(new Error(`CLI failed with code ${code}: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Extract tables from PDF
   */
  async getTables(filePath, outputPath, options = {}) {
    return new Promise((resolve, reject) => {
      const args = [
        'pdf-parse',
        'get-table',
        filePath,
        '--output', outputPath
      ];

      // Add optional parameters
      if (options.pages) {
        args.push('--pages', options.pages.join(','));
      }
      if (options.format) {
        args.push('--format', options.format);
      }

      const startTime = Date.now();
      const process = spawn(this.cliPath, args);
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        const processingTime = Date.now() - startTime;
        
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            result.processingTime = processingTime;
            resolve(result);
          } catch (parseError) {
            reject(new Error(`Failed to parse CLI output: ${parseError.message}`));
          }
        } else {
          reject(new Error(`CLI failed with code ${code}: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Complete document processing pipeline
   */
  async processDocument(documentId, filePath, options = {}) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const results = {
        text: null,
        info: null,
        screenshots: null,
        images: null,
        tables: null,
        processingTime: 0
      };

      const startTime = Date.now();

      // Update status to processing
      await client.query(
        'SELECT update_document_processing_status($1, $2)',
        [documentId, 'processing']
      );

      try {
        // Extract text
        console.log('Extracting text from PDF...');
        results.text = await this.getText(filePath, options.text || {});

        // Get metadata
        console.log('Extracting PDF metadata...');
        results.info = await this.getInfo(filePath, options.info || {});

        // Generate screenshots if requested
        if (options.screenshots) {
          console.log('Generating screenshots...');
          const screenshotPath = path.join(this.tempDir, `screenshots_${documentId}`);
          results.screenshots = await this.getScreenshot(filePath, screenshotPath, options.screenshots);
        }

        // Extract images if requested
        if (options.images) {
          console.log('Extracting images...');
          const imagePath = path.join(this.tempDir, `images_${documentId}`);
          results.images = await this.getImages(filePath, imagePath, options.images);
        }

        // Extract tables if requested
        if (options.tables) {
          console.log('Extracting tables...');
          const tablePath = path.join(this.tempDir, `tables_${documentId}`);
          results.tables = await this.getTables(filePath, tablePath, options.tables);
        }

        results.processingTime = Date.now() - startTime;

        // Store results in database
        const processingResultId = await client.query(
          'SELECT store_cli_processing_results($1, $2, $3, $4, $5, $6) as processing_result_id',
          [
            documentId,
            results.text.text || '',
            {
              info: results.info,
              screenshots: results.screenshots,
              images: results.images,
              tables: results.tables
            },
            '2.4.5', // CLI version
            JSON.stringify(options),
            results.processingTime
          ]
        );

        // Extract and store structured information
        const text = results.text.text || '';
        const extractedInfo = this.extractStructuredInfo(text);

        if (extractedInfo.name || extractedInfo.email || extractedInfo.phone) {
          await client.query(
            'SELECT store_extracted_document_info($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
            [
              documentId,
              processingResultId.rows[0].processing_result_id,
              extractedInfo.name,
              extractedInfo.email,
              extractedInfo.phone,
              extractedInfo.address,
              extractedInfo.jobTitle,
              extractedInfo.company,
              JSON.stringify(extractedInfo.skills),
              extractedInfo.experienceYears,
              extractedInfo.educationLevel,
              extractedInfo.confidence.name,
              extractedInfo.confidence.email,
              extractedInfo.confidence.phone
            ]
          );
        }

        // Store assets if generated
        if (results.screenshots && results.screenshots.pages) {
          for (let i = 0; i < results.screenshots.pages.length; i++) {
            const page = results.screenshots.pages[i];
            if (page.dataUrl || page.buffer) {
              await client.query(
                'SELECT store_document_asset($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                [
                  documentId,
                  'screenshot',
                  'png',
                  page.dataUrl ? null : page.filePath,
                  page.dataUrl ? page.dataUrl.length : page.size,
                  i + 1,
                  page.width,
                  page.height,
                  JSON.stringify(options.screenshots || {}),
                  page.processingTime || 0
                ]
              );
            }
          }
        }

        await client.query('COMMIT');

        console.log(`Document ${documentId} processed successfully in ${results.processingTime}ms`);
        return results;

      } catch (processingError) {
        await client.query('ROLLBACK');
        
        // Update status to failed
        await client.query(
          'SELECT update_document_processing_status($1, $2, $3)',
          [documentId, 'failed', processingError.message]
        );

        throw processingError;
      }

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Extract structured information from text
   */
  extractStructuredInfo(text) {
    const result = {
      name: null,
      email: null,
      phone: null,
      address: null,
      jobTitle: null,
      company: null,
      skills: [],
      experienceYears: null,
      educationLevel: null,
      confidence: {
        name: 0.0,
        email: 0.0,
        phone: 0.0
      }
    };

    // Extract email
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) {
      result.email = emailMatch[0];
      result.confidence.email = 0.9;
    }

    // Extract phone number
    const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
      result.phone = phoneMatch[0];
      result.confidence.phone = 0.8;
    }

    // Extract name (simplified)
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length < 50 && /^[A-Za-z\s\.]+$/.test(firstLine)) {
        result.name = firstLine;
        result.confidence.name = 0.7;
      }
    }

    // Extract skills
    const commonSkills = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#',
      'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes',
      'Git', 'Linux', 'Angular', 'Vue.js', 'Express', 'Django', 'Flask', 'Spring Boot'
    ];

    result.skills = commonSkills.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    ).map(skill => ({ name: skill, category: 'technical' }));

    return result;
  }
}

export default PDFParseCLIService;
