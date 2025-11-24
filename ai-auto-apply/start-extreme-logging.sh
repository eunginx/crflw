#!/bin/bash
# Start all services with extreme logging enabled

echo "🔥 STARTING SERVICES WITH EXTREME LOGGING"
echo "========================================="

# Source extreme logging environment
source ./extreme-logging.env

echo "🔥 Environment Variables:"
echo "   DEBUG=$DEBUG"
echo "   LOG_LEVEL=$LOG_LEVEL"
echo "   VERBOSE_LOGGING=$VERBOSE_LOGGING"

# Stop existing services
echo "🛑 Stopping existing services..."
./local_stop.sh

# Wait for cleanup
sleep 2

# Start services with extreme logging
echo "🚀 Starting backend with extreme logging..."
cd appData && PORT=8000 DEBUG=extreme LOG_LEVEL=debug npm run dev > ../logs/backend-extreme.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

echo "🚀 Starting AI service with extreme logging..."
cd ../ai-service && PORT=9000 DEBUG=extreme LOG_LEVEL=debug npm run dev > ../logs/ai-service-extreme.log 2>&1 &
AI_SERVICE_PID=$!
echo "AI Service PID: $AI_SERVICE_PID"

echo "🚀 Starting frontend with extreme logging..."
cd ../frontend && PORT=3000 REACT_APP_DEBUG=extreme npm start > ../logs/frontend-extreme.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Save PIDs
echo "$BACKEND_PID" > logs/pids-backend-extreme.txt
echo "$AI_SERVICE_PID" > logs/pids-ai-service-extreme.txt  
echo "$FRONTEND_PID" > logs/pids-frontend-extreme.txt

echo "🔥 All services started with extreme logging!"
echo "📊 Log files:"
echo "   Backend: logs/backend-extreme.log"
echo "   AI Service: logs/ai-service-extreme.log"
echo "   Frontend: logs/frontend-extreme.log"

echo "🔥 Monitor logs with:"
echo "   tail -f logs/backend-extreme.log"
echo "   tail -f logs/ai-service-extreme.log"
echo "   tail -f logs/frontend-extreme.log"

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 5

# Check service status
echo "🔍 Checking service health..."
curl -s http://localhost:8000/health > /dev/null && echo "✅ Backend: HEALTHY" || echo "❌ Backend: DOWN"
curl -s http://localhost:9000/health > /dev/null && echo "✅ AI Service: HEALTHY" || echo "❌ AI Service: DOWN"
curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend: HEALTHY" || echo "❌ Frontend: DOWN"

echo "🔥 Extreme logging startup complete!"
