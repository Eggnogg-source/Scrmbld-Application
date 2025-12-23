-- Add listened flag to albums table
ALTER TABLE albums ADD COLUMN IF NOT EXISTS listened BOOLEAN DEFAULT FALSE;

-- Create user_album_listened table for tracking which albums users have listened to
CREATE TABLE IF NOT EXISTS user_album_listened (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    album_id INTEGER REFERENCES albums(id) ON DELETE CASCADE,
    listened BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, album_id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_album_listened_user_album ON user_album_listened(user_id, album_id);

