import React, { useState, useEffect } from 'react';
import { DocumentManagementService } from '../services/documentManagementService';

interface DocumentPreviewProps {
  documentId: string;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ documentId }) => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        setLoading(true);
        const documentAssets = await DocumentManagementService.getDocumentAssets(documentId, 'screenshot');
        setAssets(documentAssets);
        setError(null);
      } catch (err) {
        setError('Failed to load document preview');
        console.error('Error loading document assets:', err);
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      loadAssets();
    }
  }, [documentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-gray-500">Loading preview...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-gray-500">No preview available - process document to generate preview</div>
      </div>
    );
  }

  // Display the first screenshot (usually page 1)
  const firstScreenshot = assets[0];

  return (
    <div className="space-y-4">
      {firstScreenshot && (
        <div className="relative">
          {firstScreenshot.filePath ? (
            // If we have a file path, display it as an image
            <img
              src={`${process.env.REACT_APP_API_URL}/api/documents/assets/${firstScreenshot.id}/download`}
              alt="Document Preview"
              className="max-w-full h-auto border border-gray-300 rounded"
              style={{ maxHeight: '400px' }}
              onError={(e) => {
                console.error('Failed to load preview image:', e);
                setError('Failed to load preview image');
              }}
            />
          ) : (
            // If no file path, show placeholder
            <div className="bg-gray-100 border border-gray-300 rounded p-8 text-center">
              <div className="text-sm text-gray-500">Preview image not available</div>
            </div>
          )}
          
          <div className="mt-2 text-xs text-gray-500">
            Page {firstScreenshot.pageNumber || 1} • 
            {firstScreenshot.width && firstScreenshot.height && 
              ` ${firstScreenshot.width}x${firstScreenshot.height}px`
            } • 
            Generated in {firstScreenshot.generationTimeMs || 0}ms
          </div>
        </div>
      )}
      
      {/* If there are multiple pages, show thumbnails */}
      {assets.length > 1 && (
        <div className="mt-4">
          <div className="text-sm text-gray-600 mb-2">All Pages ({assets.length}):</div>
          <div className="flex flex-wrap gap-2">
            {assets.map((asset, index) => (
              <div key={asset.id} className="border border-gray-200 rounded p-1 bg-gray-50">
                <div className="text-xs text-gray-500">Page {asset.pageNumber || index + 1}</div>
                {asset.filePath && (
                  <img
                    src={`${process.env.REACT_APP_API_URL}/api/documents/assets/${asset.id}/download`}
                    alt={`Page ${asset.pageNumber || index + 1}`}
                    className="w-16 h-20 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentPreview;
