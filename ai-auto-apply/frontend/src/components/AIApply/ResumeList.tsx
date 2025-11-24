import React from 'react';
import { ResumeDocument } from '../../types/resume';

interface ResumeListProps {
  resumes: ResumeDocument[];
  activeResume: ResumeDocument | null;
  onSetActive: (resumeId: string) => Promise<void>;
  onDelete: (resumeId: string) => Promise<void>;
  onProcess: (resumeId: string) => Promise<void>;
  onAIAnalysis: (resumeId: string) => Promise<void>;
  loading: boolean;
  processing: boolean;
}

const ResumeList: React.FC<ResumeListProps> = ({
  resumes,
  activeResume,
  onSetActive,
  onDelete,
  onProcess,
  onAIAnalysis,
  loading,
  processing
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Your Resumes</h3>
      
      {resumes.map((resume) => (
        <div
          key={resume.id}
          className={`border rounded-lg p-4 transition-all ${
            activeResume?.id === resume.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-gray-400 text-lg">📄</span>
                <div>
                  <h4 className="font-medium text-gray-900">{resume.original_filename}</h4>
                  <p className="text-sm text-gray-500">
                    Uploaded {formatDate(resume.uploaded_at)} • {formatFileSize(resume.file_size)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  resume.status === 'processed' 
                    ? 'bg-green-100 text-green-800'
                    : resume.status === 'processing'
                    ? 'bg-yellow-100 text-yellow-800'
                    : resume.status === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {resume.status === 'processed' ? 'Processed' :
                   resume.status === 'processing' ? 'Processing' :
                   resume.status === 'error' ? 'Error' : 'Pending'}
                </span>
                
                {activeResume?.id === resume.id && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                    Active
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {activeResume?.id !== resume.id && (
                <button
                  onClick={() => onSetActive(resume.id)}
                  disabled={loading}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Set Active
                </button>
              )}
              
              {activeResume?.id === resume.id && resume.status !== 'processing' && (
                <>
                  <button
                    onClick={() => onProcess(resume.id)}
                    disabled={processing}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Processing...' : 'Parse PDF'}
                  </button>
                  
                  {resume.status === 'processed' && (
                    <button
                      onClick={() => onAIAnalysis(resume.id)}
                      disabled={processing}
                      className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      AI Analysis
                    </button>
                  )}
                </>
              )}
              
              <button
                onClick={() => onDelete(resume.id)}
                disabled={loading || processing}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
      
      {resumes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <span className="text-gray-400 text-4xl">📄</span>
          <p className="mt-2">No resumes found</p>
        </div>
      )}
    </div>
  );
};

export default ResumeList;
