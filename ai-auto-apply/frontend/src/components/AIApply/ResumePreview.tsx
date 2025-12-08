import React from 'react';
import { EyeIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface ResumePreviewProps {
  screenshotUrl?: string | null;
  screenshotPaths?: string[] | null;
  filename?: string;
  totalPages?: number;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({
  screenshotUrl,
  screenshotPaths,
  filename,
  totalPages
}) => {
  console.log('🖼️ ResumePreview DEBUG - Props received:', { 
    screenshotUrl, 
    screenshotPaths,
    filename, 
    totalPages,
    screenshotUrlType: typeof screenshotUrl,
    screenshotUrlLength: screenshotUrl?.length,
    screenshotPathsCount: screenshotPaths?.length
  });
  
  // Use screenshotPaths if available, otherwise fall back to screenshotUrl
  const allScreenshots = screenshotPaths || (screenshotUrl ? [screenshotUrl] : []);
  
  // Convert full paths to URLs
  const screenshotUrls = allScreenshots.map(path => {
    if (path.startsWith('http')) {
      return path; // Already a URL
    }
    // Extract filename from full path and construct URL
    const filename = path.split('/').pop();
    return `http://localhost:8000/api/documents/screenshots/${filename}`;
  });
  
  console.log('🖼️ ResumePreview DEBUG - URL construction:', {
    originalPaths: allScreenshots,
    constructedUrls: screenshotUrls
  });
  
  if (allScreenshots.length === 0) {
    console.log('🖼️ ResumePreview DEBUG - No screenshots provided, showing placeholder');
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

  console.log('🖼️ ResumePreview DEBUG - Rendering with screenshots:', allScreenshots.length);

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
        {/* Show only the first page in the main UI */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 text-center">
            Page 1 of {screenshotUrls.length}
          </div>
          <div className="relative">
            <img
              src={screenshotUrls[0]}
              alt={`${filename || 'resume'} - Page 1`}
              className="w-full h-auto rounded-lg border border-gray-200 shadow-sm"
              onError={(e) => {
                console.error('Failed to load screenshot:', e);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>
        
        {filename && (
          <div className="text-sm text-gray-600 text-center">
            <span className="font-medium">{filename}</span>
          </div>
        )}
        
        {/* Show buttons for all pages */}
        <div className="flex justify-center space-x-4 text-sm">
          {screenshotUrls.map((url, index) => (
            <button
              key={index}
              onClick={() => window.open(url, '_blank')}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center"
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              View Page {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
