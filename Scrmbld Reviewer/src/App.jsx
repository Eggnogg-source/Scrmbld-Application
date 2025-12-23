import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getAccessToken, getCurrentUser, isAuthenticated } from './services/spotifyApi';
import { userApi } from './services/api';
import { retryFailedSyncs } from './services/notesSync';
import LibraryView from './components/LibraryView';
import AlbumDetail from './components/AlbumDetail';
import PlaylistDetail from './components/PlaylistDetail';
import Callback from './components/Callback';
import './App.css';

function App() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      if (isAuthenticated()) {
        const user = await getCurrentUser();
        // Sync user with database and use Spotify ID as userId
        try {
          await userApi.syncUser(user.id, user.display_name, user.email);
        } catch (syncError) {
          console.error('Error syncing user:', syncError);
          // Continue anyway - user can still use the app
        }
        // Use Spotify ID as userId - backend will handle conversion
        setUserId(user.id);
        
        // Retry any failed note syncs in the background
        retryFailedSyncs(user.id).catch(err => {
          console.error('Error retrying failed syncs:', err);
        });
      }
    } catch (error) {
      console.error('Error initializing user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/callback" element={<Callback onAuthSuccess={initializeUser} />} />
          <Route path="/album/:albumId" element={<AlbumDetail userId={userId} />} />
          <Route path="/playlist/:playlistId" element={<PlaylistDetail userId={userId} />} />
          <Route path="/" element={<LibraryView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
