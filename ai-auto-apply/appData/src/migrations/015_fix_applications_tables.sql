-- Create missing email-based tables for applications page

-- Create email-based users table
CREATE TABLE IF NOT EXISTS users_email (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    firebase_uid VARCHAR(255) UNIQUE,
    email_verified BOOLEAN DEFAULT FALSE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create email-based profiles table
CREATE TABLE IF NOT EXISTS user_profiles_email (
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create email-based settings table
CREATE TABLE IF NOT EXISTS user_settings_email (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    keywords TEXT,
    locations TEXT,
    salary_min INTEGER DEFAULT 0,
    salary_max INTEGER DEFAULT 0,
    enable_auto_apply BOOLEAN DEFAULT TRUE,
    generate_cover_letters BOOLEAN DEFAULT TRUE,
    apply_remote_only BOOLEAN DEFAULT FALSE,
    max_applications_per_day INTEGER DEFAULT 50,
    job_types JSONB DEFAULT '["full-time"]',
    industries JSONB DEFAULT '["Technology"]',
    company_sizes JSONB DEFAULT '["Medium"]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create email-based onboarding table
CREATE TABLE IF NOT EXISTS onboarding_progress_email (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    profile_complete BOOLEAN DEFAULT FALSE,
    settings_complete BOOLEAN DEFAULT FALSE,
    resume_uploaded BOOLEAN DEFAULT FALSE,
    onboarding_complete BOOLEAN DEFAULT FALSE,
    current_step INTEGER DEFAULT 1,
    completed_steps JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create email-based job applications table (CRITICAL FOR APPLICATIONS PAGE)
CREATE TABLE IF NOT EXISTS job_applications_email (
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
    source VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email_email ON users_email(email);
CREATE INDEX IF NOT EXISTS idx_users_email_firebase_uid ON users_email(firebase_uid) WHERE firebase_uid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_email ON user_profiles_email(email);
CREATE INDEX IF NOT EXISTS idx_user_settings_email_email ON user_settings_email(email);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_email_email ON onboarding_progress_email(email);
CREATE INDEX IF NOT EXISTS idx_job_applications_email_status ON job_applications_email(email, status);
CREATE INDEX IF NOT EXISTS idx_job_applications_email_date ON job_applications_email(email, applied_date DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_email_company ON job_applications_email(email, company);

-- Insert sample data for testing
INSERT INTO users_email (email, firebase_uid, email_verified, first_name, last_name) 
VALUES ('test@example.com', 'test123', true, 'Test', 'User')
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_profiles_email (email, headline, location) 
VALUES ('test@example.com', 'Software Engineer', 'San Francisco, CA')
ON CONFLICT (email) DO NOTHING;

INSERT INTO job_applications_email (email, title, company, status, applied_date, location, salary_min, salary_max)
VALUES 
    ('test@example.com', 'Senior Frontend Developer', 'Tech Corp', 'applied', CURRENT_TIMESTAMP - INTERVAL '2 days', 'San Francisco, CA', 120000, 180000),
    ('test@example.com', 'Full Stack Engineer', 'StartupXYZ', 'interview', CURRENT_TIMESTAMP - INTERVAL '1 week', 'Remote', 100000, 150000),
    ('test@example.com', 'React Developer', 'AgencyCo', 'saved', NULL, 'New York, NY', 110000, 160000)
ON CONFLICT DO NOTHING;
