-- PostgreSQL Naming Convention Checker
-- This script checks for violations of the naming conventions

-- 1. Check for camelCase columns (should be snake_case)
SELECT 
    'CAMEL_CASE_COLUMNS' as issue_type,
    table_name,
    column_name,
    data_type,
    'Use snake_case instead of camelCase' as recommendation
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name ~ '[a-z][A-Z]'
AND table_name NOT LIKE 'pg_%'
ORDER BY table_name, column_name;

-- 2. Check boolean columns that don't use verb prefixes
SELECT 
    'BOOLEAN_NO_VERB_PREFIX' as issue_type,
    table_name,
    column_name,
    data_type,
    'Use is_, has_, can_, should_, or requires_ prefix for boolean state columns' as recommendation
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND data_type = 'boolean'
AND column_name NOT LIKE 'is_%'
AND column_name NOT LIKE 'has_%'
AND column_name NOT LIKE 'can_%'
AND column_name NOT LIKE 'should_%'
AND column_name NOT LIKE 'requires_%'
AND column_name NOT IN ('active', 'deleted', 'archived') -- Allow some common exceptions
AND table_name NOT LIKE 'pg_%'
ORDER BY table_name, column_name;

-- 3. Check for table names that are not plural snake_case
SELECT 
    'TABLE_NAMING' as issue_type,
    table_name,
    'Use plural snake_case for table names' as recommendation
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND (
    table_name ~ '[A-Z]' OR -- Contains uppercase
    table_name NOT LIKE '%_%' OR -- No underscores
    NOT table_name ~ 's$' -- Doesn't end with 's' (not plural)
)
AND table_name NOT LIKE 'pg_%'
ORDER BY table_name;

-- 4. Check for primary key naming (should be {table}_id)
SELECT 
    'PRIMARY_KEY_NAMING' as issue_type,
    tc.table_name,
    kcu.column_name,
    'Primary key should be named {table}_id' as recommendation
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
AND tc.table_schema = 'public'
AND kcu.column_name != tc.table_name || '_id'
AND tc.table_name NOT LIKE 'pg_%'
ORDER BY tc.table_name;

-- 5. Check for foreign key naming (should be {referenced_table}_id)
SELECT 
    'FOREIGN_KEY_NAMING' as issue_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    'Foreign key should be named {referenced_table}_id' as recommendation
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND kcu.column_name != ccu.table_name || '_id'
AND tc.table_name NOT LIKE 'pg_%'
ORDER BY tc.table_name;

-- 6. Check for timestamp columns (should use _at suffix)
SELECT 
    'TIMESTAMP_NAMING' as issue_type,
    table_name,
    column_name,
    data_type,
    'Timestamp columns should end with _at' as recommendation
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND data_type IN ('timestamp', 'timestamptz', 'timestamp without time zone', 'timestamp with time zone')
AND column_name NOT LIKE '%_at'
AND column_name NOT IN ('created', 'modified', 'updated') -- Common exceptions
AND table_name NOT LIKE 'pg_%'
ORDER BY table_name, column_name;

-- 7. Generate summary report
WITH naming_issues AS (
    SELECT COUNT(*) as camel_case_columns FROM information_schema.columns 
    WHERE table_schema = 'public' AND column_name ~ '[a-z][A-Z]' AND table_name NOT LIKE 'pg_%'
    
    UNION ALL
    
    SELECT COUNT(*) as boolean_no_verb_prefix FROM information_schema.columns 
    WHERE table_schema = 'public' AND data_type = 'boolean'
    AND column_name NOT LIKE 'is_%' AND column_name NOT LIKE 'has_%' 
    AND column_name NOT LIKE 'can_%' AND column_name NOT LIKE 'should_%' 
    AND column_name NOT LIKE 'requires_%' 
    AND column_name NOT IN ('active', 'deleted', 'archived')
    AND table_name NOT LIKE 'pg_%'
    
    UNION ALL
    
    SELECT COUNT(*) as table_naming FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    AND (table_name ~ '[A-Z]' OR table_name NOT LIKE '%_%' OR NOT table_name ~ 's$')
    AND table_name NOT LIKE 'pg_%'
    
    UNION ALL
    
    SELECT COUNT(*) as primary_key_naming FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
    AND kcu.column_name != tc.table_name || '_id' AND tc.table_name NOT LIKE 'pg_%'
    
    UNION ALL
    
    SELECT COUNT(*) as foreign_key_naming FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    AND kcu.column_name != ccu.table_name || '_id' AND tc.table_name NOT LIKE 'pg_%'
    
    UNION ALL
    
    SELECT COUNT(*) as timestamp_naming FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND data_type IN ('timestamp', 'timestamptz', 'timestamp without time zone', 'timestamp with time zone')
    AND column_name NOT LIKE '%_at'
    AND column_name NOT IN ('created', 'modified', 'updated')
    AND table_name NOT LIKE 'pg_%'
)
SELECT 
    'SUMMARY' as issue_type,
    'Total naming convention issues found' as recommendation,
    SUM(camel_case_columns) as camel_case_columns,
    SUM(boolean_no_verb_prefix) as boolean_no_verb_prefix,
    SUM(table_naming) as table_naming,
    SUM(primary_key_naming) as primary_key_naming,
    SUM(foreign_key_naming) as foreign_key_naming,
    SUM(timestamp_naming) as timestamp_naming,
    SUM(camel_case_columns + boolean_no_verb_prefix + table_naming + primary_key_naming + foreign_key_naming + timestamp_naming) as total_issues
FROM naming_issues;
