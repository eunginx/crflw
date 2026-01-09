import express from 'express';
import { query } from '../db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Run applications table migration
router.post('/fix-applications-tables', async (req, res) => {
  try {
    console.log('🔧 Running applications table migration via API...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../migrations/015_fix_applications_tables.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    // Execute the migration
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
    
    console.log('📋 Email-based tables created:');
    tables.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Test the applications endpoint
    const testApps = await query(`
      SELECT * FROM job_applications_email 
      WHERE email = 'test@example.com'
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 Sample applications: ${testApps.rows.length} found`);
    testApps.rows.forEach(app => {
      console.log(`  - ${app.title} at ${app.company} (${app.status})`);
    });
    
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

export default router;
