import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// Import only essential routes
import aiApplyRoutes from './routes/aiApplyRoutes.js';
import documentManagementRoutes from './routes/documentManagementRoutes.js';
import emailApplicationsRoutes from './routes/applications-email.js';
import emailUserDataRoutes from './routes/email-user-data.js';
import jobStatusesRoutes from './routes/job-statuses.js';

const app = express();
const PORT = process.env.PORT || 8000;

// Basic middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
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

// Essential API Routes
app.use('/api/ai-apply', aiApplyRoutes);
console.log('[DEBUG] AI Apply routes registered');

app.use('/api/documents', documentManagementRoutes);
console.log('[DEBUG] Document management routes registered');

app.use('/api/email', emailApplicationsRoutes);
console.log('[DEBUG] Email applications routes registered');

app.use('/api/email', emailUserDataRoutes);
console.log('[DEBUG] Email user data routes registered');

app.use('/api/job-statuses', jobStatusesRoutes);
console.log('[DEBUG] Job statuses routes registered');

// Start server
app.listen(PORT, () => {
  console.log(`🚀 App Data API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
});

export default app;
