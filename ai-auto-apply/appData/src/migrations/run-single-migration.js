import { pool } from '../db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSingleMigration(migrationFile) {
  try {
    console.log(`🔄 Running migration: ${migrationFile}`);
    
    const filePath = path.join(__dirname, migrationFile);
    const migrationSQL = await fs.readFile(filePath, 'utf8');
    
    await pool.query(migrationSQL);
    console.log(`✅ Migration ${migrationFile} completed successfully`);
    
  } catch (error) {
    console.error(`❌ Migration ${migrationFile} failed:`, error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Get migration file from command line args
const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('❌ Please provide migration file name as argument');
  console.log('Usage: node run-single-migration.js <migration-file.sql>');
  process.exit(1);
}

runSingleMigration(migrationFile);
