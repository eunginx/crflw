const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

async function runFileStorageMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running file storage enhancement migration...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '004_file_storage_enhancement.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the entire migration as a single script
    console.log('Executing migration script...');
    await client.query(migrationSQL);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✅ File storage enhancement migration completed successfully!');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  runFileStorageMigration()
    .then(() => {
      console.log('🎉 Migration completed. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runFileStorageMigration };
