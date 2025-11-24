import { pool } from '../db.js';

async function runResumeAnalysisMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running resume analysis migration...');
    
    await client.query('BEGIN');
    
    // Create resume_analysis table
    const createResumeAnalysisTable = `
      CREATE TABLE IF NOT EXISTS resume_analysis (
        id SERIAL PRIMARY KEY,
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        contact_info JSONB,
        sections_detected JSONB,
        skills JSONB,
        quality_score JSONB,
        recommendations JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await client.query(createResumeAnalysisTable);
    console.log('✅ resume_analysis table created');
    
    // Create indexes for better performance
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_resume_analysis_document_id ON resume_analysis(document_id);',
      'CREATE INDEX IF NOT EXISTS idx_resume_analysis_created_at ON resume_analysis(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_resume_analysis_skills ON resume_analysis USING GIN(skills);'
    ];
    
    for (const indexQuery of createIndexes) {
      await client.query(indexQuery);
    }
    console.log('✅ resume_analysis indexes created');
    
    // Update document_processing_results table to include analysis status
    const updateProcessingResults = `
      ALTER TABLE document_processing_results 
      ADD COLUMN IF NOT EXISTS analysis_status VARCHAR(20) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS analysis_completed_at TIMESTAMP;
    `;
    
    await client.query(updateProcessingResults);
    console.log('✅ document_processing_results table updated');
    
    // Create trigger to update updated_at timestamp
    const createTrigger = `
      CREATE OR REPLACE FUNCTION update_resume_analysis_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      DROP TRIGGER IF EXISTS resume_analysis_updated_at_trigger ON resume_analysis;
      CREATE TRIGGER resume_analysis_updated_at_trigger
        BEFORE UPDATE ON resume_analysis
        FOR EACH ROW
        EXECUTE FUNCTION update_resume_analysis_updated_at();
    `;
    
    await client.query(createTrigger);
    console.log('✅ resume_analysis updated_at trigger created');
    
    await client.query('COMMIT');
    console.log('✅ Resume analysis migration completed successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Resume analysis migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runResumeAnalysisMigration()
    .then(() => {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export default runResumeAnalysisMigration;
