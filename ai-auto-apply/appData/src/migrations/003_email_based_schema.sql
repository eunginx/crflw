-- Email-based User Schema Migration
-- This migration creates a new schema that treats email as the primary identifier

-- Drop existing foreign key constraints (will be recreated)
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;
ALTER TABLE onboarding_progress DROP CONSTRAINT IF EXISTS onboarding_progress_user_id_fkey;
ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_user_id_fkey;
ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;
ALTER TABLE resume_files DROP CONSTRAINT IF EXISTS resume_files_user_id_fkey;
ALTER TABLE job_search_history DROP CONSTRAINT IF EXISTS job_search_history_user_id_fkey;

-- Create new email-based users table
CREATE TABLE users_email (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    firebase_uid VARCHAR(255) UNIQUE, -- Keep for Firebase compatibility
    password_hash VARCHAR(255), -- For direct email authentication
    email_verified BOOLEAN DEFAULT FALSE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on email
CREATE UNIQUE INDEX idx_users_email_email ON users_email(email);
CREATE UNIQUE INDEX idx_users_email_firebase_uid ON users_email(firebase_uid) WHERE firebase_uid IS NOT NULL;

-- Create email-based profiles table
CREATE TABLE user_profiles_email (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    headline TEXT,
    summary TEXT,
    location VARCHAR(255),
    resume_uploaded BOOLEAN DEFAULT FALSE,
    resume_filename VARCHAR(255),
    resume_path TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    skills JSONB DEFAULT '[]',
    experience_years INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (email) REFERENCES users_email(email) ON DELETE CASCADE
);

-- Create email-based settings table
CREATE TABLE user_settings_email (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    keywords TEXT,
    locations TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    enable_auto_apply BOOLEAN DEFAULT TRUE,
    generate_cover_letters BOOLEAN DEFAULT TRUE,
    apply_remote_only BOOLEAN DEFAULT FALSE,
    max_applications_per_day INTEGER DEFAULT 50,
    job_types JSONB DEFAULT '["full-time", "contract"]',
    industries JSONB DEFAULT '[]',
    company_sizes JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (email) REFERENCES users_email(email) ON DELETE CASCADE
);

-- Create email-based onboarding table
CREATE TABLE onboarding_progress_email (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    resume_uploaded BOOLEAN DEFAULT FALSE,
    profile_complete BOOLEAN DEFAULT FALSE,
    settings_complete BOOLEAN DEFAULT FALSE,
    current_step INTEGER DEFAULT 1,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (email) REFERENCES users_email(email) ON DELETE CASCADE
);

-- Create email-based job applications table
CREATE TABLE job_applications_email (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'interview', 'offer', 'rejected')),
    applied_date TIMESTAMP WITH TIME ZONE,
    job_url TEXT,
    description TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    location VARCHAR(255),
    notes TEXT,
    source VARCHAR(100), -- LinkedIn, Indeed, etc.
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (email) REFERENCES users_email(email) ON DELETE CASCADE
);

