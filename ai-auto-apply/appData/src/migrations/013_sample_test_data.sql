-- Add sample data for testing user eunginx@key2vibe.com
-- This migration adds dynamic values and sample data

-- Insert sample user
INSERT INTO users_email (
    email, 
    firebase_uid, 
    email_verified, 
    first_name, 
    last_name, 
    phone,
    created_at, 
    updated_at
) VALUES (
    'eunginx@key2vibe.com',
    'test-user-' || EXTRACT(EPOCH FROM NOW())::text,
    TRUE,
    'Test',
    'User',
    '+1-555-0123',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Insert sample profile
INSERT INTO user_profiles_email (
    email,
    headline,
    summary,
    location,
    resume_uploaded,
    linkedin_url,
    github_url,
    portfolio_url,
    skills,
    experience_years,
    created_at,
    updated_at
) VALUES (
    'eunginx@key2vibe.com',
    'Senior Software Engineer | Full Stack Developer | AI Enthusiast',
    'Experienced software engineer with a passion for building scalable applications and exploring AI technologies. Strong background in full-stack development, cloud architecture, and team leadership.',
    'San Francisco, CA',
    TRUE,
    'https://linkedin.com/in/eunginx',
    'https://github.com/eunginx',
    'https://eunginx.dev',
    '["JavaScript", "TypeScript", "React", "Node.js", "Python", "PostgreSQL", "AWS", "Docker", "Kubernetes"]',
    8,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Insert sample settings with dynamic values
INSERT INTO user_settings_email (
    email,
    keywords,
    locations,
    salary_min,
    salary_max,
    enable_auto_apply,
    generate_cover_letters,
    apply_remote_only,
    max_applications_per_day,
    job_types,
    industries,
    company_sizes,
    created_at,
    updated_at
) VALUES (
    'eunginx@key2vibe.com',
    'Software Engineer, Full Stack, Senior Developer, React, Node.js, Python, AI, Machine Learning',
    'San Francisco, CA; New York, NY; Remote; Austin, TX; Seattle, WA',
    120000,
    250000,
    TRUE,
    TRUE,
    FALSE,
    25,
    '["full-time", "contract", "remote"]',
    '["Technology", "Software", "Finance", "Healthcare", "E-commerce"]',
    '["Medium", "Large", "Startup"]',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Insert sample onboarding progress
INSERT INTO onboarding_progress_email (
    email,
    email_verified,
    resume_uploaded,
    profile_complete,
    settings_complete,
    current_step,
    completed_at,
    created_at,
    updated_at
) VALUES (
    'eunginx@key2vibe.com',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    5,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Insert sample job applications
INSERT INTO job_applications_email (
    email,
    title,
    company,
    status,
    applied_date,
    job_url,
    description,
    salary_min,
    salary_max,
    location,
    notes,
    source,
    created_at,
    updated_at
) VALUES 
(
    'eunginx@key2vibe.com',
    'Senior Software Engineer',
    'TechCorp Inc.',
    'applied',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    'https://techcorp.com/jobs/senior-software-engineer',
    'Looking for a senior software engineer to join our growing team. Experience with React, Node.js, and cloud technologies required.',
    130000,
    180000,
    'San Francisco, CA',
    'Great company culture and benefits package',
    'LinkedIn',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    'eunginx@key2vibe.com',
    'Full Stack Developer',
    'StartupXYZ',
    'interview',
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    'https://startupxyz.com/jobs/full-stack-developer',
    'Fast-growing startup looking for talented full stack developers. Modern tech stack with React, TypeScript, and GraphQL.',
    120000,
    160000,
    'Remote',
    'First round completed, technical interview scheduled',
    'AngelList',
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP - INTERVAL '4 days'
),
(
    'eunginx@key2vibe.com',
    'Software Engineer - AI/ML',
    'AI Innovations Lab',
    'saved',
    NULL,
    'https://aiinnovations.com/jobs/ai-ml-engineer',
    'Join our AI research team working on cutting-edge machine learning applications. Python, TensorFlow, and PyTorch experience required.',
    150000,
    220000,
    'New York, NY',
    'Interesting AI/ML position, need to tailor resume',
    'Indeed',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
);

COMMIT;
