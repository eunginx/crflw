-- AI Apply Pipeline Tables

-- Job Matches Table
CREATE TABLE IF NOT EXISTS ai_apply_job_matches (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    job_data JSONB NOT NULL,
    match_scores JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cover Letters Table
CREATE TABLE IF NOT EXISTS ai_apply_cover_letters (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications Table
CREATE TABLE IF NOT EXISTS ai_apply_applications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL,
    cover_letter_id INTEGER REFERENCES ai_apply_cover_letters(id) ON DELETE SET NULL,
    application_data JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'under_review', 'interview_scheduled', 'rejected', 'accepted')),
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Statistics Table
CREATE TABLE IF NOT EXISTS ai_apply_statistics (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
    total_applications INTEGER DEFAULT 0,
    successful_submissions INTEGER DEFAULT 0,
    interviews_scheduled INTEGER DEFAULT 0,
    offers_received INTEGER DEFAULT 0,
    last_activity TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_apply_job_matches_user_id ON ai_apply_job_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_apply_job_matches_resume_id ON ai_apply_job_matches(resume_id);
CREATE INDEX IF NOT EXISTS idx_ai_apply_cover_letters_user_id ON ai_apply_cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_apply_cover_letters_resume_id ON ai_apply_cover_letters(resume_id);
CREATE INDEX IF NOT EXISTS idx_ai_apply_applications_user_id ON ai_apply_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_apply_applications_resume_id ON ai_apply_applications(resume_id);
CREATE INDEX IF NOT EXISTS idx_ai_apply_applications_status ON ai_apply_applications(status);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_ai_apply_job_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_ai_apply_cover_letters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_ai_apply_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_ai_apply_statistics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DROP TRIGGER IF EXISTS update_ai_apply_job_matches_updated_at ON ai_apply_job_matches;
CREATE TRIGGER update_ai_apply_job_matches_updated_at
    BEFORE UPDATE ON ai_apply_job_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_apply_job_matches_updated_at();

DROP TRIGGER IF EXISTS update_ai_apply_cover_letters_updated_at ON ai_apply_cover_letters;
CREATE TRIGGER update_ai_apply_cover_letters_updated_at
    BEFORE UPDATE ON ai_apply_cover_letters
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_apply_cover_letters_updated_at();

DROP TRIGGER IF EXISTS update_ai_apply_applications_updated_at ON ai_apply_applications;
CREATE TRIGGER update_ai_apply_applications_updated_at
    BEFORE UPDATE ON ai_apply_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_apply_applications_updated_at();

DROP TRIGGER IF EXISTS update_ai_apply_statistics_updated_at ON ai_apply_statistics;
CREATE TRIGGER update_ai_apply_statistics_updated_at
    BEFORE UPDATE ON ai_apply_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_apply_statistics_updated_at();
