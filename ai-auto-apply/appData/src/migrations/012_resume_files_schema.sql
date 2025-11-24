-- Resume Files Schema for PDF Processing
-- Stores PDF text, metadata, pages, screenshot, and page count

-- Create resume_files table
CREATE TABLE IF NOT EXISTS resume_files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_file_path TEXT NOT NULL,
    text TEXT,
    metadata JSONB,
    pages JSONB,
    preview_image_base64 TEXT,
    page_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_page_count_positive CHECK (page_count >= 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_resume_files_user_id ON resume_files(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_files_created_at ON resume_files(created_at);
CREATE INDEX IF NOT EXISTS idx_resume_files_filename ON resume_files(filename);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_resume_files_updated_at
    BEFORE UPDATE ON resume_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to store resume file data
CREATE OR REPLACE FUNCTION store_resume_file(
    p_user_id INTEGER,
    p_filename TEXT,
    p_original_file_path TEXT,
    p_text TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_pages JSONB DEFAULT NULL,
    p_preview_image_base64 TEXT DEFAULT NULL,
    p_page_count INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_resume_file_id INTEGER;
BEGIN
    INSERT INTO resume_files (
        user_id,
        filename,
        original_file_path,
        text,
        metadata,
        pages,
        preview_image_base64,
        page_count
    ) VALUES (
        p_user_id,
        p_filename,
        p_original_file_path,
        p_text,
        p_metadata,
        p_pages,
        p_preview_image_base64,
        p_page_count
    )
    RETURNING id INTO v_resume_file_id;
    
    RETURN v_resume_file_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get resume file with preview
CREATE OR REPLACE FUNCTION get_resume_file_with_preview(p_resume_file_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    filename TEXT,
    text TEXT,
    metadata JSONB,
    pages JSONB,
    preview_image_base64 TEXT,
    page_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rf.id,
        rf.filename,
        rf.text,
        rf.metadata,
        rf.pages,
        rf.preview_image_base64,
        rf.page_count,
        rf.created_at
    FROM resume_files rf
    WHERE rf.id = p_resume_file_id;
END;
$$ LANGUAGE plpgsql;

-- Create view for resume files summary
CREATE OR REPLACE VIEW resume_files_summary AS
SELECT 
    rf.id,
    rf.filename,
    rf.page_count,
    LENGTH(rf.text) as text_length,
    array_length(string_to_array(rf.text, ' '), 1) as word_count,
    rf.created_at,
    u.email as user_email,
    rf.preview_image_base64 IS NOT NULL as has_preview
FROM resume_files rf
LEFT JOIN users u ON rf.user_id = u.id;

-- Add comments
COMMENT ON TABLE resume_files IS 'Stores uploaded resume files with extracted text, metadata, and preview images';
COMMENT ON COLUMN resume_files.text IS 'Extracted text content from PDF';
COMMENT ON COLUMN resume_files.metadata IS 'PDF metadata information';
COMMENT ON COLUMN resume_files.pages IS 'Detailed page information from PDF';
COMMENT ON COLUMN resume_files.preview_image_base64 IS 'Base64 encoded PNG preview of first page';
COMMENT ON COLUMN resume_files.page_count IS 'Total number of pages in the PDF';
COMMENT ON FUNCTION store_resume_file IS 'Stores resume file data in the database';
COMMENT ON FUNCTION get_resume_file_with_preview IS 'Retrieves resume file data including preview';
COMMENT ON VIEW resume_files_summary IS 'Summary view of all resume files with key metrics';
