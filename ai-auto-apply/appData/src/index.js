import express from 'express';

// Enable extreme logging
if (process.env.DEBUG === 'extreme') {
  console.log("🔥 EXTREME LOGGING MODE ENABLED");
  console.log("🔥 Environment:", process.env.NODE_ENV);
  console.log("🔥 Debug Level:", process.env.LOG_LEVEL);
  console.log("🔥 Timestamp:", new Date().toISOString());
  console.log("🔥 Process ID:", process.pid);
  console.log("🔥 Memory Usage:", JSON.stringify(process.memoryUsage()));
}import cors from 'cors';
import 'dotenv/config';

// Import only essential routes
import aiApplyRoutes from './routes/aiApplyRoutes.js';
import aiApplyPipelineRoutes from './routes/aiApplyPipelineRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import pdfProcessingRoutes from './routes/pdfProcessingRoutes.js';
import ocrRoutes from './routes/ocrRoutes.js';
import documentManagementRoutes from './routes/documentManagementRoutes.js';
import emailApplicationsRoutes from './routes/applications-email.js';
import emailUserDataRoutes from './routes/email-user-data.js';
import jobStatusesRoutes from './routes/job-statuses.js';
import userRoutes from './routes/userRoutes.js';
import migrationRoutes from './routes/migrationRoutes.js';

const app = express();

// Extreme logging middleware (if enabled)
if (process.env.DEBUG === 'extreme') {
  const extremeLogging = require('./extremeLogging.js');
  app.use(extremeLogging);
}const PORT = process.env.PORT || 8000;

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

app.use('/api/ai-apply-pipeline', aiApplyPipelineRoutes);
console.log('[DEBUG] AI Apply Pipeline routes registered');

app.use('/api/ai', aiRoutes);
console.log('[DEBUG] AI routes registered');

app.use('/api/pdf-processing', pdfProcessingRoutes);
console.log('[DEBUG] PDF Processing routes registered');

app.use('/api/ocr', ocrRoutes);
console.log('[DEBUG] OCR routes registered');

app.use('/api/documents', documentManagementRoutes);
console.log('[DEBUG] Document management routes registered');

app.use('/api/email', emailApplicationsRoutes);
console.log('[DEBUG] Email applications routes registered');

app.use('/api/email', emailUserDataRoutes);
console.log('[DEBUG] Email user data routes registered');

app.use('/api/job-statuses', jobStatusesRoutes);
console.log('[DEBUG] Job statuses routes registered');

app.use('/api/user', userRoutes);
console.log('[DEBUG] Unified user routes registered');

app.use('/api/migration', migrationRoutes);
console.log('[DEBUG] Migration routes registered');

// Start server
app.listen(PORT, () => {
  console.log(`🚀 App Data API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
});

// Direct migration endpoint
app.post('/api/migration/fix-applications-tables', async (req, res) => {
  try {
    console.log('🔧 Running applications table migration via API...');
    
    const fs = await import('fs/promises');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations/015_fix_applications_tables.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    // Execute the migration using the existing query function
    const { query } = await import('./db.js');
    await query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify tables were created
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%email%'
      ORDER BY table_name
    `);
    
    // Test the applications endpoint
    const testApps = await query(`
      SELECT * FROM job_applications_email 
      WHERE email = 'test@example.com'
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      message: 'Applications tables migration completed successfully',
      tablesCreated: tables.rows,
      sampleApplications: testApps.rows
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default app;
