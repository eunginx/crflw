-- Resume Processing Data Schema
-- Handles processed resume information including extracted text, structured data, and statistics

-- Table for storing processed resume data
CREATE TABLE IF NOT EXISTS processed_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID NOT NULL REFERENCES resume_files_email(id) ON DELETE CASCADE,
    
    -- Processing metadata
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processing_version VARCHAR(10) DEFAULT '1.0',
    processing_status VARCHAR(20) DEFAULT 'completed' CHECK (processing_status IN ('pending', 'completed', 'failed')),
    processing_error TEXT,
    
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
    
    -- Processing metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_processing_status_valid CHECK (processing_status IN ('pending', 'completed', 'failed')),
    CONSTRAINT chk_text_length_positive CHECK (text_length >= 0),
    CONSTRAINT chk_word_count_positive CHECK (word_count >= 0),
    CONSTRAINT chk_line_count_positive CHECK (line_count >= 0),
    CONSTRAINT chk_estimated_pages_positive CHECK (estimated_pages >= 0)
);

-- Table for storing extracted skills
CREATE TABLE IF NOT EXISTS resume_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processed_resume_id UUID NOT NULL REFERENCES processed_resumes(id) ON DELETE CASCADE,
    
    -- Skill information
    skill_name VARCHAR(100) NOT NULL,
    skill_category VARCHAR(50), -- e.g., 'technical', 'soft', 'language', 'certification'
    confidence_score DECIMAL(3,2) DEFAULT 0.0, -- 0.00 to 1.00
    context_snippet TEXT, -- Where the skill was found in the text
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_confidence_range CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0)
);

-- Table for storing extracted experience entries
CREATE TABLE IF NOT EXISTS resume_experience (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processed_resume_id UUID NOT NULL REFERENCES processed_resumes(id) ON DELETE CASCADE,
    
    -- Experience information
    company_name VARCHAR(255),
    job_title VARCHAR(255),
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    duration_months INTEGER,
    
    -- Location information
    location VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_duration_positive CHECK (duration_months >= 0),
    CONSTRAINT chk_date_validity CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Table for storing extracted education entries
CREATE TABLE IF NOT EXISTS resume_education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processed_resume_id UUID NOT NULL REFERENCES processed_resumes(id) ON DELETE CASCADE,
    
    -- Education information
    institution_name VARCHAR(255),
    degree VARCHAR(255),
    field_of_study VARCHAR(255),
    start_date DATE,
    end_date DATE,
    gpa DECIMAL(3,2),
    
    -- Additional details
    description TEXT,
    is_current BOOLEAN DEFAULT FALSE,
    
    -- Location information
    location VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_gpa_range CHECK (gpa IS NULL OR (gpa >= 0.0 AND gpa <= 4.0)),
    CONSTRAINT chk_education_date_validity CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Table for storing processing analytics and metrics
CREATE TABLE IF NOT EXISTS resume_processing_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processed_resume_id UUID NOT NULL REFERENCES processed_resumes(id) ON DELETE CASCADE,
    
    -- Performance metrics
    processing_time_ms INTEGER,
    file_size_bytes INTEGER,
    text_extraction_time_ms INTEGER,
    information_extraction_time_ms INTEGER,
    
    -- Quality metrics
    extraction_confidence DECIMAL(3,2), -- Overall confidence in extraction quality
    missing_fields TEXT[], -- Array of fields that couldn't be extracted
    ambiguous_sections TEXT[], -- Sections that were unclear during parsing
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_processing_time_positive CHECK (processing_time_ms >= 0),
    CONSTRAINT chk_extraction_confidence_range CHECK (extraction_confidence IS NULL OR (extraction_confidence >= 0.0 AND extraction_confidence <= 1.0))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_processed_resumes_resume_id ON processed_resumes(resume_id);
CREATE INDEX IF NOT EXISTS idx_processed_resumes_processed_at ON processed_resumes(processed_at);
CREATE INDEX IF NOT EXISTS idx_processed_resumes_status ON processed_resumes(processing_status);
CREATE INDEX IF NOT EXISTS idx_resume_skills_processed_resume_id ON resume_skills(processed_resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_skills_name ON resume_skills(skill_name);
CREATE INDEX IF NOT EXISTS idx_resume_experience_processed_resume_id ON resume_experience(processed_resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_experience_company ON resume_experience(company_name);
CREATE INDEX IF NOT EXISTS idx_resume_education_processed_resume_id ON resume_education(processed_resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_education_institution ON resume_education(institution_name);
CREATE INDEX IF NOT EXISTS idx_resume_processing_analytics_processed_resume_id ON resume_processing_analytics(processed_resume_id);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_processed_resumes_updated_at
    BEFORE UPDATE ON processed_resumes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for comprehensive resume data
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

-- Create view for skills analysis
CREATE OR REPLACE VIEW skills_analysis AS
SELECT 
    rs.skill_name,
    rs.skill_category,
    COUNT(*) as frequency,
    AVG(rs.confidence_score) as avg_confidence,
    array_agg(DISTINCT ue.email) as users_with_skill,
    MAX(pr.processed_at) as last_seen
FROM resume_skills rs
JOIN processed_resumes pr ON rs.processed_resume_id = pr.id
JOIN resume_files_email rf ON pr.resume_id = rf.id
JOIN users_email ue ON rf.email = ue.email
GROUP BY rs.skill_name, rs.skill_category
ORDER BY frequency DESC, avg_confidence DESC;

-- Create view for experience analysis
CREATE OR REPLACE VIEW experience_analysis AS
SELECT 
    re.company_name,
    re.job_title,
    COUNT(*) as frequency,
    AVG(re.duration_months) as avg_duration_months,
    array_agg(DISTINCT ue.email) as employees,
    MAX(pr.processed_at) as last_seen
FROM resume_experience re
JOIN processed_resumes pr ON re.processed_resume_id = pr.id
JOIN resume_files_email rf ON pr.resume_id = rf.id
JOIN users_email ue ON rf.email = ue.email
GROUP BY re.company_name, re.job_title
ORDER BY frequency DESC, avg_duration_months DESC;

COMMENT ON TABLE processed_resumes IS 'Stores processed resume data including extracted text and basic information';
COMMENT ON TABLE resume_skills IS 'Stores individual skills extracted from resumes';
COMMENT ON TABLE resume_experience IS 'Stores work experience entries extracted from resumes';
COMMENT ON TABLE resume_education IS 'Stores education entries extracted from resumes';
COMMENT ON TABLE resume_processing_analytics IS 'Stores processing metrics and analytics for each resume';
COMMENT ON VIEW resume_processing_summary IS 'Comprehensive summary of all processed resume data';
COMMENT ON VIEW skills_analysis IS 'Analysis of skills across all resumes';
COMMENT ON VIEW experience_analysis IS 'Analysis of work experience across all resumes';
