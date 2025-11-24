import { pool } from '../db.js';

// Store processed resume data
async function storeProcessedResume(req, res) {
  const { resumeId, extractedText, extractedInfo, stats, processingTime } = req.body;
  
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Store main processed resume data
      const processedResult = await client.query(
        'SELECT store_processed_resume($1, $2, $3, $4, $5, $6, $7, $8, $9) as processed_id',
        [
          resumeId,
          extractedText,
          extractedInfo.name || null,
          extractedInfo.email || null,
          extractedInfo.phone || null,
          'completed',
          null,
          processingTime || null,
          null // extraction confidence - can be calculated later
        ]
      );
      
      const processedId = processedResult.rows[0].processed_id;
      
      // Store skills
      if (extractedInfo.skills && extractedInfo.skills.length > 0) {
        const skillsArray = extractedInfo.skills.map(skill => ({
          name: skill,
          category: 'technical', // Default category
          confidence: 0.8, // Default confidence
          context: null
        }));
        
        await client.query(
          'SELECT store_resume_skills($1, $2)',
          [processedId, JSON.stringify(skillsArray)]
        );
      }
      
      // Store experience (basic implementation)
      if (extractedInfo.experience && extractedInfo.experience.length > 0) {
        const experienceArray = extractedInfo.experience.map(exp => ({
          company: 'Unknown', // Would need more sophisticated parsing
          job_title: 'Unknown',
          start_date: null,
          end_date: null,
          is_current: false,
          description: exp,
          location: null
        }));
        
        await client.query(
          'SELECT store_resume_experience($1, $2)',
          [processedId, JSON.stringify(experienceArray)]
        );
      }
      
      // Store education (basic implementation)
      if (extractedInfo.education && extractedInfo.education.length > 0) {
        const educationArray = extractedInfo.education.map(edu => ({
          institution: 'Unknown', // Would need more sophisticated parsing
          degree: 'Unknown',
          field_of_study: null,
          start_date: null,
          end_date: null,
          gpa: null,
          description: edu,
          location: null,
          is_current: false
        }));
        
        await client.query(
          'SELECT store_resume_education($1, $2)',
          [processedId, JSON.stringify(educationArray)]
        );
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        processedId,
        message: 'Resume data stored successfully'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error storing processed resume:', error);
    res.status(500).json({
      error: 'Failed to store processed resume',
      details: error.message
    });
  }
}

// Get processed resume data
async function getProcessedResume(req, res) {
  const { resumeId } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM get_processed_resume($1)',
      [resumeId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No processed data found for this resume'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error getting processed resume:', error);
    res.status(500).json({
      error: 'Failed to get processed resume',
      details: error.message
    });
  }
}

// Get all processed resumes for a user
async function getUserProcessedResumes(req, res) {
  const { email } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM get_user_processed_resumes($1)',
      [email]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error getting user processed resumes:', error);
    res.status(500).json({
      error: 'Failed to get user processed resumes',
      details: error.message
    });
  }
}

// Get skills statistics
async function getSkillsStatistics(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM get_skills_statistics()'
    );
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error getting skills statistics:', error);
    res.status(500).json({
      error: 'Failed to get skills statistics',
      details: error.message
    });
  }
}

// Delete processed resume data
async function deleteProcessedResume(req, res) {
  const { resumeId } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT delete_processed_resume($1) as deleted',
      [resumeId]
    );
    
    const deleted = result.rows[0].deleted;
    
    if (!deleted) {
      return res.status(404).json({
        error: 'No processed data found for this resume'
      });
    }
    
    res.json({
      success: true,
      message: 'Processed resume data deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting processed resume:', error);
    res.status(500).json({
      error: 'Failed to delete processed resume',
      details: error.message
    });
  }
}

// Get resume processing summary
async function getResumeProcessingSummary(req, res) {
  try {
    const result = await pool.query(`
      SELECT * FROM resume_processing_summary 
      ORDER BY processed_at DESC 
      LIMIT 50
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error getting resume processing summary:', error);
    res.status(500).json({
      error: 'Failed to get resume processing summary',
      details: error.message
    });
  }
}

export {
  storeProcessedResume,
  getProcessedResume,
  getUserProcessedResumes,
  getSkillsStatistics,
  deleteProcessedResume,
  getResumeProcessingSummary
};
