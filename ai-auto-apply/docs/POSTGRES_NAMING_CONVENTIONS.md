# PostgreSQL Schema Naming Conventions

## 🎯 Overview

This document establishes clear naming conventions for PostgreSQL database schema to ensure consistency, readability, and maintainability across all database objects.

## 📋 Core Rules

### 1. Snake Case for All Identifiers
**Rule**: Use `snake_case` for all database object names (tables, columns, constraints, indexes, etc.)

**Examples**:
```sql
-- ✅ Correct
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ❌ Incorrect
CREATE TABLE UserSettings (
    userId UUID PRIMARY KEY,
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Verbs for State/Status Columns
**Rule**: Use verbs or verb phrases for columns that represent state, status, or boolean conditions

**Examples**:
```sql
-- ✅ Correct - Using verbs for states
CREATE TABLE job_applications (
    id UUID PRIMARY KEY,
    is_saved BOOLEAN DEFAULT false,
    is_applied BOOLEAN DEFAULT false,
    has_interview BOOLEAN DEFAULT false,
    should_follow_up BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT true,
    requires_action BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'draft'
);

-- ❌ Incorrect - Using nouns for states
CREATE TABLE job_applications (
    id UUID PRIMARY KEY,
    saved BOOLEAN DEFAULT false,
    applied BOOLEAN DEFAULT false,
    interview BOOLEAN DEFAULT false,
    follow_up BOOLEAN DEFAULT false,
    edit BOOLEAN DEFAULT true,
    action BOOLEAN DEFAULT false
);
```

## 🏷️ Specific Naming Conventions

### Table Names
- **Format**: `snake_case` with plural nouns
- **Pattern**: `{entity}` or `{entity}_{subtype}`

```sql
-- ✅ Correct
users
user_settings
job_applications
email_campaigns
application_statuses
user_authentication_logs

-- ❌ Incorrect
User
UserSetting
JobApplication
emailCampaigns
applicationStatus
userAuthLogs
```

### Column Names
- **Format**: `snake_case`
- **Primary Keys**: `{table}_id`
- **Foreign Keys**: `{referenced_table}_id`
- **Timestamps**: `created_at`, `updated_at`, `deleted_at`
- **Boolean States**: Use `is_`, `has_`, `can_`, `should_`, `requires_` prefixes

```sql
-- ✅ Correct Column Names
CREATE TABLE user_job_applications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    job_id UUID REFERENCES job_postings(id),
    is_saved BOOLEAN DEFAULT false,
    is_applied BOOLEAN DEFAULT false,
    has_cover_letter BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT true,
    should_notify BOOLEAN DEFAULT false,
    requires_review BOOLEAN DEFAULT false,
    application_status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);
