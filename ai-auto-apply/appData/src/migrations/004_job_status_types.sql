-- Enhanced Job Status System Migration
-- Creates a comprehensive, database-driven job status system

-- Drop existing check constraint on job_applications.status
ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_status_check;

-- Create job_status_types table
CREATE TABLE IF NOT EXISTS job_status_types (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    -- UI and theming
    ui_classes JSONB DEFAULT '{}',
    
    -- Analytics and categorization
    category TEXT CHECK (category IN ('positive', 'negative', 'neutral', 'system')),
    counts_towards TEXT[] DEFAULT '{}',
    
    -- AI insights and automation
    ai_advice TEXT,
    ai_next_step_action TEXT,
    
    -- Timeline and activity
    timeline_icon TEXT,
    
    -- Animation and visual effects
    animation TEXT CHECK (animation IN ('pulse', 'bounce', 'none')) DEFAULT 'none',
    
    -- Feature flags
    hidden BOOLEAN DEFAULT FALSE,
    experimental BOOLEAN DEFAULT FALSE,
    
    -- Multi-level grouping
    group_label TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert comprehensive job status data
INSERT INTO job_status_types (key, label, icon, color, description, sort_order, ui_classes, category, counts_towards, ai_advice, ai_next_step_action, timeline_icon, animation, hidden, experimental, group_label) VALUES
-- Core statuses
('all', 'All', '📄', 'gray', 'View all job applications', 0, '{"chip": "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2", "bg": "bg-gray-100", "text": "text-gray-800"}', 'neutral', ARRAY[]::text[], null, null, '📄', 'none', false, false, 'System'),
('saved', 'Saved', '📌', 'yellow', 'Job saved for later consideration', 1, '{"chip": "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2", "bg": "bg-yellow-100", "text": "text-yellow-800"}', 'neutral', ARRAY['saved'], 'Review this job application and decide whether to apply', 'Check application requirements', '📌', 'none', false, false, 'Neutral'),
('applied', 'Applied', '📤', 'green', 'Application submitted, waiting for response', 2, '{"chip": "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2", "bg": "bg-green-100", "text": "text-green-800"}', 'positive', ARRAY['applications', 'active'], 'It''s been 10 days since you applied. Follow-up recommended if no response', 'Send follow-up email', '📤', 'none', false, false, 'Positive'),
('interview', 'Interview', '🗓️', 'blue', 'Interview scheduled or in progress', 3, '{"chip": "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2", "bg": "bg-blue-100", "text": "text-blue-800"}', 'positive', ARRAY['applications', 'active', 'interviews'], 'Prepare for the interview by researching the company and practicing common questions', 'Research company and prepare questions', '🗓️', 'pulse', false, false, 'Positive'),
('offer', 'Offer', '💼', 'purple', 'Job offer received', 4, '{"chip": "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2", "bg": "bg-purple-100", "text": "text-purple-800"}', 'positive', ARRAY['applications', 'offers'], 'Congratulations! Review the offer details carefully before deciding', 'Review offer terms and negotiate if needed', '💼', 'bounce', false, false, 'Positive'),
('rejected', 'Rejected', '🚫', 'red', 'Application rejected by company', 5, '{"chip": "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2", "bg": "bg-red-100", "text": "text-red-800"}', 'negative', ARRAY['applications', 'rejected'], 'Don''t get discouraged. Learn from the experience and continue applying', 'Review feedback and improve next application', '🚫', 'none', false, false, 'Negative'),

-- Extended statuses for future-proofing
('upcoming', 'Upcoming', '🕒', 'sky', 'Application deadline approaching', 6, '{"chip": "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2", "bg": "bg-sky-100", "text": "text-sky-800"}', 'neutral', ARRAY['upcoming'], 'Complete and submit your application before the deadline', 'Finish application preparation', '🕒', 'pulse', false, true, 'Neutral'),
('in_review', 'In Review', '👀', 'indigo', 'Application under company review', 7, '{"chip": "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2", "bg": "bg-indigo-100", "text": "text-indigo-800"}', 'neutral', ARRAY['applications', 'active'], 'Your application is being reviewed. This typically takes 1-2 weeks', 'Wait for response or prepare follow-up', '👀', 'none', false, false, 'Neutral'),
('assessment', 'Assessment', '📝', 'amber', 'Technical assessment or test required', 8, '{"chip": "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2", "bg": "bg-amber-100", "text": "text-amber-800"}', 'neutral', ARRAY['applications', 'active'], 'Complete the assessment to the best of your ability', 'Complete assessment test', '📝', 'pulse', false, false, 'Neutral'),
('referral', 'Referral Sent', '📨', 'teal', 'Referral request sent to contact', 9, '{"chip": "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2", "bg": "bg-teal-100", "text": "text-teal-800"}', 'positive', ARRAY['applications', 'active'], 'Follow up with your contact if you don''t hear back within a week', 'Contact referral person', '📨', 'none', false, true, 'Positive'),
('autopilot', 'Auto-Applied', '🤖', 'emerald', 'Automatically applied via AI system', 10, '{"chip": "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2", "bg": "bg-emerald-100", "text": "text-emerald-800"}', 'system', ARRAY['applications', 'active'], 'Monitor the application status and prepare for potential interviews', 'Monitor application progress', '🤖', 'pulse', false, true, 'System'),
('withdrawn', 'Withdrawn', '↩️', 'zinc', 'Application withdrawn by candidate', 11, '{"chip": "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2", "bg": "bg-zinc-100", "text": "text-zinc-800"}', 'negative', ARRAY['applications', 'withdrawn'], 'Consider why you withdrew and use this insight for future applications', 'Reflect on withdrawal reasons', '↩️', 'none', false, false, 'Negative')
ON CONFLICT (key) DO NOTHING;

-- Add new check constraint with all valid statuses
ALTER TABLE job_applications 
ADD CONSTRAINT job_applications_status_check 
CHECK (status IN (
    'saved', 'applied', 'interview', 'offer', 'rejected',
    'upcoming', 'in_review', 'assessment', 'referral', 'autopilot', 'withdrawn'
));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_status_types_key ON job_status_types(key);
CREATE INDEX IF NOT EXISTS idx_job_status_types_sort_order ON job_status_types(sort_order);
CREATE INDEX IF NOT EXISTS idx_job_status_types_category ON job_status_types(category);
CREATE INDEX IF NOT EXISTS idx_job_status_types_group_label ON job_status_types(group_label);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_job_status_types_updated_at ON job_status_types;
CREATE TRIGGER update_job_status_types_updated_at BEFORE UPDATE ON job_status_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for easy status lookup with computed fields
CREATE OR REPLACE VIEW job_statuses_enhanced AS
SELECT 
    st.*,
    -- Computed UI class combinations
    (st.ui_classes::jsonb ->> 'chip') || ' ' || (st.ui_classes::jsonb ->> 'bg') || ' ' || (st.ui_classes::jsonb ->> 'text') as full_chip_class,
    
    -- Computed status for analytics
    CASE 
        WHEN st.category = 'positive' THEN 'progressing'
        WHEN st.category = 'negative' THEN 'closed'
        WHEN st.key IN ('saved', 'upcoming') THEN 'pre_application'
        ELSE 'active'
    END as lifecycle_stage,
    
    -- Computed priority for dashboards
    CASE 
        WHEN st.key = 'offer' THEN 1
        WHEN st.key = 'interview' THEN 2
        WHEN st.key IN ('applied', 'in_review', 'assessment') THEN 3
        WHEN st.key = 'saved' THEN 4
        ELSE 5
    END as dashboard_priority
FROM job_status_types st
WHERE NOT st.hidden
ORDER BY st.sort_order;

-- Grant permissions (adjust as needed for your user setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON job_status_types TO your_app_user;
-- GRANT SELECT ON job_statuses_enhanced TO your_app_user;

-- Add comment for documentation
COMMENT ON TABLE job_status_types IS 'Comprehensive job status configuration with icons, colors, AI insights, and UI metadata';
COMMENT ON VIEW job_statuses_enhanced IS 'Enhanced view of job statuses with computed fields for UI and analytics';
