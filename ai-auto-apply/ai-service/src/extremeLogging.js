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
