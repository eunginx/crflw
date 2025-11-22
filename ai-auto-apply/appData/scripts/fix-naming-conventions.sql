-- PostgreSQL Naming Convention Fixes
-- This script provides examples of how to fix common naming convention violations

-- WARNING: These are examples. Review and modify according to your specific needs before running.

-- 1. Fix camelCase column names to snake_case
-- Example: Change 'firstName' to 'first_name'
DO $$
BEGIN
    -- Check if column exists and needs renaming
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'firstName'
    ) THEN
        -- Rename column
        ALTER TABLE users RENAME COLUMN "firstName" TO first_name;
        RAISE NOTICE 'Renamed users.firstName to first_name';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'lastName'
    ) THEN
        ALTER TABLE users RENAME COLUMN "lastName" TO last_name;
        RAISE NOTICE 'Renamed users.lastName to last_name';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'jobTitle'
    ) THEN
        ALTER TABLE job_applications RENAME COLUMN "jobTitle" TO job_title;
        RAISE NOTICE 'Renamed job_applications.jobTitle to job_title';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'companyName'
    ) THEN
        ALTER TABLE job_applications RENAME COLUMN "companyName" TO company_name;
        RAISE NOTICE 'Renamed job_applications.companyName to company_name';
    END IF;
END $$;

-- 2. Fix boolean columns to use verb prefixes
-- Example: Change 'saved' to 'is_saved', 'applied' to 'is_applied'
DO $$
BEGIN
    -- Fix boolean columns in job_applications table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'saved' AND data_type = 'boolean'
    ) THEN
        ALTER TABLE job_applications RENAME COLUMN saved TO is_saved;
        RAISE NOTICE 'Renamed job_applications.saved to is_saved';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'applied' AND data_type = 'boolean'
    ) THEN
        ALTER TABLE job_applications RENAME COLUMN applied TO is_applied;
        RAISE NOTICE 'Renamed job_applications.applied to is_applied';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'interview' AND data_type = 'boolean'
    ) THEN
        ALTER TABLE job_applications RENAME COLUMN interview TO is_interview_scheduled;
        RAISE NOTICE 'Renamed job_applications.interview to is_interview_scheduled';
    END IF;
    
    -- Fix boolean columns in users table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'verified' AND data_type = 'boolean'
    ) THEN
        ALTER TABLE users RENAME COLUMN verified TO is_email_verified;
        RAISE NOTICE 'Renamed users.verified to is_email_verified';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'active' AND data_type = 'boolean'
    ) THEN
        ALTER TABLE users RENAME COLUMN active TO is_active;
        RAISE NOTICE 'Renamed users.active to is_active';
    END IF;
END $$;

-- 3. Fix timestamp columns to use _at suffix
DO $$
BEGIN
    -- Fix timestamp columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'created' 
        AND data_type IN ('timestamp', 'timestamptz', 'timestamp without time zone', 'timestamp with time zone')
    ) THEN
        ALTER TABLE users RENAME COLUMN created TO created_at;
        RAISE NOTICE 'Renamed users.created to created_at';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated' 
        AND data_type IN ('timestamp', 'timestamptz', 'timestamp without time zone', 'timestamp with time zone')
    ) THEN
        ALTER TABLE users RENAME COLUMN updated TO updated_at;
        RAISE NOTICE 'Renamed users.updated to updated_at';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'appliedDate' 
        AND data_type IN ('timestamp', 'timestamptz', 'timestamp without time zone', 'timestamp with time zone')
    ) THEN
        ALTER TABLE job_applications RENAME COLUMN "appliedDate" TO applied_at;
        RAISE NOTICE 'Renamed job_applications.appliedDate to applied_at';
    END IF;
END $$;

-- 4. Add missing standard timestamp columns if they don't exist
DO $$
BEGIN
    -- Add created_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added users.created_at column';
    END IF;
    
    -- Add updated_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added users.updated_at column';
    END IF;
    
    -- Add deleted_at if missing (for soft deletes)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;
        RAISE NOTICE 'Added users.deleted_at column';
    END IF;
    
    -- Repeat for other important tables
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE job_applications ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added job_applications.created_at column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE job_applications ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added job_applications.updated_at column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE job_applications ADD COLUMN deleted_at TIMESTAMP NULL;
        RAISE NOTICE 'Added job_applications.deleted_at column';
    END IF;
