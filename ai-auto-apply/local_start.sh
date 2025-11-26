#!/bin/bash

# Local Environment Startup Script for AI Auto Apply
# This script starts all services for local development

set -e

echo "🚀 Starting AI Auto Apply Local Environment..."

# Load NVM if available
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  echo "📦 Loading NVM..."
  source "$NVM_DIR/nvm.sh"
  source "$NVM_DIR/bash_completion"
fi

# Ensure correct Node version
REQUIRED_NODE_MAJOR=20
NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')

if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]; then
  echo "❌ Node $REQUIRED_NODE_MAJOR+ is required. You are running Node $(node -v)."
  echo "🔄 Auto-switching to Node 20..."
  nvm install 20
  nvm use 20
  NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
  if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]; then
    echo "❌ Failed to switch to Node 20. Please manually run: nvm install 20 && nvm use 20"
    exit 1
  fi
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

# Function to stream frontend logs in real-time
stream_frontend_logs() {
    local log_file="logs/frontend.log"
    local timeout=${1:-60}
    local elapsed=0
    
    echo -e "${BLUE}🌐 Streaming frontend logs in real-time...${NC}"
    echo -e "${YELLOW}  📝 Watching: $log_file${NC}"
    echo ""
    
    # Wait for log file to exist
    while [ ! -f "$log_file" ] && [ $elapsed -lt $timeout ]; do
        echo -e "${YELLOW}  ⏳ Waiting for log file to appear... ($elapsed/$timeout)${NC}"
        sleep 2
        elapsed=$((elapsed + 2))
    done
    
    if [ ! -f "$log_file" ]; then
        echo -e "${RED}  ❌ Log file never appeared${NC}"
        return 1
    fi
    
    # Stream logs until compilation completes or timeout
    echo -e "${BLUE}  📄 Live frontend compilation logs:${NC}"
    echo ""
    
    # Use tail -f to follow the log file
    tail -f "$log_file" &
    local tail_pid=$!
    
    # Monitor for completion
    local compilation_complete=false
    local compilation_failed=false
    
    while [ $elapsed -lt $timeout ] && [ "$compilation_complete" = false ] && [ "$compilation_failed" = false ]; do
        if grep -q "Compiled successfully!" "$log_file" && grep -q "webpack compiled successfully" "$log_file"; then
            compilation_complete=true
            echo -e "\n${GREEN}  ✅ Frontend compilation completed!${NC}"
        elif grep -q "Failed to compile" "$log_file"; then
            compilation_failed=true
            echo -e "\n${RED}  ❌ Frontend compilation failed!${NC}"
        fi
        
        sleep 2
        elapsed=$((elapsed + 2))
    done
    
    # Stop tailing
    kill $tail_pid 2>/dev/null || true
    
    if [ "$compilation_complete" = true ]; then
        echo -e "${GREEN}  🎉 Frontend ready for use!${NC}"
        return 0
    elif [ "$compilation_failed" = true ]; then
        echo -e "${RED}  💥 Frontend compilation failed${NC}"
        return 1
    else
        echo -e "${YELLOW}  ⏰ Frontend compilation timeout after ${timeout}s${NC}"
        return 1
    fi
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
    cd frontend && nvm use 20 > /dev/null 2>&1 && npm install && cd ..
    echo -e "${GREEN}  ✅ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}  ✅ Frontend dependencies already installed${NC}"
fi

echo -e "${BLUE}  🔍 Checking AI service dependencies...${NC}"
if [ ! -d "ai-service/node_modules" ]; then
    echo -e "${YELLOW}  📥 Installing AI service dependencies...${NC}"
    cd ai-service && nvm use 20 > /dev/null 2>&1 && npm install && cd ..
    echo -e "${GREEN}  ✅ AI service dependencies installed${NC}"
else
    echo -e "${GREEN}  ✅ AI service dependencies already installed${NC}"
fi

echo -e "${BLUE}  🔍 Checking appData dependencies...${NC}"
if [ ! -d "appData/node_modules" ]; then
    echo -e "${YELLOW}  📥 Installing appData dependencies...${NC}"
    cd appData && nvm use 20 > /dev/null 2>&1 && npm install && cd ..
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
# Ensure Node 20 is used for this service
nvm use 20 > /dev/null 2>&1
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
# Ensure Node 20 is used for this service
nvm use 20 > /dev/null 2>&1
PORT=9000 npm run dev > ../logs/ai-service.log 2>&1 &
AI_SERVICE_PID=$!
cd ..
echo $AI_SERVICE_PID > logs/ai-service.pid
echo -e "${GREEN}  ✅ AI Service started with PID: $AI_SERVICE_PID${NC}"
echo ""

# Start Frontend on port 3000
echo -e "${BLUE}🌐 Starting Frontend on port 3000...${NC}"
cd frontend
echo -e "${YELLOW}  📝 Command: PORT=3000 npm run start:fast${NC}"
echo -e "${YELLOW}  📄 Log file: ../logs/frontend.log${NC}"
# Ensure Node 20 is used for this service
nvm use 20 > /dev/null 2>&1
PORT=3000 npm run start:fast > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo $FRONTEND_PID > logs/frontend.pid
echo -e "${GREEN}  ✅ Frontend started with PID: $FRONTEND_PID${NC}"
echo ""

# Wait for services to be ready
echo -e "${BLUE}⏳ Waiting for services to initialize...${NC}"
echo -e "${YELLOW}  💤 Giving backend and AI service 5 seconds to start up...${NC}"
sleep 5

# Stream frontend compilation logs in real-time
echo ""
stream_frontend_logs 60
FRONTEND_COMPILE_STATUS=$?

echo ""

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
    
    if [ $FRONTEND_COMPILE_STATUS -eq 0 ]; then
        # Wait for frontend to be ready (check if it serves HTML)
        FRONTEND_HTTP_READY=false
        HTTP_ATTEMPTS=0
        MAX_HTTP_ATTEMPTS=5
        
        while [ $HTTP_ATTEMPTS -lt $MAX_HTTP_ATTEMPTS ]; do
            if curl -s --max-time 3 "http://localhost:3000" | grep -q "<!DOCTYPE html>"; then
                echo -e "${GREEN}  ✅ Frontend is ready and serving content${NC}"
                FRONTEND_HTTP_READY=true
                break
            else
                echo -e "${YELLOW}  ⏳ Waiting for frontend HTTP response... ($((HTTP_ATTEMPTS + 1))/$MAX_HTTP_ATTEMPTS)${NC}"
                sleep 2
                HTTP_ATTEMPTS=$((HTTP_ATTEMPTS + 1))
            fi
        done
        
        if [ "$FRONTEND_HTTP_READY" = false ]; then
            echo -e "${YELLOW}  ⚠️  Frontend compiled but not serving HTML yet${NC}"
            echo -e "${YELLOW}  🔗 Try accessing: http://localhost:3000${NC}"
        fi
    else
        echo -e "${YELLOW}  ⚠️  Frontend running but compilation may have issues${NC}"
        echo -e "${YELLOW}  📄 Check logs/frontend.log for details${NC}"
    fi
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
