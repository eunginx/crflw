const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

async function runEmailSchemaMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running email-based schema migration...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '003_email_based_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the entire migration as a single script
    console.log('Executing migration script...');
    await client.query(migrationSQL);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✅ Email-based schema migration completed successfully!');
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
  runEmailSchemaMigration()
    .then(() => {
      console.log('🎉 Migration completed. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runEmailSchemaMigration };
