-- Increase screenshot_path column size from VARCHAR(500) to VARCHAR(1000)
-- This fixes the "value too long for type character varying" error

-- Drop dependent view first
DROP VIEW IF EXISTS user_resume_processing_summary;

-- Update document_processing_results table
ALTER TABLE document_processing_results 
DROP COLUMN IF EXISTS screenshot_path;

ALTER TABLE document_processing_results 
ADD COLUMN screenshot_path VARCHAR(1000);

-- Update user_resume_processing_state table  
ALTER TABLE user_resume_processing_state
DROP COLUMN IF EXISTS screenshot_path;

ALTER TABLE user_resume_processing_state
ADD COLUMN screenshot_path VARCHAR(1000);

-- Update user_resume_data table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'user_resume_data' 
               AND column_name = 'screenshot_path') THEN
        ALTER TABLE user_resume_data
        DROP COLUMN IF EXISTS screenshot_path;
        
        ALTER TABLE user_resume_data
        ADD COLUMN screenshot_path VARCHAR(1000);
    END IF;
END $$;

-- Recreate the dependent view
CREATE OR REPLACE VIEW user_resume_processing_summary AS
SELECT 
    user_email,
    document_id,
    document_filename,
    document_file_size_bytes,
    has_parsed_resume,
    has_active_resume,
    pdf_total_pages,
    extracted_text,
    text_length,
    word_count,
    line_count,
    screenshot_path,
    processed_at,
    created_at,
    updated_at
FROM user_resume_processing_state;
