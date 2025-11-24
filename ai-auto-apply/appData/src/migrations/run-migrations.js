import { pool } from '../db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Get all migration files
    const migrationsDir = __dirname;
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure proper order
    
    console.log(`📁 Found ${migrationFiles.length} migration files`);
    
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      console.log(`🔄 Running migration: ${file}`);
      
      const migrationSQL = await fs.readFile(filePath, 'utf8');
      
      await pool.query(migrationSQL);
      console.log(`✅ Migration ${file} completed successfully`);
    }
    
    console.log('✅ All database migrations completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigrations();
