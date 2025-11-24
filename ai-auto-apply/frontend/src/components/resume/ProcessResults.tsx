import React from 'react';
import { ProcessedResume, UnifiedResumeResult } from '../../types/resume';
import DocumentPreview from '../DocumentPreview';

interface ProcessResultsProps {
  processedResume: ProcessedResume | null;
  unifiedResult: UnifiedResumeResult | null;
  screenshotUrl: string | null;
  activeResume: any; // Using any for now since it comes from DocumentManagementService
}

const ProcessResults: React.FC<ProcessResultsProps> = ({
  processedResume,
  unifiedResult,
  screenshotUrl,
  activeResume
}) => {
  if (!processedResume && !unifiedResult) {
    return null;
  }

  const result = unifiedResult || processedResume;

  if (!result) return null;

  return (
    <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <h3 className="text-lg font-medium text-purple-900 mb-4">Processed Resume Results</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-purple-200 rounded-lg p-3">
          <h4 className="text-md font-medium text-purple-800 mb-2">File Information</h4>
          <p className="text-sm text-gray-600">Filename: {processedResume?.filename || 'Unknown'}</p>
          <p className="text-sm text-gray-600">
            Text Length: {(result.text?.length || 0).toLocaleString()} characters
          </p>
          {processedResume?.processedAt && (
            <p className="text-sm text-gray-600">
              Processed: {new Date(processedResume.processedAt).toLocaleString()}
            </p>
          )}
          {unifiedResult?.processingTime && (
            <p className="text-sm text-gray-600">
              Processing Time: {unifiedResult.processingTime}ms
            </p>
          )}
        </div>
        
        <div className="bg-white border border-purple-200 rounded-lg p-3">
          <h4 className="text-md font-medium text-purple-800 mb-2">PDF Metadata</h4>
          {result.metadata ? (
            <>
              <p className="text-sm text-gray-600">Total Pages: {result.metadata.totalPages}</p>
              <p className="text-sm text-gray-600">Title: {result.metadata.title || 'N/A'}</p>
              <p className="text-sm text-gray-600">Author: {result.metadata.author || 'N/A'}</p>
              <p className="text-sm text-gray-600">Creator: {result.metadata.creator || 'N/A'}</p>
            </>
          ) : (
            <p className="text-sm text-gray-500">No metadata available</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-purple-200 rounded-lg p-3">
          <h4 className="text-md font-medium text-purple-800 mb-2">Resume Statistics</h4>
          {unifiedResult?.stats ? (
            <>
              <p className="text-sm text-gray-600">Words: {unifiedResult.stats.wordCount.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Lines: {unifiedResult.stats.lineCount}</p>
              <p className="text-sm text-gray-600">Est. Pages: {unifiedResult.stats.pageCount}</p>
              <p className="text-sm text-gray-600">Characters: {unifiedResult.stats.characterCount.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Paragraphs: {unifiedResult.stats.paragraphCount}</p>
            </>
          ) : (
            <p className="text-sm text-gray-500">Statistics not available</p>
          )}
        </div>
        
        <div className="bg-white border border-purple-200 rounded-lg p-3">
          <h4 className="text-md font-medium text-purple-800 mb-2">Extracted Information</h4>
          {unifiedResult?.extractedInfo ? (
            <>
              <p className="text-sm text-gray-600">Name: {unifiedResult.extractedInfo.name || 'N/A'}</p>
              <p className="text-sm text-gray-600">Email: {unifiedResult.extractedInfo.email || 'N/A'}</p>
              <p className="text-sm text-gray-600">Phone: {unifiedResult.extractedInfo.phone || 'N/A'}</p>
              <p className="text-sm text-gray-600">Skills: {unifiedResult.extractedInfo.skills.length} found</p>
              {unifiedResult.extractedInfo.linkedin && (
                <p className="text-sm text-gray-600">LinkedIn: {unifiedResult.extractedInfo.linkedin}</p>
              )}
              {unifiedResult.extractedInfo.github && (
                <p className="text-sm text-gray-600">GitHub: {unifiedResult.extractedInfo.github}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">Extracted information not available</p>
          )}
        </div>
      </div>
      
      {/* Resume Screenshot */}
      {(screenshotUrl || unifiedResult?.previewImage) && (
        <div className="mb-4">
          <h4 className="text-md font-medium text-purple-800 mb-2">Resume Screenshot</h4>
          <div className="bg-white border border-purple-200 rounded-lg p-3">
            <img 
              src={screenshotUrl || unifiedResult?.previewImage} 
              alt="Resume Screenshot" 
              className="max-w-full h-auto border border-gray-300 rounded"
              style={{ maxHeight: '400px' }}
            />
            <p className="text-xs text-purple-600 mt-2">
              {screenshotUrl ? 'Screenshot of the first page of your resume' : 'Preview generated using PDF processing'}
            </p>
          </div>
        </div>
      )}

      {/* PNG Preview Section - CLI Generated */}
      {activeResume && (
        <div className="mb-4">
          <h4 className="text-md font-medium text-purple-800 mb-2">Document Preview (CLI Generated)</h4>
          <div className="bg-white border border-purple-200 rounded-lg p-3">
            <DocumentPreview documentId={activeResume.id} />
            <p className="text-xs text-purple-600 mt-2">
              Preview generated using pdf-parse CLI with 1.5x scale
            </p>
          </div>
        </div>
      )}

      {/* Extracted Text */}
      {result.text && (
        <div>
          <h4 className="text-md font-medium text-purple-800 mb-2">Extracted Text</h4>
          <div className="bg-white border border-purple-200 rounded-lg p-3 max-h-64 overflow-y-auto">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{result.text}</pre>
          </div>
          <p className="text-xs text-purple-600 mt-2">
            {unifiedResult ? 'Text extracted using unified processing pipeline' : 'Text extracted using pdf-parse CLI with advanced features'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProcessResults;
