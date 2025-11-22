const db = require('../db');

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Read and execute the migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await db.query(migrationSQL);
    console.log('✅ Database migrations completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigrations();
