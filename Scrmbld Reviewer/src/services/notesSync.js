import { notesApi, albumNotesApi } from './api';

/**
 * Sync service for notes - handles localStorage + Supabase sync
 * Provides intelligent syncing with conflict resolution
 */

// Track note sync
export const trackNotesSync = {
  // Get note - intelligently syncs between localStorage and Supabase
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

  // Save note - saves to localStorage immediately, syncs to Supabase in background
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
        // If sync fails, mark for retry later
        console.error('Failed to sync note to server:', error);
        // Store failed syncs for retry
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
      // Delete from Supabase
      try {
        await notesApi.deleteTrackNote(trackId, userId);
      } catch (error) {
        console.error('Failed to delete note from server:', error);
      }
    }
  },

  // Delete note
  delete: async (trackId, userId) => {
    const storageKey = `track_note_${userId}_${trackId}`;
    localStorage.removeItem(storageKey);
    
    try {
      await notesApi.deleteTrackNote(trackId, userId);
    } catch (error) {
      console.error('Failed to delete note from server:', error);
    }
  },
};

// Album note sync
export const albumNotesSync = {
  // Get note - intelligently syncs between localStorage and Supabase
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
    
    // Save to localStorage immediately for instant feedback
    if (content.trim()) {
      localStorage.setItem(storageKey, content.trim());
    } else {
      localStorage.removeItem(storageKey);
    }
    
    // Sync to Supabase in background (don't block UI)
    if (content.trim()) {
      try {
        await albumNotesApi.saveAlbumNote(albumId, userId, content.trim());
      } catch (error) {
        // If sync fails, mark for retry later
        console.error('Failed to sync album note to server:', error);
        // Store failed syncs for retry
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
      // Delete from Supabase
      try {
        await albumNotesApi.deleteAlbumNote(albumId, userId);
      } catch (error) {
        console.error('Failed to delete album note from server:', error);
      }
    }
  },

  // Delete note
  delete: async (albumId, userId) => {
    const storageKey = `album_note_${userId}_${albumId}`;
    localStorage.removeItem(storageKey);
    
    try {
      await albumNotesApi.deleteAlbumNote(albumId, userId);
    } catch (error) {
      console.error('Failed to delete album note from server:', error);
    }
  },
};

// Retry failed syncs (call this periodically or on app load)
export const retryFailedSyncs = async (userId) => {
  const failedSyncs = JSON.parse(localStorage.getItem('failed_note_syncs') || '[]');
  if (failedSyncs.length === 0) return;

  const successful = [];
  const remaining = [];
  
  for (const sync of failedSyncs) {
    // Skip syncs older than 7 days
    if (Date.now() - sync.timestamp > 7 * 24 * 60 * 60 * 1000) {
      continue;
    }
    
    try {
      if (sync.type === 'track') {
        await notesApi.saveTrackNote(sync.trackId, userId, sync.content);
        successful.push(sync);
      } else if (sync.type === 'album') {
        await albumNotesApi.saveAlbumNote(sync.albumId, userId, sync.content);
        successful.push(sync);
      }
    } catch (error) {
      console.error('Retry failed for sync:', error);
      remaining.push(sync);
    }
  }

  // Update failed syncs list
  localStorage.setItem('failed_note_syncs', JSON.stringify(remaining));
  
  if (successful.length > 0) {
    console.log(`Successfully synced ${successful.length} note(s)`);
  }
};
