#!/bin/bash
# enable-extreme-logging.sh - Enable comprehensive logging across all services

echo "🔥 ENABLING EXTREME LOGGING MODE"
echo "=================================="

# Set extreme logging environment variables
export DEBUG=extreme
export LOG_LEVEL=debug
export VERBOSE_LOGGING=true
export REQUEST_LOGGING=true
export DATABASE_LOGGING=true
export PERFORMANCE_LOGGING=true

# Create enhanced logging configuration
cat > /Users/kapilh/crflw/ai-auto-apply/extreme-logging.env << 'EOF'
# EXTREME LOGGING CONFIGURATION
DEBUG=extreme
LOG_LEVEL=debug
VERBOSE_LOGGING=true
REQUEST_LOGGING=true
DATABASE_LOGGING=true
PERFORMANCE_LOGGING=true
NODE_ENV=development
TIMESTAMP_LOGS=true
STACK_TRACE_LOGS=true
MEMORY_LOGGING=true
CPU_LOGGING=true
NETWORK_LOGGING=true
EOF

echo "✅ Extreme logging environment created"

# Update backend with extreme logging
echo "📊 Updating backend logging configuration..."

# Add extreme logging middleware to backend
cat >> /Users/kapilh/crflw/ai-auto-apply/appData/src/extremeLogging.js << 'EOF'
// Extreme Logging Middleware
const extremeLogging = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const requestId = Math.random().toString(36).substring(7);
  
  // Request logging
  console.log(`🔥 [${timestamp}] [${requestId}] REQUEST:`, {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length')
  });
  
  // Capture response
  const originalSend = res.send;
  const originalJson = res.json;
  
  res.send = function(data) {
    console.log(`🔥 [${timestamp}] [${requestId}] RESPONSE (SEND):`, {
      statusCode: res.statusCode,
      contentLength: data ? data.length : 0,
      responseType: 'send'
    });
    return originalSend.call(this, data);
  };
  
  res.json = function(data) {
    console.log(`🔥 [${timestamp}] [${requestId}] RESPONSE (JSON):`, {
      statusCode: res.statusCode,
      dataSize: JSON.stringify(data).length,
      responseType: 'json'
    });
    return originalJson.call(this, data);
  };
  
  // Performance timing
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    console.log(`🔥 [${timestamp}] [${requestId}] PERFORMANCE:`, {
      duration: `${duration.toFixed(2)}ms`,
      statusCode: res.statusCode,
      contentLength: res.get('Content-Length'),
      responseTime: duration
    });
  });
  
  next();
};

module.exports = extremeLogging;
EOF

# Update backend index.js to include extreme logging
echo "📝 Adding extreme logging to backend..."

# Create a backup of the original index.js
cp /Users/kapilh/crflw/ai-auto-apply/appData/src/index.js /Users/kapilh/crflw/ai-auto-apply/appData/src/index-backup-extreme.js

