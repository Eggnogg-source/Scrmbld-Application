import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { makeRequest, getAllPlaylistTracks, formatDuration } from '../services/spotifyApi';
import TrackCard from './TrackCard';
import TrackNotes from './TrackNotes';
import './AlbumDetail.css';

function PlaylistDetail({ userId }) {
  const { playlistId } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPage = 20;

  useEffect(() => {
    if (playlistId) {
      loadPlaylistData();
    }
  }, [playlistId, currentPage]);

  const loadPlaylistData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch playlist info
      const playlistData = await makeRequest(`/playlists/${playlistId}`);
      setPlaylist(playlistData);

      // Fetch tracks with pagination
      const offset = (currentPage - 1) * itemsPerPage;
      const tracksData = await makeRequest(
        `/playlists/${playlistId}/tracks?limit=${itemsPerPage}&offset=${offset}`
      );
      
      // Extract track objects from the items array
      const trackItems = tracksData.items
        .map(item => item.track)
        .filter(track => track !== null && track !== undefined);
      
      setTracks(trackItems);
    } catch (err) {
      setError('Failed to load playlist data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (playlist && tracks.length === itemsPerPage) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return <div className="loading-container">Loading playlist...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  const totalPages = playlist ? Math.ceil(playlist.tracks.total / itemsPerPage) : 1;

  return (
    <div className="album-detail">
      {playlist && (
        <div className="album-header">
          {playlist.images && playlist.images[0] && (
            <img
              src={playlist.images[0].url}
              alt={playlist.name}
              className="album-image"
            />
          )}
          <div className="album-info">
            <h1>{playlist.name}</h1>
            <h2>{playlist.owner?.display_name || 'Unknown'}</h2>
            <p className="track-count">{playlist.tracks.total} tracks</p>
          </div>
        </div>
      )}

      <div className="tracks-section">
        <h2>Tracks (Page {currentPage} of {totalPages})</h2>
        <div className="tracks-list">
          {tracks.map((track, index) => (
            <div key={track.id || index} className="track-wrapper">
              <TrackCard
                track={{
                  ...track,
                  track_number: (currentPage - 1) * itemsPerPage + index + 1
                }}
                userId={userId}
                onSync={() => {}}
              />
              <div className="track-detail-view">
                <TrackNotes trackId={track.id} userId={userId} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-button"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="pagination-button"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || tracks.length < itemsPerPage}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default PlaylistDetail;

