# Database Setup Instructions

## Getting Your Supabase Connection Details

1. Go to https://supabase.com/dashboard
2. Select your project (named "spotify_reviewer")
3. Navigate to **Settings** > **Database**
4. Find the **Connection string** section
5. Look for the **Host** field - it will look like: `db.xxxxx.supabase.co` (where xxxxx is your project reference)

## Quick Setup

Run this command to interactively configure your database connection:

```bash
npm run update-db-config
```

Or manually edit `Server/.env` and update the `DB_HOST` field with your actual Supabase host.

## Manual Configuration

If you prefer to edit manually, update `Server/.env`:

```
DB_HOST=db.[your-project-ref].supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=Noga8154
```

Replace `[your-project-ref]` with your actual Supabase project reference.

## After Configuration

1. Test the connection:
   ```bash
   npm run test-connection
   ```

2. Set up the database schema:
   ```bash
   npm run setup-db
   ```

3. Start the server:
   ```bash
   npm start
   ```

