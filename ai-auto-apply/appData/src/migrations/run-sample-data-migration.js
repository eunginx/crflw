import { pool } from '../db.js';

async function runSampleDataMigration() {
  console.log('🌱 Running sample data migration for test user...');
  
  try {
    // Read the migration file
    const migrationPath = new URL('./013_sample_test_data.sql', import.meta.url);
    const fs = await import('fs');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Sample data migration completed successfully');
    console.log('👤 Test user eunginx@key2vibe.com created with sample data');
    console.log('📊 Sample job applications added');
    console.log('⚙️ Sample settings and preferences configured');
    
  } catch (error) {
    console.error('❌ Error running sample data migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSampleDataMigration()
    .then(() => {
      console.log('🎉 Sample data migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export default runSampleDataMigration;
