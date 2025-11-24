import React from 'react';
import { EyeIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface ResumePreviewProps {
  screenshotUrl?: string | null;
  filename?: string;
  totalPages?: number;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({
  screenshotUrl,
  filename,
  totalPages
}) => {
  if (!screenshotUrl) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-3 text-lg font-semibold text-gray-900">Resume Preview</h3>
          <p className="mt-2 text-sm text-gray-600">
            No preview available. Process your resume to generate a preview.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Resume Preview</h3>
        <div className="flex items-center text-sm text-gray-500">
          <EyeIcon className="h-4 w-4 mr-1" />
          {totalPages ? `${totalPages} pages` : 'PDF'}
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="relative">
          <img
            src={screenshotUrl}
            alt={`Preview of ${filename || 'resume'}`}
            className="w-full h-auto rounded-lg border border-gray-200 shadow-sm"
            onError={(e) => {
              console.error('Failed to load screenshot:', e);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        
        {filename && (
          <div className="text-sm text-gray-600 text-center">
            <span className="font-medium">{filename}</span>
          </div>
        )}
        
        <div className="flex justify-center space-x-4 text-sm">
          <button
            onClick={() => window.open(screenshotUrl, '_blank')}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View Full Size
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
