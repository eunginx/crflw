import React, { useRef } from 'react';
import { CloudArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { ProcessingOptions } from '../../services/documentManagementService';

interface ResumeUploadBoxProps {
  uploading: boolean;
  onUpload: (file: File, userEmail?: string, options?: ProcessingOptions) => Promise<void>;
  userEmail?: string;
  disabled?: boolean;
}

const ResumeUploadBox: React.FC<ResumeUploadBoxProps> = ({
  uploading,
  onUpload,
  userEmail,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate PDF file
    if (selectedFile.type !== 'application/pdf') {
      alert('Please upload a PDF file only');
      return;
    }

    // File size validation (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      await onUpload(selectedFile, userEmail, {
        text: {}, // Extract full text
        info: { parsePageInfo: true }, // Get metadata
        screenshots: { scale: 1.5, first: 1 }, // Generate preview of first page
        images: { imageThreshold: 50 }, // Extract images larger than 50px
        tables: { format: 'json' } // Extract tables as JSON
      } as ProcessingOptions);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    }
  };

  const handleClick = () => {
    if (!uploading && !disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="text-center">
      <input
        ref={fileInputRef}
        id="resume-upload"
        name="resume-upload"
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        disabled={uploading || disabled}
        className="hidden"
      />
      
      <button
        onClick={handleClick}
        disabled={uploading || disabled}
        className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg hover:shadow-xl"
      >
        {uploading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
            <span>Uploading Resume...</span>
          </>
        ) : (
          <>
            <CloudArrowUpIcon className="w-6 h-6 mr-3" />
            <span>Upload Resume (PDF)</span>
          </>
        )}
      </button>
      
      <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500">
        <DocumentTextIcon className="w-4 h-4" />
        <span>PDF format • Max 10MB</span>
      </div>
      
      {disabled && (
        <p className="mt-2 text-sm text-gray-400">
          Sign in required to upload your resume
        </p>
      )}
    </div>
  );
};

export default ResumeUploadBox;
