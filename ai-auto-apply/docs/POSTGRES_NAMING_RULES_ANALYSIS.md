# PostgreSQL Naming Convention Rules & Analysis

## 🎯 Core Naming Convention Rules

### 1. Snake Case for All Identifiers
**Rule**: Use `snake_case` for ALL database object names (tables, columns, constraints, indexes)

**Examples**:
```sql
-- ✅ CORRECT
user_settings
job_applications
first_name
created_at
updated_at

-- ❌ INCORRECT
userSettings
jobApplications
firstName
createdAt
updatedAt
```

### 2. Verbs for State/Status Columns
**Rule**: Use verbs or verb phrases for columns that represent state, status, or boolean conditions

**Boolean State Prefixes**:
- `is_` - Current state/condition (is_active, is_verified, is_published)
- `has_` - Possession/attributes (has_profile, has_resume, has_experience)
- `can_` - Permission/capability (can_edit, can_delete, can_view)
- `should_` - Recommendation/requirement (should_notify, should_remind)
- `requires_` - Mandatory actions (requires_approval, requires_verification)

**Examples**:
```sql
-- ✅ CORRECT
is_saved BOOLEAN DEFAULT false
is_applied BOOLEAN DEFAULT false
has_cover_letter BOOLEAN DEFAULT false
can_edit BOOLEAN DEFAULT true
should_notify BOOLEAN DEFAULT false
requires_review BOOLEAN DEFAULT false

-- ❌ INCORRECT
saved BOOLEAN DEFAULT false
applied BOOLEAN DEFAULT false
cover_letter BOOLEAN DEFAULT false
edit BOOLEAN DEFAULT true
notify BOOLEAN DEFAULT false
review BOOLEAN DEFAULT false
```

### 3. Table Naming Convention
**Rule**: Use plural snake_case for table names

**Examples**:
```sql
-- ✅ CORRECT
users
user_settings
job_applications
email_campaigns
application_statuses

-- ❌ INCORRECT
user
user_setting
job_application
emailCampaign
applicationStatus
```

### 4. Key Naming Convention
**Rule**: Use descriptive names for keys

**Primary Keys**: `{table}_id`
**Foreign Keys**: `{referenced_table}_id`

**Examples**:
```sql
-- ✅ CORRECT
CREATE TABLE users (
    users_id UUID PRIMARY KEY,  -- or just 'id' for simplicity
    ...
);

CREATE TABLE job_applications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),  -- Foreign key
    job_id UUID REFERENCES job_postings(id),
    ...
);

-- ❌ INCORRECT
CREATE TABLE users (
    userUUID PRIMARY KEY,
    ...
);

CREATE TABLE job_applications (
    id UUID PRIMARY KEY,
    userId UUID REFERENCES users(userUUID),  -- Inconsistent naming
    jobId UUID REFERENCES job_postings(jobUUID),
    ...
);
```

### 5. Timestamp Naming Convention
**Rule**: End timestamp columns with `_at` suffix

**Examples**:
```sql
-- ✅ CORRECT
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
deleted_at TIMESTAMP NULL
applied_at TIMESTAMP
interview_scheduled_at TIMESTAMP

-- ❌ INCORRECT
created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
deleted TIMESTAMP NULL
appliedDate TIMESTAMP
interview_date TIMESTAMP
```

### 6. Constraint Naming Convention
**Rule**: Use `{type}_{table}_{column(s)}` format

**Types**:
- `pk_` - Primary Key
- `fk_` - Foreign Key  
- `uk_` - Unique Key
- `ck_` - Check Constraint
- `idx_` - Index

**Examples**:
```sql
-- ✅ CORRECT
CONSTRAINT pk_users PRIMARY KEY (id)
CONSTRAINT fk_job_applications_user_id FOREIGN KEY (user_id) REFERENCES users(id)
CONSTRAINT uk_users_email UNIQUE (email)
CONSTRAINT ck_salary_range CHECK (salary_max > salary_min)
CREATE INDEX idx_users_email ON users(email)

-- ❌ INCORRECT
CONSTRAINT users_pkey PRIMARY KEY (id)
CONSTRAINT job_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
CONSTRAINT users_email_key UNIQUE (email)
CONSTRAINT salary_check CHECK (salary_max > salary_min)
CREATE INDEX users_email_idx ON users(email)
```

## 📊 Current Database Analysis Results

### Issues Found: 67 total violations

#### 1. Boolean Columns Without Verb Prefixes (26 issues)
**Problem**: Boolean columns not using `is_`, `has_`, `can_`, `should_`, or `requires_` prefixes

