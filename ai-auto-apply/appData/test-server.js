import express from 'express';

const app = express();
const PORT = 8001; // Use different port to test

// Test endpoint
app.get('/test', (req, res) => {
  console.log('🧪 Test endpoint hit');
  res.send('Test OK');
});

// Health endpoint
app.get('/health', (req, res) => {
  console.log('🩺 Health endpoint hit');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'test-api'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🧪 Test server running on port ${PORT}`);
  console.log(`📊 Test: http://localhost:${PORT}/test`);
  console.log(`🩺 Health: http://localhost:${PORT}/health`);
});
