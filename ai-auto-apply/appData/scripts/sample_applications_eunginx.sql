-- Sample Job Applications Data for eunginx@key2vibe.com
-- This script inserts sample job application data for the specific user

INSERT INTO job_applications_email (email, title, company, status, applied_date, job_url, description, salary_min, salary_max, location, notes, source, created_at, updated_at)
VALUES 
    ('eunginx@key2vibe.com', 'Senior Software Engineer', 'Google', 'applied', CURRENT_TIMESTAMP - INTERVAL '3 days', 'https://careers.google.com/jobs/senior-swe', 
     'Join Google''s world-class engineering team to build products that billions of people use. We are looking for passionate engineers who want to solve complex problems at scale.', 
     180000, 250000, 'Mountain View, CA (Hybrid)', 'Applied through internal referral. Technical interview scheduled next week. Great benefits and work-life balance.', 
     'Referral', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),
     
    ('eunginx@key2vibe.com', 'Staff Frontend Developer', 'Meta', 'interview', CURRENT_TIMESTAMP - INTERVAL '7 days', 'https://metacareers.com/jobs/staff-frontend', 
     'We are seeking a Staff Frontend Developer to lead our web platform initiatives. You will work on React-based applications that serve billions of users across our family of apps.', 
     200000, 280000, 'Menlo Park, CA (Hybrid)', 'Completed phone screen, now preparing for system design interview. Team seems very collaborative and technically strong.', 
     'LinkedIn', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
     
    ('eunginx@key2vibe.com', 'Principal Software Engineer', 'Amazon', 'saved', NULL, 'https://amazon.jobs/en/jobs/principal-swe', 
     'Amazon Web Services is looking for a Principal Software Engineer to architect and build scalable cloud solutions. Experience with distributed systems required.', 
     220000, 320000, 'Seattle, WA (Remote)', 'Senior leadership position with significant impact. AWS team is expanding rapidly in the cloud computing space.', 
     'Company Website', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days'),
     
    ('eunginx@key2vibe.com', 'Senior Full Stack Developer', 'Stripe', 'applied', CURRENT_TIMESTAMP - INTERVAL '5 days', 'https://stripe.com/jobs/senior-fullstack', 
     'Stripe is looking for experienced full stack developers to help build the economic infrastructure for the internet. You will work on payment processing APIs and developer tools.', 
     170000, 230000, 'San Francisco, CA (Remote)', 'Great company culture with strong engineering focus. Applied through their careers portal. Waiting for recruiter response.', 
     'AngelList', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),
     
    ('eunginx@key2vibe.com', 'Lead Software Engineer', 'Netflix', 'interview', CURRENT_TIMESTAMP - INTERVAL '12 days', 'https://jobs.netflix.com/jobs/lead-swe', 
     'Netflix is seeking a Lead Software Engineer to work on our streaming platform and content delivery systems. Experience with high-traffic applications is essential.', 
     190000, 270000, 'Los Gatos, CA (Hybrid)', 'First technical round completed, moving to final interview with engineering leadership. Interesting challenges in media streaming.', 
     'Referral', CURRENT_TIMESTAMP - INTERVAL '12 days', CURRENT_TIMESTAMP - INTERVAL '4 days'),
     
    ('eunginx@key2vibe.com', 'Senior Backend Engineer', 'Airbnb', 'rejected', CURRENT_TIMESTAMP - INTERVAL '15 days', 'https://careers.airbnb.com/jobs/senior-backend', 
     'Join Airbnb''s backend team to build systems that power our global marketplace. Experience with microservices and distributed systems required.', 
     160000, 220000, 'San Francisco, CA (Hybrid)', 'Strong technical team but position was filled internally. They were very impressed with the technical skills.', 
     'LinkedIn', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '14 days'),
     
    ('eunginx@key2vibe.com', 'Staff DevOps Engineer', 'Microsoft', 'offer', CURRENT_TIMESTAMP - INTERVAL '20 days', 'https://careers.microsoft.com/jobs/staff-devops', 
     'Microsoft Azure is looking for a Staff DevOps Engineer to help build and maintain our cloud infrastructure. Experience with Kubernetes and cloud platforms required.', 
     185000, 260000, 'Redmond, WA (Remote)', 'Excellent offer with comprehensive benefits package. Team is working on cutting-edge cloud technologies. Offer accepted!', 
     'Company Website', CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '18 days'),
     
    ('eunginx@key2vibe.com', 'Senior Mobile Developer', 'Uber', 'saved', NULL, 'https://www.uber.com/jobs/senior-mobile-dev', 
     'Uber is seeking experienced mobile developers to work on our rider and driver applications. Experience with React Native or native iOS/Android development required.', 
     150000, 210000, 'San Francisco, CA (Hybrid)', 'Interesting opportunity to work on transportation technology at scale. Mobile-first company with global impact.', 
     'Indeed', CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '8 days'),
     
    ('eunginx@key2vibe.com', 'Principal Data Engineer', 'Twitter/X', 'applied', CURRENT_TIMESTAMP - INTERVAL '2 days', 'https://careers.x.com/jobs/principal-data-engineer', 
     'Twitter/X is looking for a Principal Data Engineer to build data pipelines and infrastructure for our real-time social platform. Experience with big data technologies required.', 
     210000, 300000, 'San Francisco, CA (Remote)', 'Applied yesterday, already heard back from recruiter. Technical interview scheduled for next week. Exciting real-time data challenges.', 
     'Company Website', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
     
    ('eunginx@key2vibe.com', 'Senior Security Engineer', 'Cloudflare', 'interview', CURRENT_TIMESTAMP - INTERVAL '9 days', 'https://www.cloudflare.com/careers/jobs/senior-security', 
     'Cloudflare is seeking Senior Security Engineers to help protect and secure our global network. Experience with web security, DDoS protection, and network security required.', 
     165000, 235000, 'San Francisco, CA (Remote)', 'Phone screen completed, technical interview with security team next week. Company has strong security culture and interesting challenges.', 
     'Referral', CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),
     
    ('eunginx@key2vibe.com', 'Staff Platform Engineer', 'Spotify', 'saved', NULL, 'https://www.spotifyjobs.com/jobs/staff-platform', 
     'Spotify is looking for Staff Platform Engineers to build and maintain the infrastructure that powers our music streaming service. Experience with microservices and cloud platforms required.', 
     175000, 245000, 'Stockholm, Sweden (Remote)', 'Great opportunity to work on music technology at global scale. Company has excellent engineering culture and remote work options.', 
     'LinkedIn', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '6 days'),
     
    ('eunginx@key2vibe.com', 'Senior ML Engineer', 'OpenAI', 'applied', CURRENT_TIMESTAMP - INTERVAL '1 day', 'https://openai.com/jobs/senior-ml-engineer', 
     'OpenAI is seeking Senior ML Engineers to work on cutting-edge artificial intelligence research and deployment. Experience with deep learning frameworks required.', 
     200000, 350000, 'San Francisco, CA (Hybrid)', 'Applied yesterday for this dream opportunity. Working on AGI and advanced AI systems. Very excited about this possibility!', 
     'Company Website', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day');

COMMIT;

-- Summary of inserted data
-- This script creates 12 job applications for user eunginx@key2vibe.com:
-- Various statuses: saved, applied, interview, offer, rejected
-- Top-tier companies: Google, Meta, Amazon, Stripe, Netflix, etc.
-- Realistic salary ranges: $150,000 - $350,000
-- Different locations: Remote, Hybrid across major tech hubs
-- Detailed job descriptions and notes
-- Various application sources
