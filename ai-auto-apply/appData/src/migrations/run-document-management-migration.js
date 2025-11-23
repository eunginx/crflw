const { pool } = require('../db');

async function runDocumentManagementMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running document management schema migration...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Read and execute the schema file
    const fs = require('fs');
    const path = require('path');
    
    const schemaPath = path.join(__dirname, '009_document_management_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Creating document management tables...');
    await client.query(schemaSQL);
    
    // Read and execute the functions file
    const functionsPath = path.join(__dirname, '010_document_management_functions.sql');
    const functionsSQL = fs.readFileSync(functionsPath, 'utf8');
    
    console.log('Creating document management functions...');
    await client.query(functionsSQL);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✅ Document management migration completed successfully!');
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
  runDocumentManagementMigration()
    .then(() => {
      console.log('🎉 Migration completed. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runDocumentManagementMigration };
