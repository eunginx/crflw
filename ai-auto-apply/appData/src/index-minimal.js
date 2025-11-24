import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 8000;

// Basic middleware
app.use(cors());
app.use(express.json());

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
    service: 'app-data-api'
  });
});

// API health endpoint
app.get('/api/health', (req, res) => {
  console.log('🩺 API Health endpoint hit');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'app-data-api'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 App Data API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
});

export default app;
