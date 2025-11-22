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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email_email ON users_email(email);
CREATE INDEX IF NOT EXISTS idx_users_email_firebase_uid ON users_email(firebase_uid) WHERE firebase_uid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_email ON user_profiles_email(email);
CREATE INDEX IF NOT EXISTS idx_user_settings_email_email ON user_settings_email(email);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_email_email ON onboarding_progress_email(email);
