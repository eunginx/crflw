import { pool } from '../db.js';

// Store Firebase file metadata
async function storeFirebaseFileMetadata(req, res) {
  const { 
    userId, 
    userEmail, 
    originalFilename, 
    storageFilename, 
    firebaseStoragePath, 
    firebaseDownloadUrl, 
    fileSizeBytes, 
    fileType, 
    mimeType,
    isResume = false,
    firebaseFileId = null
  } = req.body;
  
  try {
    const result = await pool.query(
      'SELECT store_firebase_file_metadata($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) as metadata_id',
      [
        userId,
        userEmail,
        originalFilename,
        storageFilename,
        firebaseStoragePath,
        firebaseDownloadUrl,
        fileSizeBytes,
        fileType,
        mimeType,
        isResume,
        firebaseFileId
      ]
    );
    
    const metadataId = result.rows[0].metadata_id;
    
    res.json({
      success: true,
      metadataId,
      message: 'Firebase file metadata stored successfully'
    });
    
  } catch (error) {
    console.error('Error storing Firebase file metadata:', error);
    res.status(500).json({
      error: 'Failed to store Firebase file metadata',
      details: error.message
    });
  }
}

// Store processed Firebase resume data
async function storeFirebaseProcessedResume(req, res) {
  const { 
    metadataId, 
    extractedText, 
    extractedInfo, 
    stats, 
    processingTime 
  } = req.body;
  
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Store main processed resume data
      const processedResult = await client.query(
        'SELECT store_firebase_processed_resume($1, $2, $3, $4, $5, $6, $7) as processed_id',
        [
          metadataId,
          extractedText,
          extractedInfo?.name || null,
          extractedInfo?.email || null,
          extractedInfo?.phone || null,
          processingTime || null,
          null // extraction confidence - can be calculated later
        ]
      );
      
      const processedId = processedResult.rows[0].processed_id;
      
      // Store skills if provided
      if (extractedInfo?.skills && extractedInfo.skills.length > 0) {
        const skillsArray = extractedInfo.skills.map(skill => ({
          name: skill,
          category: 'technical', // Default category
          confidence: 0.8, // Default confidence
          context: null
        }));
        
        await client.query(
          'SELECT store_firebase_resume_skills($1, $2)',
          [processedId, JSON.stringify(skillsArray)]
        );
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        processedId,
        message: 'Firebase resume data stored successfully'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error storing Firebase processed resume:', error);
    res.status(500).json({
      error: 'Failed to store Firebase processed resume',
      details: error.message
    });
  }
}

// Get user's Firebase files
async function getUserFirebaseFiles(req, res) {
  const { userId } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM get_user_firebase_files($1)',
      [userId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error getting user Firebase files:', error);
    res.status(500).json({
      error: 'Failed to get user Firebase files',
      details: error.message
    });
  }
}

// Get active Firebase resume for a user
async function getActiveFirebaseResume(req, res) {
  const { userId } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM get_active_firebase_resume($1)',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No active Firebase resume found for this user'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error getting active Firebase resume:', error);
    res.status(500).json({
      error: 'Failed to get active Firebase resume',
      details: error.message
    });
  }
}

// Set active Firebase resume for a user
async function setActiveFirebaseResume(req, res) {
  const { userId } = req.params;
  const { metadataId } = req.body;
  
  try {
    const result = await pool.query(
      'SELECT set_active_firebase_resume($1, $2) as success',
      [userId, metadataId]
    );
    
    const success = result.rows[0].success;
    
    if (!success) {
      return res.status(404).json({
        error: 'Failed to set active resume - metadata not found or not owned by user'
      });
    }
    
    res.json({
      success: true,
      message: 'Active Firebase resume set successfully'
    });
    
  } catch (error) {
    console.error('Error setting active Firebase resume:', error);
    res.status(500).json({
      error: 'Failed to set active Firebase resume',
      details: error.message
    });
  }
}

// Get processed Firebase resume data
async function getProcessedFirebaseResume(req, res) {
  const { metadataId } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM get_processed_firebase_resume($1)',
      [metadataId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No processed data found for this Firebase resume'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error getting processed Firebase resume:', error);
    res.status(500).json({
      error: 'Failed to get processed Firebase resume',
      details: error.message
    });
  }
}

// Soft delete Firebase file metadata
async function softDeleteFirebaseFile(req, res) {
  const { metadataId } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT soft_delete_firebase_file($1) as success',
      [metadataId]
    );
    
    const success = result.rows[0].success;
    
    if (!success) {
      return res.status(404).json({
        error: 'Firebase file metadata not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Firebase file metadata deleted successfully'
    });
    
  } catch (error) {
    console.error('Error soft deleting Firebase file:', error);
    res.status(500).json({
      error: 'Failed to soft delete Firebase file',
      details: error.message
    });
  }
}

// Get Firebase processing statistics
async function getFirebaseProcessingStatistics(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM get_firebase_processing_statistics()'
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error getting Firebase processing statistics:', error);
    res.status(500).json({
      error: 'Failed to get Firebase processing statistics',
      details: error.message
    });
  }
}

// Get Firebase resume summary
async function getFirebaseResumeSummary(req, res) {
  try {
    const result = await pool.query(`
      SELECT * FROM firebase_resume_summary 
      ORDER BY uploaded_at DESC 
      LIMIT 50
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error getting Firebase resume summary:', error);
    res.status(500).json({
      error: 'Failed to get Firebase resume summary',
      details: error.message
    });
  }
}

export {
  storeFirebaseFileMetadata,
  storeFirebaseProcessedResume,
  getUserFirebaseFiles,
  getActiveFirebaseResume,
  setActiveFirebaseResume,
  getProcessedFirebaseResume,
  softDeleteFirebaseFile,
  getFirebaseProcessingStatistics,
  getFirebaseResumeSummary
};
