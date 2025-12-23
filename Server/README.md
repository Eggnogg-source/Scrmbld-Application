# Scrmbld Server

## Overview

The Scrmbld Server is the backend API for the Scrmbld music review application. It provides a RESTful API that connects the React frontend to a PostgreSQL database (hosted on Supabase) and integrates with the Spotify Web API.

## What It Does

The server enables users to:
- **Authenticate** with Spotify and sync user data
- **Store and retrieve** music reviews, ratings, and notes for tracks and albums
- **Manage** user libraries, albums, tracks, and playlists
- **Persist** user-generated content (comments, ratings, notes) in a relational database

## How It Works

The server is built with **Express.js** and uses the following architecture:

1. **Database Layer**: PostgreSQL database (Supabase) stores:
   - User information and Spotify authentication tokens
   - Albums, tracks, and their metadata
   - User reviews, ratings, and comments

2. **API Layer**: Express.js REST API provides endpoints for:
   - User management and synchronization
   - Album and track data retrieval
   - Review, rating, and comment CRUD operations

3. **Authentication**: Integrates with Spotify OAuth to authenticate users and access their Spotify data

## Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework for building REST APIs
- **PostgreSQL** - Relational database (via Supabase)
- **pg** - PostgreSQL client for Node.js
- **CORS** - Cross-origin resource sharing middleware
- **dotenv** - Environment variable management
- **express-session** - Session management

## Quick Start

### 1. Configure Database Connection

You need your Supabase database host. Get it from:
- Go to https://supabase.com/dashboard
- Select your project
- Settings > Database > Connection string
- Copy the Host (format: `db.xxxxx.supabase.co`)

Then update the `.env` file:

**Option A: Use PowerShell script**
```powershell
.\update-host.ps1 -Host "db.your-project-ref.supabase.co"
```

**Option B: Use Node script**
```bash
npm run update-db-config
```

**Option C: Manually edit `Server/.env`**
Update the `DB_HOST` line with your Supabase host.

### 2. Test Connection
```bash
npm run test-connection
```

### 3. Setup Database Schema
```bash
npm run setup-db
```

### 4. Start Server
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The server will run on http://localhost:8000

## Environment Variables

The `.env` file should contain:
- `DB_HOST` - Your Supabase database host
- `DB_PORT` - Usually 5432
- `DB_NAME` - Usually "postgres" for Supabase
- `DB_USER` - Usually "postgres"
- `DB_PASSWORD` - Your database password
- `SPOTIFY_CLIENT_ID` - Your Spotify app client ID
- `SPOTIFY_CLIENT_SECRET` - Your Spotify app client secret
- `SPOTIFY_REDIRECT_URI` - http://localhost:5173/callback
