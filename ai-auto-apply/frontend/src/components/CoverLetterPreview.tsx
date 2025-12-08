import React, { useState } from 'react';
import JSON5 from 'json5';
import { parser } from 'stream-json';
import { streamValues } from 'stream-json/streamers/StreamValues';
import { Readable } from 'stream';

interface CoverLetterPreviewProps {
  coverLetter: string;
  isLoading?: boolean;
}

interface StreamData {
  value: any;
}

const CoverLetterPreview: React.FC<CoverLetterPreviewProps> = ({ 
  coverLetter, 
  isLoading = false 
}) => {
  const [copied, setCopied] = useState(false);
  const [copyFormat, setCopyFormat] = useState<'clean' | 'email' | 'html'>('clean');
  const [processedCoverLetter, setProcessedCoverLetter] = useState<string>('');

  // Streaming JSON parser using stream-json library
  const parseStreamingJSON = async (jsonString: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      console.log('🔄 Using stream-json for parsing...');
      
      let result: any = null;
      const chunks = jsonString;
      
      try {
        // Create a readable stream from the JSON string
        const stream = Readable.from([chunks]);
        
        // Pipeline: stream -> parser -> streamValues -> collect
        const pipeline = stream
          .pipe(parser())
          .pipe(streamValues());
        
        // Collect the parsed data
        pipeline.on('data', (data: StreamData) => {
          console.log('🔍 Stream data received:', data);
          if (data && data.value) {
            result = data.value;
          }
        });
        
        pipeline.on('end', () => {
          console.log('✅ Stream parsing completed:', result);
          resolve(result);
        });
        
        pipeline.on('error', (error: Error) => {
          console.error('❌ Stream parsing error:', error);
          reject(error);
        });
        
      } catch (error: any) {
        console.error('❌ Stream setup error:', error);
        reject(error);
      }
    });
  };

  // Robust JSON parser using multiple methods
  const parseJSON = async (text: string): Promise<any> => {
    try {
      // Try stream-json first for streaming data
      console.log('🔄 Attempting stream-json parsing...');
      const result = await parseStreamingJSON(text);
      if (result) return result;
    } catch (e) {
      console.error('stream-json parse failed:', e);
    }
    
    try {
      // Fallback to JSON5
      console.log('🔄 Falling back to JSON5...');
      return JSON5.parse(text);
    } catch (e) {
      console.error('JSON5 parse failed:', e);
      
      // Final fallback: try standard JSON.parse
      try {
        console.log('🔄 Falling back to standard JSON...');
        return JSON.parse(text);
      } catch (e2) {
        console.error('Standard JSON parse also failed:', e2);
        return null;
      }
    }
  };

  // Enhanced text extraction using streaming JSON
  const extractCoverLetterText = async (input: string): Promise<string> => {
    if (!input) return '';
    
    console.log('🔍 Raw input:', input.substring(0, 200));
    console.log('🔍 Input type:', typeof input);
    console.log('🔍 Input length:', input.length);
    console.log('🔍 Using streaming JSON parsing');
    
    // Check if input looks like JSON
    const isJsonLike = input.trim().startsWith('{') && input.trim().endsWith('}');
    console.log('🔍 Is JSON-like:', isJsonLike);
    
    if (isJsonLike) {
      // Try to parse using streaming methods
      const parsed = await parseJSON(input);
      
      if (parsed && typeof parsed === 'object') {
        console.log('✅ JSON parsed successfully');
        console.log('🔍 Parsed keys:', Object.keys(parsed));
        
        // Extract cover letter from various possible keys
        const possibleKeys = ['coverLetter', 'cover_letter', 'coverletter', 'content', 'text', 'body'];
        
        for (const key of possibleKeys) {
          if (parsed[key] && typeof parsed[key] === 'string') {
            console.log(`✅ Found cover letter in key: ${key}`);
            console.log('🔍 Extracted text preview:', parsed[key].substring(0, 100));
            return parsed[key];
          }
        }
        
        console.log('❌ No cover letter key found in parsed JSON');
        console.log('🔍 Parsed object:', parsed);
      } else {
        console.log('❌ JSON parsing failed, parsed result:', parsed);
      }
    }
    
    // If JSON parsing failed, try regex extraction
    console.log('🔍 Trying regex extraction...');
    
    // Multiple regex patterns for different JSON formats
    const patterns = [
      /"coverLetter"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/,
      /"cover_letter"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/,
      /"coverletter"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/,
      /"content"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/,
      /"text"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/,
      /"body"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/
    ];
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = input.match(pattern);
      if (match && match[1]) {
        console.log(`✅ Regex extraction successful with pattern ${i + 1}`);
        console.log('🔍 Matched text preview:', match[1].substring(0, 100));
        return match[1];
      }
    }
    
    console.log('❌ Could not extract cover letter, using original text');
    console.log('🔍 Returning original text preview:', input.substring(0, 100));
    return input;
  };

  // Process cover letter immediately when prop changes
  React.useEffect(() => {
    console.log('🔄 useEffect triggered with coverLetter:', !!coverLetter);
    console.log('🔄 coverLetter length:', coverLetter?.length || 0);
    console.log('🔄 coverLetter preview:', coverLetter?.substring(0, 100) || 'empty');
    
    if (coverLetter) {
      console.log('🔄 Processing cover letter prop change...');
      processCoverLetterAsync(coverLetter);
    } else {
      console.log('🔄 No cover letter, clearing processed state');
      setProcessedCoverLetter('');
    }
  }, [coverLetter]);

  // Async processing function
  const processCoverLetterAsync = async (rawText: string) => {
    try {
      const processed = await getCleanCoverLetter(rawText);
      console.log('🔄 Processed result preview:', processed.substring(0, 100));
      setProcessedCoverLetter(processed);
      console.log('✅ Cover letter processed and set');
    } catch (error) {
      console.error('❌ Error processing cover letter:', error);
      setProcessedCoverLetter(rawText); // Fallback to raw text
    }
  };

  // Parse and clean the cover letter text (now async)
  const getCleanCoverLetter = async (rawText: string): Promise<string> => {
    if (!rawText) return '';
    
    console.log('🔍 Starting cover letter processing...');
    
    // Extract the cover letter text
    let cleanText = await extractCoverLetterText(rawText);
    
    console.log('🔍 Text before cleanup:', cleanText.substring(0, 200));
    
    // Clean up escape sequences and formatting
    cleanText = cleanText
      .replace(/\\n/g, '\n') // Convert escape sequences to actual line breaks
      .replace(/\\t/g, ' ') // Convert tab escapes to spaces
      .replace(/\\"/g, '"') // Fix escaped quotes
      .replace(/\\'/g, "'") // Fix escaped single quotes
      .replace(/\\\\/g, '\\') // Fix double backslashes
      .replace(/\n{3,}/g, '\n\n') // Remove excessive empty lines
      .replace(/^\s+|\s+$/g, '') // Trim leading/trailing whitespace
      .replace(/[^\x20-\x7E\n\r\t]/g, '') // Remove non-ASCII characters except basic whitespace
      .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
      .trim();

    console.log('✅ Clean text result:', cleanText.substring(0, 200));

    return cleanText;
  };

  const cleanCoverLetter = processedCoverLetter;

  // Get different formats for copying
  const getCopyContent = (format: 'clean' | 'email' | 'html'): string => {
    switch (format) {
      case 'email':
        // Email format - more compact
        return cleanCoverLetter
          .split('\n\n')
          .map(p => p.replace(/\n/g, ' ').trim())
          .join('\n\n');
      
      case 'html':
        // HTML format - wrapped in basic HTML
        const paragraphs = cleanCoverLetter.split('\n\n');
        return paragraphs
          .map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`)
          .join('\n');
      
      case 'clean':
      default:
        return cleanCoverLetter;
    }
  };

  const handleCopy = async (format?: 'clean' | 'email' | 'html') => {
    const selectedFormat = format || copyFormat;
    const content = getCopyContent(selectedFormat);
    
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Show success feedback
      console.log(`✅ Copied ${selectedFormat} format to clipboard`);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      
      // Fallback: create temporary textarea
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy also failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleDownload = () => {
    const content = getCopyContent('clean');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cover-letter.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/5"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!cleanCoverLetter) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
          <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-500">No cover letter generated yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-5 w-5 text-blue-500 mr-2">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Cover Letter Preview</h3>
          </div>
          <div className="flex items-center space-x-2">
            {/* Format selector */}
            <select 
              value={copyFormat} 
              onChange={(e) => setCopyFormat(e.target.value as 'clean' | 'email' | 'html')}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="clean">Clean</option>
              <option value="email">Email</option>
              <option value="html">HTML</option>
            </select>
            
            {/* Copy button */}
            <button 
              onClick={() => handleCopy()}
              className="flex items-center px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              {copied ? (
                <>
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy {copyFormat}
                </>
              )}
            </button>

            {/* Download button */}
            <button 
              onClick={handleDownload}
              className="flex items-center px-3 py-1.5 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="prose prose-sm max-w-none">
          {cleanCoverLetter.split('\n\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-gray-700 leading-relaxed">
              {paragraph.trim()}
            </p>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Ready to copy and paste</span>
            <span>•</span>
            <span>{cleanCoverLetter.length} characters</span>
            <span>•</span>
            <span>{cleanCoverLetter.split('\n\n').length} paragraphs</span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => handleCopy('clean')}
              className="text-blue-500 hover:text-blue-600"
            >
              Copy Clean
            </button>
            <button 
              onClick={() => handleCopy('email')}
              className="text-blue-500 hover:text-blue-600"
            >
              Copy Email
            </button>
            <button 
              onClick={() => handleCopy('html')}
              className="text-blue-500 hover:text-blue-600"
            >
              Copy HTML
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterPreview;
