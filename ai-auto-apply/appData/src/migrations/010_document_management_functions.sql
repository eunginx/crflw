-- Document Management Functions
-- SQL functions for PostgreSQL-based document management with CLI integration

-- Function to store document metadata
CREATE OR REPLACE FUNCTION store_document(
    p_user_id VARCHAR(255),
    p_user_email VARCHAR(255),
    p_original_filename VARCHAR(255),
    p_stored_filename VARCHAR(255),
    p_file_path VARCHAR(500),
    p_file_size_bytes BIGINT,
    p_file_type VARCHAR(100),
    p_mime_type VARCHAR(100) DEFAULT NULL,
    p_document_type VARCHAR(50) DEFAULT 'resume',
    p_storage_backend VARCHAR(20) DEFAULT 'local',
    p_storage_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    document_id UUID;
BEGIN
    -- Insert document metadata
    INSERT INTO documents (
        user_id,
        user_email,
        original_filename,
        stored_filename,
        file_path,
        file_size_bytes,
        file_type,
        mime_type,
        document_type,
        storage_backend,
        storage_url
    ) VALUES (
        p_user_id,
        p_user_email,
        p_original_filename,
        p_stored_filename,
        p_file_path,
        p_file_size_bytes,
        p_file_type,
        p_mime_type,
        p_document_type,
        p_storage_backend,
        p_storage_url
    ) RETURNING id INTO document_id;
    
    RETURN document_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update document processing status
CREATE OR REPLACE FUNCTION update_document_processing_status(
    p_document_id UUID,
    p_processing_status VARCHAR(20),
    p_processing_error TEXT DEFAULT NULL,
    p_processing_time_ms INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE documents 
    SET 
        processing_status = p_processing_status,
        processing_error = p_processing_error,
        processing_time_ms = p_processing_time_ms,
        processed_at = CASE WHEN p_processing_status = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END
    WHERE id = p_document_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to store CLI processing results
CREATE OR REPLACE FUNCTION store_cli_processing_results(
    p_document_id UUID,
    p_extracted_text TEXT,
    p_cli_output JSONB,
    p_cli_version VARCHAR(20) DEFAULT '2.4.5',
    p_cli_command TEXT DEFAULT NULL,
    p_processing_time_ms INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    processing_result_id UUID;
    text_len INTEGER;
    word_count INTEGER;
    line_count INTEGER;
    est_pages INTEGER;
    
    -- Extract CLI output data
    cli_info JSONB;
    pdf_metadata JSONB;
BEGIN
    -- Calculate text statistics
    text_len := COALESCE(LENGTH(p_extracted_text), 0);
    word_count := COALESCE(array_length(string_to_array(p_extracted_text, ' '), 1), 0);
    line_count := COALESCE(array_length(string_to_array(p_extracted_text, E'\n'), 1), 0);
    est_pages := CEIL(word_count::DECIMAL / 500);
    
    -- Extract PDF metadata from CLI output
    cli_info := p_cli_output->'info';
    pdf_metadata := COALESCE(cli_info, '{}'::JSONB);
    
    -- Insert processing results
    INSERT INTO document_processing_results (
        document_id,
        processed_at,
        processing_method,
        processing_time_ms,
        extracted_text,
        text_length,
        word_count,
        line_count,
        estimated_pages,
        pdf_title,
        pdf_author,
        pdf_creator,
        pdf_producer,
        pdf_total_pages,
        cli_version,
        cli_command,
        cli_output
    ) VALUES (
        p_document_id,
        CURRENT_TIMESTAMP,
        'pdf-parse-cli',
        p_processing_time_ms,
        p_extracted_text,
        text_len,
        word_count,
        line_count,
        est_pages,
        pdf_metadata->>'Title',
        pdf_metadata->>'Author',
        pdf_metadata->>'Creator',
        pdf_metadata->>'Producer',
        (p_cli_output->>'total')::INTEGER,
        p_cli_version,
        p_cli_command,
        p_cli_output
    ) RETURNING id INTO processing_result_id;
    
    -- Update the document status
    UPDATE documents 
    SET 
        processing_status = 'completed',
        processed_at = CURRENT_TIMESTAMP
    WHERE id = p_document_id;
    
    RETURN processing_result_id;
END;
$$ LANGUAGE plpgsql;

-- Function to store extracted structured information
CREATE OR REPLACE FUNCTION store_extracted_document_info(
    p_document_id UUID,
    p_processing_result_id UUID,
    p_extracted_name VARCHAR(255) DEFAULT NULL,
    p_extracted_email VARCHAR(255) DEFAULT NULL,
    p_extracted_phone VARCHAR(50) DEFAULT NULL,
    p_extracted_address TEXT DEFAULT NULL,
    p_job_title VARCHAR(255) DEFAULT NULL,
    p_company VARCHAR(255) DEFAULT NULL,
    p_skills JSONB DEFAULT NULL,
    p_experience_years INTEGER DEFAULT NULL,
    p_education_level VARCHAR(50) DEFAULT NULL,
    p_name_confidence DECIMAL(3,2) DEFAULT NULL,
    p_email_confidence DECIMAL(3,2) DEFAULT NULL,
    p_phone_confidence DECIMAL(3,2) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    extracted_info_id UUID;
BEGIN
    -- Insert extracted information
    INSERT INTO document_extracted_info (
        document_id,
        processing_result_id,
        extracted_name,
        extracted_email,
        extracted_phone,
        extracted_address,
        job_title,
        company,
        skills,
        experience_years,
        education_level,
        name_confidence,
        email_confidence,
        phone_confidence
    ) VALUES (
        p_document_id,
        p_processing_result_id,
        p_extracted_name,
        p_extracted_email,
        p_extracted_phone,
        p_extracted_address,
        p_job_title,
        p_company,
        p_skills,
        p_experience_years,
        p_education_level,
        p_name_confidence,
        p_email_confidence,
        p_phone_confidence
    ) RETURNING id INTO extracted_info_id;
    
    RETURN extracted_info_id;
END;
$$ LANGUAGE plpgsql;

-- Function to store document assets (previews, images, etc.)
CREATE OR REPLACE FUNCTION store_document_asset(
    p_document_id UUID,
    p_asset_type VARCHAR(20),
    p_asset_format VARCHAR(10),
    p_file_path VARCHAR(500) DEFAULT NULL,
    p_file_size_bytes BIGINT DEFAULT NULL,
    p_page_number INTEGER DEFAULT NULL,
    p_width INTEGER DEFAULT NULL,
    p_height INTEGER DEFAULT NULL,
    p_generation_command TEXT DEFAULT NULL,
    p_generation_time_ms INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    asset_id UUID;
BEGIN
    -- Insert asset
    INSERT INTO document_assets (
        document_id,
        asset_type,
        asset_format,
        file_path,
        file_size_bytes,
        page_number,
        width,
        height,
        generation_command,
        generation_time_ms
    ) VALUES (
        p_document_id,
        p_asset_type,
        p_asset_format,
        p_file_path,
        p_file_size_bytes,
        p_page_number,
        p_width,
        p_height,
        p_generation_command,
        p_generation_time_ms
    ) RETURNING id INTO asset_id;
    
    RETURN asset_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add document to processing queue
CREATE OR REPLACE FUNCTION queue_document_for_processing(
    p_document_id UUID,
    p_processing_options JSONB DEFAULT NULL,
    p_priority INTEGER DEFAULT 5
) RETURNS UUID AS $$
DECLARE
    queue_id UUID;
BEGIN
    -- Add to processing queue
    INSERT INTO document_processing_queue (
        document_id,
        processing_options,
        priority
    ) VALUES (
        p_document_id,
        p_processing_options,
        p_priority
    ) RETURNING id INTO queue_id;
    
    -- Update document status to processing
    UPDATE documents 
    SET processing_status = 'processing'
    WHERE id = p_document_id;
    
    RETURN queue_id;
END;
$$ LANGUAGE plpgsql;

-- Function to set active document for a user
CREATE OR REPLACE FUNCTION set_active_document(
    p_user_id VARCHAR(255),
    p_document_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Deactivate all documents for this user
    UPDATE documents 
    SET is_active = FALSE 
    WHERE user_id = p_user_id AND document_type = 'resume' AND deleted_at IS NULL;
    
    -- Activate the selected document
    UPDATE documents 
    SET is_active = TRUE 
    WHERE id = p_document_id AND user_id = p_user_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's documents
CREATE OR REPLACE FUNCTION get_user_documents(p_user_id VARCHAR(255))
RETURNS TABLE (
    document_id UUID,
    original_filename VARCHAR(255),
    file_size_bytes BIGINT,
    file_type VARCHAR(100),
    document_type VARCHAR(50),
    is_active BOOLEAN,
    processing_status VARCHAR(20),
    uploaded_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    text_length INTEGER,
    word_count INTEGER,
    pdf_total_pages INTEGER,
    processing_time_ms INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.original_filename,
        d.file_size_bytes,
        d.file_type,
        d.document_type,
        d.is_active,
        d.processing_status,
        d.uploaded_at,
        dpr.processed_at,
        dpr.text_length,
        dpr.word_count,
        dpr.pdf_total_pages,
        dpr.processing_time_ms
    FROM documents d
    LEFT JOIN document_processing_results dpr ON d.id = dpr.document_id
    WHERE d.user_id = p_user_id 
      AND d.deleted_at IS NULL
    ORDER BY d.uploaded_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get active document for a user
CREATE OR REPLACE FUNCTION get_active_document(p_user_id VARCHAR(255))
RETURNS TABLE (
    document_id UUID,
    original_filename VARCHAR(255),
    file_size_bytes BIGINT,
    file_path VARCHAR(500),
    uploaded_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    text_length INTEGER,
    word_count INTEGER,
    extracted_name VARCHAR(255),
    extracted_email VARCHAR(255),
    pdf_total_pages INTEGER,
    assets_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.original_filename,
        d.file_size_bytes,
        d.file_path,
        d.uploaded_at,
        dpr.processed_at,
        dpr.text_length,
        dpr.word_count,
        dei.extracted_name,
        dei.extracted_email,
        dpr.pdf_total_pages,
        (SELECT COUNT(*) FROM document_assets da WHERE da.document_id = d.id)
    FROM documents d
    LEFT JOIN document_processing_results dpr ON d.id = dpr.document_id
    LEFT JOIN document_extracted_info dei ON d.id = dei.document_id
    WHERE d.user_id = p_user_id 
      AND d.document_type = 'resume' 
      AND d.is_active = TRUE 
      AND d.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get document processing results
CREATE OR REPLACE FUNCTION get_document_processing_results(p_document_id UUID)
RETURNS TABLE (
    processing_result_id UUID,
    processed_at TIMESTAMP WITH TIME ZONE,
    extracted_text TEXT,
    text_length INTEGER,
    word_count INTEGER,
    line_count INTEGER,
    estimated_pages INTEGER,
    pdf_title VARCHAR(500),
    pdf_author VARCHAR(255),
    pdf_creator VARCHAR(255),
    pdf_producer VARCHAR(255),
    pdf_total_pages INTEGER,
    cli_version VARCHAR(20),
    cli_command TEXT,
    cli_output JSONB,
    processing_time_ms INTEGER,
    assets_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dpr.id,
        dpr.processed_at,
        dpr.extracted_text,
        dpr.text_length,
        dpr.word_count,
        dpr.line_count,
        dpr.estimated_pages,
        dpr.pdf_title,
        dpr.pdf_author,
        dpr.pdf_creator,
        dpr.pdf_producer,
        dpr.pdf_total_pages,
        dpr.cli_version,
        dpr.cli_command,
        dpr.cli_output,
        dpr.processing_time_ms,
        (SELECT COUNT(*) FROM document_assets da WHERE da.document_id = dpr.document_id)
    FROM document_processing_results dpr
    WHERE dpr.document_id = p_document_id
    ORDER BY dpr.processed_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to soft delete document
CREATE OR REPLACE FUNCTION soft_delete_document(p_document_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE documents 
    SET deleted_at = CURRENT_TIMESTAMP, is_active = FALSE
    WHERE id = p_document_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get processing queue items
CREATE OR REPLACE FUNCTION get_processing_queue(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    queue_id UUID,
    document_id UUID,
    user_id VARCHAR(255),
    original_filename VARCHAR(255),
    queue_status VARCHAR(20),
    priority INTEGER,
    processing_options JSONB,
    retry_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dpq.id,
        dpq.document_id,
        d.user_id,
        d.original_filename,
        dpq.queue_status,
        dpq.priority,
        dpq.processing_options,
        dpq.retry_count,
        dpq.created_at
    FROM document_processing_queue dpq
    JOIN documents d ON dpq.document_id = d.id
    WHERE dpq.queue_status IN ('queued', 'processing')
    ORDER BY dpq.priority ASC, dpq.created_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update queue status
CREATE OR REPLACE FUNCTION update_queue_status(
    p_queue_id UUID,
    p_queue_status VARCHAR(20),
    p_error_message TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE document_processing_queue 
    SET 
        queue_status = p_queue_status,
        error_message = p_error_message,
        completed_at = CASE WHEN p_queue_status IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE NULL END
    WHERE id = p_queue_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get document management statistics
CREATE OR REPLACE FUNCTION get_document_management_statistics()
RETURNS TABLE (
    total_documents INTEGER,
    processed_documents INTEGER,
    pending_documents INTEGER,
    failed_documents INTEGER,
    total_users INTEGER,
    avg_processing_time_ms DECIMAL,
    total_text_extracted BIGINT,
    total_assets_generated INTEGER,
    queue_size INTEGER,
    last_processed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_documents,
        COUNT(*) FILTER (WHERE processing_status = 'completed' AND deleted_at IS NULL) as processed_documents,
        COUNT(*) FILTER (WHERE processing_status = 'pending' AND deleted_at IS NULL) as pending_documents,
        COUNT(*) FILTER (WHERE processing_status = 'failed' AND deleted_at IS NULL) as failed_documents,
        COUNT(DISTINCT user_id) FILTER (WHERE deleted_at IS NULL) as total_users,
        AVG(dpr.processing_time_ms) as avg_processing_time_ms,
        SUM(dpr.text_length) as total_text_extracted,
        (SELECT COUNT(*) FROM document_assets) as total_assets_generated,
        (SELECT COUNT(*) FROM document_processing_queue WHERE queue_status IN ('queued', 'processing')) as queue_size,
        MAX(dpr.processed_at) as last_processed_at
    FROM documents d
    LEFT JOIN document_processing_results dpr ON d.id = dpr.document_id;
END;
$$ LANGUAGE plpgsql;
