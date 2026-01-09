-- Create user data for eunginx@key2vibe.com
INSERT INTO users_email (email, firebase_uid, email_verified, first_name, last_name) 
VALUES ('eunginx@key2vibe.com', 'eunginx123', true, 'Eunginx', 'User')
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_profiles_email (email, headline, location) 
VALUES ('eunginx@key2vibe.com', 'Senior Software Engineer', 'San Francisco, CA')
ON CONFLICT (email) DO NOTHING;

INSERT INTO job_applications_email (email, title, company, status, applied_date, location, salary_min, salary_max) 
VALUES ('eunginx@key2vibe.com', 'Senior React Developer', 'TechCorp', 'applied', NOW() - INTERVAL '3 days', 'San Francisco, CA', 140000, 200000);

INSERT INTO job_applications_email (email, title, company, status, applied_date, location, salary_min, salary_max) 
VALUES ('eunginx@key2vibe.com', 'Full Stack Engineer', 'StartupXYZ', 'interview', NOW() - INTERVAL '1 week', 'Remote', 130000, 180000);

INSERT INTO job_applications_email (email, title, company, status, location, salary_min, salary_max) 
VALUES ('eunginx@key2vibe.com', 'Frontend Developer', 'AgencyCo', 'saved', 'New York, NY', 120000, 170000);
