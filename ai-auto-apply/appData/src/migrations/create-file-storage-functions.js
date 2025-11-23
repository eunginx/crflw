const { pool } = require('../db');

async function createFileStorageFunctions() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Creating file storage functions...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Create function to store file in database
    const storeFunctionSQL = `
      CREATE OR REPLACE FUNCTION store_resume_file(
          p_email VARCHAR(255),
          p_filename VARCHAR(255),
          p_original_filename VARCHAR(255),
          p_file_data BYTEA,
          p_file_size INTEGER,
          p_file_type VARCHAR(50),
          p_is_active BOOLEAN DEFAULT TRUE
      ) RETURNS UUID AS $$
      DECLARE
          file_id UUID;
      BEGIN
          -- Deactivate existing active resume for this user
          UPDATE resume_files_email 
          SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP 
          WHERE email = p_email AND is_active = TRUE;
          
          -- Insert new resume file
          INSERT INTO resume_files_email (
              email, 
              filename, 
              original_filename, 
              file_data, 
              file_size, 
              file_type, 
              is_active, 
              storage_type,
              upload_date,
              last_used,
              created_at,
              updated_at
          ) VALUES (
              p_email,
              p_filename,
              p_original_filename,
              p_file_data,
              p_file_size,
              p_file_type,
              p_is_active,
              'database',
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP
          ) RETURNING id INTO file_id;
          
          RETURN file_id;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client.query(storeFunctionSQL);
    
    // Create function to retrieve file data
    const retrieveFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_resume_file_data(p_file_id UUID)
      RETURNS TABLE (
          filename VARCHAR(255),
          original_filename VARCHAR(255),
          file_data BYTEA,
          file_size INTEGER,
          file_type VARCHAR(50),
          upload_date TIMESTAMP WITH TIME ZONE
      ) AS $$
      BEGIN
          RETURN QUERY
          SELECT 
              rf.filename,
              rf.original_filename,
              rf.file_data,
              rf.file_size,
              rf.file_type,
              rf.upload_date
          FROM resume_files_email rf
          WHERE rf.id = p_file_id AND rf.storage_type = 'database';
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client.query(retrieveFunctionSQL);
    
    // Create function to get active resume for user
    const activeFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_active_resume_file(p_email VARCHAR(255))
      RETURNS TABLE (
          id UUID,
          filename VARCHAR(255),
          original_filename VARCHAR(255),
          file_data BYTEA,
          file_size INTEGER,
          file_type VARCHAR(50),
          upload_date TIMESTAMP WITH TIME ZONE
      ) AS $$
      BEGIN
          RETURN QUERY
          SELECT 
              rf.id,
              rf.filename,
              rf.original_filename,
              rf.file_data,
              rf.file_size,
              rf.file_type,
              rf.upload_date
          FROM resume_files_email rf
          WHERE rf.email = p_email 
          AND rf.is_active = TRUE 
          AND rf.storage_type = 'database'
          ORDER BY rf.upload_date DESC
          LIMIT 1;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client.query(activeFunctionSQL);
    
    // Create function to list all resumes for user
    const listFunctionSQL = `
      CREATE OR REPLACE FUNCTION list_user_resumes(p_email VARCHAR(255))
      RETURNS TABLE (
          id UUID,
          filename VARCHAR(255),
          original_filename VARCHAR(255),
          file_size INTEGER,
          file_type VARCHAR(50),
          is_active BOOLEAN,
          upload_date TIMESTAMP WITH TIME ZONE,
          storage_type VARCHAR(20)
      ) AS $$
      BEGIN
          RETURN QUERY
          SELECT 
              rf.id,
              rf.filename,
              rf.original_filename,
              rf.file_size,
              rf.file_type,
              rf.is_active,
              rf.upload_date,
              rf.storage_type
          FROM resume_files_email rf
          WHERE rf.email = p_email
          ORDER BY rf.upload_date DESC;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client.query(listFunctionSQL);
    
    // Create function to set active resume
    const setActiveFunctionSQL = `
      CREATE OR REPLACE FUNCTION set_active_resume(p_email VARCHAR(255), p_file_id UUID)
      RETURNS BOOLEAN AS $$
      DECLARE
          resume_exists BOOLEAN;
      BEGIN
          -- Check if resume exists and belongs to user
          SELECT EXISTS(
              SELECT 1 FROM resume_files_email 
              WHERE id = p_file_id AND email = p_email
          ) INTO resume_exists;
          
          IF NOT resume_exists THEN
              RETURN FALSE;
          END IF;
          
          -- Deactivate all other resumes
          UPDATE resume_files_email 
          SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP 
          WHERE email = p_email AND id != p_file_id;
          
          -- Activate selected resume
          UPDATE resume_files_email 
          SET is_active = TRUE, last_used = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
          WHERE id = p_file_id;
          
          RETURN TRUE;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client.query(setActiveFunctionSQL);
    
    // Create function to delete resume
    const deleteFunctionSQL = `
      CREATE OR REPLACE FUNCTION delete_resume_file(p_email VARCHAR(255), p_file_id UUID)
      RETURNS BOOLEAN AS $$
      DECLARE
          resume_exists BOOLEAN;
          was_active BOOLEAN;
      BEGIN
          -- Check if resume exists and belongs to user
          SELECT EXISTS(
              SELECT 1 FROM resume_files_email 
              WHERE id = p_file_id AND email = p_email
          ) INTO resume_exists;
          
          IF NOT resume_exists THEN
              RETURN FALSE;
          END IF;
          
          -- Check if resume was active
          SELECT is_active INTO was_active FROM resume_files_email WHERE id = p_file_id;
          
          -- Delete the resume
          DELETE FROM resume_files_email WHERE id = p_file_id;
          
          -- If it was active, set the most recent resume as active
          IF was_active THEN
              UPDATE resume_files_email 
              SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP 
              WHERE id = (
                  SELECT id FROM resume_files_email 
                  WHERE email = p_email 
                  ORDER BY upload_date DESC 
                  LIMIT 1
              );
          END IF;
          
          RETURN TRUE;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client.query(deleteFunctionSQL);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✅ File storage functions created successfully!');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('❌ Function creation failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  createFileStorageFunctions()
    .then(() => {
      console.log('🎉 Function creation completed. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Function creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createFileStorageFunctions };
