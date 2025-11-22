const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

async function createResumeFilesEmailTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Creating resume_files_email table...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Create the table
    const createTableSQL = `
      CREATE TABLE resume_files_email (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) NOT NULL,
          filename VARCHAR(255) NOT NULL,
          original_filename VARCHAR(255) NOT NULL,
          file_path TEXT,
          file_data BYTEA,
          file_size INTEGER,
          file_type VARCHAR(50),
          is_active BOOLEAN DEFAULT TRUE,
          upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_used TIMESTAMP WITH TIME ZONE,
          parsed_content JSONB,
          storage_type VARCHAR(20) DEFAULT 'database' CHECK (storage_type IN ('database', 'filesystem')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (email) REFERENCES users_email(email) ON DELETE CASCADE
      );
      
      CREATE INDEX idx_resume_files_email_active ON resume_files_email(email, is_active);
      CREATE INDEX idx_resume_files_email_storage_type ON resume_files_email(email, storage_type);
      
      -- Add constraint to ensure either file_path or file_data is present
      ALTER TABLE resume_files_email 
      ADD CONSTRAINT check_file_storage 
      CHECK (
          (storage_type = 'database' AND file_data IS NOT NULL) OR 
          (storage_type = 'filesystem' AND file_path IS NOT NULL)
      );
      
      -- Create trigger for updated_at
      CREATE TRIGGER update_resume_files_email_updated_at BEFORE UPDATE ON resume_files_email FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    `;
    
    await client.query(createTableSQL);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✅ resume_files_email table created successfully!');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('❌ Table creation failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  createResumeFilesEmailTable()
    .then(() => {
      console.log('🎉 Table creation completed. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Table creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createResumeFilesEmailTable };
