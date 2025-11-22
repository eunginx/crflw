#!/bin/bash

# PostgreSQL Naming Convention Checker
# This script runs naming convention checks and provides a summary

# Configuration
DB_NAME="${DB_NAME:-careerflow_db}"
DB_USER="${DB_USER:-careerflow_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 PostgreSQL Naming Convention Checker${NC}"
echo "======================================"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo ""

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql command not found. Please install PostgreSQL client.${NC}"
    exit 1
fi

# Check database connection
echo -e "${BLUE}📋 Testing database connection...${NC}"
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &> /dev/null; then
    echo -e "${RED}❌ Error: Cannot connect to database '$DB_NAME' on $DB_HOST:$DB_PORT${NC}"
    echo "Please check your database connection parameters:"
    echo "  DB_NAME=$DB_NAME"
    echo "  DB_USER=$DB_USER"
    echo "  DB_HOST=$DB_HOST"
    echo "  DB_PORT=$DB_PORT"
    exit 1
fi

echo -e "${GREEN}✅ Database connection successful${NC}"
echo ""

# Run naming convention checks
echo -e "${BLUE}🔍 Running naming convention checks...${NC}"
echo ""

# Create temporary file for results
TEMP_RESULTS=$(mktemp)

# Run the check script and save results
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/check-naming-conventions.sql" > "$TEMP_RESULTS" 2>&1

# Check for errors
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error running naming convention checks:${NC}"
    cat "$TEMP_RESULTS"
    rm "$TEMP_RESULTS"
    exit 1
fi

# Process results
echo -e "${BLUE}📊 Results:${NC}"
echo ""

# Extract summary
SUMMARY=$(grep "SUMMARY" "$TEMP_RESULTS")

if [ -n "$SUMMARY" ]; then
    echo "$SUMMARY" | while IFS='|' read -r issue_type recommendation camel_case boolean_no_verb table_naming primary_key foreign_key timestamp total; do
        echo -e "${YELLOW}📈 Summary Report:${NC}"
        echo -e "  Camel case columns: ${camel_case:-0}"
        echo -e "  Boolean columns without verb prefixes: ${boolean_no_verb:-0}"
        echo -e "  Table naming issues: ${table_naming:-0}"
        echo -e "  Primary key naming issues: ${primary_key:-0}"
        echo -e "  Foreign key naming issues: ${foreign_key:-0}"
        echo -e "  Timestamp naming issues: ${timestamp:-0}"
        echo -e "  ${RED}Total issues: ${total:-0}${NC}"
        echo ""
    done
else
    echo -e "${YELLOW}⚠️  Could not extract summary from results${NC}"
fi

# Show detailed issues (excluding summary)
echo -e "${BLUE}📋 Detailed Issues:${NC}"
echo ""

# Show non-summary lines
grep -v "SUMMARY" "$TEMP_RESULTS" | grep "|" | while IFS='|' read -r issue_type table_name column_name data_type recommendation; do
    if [ -n "$issue_type" ] && [ "$issue_type" != "issue_type" ]; then
        echo -e "${RED}❌ $issue_type${NC}"
        echo -e "   Table: $table_name"
        echo -e "   Column: $column_name"
        echo -e "   Type: $data_type"
        echo -e "   Fix: $recommendation"
        echo ""
    fi
done

# Clean up
rm "$TEMP_RESULTS"

# Provide recommendations
echo -e "${BLUE}💡 Recommendations:${NC}"
echo ""

TOTAL_ISSUES=$(grep "SUMMARY" "$TEMP_RESULTS" | tail -1 | grep -o '[0-9]\+$' || echo "0")

if [ "$TOTAL_ISSUES" -eq 0 ]; then
    echo -e "${GREEN}🎉 Excellent! No naming convention violations found.${NC}"
    echo ""
    echo -e "${BLUE}✨ Your database follows all naming conventions:${NC}"
    echo "  • All columns use snake_case"
    echo "  • Boolean columns use verb prefixes"
    echo "  • Tables use plural snake_case"
    echo "  • Keys follow naming patterns"
    echo "  • Timestamps use _at suffix"
else
    echo -e "${YELLOW}⚠️  Found $TOTAL_ISSUES naming convention issues.${NC}"
    echo ""
    echo -e "${BLUE}🔧 To fix these issues, run:${NC}"
    echo "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $SCRIPT_DIR/fix-naming-conventions.sql"
    echo ""
    echo -e "${BLUE}⚠️  WARNING: Always review the fix script before running!${NC}"
    echo "  • Make a backup of your database first"
    echo "  • Test in a development environment"
    echo "  • Review the script for your specific schema"
fi

echo ""
echo -e "${BLUE}📚 Naming Convention Rules:${NC}"
echo "  • Use snake_case for all identifiers"
echo "  • Use verbs (is_, has_, can_, should_, requires_) for boolean states"
echo "  • Use plural snake_case for table names"
echo "  • Name primary keys as {table}_id"
echo "  • Name foreign keys as {referenced_table}_id"
echo "  • End timestamp columns with _at"
echo "  • Use {type}_{table}_{column} for constraints"
echo "  • Use idx_{table}_{column} for indexes"
echo ""

echo -e "${GREEN}✅ Naming convention check completed!${NC}"
