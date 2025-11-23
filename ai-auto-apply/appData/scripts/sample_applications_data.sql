-- Sample Job Applications Data
-- This script inserts sample job application data for testing the applications page

-- First, let's make sure we have a sample user to associate with applications
-- Insert sample user (if not exists)
INSERT INTO users_email (email, firebase_uid, email_verified, first_name, last_name, created_at, updated_at)
VALUES ('john.doe@example.com', 'sample_firebase_uid_123', TRUE, 'John', 'Doe', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Insert sample data for email-based schema
INSERT INTO job_applications_email (email, title, company, status, applied_date, job_url, description, salary_min, salary_max, location, notes, source, created_at, updated_at)
VALUES 
    ('john.doe@example.com', 'Senior Frontend Developer', 'TechCorp Inc.', 'applied', CURRENT_TIMESTAMP - INTERVAL '5 days', 'https://techcorp.com/jobs/frontend-senior', 
     'We are looking for an experienced frontend developer to join our growing team. You will work on cutting-edge web applications using React, TypeScript, and modern CSS frameworks.', 
     120000, 160000, 'San Francisco, CA (Remote)', 'Great company culture, excellent benefits package. Applied through LinkedIn.', 
     'LinkedIn', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),
     
    ('john.doe@example.com', 'Full Stack Engineer', 'StartupXYZ', 'interview', CURRENT_TIMESTAMP - INTERVAL '10 days', 'https://startupxyz.io/careers/fullstack', 
     'Join our fast-growing startup as a full stack engineer. You will work on both frontend and backend systems, helping us scale our platform to millions of users.', 
     100000, 140000, 'New York, NY (Hybrid)', 'First round completed, technical interview scheduled. Founders seem very passionate about the product.', 
     'Indeed', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
     
    ('john.doe@example.com', 'React Developer', 'Digital Agency Pro', 'saved', NULL, 'https://digitalagency.com/jobs/react-dev', 
     'Looking for a skilled React developer to join our creative team. You will work on various client projects ranging from e-commerce to SaaS applications.', 
     90000, 120000, 'Austin, TX (Remote)', 'Interesting portfolio of projects. Company has good work-life balance reputation.', 
     'Company Website', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '15 days'),
     
    ('john.doe@example.com', 'JavaScript Engineer', 'FinTech Solutions', 'rejected', CURRENT_TIMESTAMP - INTERVAL '20 days', 'https://fintechsolutions.com/careers/js-engineer', 
     'We are seeking a talented JavaScript engineer to help build our next-generation financial platform. Experience with Node.js and React is required.', 
     110000, 150000, 'Boston, MA (On-site)', 'Strong technical team but rejected after 3 rounds. They were looking for more financial domain experience.', 
     'Referral', CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '18 days'),
     
    ('john.doe@example.com', 'UI/UX Frontend Developer', 'Design Studio', 'offer', CURRENT_TIMESTAMP - INTERVAL '25 days', 'https://designstudio.io/jobs/ui-frontend', 
     'Creative frontend developer with strong design sense needed for our design-focused agency. You will work closely with our design team to bring beautiful designs to life.', 
     95000, 125000, 'Los Angeles, CA (Remote)', 'Great offer! Team is design-focused and values work-life balance. Offer accepted, starting next month.', 
     'Dribbble', CURRENT_TIMESTAMP - INTERVAL '25 days', CURRENT_TIMESTAMP - INTERVAL '22 days'),
     
    ('john.doe@example.com', 'Senior Software Engineer - Frontend', 'Enterprise Corp', 'applied', CURRENT_TIMESTAMP - INTERVAL '3 days', 'https://enterprise.com/careers/sr-frontend', 
     'Large enterprise company looking for senior frontend engineer to lead modernization efforts. Experience with large-scale applications and enterprise systems preferred.', 
     130000, 180000, 'Seattle, WA (Hybrid)', 'Stable company with excellent benefits. Applied through company website. Waiting for response.', 
     'Company Website', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),
     
    ('john.doe@example.com', 'Frontend Architect', 'Cloud Platform Inc', 'saved', NULL, 'https://cloudplatform.com/jobs/frontend-architect', 
     'Seeking a frontend architect to design and implement scalable frontend systems. Experience with micro-frontends and modern architecture patterns required.', 
     140000, 190000, 'Denver, CO (Remote)', 'Senior position with leadership opportunities. Company is growing rapidly in the cloud space.', 
     'AngelList', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days'),
     
    ('john.doe@example.com', 'React Native Developer', 'Mobile First Co', 'interview', CURRENT_TIMESTAMP - INTERVAL '12 days', 'https://mobilefirst.io/jobs/react-native', 
     'Mobile-first company looking for React Native developer to work on cross-platform mobile applications. Experience with mobile app development required.', 
     105000, 145000, 'Portland, OR (Remote)', 'Phone screen completed, technical interview next week. Interesting product in the mobile space.', 
     'GitHub Jobs', CURRENT_TIMESTAMP - INTERVAL '12 days', CURRENT_TIMESTAMP - INTERVAL '5 days');

-- Add some variety with different statuses and dates
INSERT INTO job_applications_email (email, title, company, status, applied_date, job_url, description, salary_min, salary_max, location, notes, source, created_at, updated_at)
VALUES 
    ('john.doe@example.com', 'Vue.js Developer', 'Modern Web Co', 'applied', CURRENT_TIMESTAMP - INTERVAL '1 day', 'https://modernweb.com/jobs/vuejs', 
     'Looking for Vue.js specialist to join our modern web development team. Experience with Vue 3 and Composition API required.', 
     85000, 115000, 'Miami, FL (Remote)', 'Applied yesterday, quick response from recruiter. Technical skills assessment scheduled.', 
     'Stack Overflow Jobs', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'),
     
    ('john.doe@example.com', 'Angular Developer', 'Enterprise Systems', 'saved', NULL, 'https://enterprisesys.com/jobs/angular', 
     'Large enterprise seeking Angular developer for maintenance and enhancement of existing systems. Experience with Angular 2+ required.', 
     95000, 130000, 'Chicago, IL (Hybrid)', 'Stable position with established company. Good for work-life balance.', 
     'LinkedIn', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '4 days');

COMMIT;

-- Summary of inserted data
-- This script creates:
-- 1 sample user (john.doe@example.com)
-- 10 job applications in the email-based schema
-- Applications with various statuses: saved, applied, interview, offer, rejected
-- Various sources: LinkedIn, Indeed, Company Website, Referral, etc.
-- Realistic job descriptions and salary ranges
-- Different locations (Remote, Hybrid, On-site)
-- Notes and timestamps for each application
