import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/careerflow'
  });

  try {
    console.log('🚀 Running PDF enhancement migration...');
    
    // Read and execute the migration file
    const migrationPath = path.join(__dirname, '011_pdf_enhancement_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    
    console.log('✅ PDF enhancement migration completed successfully!');
    console.log('📊 Added PDF metadata and preview image support');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
