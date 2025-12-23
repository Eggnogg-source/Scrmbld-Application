import fs from 'fs';
import path from 'path';

const envContent = `PORT=8000
DB_HOST=db.spotify_reviewer.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=Noga8154
SPOTIFY_CLIENT_ID=2bdf15ca2958470396b9820512aebe13
SPOTIFY_CLIENT_SECRET=dde1d382d49c4447a5b4b03fe98b5efc
SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
`;

const envPath = path.join(process.cwd(), '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Server .env file created successfully!');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  process.exit(1);
}

