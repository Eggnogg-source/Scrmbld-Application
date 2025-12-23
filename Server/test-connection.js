import pool from './db/connection.js';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    console.log('Current time:', result.rows[0].now);
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    console.error('\nPlease check your Supabase connection details:');
    console.error('1. Go to your Supabase project dashboard');
    console.error('2. Navigate to Settings > Database');
    console.error('3. Copy the connection string or host details');
    console.error('4. Update Server/.env with the correct DB_HOST');
    console.error('\nFor Supabase, the host format is usually: db.[project-ref].supabase.co');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();

