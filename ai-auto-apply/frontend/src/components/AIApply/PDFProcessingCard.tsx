import React from 'react';
import { DocumentTextIcon, CpuChipIcon } from '@heroicons/react/24/outline';

interface PDFProcessingCardProps {
  processing: boolean;
  processedResume?: {
    text: string;
    textLength: number;
    filename: string;
    processedAt: string;
    metadata: {
      totalPages: number;
      title?: string;
      author?: string;
      creator?: string;
      producer?: string;
    };
  } | null;
  onProcess?: () => void;
}

const PDFProcessingCard: React.FC<PDFProcessingCardProps> = ({
  processing,
  processedResume,
  onProcess
}) => {
  if (processing) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <CpuChipIcon className="h-8 w-8 text-blue-500 animate-pulse" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Processing Resume</h3>
            <p className="text-sm text-gray-600">Extracting text and generating preview...</p>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
        
        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <p>• Analyzing document structure</p>
          <p>• Extracting text content</p>
          <p>• Generating preview image</p>
          <p>• Processing metadata</p>
        </div>
      </div>
    );
  }

  if (processedResume) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start space-x-3">
          <DocumentTextIcon className="h-8 w-8 text-green-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Resume Processed</h3>
            <p className="text-sm text-gray-600 mt-1">
              Successfully processed: <span className="font-medium">{processedResume.filename}</span>
            </p>
            
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Text Length:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {processedResume.textLength.toLocaleString()} characters
                </span>
              </div>
              <div>
                <span className="text-gray-500">Pages:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {processedResume.metadata.totalPages}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Processed:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {new Date(processedResume.processedAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Title:</span>
                <span className="ml-2 font-medium text-gray-900 truncate">
                  {processedResume.metadata.title || 'N/A'}
                </span>
              </div>
            </div>
            
            {processedResume.metadata.author && (
              <div className="mt-2 text-sm">
                <span className="text-gray-500">Author:</span>
                <span className="ml-2 font-medium text-gray-900">{processedResume.metadata.author}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="text-center">
        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto" />
        <h3 className="mt-3 text-lg font-semibold text-gray-900">Ready to Process</h3>
        <p className="mt-2 text-sm text-gray-600">
          Upload your resume to extract text and generate analysis
        </p>
        
        {onProcess && (
          <button
            onClick={onProcess}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Process Resume
          </button>
        )}
      </div>
    </div>
  );
};

export default PDFProcessingCard;
