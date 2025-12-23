// Spotify API service for OAuth and data fetching

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
// #region agent log
const getRedirectURI = () => {
  const hostname = window.location.hostname;
  const port = window.location.port || '5173';
  // Always use 127.0.0.1 for local development (Spotify requirement - localhost not allowed)
  // Check if we're in local development (localhost or 127.0.0.1)
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  const redirectURI = isLocal 
    ? `http://127.0.0.1:${port}/callback`
    : `${window.location.origin}/callback`;
  fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'spotifyApi.js:6',message:'Redirect URI construction',data:{hostname:hostname,port:port,isLocal:isLocal,redirectURI:redirectURI,fullOrigin:window.location.origin},timestamp:Date.now(),sessionId:'debug-session',runId:'fix-v2',hypothesisId:'A'})}).catch(()=>{});
  return redirectURI;
};
// Compute redirect URI dynamically each time to ensure fresh value
const getRedirectURIValue = () => getRedirectURI();
const REDIRECT_URI = getRedirectURI();
// #endregion
const SCOPES = [
  'user-library-read',
  'user-library-modify',
  'playlist-read-private',
  'playlist-read-collaborative',
];

// Generate random string for state parameter
function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Generate code verifier and challenge for PKCE
async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Initialize Spotify OAuth login
export async function loginToSpotify() {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  // Store code verifier for later use
  localStorage.setItem('code_verifier', codeVerifier);

  const state = generateRandomString(16);
  localStorage.setItem('spotify_auth_state', state);

  // Get fresh redirect URI value
  const currentRedirectURI = getRedirectURIValue();
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES.join(' '),
    redirect_uri: currentRedirectURI,
    state: state,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  // #region agent log
  const authURL = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
  fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'spotifyApi.js:49',message:'OAuth authorization request',data:{redirectURI:currentRedirectURI,clientId:CLIENT_ID,hasCodeChallenge:!!codeChallenge,authURL:authURL.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'fix-v2',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  window.location.href = authURL;
}

// Exchange authorization code for access token
export async function getAccessToken(code) {
  const codeVerifier = localStorage.getItem('code_verifier');
  
  if (!codeVerifier) {
    throw new Error('Code verifier not found');
  }

  // Get fresh redirect URI value for token exchange
  const currentRedirectURI = getRedirectURIValue();
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'spotifyApi.js:75',message:'Token exchange request - before fetch',data:{redirectURI:currentRedirectURI,hasCode:!!code,codeLength:code?.length,hasCodeVerifier:!!codeVerifier},timestamp:Date.now(),sessionId:'debug-session',runId:'fix-v2',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: currentRedirectURI,
      code_verifier: codeVerifier,
    }),
  });

  // #region agent log
  const responseText = await response.text();
  let responseData;
  try {
    responseData = JSON.parse(responseText);
  } catch {
    responseData = { raw: responseText.substring(0, 200) };
  }
  fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'spotifyApi.js:110',message:'Token exchange response',data:{status:response.status,statusText:response.statusText,ok:response.ok,responseData:responseData,redirectURI:currentRedirectURI},timestamp:Date.now(),sessionId:'debug-session',runId:'fix-v2',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
  }

  const data = responseData;
  localStorage.setItem('spotify_access_token', data.access_token);
  localStorage.setItem('spotify_refresh_token', data.refresh_token);
  localStorage.removeItem('code_verifier');
  
  return data;
}

// Refresh access token
export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('spotify_refresh_token');
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  const data = await response.json();
  localStorage.setItem('spotify_access_token', data.access_token);
  if (data.refresh_token) {
    localStorage.setItem('spotify_refresh_token', data.refresh_token);
  }
  
  return data;
}

// Get access token from storage
export function getStoredAccessToken() {
  return localStorage.getItem('spotify_access_token');
}

// Check if user is authenticated
export function isAuthenticated() {
  return !!getStoredAccessToken();
}

// Logout
export function logout() {
  localStorage.removeItem('spotify_access_token');
  localStorage.removeItem('spotify_refresh_token');
  localStorage.removeItem('spotify_user');
}

// Make authenticated API request
export async function makeRequest(endpoint, options = {}) {
  let token = getStoredAccessToken();
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'spotifyApi.js:143',message:'makeRequest called',data:{endpoint:endpoint,hasToken:!!token,tokenLength:token?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'loading-debug',hypothesisId:'K'})}).catch(()=>{});
  // #endregion
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Token expired, try to refresh
    await refreshAccessToken();
    token = getStoredAccessToken();
    
    const retryResponse = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!retryResponse.ok) {
      throw new Error('Failed to refresh token');
    }
    
    return retryResponse.json();
  }

  if (!response.ok) {
    // #region agent log
    const errorText = await response.text();
    fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'spotifyApi.js:222',message:'makeRequest API error',data:{status:response.status,statusText:response.statusText,endpoint:endpoint,errorText:errorText.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'loading-debug',hypothesisId:'K'})}).catch(()=>{});
    // #endregion
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'spotifyApi.js:228',message:'makeRequest success',data:{endpoint:endpoint,status:response.status,hasItems:!!result.items,itemsCount:result.items?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'loading-debug',hypothesisId:'K'})}).catch(()=>{});
  // #endregion
  return result;
}

// Get current user profile
export async function getCurrentUser() {
  const user = await makeRequest('/me');
  localStorage.setItem('spotify_user', JSON.stringify(user));
  return user;
}

// Get user's saved albums (paginated)
export async function getSavedAlbums(limit = 50, offset = 0) {
  const data = await makeRequest(`/me/albums?limit=${limit}&offset=${offset}`);
  return {
    items: data.items.map(item => item.album),
    total: data.total,
    limit: data.limit,
    offset: data.offset
  };
}

