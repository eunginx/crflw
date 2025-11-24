-- Persistent Resume Processing State Schema
-- Maintains a single set of parsed resume information per user

-- Table for storing persistent resume processing state per user
CREATE TABLE IF NOT EXISTS user_resume_processing_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User identification (email-based)
    user_email VARCHAR(255) NOT NULL UNIQUE,
    
    -- Reference to the active resume document
    active_resume_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    
    -- Processing state flags
    has_parsed_resume BOOLEAN DEFAULT false,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Document information (mirrors from active resume)
    document_filename VARCHAR(255),
    document_original_filename VARCHAR(255),
    document_file_size_bytes INTEGER,
    document_uploaded_at TIMESTAMP WITH TIME ZONE,
    
    -- PDF Metadata
    pdf_title VARCHAR(500),
    pdf_author VARCHAR(255),
    pdf_creator VARCHAR(255),
    pdf_producer VARCHAR(500),
    pdf_total_pages INTEGER,
    
    -- Extracted content
    extracted_text TEXT,
    text_length INTEGER,
    word_count INTEGER,
    line_count INTEGER,
    
    -- Processing metadata
    screenshot_path VARCHAR(500),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_user_email_not_empty CHECK (length(trim(user_email)) > 0),
    CONSTRAINT chk_file_size_positive CHECK (document_file_size_bytes IS NULL OR document_file_size_bytes >= 0),
    CONSTRAINT chk_text_length_positive CHECK (text_length IS NULL OR text_length >= 0),
    CONSTRAINT chk_word_count_positive CHECK (word_count IS NULL OR word_count >= 0),
    CONSTRAINT chk_line_count_positive CHECK (line_count IS NULL OR line_count >= 0),
    CONSTRAINT chk_pages_positive CHECK (pdf_total_pages IS NULL OR pdf_total_pages >= 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_resume_processing_state_email ON user_resume_processing_state(user_email);
CREATE INDEX IF NOT EXISTS idx_user_resume_processing_state_active_resume ON user_resume_processing_state(active_resume_id);
CREATE INDEX IF NOT EXISTS idx_user_resume_processing_state_updated_at ON user_resume_processing_state(updated_at);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_user_resume_processing_state_updated_at
    BEFORE UPDATE ON user_resume_processing_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get or create user processing state
CREATE OR REPLACE FUNCTION get_or_create_user_resume_processing_state(p_user_email VARCHAR(255))
RETURNS UUID AS $$
DECLARE
    state_id UUID;
BEGIN
    -- Try to get existing state
    SELECT id INTO state_id 
    FROM user_resume_processing_state 
    WHERE user_email = p_user_email;
    
    -- If not found, create new one
    IF state_id IS NULL THEN
        INSERT INTO user_resume_processing_state (user_email)
        VALUES (p_user_email)
        RETURNING id INTO state_id;
    END IF;
    
    RETURN state_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update processing state from document results
CREATE OR REPLACE FUNCTION update_user_resume_processing_state_from_document(
    p_user_email VARCHAR(255),
    p_resume_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    state_exists BOOLEAN;
BEGIN
    -- Check if user state exists
    SELECT EXISTS(
        SELECT 1 FROM user_resume_processing_state WHERE user_email = p_user_email
    ) INTO state_exists;
    
    -- Create state if it doesn't exist
    IF NOT state_exists THEN
        PERFORM get_or_create_user_resume_processing_state(p_user_email);
    END IF;
    
    -- Update state with latest document processing results
    UPDATE user_resume_processing_state urps
    SET 
        active_resume_id = d.id,
        has_parsed_resume = CASE WHEN dpr.processed_at IS NOT NULL THEN true ELSE false END,
        processing_completed_at = dpr.processed_at,
        document_filename = d.stored_filename,
        document_original_filename = d.original_filename,
        document_file_size_bytes = d.file_size_bytes::integer,
        document_uploaded_at = d.uploaded_at,
        pdf_title = dpr.pdf_title,
        pdf_author = dpr.pdf_author,
        pdf_creator = dpr.pdf_creator,
        pdf_producer = dpr.pdf_producer,
        pdf_total_pages = dpr.pdf_total_pages,
        extracted_text = dpr.extracted_text,
        text_length = dpr.text_length,
        word_count = dpr.word_count,
        line_count = dpr.line_count,
        screenshot_path = dpr.screenshot_path,
        processed_at = dpr.processed_at,
        updated_at = CURRENT_TIMESTAMP
    FROM documents d
    LEFT JOIN document_processing_results dpr ON d.id = dpr.document_id
    WHERE urps.user_email = p_user_email 
      AND d.id = p_resume_id
      AND d.user_email = p_user_email
      AND d.is_active = true;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- View for easy access to user processing state with document details
CREATE OR REPLACE VIEW user_resume_processing_summary AS
SELECT 
    urps.user_email,
    urps.has_parsed_resume,
    urps.processing_completed_at,
    urps.active_resume_id,
    urps.document_original_filename,
    urps.document_file_size_bytes,
    urps.document_uploaded_at,
    urps.pdf_title,
    urps.pdf_author,
    urps.pdf_total_pages,
    urps.text_length,
    urps.word_count,
    urps.extracted_text,
    urps.screenshot_path,
    urps.processed_at,
    urps.created_at,
    urps.updated_at,
    
    -- Additional document info
    d.mime_type,
    
    -- Check if processing is needed
    CASE 
        WHEN urps.has_parsed_resume = false THEN 'needs_processing'
        WHEN urps.active_resume_id IS NULL THEN 'no_resume'
        WHEN dpr.processed_at IS NULL THEN 'needs_processing'
        WHEN dpr.processed_at < d.updated_at THEN 'needs_reprocessing'
        ELSE 'up_to_date'
    END as processing_needed_status
    
FROM user_resume_processing_state urps
LEFT JOIN documents d ON urps.active_resume_id = d.id
LEFT JOIN document_processing_results dpr ON urps.active_resume_id = dpr.document_id;

COMMENT ON TABLE user_resume_processing_state IS 'Maintains persistent resume processing state per user, ensuring only one set of parsed info is stored';
COMMENT ON FUNCTION get_or_create_user_resume_processing_state IS 'Gets existing user processing state or creates new one';
COMMENT ON FUNCTION update_user_resume_processing_state_from_document IS 'Updates user processing state from document processing results';
COMMENT ON VIEW user_resume_processing_summary IS 'Summary view of user resume processing state with document details';
