import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🔧 Running applications table migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'fix_applications_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
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
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
