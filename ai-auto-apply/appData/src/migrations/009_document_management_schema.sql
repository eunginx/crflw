-- Document Management Schema for PostgreSQL
-- Replaces Firebase with pure PostgreSQL document storage

-- Main documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User information
    user_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    
    -- File information
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL UNIQUE,
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(100),
    
    -- Document type and status
    document_type VARCHAR(50) DEFAULT 'resume',
    is_active BOOLEAN DEFAULT FALSE,
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    
    -- Processing information
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_error TEXT,
    processing_time_ms INTEGER,
    
    -- File storage info
    storage_backend VARCHAR(20) DEFAULT 'local', -- 'local', 's3', 'gcs', etc.
    storage_url TEXT, -- URL for accessing the file
    
    -- Timestamps
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT chk_processing_status_valid CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT chk_file_size_positive CHECK (file_size_bytes >= 0),
    CONSTRAINT chk_document_type_valid CHECK (document_type IN ('resume', 'cover_letter', 'portfolio', 'other')),
    CONSTRAINT chk_storage_backend_valid CHECK (storage_backend IN ('local', 's3', 'gcs', 'azure'))
);

-- Document processing results table
CREATE TABLE IF NOT EXISTS document_processing_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Processing metadata
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processing_version VARCHAR(10) DEFAULT '1.0',
    processing_method VARCHAR(20) DEFAULT 'pdf-parse-cli', -- 'pdf-parse-cli', 'pdf-parse-node', etc.
    processing_time_ms INTEGER,
    
    -- Text extraction results
    extracted_text TEXT,
    text_length INTEGER,
    word_count INTEGER,
    line_count INTEGER,
    estimated_pages INTEGER,
    
    -- PDF metadata (from CLI)
    pdf_title VARCHAR(500),
    pdf_author VARCHAR(255),
    pdf_creator VARCHAR(255),
    pdf_producer VARCHAR(255),
    pdf_creation_date TIMESTAMP WITH TIME ZONE,
    pdf_modification_date TIMESTAMP WITH TIME ZONE,
    pdf_total_pages INTEGER,
    
    -- CLI-specific data
    cli_version VARCHAR(20),
    cli_command TEXT,
    cli_output JSONB, -- Raw CLI output for advanced features
    
    -- Processing analytics
    extraction_confidence DECIMAL(3,2),
    missing_fields TEXT[],
    processing_warnings TEXT[],
    
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

-- Extracted structured information
CREATE TABLE IF NOT EXISTS document_extracted_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    processing_result_id UUID NOT NULL REFERENCES document_processing_results(id) ON DELETE CASCADE,
    
    -- Contact information
    extracted_name VARCHAR(255),
    extracted_email VARCHAR(255),
    extracted_phone VARCHAR(50),
    extracted_address TEXT,
    
    -- Professional information
    job_title VARCHAR(255),
    company VARCHAR(255),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    
    -- Skills and experience
    skills JSONB, -- Array of skills with categories
    experience_years INTEGER,
    education_level VARCHAR(50),
    
    -- Confidence scores
    name_confidence DECIMAL(3,2),
    email_confidence DECIMAL(3,2),
    phone_confidence DECIMAL(3,2),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_confidence_range CHECK (
        (name_confidence IS NULL OR (name_confidence >= 0.0 AND name_confidence <= 1.0)) AND
        (email_confidence IS NULL OR (email_confidence >= 0.0 AND email_confidence <= 1.0)) AND
        (phone_confidence IS NULL OR (phone_confidence >= 0.0 AND phone_confidence <= 1.0))
    )
);

-- Document assets (PNG previews, extracted images, etc.)
CREATE TABLE IF NOT EXISTS document_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Asset information
    asset_type VARCHAR(20) NOT NULL, -- 'preview', 'screenshot', 'extracted_image', 'table'
    asset_format VARCHAR(10) NOT NULL, -- 'png', 'jpg', 'svg', 'json'
    file_path VARCHAR(500),
    file_size_bytes BIGINT,
    
    -- Asset metadata
    page_number INTEGER,
    asset_index INTEGER,
    width INTEGER,
    height INTEGER,
    
    -- Generation info
    generated_by VARCHAR(20) DEFAULT 'pdf-parse-cli',
    generation_command TEXT,
    generation_time_ms INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_asset_type_valid CHECK (asset_type IN ('preview', 'screenshot', 'extracted_image', 'table', 'chart')),
    CONSTRAINT chk_asset_format_valid CHECK (asset_format IN ('png', 'jpg', 'jpeg', 'svg', 'json', 'csv'))
);

