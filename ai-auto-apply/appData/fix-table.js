// Fix missing columns in job_applications_email table
import { query as dbQuery } from './src/db.js';

async function fixTable() {
  try {
    console.log('Checking for missing columns...');
    
    // Check if source column exists
    const sourceCheck = await dbQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'job_applications_email' 
      AND column_name = 'source'
    `);
    
    // Check if priority column exists
    const priorityCheck = await dbQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'job_applications_email' 
      AND column_name = 'priority'
    `);
    
    // Add source column if it doesn't exist
    if (sourceCheck.rows.length === 0) {
      console.log('Adding source column...');
      await dbQuery(`
        ALTER TABLE job_applications_email 
        ADD COLUMN source VARCHAR(100)
      `);
      console.log('Source column added.');
    }
    
    // Add priority column if it doesn't exist
    if (priorityCheck.rows.length === 0) {
      console.log('Adding priority column...');
      await dbQuery(`
        ALTER TABLE job_applications_email 
        ADD COLUMN priority VARCHAR(20) DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high'))
      `);
      console.log('Priority column added.');
    }
    
    console.log('Table schema updated successfully!');
    
  } catch (error) {
    console.error('Error fixing table:', error);
  } finally {
    process.exit(0);
  }
}

fixTable();
