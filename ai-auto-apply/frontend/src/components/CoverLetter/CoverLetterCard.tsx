import React from 'react';
import { 
  DocumentTextIcon, 
  SparklesIcon, 
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useCoverLetter } from './useCoverLetter';

interface CoverLetterCardProps {
  resumeIntelligence?: any;
  selectedJob?: any;
  ollamaBaseUrl?: string;
  extractedText?: string; // Add extracted text prop
}

const CoverLetterCard: React.FC<CoverLetterCardProps> = ({ 
  resumeIntelligence, 
  selectedJob,
  ollamaBaseUrl,
  extractedText 
}) => {
  const {
    content,
    isGenerating,
    error,
    tone,
    generateCoverLetter,
    regenerateCoverLetter,
    copyToClipboard,
    downloadAsText,
    setTone,
    hasContent,
    canGenerate
  } = useCoverLetter({ resumeIntelligence, selectedJob, ollamaBaseUrl, extractedText });

  const toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'enthusiastic', label: 'Enthusiastic' },
    { value: 'technical', label: 'Technical' },
    { value: 'concise', label: 'Concise' }
  ] as const;

  if (!canGenerate) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <DocumentTextIcon className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Cover Letter Generator</h3>
        </div>

        <div className="text-center py-8">
          <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Complete Resume Analysis First</p>
          <p className="text-gray-500 text-sm">
            Analyze your resume and select a job to generate personalized cover letters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <DocumentTextIcon className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Cover Letter Generator</h3>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
          AI-Powered
        </span>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Tone Style Dropdown */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tone Style
        </label>
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value as typeof tone)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {toneOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Generate Cover Letter Button */}
      <div className="mb-6">
        <button
          onClick={() => generateCoverLetter(tone)}
          disabled={isGenerating}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <SparklesIcon className="w-4 h-4 animate-spin" />
              Generating Cover Letter...
            </>
          ) : (
            <>
              <SparklesIcon className="w-4 h-4" />
              Generate Cover Letter
            </>
          )}
        </button>
      </div>

      {/* AI Streaming Preview Box */}
      {(hasContent || isGenerating) && (
        <div className="mb-4">
          <div className="border border-gray-200 rounded-lg">
            <div className="p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {isGenerating ? 'Generating...' : 'Cover Letter Preview'}
                </span>
                {selectedJob && (
                  <span className="text-xs text-gray-500">
                    For {selectedJob.title} at {selectedJob.company}
                  </span>
                )}
              </div>
              
              {/* Content Display */}
              <div className="bg-white border border-gray-100 rounded p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
                {isGenerating && !content ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-serif leading-relaxed">
                    {content || ''}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {hasContent && (
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Copy to Clipboard"
          >
            <ClipboardDocumentIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={regenerateCoverLetter}
            disabled={isGenerating}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Regenerate"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={downloadAsText}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Download"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CoverLetterCard;
