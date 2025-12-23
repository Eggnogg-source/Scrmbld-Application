import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function updateConfig() {
  console.log('\n=== Supabase Database Configuration ===\n');
  console.log('To find your Supabase connection details:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to Settings > Database');
  console.log('4. Find the "Connection string" or "Host" field\n');
  
  const host = await question('Enter your Supabase database host (e.g., db.xxxxx.supabase.co): ');
  const port = await question('Enter database port (default: 5432): ') || '5432';
  const database = await question('Enter database name (usually "postgres"): ') || 'postgres';
  const user = await question('Enter database user (usually "postgres"): ') || 'postgres';
  const password = await question('Enter database password: ');
  
  if (!host || !password) {
    console.log('\n❌ Host and password are required!');
    rl.close();
    process.exit(1);
  }
  
  const envContent = `PORT=8000
DB_HOST=${host}
DB_PORT=${port}
DB_NAME=${database}
DB_USER=${user}
DB_PASSWORD=${password}
SPOTIFY_CLIENT_ID=2bdf15ca2958470396b9820512aebe13
SPOTIFY_CLIENT_SECRET=dde1d382d49c4447a5b4b03fe98b5efc
SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
`;
  
  try {
    fs.writeFileSync('.env', envContent);
    console.log('\n✅ .env file updated successfully!');
    console.log('\nTesting connection...\n');
    rl.close();
    
    // Test the connection
    const pool = (await import('./db/connection.js')).default;
    try {
      const result = await pool.query('SELECT NOW()');
      console.log('✅ Database connection successful!');
      await pool.end();
      process.exit(0);
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      await pool.end();
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error updating .env file:', error.message);
    rl.close();
    process.exit(1);
  }
}

updateConfig();

