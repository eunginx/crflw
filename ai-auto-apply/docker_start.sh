#!/bin/bash

# Docker Environment Startup Script for AI Auto Apply
# This script starts all services as Docker containers

set -e

echo "🐳 Starting AI Auto Apply Docker Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Killing process $pid on port $port${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 2
    fi
}

# Stop any running local services to avoid port conflicts
echo -e "${BLUE}🧹 Stopping any local services to avoid port conflicts...${NC}"
kill_port 3000  # Frontend
kill_port 6001  # Backend (appData)
kill_port 8000  # AI Service
kill_port 3100  # Frontend production
kill_port 5433  # PostgreSQL
kill_port 6379  # Redis
kill_port 5050  # PgAdmin

# Navigate to script directory
echo -e "${BLUE}📁 Changing to script directory: $(dirname "$0")${NC}"
cd "$(dirname "$0")"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop or Docker daemon.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Choose environment
ENVIRONMENT=${1:-dev}
if [ "$ENVIRONMENT" = "prod" ] || [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILE="docker-compose.yml"
    echo -e "${BLUE}🚀 Starting PRODUCTION environment...${NC}"
else
    COMPOSE_FILE="docker-compose.dev.yml"
    echo -e "${BLUE}🚀 Starting DEVELOPMENT environment with hot reload...${NC}"
fi

# Build and start containers
echo -e "${BLUE}🔨 Building and starting containers...${NC}"
docker-compose -f $COMPOSE_FILE down --volumes --remove-orphans
docker-compose -f $COMPOSE_FILE build --no-cache
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be ready
echo -e "${BLUE}⏳ Waiting for services to initialize...${NC}"
sleep 10

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${BLUE}⏳ Waiting for $service_name to be ready...${NC}"
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi
        echo -e "${YELLOW}⏱️  Attempt $attempt/$max_attempts: $service_name not ready yet...${NC}"
        sleep 3
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service_name failed to start within expected time${NC}"
    return 1
}

# Check service status
echo -e "${BLUE}🔍 Checking service status...${NC}"
echo ""

if [ "$ENVIRONMENT" = "prod" ] || [ "$ENVIRONMENT" = "production" ]; then
    # Production ports
    FRONTEND_PORT=3100
    BACKEND_PORT=6001
    AI_SERVICE_PORT=8000
else
    # Development ports
    FRONTEND_PORT=3000
    BACKEND_PORT=6001
    AI_SERVICE_PORT=8000
fi

# Check Frontend
echo -e "${BLUE}  🌐 Checking Frontend (port $FRONTEND_PORT)...${NC}"
if check_port $FRONTEND_PORT; then
    echo -e "${GREEN}  ✅ Frontend running on http://localhost:$FRONTEND_PORT${NC}"
    if [ "$ENVIRONMENT" != "prod" ] && [ "$ENVIRONMENT" != "production" ]; then
        wait_for_service "http://localhost:$FRONTEND_PORT" "Frontend"
    fi
else
    echo -e "${RED}  ❌ Frontend failed to start${NC}"
fi
echo ""

# Check Backend
echo -e "${BLUE}  🔧 Checking Backend (port $BACKEND_PORT)...${NC}"
if check_port $BACKEND_PORT; then
    echo -e "${GREEN}  ✅ Backend running on http://localhost:$BACKEND_PORT${NC}"
    wait_for_service "http://localhost:$BACKEND_PORT/health" "Backend"
else
    echo -e "${RED}  ❌ Backend failed to start${NC}"
fi
echo ""

# Check AI Service
echo -e "${BLUE}  🤖 Checking AI Service (port $AI_SERVICE_PORT)...${NC}"
if check_port $AI_SERVICE_PORT; then
    echo -e "${GREEN}  ✅ AI Service running on http://localhost:$AI_SERVICE_PORT${NC}"
    wait_for_service "http://localhost:$AI_SERVICE_PORT/health" "AI Service"
else
    echo -e "${RED}  ❌ AI Service failed to start${NC}"
fi
echo ""

# Check Database
echo -e "${BLUE}  🗄️ Checking Database (port 5433)...${NC}"
if check_port 5433; then
    echo -e "${GREEN}  ✅ PostgreSQL running on localhost:5433${NC}"
else
    echo -e "${RED}  ❌ PostgreSQL failed to start${NC}"
fi
echo ""

# Show container status
echo -e "${BLUE}📊 Container Status:${NC}"
docker-compose -f $COMPOSE_FILE ps

echo ""
echo -e "${GREEN}🎉 AI Auto Apply Docker Environment Started Successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Services Summary:${NC}"
echo -e "  🌐 Frontend:    ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
echo -e "  🔧 Backend:     ${GREEN}http://localhost:$BACKEND_PORT${NC}"
echo -e "  🤖 AI Service:  ${GREEN}http://localhost:$AI_SERVICE_PORT${NC}"
echo -e "  🗄️ PostgreSQL:  ${GREEN}localhost:5433${NC}"
echo -e "  🔴 Redis:       ${GREEN}localhost:6379${NC}"
echo -e "  🛠️  PgAdmin:    ${GREEN}http://localhost:5050${NC} (admin@example.com / admin)"
echo ""
echo -e "${BLUE}🛠️  Management Commands:${NC}"
echo -e "  🛑 Stop all containers: ${YELLOW}docker-compose -f $COMPOSE_FILE down${NC}"
echo -e "  📊 View logs: ${YELLOW}docker-compose -f $COMPOSE_FILE logs -f${NC}"
echo -e "  🔄 Restart containers: ${YELLOW}docker-compose -f $COMPOSE_FILE restart${NC}"
echo -e "  🐚 Shell access: ${YELLOW}docker-compose -f $COMPOSE_FILE exec <service> sh${NC}"
echo ""
echo -e "${GREEN}✅ All systems operational! Happy coding! 🐳${NC}"