```

### State/Status Column Patterns

#### Boolean State Columns
Use these prefixes for boolean state columns:

| Prefix | Usage | Example |
|--------|-------|---------|
| `is_` | Current state/condition | `is_active`, `is_verified`, `is_published` |
| `has_` | Possession/attributes | `has_profile`, `has_resume`, `has_experience` |
| `can_` | Permission/capability | `can_edit`, `can_delete`, `can_view` |
| `should_` | Recommendation/requirement | `should_notify`, `should_remind`, `should_sync` |
| `requires_` | Mandatory actions | `requires_approval`, `requires_verification`, `requires_review` |

#### Status/Enum Columns
- Use descriptive status names
- Keep them short but meaningful
- Use consistent status values across tables

```sql
-- ✅ Correct Status Columns
application_status VARCHAR(20) DEFAULT 'draft'  -- 'draft', 'saved', 'applied', 'interview', 'offer', 'rejected'
user_state VARCHAR(20) DEFAULT 'inactive'       -- 'inactive', 'active', 'suspended', 'deleted'
email_verification_status VARCHAR(20) DEFAULT 'pending'  -- 'pending', 'verified', 'failed'
subscription_status VARCHAR(20) DEFAULT 'trial'  -- 'trial', 'active', 'expired', 'cancelled'
```

### Constraint Names
- **Format**: `{type}_{table}_{column(s)}`
- **Types**: `pk`, `fk`, `uk`, `ck`, `idx`

```sql
-- ✅ Correct Constraint Names
CONSTRAINT pk_user_settings PRIMARY KEY (id),
CONSTRAINT fk_user_settings_user_id FOREIGN KEY (user_id) REFERENCES users(id),
CONSTRAINT uk_user_email UNIQUE (email),
CONSTRAINT ck_salary_range CHECK (salary_max > salary_min),
CONSTRAINT idx_user_settings_user_id INDEX (user_id)
```

### Index Names
- **Format**: `idx_{table}_{column(s)}`
- **Include purpose if multiple indexes on same table**

```sql
-- ✅ Correct Index Names
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX idx_job_applications_status_created ON job_applications(status, created_at);
CREATE INDEX idx_user_settings_keywords_gin ON user_settings USING gin(keywords);
```

## 📝 Complete Schema Example

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(128) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    is_email_verified BOOLEAN DEFAULT false,
    is_phone_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    can_receive_notifications BOOLEAN DEFAULT true,
    should_send_welcome_email BOOLEAN DEFAULT true,
    requires_profile_completion BOOLEAN DEFAULT true,
    account_status VARCHAR(20) DEFAULT 'pending_verification',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- User settings table
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    keywords TEXT,
    locations TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    is_auto_apply_enabled BOOLEAN DEFAULT true,
    is_cover_letter_generation_enabled BOOLEAN DEFAULT true,
    should_apply_remote_only BOOLEAN DEFAULT false,
    has_completed_onboarding BOOLEAN DEFAULT false,
    can_edit_settings BOOLEAN DEFAULT true,
    requires_preferences_setup BOOLEAN DEFAULT true,
    notification_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_settings_user_id FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uk_user_settings_user_id UNIQUE (user_id),
    CONSTRAINT ck_salary_range CHECK (salary_max > salary_min OR salary_min IS NULL OR salary_max IS NULL)
);

-- Job applications table
CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    application_status VARCHAR(20) DEFAULT 'saved',
    is_saved BOOLEAN DEFAULT true,
    is_applied BOOLEAN DEFAULT false,
    has_cover_letter BOOLEAN DEFAULT false,
    has_resume_attached BOOLEAN DEFAULT false,
    is_interview_scheduled BOOLEAN DEFAULT false,
    should_send_follow_up BOOLEAN DEFAULT false,
    requires_action BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT true,
    priority_level VARCHAR(10) DEFAULT 'medium',
    application_source VARCHAR(50),
    job_location VARCHAR(255),
    salary_min INTEGER,
    salary_max INTEGER,
    job_description TEXT,
    application_notes TEXT,
    applied_at TIMESTAMP,
    interview_scheduled_at TIMESTAMP,
    last_follow_up_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    CONSTRAINT fk_job_applications_user_id FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT ck_application_status CHECK (application_status IN ('saved', 'applied', 'interview', 'offer', 'rejected', 'withdrawn')),
    CONSTRAINT ck_priority_level CHECK (priority_level IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT ck_salary_range_app CHECK (salary_max > salary_min OR salary_min IS NULL OR salary_max IS NULL)
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_is_active ON users(is_active);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_user_settings_keywords_gin ON user_settings USING gin(keywords);
CREATE INDEX idx_user_settings_locations_gin ON user_settings USING gin(locations);

CREATE INDEX idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX idx_job_applications_status ON job_applications(application_status);
CREATE INDEX idx_job_applications_created_at ON job_applications(created_at);
CREATE INDEX idx_job_applications_user_status ON job_applications(user_id, application_status);
CREATE INDEX idx_job_applications_company_name ON job_applications(company_name);
CREATE INDEX idx_job_applications_priority_level ON job_applications(priority_level);
```

## 🔄 Migration Guidelines

### When Renaming Existing Columns
1. Add new column with correct naming
2. Migrate data from old column
3. Update application code
4. Drop old column

```sql
-- Example migration
-- Step 1: Add new column
ALTER TABLE users ADD COLUMN is_email_verified BOOLEAN DEFAULT false;

-- Step 2: Migrate data
UPDATE users SET is_email_verified = (email_verified = 'true'::boolean);

-- Step 3: Update application code (separate step)

-- Step 4: Drop old column (after code is updated)
ALTER TABLE users DROP COLUMN email_verified;
```

### Consistency Checks
Run these queries to verify naming conventions:

```sql
-- Check for camelCase columns (should be snake_case)
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name ~ '[a-z][A-Z]';

-- Check boolean columns that don't use verb prefixes
SELECT table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND data_type = 'boolean'
AND column_name NOT LIKE 'is_%'
AND column_name NOT LIKE 'has_%'
AND column_name NOT LIKE 'can_%'
AND column_name NOT LIKE 'should_%'
AND column_name NOT LIKE 'requires_%';
```

## ✅ Benefits

1. **Readability**: Snake_case is easier to read in SQL
2. **Consistency**: Uniform naming across all database objects
3. **Clarity**: Verbs clearly indicate state/boolean columns
4. **Maintainability**: Predictable naming patterns
5. **Documentation**: Self-documenting code through naming
6. **Tool Compatibility**: Better compatibility with ORMs and tools

## 🎯 Implementation Checklist

- [ ] Review all existing tables for naming compliance
- [ ] Update any non-compliant column names
- [ ] Ensure all boolean state columns use verb prefixes
- [ ] Add consistent constraints and indexes
- [ ] Update application code to use new naming
- [ ] Add naming convention checks to CI/CD
- [ ] Document any exceptions with justification

**Following these conventions will ensure a clean, maintainable, and consistent database schema!** 🚀
