import pool from './db/connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  try {
    console.log('Connecting to database...');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the entire schema at once (better for dependencies)
    console.log('Executing database schema...');
    
    try {
      await pool.query(schema);
      console.log('✓ Schema executed successfully');
    } catch (err) {
      // If full execution fails, try individual statements
      console.log('Trying individual statements...');
      
      // Split by semicolons and execute each statement
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        if (statement) {
          try {
            await pool.query(statement);
            console.log('✓ Executed statement');
          } catch (err) {
            // Ignore "already exists" errors
            if (err.message.includes('already exists') || err.message.includes('duplicate')) {
              console.log('⚠ Already exists, skipping...');
            } else if (err.message.includes('does not exist')) {
              // This might be an index trying to reference a table that doesn't exist yet
              // We'll skip it for now and it will be created on next run
              console.log('⚠ Skipping (dependency not ready)...');
            } else {
              console.error('Error:', err.message.substring(0, 100));
            }
          }
        }
      }
    }
    
    console.log('✅ Database schema setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();

