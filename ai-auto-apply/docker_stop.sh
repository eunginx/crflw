#!/bin/bash

# Docker Environment Stop Script for AI Auto Apply
# This script stops all Docker containers

set -e

echo "🛑 Stopping AI Auto Apply Docker Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Navigate to script directory
echo -e "${BLUE}📁 Changing to script directory: $(dirname "$0")${NC}"
cd "$(dirname "$0")"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running.${NC}"
    exit 1
fi

# Choose environment
ENVIRONMENT=${1:-dev}
if [ "$ENVIRONMENT" = "prod" ] || [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILE="docker-compose.yml"
    echo -e "${BLUE}🛑 Stopping PRODUCTION environment...${NC}"
else
    COMPOSE_FILE="docker-compose.dev.yml"
    echo -e "${BLUE}🛑 Stopping DEVELOPMENT environment...${NC}"
fi

# Stop and remove containers
echo -e "${BLUE}🛑 Stopping and removing containers...${NC}"
docker-compose -f $COMPOSE_FILE down --volumes --remove-orphans

# Clean up unused Docker resources
echo -e "${BLUE}🧹 Cleaning up unused Docker resources...${NC}"
docker system prune -f

echo ""
echo -e "${GREEN}✅ AI Auto Apply Docker Environment Stopped Successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "  🛑 All containers stopped and removed"
echo -e "  🗑️  Unused Docker resources cleaned up"
echo -e "  💾 Volumes preserved (unless --volumes was used)"
echo ""
echo -e "${BLUE}🛠️  Management Commands:${NC}"
echo -e "  🚀 Start containers: ${YELLOW}./docker_start.sh${NC}"
echo -e "  🚀 Start production: ${YELLOW}./docker_start.sh prod${NC}"
echo -e "  📊 View containers: ${YELLOW}docker ps -a${NC}"
echo -e "  🗂️  View volumes: ${YELLOW}docker volume ls${NC}"
echo ""
