#!/bin/bash

# Local Environment Startup Script for AI Auto Apply
# This script starts all services for local development

set -e

echo "🚀 Starting AI Auto Apply Local Environment..."

# Ensure correct Node version
REQUIRED_NODE_MAJOR=20
NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')

if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]; then
  echo "❌ Node $REQUIRED_NODE_MAJOR+ is required. You are running Node $(node -v)."
  echo "👉 Please run: nvm install 20 && nvm use 20"
  exit 1
fi

echo "✅ Node version check passed: $(node -v)"

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
        echo -e "${YELLOW}⏱️  Attempt $attempt/$max_attempts: $service_name not ready yet (checking $url)...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service_name failed to start within expected time${NC}"
    return 1
}

# Kill existing processes on dev ports
echo -e "${BLUE}🧹 Cleaning up existing processes...${NC}"
kill_port 3000  # Frontend
kill_port 8000  # Backend (appData)
kill_port 9000  # AI Service

# Navigate to script directory
echo -e "${BLUE}📁 Changing to script directory: $(dirname "$0")${NC}"
cd "$(dirname "$0")"

# Check if node_modules exist, if not install dependencies
echo -e "${BLUE}📦 Checking dependencies...${NC}"

echo -e "${BLUE}  🔍 Checking frontend dependencies...${NC}"
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}  📥 Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
    echo -e "${GREEN}  ✅ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}  ✅ Frontend dependencies already installed${NC}"
fi

echo -e "${BLUE}  🔍 Checking AI service dependencies...${NC}"
if [ ! -d "ai-service/node_modules" ]; then
    echo -e "${YELLOW}  📥 Installing AI service dependencies...${NC}"
    cd ai-service && npm install && cd ..
    echo -e "${GREEN}  ✅ AI service dependencies installed${NC}"
else
    echo -e "${GREEN}  ✅ AI service dependencies already installed${NC}"
fi

echo -e "${BLUE}  🔍 Checking appData dependencies...${NC}"
if [ ! -d "appData/node_modules" ]; then
    echo -e "${YELLOW}  📥 Installing appData dependencies...${NC}"
    cd appData && npm install && cd ..
    echo -e "${GREEN}  ✅ AppData dependencies installed${NC}"
else
    echo -e "${GREEN}  ✅ AppData dependencies already installed${NC}"
fi

# Create logs directory
echo -e "${BLUE}📁 Creating logs directory...${NC}"
mkdir -p logs
echo -e "${GREEN}✅ Logs directory created${NC}"

# Start services in background
echo -e "${BLUE}🚀 Starting services...${NC}"
echo ""

# Start appData (Backend) on port 8000
echo -e "${BLUE}🔧 Starting Backend (appData) on port 8000...${NC}"
cd appData
echo -e "${YELLOW}  📝 Command: PORT=8000 npm run dev${NC}"
echo -e "${YELLOW}  📄 Log file: ../logs/backend.log${NC}"
PORT=8000 npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo $BACKEND_PID > logs/backend.pid
echo -e "${GREEN}  ✅ Backend started with PID: $BACKEND_PID${NC}"
echo ""

# Start AI Service on port 9000
echo -e "${BLUE}🤖 Starting AI Service on port 9000...${NC}"
cd ai-service
echo -e "${YELLOW}  📝 Command: PORT=9000 npm run dev${NC}"
echo -e "${YELLOW}  📄 Log file: ../logs/ai-service.log${NC}"
PORT=9000 npm run dev > ../logs/ai-service.log 2>&1 &
AI_SERVICE_PID=$!
cd ..
echo $AI_SERVICE_PID > logs/ai-service.pid
echo -e "${GREEN}  ✅ AI Service started with PID: $AI_SERVICE_PID${NC}"
echo ""

# Start Frontend on port 3000
echo -e "${BLUE}🌐 Starting Frontend on port 3000...${NC}"
cd frontend
echo -e "${YELLOW}  📝 Command: PORT=3000 npm start${NC}"
echo -e "${YELLOW}  📄 Log file: ../logs/frontend.log${NC}"
PORT=3000 npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo $FRONTEND_PID > logs/frontend.pid
echo -e "${GREEN}  ✅ Frontend started with PID: $FRONTEND_PID${NC}"
echo ""

# Wait for services to be ready
echo -e "${BLUE}⏳ Waiting for services to initialize...${NC}"
echo -e "${YELLOW}  💤 Giving services 5 seconds to start up...${NC}"
sleep 5

# Check if services are running
echo -e "${BLUE}🔍 Checking service status...${NC}"
echo ""

# Check Backend
echo -e "${BLUE}  🔧 Checking Backend (port 8000)...${NC}"
if check_port 8000; then
    echo -e "${GREEN}  ✅ Backend running on http://localhost:8000${NC}"
    wait_for_service "http://localhost:8000/health" "Backend"
else
    echo -e "${RED}  ❌ Backend failed to start${NC}"
    echo -e "${RED}  📄 Check logs/backend.log for details${NC}"
fi
echo ""

# Check AI Service
echo -e "${BLUE}  🤖 Checking AI Service (port 9000)...${NC}"
if check_port 9000; then
    echo -e "${GREEN}  ✅ AI Service running on http://localhost:9000${NC}"
    wait_for_service "http://localhost:9000/health" "AI Service"
else
    echo -e "${RED}  ❌ AI Service failed to start${NC}"
    echo -e "${RED}  📄 Check logs/ai-service.log for details${NC}"
fi
echo ""

# Check Frontend
echo -e "${BLUE}  🌐 Checking Frontend (port 3000)...${NC}"
if check_port 3000; then
    echo -e "${GREEN}  ✅ Frontend running on http://localhost:3000${NC}"
else
    echo -e "${RED}  ❌ Frontend failed to start${NC}"
    echo -e "${RED}  📄 Check logs/frontend.log for details${NC}"
fi
echo ""

# Save PIDs for stop script
echo -e "${BLUE}💾 Saving process IDs for stop script...${NC}"
cat > logs/pids.txt << EOF
$BACKEND_PID
$AI_SERVICE_PID
$FRONTEND_PID
EOF
echo -e "${GREEN}✅ PIDs saved to logs/pids.txt${NC}"
echo ""

echo -e "${GREEN}🎉 AI Auto Apply Local Environment Started Successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Services Summary:${NC}"
echo -e "  🌐 Frontend:    ${GREEN}http://localhost:3000${NC} (PID: $FRONTEND_PID)"
echo -e "  🔧 Backend:     ${GREEN}http://localhost:8000${NC} (PID: $BACKEND_PID)"
echo -e "  🤖 AI Service:  ${GREEN}http://localhost:9000${NC} (PID: $AI_SERVICE_PID)"
echo ""
echo -e "${BLUE}📄 Log Files:${NC}"
echo -e "  🌐 Frontend:    logs/frontend.log"
echo -e "  🔧 Backend:     logs/backend.log"
echo -e "  🤖 AI Service:  logs/ai-service.log"
echo ""
echo -e "${BLUE}🛠️  Management Commands:${NC}"
echo -e "  🛑 Stop all services: ${YELLOW}./local_stop.sh${NC}"
echo -e "  🔄 Restart services: ${YELLOW}./local_start.sh${NC}"
echo -e "  📊 View logs: ${YELLOW}tail -f logs/*.log${NC}"
echo ""
echo -e "${GREEN}✅ All systems operational! Happy coding! 🚀${NC}"
