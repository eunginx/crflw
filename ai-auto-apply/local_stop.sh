#!/bin/bash

# Local Environment Stop Script for AI Auto Apply
# This script stops all services for local development

set -e

echo "🛑 Stopping AI Auto Apply Local Environment..."

# Load NVM if available
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  echo "📦 Loading NVM..."
  source "$NVM_DIR/nvm.sh"
  source "$NVM_DIR/bash_completion"
fi

# Function to get Node version of a process
get_process_node_version() {
  local pid="$1"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    local node_cmd=$(ps -p "$pid" -o command= 2>/dev/null | grep -E "node|npm" | head -1)
    if [ -n "$node_cmd" ]; then
      # Try to get the node version from the process
      local node_version=$(ps -p "$pid" -o args= 2>/dev/null | grep -o "v[0-9]*" | head -1)
      echo "${node_version:-"unknown"}"
    else
      echo "not-node"
    fi
  else
    echo "dead"
  fi
}

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
        local node_version=$(get_process_node_version "$pid")
        echo -e "${YELLOW}🛑 Stopping $service_name (PID: $pid, Node: $node_version) on port $port...${NC}"
        
        # Try graceful shutdown first
        kill -TERM $pid 2>/dev/null || true
        
        # Wait for graceful shutdown
        echo -e "${BLUE}⏳ Waiting for graceful shutdown...${NC}"
        local wait_count=0
        local max_wait=10
        
        while [ $wait_count -lt $max_wait ] && kill -0 "$pid" 2>/dev/null; do
            sleep 1
            wait_count=$((wait_count + 1))
            echo -e "${BLUE}  ⏱️  Waiting... ($wait_count/$max_wait)${NC}"
        done
        
        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${RED}💥 Force killing $service_name...${NC}"
            kill -9 $pid 2>/dev/null || true
            sleep 1
        fi
        
        # Verify process is dead
        if ! kill -0 "$pid" 2>/dev/null; then
            echo -e "${GREEN}✅ $service_name stopped successfully${NC}"
        else
            echo -e "${RED}❌ $service_name may still be running${NC}"
        fi
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
                local node_version=$(get_process_node_version "$pid")
                echo -e "${YELLOW}🛑 Stopping process PID: $pid (Node: $node_version)${NC}"
                kill -TERM "$pid" 2>/dev/null || true
            else
                echo -e "${BLUE}ℹ️  Process PID: $pid not running${NC}"
            fi
        done < logs/pids.txt
        
        # Wait for graceful shutdown
        echo -e "${BLUE}⏳ Waiting for graceful shutdown...${NC}"
        local wait_count=0
        local max_wait=10
        
        while [ $wait_count -lt $max_wait ]; do
            local still_running=false
            while read -r pid; do
                if [ ! -z "$pid" ] && kill -0 "$pid" 2>/dev/null; then
                    still_running=true
                    break
                fi
            done < logs/pids.txt
            
            if [ "$still_running" = false ]; then
                break
            fi
            
            sleep 1
            wait_count=$((wait_count + 1))
            echo -e "${BLUE}  ⏱️  Waiting... ($wait_count/$max_wait)${NC}"
        done
        
        # Force kill any remaining processes
        while read -r pid; do
            if [ ! -z "$pid" ] && kill -0 "$pid" 2>/dev/null; then
                local node_version=$(get_process_node_version "$pid")
                echo -e "${RED}💥 Force killing PID: $pid (Node: $node_version)${NC}"
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
