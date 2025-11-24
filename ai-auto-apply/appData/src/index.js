import { JSDOM } from 'jsdom';

// Setup DOM polyfills for pdf-parse BEFORE any other imports
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.DOMMatrix = dom.window.DOMMatrix;
global.ImageData = dom.window.ImageData;
global.Path2D = dom.window.Path2D;

import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import userRoutes from './routes/users.js';
import profileRoutes from './routes/profiles.js';
import settingsRoutes from './routes/settings.js';
import onboardingRoutes from './routes/onboarding.js';
import applicationRoutes from './routes/applications.js';
import preferencesRoutes from './routes/preferences.js';
import resumeRoutes from './routes/resumes.js';

// Email-based routes (new schema)
import settingsEmailRoutes from './routes/settings-email.js';
import applicationsEmailRoutes from './routes/applications-email.js';
import emailUserDataRoutes from './routes/email-user-data.js';
import resumesEmailRoutes from './routes/resumes-email.js';
import resumeProcessingRoutes from './routes/resumeProcessingRoutes.js';
import firebaseMetadataRoutes from './routes/firebaseMetadataRoutes.js';
import documentManagementRoutes from './routes/documentManagementRoutes.js';
import jobStatusRoutes from './routes/job-statuses.js';
import aiApplyRoutes from './routes/aiApplyRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import aiApplyPipelineRoutes from './routes/aiApplyPipelineRoutes.js';
// import pdfRoutes from './routes/pdfRoutes.js';

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',  // Local dev frontend
    'http://localhost:3100',  // Docker frontend
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3100'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'app-data-api'
  });
});

// Add API health endpoint for frontend compatibility
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'app-data-api'
  });
});

// API Routes (original Firebase UID based)
app.use('/api/user', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api', applicationRoutes);
app.use('/api', preferencesRoutes);
app.use('/api', resumeRoutes);

// API Routes (new Email based)
console.log('[DEBUG] Registering email routes...');
console.log('[DEBUG] Registering email-user-data route...');

// Add a simple test route first
app.get('/api/email/test', (req, res) => {
  console.log('[DEBUG] Test route hit');
  res.json({ message: 'Email routes are working' });
});

app.use('/api/email', emailUserDataRoutes);
app.use('/api/email/resumes', resumesEmailRoutes);
app.use('/api/processing', resumeProcessingRoutes);
app.use('/api/firebase', firebaseMetadataRoutes);
app.use('/api/email', applicationsEmailRoutes);
console.log('[DEBUG] All email routes registered');

// Add a simple test route for document management
app.get('/api/documents/test', (req, res) => {
  res.json({ message: 'Document management routes are working!' });
});

app.use('/api/documents', documentManagementRoutes);
console.log('[DEBUG] Document management routes registered');

// Job Statuses API Routes
app.use('/api/job-statuses', jobStatusRoutes);
console.log('[DEBUG] Job status routes registered');

// AI Apply API Routes
app.use('/api/ai-apply', aiApplyRoutes);
console.log('[DEBUG] AI Apply routes registered');

// AI Processing Routes (Ollama integration)
app.use('/api/ai', aiRoutes);
console.log('[DEBUG] AI processing routes registered');

// AI Apply Pipeline Routes
app.use('/api/ai-apply-pipeline', aiApplyPipelineRoutes);
console.log('[DEBUG] AI Apply pipeline routes registered');

// PDF Processing Routes
// app.use('/api/pdf', pdfRoutes);
console.log('[DEBUG] PDF processing routes disabled temporarily');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 App Data API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
});

export default app;
