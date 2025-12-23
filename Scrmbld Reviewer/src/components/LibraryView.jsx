import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSavedAlbums, getPlaylists, isAuthenticated, loginToSpotify } from '../services/spotifyApi';
import './LibraryView.css';

function LibraryView() {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [activeTab, setActiveTab] = useState('albums');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAlbums, setTotalAlbums] = useState(0);
  const [totalPlaylists, setTotalPlaylists] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    // #region agent log
    const isAuth = isAuthenticated();
    fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LibraryView.jsx:14',message:'LibraryView useEffect',data:{isAuthenticated:isAuth,activeTab:activeTab,currentPage:currentPage},timestamp:Date.now(),sessionId:'debug-session',runId:'pagination',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    if (isAuth) {
      loadLibrary();
    }
  }, [activeTab, currentPage]);

  // Reset to page 1 when switching tabs
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
  }, [activeTab]);

  useEffect(() => {
    // Reset to page 1 when search query changes
    if (searchQuery !== '') {
      setCurrentPage(1);
    }
  }, [searchQuery]);

  const loadLibrary = async () => {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LibraryView.jsx:30',message:'loadLibrary started',data:{activeTab:activeTab,currentPage:currentPage,searchQuery:searchQuery},timestamp:Date.now(),sessionId:'debug-session',runId:'pagination',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      setLoading(true);
      setError(null);

      const offset = (currentPage - 1) * itemsPerPage;
      
      // #region agent log
      const startTime = Date.now();
      fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LibraryView.jsx:38',message:'Starting paginated API call',data:{offset:offset,limit:itemsPerPage,tab:activeTab},timestamp:Date.now(),sessionId:'debug-session',runId:'pagination',hypothesisId:'G'})}).catch(()=>{});
      // #endregion

      let data, total;
      if (activeTab === 'albums') {
        const response = await getSavedAlbums(itemsPerPage, offset);
        data = response.items;
        total = response.total;
      } else {
        const response = await getPlaylists(itemsPerPage, offset);
        data = response.items;
        total = response.total;
      }

      // #region agent log
      const endTime = Date.now();
      fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LibraryView.jsx:50',message:'Paginated API call completed',data:{itemsCount:data?.length||0,total:total,duration:endTime-startTime,page:currentPage},timestamp:Date.now(),sessionId:'debug-session',runId:'pagination',hypothesisId:'G'})}).catch(()=>{});
      // #endregion

      if (activeTab === 'albums') {
        setAlbums(data);
        setTotalAlbums(total);
      } else {
        setPlaylists(data);
        setTotalPlaylists(total);
      }
      
      setTotalPages(Math.ceil(total / itemsPerPage));
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LibraryView.jsx:62',message:'loadLibrary error',data:{error:err.message,errorName:err.name,errorStack:err.stack?.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'pagination',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      setError('Failed to load library');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    loginToSpotify();
  };

  const handleAlbumClick = (albumId) => {
    navigate(`/album/${albumId}`);
  };

  const handlePlaylistClick = (playlistId) => {
    navigate(`/playlist/${playlistId}`);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const filterItems = (items) => {
    if (!searchQuery.trim()) {
      return items;
    }
    const query = searchQuery.toLowerCase();
    if (activeTab === 'albums') {
      return items.filter(album => 
        album.name.toLowerCase().includes(query) ||
        album.artists?.some(artist => artist.name.toLowerCase().includes(query))
      );
    } else {
      return items.filter(playlist => 
        playlist.name.toLowerCase().includes(query)
      );
    }
  };

  if (!isAuthenticated()) {
    return (
      <div className="login-prompt">
        <h1>Scrmbld Reviewer</h1>
        <p>Connect your Spotify account to start reviewing your music</p>
        <button className="login-button" onClick={handleLogin}>
          Login with Spotify
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="loading-container">Loading your library...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={loadLibrary}>Try Again</button>
      </div>
    );
  }

  const displayedItems = filterItems(activeTab === 'albums' ? albums : playlists);

  return (
    <div className="library-view">
      <div className="library-header">
        <h1>Your Library</h1>
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'albums' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('albums');
              setCurrentPage(1);
            }}
          >
            Albums ({loading && activeTab !== 'albums' ? '...' : totalAlbums})
          </button>
          <button
            className={`tab ${activeTab === 'playlists' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('playlists');
              setCurrentPage(1);
            }}
          >
            Playlists ({loading && activeTab !== 'playlists' ? '...' : totalPlaylists})
          </button>
        </div>
      </div>

      <div className="search-bar-container">
        <input
          type="text"
          className="search-input"
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      <div className="library-content">
        {activeTab === 'albums' ? (
          <div className="albums-grid">
            {displayedItems.map((album) => (
              <div
                key={album.id}
                className="album-card"
                onClick={() => handleAlbumClick(album.id)}
              >
                {album.images && album.images[0] && (
                  <img
                    src={album.images[0].url}
                    alt={album.name}
                    className="album-cover"
                  />
                )}
                <div className="album-card-info">
                  <h3>{album.name}</h3>
                  <p>{album.artists?.map(a => a.name).join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="playlists-grid">
            {displayedItems.map((playlist) => (
              <div
                key={playlist.id}
                className="playlist-card"
                onClick={() => handlePlaylistClick(playlist.id)}
              >
                {playlist.images && playlist.images[0] && (
                  <img
                    src={playlist.images[0].url}
                    alt={playlist.name}
                    className="playlist-cover"
                  />
                )}
                <div className="playlist-card-info">
                  <h3>{playlist.name}</h3>
                  <p>{playlist.tracks?.total || 0} tracks</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!searchQuery && totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-button"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages} ({activeTab === 'albums' ? totalAlbums : totalPlaylists} total)
          </span>
          <button
            className="pagination-button"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {searchQuery && displayedItems.length === 0 && (
        <div className="no-results">
          <p>No {activeTab} found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}

export default LibraryView;

