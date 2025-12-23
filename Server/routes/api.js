import express from 'express';
import pool from '../db/connection.js';

const router = express.Router();

// Helper function to get or create album
async function getOrCreateAlbum(spotifyId, albumData) {
  const checkAlbum = await pool.query(
    'SELECT id FROM albums WHERE spotify_id = $1',
    [spotifyId]
  );

  if (checkAlbum.rows.length > 0) {
    return checkAlbum.rows[0].id;
  }

  const result = await pool.query(
    `INSERT INTO albums (spotify_id, name, artist, image_url, release_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      spotifyId,
      albumData.name,
      albumData.artist,
      albumData.image_url,
      albumData.release_date,
    ]
  );

  return result.rows[0].id;
}

// Helper function to get or create user from Spotify ID
async function getOrCreateUser(spotifyId, userData = {}) {
  const checkUser = await pool.query(
    'SELECT id FROM users WHERE spotify_id = $1',
    [spotifyId]
  );

  if (checkUser.rows.length > 0) {
    return checkUser.rows[0].id;
  }

  const result = await pool.query(
    `INSERT INTO users (spotify_id, display_name, email)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [
      spotifyId,
      userData.display_name || null,
      userData.email || null,
    ]
  );

  return result.rows[0].id;
}

// Helper function to get or create track
async function getOrCreateTrack(spotifyId, trackData, albumId) {
  const checkTrack = await pool.query(
    'SELECT id FROM tracks WHERE spotify_id = $1',
    [spotifyId]
  );

  if (checkTrack.rows.length > 0) {
    return checkTrack.rows[0].id;
  }

  const result = await pool.query(
    `INSERT INTO tracks (spotify_id, album_id, name, duration_ms, track_number)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      spotifyId,
      albumId,
      trackData.name,
      trackData.duration_ms,
      trackData.track_number,
    ]
  );

  return result.rows[0].id;
}

// Get reviews for a track
router.get('/tracks/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, spotifyUserId } = req.query;

    let query;
    let params;

    if (spotifyUserId) {
      // Get user ID from Spotify ID
      const userResult = await pool.query(
        'SELECT id FROM users WHERE spotify_id = $1',
        [spotifyUserId]
      );
      if (userResult.rows.length > 0) {
        const dbUserId = userResult.rows[0].id;
        query = `
          SELECT r.*, u.display_name, u.spotify_id as user_spotify_id
          FROM reviews r
          JOIN users u ON r.user_id = u.id
          WHERE r.track_id = (SELECT id FROM tracks WHERE spotify_id = $1)
          AND r.user_id = $2
        `;
        params = [id, dbUserId];
      } else {
        // User doesn't exist yet, return empty
        return res.json([]);
      }
    } else if (userId) {
      query = `
        SELECT r.*, u.display_name, u.spotify_id as user_spotify_id
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.track_id = (SELECT id FROM tracks WHERE spotify_id = $1)
        AND r.user_id = $2
      `;
      params = [id, userId];
    } else {
      query = `
        SELECT r.*, u.display_name, u.spotify_id as user_spotify_id
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.track_id = (SELECT id FROM tracks WHERE spotify_id = $1)
      `;
      params = [id];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Create a review
router.post('/tracks/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, spotifyUserId, content } = req.body;

    if ((!userId && !spotifyUserId) || !content) {
      return res.status(400).json({ error: 'userId or spotifyUserId and content are required' });
    }

    // Get track_id from spotify_id
    const trackResult = await pool.query(
      'SELECT id FROM tracks WHERE spotify_id = $1',
      [id]
    );

    if (trackResult.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const trackId = trackResult.rows[0].id;

    // If spotifyUserId provided, get or create user
    let dbUserId = userId;
    if (spotifyUserId && !userId) {
      dbUserId = await getOrCreateUser(spotifyUserId);
    }

    // Check if review exists
    const existingReview = await pool.query(
      'SELECT id FROM reviews WHERE user_id = $1 AND track_id = $2',
      [dbUserId, trackId]
    );

    let result;
    if (existingReview.rows.length > 0) {
      // Update existing review
      result = await pool.query(
        `UPDATE reviews 
         SET content = $1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2 AND track_id = $3
         RETURNING *`,
        [content, dbUserId, trackId]
      );
    } else {
      // Create new review
      result = await pool.query(
        `INSERT INTO reviews (user_id, track_id, content)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [dbUserId, trackId, content]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Update a review
router.put('/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, userId, spotifyUserId } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    let query;
    let params;

    if (spotifyUserId) {
      // Get user ID from Spotify ID
      const userResult = await pool.query(
        'SELECT id FROM users WHERE spotify_id = $1',
        [spotifyUserId]
      );
      if (userResult.rows.length > 0) {
        const dbUserId = userResult.rows[0].id;
        query = `
          UPDATE reviews 
          SET content = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2 AND user_id = $3
          RETURNING *
        `;
        params = [content, id, dbUserId];
      } else {
        return res.status(404).json({ error: 'User not found' });
      }
    } else if (userId) {
      query = `
        UPDATE reviews 
        SET content = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3
        RETURNING *
      `;
      params = [content, id, userId];
    } else {
      query = `
        UPDATE reviews 
        SET content = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      params = [content, id];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete a review
router.delete('/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    let query;
    let params;

    if (userId) {
      query = 'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING *';
      params = [id, userId];
    } else {
      query = 'DELETE FROM reviews WHERE id = $1 RETURNING *';
      params = [id];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Get rating for a track
router.get('/tracks/:id/ratings', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, spotifyUserId } = req.query;

    let query;
    let params;

    if (spotifyUserId) {
      // Get user ID from Spotify ID
      const userResult = await pool.query(
        'SELECT id FROM users WHERE spotify_id = $1',
        [spotifyUserId]
      );
      if (userResult.rows.length > 0) {
        const dbUserId = userResult.rows[0].id;
        query = `
          SELECT r.*, u.display_name
          FROM ratings r
          JOIN users u ON r.user_id = u.id
          WHERE r.track_id = (SELECT id FROM tracks WHERE spotify_id = $1)
          AND r.user_id = $2
        `;
        params = [id, dbUserId];
      } else {
        // User doesn't exist yet, return empty
        return res.json([]);
      }
    } else if (userId) {
      query = `
        SELECT r.*, u.display_name
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        WHERE r.track_id = (SELECT id FROM tracks WHERE spotify_id = $1)
        AND r.user_id = $2
      `;
      params = [id, userId];
    } else {
      query = `
        SELECT r.*, u.display_name
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        WHERE r.track_id = (SELECT id FROM tracks WHERE spotify_id = $1)
      `;
      params = [id];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// Create/update rating
router.post('/tracks/:id/ratings', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, spotifyUserId, rating } = req.body;

    if ((!userId && !spotifyUserId) || !rating) {
      return res.status(400).json({ error: 'userId or spotifyUserId and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Get track_id from spotify_id
    const trackResult = await pool.query(
      'SELECT id FROM tracks WHERE spotify_id = $1',
      [id]
    );

    if (trackResult.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const trackId = trackResult.rows[0].id;

    // If spotifyUserId provided, get or create user
    let dbUserId = userId;
    if (spotifyUserId && !userId) {
      dbUserId = await getOrCreateUser(spotifyUserId);
    }

    // Check if rating exists
    const existingRating = await pool.query(
      'SELECT id FROM ratings WHERE user_id = $1 AND track_id = $2',
      [dbUserId, trackId]
    );

    let result;
    if (existingRating.rows.length > 0) {
      // Update existing rating
      result = await pool.query(
        `UPDATE ratings 
         SET rating = $1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2 AND track_id = $3
         RETURNING *`,
        [rating, dbUserId, trackId]
      );
    } else {
      // Create new rating
      result = await pool.query(
        `INSERT INTO ratings (user_id, track_id, rating)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [dbUserId, trackId, rating]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating/updating rating:', error);
    res.status(500).json({ error: 'Failed to create/update rating' });
  }
});

// Get notes for a track (personal notes only - filtered by user)
router.get('/tracks/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { spotifyUserId } = req.query;

    if (!spotifyUserId) {
      return res.json([]); // Return empty if no user specified
    }

    // Get user ID from Spotify ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE spotify_id = $1',
      [spotifyUserId]
    );

    if (userResult.rows.length === 0) {
      return res.json([]);
    }

    const dbUserId = userResult.rows[0].id;

    // Check if track exists first
    const trackCheck = await pool.query(
      'SELECT id FROM tracks WHERE spotify_id = $1',
      [id]
    );

    if (trackCheck.rows.length === 0) {
      return res.json([]);
    }

    const trackId = trackCheck.rows[0].id;

    const result = await pool.query(
      `SELECT c.*
       FROM comments c
       WHERE c.track_id = $1
       AND c.user_id = $2
       ORDER BY c.created_at DESC`,
      [trackId, dbUserId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Create or update note for a track (personal notes - one per user per track)
router.post('/tracks/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { spotifyUserId, content } = req.body;

    if (!spotifyUserId || !content) {
      return res.status(400).json({ error: 'spotifyUserId and content are required' });
    }

    // Get or create user
    const dbUserId = await getOrCreateUser(spotifyUserId);

    // Get track_id from spotify_id
    const trackResult = await pool.query(
      'SELECT id FROM tracks WHERE spotify_id = $1',
      [id]
    );

    let trackId;
    if (trackResult.rows.length === 0) {
      // Track doesn't exist - create minimal entry
      const insertResult = await pool.query(
        `INSERT INTO tracks (spotify_id, name, duration_ms, track_number, album_id)
         VALUES ($1, $2, $3, $4, NULL)
         ON CONFLICT (spotify_id) DO NOTHING
         RETURNING id`,
        [id, 'Unknown Track', 0, 0]
      );
      
      if (insertResult.rows.length > 0) {
        trackId = insertResult.rows[0].id;
      } else {
        // Track was created by another request, fetch it
        const retryResult = await pool.query(
          'SELECT id FROM tracks WHERE spotify_id = $1',
          [id]
        );
        if (retryResult.rows.length === 0) {
          return res.status(500).json({ error: 'Failed to create track entry' });
        }
        trackId = retryResult.rows[0].id;
      }
    } else {
      trackId = trackResult.rows[0].id;
    }

    // Check if note exists (one note per user per track)
    const existingNote = await pool.query(
      'SELECT id FROM comments WHERE user_id = $1 AND track_id = $2',
      [dbUserId, trackId]
    );

    let result;
    if (existingNote.rows.length > 0) {
      // Update existing note
      result = await pool.query(
        `UPDATE comments 
         SET content = $1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2 AND track_id = $3
         RETURNING *`,
        [content, dbUserId, trackId]
      );
    } else {
      // Create new note
      result = await pool.query(
        `INSERT INTO comments (user_id, track_id, content)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [dbUserId, trackId, content]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving note:', error);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// Delete a note
router.delete('/tracks/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { spotifyUserId } = req.query;

    if (!spotifyUserId) {
      return res.status(400).json({ error: 'spotifyUserId is required' });
    }

    // Get user ID from Spotify ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE spotify_id = $1',
      [spotifyUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const dbUserId = userResult.rows[0].id;

    // Get track_id from spotify_id
    const trackResult = await pool.query(
      'SELECT id FROM tracks WHERE spotify_id = $1',
      [id]
    );

    if (trackResult.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const trackId = trackResult.rows[0].id;

    const result = await pool.query(
      'DELETE FROM comments WHERE track_id = $1 AND user_id = $2 RETURNING *',
      [trackId, dbUserId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Get or create user from Spotify ID
router.post('/users/sync', async (req, res) => {
  try {
    const { spotifyId, displayName, email } = req.body;

    if (!spotifyId) {
      return res.status(400).json({ error: 'spotifyId is required' });
    }

    const userId = await getOrCreateUser(spotifyId, {
      display_name: displayName,
      email: email,
    });

    res.json({ userId, spotifyId });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// Get note for an album (personal notes - filtered by user)
router.get('/albums/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { spotifyUserId } = req.query;

    if (!spotifyUserId) {
      return res.json(null);
    }

    // Get user ID from Spotify ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE spotify_id = $1',
      [spotifyUserId]
    );

    if (userResult.rows.length === 0) {
      return res.json(null);
    }

    const dbUserId = userResult.rows[0].id;

    // Get album_id from spotify_id
    const albumResult = await pool.query(
      'SELECT id FROM albums WHERE spotify_id = $1',
      [id]
    );

    if (albumResult.rows.length === 0) {
      // Album doesn't exist in DB yet - return null (not an error)
      return res.json(null);
    }

    const albumId = albumResult.rows[0].id;

    const result = await pool.query(
      `SELECT *
       FROM album_notes
       WHERE album_id = $1 AND user_id = $2`,
      [albumId, dbUserId]
    );

    res.json(result.rows.length > 0 ? result.rows[0] : null);
  } catch (error) {
    console.error('Error fetching album note:', error);
    // Return null instead of error for missing notes
    res.json(null);
  }
});

// Create or update note for an album (personal notes - one per user per album)
router.post('/albums/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { spotifyUserId, content } = req.body;

    if (!spotifyUserId || !content) {
      return res.status(400).json({ error: 'spotifyUserId and content are required' });
    }

    // Get or create user
    const dbUserId = await getOrCreateUser(spotifyUserId);

    // Get album_id from spotify_id
    const albumResult = await pool.query(
      'SELECT id FROM albums WHERE spotify_id = $1',
      [id]
    );

    if (albumResult.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const albumId = albumResult.rows[0].id;

    // Check if note exists (one note per user per album)
    const existingNote = await pool.query(
      'SELECT id, is_locked FROM album_notes WHERE user_id = $1 AND album_id = $2',
      [dbUserId, albumId]
    );

    let result;
    if (existingNote.rows.length > 0) {
      // Check if note is locked
      if (existingNote.rows[0].is_locked) {
        return res.status(403).json({ error: 'Note is locked and cannot be edited' });
      }
      // Update existing note
      result = await pool.query(
        `UPDATE album_notes 
         SET content = $1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2 AND album_id = $3
         RETURNING *`,
        [content, dbUserId, albumId]
      );
    } else {
      // Create new note
      result = await pool.query(
        `INSERT INTO album_notes (user_id, album_id, content, is_locked)
         VALUES ($1, $2, $3, FALSE)
         RETURNING *`,
        [dbUserId, albumId, content]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving album note:', error);
    res.status(500).json({ error: 'Failed to save album note' });
  }
});

// Toggle lock status for album note
router.put('/albums/:id/notes/lock', async (req, res) => {
  try {
    const { id } = req.params;
    const { spotifyUserId, isLocked } = req.body;

    if (!spotifyUserId || typeof isLocked !== 'boolean') {
      return res.status(400).json({ error: 'spotifyUserId and isLocked (boolean) are required' });
    }

    // Get or create user
    const dbUserId = await getOrCreateUser(spotifyUserId);

    // Get album_id from spotify_id
    const albumResult = await pool.query(
      'SELECT id FROM albums WHERE spotify_id = $1',
      [id]
    );

    if (albumResult.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const albumId = albumResult.rows[0].id;

    const result = await pool.query(
      `UPDATE album_notes 
       SET is_locked = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND album_id = $3
       RETURNING *`,
      [isLocked, dbUserId, albumId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error toggling note lock:', error);
    res.status(500).json({ error: 'Failed to toggle note lock' });
  }
});

// Toggle listened status for album
router.put('/albums/:id/listened', async (req, res) => {
  try {
    const { id } = req.params;
    const { spotifyUserId, listened } = req.body;

    if (!spotifyUserId || typeof listened !== 'boolean') {
      return res.status(400).json({ error: 'spotifyUserId and listened (boolean) are required' });
    }

    // Get or create user
    const dbUserId = await getOrCreateUser(spotifyUserId);

    // Get album_id from spotify_id
    const albumResult = await pool.query(
      'SELECT id FROM albums WHERE spotify_id = $1',
      [id]
    );

    if (albumResult.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const albumId = albumResult.rows[0].id;

    // Check if entry exists
    const existing = await pool.query(
      'SELECT id FROM user_album_listened WHERE user_id = $1 AND album_id = $2',
      [dbUserId, albumId]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing
      result = await pool.query(
        `UPDATE user_album_listened 
         SET listened = $1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2 AND album_id = $3
         RETURNING *`,
        [listened, dbUserId, albumId]
      );
    } else {
      // Create new
      result = await pool.query(
        `INSERT INTO user_album_listened (user_id, album_id, listened)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [dbUserId, albumId, listened]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error toggling listened status:', error);
    res.status(500).json({ error: 'Failed to toggle listened status' });
  }
});

// Get listened status for album
router.get('/albums/:id/listened', async (req, res) => {
  try {
    const { id } = req.params;
    const { spotifyUserId } = req.query;

    if (!spotifyUserId) {
      return res.json({ listened: false });
    }

    // Get user ID from Spotify ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE spotify_id = $1',
      [spotifyUserId]
    );

    if (userResult.rows.length === 0) {
      return res.json({ listened: false });
    }

    const dbUserId = userResult.rows[0].id;

    // Get album_id from spotify_id
    const albumResult = await pool.query(
      'SELECT id FROM albums WHERE spotify_id = $1',
      [id]
    );

    if (albumResult.rows.length === 0) {
      return res.json({ listened: false });
    }

    const albumId = albumResult.rows[0].id;

    const result = await pool.query(
      `SELECT listened
       FROM user_album_listened
       WHERE user_id = $1 AND album_id = $2`,
      [dbUserId, albumId]
    );

    res.json({ listened: result.rows.length > 0 ? result.rows[0].listened : false });
  } catch (error) {
    console.error('Error fetching listened status:', error);
    res.json({ listened: false });
  }
});

// Delete note for an album
router.delete('/albums/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { spotifyUserId } = req.query;

    if (!spotifyUserId) {
      return res.status(400).json({ error: 'spotifyUserId is required' });
    }

    // Get user ID from Spotify ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE spotify_id = $1',
      [spotifyUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const dbUserId = userResult.rows[0].id;

    // Get album_id from spotify_id
    const albumResult = await pool.query(
      'SELECT id FROM albums WHERE spotify_id = $1',
      [id]
    );

    if (albumResult.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const albumId = albumResult.rows[0].id;

    const result = await pool.query(
      'DELETE FROM album_notes WHERE album_id = $1 AND user_id = $2 RETURNING *',
      [albumId, dbUserId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting album note:', error);
    res.status(500).json({ error: 'Failed to delete album note' });
  }
});

// Sync album and tracks from Spotify data
router.post('/albums/sync', async (req, res) => {
  try {
    const { album, tracks } = req.body;

    if (!album || !album.id) {
      return res.status(400).json({ error: 'album with id is required' });
    }

    if (!tracks || !Array.isArray(tracks)) {
      return res.status(400).json({ error: 'tracks array is required' });
    }

    // Get or create album
    const albumId = await getOrCreateAlbum(album.id, {
      name: album.name || 'Unknown Album',
      artist: album.artists?.[0]?.name || 'Unknown Artist',
      image_url: album.images?.[0]?.url || null,
      release_date: album.release_date || null,
    });

    // Get or create tracks
    const trackIds = [];
    let skippedCount = 0;
    
    for (const track of tracks) {
      if (!track) {
        skippedCount++;
        continue;
      }
      
      // Handle different track structures from Spotify
      const trackId = track.id || track.uri?.split(':').pop();
      if (!trackId) {
        skippedCount++;
        continue;
      }
      
      try {
        const dbTrackId = await getOrCreateTrack(trackId, {
          name: track.name || 'Unknown Track',
          duration_ms: track.duration_ms || null,
          track_number: track.track_number || null,
        }, albumId);
        trackIds.push(dbTrackId);
      } catch (trackError) {
        console.error('Error creating track:', trackError.message, 'Track:', trackId);
        skippedCount++;
      }
    }

    res.status(201).json({
      message: 'Album and tracks synced successfully',
      albumId,
      trackIds,
      skipped: skippedCount,
    });
  } catch (error) {
    console.error('Error syncing album:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Failed to sync album', details: error.message });
  }
});

export default router;

