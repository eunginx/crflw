import React from 'react';
import { ParsedResume } from '../../types/resume';

interface AnalysisResultsProps {
  parsedResume: ParsedResume | null;
  analysis: any; // ResumeAnalysisService result
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  parsedResume,
  analysis
}) => {
  if (!parsedResume && !analysis) {
    return null;
  }

  return (
    <>
      {/* PDF Processing Results */}
      {parsedResume && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-4">PDF Processing Results (pdf-parse v2)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white border border-blue-200 rounded-lg p-3">
              <h4 className="text-md font-medium text-blue-800 mb-2">Document Information</h4>
              <p className="text-sm text-gray-600">Total Pages: {parsedResume.numPages}</p>
              <p className="text-sm text-gray-600">Text Length: {parsedResume.text.length.toLocaleString()} characters</p>
              <p className="text-sm text-gray-600">Words: {parsedResume.text.split(' ').filter(w => w.length > 0).length.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Lines: {parsedResume.text.split('\n').length}</p>
            </div>
            
            <div className="bg-white border border-blue-200 rounded-lg p-3">
              <h4 className="text-md font-medium text-blue-800 mb-2">PDF Metadata</h4>
              {parsedResume.info ? (
                <>
                  <p className="text-sm text-gray-600">Title: {parsedResume.info.Title || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Author: {parsedResume.info.Author || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Creator: {parsedResume.info.Creator || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Producer: {parsedResume.info.Producer || 'N/A'}</p>
                </>
              ) : (
                <p className="text-sm text-gray-500">No metadata available</p>
              )}
            </div>
          </div>
          
          {/* PDF Preview Image */}
          <div className="mb-4">
            <h4 className="text-md font-medium text-blue-800 mb-2">Resume Preview (Page 1)</h4>
            <div className="bg-white border border-blue-200 rounded-lg p-3">
              <img
                src={`data:image/png;base64,${parsedResume.previewImageBase64}`}
                alt="Resume Preview"
                className="max-w-full h-auto border border-gray-300 rounded"
                style={{ maxHeight: '400px' }}
              />
              <p className="text-xs text-blue-600 mt-2">
                Preview generated using pdf-parse v2 with 1.5x scale
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-blue-800 mb-2">Extracted Text</h4>
            <div className="bg-white border border-blue-200 rounded-lg p-3 max-h-64 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{parsedResume.text}</pre>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Text extracted using pdf-parse v2 getText() method
            </p>
          </div>
        </div>
      )}

      {/* Resume Analysis Results */}
      {analysis && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-medium text-green-900 mb-4">Resume Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white border border-green-200 rounded-lg p-3">
              <h4 className="text-md font-medium text-green-800 mb-2">Contact Information</h4>
              <p className="text-sm text-gray-600">Name: {analysis.name || 'Not found'}</p>
              <p className="text-sm text-gray-600">Email: {analysis.email || 'Not found'}</p>
              <p className="text-sm text-gray-600">Phone: {analysis.phone || 'Not found'}</p>
              <p className="text-sm text-gray-600">LinkedIn: {analysis.linkedin || 'Not found'}</p>
              <p className="text-sm text-gray-600">GitHub: {analysis.github || 'Not found'}</p>
            </div>
            
            <div className="bg-white border border-green-200 rounded-lg p-3">
              <h4 className="text-md font-medium text-green-800 mb-2">Quality Score</h4>
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Overall Score</span>
                  <span className="text-sm font-bold text-green-600">{analysis.qualityScore.overall}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${analysis.qualityScore.overall}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-gray-600">Word Count: {analysis.qualityScore.wordCount.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Skills Found: {analysis.skills.length}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white border border-green-200 rounded-lg p-3">
              <h4 className="text-md font-medium text-green-800 mb-2">Sections Detected</h4>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  {analysis.sections.experience ? '✅' : '❌'} Experience
                </p>
                <p className="text-sm text-gray-600">
                  {analysis.sections.education ? '✅' : '❌'} Education
                </p>
                <p className="text-sm text-gray-600">
                  {analysis.sections.skills ? '✅' : '❌'} Skills
                </p>
                <p className="text-sm text-gray-600">
                  {analysis.sections.projects ? '✅' : '❌'} Projects
                </p>
                <p className="text-sm text-gray-600">
                  {analysis.sections.summary ? '✅' : '❌'} Summary
                </p>
              </div>
            </div>
            
            <div className="bg-white border border-green-200 rounded-lg p-3">
              <h4 className="text-md font-medium text-green-800 mb-2">Skills ({analysis.skills.length})</h4>
              <div className="flex flex-wrap gap-1">
                {analysis.skills.map((skill: string, index: number) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Missing Information & Suggestions */}
          {(analysis.qualityScore.missingContactInfo.length > 0 || 
            analysis.qualityScore.missingSections.length > 0 || 
            analysis.qualityScore.suggestions.length > 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="text-md font-medium text-yellow-800 mb-2">Recommendations</h4>
              
              {analysis.qualityScore.missingContactInfo.length > 0 && (
                <div className="mb-2">
                  <p className="text-sm font-medium text-yellow-700">Missing Contact Info:</p>
                  <p className="text-sm text-gray-600">{analysis.qualityScore.missingContactInfo.join(', ')}</p>
                </div>
              )}
              
              {analysis.qualityScore.missingSections.length > 0 && (
                <div className="mb-2">
                  <p className="text-sm font-medium text-yellow-700">Missing Sections:</p>
                  <p className="text-sm text-gray-600">{analysis.qualityScore.missingSections.join(', ')}</p>
                </div>
              )}
              
              {analysis.qualityScore.suggestions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-yellow-700">Suggestions:</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {analysis.qualityScore.suggestions.map((suggestion: string, index: number) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AnalysisResults;
