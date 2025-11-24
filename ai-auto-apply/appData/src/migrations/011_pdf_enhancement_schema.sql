-- PDF Enhancement Schema
-- Adds PDF-specific metadata and preview image support to existing resume processing

-- Add PDF-specific fields to processed_resumes table
ALTER TABLE processed_resumes 
ADD COLUMN IF NOT EXISTS pdf_metadata JSONB,
ADD COLUMN IF NOT EXISTS pdf_num_pages INTEGER,
ADD COLUMN IF NOT EXISTS pdf_preview_image TEXT, -- Base64 encoded PNG preview
ADD COLUMN IF NOT EXISTS pdf_info JSONB; -- Additional PDF info from pdf-parse

-- Add constraints for new fields
ALTER TABLE processed_resumes 
ADD CONSTRAINT IF NOT EXISTS chk_pdf_num_pages_positive 
CHECK (pdf_num_pages IS NULL OR pdf_num_pages >= 0);

-- Create index for PDF metadata queries
CREATE INDEX IF NOT EXISTS idx_processed_resumes_pdf_num_pages 
ON processed_resumes(pdf_num_pages) WHERE pdf_num_pages IS NOT NULL;

-- Update the resume_processing_summary view to include PDF data
CREATE OR REPLACE VIEW resume_processing_summary AS
SELECT 
    pr.id as processed_resume_id,
    pr.resume_id,
    rf.filename as original_filename,
    rf.email as user_email,
    pr.processed_at,
    pr.processing_status,
    pr.text_length,
    pr.word_count,
    pr.line_count,
    pr.estimated_pages,
    pr.extracted_name,
    pr.extracted_email,
    pr.extracted_phone,
    
    -- PDF-specific data
    pr.pdf_num_pages,
    pr.pdf_metadata,
    pr.pdf_preview_image IS NOT NULL as has_preview_image,
    
    -- Aggregated data
    (SELECT COUNT(*) FROM resume_skills rs WHERE rs.processed_resume_id = pr.id) as skills_count,
    (SELECT COUNT(*) FROM resume_experience re WHERE re.processed_resume_id = pr.id) as experience_count,
    (SELECT COUNT(*) FROM resume_education reu WHERE reu.processed_resume_id = pr.id) as education_count,
    
    -- Processing metrics
    rpa.processing_time_ms,
    rpa.extraction_confidence,
    
    -- User info
    ue.first_name,
    ue.last_name
    
FROM processed_resumes pr
LEFT JOIN resume_files_email rf ON pr.resume_id = rf.id
LEFT JOIN users_email ue ON rf.email = ue.email
LEFT JOIN resume_processing_analytics rpa ON pr.id = rpa.processed_resume_id;

-- Create a function to store PDF processing results
CREATE OR REPLACE FUNCTION store_pdf_processing_results(
    p_resume_id UUID,
    p_extracted_text TEXT,
    p_num_pages INTEGER,
    p_pdf_metadata JSONB DEFAULT NULL,
    p_pdf_info JSONB DEFAULT NULL,
    p_preview_image TEXT DEFAULT NULL,
    p_extracted_name VARCHAR(255) DEFAULT NULL,
    p_extracted_email VARCHAR(255) DEFAULT NULL,
    p_extracted_phone VARCHAR(50) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_processed_resume_id UUID;
BEGIN
    -- Insert or update processed resume data
    INSERT INTO processed_resumes (
        resume_id,
        extracted_text,
        text_length,
        word_count,
        line_count,
        estimated_pages,
        pdf_num_pages,
        pdf_metadata,
        pdf_info,
        pdf_preview_image,
        extracted_name,
        extracted_email,
        extracted_phone,
        processing_status
    ) VALUES (
        p_resume_id,
        p_extracted_text,
        COALESCE(LENGTH(p_extracted_text), 0),
        COALESCE(array_length(string_to_array(p_extracted_text, ' '), 1), 0),
        COALESCE(array_length(string_to_array(p_extracted_text, E'\n'), 1), 0),
        p_num_pages,
        p_num_pages,
        p_pdf_metadata,
        p_pdf_info,
        p_preview_image,
        p_extracted_name,
        p_extracted_email,
        p_extracted_phone,
        'completed'
    )
    ON CONFLICT (resume_id) 
    DO UPDATE SET
        extracted_text = EXCLUDED.extracted_text,
        text_length = EXCLUDED.text_length,
        word_count = EXCLUDED.word_count,
        line_count = EXCLUDED.line_count,
        estimated_pages = EXCLUDED.estimated_pages,
        pdf_num_pages = EXCLUDED.pdf_num_pages,
        pdf_metadata = EXCLUDED.pdf_metadata,
        pdf_info = EXCLUDED.pdf_info,
        pdf_preview_image = EXCLUDED.pdf_preview_image,
        extracted_name = EXCLUDED.extracted_name,
        extracted_email = EXCLUDED.extracted_email,
        extracted_phone = EXCLUDED.extracted_phone,
        processing_status = EXCLUDED.processing_status,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_processed_resume_id;
    
    RETURN v_processed_resume_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get PDF preview data
CREATE OR REPLACE FUNCTION get_pdf_preview(p_resume_id UUID)
RETURNS TABLE (
    processed_resume_id UUID,
    preview_image TEXT,
    num_pages INTEGER,
    text_length INTEGER,
    word_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.id,
        pr.pdf_preview_image,
        pr.pdf_num_pages,
        pr.text_length,
        pr.word_count
    FROM processed_resumes pr
    WHERE pr.resume_id = p_resume_id 
    AND pr.processing_status = 'completed'
    AND pr.pdf_preview_image IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON COLUMN processed_resumes.pdf_metadata IS 'JSON metadata extracted from PDF file';
COMMENT ON COLUMN processed_resumes.pdf_num_pages IS 'Total number of pages in the PDF';
COMMENT ON COLUMN processed_resumes.pdf_preview_image IS 'Base64 encoded PNG preview of first page';
COMMENT ON COLUMN processed_resumes.pdf_info IS 'Additional PDF information from pdf-parse library';
COMMENT ON FUNCTION store_pdf_processing_results IS 'Stores PDF processing results in the database';
COMMENT ON FUNCTION get_pdf_preview IS 'Retrieves PDF preview data for a resume';
