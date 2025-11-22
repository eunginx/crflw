#!/bin/bash

# Complete App Data Service Restart Script
# Handles both API and database restart with proper setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Service configuration
SERVICE_DIR="/Users/kapilh/crflw/ai-auto-apply/appData"
PORT=6001
DB_PORT=5432

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ✅ $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ⚠️  $1"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ❌ $1"
}

# Check if service directory exists
check_service_dir() {
    if [ ! -d "$SERVICE_DIR" ]; then
        log_error "Service directory not found: $SERVICE_DIR"
        exit 1
    fi
}

# Stop existing services
stop_services() {
    log "Stopping existing services..."
    
    # Stop API service
    if [ -f "$SERVICE_DIR/app-data.pid" ]; then
        PID=$(cat "$SERVICE_DIR/app-data.pid")
        if ps -p $PID > /dev/null 2>&1; then
            kill $PID || true
            log_success "API service stopped (PID: $PID)"
        fi
        rm -f "$SERVICE_DIR/app-data.pid"
    fi
    
    # Stop any remaining processes
    pkill -f "node.*src/index.js" || true
    sleep 2
    
    log_success "Services stopped"
}

# Check PostgreSQL connection
check_postgres() {
    log "Checking PostgreSQL connection..."
    
    if PGPASSWORD=careerflow_password psql -h localhost -U careerflow_user -d careerflow_db -c "SELECT 1;" > /dev/null 2>&1; then
        log_success "PostgreSQL is accessible"
        return 0
    else
        log_warning "PostgreSQL not accessible"
        return 1
    fi
}

# Start PostgreSQL with Docker if not running
start_postgres_docker() {
    log "Starting PostgreSQL with Docker..."
    
    # Check if Docker is available
    if ! command -v docker > /dev/null 2>&1; then
        log_error "Docker not available. Please install Docker or use alternative PostgreSQL setup."
        return 1
    fi
    
    # Check if container exists
    if docker ps -a | grep -q careerflow_postgres; then
        log "Starting existing PostgreSQL container..."
        docker start careerflow_postgres
    else
        log "Creating new PostgreSQL container..."
        docker run --name careerflow_postgres \
            -e POSTGRES_DB=careerflow_db \
            -e POSTGRES_USER=careerflow_user \
            -e POSTGRES_PASSWORD=careerflow_password \
            -p 5432:5432 \
            -d postgres:15-alpine
    fi
    
    # Wait for PostgreSQL to be ready
    log "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if docker exec careerflow_postgres pg_isready -U careerflow_user -d careerflow_db > /dev/null 2>&1; then
            log_success "PostgreSQL is ready!"
            return 0
        fi
        if [ $i -eq 30 ]; then
            log_error "PostgreSQL failed to start"
            return 1
        fi
        sleep 2
    done
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    cd "$SERVICE_DIR"
    
    if node src/migrations/run-migrations.js; then
        log_success "Database migrations completed"
    else
        log_error "Migration failed"
        return 1
    fi
}

# Start API service
start_api_service() {
    log "Starting API service..."
    
    cd "$SERVICE_DIR"
    
    # Start the service in background
    if npm start > app-data.log 2>&1 & then
        API_PID=$!
        echo $API_PID > app-data.pid
        log_success "API service started (PID: $API_PID)"
        
        # Wait for service to be ready
        log "Waiting for API service to be ready..."
        for i in {1..30}; do
            if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
                log_success "API service is ready!"
                return 0
            fi
            if [ $i -eq 30 ]; then
                log_error "API service failed to start"
                return 1
            fi
            sleep 2
        done
    else
        log_error "Failed to start API service"
        return 1
    fi
}

# Test API endpoints
test_api() {
    log "Testing API endpoints..."
    
    # Test health endpoint
    if curl -s http://localhost:$PORT/health | grep -q "OK"; then
        log_success "Health check passed"
    else
        log_error "Health check failed"
        return 1
    fi
    
    # Test user creation endpoint
    if curl -s -X POST http://localhost:$PORT/api/user \
        -H "Content-Type: application/json" \
        -d '{"firebaseUid":"test-123","email":"test@example.com"}' \
        -o /dev/null -w "%{http_code}" | grep -q "200"; then
        log_success "User API test passed"
    else
        log_warning "User API test failed"
    fi
    
    log_success "API tests completed"
}

# Show service status
show_status() {
    log "Service Status:"
    echo "----------------------------------------"
    
    echo "Port Status:"
    if lsof -i :$PORT > /dev/null 2>&1; then
        echo "✅ API Service (Port $PORT): Running"
    else
        echo "❌ API Service (Port $PORT): Not running"
    fi
    
    if lsof -i :$DB_PORT > /dev/null 2>&1; then
        echo "✅ PostgreSQL (Port $DB_PORT): Running"
    else
        echo "❌ PostgreSQL (Port $DB_PORT): Not running"
    fi
    
    echo ""
    echo "Service URLs:"
    echo "🔗 API Health: http://localhost:$PORT/health"
    echo "🔗 API Base: http://localhost:$PORT/api"
    echo "----------------------------------------"
}

# Main restart function
restart_service() {
    log "🔄 Restarting App Data Service..."
    echo "========================================"
    
    check_service_dir
    stop_services
    
    # Try to start PostgreSQL if not running
    if ! check_postgres; then
        if ! start_postgres_docker; then
            log_error "Failed to start PostgreSQL. Please set up PostgreSQL manually."
            echo ""
            echo "📋 Manual PostgreSQL Setup Options:"
            echo "1. Install Docker and restart this script"
            echo "2. Use Homebrew: brew install postgresql@15 && brew services start postgresql@15"
            echo "3. Use Postgres.app: https://postgresapp.com"
            echo ""
            echo "After setup, run: cd $SERVICE_DIR && npm run migrate"
            exit 1
        fi
    fi
    
    run_migrations
    start_api_service
    test_api
    show_status
    
    log_success "🎉 App Data Service restart completed!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update frontend to use API endpoints"
    echo "2. Test integration with your application"
    echo "3. Configure production environment variables"
}

# Handle script arguments
case "${1:-restart}" in
    "start")
        log "🚀 Starting App Data Service..."
        restart_service
        ;;
    "stop")
        log "🛑 Stopping App Data Service..."
        check_service_dir
        stop_services
        ;;
    "status")
        log "📊 Checking App Data Service Status..."
        show_status
        ;;
    "test")
        log "🧪 Testing App Data Service..."
        test_api
        ;;
    "migrate")
        log "🗄️ Running database migrations..."
        check_service_dir
        run_migrations
        ;;
    "restart"|*)
        restart_service
        ;;
esac
