const db = require('../db');

async function runJobStatusMigration() {
  try {
    console.log('🔄 Running job status types migration...');
    
    // Read and execute the migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '004_job_status_types.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await db.query(migrationSQL);
    console.log('✅ Job status types migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runJobStatusMigration();
