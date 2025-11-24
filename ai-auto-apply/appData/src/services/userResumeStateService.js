import { pool } from '../db.js';

class UserResumeStateService {
  // Get user's persistent resume processing state
  async getUserResumeState(userEmail) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
           urps.*,
           d.mime_type,
           dpr.processing_status,
           CASE 
             WHEN urps.has_parsed_resume = false THEN 'needs_processing'
             WHEN urps.active_resume_id IS NULL THEN 'no_resume'
             WHEN dpr.processed_at IS NULL THEN 'needs_processing'
             WHEN dpr.processed_at < d.uploaded_at THEN 'needs_reprocessing'
             ELSE 'up_to_date'
           END as processing_needed_status
         FROM user_resume_processing_state urps
         LEFT JOIN documents d ON urps.active_resume_id = d.id
         LEFT JOIN document_processing_results dpr ON urps.active_resume_id = dpr.document_id
         WHERE urps.user_email = $1`,
        [userEmail]
      );

      if (result.rows.length === 0) {
        // Create new state if it doesn't exist
        await client.query(
          'INSERT INTO user_resume_processing_state (user_email) VALUES ($1)',
          [userEmail]
        );
        
        // Return the newly created state
        const newStateResult = await client.query(
          `SELECT 
             urps.*,
             d.mime_type,
             dpr.processing_status,
             CASE 
               WHEN urps.has_parsed_resume = false THEN 'needs_processing'
               WHEN urps.active_resume_id IS NULL THEN 'no_resume'
               ELSE 'up_to_date'
             END as processing_needed_status
           FROM user_resume_processing_state urps
           LEFT JOIN documents d ON urps.active_resume_id = d.id
           LEFT JOIN document_processing_results dpr ON urps.active_resume_id = dpr.document_id
           WHERE urps.user_email = $1`,
          [userEmail]
        );
        
        return newStateResult.rows[0];
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error getting user resume state:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Update user's resume processing state from document processing results
  async updateUserResumeState(userEmail, resumeId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Ensure user state exists
      await client.query(
        `INSERT INTO user_resume_processing_state (user_email) 
         VALUES ($1) 
         ON CONFLICT (user_email) DO NOTHING`,
        [userEmail]
      );

      // Update state with latest document processing results
      const result = await client.query(
        `UPDATE user_resume_processing_state urps
         SET 
           active_resume_id = d.id,
           has_parsed_resume = CASE WHEN dpr.processed_at IS NOT NULL THEN true ELSE false END,
           processing_completed_at = dpr.processed_at,
           document_filename = d.stored_filename,
           document_original_filename = d.original_filename,
           document_file_size_bytes = d.file_size_bytes::integer,
           document_uploaded_at = d.uploaded_at,
           pdf_title = dpr.pdf_title,
           pdf_author = dpr.pdf_author,
           pdf_creator = dpr.pdf_creator,
           pdf_producer = dpr.pdf_producer,
           pdf_total_pages = dpr.pdf_total_pages,
           extracted_text = dpr.extracted_text,
           text_length = dpr.text_length,
           word_count = dpr.word_count,
           line_count = dpr.line_count,
           screenshot_path = dpr.screenshot_path,
           processed_at = dpr.processed_at,
           updated_at = CURRENT_TIMESTAMP
         FROM documents d
         LEFT JOIN document_processing_results dpr ON d.id = dpr.document_id
         WHERE urps.user_email = $1 
           AND d.id = $2
           AND d.user_email = $1
           AND d.is_active = true
         RETURNING urps.*`,
        [userEmail, resumeId]
      );

      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Resume not found or does not belong to user');
      }

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating user resume state:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get processing results from persistent state
  async getProcessingResults(userEmail) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
           document_original_filename as original_filename,
           document_filename as filename,
           document_file_size_bytes as file_size,
           document_uploaded_at as upload_date,
           pdf_title,
           pdf_author,
           pdf_creator,
           pdf_producer,
           pdf_total_pages as num_pages,
           extracted_text,
           text_length,
           word_count,
           line_count,
           screenshot_path,
           processed_at,
           processing_completed_at
         FROM user_resume_processing_state 
         WHERE user_email = $1 AND has_parsed_resume = true`,
        [userEmail]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const data = result.rows[0];
      
      // Add processing_status for compatibility
      data.processing_status = data.processed_at ? 'completed' : 'pending';

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error getting processing results:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Check if user needs to process their resume
  async needsProcessing(userEmail) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
           CASE 
             WHEN urps.has_parsed_resume = false THEN 'needs_processing'
             WHEN urps.active_resume_id IS NULL THEN 'no_resume'
             WHEN dpr.processed_at IS NULL THEN 'needs_processing'
             WHEN dpr.processed_at < d.uploaded_at THEN 'needs_reprocessing'
             ELSE 'up_to_date'
           END as processing_needed_status
         FROM user_resume_processing_state urps
         LEFT JOIN documents d ON urps.active_resume_id = d.id
         LEFT JOIN document_processing_results dpr ON urps.active_resume_id = dpr.document_id
         WHERE urps.user_email = $1`,
        [userEmail]
      );

      if (result.rows.length === 0) {
        return { needsProcessing: true, reason: 'no_state' };
      }

      const status = result.rows[0].processing_needed_status;
      return {
        needsProcessing: status !== 'up_to_date',
        reason: status
      };
    } catch (error) {
      console.error('Error checking processing status:', error);
      return { needsProcessing: true, reason: 'error' };
    } finally {
      client.release();
    }
  }

  // Clear user's processing state (when deleting resume, etc.)
  async clearUserResumeState(userEmail) {
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE user_resume_processing_state 
         SET 
           has_parsed_resume = false,
           processing_completed_at = NULL,
           active_resume_id = NULL,
           document_filename = NULL,
           document_original_filename = NULL,
           document_file_size_bytes = NULL,
           document_uploaded_at = NULL,
           pdf_title = NULL,
           pdf_author = NULL,
           pdf_creator = NULL,
           pdf_producer = NULL,
           pdf_total_pages = NULL,
           extracted_text = NULL,
           text_length = NULL,
           word_count = NULL,
           line_count = NULL,
           screenshot_path = NULL,
           processed_at = NULL,
           updated_at = CURRENT_TIMESTAMP
         WHERE user_email = $1`,
        [userEmail]
      );

      return { success: true };
    } catch (error) {
      console.error('Error clearing user resume state:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new UserResumeStateService();
