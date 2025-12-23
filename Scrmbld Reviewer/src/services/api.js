import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Reviews API
export const reviewsApi = {
  // Get reviews for a track
  getTrackReviews: async (trackId, spotifyUserId = null) => {
    const params = spotifyUserId ? { spotifyUserId } : {};
    const response = await api.get(`/tracks/${trackId}/reviews`, { params });
    return response.data;
  },

  // Create a review
  createReview: async (trackId, spotifyUserId, content) => {
    const response = await api.post(`/tracks/${trackId}/reviews`, {
      spotifyUserId,
      content,
    });
    return response.data;
  },

  // Update a review
  updateReview: async (reviewId, spotifyUserId, content) => {
    const response = await api.put(`/reviews/${reviewId}`, {
      spotifyUserId,
      content,
    });
    return response.data;
  },

  // Delete a review
  deleteReview: async (reviewId, userId = null) => {
    const params = userId ? { userId } : {};
    const response = await api.delete(`/reviews/${reviewId}`, { params });
    return response.data;
  },
};

// Ratings API
export const ratingsApi = {
  // Get rating for a track
  getTrackRating: async (trackId, spotifyUserId = null) => {
    const params = spotifyUserId ? { spotifyUserId } : {};
    const response = await api.get(`/tracks/${trackId}/ratings`, { params });
    return response.data;
  },

  // Create/update rating
  setRating: async (trackId, spotifyUserId, rating) => {
    const response = await api.post(`/tracks/${trackId}/ratings`, {
      spotifyUserId,
      rating,
    });
    return response.data;
  },
};

// Notes API (personal notes for tracks)
export const notesApi = {
  // Get note for a track (user's personal note)
  getTrackNote: async (trackId, spotifyUserId) => {
    const params = { spotifyUserId };
    const response = await api.get(`/tracks/${trackId}/notes`, { params });
    return response.data;
  },

  // Save note for a track (creates or updates)
  saveTrackNote: async (trackId, spotifyUserId, content) => {
    const response = await api.post(`/tracks/${trackId}/notes`, {
      spotifyUserId,
      content,
    });
    return response.data;
  },

  // Delete note for a track
  deleteTrackNote: async (trackId, spotifyUserId) => {
    const params = { spotifyUserId };
    const response = await api.delete(`/tracks/${trackId}/notes`, { params });
    return response.data;
  },
};

// User API
export const userApi = {
  // Sync user from Spotify ID
  syncUser: async (spotifyId, displayName = null, email = null) => {
    const response = await api.post('/users/sync', {
      spotifyId,
      displayName,
      email,
    });
    return response.data;
  },
};

// Album Notes API
export const albumNotesApi = {
  // Get note for an album (user's personal note)
  getAlbumNote: async (albumId, spotifyUserId) => {
    const params = { spotifyUserId };
    const response = await api.get(`/albums/${albumId}/notes`, { params });
    return response.data;
  },

  // Save note for an album (creates or updates)
  saveAlbumNote: async (albumId, spotifyUserId, content) => {
    const response = await api.post(`/albums/${albumId}/notes`, {
      spotifyUserId,
      content,
    });
    return response.data;
  },

  // Toggle lock status for album note
  toggleLock: async (albumId, spotifyUserId, isLocked) => {
    const response = await api.put(`/albums/${albumId}/notes/lock`, {
      spotifyUserId,
      isLocked,
    });
    return response.data;
  },

  // Delete note for an album
  deleteAlbumNote: async (albumId, spotifyUserId) => {
    const params = { spotifyUserId };
    const response = await api.delete(`/albums/${albumId}/notes`, { params });
    return response.data;
  },
};

// Album Listened API
export const albumListenedApi = {
  // Get listened status for an album
  getListenedStatus: async (albumId, spotifyUserId) => {
    const params = { spotifyUserId };
    const response = await api.get(`/albums/${albumId}/listened`, { params });
    return response.data;
  },

  // Toggle listened status for an album
  setListened: async (albumId, spotifyUserId, listened) => {
    const response = await api.put(`/albums/${albumId}/listened`, {
      spotifyUserId,
      listened,
    });
    return response.data;
  },
};

// Sync API
export const syncApi = {
  // Sync album and tracks from Spotify
  syncAlbum: async (album, tracks) => {
    const response = await api.post('/albums/sync', {
      album,
      tracks,
    });
    return response.data;
  },
};

export default api;

