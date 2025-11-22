const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/users');
const profileRoutes = require('./routes/profiles');
const settingsRoutes = require('./routes/settings');
const onboardingRoutes = require('./routes/onboarding');
const applicationRoutes = require('./routes/applications');
const preferencesRoutes = require('./routes/preferences');
const resumeRoutes = require('./routes/resumes');

// Email-based routes (new schema)
const settingsEmailRoutes = require('./routes/settings-email');
const applicationsEmailRoutes = require('./routes/applications-email');
const emailUserDataRoutes = require('./routes/email-user-data');

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
app.use('/api/email', settingsEmailRoutes);
app.use('/api/email', applicationsEmailRoutes);
console.log('[DEBUG] All email routes registered');

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

module.exports = app;
