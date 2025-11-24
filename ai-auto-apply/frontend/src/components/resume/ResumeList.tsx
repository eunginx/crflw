import React from 'react';
import { ResumeDocument } from '../../types/resume';

interface ResumeListProps {
  resumes: ResumeDocument[];
  activeResume: ResumeDocument | null;
  onSetActive: (documentId: string) => Promise<void>;
  onDelete: (documentId: string) => Promise<void>;
  onProcess?: (documentId: string) => Promise<void>;
  loading?: boolean;
  processing?: boolean;
}

const ResumeList: React.FC<ResumeListProps> = ({
  resumes,
  activeResume,
  onSetActive,
  onDelete,
  onProcess,
  loading = false,
  processing = false
}) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error, 'Input:', dateString);
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">Loading your resumes...</p>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500 mb-2">No resumes uploaded yet</p>
        <p className="text-sm text-gray-400">Upload your first resume to get started with AI Apply</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-3">All Resumes</h3>
      <div className="space-y-2">
        {resumes.map((resume) => (
          <div key={resume.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">{resume.original_filename}</p>
              <p className="text-sm text-gray-600">
                Uploaded: {formatDate(resume.upload_date)}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                {resume.is_active && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Active
                  </span>
                )}
                {resume.processing_status && (
                  <span 
                    className={`px-2 py-1 text-xs rounded-full ${
                      resume.processing_status === 'completed' 
                        ? 'bg-blue-100 text-blue-800' 
                        : resume.processing_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {resume.processing_status.charAt(0).toUpperCase() + resume.processing_status.slice(1)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!resume.is_active && (
                <button
                  onClick={() => onSetActive(resume.id)}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                >
                  Set Active
                </button>
              )}
              {resume.is_active && onProcess && (
                <button
                  onClick={() => onProcess(resume.id)}
                  disabled={processing}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Process active resume to extract text"
                >
                  {processing ? 'Processing...' : 'Process'}
                </button>
              )}
              <button
                onClick={() => onDelete(resume.id)}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResumeList;