// Get all saved albums (handles pagination)
export async function getAllSavedAlbums() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'spotifyApi.js:243',message:'getAllSavedAlbums started',data:{hasToken:!!getStoredAccessToken()},timestamp:Date.now(),sessionId:'debug-session',runId:'loading-debug',hypothesisId:'I'})}).catch(()=>{});
  // #endregion
  let allAlbums = [];
  let offset = 0;
  const limit = 50;
  let hasMore = true;
  let pageCount = 0;

  try {
    while (hasMore) {
      pageCount++;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'spotifyApi.js:250',message:'getAllSavedAlbums page request',data:{page:pageCount,offset:offset,limit:limit},timestamp:Date.now(),sessionId:'debug-session',runId:'loading-debug',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      const data = await makeRequest(`/me/albums?limit=${limit}&offset=${offset}`);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'spotifyApi.js:253',message:'getAllSavedAlbums page response',data:{page:pageCount,itemsCount:data.items?.length||0,total:data.total,hasNext:!!data.next,currentTotal:allAlbums.length},timestamp:Date.now(),sessionId:'debug-session',runId:'loading-debug',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      allAlbums = [...allAlbums, ...data.items.map(item => item.album)];
      hasMore = data.next !== null;
      offset += limit;
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'spotifyApi.js:259',message:'getAllSavedAlbums completed',data:{totalAlbums:allAlbums.length,pages:pageCount},timestamp:Date.now(),sessionId:'debug-session',runId:'loading-debug',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'spotifyApi.js:262',message:'getAllSavedAlbums error',data:{error:err.message,errorName:err.name,albumsSoFar:allAlbums.length},timestamp:Date.now(),sessionId:'debug-session',runId:'loading-debug',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    throw err;
  }

  return allAlbums;
}

// Get user's playlists (paginated)
export async function getPlaylists(limit = 50, offset = 0) {
  const data = await makeRequest(`/me/playlists?limit=${limit}&offset=${offset}`);
  return {
    items: data.items,
    total: data.total,
    limit: data.limit,
    offset: data.offset
  };
}

// Get all playlists (handles pagination)
export async function getAllPlaylists() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'spotifyApi.js:287',message:'getAllPlaylists started',data:{hasToken:!!getStoredAccessToken()},timestamp:Date.now(),sessionId:'debug-session',runId:'loading-debug',hypothesisId:'J'})}).catch(()=>{});
  // #endregion
  let allPlaylists = [];
  let offset = 0;
  const limit = 50;
  let hasMore = true;
  let pageCount = 0;

  try {
    while (hasMore) {
      pageCount++;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'spotifyApi.js:293',message:'getAllPlaylists page request',data:{page:pageCount,offset:offset,limit:limit},timestamp:Date.now(),sessionId:'debug-session',runId:'loading-debug',hypothesisId:'J'})}).catch(()=>{});
      // #endregion
      const data = await makeRequest(`/me/playlists?limit=${limit}&offset=${offset}`);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'spotifyApi.js:296',message:'getAllPlaylists page response',data:{page:pageCount,itemsCount:data.items?.length||0,total:data.total,hasNext:!!data.next,currentTotal:allPlaylists.length},timestamp:Date.now(),sessionId:'debug-session',runId:'loading-debug',hypothesisId:'J'})}).catch(()=>{});
      // #endregion
      allPlaylists = [...allPlaylists, ...data.items];
      hasMore = data.next !== null;
      offset += limit;
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'spotifyApi.js:303',message:'getAllPlaylists completed',data:{totalPlaylists:allPlaylists.length,pages:pageCount},timestamp:Date.now(),sessionId:'debug-session',runId:'loading-debug',hypothesisId:'J'})}).catch(()=>{});
    // #endregion
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'spotifyApi.js:306',message:'getAllPlaylists error',data:{error:err.message,errorName:err.name,playlistsSoFar:allPlaylists.length},timestamp:Date.now(),sessionId:'debug-session',runId:'loading-debug',hypothesisId:'J'})}).catch(()=>{});
    // #endregion
    throw err;
  }

  return allPlaylists;
}

// Get album tracks
export async function getAlbumTracks(albumId, limit = 50, offset = 0) {
  const data = await makeRequest(`/albums/${albumId}/tracks?limit=${limit}&offset=${offset}`);
  return data.items;
}

// Get all album tracks (handles pagination)
export async function getAllAlbumTracks(albumId) {
  let allTracks = [];
  let offset = 0;
  const limit = 50;
  let hasMore = true;

  while (hasMore) {
    const data = await makeRequest(`/albums/${albumId}/tracks?limit=${limit}&offset=${offset}`);
    allTracks = [...allTracks, ...data.items];
    hasMore = data.next !== null;
    offset += limit;
  }

  return allTracks;
}

// Get playlist tracks
export async function getPlaylistTracks(playlistId, limit = 50, offset = 0) {
  const data = await makeRequest(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`);
  return data.items.map(item => item.track).filter(track => track !== null);
}

// Get all playlist tracks (handles pagination)
export async function getAllPlaylistTracks(playlistId) {
  let allTracks = [];
  let offset = 0;
  const limit = 50;
  let hasMore = true;

  while (hasMore) {
    const data = await makeRequest(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`);
    const tracks = data.items.map(item => item.track).filter(track => track !== null);
    allTracks = [...allTracks, ...tracks];
    hasMore = data.next !== null;
    offset += limit;
  }

  return allTracks;
}

// Format duration from milliseconds to MM:SS
export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

