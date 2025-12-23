import { notesApi, albumNotesApi } from './api';

// Sync service for notes - handles localStorage + server sync with conflict resolution
export const trackNotesSync = {
  get: async (trackId, userId) => {
    const storageKey = `track_note_${userId}_${trackId}`;
    const localContent = localStorage.getItem(storageKey) || '';
    
    // If no local data, try to load from server
    if (!localContent.trim()) {
      try {
        const data = await notesApi.getTrackNote(trackId, userId);
        if (data && data.length > 0 && data[0].content) {
          // Server has data, save to localStorage
          localStorage.setItem(storageKey, data[0].content);
          return data[0].content;
        }
        // No data in either place - return empty
        return '';
      } catch (error) {
        // API failed, but no local data anyway - return empty
        // Don't log errors for missing notes (expected behavior)
        return '';
      }
    }
    
    // Local data exists - check if server has it too (read-only, don't sync here)
    try {
      const data = await notesApi.getTrackNote(trackId, userId);
      if (data && data.length > 0 && data[0].content) {
        // Server has data - compare with local
        const serverContent = data[0].content;
        if (serverContent !== localContent) {
          // Conflict: server has different data - use server (more authoritative)
          localStorage.setItem(storageKey, serverContent);
          return serverContent;
        }
        // Both match - return local (faster)
        return localContent;
      } else {
        // Local has data but server doesn't - just return local
        // Don't sync here - let the save function handle syncing
        return localContent;
      }
    } catch (error) {
      // API failed but we have local data - use local
      // Don't log errors for network issues (expected when offline)
      return localContent;
    }
  },

  save: async (trackId, userId, content) => {
    const storageKey = `track_note_${userId}_${trackId}`;
    
    // Save to localStorage immediately for instant feedback
    if (content.trim()) {
      localStorage.setItem(storageKey, content.trim());
    } else {
      localStorage.removeItem(storageKey);
    }
    
    // Sync to Supabase in background (don't block UI)
    if (content.trim()) {
      try {
        await notesApi.saveTrackNote(trackId, userId, content.trim());
      } catch (error) {
        if (!error.isConnectionError) {
          console.error('Failed to sync note:', error);
        }
        const failedSyncs = JSON.parse(localStorage.getItem('failed_note_syncs') || '[]');
        // Remove any existing failed sync for this track
        const filtered = failedSyncs.filter(s => 
          !(s.type === 'track' && s.trackId === trackId && s.userId === userId)
        );
        filtered.push({
          type: 'track',
          trackId,
          userId,
          content: content.trim(),
          timestamp: Date.now(),
        });
        localStorage.setItem('failed_note_syncs', JSON.stringify(filtered));
      }
    } else {
      try {
        await notesApi.deleteTrackNote(trackId, userId);
      } catch (error) {
        if (!error.isConnectionError) {
          console.error('Failed to delete note:', error);
        }
      }
    }
  },

  delete: async (trackId, userId) => {
    const storageKey = `track_note_${userId}_${trackId}`;
    localStorage.removeItem(storageKey);
    
    try {
      await notesApi.deleteTrackNote(trackId, userId);
    } catch (error) {
      if (!error.isConnectionError) {
        console.error('Failed to delete note:', error);
      }
    }
  },
};

export const albumNotesSync = {
  get: async (albumId, userId) => {
    const storageKey = `album_note_${userId}_${albumId}`;
    const localContent = localStorage.getItem(storageKey) || '';
    
    // If no local data, try to load from server
    if (!localContent.trim()) {
      try {
        const data = await albumNotesApi.getAlbumNote(albumId, userId);
        if (data && data.content) {
          // Server has data, save to localStorage
          localStorage.setItem(storageKey, data.content);
          return data.content;
        }
        // No data in either place - return empty
        return '';
      } catch (error) {
        // API failed, but no local data anyway - return empty
        // Don't log errors for missing notes (expected behavior)
        return '';
      }
    }
    
    // Local data exists - check if server has it too (read-only, don't sync here)
    try {
      const data = await albumNotesApi.getAlbumNote(albumId, userId);
      if (data && data.content) {
        // Server has data - compare with local
        const serverContent = data.content;
        if (serverContent !== localContent) {
          // Conflict: server has different data - use server (more authoritative)
          localStorage.setItem(storageKey, serverContent);
          return serverContent;
        }
        // Both match - return local (faster)
        return localContent;
      } else {
        // Local has data but server doesn't - just return local
        // Don't sync here - let the save function handle syncing
        return localContent;
      }
    } catch (error) {
      // API failed but we have local data - use local
      // Don't log errors for network issues (expected when offline)
      return localContent;
    }
  },

  // Save note - saves to localStorage immediately, syncs to Supabase in background
  save: async (albumId, userId, content) => {
    const storageKey = `album_note_${userId}_${albumId}`;
    
    if (content.trim()) {
      localStorage.setItem(storageKey, content.trim());
    } else {
      localStorage.removeItem(storageKey);
    }
    
    if (content.trim()) {
      try {
        await albumNotesApi.saveAlbumNote(albumId, userId, content.trim());
      } catch (error) {
        if (!error.isConnectionError) {
          console.error('Failed to sync album note:', error);
        }
        const failedSyncs = JSON.parse(localStorage.getItem('failed_note_syncs') || '[]');
        // Remove any existing failed sync for this album
        const filtered = failedSyncs.filter(s => 
          !(s.type === 'album' && s.albumId === albumId && s.userId === userId)
        );
        filtered.push({
          type: 'album',
          albumId,
          userId,
          content: content.trim(),
          timestamp: Date.now(),
        });
        localStorage.setItem('failed_note_syncs', JSON.stringify(filtered));
      }
    } else {
      try {
        await albumNotesApi.deleteAlbumNote(albumId, userId);
      } catch (error) {
        if (!error.isConnectionError) {
          console.error('Failed to delete album note:', error);
        }
      }
    }
  },

  delete: async (albumId, userId) => {
    const storageKey = `album_note_${userId}_${albumId}`;
    localStorage.removeItem(storageKey);
    
    try {
      await albumNotesApi.deleteAlbumNote(albumId, userId);
    } catch (error) {
      if (!error.isConnectionError) {
        console.error('Failed to delete album note:', error);
      }
    }
  },
};

export const retryFailedSyncs = async (userId) => {
  const failedSyncs = JSON.parse(localStorage.getItem('failed_note_syncs') || '[]');
  if (failedSyncs.length === 0) return;

  const remaining = [];
  
  for (const sync of failedSyncs) {
    if (Date.now() - sync.timestamp > 7 * 24 * 60 * 60 * 1000) {
      continue;
    }
    
    try {
      if (sync.type === 'track') {
        await notesApi.saveTrackNote(sync.trackId, userId, sync.content);
      } else if (sync.type === 'album') {
        await albumNotesApi.saveAlbumNote(sync.albumId, userId, sync.content);
      }
    } catch (error) {
      console.error('Retry failed:', error);
      remaining.push(sync);
    }
  }

  localStorage.setItem('failed_note_syncs', JSON.stringify(remaining));
};
