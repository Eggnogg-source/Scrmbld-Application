# Scrmbld Application

A full-stack music review application that integrates with Spotify, allowing users to review, rate, and take notes on albums and tracks.

## Project Structure

```
Full Stack Final/
├── Scrmbld Reviewer/    # React frontend application
└── Server/              # Express.js backend API
```

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database (Supabase recommended)
- Spotify Developer Account

### 1. Start the Backend Server

**Important:** The backend server must be running for the application to work properly.

```bash
cd Server
npm install
npm start
```

The server will run on `http://localhost:8000`

**For development with auto-reload:**
```bash
npm run dev
```

### 2. Start the Frontend

In a new terminal:

```bash
cd "Scrmbld Reviewer"
npm install
npm run dev
```

The frontend will run on `http://127.0.0.1:5173`

### 3. Configure Environment Variables

#### Backend (Server/.env)
- `DB_HOST` - Your Supabase database host
- `DB_PORT` - Usually 5432
- `DB_NAME` - Usually "postgres"
- `DB_USER` - Usually "postgres"
- `DB_PASSWORD` - Your database password
- `SPOTIFY_CLIENT_ID` - Your Spotify app client ID
- `SPOTIFY_CLIENT_SECRET` - Your Spotify app client secret
- `SPOTIFY_REDIRECT_URI` - http://localhost:5173/callback

#### Frontend (Scrmbld Reviewer/.env)
- `VITE_SPOTIFY_CLIENT_ID` - Your Spotify app client ID
- `VITE_API_URL` - http://localhost:8000

## Troubleshooting

### Connection Refused Errors

If you see `ERR_CONNECTION_REFUSED` errors in the browser console:
1. **Make sure the backend server is running** on port 8000
2. Check that the server started successfully: `http://localhost:8000/health`
3. Verify your database connection: `cd Server && npm run test-connection`

The application will continue to work with localStorage fallback, but server features won't be available until the backend is running.

## Features

- **Spotify Integration**: Connect your Spotify account to access your music library
- **Album & Track Reviews**: Write and manage reviews for albums and tracks
- **Ratings**: Rate tracks with a 5-star system
- **Personal Notes**: Take private notes on tracks and albums
- **Offline Support**: Works with localStorage when server is unavailable

## Technologies

### Frontend
- React 19
- Vite
- React Router
- Axios

### Backend
- Node.js
- Express.js
- PostgreSQL (via Supabase)
- pg (PostgreSQL client)

## License

ISC