END $$;

-- 5. Create or update triggers for updated_at timestamps
DO $$
BEGIN
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    
    -- Create trigger function
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    
    -- Create trigger for users table
    CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE 'Created/updated trigger for users.updated_at';
    
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
    
    -- Create trigger for job_applications table
    CREATE TRIGGER update_job_applications_updated_at
        BEFORE UPDATE ON job_applications
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE 'Created/updated trigger for job_applications.updated_at';
END $$;

-- 6. Update constraints to follow naming conventions
DO $$
BEGIN
    -- Example: Rename primary key constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_pkey' AND table_name = 'users'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_pkey;
        ALTER TABLE users ADD CONSTRAINT pk_users PRIMARY KEY (id);
        RAISE NOTICE 'Renamed users primary key constraint to pk_users';
    END IF;
    
    -- Example: Rename foreign key constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'job_applications_user_id_fkey' AND table_name = 'job_applications'
    ) THEN
        ALTER TABLE job_applications DROP CONSTRAINT job_applications_user_id_fkey;
        ALTER TABLE job_applications ADD CONSTRAINT fk_job_applications_user_id FOREIGN KEY (user_id) REFERENCES users(id);
        RAISE NOTICE 'Renamed job_applications foreign key constraint to fk_job_applications_user_id';
    END IF;
    
    -- Example: Rename unique constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_email_key' AND table_name = 'users'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_email_key;
        ALTER TABLE users ADD CONSTRAINT uk_users_email UNIQUE (email);
        RAISE NOTICE 'Renamed users unique constraint to uk_users_email';
    END IF;
END $$;

-- 7. Update indexes to follow naming conventions
DO $$
BEGIN
    -- Example: Rename index
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'users_email_idx' AND tablename = 'users'
    ) THEN
        DROP INDEX users_email_idx;
        CREATE INDEX idx_users_email ON users(email);
        RAISE NOTICE 'Renamed users email index to idx_users_email';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'job_applications_user_id_idx' AND tablename = 'job_applications'
    ) THEN
        DROP INDEX job_applications_user_id_idx;
        CREATE INDEX idx_job_applications_user_id ON job_applications(user_id);
        RAISE NOTICE 'Renamed job_applications user_id index to idx_job_applications_user_id';
    END IF;
END $$;

-- 8. Create helpful views for common naming convention checks
CREATE OR REPLACE VIEW v_naming_convention_violations AS
SELECT 
    'camel_case_columns' as issue_type,
    table_name,
    column_name as issue_name,
    data_type,
    'Use snake_case instead of camelCase' as recommendation
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name ~ '[a-z][A-Z]'
AND table_name NOT LIKE 'pg_%'

UNION ALL

SELECT 
    'boolean_no_verb_prefix' as issue_type,
    table_name,
    column_name as issue_name,
    data_type,
    'Use is_, has_, can_, should_, or requires_ prefix' as recommendation
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND data_type = 'boolean'
AND column_name NOT LIKE 'is_%'
AND column_name NOT LIKE 'has_%'
AND column_name NOT LIKE 'can_%'
AND column_name NOT LIKE 'should_%'
AND column_name NOT LIKE 'requires_%'
AND column_name NOT IN ('active', 'deleted', 'archived')
AND table_name NOT LIKE 'pg_%'

UNION ALL

SELECT 
    'table_naming' as issue_type,
    table_name,
    '' as issue_name,
    'table' as data_type,
    'Use plural snake_case for table names' as recommendation
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND (
    table_name ~ '[A-Z]' OR 
    table_name NOT LIKE '%_%' OR 
    NOT table_name ~ 's$'
)
AND table_name NOT LIKE 'pg_%';

-- Add comment to the view
COMMENT ON VIEW v_naming_convention_violations IS 'View showing all naming convention violations in the database schema';

RAISE NOTICE 'Naming convention fixes completed successfully!';
RAISE NOTICE 'Run: SELECT * FROM v_naming_convention_violations; to see remaining issues';
