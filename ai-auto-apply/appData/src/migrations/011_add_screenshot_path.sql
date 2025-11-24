-- Add screenshot_path column to document_processing_results table
ALTER TABLE document_processing_results 
ADD COLUMN IF NOT EXISTS screenshot_path VARCHAR(500);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_document_processing_results_screenshot_path 
ON document_processing_results(screenshot_path) WHERE screenshot_path IS NOT NULL;
