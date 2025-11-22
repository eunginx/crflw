const db = require('../db');

async function runAdditionalMigrations() {
  try {
    console.log('🔄 Running additional database migrations...');
    
    // Read and execute the additional migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '002_additional_schemas.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await db.query(migrationSQL);
    console.log('✅ Additional database migrations completed successfully');
    
  } catch (error) {
    console.error('❌ Additional migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runAdditionalMigrations();
