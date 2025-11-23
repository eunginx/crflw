import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { DocumentManagementService } from '../services/documentManagementService';
import DocumentPreview from '../components/DocumentPreview';
import './AIApplyPage.css';

interface ProcessedResume {
  text: string;
  textLength: number;
  filename: string;
  processedAt: string;
  screenshotPath?: string;
  textFilePath?: string;
  metadata?: {
    totalPages: number;
    title?: string;
    author?: string;
    creator?: string;
    producer?: string;
  };
}

const AIApplyPage = () => {
  const { currentUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [activeResume, setActiveResume] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processedResume, setProcessedResume] = useState<ProcessedResume | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user's resumes from PostgreSQL
  useEffect(() => {
    const loadResumes = async () => {
      if (!currentUser?.uid) return;
      
      try {
        setLoading(true);
        console.log('Loading resumes for user:', currentUser.uid);
        
        // Get all documents for the user
        const userDocuments = await DocumentManagementService.getUserDocuments(currentUser.uid);
        
        if (userDocuments.length === 0) {
          console.log('No documents found for user - this is normal for first-time users');
        }
        
        setResumes(userDocuments);
        
        // Get active document
        const active = await DocumentManagementService.getActiveDocument(currentUser.uid);
        setActiveResume(active);
        
        // If there's processed data, get the processing results
        if (active) {
          const processingResults = await DocumentManagementService.getDocumentProcessingResults(active.id);
          if (processingResults) {
            setProcessedResume({
              text: processingResults.extractedText,
              textLength: processingResults.textLength,
              filename: active.original_filename,
              processedAt: processingResults.processedAt,
              screenshotPath: processingResults.screenshotPath,
              textFilePath: processingResults.textFilePath,
              metadata: {
                totalPages: processingResults.pdfTotalPages || 0,
                title: processingResults.pdfTitle,
                author: processingResults.pdfAuthor,
                creator: processingResults.pdfCreator,
                producer: processingResults.pdfProducer
              }
            });

            // Load screenshot if available
            if (processingResults.screenshotPath) {
              await loadScreenshot();
            }
          }
        }
        
        console.log('Documents loaded:', userDocuments.length);
        console.log('Active document:', active?.original_filename);
        
      } catch (error) {
        console.error('Error loading documents:', error);
        // Don't show alert for first-time users - this is normal behavior
        // Only show alert for actual network/server errors
        if (error instanceof Error && !error.message.includes('404')) {
          console.error('Actual error loading documents (not 404):', error);
          alert('Unable to connect to document service. Please check your connection and try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadResumes();
  }, [currentUser]);

  // Load screenshot from backend
  const loadScreenshot = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/documents/resume/screenshot?userId=${currentUser.uid}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setScreenshotUrl(url);
      }
    } catch (error) {
      console.error('Error loading screenshot:', error);
    }
  };

  const handleApplyToJobs = async () => {
    if (!currentUser) return;
    
    setIsProcessing(true);
    try {
      // TODO: Implement AI apply logic
      console.log('AI Apply functionality to be implemented');
    } catch (error) {
      console.error('Error during AI apply:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      try {
        // Validate PDF file using the document service
        DocumentManagementService.validatePDFFile(selectedFile);
        setFile(selectedFile);
      } catch (error) {
        alert((error as Error).message);
        setFile(null);
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile || !currentUser) return;

    try {
      // Validate PDF file using the document service
      DocumentManagementService.validatePDFFile(selectedFile);
    } catch (error) {
      alert((error as Error).message);
      return;
    }

    setFile(selectedFile);
    setUploading(true);

    try {
      console.log('Uploading document to PostgreSQL:', selectedFile.name);
      
      // Upload to PostgreSQL with full CLI processing options
      const result = await DocumentManagementService.uploadDocument(
        selectedFile,
        currentUser.uid,
        currentUser.email || undefined,
        'resume',
        {
          text: {}, // Extract full text
          info: { parsePageInfo: true }, // Get metadata
          screenshots: { scale: 1.5, first: 1 }, // Generate preview of first page
          images: { imageThreshold: 50 }, // Extract images larger than 50px
          tables: { format: 'json' } // Extract tables as JSON
        }
      );
      
      console.log('Document uploaded successfully:', result.documentId);
      
      // Reload documents to get the latest data
      const userDocuments = await DocumentManagementService.getUserDocuments(currentUser.uid);
      setResumes(userDocuments);
      
      // Set the new document as active
      const active = await DocumentManagementService.getActiveDocument(currentUser.uid);
      setActiveResume(active);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
      
      alert('Resume uploaded successfully!');
      
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Failed to upload resume: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSetActiveResume = async (documentId: string) => {
    if (!currentUser) return;
    
    try {
      console.log('Setting active document:', documentId);
      
      const success = await DocumentManagementService.setActiveDocument(currentUser.uid, documentId);
      
      if (success) {
        // Update local state
        const document = resumes.find(d => d.id === documentId);
        if (document) {
          setActiveResume(document);
          setResumes(resumes.map(d => ({ ...d, is_active: d.id === documentId })));
          console.log('Active document set:', document.original_filename);
          
          // Load processing results for the new active document
          const processingResults = await DocumentManagementService.getDocumentProcessingResults(documentId);
          if (processingResults) {
            setProcessedResume({
              text: processingResults.extractedText,
              textLength: processingResults.textLength,
              filename: document.original_filename,
              processedAt: processingResults.processedAt,
              screenshotPath: processingResults.screenshotPath,
              textFilePath: processingResults.textFilePath,
              metadata: {
                totalPages: processingResults.pdfTotalPages || 0,
                title: processingResults.pdfTitle,
                author: processingResults.pdfAuthor,
                creator: processingResults.pdfCreator,
                producer: processingResults.pdfProducer
              }
            });

            // Load screenshot if available
            if (processingResults.screenshotPath) {
              await loadScreenshot();
            }
          } else {
            setProcessedResume(null);
            setScreenshotUrl(null);
          }
        }
      }
      
    } catch (error) {
      console.error('Error setting active document:', error);
      alert('Failed to set active document');
    }
  };

  const handleProcessResume = async () => {
    if (!activeResume || !currentUser) {
      alert('Please select an active resume first');
      return;
    }

    setProcessing(true);
    setProcessedResume(null);

    try {
      console.log('Processing document:', activeResume.original_filename);
      
      // Process document using CLI service with full options
      const result = await DocumentManagementService.processDocument(activeResume.id, {
        text: {}, // Extract full text
        info: { parsePageInfo: true }, // Get metadata
        screenshots: { scale: 1.5, first: 1 }, // Generate preview
        images: { imageThreshold: 50 }, // Extract images
        tables: { format: 'json' } // Extract tables
      });
      
      console.log('Document processed successfully:', result);
      
      // Get the processing results
      const processingResults = await DocumentManagementService.getDocumentProcessingResults(activeResume.id);
      if (processingResults) {
        setProcessedResume({
          text: processingResults.extractedText,
          textLength: processingResults.textLength,
          filename: activeResume.original_filename,
          processedAt: processingResults.processedAt,
          screenshotPath: processingResults.screenshotPath,
          textFilePath: processingResults.textFilePath,
          metadata: {
            totalPages: processingResults.pdfTotalPages || 0,
            title: processingResults.pdfTitle,
            author: processingResults.pdfAuthor,
            creator: processingResults.pdfCreator,
            producer: processingResults.pdfProducer
          }
        });

        // Load screenshot if available
        if (processingResults.screenshotPath) {
          await loadScreenshot();
        }
      }

      // Reload documents to get updated status
      const userDocuments = await DocumentManagementService.getUserDocuments(currentUser.uid);
      setResumes(userDocuments);
      
      alert('Document processed successfully!');

    } catch (error) {
      console.error('Error processing resume:', error);
      alert('Failed to process resume: ' + (error as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteResume = async (documentId: string) => {
    const document = resumes.find(d => d.id === documentId);
    if (!document || !currentUser) return;

    if (!window.confirm(`Are you sure you want to delete ${document.original_filename}?`)) {
      return;
    }

    try {
      console.log('Deleting document:', document.original_filename);
      
      const success = await DocumentManagementService.deleteDocument(documentId);
      
      if (success) {
        // Update local state
        setResumes(resumes.filter(d => d.id !== documentId));
        
        // If we deleted the active document, clear it
        if (activeResume?.id === documentId) {
          setActiveResume(null);
          setProcessedResume(null);
        }
        
        alert('Document deleted successfully');
      }
      
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="px-4 py-8 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Apply</h1>
          <p className="text-lg text-gray-600 mb-8">
            Let AI automatically apply to jobs that match your profile
          </p>
          
          <div className="space-y-8">
            {/* Resume Management Section */}
            <div className="bg-white border border-gray-300 rounded-lg p-6 text-left">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Resume</h2>
              
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">Loading your resumes...</p>
                </div>
              ) : (
                <>
                  {/* Upload New Resume */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Upload New Resume</h3>
                    <div className="flex items-center space-x-4">
                      <label htmlFor="resume-upload" className="sr-only">Upload resume file</label>
                      <input
                        id="resume-upload"
                        name="resume-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      {uploading && (
                        <span className="text-sm text-blue-600">Uploading...</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Only PDF files are accepted</p>
                  </div>

                  {/* Active Resume Display */}
                  {activeResume && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="text-lg font-medium text-green-900 mb-2">Active Resume</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-800">{activeResume.original_filename}</p>
                          <p className="text-sm text-green-600">
                            Uploaded: {activeResume.uploaded_at ? new Date(activeResume.uploaded_at).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">Active</span>
                          <button
                            onClick={handleProcessResume}
                            disabled={processing}
                            className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            {processing ? 'Processing...' : 'Process Resume'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* All Resumes List */}
                  {resumes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">All Resumes</h3>
                      <div className="space-y-2">
                        {resumes.map((resume) => (
                          <div key={resume.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-800">{resume.original_filename}</p>
                              <p className="text-sm text-gray-600">
                                Uploaded: {resume.uploaded_at ? new Date(resume.uploaded_at).toLocaleDateString() : 'Unknown date'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {!resume.is_active && (
                                <button
                                  onClick={() => handleSetActiveResume(resume.id)}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                >
                                  Set Active
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteResume(resume.id)}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Processed Resume Results */}
                  {processedResume && (
                    <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h3 className="text-lg font-medium text-purple-900 mb-4">Processed Resume Results</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white border border-purple-200 rounded-lg p-3">
                          <h4 className="text-md font-medium text-purple-800 mb-2">File Information</h4>
                          <p className="text-sm text-gray-600">Filename: {processedResume.filename}</p>
                          <p className="text-sm text-gray-600">Text Length: {processedResume.textLength.toLocaleString()} characters</p>
                          <p className="text-sm text-gray-600">Processed: {new Date(processedResume.processedAt).toLocaleString()}</p>
                        </div>
                        
                        <div className="bg-white border border-purple-200 rounded-lg p-3">
                          <h4 className="text-md font-medium text-purple-800 mb-2">PDF Metadata</h4>
                          {processedResume.metadata ? (
                            <>
                              <p className="text-sm text-gray-600">Total Pages: {processedResume.metadata.totalPages}</p>
                              <p className="text-sm text-gray-600">Title: {processedResume.metadata.title || 'N/A'}</p>
                              <p className="text-sm text-gray-600">Author: {processedResume.metadata.author || 'N/A'}</p>
                              <p className="text-sm text-gray-600">Creator: {processedResume.metadata.creator || 'N/A'}</p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">No metadata available</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white border border-purple-200 rounded-lg p-3">
                          <h4 className="text-md font-medium text-purple-800 mb-2">Resume Statistics</h4>
                          {(() => {
                            const stats = DocumentManagementService.getResumeStats(processedResume.text);
                            return (
                              <>
                                <p className="text-sm text-gray-600">Words: {stats.wordCount.toLocaleString()}</p>
                                <p className="text-sm text-gray-600">Lines: {stats.lineCount}</p>
                                <p className="text-sm text-gray-600">Est. Pages: {stats.pageCount}</p>
                                <p className="text-sm text-gray-600">Characters: {stats.characterCount.toLocaleString()}</p>
                              </>
                            );
                          })()}
                        </div>
                        
                        <div className="bg-white border border-purple-200 rounded-lg p-3">
                          <h4 className="text-md font-medium text-purple-800 mb-2">Extracted Information</h4>
                          {(() => {
                            const info = DocumentManagementService.extractResumeInfo(processedResume.text);
                            return (
                              <>
                                <p className="text-sm text-gray-600">Name: {info.name || 'N/A'}</p>
                                <p className="text-sm text-gray-600">Email: {info.email || 'N/A'}</p>
                                <p className="text-sm text-gray-600">Phone: {info.phone || 'N/A'}</p>
                                <p className="text-sm text-gray-600">Skills: {info.skills.length} found</p>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      
                      {/* Resume Screenshot */}
                      {screenshotUrl && (
                        <div className="mb-4">
                          <h4 className="text-md font-medium text-purple-800 mb-2">Resume Screenshot</h4>
                          <div className="bg-white border border-purple-200 rounded-lg p-3">
                            <img 
                              src={screenshotUrl} 
                              alt="Resume Screenshot" 
                              className="max-w-full h-auto border border-gray-300 rounded"
                              style={{ maxHeight: '400px' }}
                            />
                            <p className="text-xs text-purple-600 mt-2">
                              Screenshot of the first page of your resume
                            </p>
                          </div>
                        </div>
                      )}

                      {/* PNG Preview Section - CLI Generated */}
                      {activeResume && (
                        <div className="mb-4">
                          <h4 className="text-md font-medium text-purple-800 mb-2">Document Preview (CLI Generated)</h4>
                          <div className="bg-white border border-purple-200 rounded-lg p-3">
                            <DocumentPreview documentId={activeResume.id} />
                            <p className="text-xs text-purple-600 mt-2">
                              Preview generated using pdf-parse CLI with 1.5x scale
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-md font-medium text-purple-800 mb-2">Extracted Text</h4>
                        <div className="bg-white border border-purple-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap">{processedResume.text}</pre>
                        </div>
                        <p className="text-xs text-purple-600 mt-2">
                          Text extracted using pdf-parse CLI with advanced features
                        </p>
                      </div>
                    </div>
                  )}

                  {/* No Resumes */}
                  {resumes.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 mb-2">No resumes uploaded yet</p>
                      <p className="text-sm text-gray-400">Upload your first resume to get started with AI Apply</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* How AI Apply Works */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-3">How AI Apply Works</h2>
              <ul className="text-left text-blue-800 space-y-2 max-w-2xl mx-auto">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  AI analyzes your profile and job preferences
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Automatically finds matching job opportunities
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Generates personalized cover letters and applications
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Submits applications on your behalf
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Current Status</h2>
              <p className="text-gray-600">
                AI Apply feature is currently under development. Check back soon for updates!
              </p>
            </div>
            
            <button
              onClick={handleApplyToJobs}
              disabled={isProcessing || !currentUser || !activeResume}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? 'Processing...' : activeResume ? 'Start AI Apply (Coming Soon)' : 'Upload a resume first'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIApplyPage;
