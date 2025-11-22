-- Firebase File Metadata Functions
-- SQL functions for managing Firebase file metadata and processed data

-- Function to store Firebase file metadata
CREATE OR REPLACE FUNCTION store_firebase_file_metadata(
    p_user_id VARCHAR(255),
    p_user_email VARCHAR(255),
    p_original_filename VARCHAR(255),
    p_storage_filename VARCHAR(255),
    p_firebase_storage_path VARCHAR(500),
    p_firebase_download_url TEXT,
    p_file_size_bytes BIGINT,
    p_file_type VARCHAR(100),
    p_mime_type VARCHAR(100) DEFAULT NULL,
    p_is_resume BOOLEAN DEFAULT FALSE,
    p_firebase_file_id VARCHAR(255) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    metadata_id UUID;
BEGIN
    -- Insert Firebase file metadata
    INSERT INTO firebase_file_metadata (
        user_id,
        user_email,
        original_filename,
        storage_filename,
        firebase_storage_path,
        firebase_download_url,
        file_size_bytes,
        file_type,
        mime_type,
        is_resume,
        firebase_file_id
    ) VALUES (
        p_user_id,
        p_user_email,
        p_original_filename,
        p_storage_filename,
        p_firebase_storage_path,
        p_firebase_download_url,
        p_file_size_bytes,
        p_file_type,
        p_mime_type,
        p_is_resume,
        p_firebase_file_id
    ) RETURNING id INTO metadata_id;
    
    RETURN metadata_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update Firebase file processing status
CREATE OR REPLACE FUNCTION update_firebase_file_processing(
    p_metadata_id UUID,
    p_processing_status VARCHAR(20),
    p_processing_error TEXT DEFAULT NULL,
    p_processing_time_ms INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE firebase_file_metadata 
    SET 
        processing_status = p_processing_status,
        processing_error = p_processing_error,
        is_processed = (p_processing_status = 'completed'),
        processed_at = CASE WHEN p_processing_status = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END
    WHERE id = p_metadata_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to store processed Firebase resume data
CREATE OR REPLACE FUNCTION store_firebase_processed_resume(
    p_metadata_id UUID,
    p_extracted_text TEXT,
    p_extracted_name VARCHAR(255) DEFAULT NULL,
    p_extracted_email VARCHAR(255) DEFAULT NULL,
    p_extracted_phone VARCHAR(50) DEFAULT NULL,
    p_processing_time_ms INTEGER DEFAULT NULL,
    p_extraction_confidence DECIMAL(3,2) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    processed_id UUID;
    text_len INTEGER;
    word_count INTEGER;
    line_count INTEGER;
    est_pages INTEGER;
BEGIN
    -- Calculate text statistics
    text_len := COALESCE(LENGTH(p_extracted_text), 0);
    word_count := COALESCE(array_length(string_to_array(p_extracted_text, ' '), 1), 0);
    line_count := COALESCE(array_length(string_to_array(p_extracted_text, E'\n'), 1), 0);
    est_pages := CEIL(word_count::DECIMAL / 500);
    
    -- Insert processed resume data
    INSERT INTO firebase_processed_resumes (
        firebase_metadata_id,
        extracted_text,
        text_length,
        word_count,
        line_count,
        estimated_pages,
        extracted_name,
        extracted_email,
        extracted_phone,
        processing_time_ms,
        extraction_confidence
    ) VALUES (
        p_metadata_id,
        p_extracted_text,
        text_len,
        word_count,
        line_count,
        est_pages,
        p_extracted_name,
        p_extracted_email,
        p_extracted_phone,
        p_processing_time_ms,
        p_extraction_confidence
    ) RETURNING id INTO processed_id;
    
    -- Update the metadata record
    UPDATE firebase_file_metadata 
    SET 
        is_processed = TRUE,
        processed_at = CURRENT_TIMESTAMP,
        processing_status = 'completed'
    WHERE id = p_metadata_id;
    
    RETURN processed_id;
END;
$$ LANGUAGE plpgsql;

-- Function to store Firebase resume skills
CREATE OR REPLACE FUNCTION store_firebase_resume_skills(
    p_processed_resume_id UUID,
    p_skills JSON -- Array of skill objects with name, category, confidence, context
) RETURNS INTEGER AS $$
DECLARE
    skill_count INTEGER := 0;
    skill_record JSON;
    skill_name VARCHAR(100);
    skill_category VARCHAR(50);
    confidence_score DECIMAL(3,2);
    context_snippet TEXT;
BEGIN
    -- Loop through skills array
    FOR skill_record IN SELECT * FROM json_array_elements(p_skills) LOOP
        skill_name := skill_record->>'name';
        skill_category := skill_record->>'category';
        confidence_score := COALESCE((skill_record->>'confidence')::DECIMAL, 0.0);
        context_snippet := skill_record->>'context';
        
        -- Insert skill if name is provided
        IF skill_name IS NOT NULL AND skill_name != '' THEN
            INSERT INTO firebase_resume_skills (
                firebase_processed_resume_id,
                skill_name,
                skill_category,
                confidence_score,
                context_snippet
            ) VALUES (
                p_processed_resume_id,
                skill_name,
                skill_category,
                confidence_score,
                context_snippet
            );
            
            skill_count := skill_count + 1;
        END IF;
    END LOOP;
    
    RETURN skill_count;
END;
$$ LANGUAGE plpgsql;

-- Function to set active Firebase resume for a user
CREATE OR REPLACE FUNCTION set_active_firebase_resume(
    p_user_id VARCHAR(255),
    p_metadata_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Deactivate all resumes for this user
    UPDATE firebase_file_metadata 
    SET is_active = FALSE 
    WHERE user_id = p_user_id AND is_resume = TRUE AND deleted_at IS NULL;
    
    -- Activate the selected resume
    UPDATE firebase_file_metadata 
    SET is_active = TRUE 
    WHERE id = p_metadata_id AND user_id = p_user_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get Firebase file metadata by user
CREATE OR REPLACE FUNCTION get_user_firebase_files(p_user_id VARCHAR(255))
RETURNS TABLE (
    metadata_id UUID,
    original_filename VARCHAR(255),
    file_size_bytes BIGINT,
    file_type VARCHAR(100),
    is_resume BOOLEAN,
    is_active BOOLEAN,
    is_processed BOOLEAN,
    firebase_download_url TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_status VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ffm.id,
        ffm.original_filename,
        ffm.file_size_bytes,
        ffm.file_type,
        ffm.is_resume,
        ffm.is_active,
        ffm.is_processed,
        ffm.firebase_download_url,
        ffm.uploaded_at,
        fpr.processed_at,
        ffm.processing_status
    FROM firebase_file_metadata ffm
    LEFT JOIN firebase_processed_resumes fpr ON ffm.id = fpr.firebase_metadata_id
    WHERE ffm.user_id = p_user_id 
      AND ffm.deleted_at IS NULL
    ORDER BY ffm.uploaded_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get active Firebase resume for a user
CREATE OR REPLACE FUNCTION get_active_firebase_resume(p_user_id VARCHAR(255))
RETURNS TABLE (
    metadata_id UUID,
    original_filename VARCHAR(255),
    file_size_bytes BIGINT,
    firebase_download_url TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    text_length INTEGER,
    word_count INTEGER,
    extracted_name VARCHAR(255),
    extracted_email VARCHAR(255),
    skills_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ffm.id,
        ffm.original_filename,
        ffm.file_size_bytes,
        ffm.firebase_download_url,
        ffm.uploaded_at,
        fpr.processed_at,
        fpr.text_length,
        fpr.word_count,
        fpr.extracted_name,
        fpr.extracted_email,
        (SELECT COUNT(*) FROM firebase_resume_skills frs WHERE frs.firebase_processed_resume_id = fpr.id)
    FROM firebase_file_metadata ffm
    LEFT JOIN firebase_processed_resumes fpr ON ffm.id = fpr.firebase_metadata_id
    WHERE ffm.user_id = p_user_id 
      AND ffm.is_resume = TRUE 
      AND ffm.is_active = TRUE 
      AND ffm.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get processed Firebase resume data
CREATE OR REPLACE FUNCTION get_processed_firebase_resume(p_metadata_id UUID)
RETURNS TABLE (
    processed_id UUID,
    processed_at TIMESTAMP WITH TIME ZONE,
    extracted_text TEXT,
    text_length INTEGER,
    word_count INTEGER,
    line_count INTEGER,
    estimated_pages INTEGER,
    extracted_name VARCHAR(255),
    extracted_email VARCHAR(255),
    extracted_phone VARCHAR(50),
    skills_count INTEGER,
    processing_time_ms INTEGER,
    extraction_confidence DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fpr.id,
        fpr.processed_at,
        fpr.extracted_text,
        fpr.text_length,
        fpr.word_count,
        fpr.line_count,
        fpr.estimated_pages,
        fpr.extracted_name,
        fpr.extracted_email,
        fpr.extracted_phone,
        (SELECT COUNT(*) FROM firebase_resume_skills frs WHERE frs.firebase_processed_resume_id = fpr.id),
        fpr.processing_time_ms,
        fpr.extraction_confidence
    FROM firebase_processed_resumes fpr
    WHERE fpr.firebase_metadata_id = p_metadata_id
    ORDER BY fpr.processed_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to soft delete Firebase file metadata
CREATE OR REPLACE FUNCTION soft_delete_firebase_file(p_metadata_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE firebase_file_metadata 
    SET deleted_at = CURRENT_TIMESTAMP, is_active = FALSE
    WHERE id = p_metadata_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get Firebase processing statistics
CREATE OR REPLACE FUNCTION get_firebase_processing_statistics()
RETURNS TABLE (
    total_files INTEGER,
    processed_files INTEGER,
    pending_files INTEGER,
    failed_files INTEGER,
    total_users INTEGER,
    avg_processing_time_ms DECIMAL,
    total_skills_extracted INTEGER,
    last_processed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_files,
        COUNT(*) FILTER (WHERE is_processed = TRUE AND deleted_at IS NULL) as processed_files,
        COUNT(*) FILTER (WHERE processing_status = 'pending' AND deleted_at IS NULL) as pending_files,
        COUNT(*) FILTER (WHERE processing_status = 'failed' AND deleted_at IS NULL) as failed_files,
        COUNT(DISTINCT user_id) FILTER (WHERE deleted_at IS NULL) as total_users,
        AVG(fpr.processing_time_ms) as avg_processing_time_ms,
        (SELECT COUNT(*) FROM firebase_resume_skills) as total_skills_extracted,
        MAX(fpr.processed_at) as last_processed_at
    FROM firebase_file_metadata ffm
    LEFT JOIN firebase_processed_resumes fpr ON ffm.id = fpr.firebase_metadata_id;
END;
$$ LANGUAGE plpgsql;
