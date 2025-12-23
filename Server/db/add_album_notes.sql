-- Add album_notes table for personal album notes
CREATE TABLE IF NOT EXISTS album_notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    album_id INTEGER REFERENCES albums(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, album_id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_album_notes_user_album ON album_notes(user_id, album_id);