-- Document processing queue
CREATE TABLE IF NOT EXISTS document_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Queue information
    queue_status VARCHAR(20) DEFAULT 'queued' CHECK (queue_status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 5, -- 1=high, 5=normal, 10=low
    
    -- Processing configuration
    processing_options JSONB, -- CLI options and parameters
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Execution tracking
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_priority_range CHECK (priority >= 1 AND priority <= 10),
    CONSTRAINT chk_retry_count_valid CHECK (retry_count >= 0 AND retry_count <= max_retries)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_email ON documents(user_email);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_is_active ON documents(is_active);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON documents(deleted_at);
CREATE INDEX IF NOT EXISTS idx_documents_stored_filename ON documents(stored_filename);

CREATE INDEX IF NOT EXISTS idx_processing_results_document_id ON document_processing_results(document_id);
CREATE INDEX IF NOT EXISTS idx_processing_results_processed_at ON document_processing_results(processed_at);
CREATE INDEX IF NOT EXISTS idx_processing_results_processing_method ON document_processing_results(processing_method);

CREATE INDEX IF NOT EXISTS idx_extracted_info_document_id ON document_extracted_info(document_id);
CREATE INDEX IF NOT EXISTS idx_extracted_info_processing_result_id ON document_extracted_info(processing_result_id);

CREATE INDEX IF NOT EXISTS idx_assets_document_id ON document_assets(document_id);
CREATE INDEX IF NOT EXISTS idx_assets_asset_type ON document_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_page_number ON document_assets(page_number);

CREATE INDEX IF NOT EXISTS idx_queue_status ON document_processing_queue(queue_status);
CREATE INDEX IF NOT EXISTS idx_queue_priority ON document_processing_queue(priority);
CREATE INDEX IF NOT EXISTS idx_queue_created_at ON document_processing_queue(created_at);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_document_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_document_updated_at();

CREATE OR REPLACE FUNCTION update_processing_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_processing_results_updated_at
    BEFORE UPDATE ON document_processing_results
    FOR EACH ROW
    EXECUTE FUNCTION update_processing_results_updated_at();

CREATE OR REPLACE FUNCTION update_extracted_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_extracted_info_updated_at
    BEFORE UPDATE ON document_extracted_info
    FOR EACH ROW
    EXECUTE FUNCTION update_extracted_info_updated_at();

CREATE OR REPLACE FUNCTION update_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_queue_updated_at
    BEFORE UPDATE ON document_processing_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_queue_updated_at();

-- Create comprehensive views
CREATE OR REPLACE VIEW document_summary AS
SELECT 
    d.id,
    d.user_id,
    d.user_email,
    d.original_filename,
    d.file_size_bytes,
    d.document_type,
    d.is_active,
    d.processing_status,
    d.uploaded_at,
    
    -- Processing data
    dpr.processed_at,
    dpr.text_length,
    dpr.word_count,
    dpr.pdf_total_pages,
    dpr.processing_time_ms,
    dpr.processing_method,
    
    -- Extracted info
    dei.extracted_name,
    dei.extracted_email,
    dei.extracted_phone,
    dei.skills,
    
    -- Asset counts
    (SELECT COUNT(*) FROM document_assets da WHERE da.document_id = d.id) as assets_count,
    (SELECT COUNT(*) FROM document_assets da WHERE da.document_id = d.id AND da.asset_type = 'preview') as previews_count
    
FROM documents d
LEFT JOIN document_processing_results dpr ON d.id = dpr.document_id
LEFT JOIN document_extracted_info dei ON d.id = dei.document_id
WHERE d.deleted_at IS NULL
ORDER BY d.uploaded_at DESC;

-- View for processing statistics
CREATE OR REPLACE VIEW processing_statistics AS
SELECT 
    COUNT(*) as total_documents,
    COUNT(*) FILTER (WHERE processing_status = 'completed') as processed_documents,
    COUNT(*) FILTER (WHERE processing_status = 'pending') as pending_documents,
    COUNT(*) FILTER (WHERE processing_status = 'failed') as failed_documents,
    COUNT(DISTINCT user_id) as total_users,
    AVG(dpr.processing_time_ms) as avg_processing_time_ms,
    MAX(dpr.processed_at) as last_processed_at,
    SUM(dpr.text_length) as total_text_extracted
FROM documents d
LEFT JOIN document_processing_results dpr ON d.id = dpr.document_id
WHERE d.deleted_at IS NULL;

COMMENT ON TABLE documents IS 'Main document storage table replacing Firebase documents';
COMMENT ON TABLE document_processing_results IS 'Results from PDF processing, including CLI outputs';
COMMENT ON TABLE document_extracted_info IS 'Structured information extracted from documents';
COMMENT ON TABLE document_assets IS 'Generated assets like previews and extracted images';
COMMENT ON TABLE document_processing_queue IS 'Queue for background document processing';
COMMENT ON VIEW document_summary IS 'Comprehensive document overview with processing results';
COMMENT ON VIEW processing_statistics IS 'Aggregated processing statistics and metrics';
