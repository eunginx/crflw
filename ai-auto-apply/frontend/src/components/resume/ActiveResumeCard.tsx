import React from 'react';
import { ResumeDocument } from '../../types/resume';

interface ActiveResumeCardProps {
  activeResume: ResumeDocument | null;
  processing: boolean;
  onProcess: () => Promise<void>;
}

const ActiveResumeCard: React.FC<ActiveResumeCardProps> = ({
  activeResume,
  processing,
  onProcess
}) => {
  if (!activeResume) {
    return (
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-medium text-yellow-900 mb-2">No Active Resume</h3>
        <p className="text-sm text-yellow-700">
          Please upload a resume and set it as active to use AI Apply features.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <h3 className="text-lg font-medium text-green-900 mb-2">Active Resume</h3>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-green-800">{activeResume.original_filename}</p>
          <p className="text-sm text-green-600">
            Uploaded: {activeResume.uploaded_at ? new Date(activeResume.uploaded_at).toLocaleDateString() : 'Unknown date'}
          </p>
          {activeResume.file_size && (
            <p className="text-sm text-green-600">
              Size: {(activeResume.file_size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">Active</span>
          <button
            onClick={onProcess}
            disabled={processing}
            className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? 'Processing...' : 'Process Resume'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveResumeCard;
