#!/bin/bash

# Test script to demonstrate frontend log streaming
echo "🧪 Testing frontend log streaming..."

# Navigate to project directory
cd "$(dirname "$0")"

# Load NVM
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  source "$NVM_DIR/nvm.sh"
fi

# Ensure Node 20
nvm use 20 > /dev/null 2>&1

# Clean up existing frontend process
echo "🧹 Cleaning up existing frontend process..."
kill_port 3000 2>/dev/null || true

# Start frontend in background
echo "🌐 Starting frontend..."
cd frontend
nvm use 20 > /dev/null 2>&1
PORT=3000 npm run start:fast > ../logs/frontend-test.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "📝 Frontend PID: $FRONTEND_PID"
echo "📄 Log file: logs/frontend-test.log"

# Stream logs for 30 seconds
echo ""
echo "🌐 Streaming frontend logs for 30 seconds..."
echo ""

# Use tail -f to follow the log file
tail -f logs/frontend-test.log &
TAIL_PID=$!

# Wait for 30 seconds or until compilation completes
sleep 30

# Stop tailing
kill $TAIL_PID 2>/dev/null || true

# Check if frontend is running
if curl -s --max-time 3 http://localhost:3000 | grep -q "<!DOCTYPE html>"; then
    echo "✅ Frontend is ready!"
else
    echo "❌ Frontend not ready yet"
fi

# Clean up
kill $FRONTEND_PID 2>/dev/null || true

echo "🧹 Test completed"