-- Create email-based preferences table
CREATE TABLE user_preferences_email (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT FALSE,
    weekly_summary BOOLEAN DEFAULT TRUE,
    ui_preferences JSONB DEFAULT '{}',
    notification_frequency VARCHAR(20) DEFAULT 'daily' CHECK (notification_frequency IN ('real-time', 'daily', 'weekly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (email) REFERENCES users_email(email) ON DELETE CASCADE
);

-- Create email-based resume files table
CREATE TABLE resume_files_email (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP WITH TIME ZONE,
    parsed_content JSONB, -- Parsed resume data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (email) REFERENCES users_email(email) ON DELETE CASCADE
);

-- Create email-based job search history table
CREATE TABLE job_search_history_email (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    search_query TEXT NOT NULL,
    search_location VARCHAR(255),
    filters JSONB DEFAULT '{}',
    results_count INTEGER DEFAULT 0,
    search_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (email) REFERENCES users_email(email) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_job_applications_email_status ON job_applications_email(email, status);
CREATE INDEX idx_job_applications_email_date ON job_applications_email(email, applied_date DESC);
CREATE INDEX idx_job_applications_email_company ON job_applications_email(email, company);
CREATE INDEX idx_resume_files_email_active ON resume_files_email(email, is_active);
CREATE INDEX idx_job_search_history_email_date ON job_search_history_email(email, search_date DESC);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all email-based tables
CREATE TRIGGER update_users_email_updated_at BEFORE UPDATE ON users_email FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_email_updated_at BEFORE UPDATE ON user_profiles_email FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_email_updated_at BEFORE UPDATE ON user_settings_email FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_progress_email_updated_at BEFORE UPDATE ON onboarding_progress_email FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_applications_email_updated_at BEFORE UPDATE ON job_applications_email FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_email_updated_at BEFORE UPDATE ON user_preferences_email FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resume_files_email_updated_at BEFORE UPDATE ON resume_files_email FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for user summary (email-based)
CREATE VIEW user_summary_email AS
SELECT 
    u.email,
    u.first_name,
    u.last_name,
    u.email_verified,
    u.created_at as user_created_at,
    p.headline,
    p.location,
    p.resume_uploaded,
    s.keywords,
    s.locations,
    s.salary_min,
    s.salary_max,
    o.current_step,
    o.completed_at as onboarding_completed_at,
    COUNT(ja.id) as total_applications,
    COUNT(CASE WHEN ja.status = 'applied' THEN 1 END) as applied_applications,
    COUNT(CASE WHEN ja.status = 'interview' THEN 1 END) as interview_applications,
    COUNT(CASE WHEN ja.status = 'offer' THEN 1 END) as offer_applications
FROM users_email u
LEFT JOIN user_profiles_email p ON u.email = p.email
LEFT JOIN user_settings_email s ON u.email = s.email
LEFT JOIN onboarding_progress_email o ON u.email = o.email
LEFT JOIN job_applications_email ja ON u.email = ja.email
GROUP BY u.email, u.first_name, u.last_name, u.email_verified, u.created_at, 
         p.headline, p.location, p.resume_uploaded, s.keywords, s.locations, 
         s.salary_min, s.salary_max, o.current_step, o.completed_at;

-- Migration data from old schema to new email-based schema
INSERT INTO users_email (email, firebase_uid, email_verified, first_name, last_name, created_at, updated_at)
SELECT 
    email,
    firebase_uid,
    email_verified,
    'First',
    'Last',
    created_at,
    updated_at
FROM users;

INSERT INTO user_profiles_email (email, headline, summary, location, resume_uploaded, created_at, updated_at)
SELECT 
    u.email,
    p.headline,
    p.summary,
    p.location,
    p.resume_uploaded,
    p.created_at,
    p.updated_at
FROM users u
JOIN user_profiles p ON u.id = p.user_id;

INSERT INTO user_settings_email (email, keywords, locations, salary_min, salary_max, enable_auto_apply, generate_cover_letters, apply_remote_only, max_applications_per_day, created_at, updated_at)
SELECT 
    u.email,
    s.keywords,
    s.locations,
    s.salary_min,
    s.salary_max,
    s.enable_auto_apply,
    s.generate_cover_letters,
    s.apply_remote_only,
    s.max_applications_per_day,
    s.created_at,
    s.updated_at
FROM users u
JOIN user_settings s ON u.id = s.user_id;

INSERT INTO onboarding_progress_email (email, email_verified, resume_uploaded, profile_complete, settings_complete, current_step, completed_at, created_at, updated_at)
SELECT 
    u.email,
    o.email_verified,
    o.resume_uploaded,
    o.profile_complete,
    o.settings_complete,
    o.current_step,
    o.completed_at,
    o.created_at,
    o.updated_at
FROM users u
JOIN onboarding_progress o ON u.id = o.user_id;

INSERT INTO job_applications_email (email, title, company, status, applied_date, job_url, description, salary_min, salary_max, location, notes, created_at, updated_at)
SELECT 
    u.email,
    ja.title,
    ja.company,
    ja.status,
    ja.applied_date,
    ja.job_url,
    ja.description,
    ja.salary_min,
    ja.salary_max,
    ja.location,
    ja.notes,
    ja.created_at,
    ja.updated_at
FROM users u
JOIN job_applications ja ON u.id = ja.user_id;

INSERT INTO user_preferences_email (email, theme, language, timezone, email_notifications, push_notifications, ui_preferences, created_at, updated_at)
SELECT 
    u.email,
    p.theme,
    p.language,
    p.timezone,
    p.email_notifications,
    p.push_notifications,
    p.ui_preferences,
    p.created_at,
    p.updated_at
FROM users u
JOIN user_preferences p ON u.id = p.user_id;

INSERT INTO resume_files_email (email, filename, original_filename, file_path, file_size, file_type, is_active, upload_date, last_used, created_at, updated_at)
SELECT 
    u.email,
    r.filename,
    r.original_filename,
    r.file_path,
    r.file_size,
    r.file_type,
    r.is_active,
    r.upload_date,
    r.last_used,
    r.created_at,
    r.updated_at
FROM users u
JOIN resume_files r ON u.id = r.user_id;

COMMIT;
