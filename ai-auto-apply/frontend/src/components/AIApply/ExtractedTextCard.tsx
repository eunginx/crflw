import React, { useState } from 'react';
import { DocumentTextIcon, ClipboardDocumentIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface ExtractedTextCardProps {
  text?: string;
  textLength?: number;
  filename?: string;
}

const ExtractedTextCard: React.FC<ExtractedTextCardProps> = ({
  text,
  textLength,
  filename
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!text) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-3 text-lg font-semibold text-gray-900">Extracted Text</h3>
          <p className="mt-2 text-sm text-gray-600">
            No text extracted yet. Process your resume to extract text content.
          </p>
        </div>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const previewText = isExpanded ? text : text.slice(0, 500);
  const shouldShowMore = text.length > 500;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Extracted Text</h3>
          <p className="text-sm text-gray-600 mt-1">
            {filename && `From: ${filename}`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {textLength?.toLocaleString()} characters
          </span>
          <button
            onClick={handleCopy}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Copy text"
          >
            <ClipboardDocumentIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700 leading-relaxed max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap">{previewText}</pre>
        </div>
        
        {shouldShowMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {isExpanded ? (
              <>
                <ChevronUpIcon className="h-4 w-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-4 w-4 mr-1" />
                Show More ({text.length - 500} more characters)
              </>
            )}
          </button>
        )}
      </div>

      {copied && (
        <div className="mt-3 text-sm text-green-600 font-medium">
          Text copied to clipboard!
        </div>
      )}
    </div>
  );
};

export default ExtractedTextCard;
