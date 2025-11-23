-- Resume Processing Data Functions
-- SQL functions for storing and retrieving processed resume data

-- Function to store processed resume data
CREATE OR REPLACE FUNCTION store_processed_resume(
    p_resume_id UUID,
    p_extracted_text TEXT,
    p_extracted_name VARCHAR(255) DEFAULT NULL,
    p_extracted_email VARCHAR(255) DEFAULT NULL,
    p_extracted_phone VARCHAR(50) DEFAULT NULL,
    p_processing_status VARCHAR(20) DEFAULT 'completed',
    p_processing_error TEXT DEFAULT NULL,
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
    est_pages := CEIL(word_count::DECIMAL / 500); -- Rough estimate: 500 words per page
    
    -- Insert processed resume data
    INSERT INTO processed_resumes (
        resume_id,
        extracted_text,
        text_length,
        word_count,
        line_count,
        estimated_pages,
        extracted_name,
        extracted_email,
        extracted_phone,
        processing_status,
        processing_error
    ) VALUES (
        p_resume_id,
        p_extracted_text,
        text_len,
        word_count,
        line_count,
        est_pages,
        p_extracted_name,
        p_extracted_email,
        p_extracted_phone,
        p_processing_status,
        p_processing_error
    ) RETURNING id INTO processed_id;
    
    -- Insert analytics data if provided
    IF p_processing_time_ms IS NOT NULL OR p_extraction_confidence IS NOT NULL THEN
        INSERT INTO resume_processing_analytics (
            processed_resume_id,
            processing_time_ms,
            extraction_confidence
        ) VALUES (
            processed_id,
            p_processing_time_ms,
            p_extraction_confidence
        );
    END IF;
    
    RETURN processed_id;
END;
$$ LANGUAGE plpgsql;

-- Function to store skills for a processed resume
CREATE OR REPLACE FUNCTION store_resume_skills(
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
            INSERT INTO resume_skills (
                processed_resume_id,
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

-- Function to store experience for a processed resume
CREATE OR REPLACE FUNCTION store_resume_experience(
    p_processed_resume_id UUID,
    p_experience JSON -- Array of experience objects
) RETURNS INTEGER AS $$
DECLARE
    exp_count INTEGER := 0;
    exp_record JSON;
    company_name VARCHAR(255);
    job_title VARCHAR(255);
    start_date DATE;
    end_date DATE;
    is_current BOOLEAN;
    description TEXT;
    location VARCHAR(255);
    duration_months INTEGER;
BEGIN
    -- Loop through experience array
    FOR exp_record IN SELECT * FROM json_array_elements(p_experience) LOOP
        company_name := exp_record->>'company';
        job_title := exp_record->>'job_title';
        start_date := (exp_record->>'start_date')::DATE;
        end_date := (exp_record->>'end_date')::DATE;
        is_current := COALESCE((exp_record->>'is_current')::BOOLEAN, FALSE);
        description := exp_record->>'description';
        location := exp_record->>'location';
        
        -- Calculate duration in months
        IF end_date IS NOT NULL THEN
            duration_months := (EXTRACT(YEAR FROM end_date) - EXTRACT(YEAR FROM start_date)) * 12 +
                              (EXTRACT(MONTH FROM end_date) - EXTRACT(MONTH FROM start_date));
        ELSE
            duration_months := (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM start_date)) * 12 +
                              (EXTRACT(MONTH FROM CURRENT_DATE) - EXTRACT(MONTH FROM start_date));
        END IF;
        
        -- Insert experience if company or job title is provided
        IF company_name IS NOT NULL OR job_title IS NOT NULL THEN
            INSERT INTO resume_experience (
                processed_resume_id,
                company_name,
                job_title,
                start_date,
                end_date,
                is_current,
                description,
                location,
                duration_months
            ) VALUES (
                p_processed_resume_id,
                company_name,
                job_title,
                start_date,
                end_date,
                is_current,
                description,
                location,
                duration_months
            );
            
            exp_count := exp_count + 1;
        END IF;
    END LOOP;
    
    RETURN exp_count;
END;
$$ LANGUAGE plpgsql;

-- Function to store education for a processed resume
CREATE OR REPLACE FUNCTION store_resume_education(
    p_processed_resume_id UUID,
    p_education JSON -- Array of education objects
) RETURNS INTEGER AS $$
DECLARE
    edu_count INTEGER := 0;
    edu_record JSON;
    institution_name VARCHAR(255);
    degree VARCHAR(255);
    field_of_study VARCHAR(255);
    start_date DATE;
    end_date DATE;
    gpa DECIMAL(3,2);
    description TEXT;
    location VARCHAR(255);
    is_current BOOLEAN;
BEGIN
    -- Loop through education array
    FOR edu_record IN SELECT * FROM json_array_elements(p_education) LOOP
        institution_name := edu_record->>'institution';
        degree := edu_record->>'degree';
        field_of_study := edu_record->>'field_of_study';
        start_date := (edu_record->>'start_date')::DATE;
        end_date := (edu_record->>'end_date')::DATE;
        gpa := (edu_record->>'gpa')::DECIMAL;
        description := edu_record->>'description';
        location := edu_record->>'location';
        is_current := COALESCE((edu_record->>'is_current')::BOOLEAN, FALSE);
        
        -- Insert education if institution is provided
        IF institution_name IS NOT NULL AND institution_name != '' THEN
            INSERT INTO resume_education (
                processed_resume_id,
                institution_name,
                degree,
                field_of_study,
                start_date,
                end_date,
                gpa,
                description,
                location,
                is_current
            ) VALUES (
                p_processed_resume_id,
                institution_name,
                degree,
                field_of_study,
                start_date,
                end_date,
                gpa,
                description,
                location,
                is_current
            );
            
            edu_count := edu_count + 1;
        END IF;
    END LOOP;
    
    RETURN edu_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get processed resume data by resume ID
CREATE OR REPLACE FUNCTION get_processed_resume(p_resume_id UUID)
RETURNS TABLE (
    processed_id UUID,
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_status VARCHAR(20),
    extracted_text TEXT,
    text_length INTEGER,
    word_count INTEGER,
    line_count INTEGER,
    estimated_pages INTEGER,
    extracted_name VARCHAR(255),
    extracted_email VARCHAR(255),
    extracted_phone VARCHAR(50),
    skills_count INTEGER,
    experience_count INTEGER,
    education_count INTEGER,
    processing_time_ms INTEGER,
    extraction_confidence DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.id,
        pr.processed_at,
        pr.processing_status,
        pr.extracted_text,
        pr.text_length,
        pr.word_count,
        pr.line_count,
        pr.estimated_pages,
        pr.extracted_name,
        pr.extracted_email,
        pr.extracted_phone,
        (SELECT COUNT(*) FROM resume_skills rs WHERE rs.processed_resume_id = pr.id),
        (SELECT COUNT(*) FROM resume_experience re WHERE re.processed_resume_id = pr.id),
        (SELECT COUNT(*) FROM resume_education reu WHERE reu.processed_resume_id = pr.id),
        rpa.processing_time_ms,
        rpa.extraction_confidence
    FROM processed_resumes pr
    LEFT JOIN resume_processing_analytics rpa ON pr.id = rpa.processed_resume_id
    WHERE pr.resume_id = p_resume_id
    ORDER BY pr.processed_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get all processed resumes for a user
CREATE OR REPLACE FUNCTION get_user_processed_resumes(p_email VARCHAR(255))
RETURNS TABLE (
    processed_id UUID,
    resume_id UUID,
    filename VARCHAR(255),
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_status VARCHAR(20),
    extracted_name VARCHAR(255),
    extracted_email VARCHAR(255),
    text_length INTEGER,
    word_count INTEGER,
    skills_count INTEGER,
    experience_count INTEGER,
    education_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.id,
        pr.resume_id,
        rf.filename,
        pr.processed_at,
        pr.processing_status,
        pr.extracted_name,
        pr.extracted_email,
        pr.text_length,
        pr.word_count,
        (SELECT COUNT(*) FROM resume_skills rs WHERE rs.processed_resume_id = pr.id),
        (SELECT COUNT(*) FROM resume_experience re WHERE re.processed_resume_id = pr.id),
        (SELECT COUNT(*) FROM resume_education reu WHERE reu.processed_resume_id = pr.id)
    FROM processed_resumes pr
    JOIN resume_files_email rf ON pr.resume_id = rf.id
    WHERE rf.email = p_email
    ORDER BY pr.processed_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to delete processed resume data
CREATE OR REPLACE FUNCTION delete_processed_resume(p_resume_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete related data first (due to foreign key constraints)
    DELETE FROM resume_processing_analytics WHERE processed_resume_id IN (
        SELECT id FROM processed_resumes WHERE resume_id = p_resume_id
    );
    DELETE FROM resume_skills WHERE processed_resume_id IN (
        SELECT id FROM processed_resumes WHERE resume_id = p_resume_id
    );
    DELETE FROM resume_experience WHERE processed_resume_id IN (
        SELECT id FROM processed_resumes WHERE resume_id = p_resume_id
    );
    DELETE FROM resume_education WHERE processed_resume_id IN (
        SELECT id FROM processed_resumes WHERE resume_id = p_resume_id
    );
    
    -- Delete the processed resume records
    DELETE FROM processed_resumes WHERE resume_id = p_resume_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get skills statistics across all resumes
CREATE OR REPLACE FUNCTION get_skills_statistics()
RETURNS TABLE (
    skill_name VARCHAR(100),
    skill_category VARCHAR(50),
    total_count INTEGER,
    avg_confidence DECIMAL(3,2),
    unique_users INTEGER,
    last_seen TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rs.skill_name,
        rs.skill_category,
        COUNT(*) as total_count,
        AVG(rs.confidence_score) as avg_confidence,
        COUNT(DISTINCT rf.email) as unique_users,
        MAX(pr.processed_at) as last_seen
    FROM resume_skills rs
    JOIN processed_resumes pr ON rs.processed_resume_id = pr.id
    JOIN resume_files_email rf ON pr.resume_id = rf.id
    GROUP BY rs.skill_name, rs.skill_category
    ORDER BY total_count DESC, avg_confidence DESC;
END;
$$ LANGUAGE plpgsql;
