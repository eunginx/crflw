#!/bin/bash

# Email-based Schema Migration Runner
# This script runs the 003_email_based_schema.sql migration

echo "🔄 Running Email-based Schema Migration..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 -U postgres; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Set database connection variables
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="app_data"
DB_USER="postgres"
DB_PASSWORD="postgres"

# Export password for psql
export PGPASSWORD=$DB_PASSWORD

# Run the migration
echo "📊 Applying email-based schema migration..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f src/migrations/003_email_based_schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Email-based schema migration completed successfully!"
    echo ""
    echo "📋 New Email-based Tables Created:"
    echo "  - users_email (primary user table with email as identifier)"
    echo "  - user_profiles_email (user profiles by email)"
    echo "  - user_settings_email (user settings by email)"
    echo "  - onboarding_progress_email (onboarding by email)"
    echo "  - job_applications_email (job applications by email)"
    echo "  - user_preferences_email (preferences by email)"
    echo "  - resume_files_email (resume files by email)"
    echo "  - job_search_history_email (search history by email)"
    echo ""
    echo "🔍 Data Migration:"
    echo "  - All existing data migrated to email-based schema"
    echo "  - Firebase UID compatibility maintained"
    echo "  - Email now serves as primary identifier"
    echo ""
    echo "🚀 Ready for email-based API endpoints!"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi

# Unset password
unset PGPASSWORD
