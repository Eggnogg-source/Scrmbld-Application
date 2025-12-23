import pkg from 'pg';
import dotenv from 'dotenv';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/connection.js:4',message:'DB connection module loading',data:{hasDbHost:!!process.env.DB_HOST,hasDbUser:!!process.env.DB_USER,hasDbPassword:!!process.env.DB_PASSWORD,hasDbName:!!process.env.DB_NAME,isVercel:!!process.env.VERCEL},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F'})}).catch(()=>{});
// #endregion

dotenv.config();

const { Pool } = pkg;

// #region agent log
fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/connection.js:12',message:'Creating DB pool',data:{host:process.env.DB_HOST||'localhost',port:process.env.DB_PORT||5432,database:process.env.DB_NAME||'spotify_reviewer',hasUser:!!process.env.DB_USER,hasPassword:!!process.env.DB_PASSWORD},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F'})}).catch(()=>{});
// #endregion

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'spotify_reviewer',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_HOST?.includes('supabase') ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/connection.js:25',message:'DB connection established',data:{host:process.env.DB_HOST},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/connection.js:30',message:'DB connection error',data:{error:err.message,code:err.code,isVercel:!!process.env.VERCEL},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  console.error('Unexpected error on idle client', err);
  // Don't exit in serverless environments (Vercel) - let the function handle it
  if (!process.env.VERCEL && !process.env.NOW) {
    process.exit(-1);
  }
});

export default pool;

