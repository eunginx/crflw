#!/bin/bash
# Monitor extreme logging in real-time

echo "🔥 EXTREME LOGGING MONITOR"
echo "========================="

# Create monitoring dashboard
while true; do
  clear
  echo "🔥 EXTREME LOGGING DASHBOARD"
  echo "==========================="
  echo "📊 $(date)"
  echo ""
  
  # Service status
  echo "🚀 SERVICE STATUS:"
  curl -s http://localhost:8000/health > /dev/null 2>&1 && echo "✅ Backend (8000): ONLINE" || echo "❌ Backend (8000): OFFLINE"
  curl -s http://localhost:9000/health > /dev/null 2>&1 && echo "✅ AI Service (9000): ONLINE" || echo "❌ AI Service (9000): OFFLINE"
  curl -s http://localhost:3000 > /dev/null 2>&1 && echo "✅ Frontend (3000): ONLINE" || echo "❌ Frontend (3000): OFFLINE"
  echo ""
  
  # Recent log counts (last 10 lines)
  echo "📈 RECENT ACTIVITY (Last 10 lines):"
  if [ -f logs/backend-extreme.log ]; then
    backend_count=$(tail -10 logs/backend-extreme.log | grep -c "🔥")
    echo "   Backend: $backend_count extreme log entries"
  fi
  
  if [ -f logs/ai-service-extreme.log ]; then
    ai_count=$(tail -10 logs/ai-service-extreme.log | grep -c "🤖")
    echo "   AI Service: $ai_count extreme log entries"
  fi
  
  if [ -f logs/frontend-extreme.log ]; then
    frontend_count=$(tail -10 logs/frontend-extreme.log | grep -c "🔥")
    echo "   Frontend: $frontend_count extreme log entries"
  fi
  echo ""
  
  # Recent errors
  echo "🚨 RECENT ERRORS:"
  if [ -f logs/backend-extreme.log ]; then
    backend_errors=$(tail -20 logs/backend-extreme.log | grep -i "error\|exception\|fail" | tail -3)
    if [ -n "$backend_errors" ]; then
      echo "   Backend:"
      echo "$backend_errors" | sed 's/^/     /'
    fi
  fi
  
  if [ -f logs/ai-service-extreme.log ]; then
    ai_errors=$(tail -20 logs/ai-service-extreme.log | grep -i "error\|exception\|fail" | tail -3)
    if [ -n "$ai_errors" ]; then
      echo "   AI Service:"
      echo "$ai_errors" | sed 's/^/     /'
    fi
  fi
  echo ""
  
  # Performance metrics
  echo "⚡ PERFORMANCE:"
  if [ -f logs/backend-extreme.log ]; then
    avg_response=$(tail -50 logs/backend-extreme.log | grep "PERFORMANCE" | grep -o "duration: [0-9.]*ms" | grep -o "[0-9.]*" | awk '{sum+=$1; count++} END {if(count>0) print sum/count "ms"; else print "N/A"}')
    echo "   Backend Avg Response: $avg_response"
  fi
  
  echo ""
  echo "🔄 Refreshing in 5 seconds... (Ctrl+C to exit)"
  sleep 5
done
