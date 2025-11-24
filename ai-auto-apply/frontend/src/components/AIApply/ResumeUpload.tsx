import React, { useCallback } from 'react';
import { CloudArrowUpIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface ResumeUploadProps {
  uploading: boolean;
  onUpload: (file: File, userEmail?: string) => Promise<void>;
  userEmail?: string;
  disabled?: boolean;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({
  uploading,
  onUpload,
  userEmail,
  disabled = false
}) => {
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file');
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      try {
        await onUpload(file, userEmail);
        // Clear the input after successful upload
        event.target.value = '';
      } catch (error) {
        console.error('Upload failed:', error);
      }
    },
    [onUpload, userEmail]
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      
      if (!file) return;

      // Validate file type
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file');
        return;
      }

      // Validate file size
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      try {
        await onUpload(file, userEmail);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    },
    [onUpload, userEmail]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  if (disabled) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Please sign in to upload your resume
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer bg-blue-50"
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          disabled={uploading || disabled}
          className="hidden"
          id="resume-upload"
        />
        <label htmlFor="resume-upload" className="cursor-pointer">
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-sm text-blue-600">Uploading your resume...</p>
            </>
          ) : (
            <>
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-blue-500" />
              <p className="mt-4 text-lg font-medium text-gray-900">
                Drop your resume here or click to browse
              </p>
              <p className="mt-2 text-sm text-gray-600">
                PDF files up to 10MB
              </p>
            </>
          )}
        </label>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>• Supported format: PDF</p>
        <p>• Maximum file size: 10MB</p>
        <p>• Your resume will be processed automatically</p>
      </div>
    </div>
  );
};

export default ResumeUpload;