**Examples Found**:
- `user_settings.enable_auto_apply` → should be `is_auto_apply_enabled`
- `user_settings.generate_cover_letters` → should be `is_cover_letter_generation_enabled`
- `user_settings.apply_remote_only` → should be `should_apply_remote_only`
- `users.email_verified` → should be `is_email_verified`

#### 2. Table Naming Issues (10 issues)
**Problem**: Tables not using plural snake_case

**Examples Found**:
- `user_activity` → should be `user_activities`
- `user_preferences` → should be `user_preferences_list` or `preferences`
- `user_profiles` → should be `user_profiles` (already correct)

#### 3. Primary Key Naming Issues (17 issues)
**Problem**: Primary keys named `id` instead of `{table}_id`

**Examples Found**:
- All tables use `id` instead of `{table}_id`
- This is acceptable for simplicity, but inconsistent with the rule

#### 4. Foreign Key Naming Issues (8 issues)
**Problem**: Foreign keys not following `{referenced_table}_id` pattern

**Examples Found**:
- `job_applications_email.email` → should be `users_email_id`
- `user_activity.user_id` → actually correct, but flagged due to rule strictness

#### 5. Timestamp Naming Issues (6 issues)
**Problem**: Timestamp columns not ending with `_at`

**Examples Found**:
- `job_applications.applied_date` → should be `applied_at`
- `resume_files.upload_date` → should be `uploaded_at`
- `resume_files.last_used` → should be `last_used_at`

## 🔧 Recommended Fixes

### Priority 1: Critical Fixes
1. **Boolean State Columns**: Add verb prefixes for clarity
2. **Timestamp Columns**: Add `_at` suffix for consistency

### Priority 2: Important Fixes
1. **Foreign Key Naming**: Follow consistent pattern
2. **Table Naming**: Use plural forms consistently

### Priority 3: Optional Fixes
1. **Primary Key Naming**: Consider if `id` vs `{table}_id` matters
2. **Constraint Naming**: Update for consistency

## 📋 Implementation Plan

### Phase 1: Boolean State Fixes
```sql
-- Example fixes
ALTER TABLE user_settings RENAME COLUMN enable_auto_apply TO is_auto_apply_enabled;
ALTER TABLE user_settings RENAME COLUMN generate_cover_letters TO is_cover_letter_generation_enabled;
ALTER TABLE users RENAME COLUMN email_verified TO is_email_verified;
```

### Phase 2: Timestamp Fixes
```sql
-- Example fixes
ALTER TABLE job_applications RENAME COLUMN applied_date TO applied_at;
ALTER TABLE resume_files RENAME COLUMN upload_date TO uploaded_at;
ALTER TABLE resume_files RENAME COLUMN last_used TO last_used_at;
```

### Phase 3: Table Naming Fixes
```sql
-- Example fixes (requires more planning)
ALTER TABLE user_activity RENAME TO user_activities;
-- Note: This requires updating all references, foreign keys, indexes, etc.
```

## 🎯 Benefits of Following These Rules

### 1. **Readability**
- Snake_case is universally readable in SQL
- Verbs clearly indicate boolean state meaning
- Consistent naming reduces cognitive load

### 2. **Maintainability**
- Predictable patterns make debugging easier
- New developers can understand schema quickly
- Tools and ORMs work better with consistent naming

### 3. **Documentation**
- Self-documenting code through naming conventions
- Clear intent without needing comments
- Standardized patterns reduce ambiguity

### 4. **Tool Compatibility**
- Better support from ORMs (Prisma, TypeORM, etc.)
- Improved auto-completion in IDEs
- Easier migration between database systems

## ✅ Compliance Checklist

### For New Tables:
- [ ] Table name uses plural snake_case
- [ ] All columns use snake_case
- [ ] Boolean columns use verb prefixes
- [ ] Timestamp columns end with `_at`
- [ ] Primary key follows naming pattern
- [ ] Foreign keys follow naming pattern
- [ ] Constraints follow naming pattern
- [ ] Indexes follow naming pattern

### For Existing Tables:
- [ ] Run naming convention checker regularly
- [ ] Plan migrations for high-priority issues
- [ ] Document any intentional exceptions
- [ ] Update application code to match schema changes

## 🚀 Enforcement Strategy

### 1. **Automated Checking**
- Run naming convention checker in CI/CD
- Fail builds for new violations
- Generate reports for existing issues

### 2. **Code Review Process**
- Include schema naming in pull request reviews
- Use automated tools to catch violations
- Require documentation for exceptions

### 3. **Migration Planning**
- Prioritize fixes by impact and effort
- Schedule migrations during maintenance windows
- Test thoroughly in development environments

**Following these naming conventions will ensure a clean, maintainable, and professional database schema!** ✨
