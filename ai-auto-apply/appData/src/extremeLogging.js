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
