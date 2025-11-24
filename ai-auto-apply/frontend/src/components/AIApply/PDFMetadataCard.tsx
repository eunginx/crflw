import React from 'react';

interface PDFMetadataCardProps {
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  totalPages?: number;
  processedAt: string;
}

const PDFMetadataCard: React.FC<PDFMetadataCardProps> = ({
  title,
  author,
  creator,
  producer,
  totalPages,
  processedAt
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const metadata = [
    { label: 'Title', value: title || 'Not specified', icon: '📋' },
    { label: 'Author', value: author || 'Not specified', icon: '👤' },
    { label: 'Creator', value: creator || 'Not specified', icon: '🔧' },
    { label: 'Producer', value: producer || 'Not specified', icon: '⚙️' },
    { label: 'Total Pages', value: totalPages?.toString() || 'Unknown', icon: '📄' },
    { label: 'Processed', value: formatDate(processedAt), icon: '📆' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-50 rounded-lg">
          <span className="text-purple-600 text-lg">📋</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">PDF Metadata</h3>
      </div>

      <div className="space-y-3">
        {metadata.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">{item.icon}</span>
              <span className="text-sm font-medium text-gray-600">{item.label}</span>
            </div>
            <span className="text-sm text-gray-900 text-right max-w-xs truncate">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {(!title && !author && !creator && !producer && !totalPages) && (
        <div className="text-center py-8">
          <span className="text-gray-400 text-4xl">📋</span>
          <p className="text-gray-500 text-sm mt-2">No metadata available</p>
        </div>
      )}
    </div>
  );
};

export default PDFMetadataCard;
