import React, { useState } from 'react';
import { OCRService } from '../../services/ocrService';

const OCRTestComponent: React.FC<{ documentId?: string }> = ({ documentId }) => {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runOCRHealthCheck = async () => {
    console.log('🧪 === OCR HEALTH CHECK TEST START ===');
    setLoading(true);
    setError(null);
    setTestResults(null);
    
    try {
      const result = await OCRService.checkHealth();
      console.log('🧪 OCR Health Check Result:', result);
      setTestResults({ type: 'health', result });
    } catch (err: any) {
      console.error('🧪 OCR Health Check Error:', err);
      setError(err.message || 'Health check failed');
    } finally {
      setLoading(false);
      console.log('🧪 === OCR HEALTH CHECK TEST END ===');
    }
  };

  const runOCRTest = async () => {
    console.log('🧪 === OCR SERVICE TEST START ===');
    setLoading(true);
    setError(null);
    setTestResults(null);
    
    try {
      const result = await OCRService.testOCR();
      console.log('🧪 OCR Service Test Result:', result);
      setTestResults({ type: 'service', result });
    } catch (err: any) {
      console.error('🧪 OCR Service Test Error:', err);
      setError(err.message || 'Service test failed');
    } finally {
      setLoading(false);
      console.log('🧪 === OCR SERVICE TEST END ===');
    }
  };

  const runOCRResumeTest = async () => {
    if (!documentId) {
      setError('No document ID available for testing');
      return;
    }

    console.log('🧪 === OCR RESUME TEST START ===');
    setLoading(true);
    setError(null);
    setTestResults(null);
    
    try {
      const result = await OCRService.extractResume({
        documentId,
        pageNumber: 1
      });
      console.log('🧪 OCR Resume Test Result:', result);
      setTestResults({ type: 'resume', result });
    } catch (err: any) {
      console.error('🧪 OCR Resume Test Error:', err);
      setError(err.message || 'Resume OCR test failed');
    } finally {
      setLoading(false);
      console.log('🧪 === OCR RESUME TEST END ===');
    }
  };

  const runOCRPDFTest = async () => {
    if (!documentId) {
      setError('No document ID available for testing');
      return;
    }

    console.log('🧪 === OCR PDF TEST START ===');
    setLoading(true);
    setError(null);
    setTestResults(null);
    
    try {
      const result = await OCRService.extractFromPDF({
        documentId,
        pageNumber: 1
      });
      console.log('🧪 OCR PDF Test Result:', result);
      setTestResults({ type: 'pdf', result });
    } catch (err: any) {
      console.error('🧪 OCR PDF Test Error:', err);
      setError(err.message || 'PDF OCR test failed');
    } finally {
      setLoading(false);
      console.log('🧪 === OCR PDF TEST END ===');
    }
  };

  const clearResults = () => {
    setTestResults(null);
    setError(null);
  };

  return (
    <div className="mb-4 p-3 bg-purple-50 rounded border border-purple-200">
      <h4 className="font-medium mb-2 text-sm">🔍 OCR Service Debug</h4>
      
      {/* Test Buttons */}
      <div className="flex gap-2 flex-wrap mb-3">
        <button 
          onClick={runOCRHealthCheck}
          disabled={loading}
          className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Health Check'}
        </button>
        <button 
          onClick={runOCRTest}
          disabled={loading}
          className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Service Test'}
        </button>
        {documentId && (
          <>
            <button 
              onClick={runOCRResumeTest}
              disabled={loading}
              className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Resume OCR'}
            </button>
            <button 
              onClick={runOCRPDFTest}
              disabled={loading}
              className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'PDF OCR'}
            </button>
          </>
        )}
        <button 
          onClick={clearResults}
          className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
        >
          Clear
        </button>
      </div>

      {/* Document ID Info */}
      {documentId && (
        <div className="text-xs mb-2 p-2 bg-purple-100 rounded">
          <strong>Document ID:</strong> {documentId}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-2 p-2 bg-red-100 border border-red-200 rounded text-xs">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results Display */}
      {testResults && (
        <div className="p-2 bg-white rounded border border-purple-200">
          <h5 className="font-medium text-xs mb-2">
            Test Results: {testResults.type}
          </h5>
          <div className="text-xs">
            {testResults.type === 'health' && (
              <div className="space-y-1">
                <p><strong>Status:</strong> {testResults.result.status}</p>
                <p><strong>Service:</strong> {testResults.result.service}</p>
                <p><strong>Model:</strong> {testResults.result.model}</p>
                <p><strong>API URL:</strong> {testResults.result.api_url}</p>
                {testResults.result.error && (
                  <p className="text-red-600"><strong>Error:</strong> {testResults.result.error}</p>
                )}
                {testResults.result.details && (
                  <p className="text-red-600"><strong>Details:</strong> {testResults.result.details}</p>
                )}
              </div>
            )}
            
            {testResults.type === 'service' && (
              <div className="space-y-1">
                <p><strong>Success:</strong> {testResults.result.success ? '✅' : '❌'}</p>
                <p><strong>Message:</strong> {testResults.result.message}</p>
                {testResults.result.details && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-blue-600">Details</summary>
                    <pre className="mt-1 p-1 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(testResults.result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            {(testResults.type === 'resume' || testResults.type === 'pdf') && (
              <div className="space-y-1">
                <p><strong>Success:</strong> {testResults.result.success ? '✅' : '❌'}</p>
                <p><strong>Document ID:</strong> {testResults.result.documentId}</p>
                <p><strong>Page Number:</strong> {testResults.result.pageNumber}</p>
                <p><strong>Processed At:</strong> {testResults.result.processed_at}</p>
                
                {testResults.result.error && (
                  <p className="text-red-600"><strong>Error:</strong> {testResults.result.error}</p>
                )}
                {testResults.result.details && (
                  <p className="text-red-600"><strong>Details:</strong> {testResults.result.details}</p>
                )}
                
                {testResults.result.extracted_data && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-blue-600">Extracted Data</summary>
                    <pre className="mt-1 p-1 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(testResults.result.extracted_data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-600 mt-2">
        <p><strong>Instructions:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Health Check:</strong> Tests if OCR service is reachable and configured</li>
          <li><strong>Service Test:</strong> Tests OCR service connectivity with a mock request</li>
          <li><strong>Resume OCR:</strong> Performs resume-specific OCR on the current document</li>
          <li><strong>PDF OCR:</strong> Performs general OCR on the current PDF document</li>
        </ul>
      </div>
    </div>
  );
};

export default OCRTestComponent;
