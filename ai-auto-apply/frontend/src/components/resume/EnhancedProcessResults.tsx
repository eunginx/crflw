import React, { useState } from 'react';
import { ProcessedResume, UnifiedResumeResult } from '../../types/resume';
import DocumentPreview from '../DocumentPreview';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface EnhancedProcessResultsProps {
  processedResume: ProcessedResume | null;
  unifiedResult: UnifiedResumeResult | null;
  screenshotUrl: string | null;
  activeResume: any;
}

const EnhancedProcessResults: React.FC<EnhancedProcessResultsProps> = ({
  processedResume,
  unifiedResult,
  screenshotUrl,
  activeResume
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    metrics: false,
    metadata: true, // Default to expanded for debugging
    extractedInfo: false,
    preview: false,
    extractedText: true // Default to expanded for debugging
  });

  console.log('🔍 EnhancedProcessResults Debug:', {
    processedResume: !!processedResume,
    unifiedResult: !!unifiedResult,
    processedResumeText: processedResume?.text?.substring(0, 100),
    unifiedResultText: unifiedResult?.text?.substring(0, 100)
  });

  if (!processedResume && !unifiedResult) {
    return null;
  }

  const result = unifiedResult || processedResume;

  console.log('🔍 Result object:', {
    hasText: !!result?.text,
    textLength: result?.text?.length,
    textPreview: result?.text?.substring(0, 100)
  });

  if (!result) return null;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const SectionHeader: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    section: string; 
    isExpanded: boolean;
  }> = ({ title, icon, section, isExpanded }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center space-x-3">
        <div className="text-purple-600">{icon}</div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      {isExpanded ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
    </button>
  );

  // Generate one-line summary
  const getSummaryLine = () => {
    const pageCount = unifiedResult?.stats?.pageCount || processedResume?.metadata?.totalPages || 1;
    const skillsCount = unifiedResult?.extractedInfo?.skills?.length || 0;
    const charCount = result.text?.length || 0;
    
    return `Resume processed: ${pageCount} page${pageCount !== 1 ? 's' : ''} • ${skillsCount} skill${skillsCount !== 1 ? 's' : ''} found • ${charCount.toLocaleString()} characters`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-5 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Resume Results</h2>
          </div>
          <button
            onClick={() => {
              const hasExpanded = Object.values(expandedSections).some(Boolean);
              setExpandedSections({
                metrics: !hasExpanded,
                metadata: !hasExpanded,
                extractedInfo: !hasExpanded,
                preview: !hasExpanded,
                extractedText: !hasExpanded
              });
            }}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-1"
          >
            <span>{Object.values(expandedSections).some(Boolean) ? 'Hide' : 'View'} Details</span>
            {Object.values(expandedSections).some(Boolean) ? 
              <ChevronUpIcon className="w-4 h-4" /> : 
              <ChevronDownIcon className="w-4 h-4" />
            }
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">{getSummaryLine()}</p>
      </div>
      
      <div className="p-5 space-y-3">
        {/* Metrics Section */}
        <div>
          <SectionHeader
            title="Resume Metrics"
            icon={<ChartBarIcon className="w-5 h-5" />}
            section="metrics"
            isExpanded={expandedSections.metrics}
          />
          {expandedSections.metrics && (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-800 mb-3">File Information</h4>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Filename:</span> {processedResume?.filename || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Text Length:</span> {(result.text?.length || 0).toLocaleString()} characters
                  </p>
                  {processedResume?.processedAt && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Processed:</span> {new Date(processedResume.processedAt).toLocaleString()}
                    </p>
                  )}
                  {unifiedResult?.processingTime && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Processing Time:</span> {unifiedResult.processingTime}ms
                    </p>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-800 mb-3">Resume Statistics</h4>
                {unifiedResult?.stats ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Words:</span> {unifiedResult.stats.wordCount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Lines:</span> {unifiedResult.stats.lineCount}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Est. Pages:</span> {unifiedResult.stats.pageCount}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Characters:</span> {unifiedResult.stats.characterCount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Paragraphs:</span> {unifiedResult.stats.paragraphCount}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Statistics not available</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Metadata Section */}
        <div>
          <SectionHeader
            title="PDF Metadata"
            icon={<DocumentTextIcon className="w-5 h-5" />}
            section="metadata"
            isExpanded={expandedSections.metadata}
          />
          {expandedSections.metadata && (
            <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Total Pages:</span> {result.pdfTotalPages || result.metadata?.totalPages || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Title:</span> {result.pdfTitle || result.metadata?.title || 'N/A'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Author:</span> {result.pdfAuthor || result.metadata?.author || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Creator:</span> {result.pdfCreator || result.metadata?.creator || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Producer:</span> {result.pdfProducer || result.metadata?.producer || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Extracted Information Section */}
        <div>
          <SectionHeader
            title="Extracted Information"
            icon={<UserIcon className="w-5 h-5" />}
            section="extractedInfo"
            isExpanded={expandedSections.extractedInfo}
          />
          {expandedSections.extractedInfo && (
            <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-4">
              {unifiedResult?.extractedInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Name:</span> {unifiedResult.extractedInfo.name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Email:</span> {unifiedResult.extractedInfo.email || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Phone:</span> {unifiedResult.extractedInfo.phone || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Skills:</span> {unifiedResult.extractedInfo.skills.length} found
                    </p>
                    {unifiedResult.extractedInfo.linkedin && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">LinkedIn:</span> {unifiedResult.extractedInfo.linkedin}
                      </p>
                    )}
                    {unifiedResult.extractedInfo.github && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">GitHub:</span> {unifiedResult.extractedInfo.github}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Extracted information not available</p>
              )}
            </div>
          )}
        </div>

        {/* Preview Section */}
        <div>
          <SectionHeader
            title="Document Preview"
            icon={<EyeIcon className="w-5 h-5" />}
            section="preview"
            isExpanded={expandedSections.preview}
          />
          {expandedSections.preview && (
            <div className="mt-2 space-y-4">
              {/* Resume Screenshot */}
              {(screenshotUrl || unifiedResult?.previewImage) ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-800 mb-3">Visual Preview</h4>
                  <img 
                    src={screenshotUrl || unifiedResult?.previewImage} 
                    alt="Resume Preview" 
                    className="max-w-full h-auto border border-gray-300 rounded"
                    style={{ maxHeight: '400px' }}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {screenshotUrl ? 'Screenshot of the first page of your resume' : 'Preview generated using PDF processing'}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-800 mb-3">Visual Preview</h4>
                  <p className="text-sm text-gray-500">No preview available - process document to generate preview</p>
                </div>
              )}

              {/* Document Preview Component */}
              {activeResume && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-800 mb-3">Interactive Preview</h4>
                  <DocumentPreview documentId={activeResume.id} />
                  <p className="text-xs text-gray-500 mt-2">
                    Preview generated using pdf-parse CLI with 1.5x scale
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Extracted Text Section */}
        <div>
          <SectionHeader
            title="Extracted Text"
            icon={<DocumentTextIcon className="w-5 h-5" />}
            section="extractedText"
            isExpanded={expandedSections.extractedText}
          />
          {expandedSections.extractedText && result.text && (
            <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="max-h-64 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{result.text}</pre>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {unifiedResult ? 'Text extracted using unified processing pipeline' : 'Text extracted using pdf-parse CLI with advanced features'}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.text);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Copy Text
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedProcessResults;
