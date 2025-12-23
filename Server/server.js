import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
// #region agent log
fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:7',message:'About to import apiRoutes (will trigger DB connection)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F'})}).catch(()=>{});
// #endregion
import apiRoutes from './routes/api.js';
// #region agent log
fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:10',message:'apiRoutes imported successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F'})}).catch(()=>{});
// #endregion

// #region agent log
fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:8',message:'Server module loading',data:{nodeEnv:process.env.NODE_ENV,hasPort:!!process.env.PORT},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
// #endregion

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve();

// #region agent log
fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:15',message:'__dirname resolved',data:{__dirname,resolved:path.resolve()},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
// #endregion

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL || 'https://your-vercel-app.vercel.app']
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route (must be before catch-all)
app.get('/health', (req, res) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:52',message:'Health check route hit',data:{path:req.path},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  res.json({ status: 'ok', message: 'Server is running' });
});

// API routes (must be before catch-all)
app.use('/api', apiRoutes);

// Serve static files from the built frontend (for production)
if (process.env.NODE_ENV === 'production') {
  // Try multiple possible paths for the dist folder
  const possiblePaths = [
    path.join(__dirname, '../Scrmbld Reviewer/dist'),
    path.join(__dirname, '../../Scrmbld Reviewer/dist'),
    path.join(__dirname, 'dist'),
    path.join(process.cwd(), 'Scrmbld Reviewer/dist'),
    path.join(process.cwd(), '../Scrmbld Reviewer/dist')
  ];
  
  let frontendPath = possiblePaths[0]; // Default to first path
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:62',message:'Static file path resolution',data:{__dirname,processCwd:process.cwd(),frontendPath,possiblePaths},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  app.use(express.static(frontendPath));
  
  // Serve index.html for all non-API routes (SPA routing) - must be last
  app.get('*', (req, res) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:75',message:'Catch-all route hit',data:{path:req.path,isApi:req.path.startsWith('/api'),isHealth:req.path.startsWith('/health')},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
      const indexPath = path.join(frontendPath, 'index.html');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:79',message:'Sending index.html',data:{indexPath,path:req.path},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      res.sendFile(indexPath, (err) => {
        if (err) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:82',message:'Error sending index.html',data:{error:err.message,path:req.path,indexPath},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          res.status(404).json({ error: 'Not found', path: req.path });
        }
      });
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
// #region agent log
fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:66',message:'About to start server',data:{port:PORT,nodeEnv:process.env.NODE_ENV,isVercel:!!process.env.VERCEL},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'E'})}).catch(()=>{});
// #endregion

// Export app for Vercel serverless functions
// Vercel expects the default export to be the handler
// For @vercel/node, we can export the Express app directly
export default app;

// Only listen if not in Vercel environment (local development)
if (!process.env.VERCEL && !process.env.NOW) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

