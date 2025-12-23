import fs from 'fs';
import path from 'path';

const envContent = `VITE_SPOTIFY_CLIENT_ID=2bdf15ca2958470396b9820512aebe13
VITE_API_URL=http://localhost:8000
`;

const envPath = path.join(process.cwd(), '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Client .env file created successfully!');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  process.exit(1);
}

