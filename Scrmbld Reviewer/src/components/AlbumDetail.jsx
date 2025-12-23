import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getAllAlbumTracks, makeRequest } from '../services/spotifyApi';
import { syncApi } from '../services/api';
import TrackCard from './TrackCard';
import TrackNotes from './TrackNotes';
import AlbumNotes from './AlbumNotes';
import AlbumScore from './AlbumScore';
import { extractColorsFromImage } from '../utils/colorExtractor';
import './AlbumDetail.css';

function AlbumDetail({ userId }) {
  const { albumId } = useParams();
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listened, setListened] = useState(false);
  const [scoreRefreshTrigger, setScoreRefreshTrigger] = useState(0);
  const [gradientColors, setGradientColors] = useState(null);
  const headerWrapperRef = useRef(null);

  useEffect(() => {
    if (albumId) {
      loadAlbumData();
    }
  }, [albumId]);

  // Extract colors from album image when album loads
  useEffect(() => {
    if (album?.images?.[0]?.url) {
      extractColorsFromImage(album.images[0].url).then(colors => {
        setGradientColors(colors);
        // Apply colors to CSS variables
        if (headerWrapperRef.current) {
          const element = headerWrapperRef.current;
          element.style.setProperty('--gradient-primary', colors.primaryRgba);
          element.style.setProperty('--gradient-secondary', colors.secondaryRgba);
          element.style.setProperty('--gradient-tertiary', colors.tertiaryRgba);
        }
      });
    }
  }, [album]);

  const loadAlbumData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch album info directly from Spotify API (don't rely on localStorage due to quota limits)
      let albumData = null;
      try {
        albumData = await makeRequest(`/albums/${albumId}`);
        setAlbum(albumData);
      } catch (albumError) {
        console.error('Error fetching album:', albumError);
        // Continue anyway - we can still show tracks
      }

      // Fetch tracks from Spotify
      const tracksData = await getAllAlbumTracks(albumId);
      setTracks(tracksData);

      // Sync album and tracks to database
      if (albumData) {
        try {
          await syncApi.syncAlbum(albumData, tracksData);
        } catch (syncError) {
          console.error('Error syncing album:', syncError);
          // Don't fail the whole operation if sync fails
        }
      }

      // Load listened status from localStorage
      if (userId && albumId) {
        const storageKey = `album_listened_${userId}_${albumId}`;
        const savedStatus = localStorage.getItem(storageKey);
        setListened(savedStatus === 'true');
      }
    } catch (err) {
      setError('Failed to load album data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleListenedToggle = () => {
    if (!userId || !albumId) return;

    const newListenedState = !listened;
    const storageKey = `album_listened_${userId}_${albumId}`;
    localStorage.setItem(storageKey, newListenedState.toString());
    setListened(newListenedState);
  };

  const handleRatingChange = () => {
    // Trigger score recalculation
    setScoreRefreshTrigger(prev => prev + 1);
  };

  const handleNoteChange = () => {
    // Trigger score recalculation if needed
    setScoreRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return <div className="loading-container">Loading album...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="album-detail">
      {album && (
        <div className="album-header-wrapper" ref={headerWrapperRef}>
          <div className="album-header">
            {album.images && album.images[0] && (
              <img
                src={album.images[0].url}
                alt={album.name}
                className="album-image"
              />
            )}
            <div className="album-info">
              <h1>{album.name}</h1>
              <h2>{album.artists?.map(a => a.name).join(', ')}</h2>
              {album.release_date && (
                <p className="release-date">{album.release_date} • {tracks.length} songs</p>
              )}
              {!album.release_date && (
                <p className="track-count">{tracks.length} songs</p>
              )}
              <div className="album-actions">
                <button
                  className={`listened-toggle ${listened ? 'listened' : 'not-listened'}`}
                  onClick={handleListenedToggle}
                  title={listened ? 'Mark as not listened' : 'Mark as listened'}
                >
                  {listened ? 'Listened To' : "Haven't Heard"}
                </button>
              </div>
              <AlbumScore albumId={albumId} tracks={tracks} userId={userId} refreshTrigger={scoreRefreshTrigger} />
            </div>
          </div>
        </div>
      )}

      {album && (
        <div className="album-notes-section">
          <AlbumNotes albumId={albumId} userId={userId} onNoteChange={handleNoteChange} />
        </div>
      )}

      <div className="tracks-section">
        <div className="tracks-list">
          <div className="tracks-header">
            <div className="tracks-header-number">#</div>
            <div className="tracks-header-title">Title</div>
            <div className="tracks-header-rating">Rating</div>
          </div>
          {tracks.map((track) => (
            <div key={track.id} className="track-wrapper">
              <TrackCard
                track={track}
                userId={userId}
                onSync={() => {}}
                onRatingChange={handleRatingChange}
              />
              <div className="track-detail-view">
                <TrackNotes trackId={track.id} userId={userId} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AlbumDetail;

