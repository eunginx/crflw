-- Firebase File Metadata Schema
-- Maintains metadata of files stored in Firebase Storage

-- Table for storing Firebase file metadata
CREATE TABLE IF NOT EXISTS firebase_file_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Firebase Storage information
    firebase_storage_path VARCHAR(500) NOT NULL,
    firebase_download_url TEXT NOT NULL,
    firebase_file_id VARCHAR(255), -- Firebase file ID if available
    
    -- User information
    user_id VARCHAR(255) NOT NULL, -- Firebase Auth UID
    user_email VARCHAR(255), -- User email for reference
    
    -- File information
    original_filename VARCHAR(255) NOT NULL,
    storage_filename VARCHAR(255) NOT NULL, -- Unique filename in storage
    file_size_bytes BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(100),
    
    -- Resume specific metadata
    is_resume BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT FALSE,
    
    -- Processing information
    is_processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_error TEXT,
    
    -- Timestamps
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT chk_processing_status_valid CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT chk_file_size_positive CHECK (file_size_bytes >= 0),
    CONSTRAINT chk_firebase_path_not_empty CHECK (length(firebase_storage_path) > 0),
    CONSTRAINT chk_firebase_url_not_empty CHECK (length(firebase_download_url) > 0)
);

-- Table for storing processed resume data (links to Firebase metadata)
CREATE TABLE IF NOT EXISTS firebase_processed_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_metadata_id UUID NOT NULL REFERENCES firebase_file_metadata(id) ON DELETE CASCADE,
    
    -- Processing metadata
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processing_version VARCHAR(10) DEFAULT '1.0',
    processing_time_ms INTEGER,
    
    -- Text extraction results
    extracted_text TEXT,
    text_length INTEGER,
    word_count INTEGER,
    line_count INTEGER,
    estimated_pages INTEGER,
    
    -- Structured extracted information
    extracted_name VARCHAR(255),
    extracted_email VARCHAR(255),
    extracted_phone VARCHAR(50),
    
    -- Processing analytics
    extraction_confidence DECIMAL(3,2),
    missing_fields TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_text_length_positive CHECK (text_length >= 0),
    CONSTRAINT chk_word_count_positive CHECK (word_count >= 0),
    CONSTRAINT chk_line_count_positive CHECK (line_count >= 0),
    CONSTRAINT chk_estimated_pages_positive CHECK (estimated_pages >= 0),
    CONSTRAINT chk_extraction_confidence_range CHECK (extraction_confidence IS NULL OR (extraction_confidence >= 0.0 AND extraction_confidence <= 1.0))
);

-- Table for storing extracted skills from Firebase resumes
CREATE TABLE IF NOT EXISTS firebase_resume_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_processed_resume_id UUID NOT NULL REFERENCES firebase_processed_resumes(id) ON DELETE CASCADE,
    
    -- Skill information
    skill_name VARCHAR(100) NOT NULL,
    skill_category VARCHAR(50),
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    context_snippet TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_confidence_range CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_firebase_metadata_user_id ON firebase_file_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_firebase_metadata_user_email ON firebase_file_metadata(user_email);
CREATE INDEX IF NOT EXISTS idx_firebase_metadata_is_resume ON firebase_file_metadata(is_resume);
CREATE INDEX IF NOT EXISTS idx_firebase_metadata_is_active ON firebase_file_metadata(is_active);
CREATE INDEX IF NOT EXISTS idx_firebase_metadata_is_processed ON firebase_file_metadata(is_processed);
CREATE INDEX IF NOT EXISTS idx_firebase_metadata_uploaded_at ON firebase_file_metadata(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_firebase_metadata_storage_path ON firebase_file_metadata(firebase_storage_path);
CREATE INDEX IF NOT EXISTS idx_firebase_metadata_deleted_at ON firebase_file_metadata(deleted_at);

CREATE INDEX IF NOT EXISTS idx_firebase_processed_resumes_metadata_id ON firebase_processed_resumes(firebase_metadata_id);
CREATE INDEX IF NOT EXISTS idx_firebase_processed_resumes_processed_at ON firebase_processed_resumes(processed_at);

CREATE INDEX IF NOT EXISTS idx_firebase_skills_processed_resume_id ON firebase_resume_skills(firebase_processed_resume_id);
CREATE INDEX IF NOT EXISTS idx_firebase_skills_name ON firebase_resume_skills(skill_name);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_firebase_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_firebase_file_metadata_updated_at
    BEFORE UPDATE ON firebase_file_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_firebase_metadata_updated_at();

CREATE OR REPLACE FUNCTION update_firebase_processed_resume_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_firebase_processed_resume_updated_at
    BEFORE UPDATE ON firebase_processed_resumes
    FOR EACH ROW
    EXECUTE FUNCTION update_firebase_metadata_updated_at();

-- Create view for comprehensive Firebase file data
CREATE OR REPLACE VIEW firebase_resume_summary AS
SELECT 
    ffm.id as metadata_id,
    ffm.firebase_storage_path,
    ffm.firebase_download_url,
    ffm.user_id,
    ffm.user_email,
    ffm.original_filename,
    ffm.file_size_bytes,
    ffm.is_resume,
    ffm.is_active,
    ffm.is_processed,
    ffm.uploaded_at,
    
    -- Processing data
    fpr.processed_at,
    ffm.processing_status,
    fpr.text_length,
    fpr.word_count,
    fpr.extracted_name,
    fpr.extracted_email,
    fpr.processing_time_ms,
    fpr.extraction_confidence,
    
    -- Skills count
    (SELECT COUNT(*) FROM firebase_resume_skills frs WHERE frs.firebase_processed_resume_id = fpr.id) as skills_count
    
FROM firebase_file_metadata ffm
LEFT JOIN firebase_processed_resumes fpr ON ffm.id = fpr.firebase_metadata_id
WHERE ffm.deleted_at IS NULL
  AND ffm.is_resume = TRUE;

-- Create view for Firebase skills analysis
CREATE OR REPLACE VIEW firebase_skills_analysis AS
SELECT 
    frs.skill_name,
    frs.skill_category,
    COUNT(*) as frequency,
    AVG(frs.confidence_score) as avg_confidence,
    array_agg(DISTINCT ffm.user_email) as users_with_skill,
    MAX(fpr.processed_at) as last_seen
FROM firebase_resume_skills frs
JOIN firebase_processed_resumes fpr ON frs.firebase_processed_resume_id = fpr.id
JOIN firebase_file_metadata ffm ON fpr.firebase_metadata_id = ffm.id
WHERE ffm.deleted_at IS NULL
GROUP BY frs.skill_name, frs.skill_category
ORDER BY frequency DESC, avg_confidence DESC;

COMMENT ON TABLE firebase_file_metadata IS 'Stores metadata for files stored in Firebase Storage';
COMMENT ON TABLE firebase_processed_resumes IS 'Stores processed resume data linked to Firebase files';
COMMENT ON TABLE firebase_resume_skills IS 'Stores skills extracted from Firebase resumes';
COMMENT ON VIEW firebase_resume_summary IS 'Comprehensive summary of Firebase resume files and their processing status';
COMMENT ON VIEW firebase_skills_analysis IS 'Analysis of skills extracted from Firebase resumes';
