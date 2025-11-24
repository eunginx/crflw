import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runAIAnalysisMigration() {
  console.log('🚀 Running AI Analysis migration...');
  
  try {
    const client = await pool.connect();
    
    try {
      // Read and execute the AI analysis migration
      const migrationPath = path.join(__dirname, 'add_ai_analysis.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      console.log('📝 Executing AI analysis migration SQL...');
      await client.query(migrationSQL);
      
      console.log('✅ AI Analysis migration completed successfully!');
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ AI Analysis migration failed:', error);
    process.exit(1);
  }
}

async function runAIPipelineMigration() {
  console.log('🚀 Running AI Pipeline migration...');
  
  try {
    const client = await pool.connect();
    
    try {
      // Read and execute the AI pipeline migration
      const migrationPath = path.join(__dirname, 'add_ai_apply_pipeline.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      console.log('📝 Executing AI pipeline migration SQL...');
      await client.query(migrationSQL);
      
      console.log('✅ AI Pipeline migration completed successfully!');
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ AI Pipeline migration failed:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('🎯 Running AI-related migrations...');
  
  await runAIAnalysisMigration();
  await runAIPipelineMigration();
  
  console.log('🎉 All AI migrations completed successfully!');
  process.exit(0);
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runAIAnalysisMigration, runAIPipelineMigration };
