import React, { useRef } from 'react';

interface PDFProcessingBoxProps {
  pdfProcessing: boolean;
  onProcessPDF: (file: File) => Promise<void>;
}

const PDFProcessingBox: React.FC<PDFProcessingBoxProps> = ({
  pdfProcessing,
  onProcessPDF
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePDFProcessing = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    try {
      await onProcessPDF(selectedFile);
      
      // Clear file input
      if (event.target) {
        event.target.value = '';
      }
    } catch (error) {
      console.error('PDF processing error:', error);
    }
  };

  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-lg font-medium text-blue-900 mb-3">PDF Processing (New API)</h3>
      <div className="flex items-center space-x-4">
        <label htmlFor="pdf-processing" className="sr-only">Process PDF file</label>
        <input
          ref={fileInputRef}
          id="pdf-processing"
          name="pdf-processing"
          type="file"
          accept=".pdf"
          onChange={handlePDFProcessing}
          disabled={pdfProcessing}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {pdfProcessing && (
          <span className="text-sm text-blue-600">Processing...</span>
        )}
      </div>
      <p className="mt-2 text-sm text-blue-600">Extract text, metadata, and generate preview using pdf-parse v2</p>
    </div>
  );
};

export default PDFProcessingBox;
