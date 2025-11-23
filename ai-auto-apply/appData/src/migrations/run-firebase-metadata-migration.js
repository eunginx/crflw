const { pool } = require('../db');

async function runFirebaseMetadataMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running Firebase metadata schema migration...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Read and execute the schema file
    const fs = require('fs');
    const path = require('path');
    
    const schemaPath = path.join(__dirname, '007_firebase_metadata_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Creating Firebase metadata tables...');
    await client.query(schemaSQL);
    
    // Read and execute the functions file
    const functionsPath = path.join(__dirname, '008_firebase_metadata_functions.sql');
    const functionsSQL = fs.readFileSync(functionsPath, 'utf8');
    
    console.log('Creating Firebase metadata functions...');
    await client.query(functionsSQL);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✅ Firebase metadata migration completed successfully!');
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
  runFirebaseMetadataMigration()
    .then(() => {
      console.log('🎉 Migration completed. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runFirebaseMetadataMigration };