# Add extreme logging to the top of index.js (after imports)
sed -i '' '/import express from '\''express'\'';/a\
\
// Enable extreme logging\
if (process.env.DEBUG === '\''extreme'\'') {\
  console.log(\"🔥 EXTREME LOGGING MODE ENABLED\");\
  console.log(\"🔥 Environment:\", process.env.NODE_ENV);\
  console.log(\"🔥 Debug Level:\", process.env.LOG_LEVEL);\
  console.log(\"🔥 Timestamp:\", new Date().toISOString());\
  console.log(\"🔥 Process ID:\", process.pid);\
  console.log(\"🔥 Memory Usage:\", JSON.stringify(process.memoryUsage()));\
}' /Users/kapilh/crflw/ai-auto-apply/appData/src/index.js

# Add extreme logging middleware before other middleware
sed -i '' '/const app = express();/a\
\
// Extreme logging middleware (if enabled)\
if (process.env.DEBUG === '\''extreme'\'') {\
  const extremeLogging = require('\''./extremeLogging.js'\'');\
  app.use(extremeLogging);\
}' /Users/kapilh/crflw/ai-auto-apply/appData/src/index.js

# Update frontend with extreme logging
echo "🌐 Updating frontend logging configuration..."

# Add extreme logging to React app
cat > /Users/kapilh/crflw/ai-auto-apply/frontend/src/utils/extremeLogging.ts << 'EOF'
// Extreme Logging Utility for Frontend
export class ExtremeLogger {
  private static instance: ExtremeLogger;
  private isEnabled: boolean = false;

  static getInstance(): ExtremeLogger {
    if (!ExtremeLogger.instance) {
      ExtremeLogger.instance = new ExtremeLogger();
    }
    return ExtremeLogger.instance;
  }

  enable() {
    this.isEnabled = true;
    console.log('🔥 FRONTEND EXTREME LOGGING ENABLED');
    console.log('🔥 Timestamp:', new Date().toISOString());
    console.log('🔥 User Agent:', navigator.userAgent);
    console.log('🔥 URL:', window.location.href);
    console.log('🔥 Screen:', `${screen.width}x${screen.height}`);
    console.log('🔥 Viewport:', `${window.innerWidth}x${window.innerHeight}`);
  }

  disable() {
    this.isEnabled = false;
    console.log('🔥 FRONTEND EXTREME LOGGING DISABLED');
  }

  logAPIRequest(method: string, url: string, data?: any, headers?: any) {
    if (!this.isEnabled) return;
    
    console.log('🔥 API REQUEST:', {
      timestamp: new Date().toISOString(),
      method,
      url,
      data,
      headers,
      requestId: Math.random().toString(36).substring(7)
    });
  }

  logAPIResponse(status: number, data?: any, duration?: number) {
    if (!this.isEnabled) return;
    
    console.log('🔥 API RESPONSE:', {
      timestamp: new Date().toISOString(),
      status,
      dataSize: data ? JSON.stringify(data).length : 0,
      duration: duration ? `${duration}ms` : undefined,
      requestId: Math.random().toString(36).substring(7)
    });
  }

  logComponentRender(componentName: string, props?: any) {
    if (!this.isEnabled) return;
    
    console.log('🔥 COMPONENT RENDER:', {
      timestamp: new Date().toISOString(),
      component: componentName,
      props,
      memory: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB'
      } : 'N/A'
    });
  }

  logStateChange(component: string, state: any) {
    if (!this.isEnabled) return;
    
    console.log('🔥 STATE CHANGE:', {
      timestamp: new Date().toISOString(),
      component,
      stateSize: JSON.stringify(state).length,
      stateKeys: Object.keys(state)
    });
  }

  logError(error: Error, context?: any) {
    if (!this.isEnabled) return;
    
    console.error('🔥 ERROR:', {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
      name: error.name
    });
  }

  logPerformance(metricName: string, value: number, unit: string = 'ms') {
    if (!this.isEnabled) return;
    
    console.log('🔥 PERFORMANCE:', {
      timestamp: new Date().toISOString(),
      metric: metricName,
      value,
      unit
    });
  }
}

export const extremeLogger = ExtremeLogger.getInstance();
EOF

# Update AI service with extreme logging
echo "🤖 Updating AI service logging configuration..."

# Add extreme logging to AI service
cat > /Users/kapilh/crflw/ai-auto-apply/ai-service/src/extremeLogging.js << 'EOF'
// Extreme Logging for AI Service
const extremeLogging = (req, res, next) => {
  if (process.env.DEBUG !== 'extreme') return next();
  
  const timestamp = new Date().toISOString();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`🤖 [${timestamp}] [${requestId}] AI REQUEST:`, {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;
    
    console.log(`🤖 [${timestamp}] [${requestId}] AI RESPONSE:`, {
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      contentLength: res.get('Content-Length')
    });
  });
  
  next();
};

module.exports = extremeLogging;
EOF

# Create extreme logging startup script
cat > /Users/kapilh/crflw/ai-auto-apply/start-extreme-logging.sh << 'EOF'
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
EOF

chmod +x /Users/kapilh/crflw/ai-auto-apply/start-extreme-logging.sh

# Create extreme logging monitoring script
cat > /Users/kapilh/crflw/ai-auto-apply/monitor-extreme-logging.sh << 'EOF'
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
EOF

chmod +x /Users/kapilh/crflw/ai-auto-apply/monitor-extreme-logging.sh

echo "✅ Extreme logging configuration completed!"
echo ""
echo "🔥 To enable extreme logging:"
echo "   ./start-extreme-logging.sh"
echo ""
echo "📊 To monitor extreme logging:"
echo "   ./monitor-extreme-logging.sh"
echo ""
echo "📁 Log files location:"
echo "   logs/backend-extreme.log"
echo "   logs/ai-service-extreme.log"
echo "   logs/frontend-extreme.log"
