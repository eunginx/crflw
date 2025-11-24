import React from 'react';

interface DocumentInfoCardProps {
  filename: string;
  uploadedAt: string;
  fileSize: number;
  originalFilename: string;
}

const DocumentInfoCard: React.FC<DocumentInfoCardProps> = ({
  filename,
  uploadedAt,
  fileSize,
  originalFilename
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          <span className="text-blue-600 text-lg">📄</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Document Information</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">📄</span>
            <span className="text-sm font-medium text-gray-600">Filename</span>
          </div>
          <span className="text-sm text-gray-900 font-mono">{originalFilename}</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">💾</span>
            <span className="text-sm font-medium text-gray-600">File Size</span>
          </div>
          <span className="text-sm text-gray-900">{formatFileSize(fileSize)}</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">📅</span>
            <span className="text-sm font-medium text-gray-600">Uploaded</span>
          </div>
          <span className="text-sm text-gray-900">{formatDate(uploadedAt)}</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">👤</span>
            <span className="text-sm font-medium text-gray-600">Stored As</span>
          </div>
          <span className="text-sm text-gray-900 font-mono text-xs">{filename}</span>
        </div>
      </div>
    </div>
  );
};

export default DocumentInfoCard;
