const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/careerflow'
  });

  try {
    console.log('🚀 Running resume files schema migration...');
    
    // Read and execute the migration file
    const migrationPath = path.join(__dirname, '012_resume_files_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    
    console.log('✅ Resume files schema migration completed successfully!');
    console.log('📊 Added resume_files table with PDF processing support');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
