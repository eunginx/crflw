#!/bin/bash

# Local Environment Stop Script for AI Auto Apply
# This script stops all services for local development

set -e

echo "🛑 Stopping AI Auto Apply Local Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Navigate to script directory
cd "$(dirname "$0")"

# Function to kill process on port
kill_port() {
    local port=$1
    local service_name=$2
    local pid=$(lsof -ti:$port 2>/dev/null || true)
    
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}🛑 Stopping $service_name (PID: $pid) on port $port...${NC}"
        kill -TERM $pid 2>/dev/null || true
        
        # Wait for graceful shutdown
        echo -e "${BLUE}⏳ Waiting for graceful shutdown...${NC}"
        sleep 3
        
        # Force kill if still running
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "${RED}💥 Force killing $service_name...${NC}"
            kill -9 $pid 2>/dev/null || true
        fi
        
        echo -e "${GREEN}✅ $service_name stopped${NC}"
    else
        echo -e "${BLUE}ℹ️  No process found on port $port${NC}"
    fi
}

# Function to kill using saved PIDs
kill_saved_pids() {
    if [ -f "logs/pids.txt" ]; then
        echo -e "${BLUE}📋 Stopping services using saved PIDs...${NC}"
        while read -r pid; do
            if [ ! -z "$pid" ] && kill -0 "$pid" 2>/dev/null; then
                echo -e "${YELLOW}🛑 Stopping process PID: $pid${NC}"
                kill -TERM "$pid" 2>/dev/null || true
            fi
        done < logs/pids.txt
        
        # Wait for graceful shutdown
        echo -e "${BLUE}⏳ Waiting for graceful shutdown...${NC}"
        sleep 3
        
        # Force kill any remaining processes
        while read -r pid; do
            if [ ! -z "$pid" ] && kill -0 "$pid" 2>/dev/null; then
                echo -e "${RED}💥 Force killing PID: $pid${NC}"
                kill -9 "$pid" 2>/dev/null || true
            fi
        done < logs/pids.txt
        
        rm -f logs/pids.txt
        echo -e "${GREEN}✅ PID file cleaned up${NC}"
    else
        echo -e "${BLUE}ℹ️  No PID file found, will use port-based termination${NC}"
    fi
}

# Stop services using both methods
echo -e "${BLUE}🔄 Attempting graceful shutdown first...${NC}"
kill_saved_pids
echo ""
echo -e "${BLUE}🔍 Checking for remaining processes on ports...${NC}"
kill_port 3000 "Frontend"
kill_port 8000 "Backend"
kill_port 9000 "AI Service"
echo ""

# Clean up PID files
echo -e "${BLUE}🧹 Cleaning up PID files...${NC}"
rm -f logs/backend.pid logs/ai-service.pid logs/frontend.pid
echo -e "${GREEN}✅ PID files cleaned up${NC}"
echo ""

echo ""
echo -e "${GREEN}🎉 All services stopped successfully!${NC}"
echo ""
echo -e "${BLUE}🛠️  Next Steps:${NC}"
echo -e "  🚀 Start services again: ${YELLOW}./local_start.sh${NC}"
echo -e "  📊 Check logs: ${YELLOW}ls -la logs/${NC}"
echo -e "  🧹 Clean logs: ${YELLOW}rm -rf logs/${NC}"
echo ""
echo -e "${GREEN}✅ Shutdown complete!${NC}"
